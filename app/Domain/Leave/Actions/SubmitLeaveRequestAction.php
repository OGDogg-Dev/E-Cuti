<?php

namespace App\Domain\Leave\Actions;

use App\Domain\Leave\DataTransferObjects\LeaveRequestData;
use App\Domain\Leave\Exceptions\ThresholdViolationException;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveRequestWorkflowService;
use App\Services\Leave\ThresholdEvaluator;
use Illuminate\Support\Facades\DB;

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
            $leaveRequest = LeaveRequest::create($data->toModelAttributes());

            $policy = LeavePolicy::query()->findOrFail($data->policyId);

            if ($this->thresholdEvaluator->violatesThreshold($leaveRequest)) {
                $suggestedDates = $this->suggestAlternativeDates($leaveRequest);

                throw ThresholdViolationException::withSuggestion($suggestedDates);
            }

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

