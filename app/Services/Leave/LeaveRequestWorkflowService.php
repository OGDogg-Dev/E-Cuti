<?php

namespace App\Services\Leave;

use App\Enums\ApprovalFlowType;
use App\Enums\LeaveRequestStatus;
use App\Enums\SignatureStatus;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Models\LeaveRequestApproval;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
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

        $leaveRequest->status = $this->determineInitialStatus($policy);
        $leaveRequest->submitted_at = Carbon::now();
        $leaveRequest->save();

        $this->seedApprovalStages($leaveRequest, $policy);

        return $leaveRequest;
    }

    public function recordDecision(LeaveRequest $leaveRequest, User $user, string $stage, string $action, ?string $notes = null): void
    {
        if (! $this->userCanProcessStage($user, $leaveRequest, $stage)) {
            throw new AuthorizationException('Anda tidak memiliki akses untuk tahap persetujuan ini.');
        }

        DB::transaction(function () use ($leaveRequest, $user, $stage, $action, $notes) {
            $approval = LeaveRequestApproval::query()
                ->where('leave_request_id', $leaveRequest->id)
                ->where('stage', $stage)
                ->whereNull('acted_at')
                ->lockForUpdate()
                ->firstOrFail();

            $approval->update([
                'approver_id' => $user->getKey(),
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
        $policy = $this->resolvePolicyFor($leaveRequest);

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

    public function allowedStagesFor(User $user): array
    {
        $user->loadMissing('roles');

        $roles = $user->roles->pluck('name')->all();

        if ($roles === []) {
            return [];
        }

        return LeavePolicy::query()
            ->get(['approval_matrix'])
            ->flatMap(function (LeavePolicy $policy) use ($roles) {
                return collect($policy->approval_matrix ?? [])
                    ->filter(function ($stageConfig) use ($roles) {
                        $primary = Arr::get($stageConfig, 'role');
                        $fallback = Arr::get($stageConfig, 'fallback_role');

                        return in_array($primary, $roles, true) || in_array($fallback, $roles, true);
                    })
                    ->pluck('stage');
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function allowedStatusesFor(User $user): array
    {
        $user->loadMissing('roles');

        if ($user->roles->isEmpty()) {
            return [];
        }

        $roleNames = $user->roles->pluck('name');

        return LeavePolicy::query()
            ->get(['approval_matrix', 'flow_type'])
            ->flatMap(function (LeavePolicy $policy) use ($roleNames) {
                $matrix = collect($policy->approval_matrix ?? []);

                if ($matrix->isEmpty()) {
                    return [];
                }

                if ($policy->flow_type === ApprovalFlowType::PARALLEL_AND) {
                    $stageRoles = $matrix
                        ->flatMap(fn ($stageConfig) => $this->resolveStageRoles($stageConfig))
                        ->unique();

                    if ($roleNames->intersect($stageRoles)->isNotEmpty()) {
                        return [LeaveRequestStatus::WAITING_APPROVAL_BOTH->value];
                    }

                    return [];
                }

                return $matrix->flatMap(function ($stageConfig) use ($roleNames, $policy) {
                    $stageRoles = $this->resolveStageRoles($stageConfig);

                    if ($roleNames->intersect($stageRoles)->isEmpty()) {
                        return [];
                    }

                    $primaryRole = Arr::get($stageConfig, 'role') ?? Arr::get($stageConfig, 'fallback_role');

                    if (! $primaryRole) {
                        return [];
                    }

                    return [$this->statusForRole($primaryRole, $policy->flow_type)->value];
                });
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    public function userCanProcessStage(User $user, LeaveRequest $leaveRequest, string $stage): bool
    {
        $policy = $this->resolvePolicyFor($leaveRequest);

        if (! $policy) {
            return false;
        }

        $stageConfig = $this->resolveStageConfig($policy, $stage);

        if (! $stageConfig) {
            return false;
        }

        $allowedRoles = $this->resolveStageRoles($stageConfig);

        if ($allowedRoles === []) {
            return false;
        }

        if (! $user->hasAnyRole($allowedRoles)) {
            return false;
        }

        $pendingApprovalQuery = $leaveRequest->approvals()
            ->where('stage', $stage)
            ->whereNull('acted_at')
            ->where(function ($query) use ($user) {
                $query->whereNull('approver_id')
                    ->orWhere('approver_id', $user->getKey());
            });

        if (! $pendingApprovalQuery->exists()) {
            return false;
        }

        if ($policy->flow_type === ApprovalFlowType::SERIAL) {
            $matrix = collect($policy->approval_matrix ?? []);
            $stageIndex = $matrix->search(fn ($config) => Arr::get($config, 'stage') === $stage);

            if ($stageIndex === false) {
                return false;
            }

            $previousStages = $matrix
                ->take($stageIndex)
                ->reject(function ($previousConfig) use ($stageConfig) {
                    return $this->stageHasRole($stageConfig, 'sdm')
                        && $this->stageHasRole($previousConfig, 'kepala_kantor');
                })
                ->pluck('stage')
                ->filter()
                ->all();

            if ($previousStages !== [] && $leaveRequest->approvals()
                ->whereIn('stage', $previousStages)
                ->whereNull('acted_at')
                ->exists()) {
                return false;
            }

            if ($this->stageHasRole($stageConfig, 'kepala_kantor')) {
                $hrStages = $matrix
                    ->filter(fn ($config) => $this->stageHasRole($config, 'sdm'))
                    ->pluck('stage')
                    ->filter()
                    ->all();

                if ($hrStages !== [] && $leaveRequest->approvals()
                    ->whereIn('stage', $hrStages)
                    ->whereNull('acted_at')
                    ->exists()) {
                    return false;
                }
            }
        }

        return true;
    }

    private function determineInitialStatus(LeavePolicy $policy): LeaveRequestStatus
    {
        if ($policy->flow_type === ApprovalFlowType::PARALLEL_AND) {
            return LeaveRequestStatus::WAITING_APPROVAL_BOTH;
        }

        $matrix = collect($policy->approval_matrix ?? []);

        if ($matrix->isEmpty()) {
            return LeaveRequestStatus::WAITING_APPROVAL_KEPALA;
        }

        $firstStage = $matrix->first(function ($stageConfig) {
            return Arr::get($stageConfig, 'role') || Arr::get($stageConfig, 'fallback_role');
        }) ?? $matrix->first();

        $primaryRole = Arr::get($firstStage, 'role') ?? Arr::get($firstStage, 'fallback_role');

        if (! $primaryRole) {
            return LeaveRequestStatus::WAITING_APPROVAL_KEPALA;
        }

        return $this->statusForRole($primaryRole, $policy->flow_type);
    }

    private function statusForRole(?string $role, ApprovalFlowType $flowType): LeaveRequestStatus
    {
        if ($flowType === ApprovalFlowType::PARALLEL_AND) {
            return LeaveRequestStatus::WAITING_APPROVAL_BOTH;
        }

        return match ($role) {
            'sdm', 'admin' => LeaveRequestStatus::WAITING_APPROVAL_SDM,
            'kepala_kantor' => LeaveRequestStatus::WAITING_APPROVAL_KEPALA,
            default => LeaveRequestStatus::WAITING_APPROVAL_BOTH,
        };
    }

    private function resolveStageConfig(LeavePolicy $policy, string $stage): ?array
    {
        return collect($policy->approval_matrix ?? [])->firstWhere('stage', $stage);
    }

    private function resolvePrimaryRoleForStage(LeavePolicy $policy, string $stage): ?string
    {
        $stageConfig = $this->resolveStageConfig($policy, $stage);

        if (! $stageConfig) {
            return null;
        }

        return Arr::get($stageConfig, 'role') ?? Arr::get($stageConfig, 'fallback_role');
    }

    private function resolveStageRoles(?array $stageConfig): array
    {
        if (! $stageConfig) {
            return [];
        }

        return array_values(array_filter([
            Arr::get($stageConfig, 'role'),
            Arr::get($stageConfig, 'fallback_role'),
        ]));
    }

    private function stageHasRole(?array $stageConfig, string $role): bool
    {
        return in_array($role, $this->resolveStageRoles($stageConfig), true);
    }

    private function seedApprovalStages(LeaveRequest $leaveRequest, LeavePolicy $policy): void
    {
        $matrix = collect($policy->approval_matrix ?? []);
        $stages = $policy->flow_type === ApprovalFlowType::PARALLEL_AND
            ? $matrix->unique('stage')->values()
            : $matrix;

        $assignedAt = Carbon::now();

        $stages->each(function ($stageConfig) use ($leaveRequest, $assignedAt) {
            $stage = Arr::get($stageConfig, 'stage');

            if (! $stage) {
                return;
            }

            LeaveRequestApproval::create([
                'leave_request_id' => $leaveRequest->id,
                'approver_id' => null,
                'stage' => $stage,
                'assigned_at' => $assignedAt,
                'sla_snapshot' => Arr::get($stageConfig, 'sla', []),
            ]);
        });
    }

    private function resolvePolicyFor(LeaveRequest $leaveRequest): ?LeavePolicy
    {
        return LeavePolicy::query()
            ->where('leave_type_id', $leaveRequest->leave_type_id)
            ->where(fn ($query) => $query->whereNull('division_id')->orWhere('division_id', $leaveRequest->division_id))
            ->orderByDesc('division_id')
            ->first();
    }

    private function advanceWorkflow(LeaveRequest $leaveRequest): void
    {
        $pendingApprovals = $leaveRequest->approvals()->whereNull('acted_at')->orderBy('id')->get();

        if ($pendingApprovals->isNotEmpty()) {
            $policy = $this->resolvePolicyFor($leaveRequest);

            if (! $policy) {
                return;
            }

            $nextStage = $pendingApprovals->first();
            $nextRole = $this->resolvePrimaryRoleForStage($policy, $nextStage->stage);

            if ($nextRole) {
                $leaveRequest->status = $this->statusForRole($nextRole, $policy->flow_type);
                $leaveRequest->save();
            }

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
