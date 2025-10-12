<?php

namespace App\Services\Leave;

use App\Enums\ApprovalFlowType;
use App\Enums\LeaveRequestStatus;
use App\Enums\SignatureStatus;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestApproval;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveRequestWorkflowService
{
    public function __construct(
        private readonly WorkingDayCalculator $workingDayCalculator,
        private readonly LeaveBalanceService $leaveBalanceService
    ) {
    }

    public function submit(LeaveRequest $leaveRequest, LeavePolicy $policy): LeaveRequest
    {
        $leaveRequest->duration = $this->workingDayCalculator->calculateDuration(
            $leaveRequest->start_date,
            $leaveRequest->end_date
        );

        if (! $this->leaveBalanceService->ensureSufficientBalance($leaveRequest->user_id, $leaveRequest->leave_type_id, $leaveRequest->durationInDays())) {
            throw new \RuntimeException('Saldo cuti tidak mencukupi.');
        }

        $leaveRequest->status = $policy->flow_type === ApprovalFlowType::PARALLEL_AND
            ? LeaveRequestStatus::WAITING_APPROVAL_BOTH
            : LeaveRequestStatus::WAITING_APPROVAL_KEPALA;
        $leaveRequest->submitted_at = Carbon::now();
        $leaveRequest->save();

        $this->seedApprovalStages($leaveRequest, $policy);

        return $leaveRequest;
    }

    public function recordDecision(LeaveRequest $leaveRequest, int $approverId, string $stage, string $action, ?string $notes = null): void
    {
        DB::transaction(function () use ($leaveRequest, $approverId, $stage, $action, $notes) {
            $approval = LeaveRequestApproval::query()
                ->where('leave_request_id', $leaveRequest->id)
                ->where('stage', $stage)
                ->whereNull('acted_at')
                ->firstOrFail();

            $approval->update([
                'approver_id' => $approverId,
                'acted_at' => Carbon::now(),
                'action' => $action,
                'notes' => $notes,
            ]);

            if ($action === 'REJECT') {
                $leaveRequest->status = LeaveRequestStatus::REJECTED;
                $leaveRequest->save();

                return;
            }

            $this->advanceWorkflow($leaveRequest);
        });
    }

    public function finalize(LeaveRequest $leaveRequest): void
    {
        DB::transaction(function () use ($leaveRequest) {
            $this->leaveBalanceService->applyFinalization($leaveRequest);
            $leaveRequest->status = LeaveRequestStatus::FINALIZED;
            $leaveRequest->finalized_at = Carbon::now();
            $leaveRequest->document_number = $this->generateDocumentNumber($leaveRequest);
            $leaveRequest->qr_hash = hash('sha256', $leaveRequest->id.'|'.$leaveRequest->document_number);
            $leaveRequest->signature_status = SignatureStatus::PENDING;
            $leaveRequest->save();
        });
    }

    public function determineServiceLevelColor(LeaveRequest $leaveRequest): string
    {
        $policy = LeavePolicy::query()->where('leave_type_id', $leaveRequest->leave_type_id)
            ->where(fn ($query) => $query->whereNull('division_id')->orWhere('division_id', $leaveRequest->division_id))
            ->orderByDesc('division_id')
            ->first();

        if (! $policy) {
            return 'GREEN';
        }

        $rules = collect($policy->threshold_rules ?? []);
        $stage = $leaveRequest->status->value;
        $rule = $rules->firstWhere('stage', $stage);

        return $rule['indicator'] ?? 'GREEN';
    }

    public function suggestAlternativeDates(Carbon $start, Carbon $end, callable $validator): ?array
    {
        return $this->workingDayCalculator->suggestAlternativeDates($start, $end, $validator);
    }

    private function seedApprovalStages(LeaveRequest $leaveRequest, LeavePolicy $policy): void
    {
        $matrix = collect($policy->approval_matrix);
        $stages = $policy->flow_type === ApprovalFlowType::PARALLEL_AND
            ? $matrix->flatten(1)->unique('stage')
            : $matrix;

        $stages->each(function ($stageConfig) use ($leaveRequest) {
            LeaveRequestApproval::create([
                'leave_request_id' => $leaveRequest->id,
                'approver_id' => null,
                'stage' => Arr::get($stageConfig, 'stage'),
                'assigned_at' => Carbon::now(),
                'sla_snapshot' => Arr::get($stageConfig, 'sla'),
            ]);
        });
    }

    private function advanceWorkflow(LeaveRequest $leaveRequest): void
    {
        $pendingApprovals = $leaveRequest->approvals()->whereNull('acted_at')->get();
        if ($pendingApprovals->isNotEmpty()) {
            if ($leaveRequest->status === LeaveRequestStatus::WAITING_APPROVAL_KEPALA) {
                $leaveRequest->status = LeaveRequestStatus::WAITING_APPROVAL_SDM;
            }

            $leaveRequest->save();

            return;
        }

        $leaveRequest->status = LeaveRequestStatus::APPROVED;
        $leaveRequest->save();
    }

    private function generateDocumentNumber(LeaveRequest $leaveRequest): string
    {
        $sequence = str_pad((string) $leaveRequest->id, 4, '0', STR_PAD_LEFT);
        $divisionCode = optional($leaveRequest->division)->code ?? 'GEN';
        $monthRoman = $this->toRoman((int) $leaveRequest->start_date->format('m'));
        $year = $leaveRequest->start_date->format('Y');

        return "SPC/{$divisionCode}/{$sequence}/{$monthRoman}/{$year}";
    }

    private function toRoman(int $number): string
    {
        $map = [
            'M' => 1000,
            'CM' => 900,
            'D' => 500,
            'CD' => 400,
            'C' => 100,
            'XC' => 90,
            'L' => 50,
            'XL' => 40,
            'X' => 10,
            'IX' => 9,
            'V' => 5,
            'IV' => 4,
            'I' => 1,
        ];

        $result = '';
        foreach ($map as $roman => $value) {
            while ($number >= $value) {
                $result .= $roman;
                $number -= $value;
            }
        }

        return $result;
    }
}
