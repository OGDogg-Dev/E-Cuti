<?php

namespace App\Domain\Leave\Actions;

use App\Domain\Leave\DataTransferObjects\LeaveRequestData;
use App\Domain\Leave\Exceptions\ThresholdViolationException;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveRequestWorkflowService;
use App\Services\Leave\ThresholdEvaluator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitLeaveRequestAction
{
    public function __construct(
        private readonly LeaveRequestWorkflowService $workflowService,
        private readonly ThresholdEvaluator $thresholdEvaluator,
    ) {
    }

    public function execute(LeaveRequestData $data): LeaveRequest
    {
        return DB::transaction(function () use ($data) {
            $policy = $this->resolvePolicy($data);

            $leaveRequest = new LeaveRequest($data->toModelAttributes());

            if ($this->thresholdEvaluator->violatesThreshold($leaveRequest)) {
                $suggestedDates = $this->suggestAlternativeDates($leaveRequest);

                throw ThresholdViolationException::withSuggestion($suggestedDates);
            }

            $leaveRequest->save();

            if ($data->attachment) {
                $file = $data->attachment;
                $path = $file->store('leave-attachments');

                $leaveRequest->attachments()->create([
                    'filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'storage_path' => $path,
                ]);
            }

            $this->workflowService->submit($leaveRequest, $policy);

            return $leaveRequest->load(['leaveType', 'division', 'attachments']);
        });
    }

    private function resolvePolicy(LeaveRequestData $data): LeavePolicy
    {
        $policy = LeavePolicy::query()
            ->whereKey($data->policyId)
            ->where('leave_type_id', $data->leaveTypeId)
            ->where(function ($query) use ($data) {
                $query->whereNull('division_id')
                    ->orWhere('division_id', $data->user->division_id);
            })
            ->first();

        if (! $policy) {
            throw ValidationException::withMessages([
                'policy_id' => 'Kebijakan cuti tidak berlaku untuk pegawai ini.',
            ]);
        }

        return $policy;
    }

    private function suggestAlternativeDates(LeaveRequest $leaveRequest): ?array
    {
        $candidate = $this->workflowService->suggestAlternativeDates(
            $leaveRequest->start_date,
            $leaveRequest->end_date,
            function ($candidateStart, $candidateEnd) use ($leaveRequest) {
                $clone = $leaveRequest->replicate();
                $clone->start_date = $candidateStart;
                $clone->end_date = $candidateEnd;

                return ! $this->thresholdEvaluator->violatesThreshold($clone);
            }
        );

        if (! $candidate) {
            return null;
        }

        return [
            'start_date' => $candidate[0]->toDateString(),
            'end_date' => $candidate[1]->toDateString(),
        ];
    }
}

