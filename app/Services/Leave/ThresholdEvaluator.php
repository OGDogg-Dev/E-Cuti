<?php

namespace App\Services\Leave;

use App\Enums\LeaveRequestStatus;
use App\Models\Division;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class ThresholdEvaluator
{
    public function violatesThreshold(LeaveRequest $leaveRequest): bool
    {
        $policy = $this->policyFor($leaveRequest);
        if (! $policy) {
            return false;
        }

        $rules = collect($policy->threshold_rules ?? []);
        if ($rules->isEmpty()) {
            return false;
        }

        return $rules->contains(function ($rule) use ($leaveRequest) {
            $threshold = Arr::get($rule, 'min_presence');
            $window = Arr::get($rule, 'window');
            if ($threshold === null || ! $window) {
                return false;
            }

            $presentRatio = $this->calculatePresenceRatio($leaveRequest, $window);

            $thresholdValue = (float) $threshold;

            if ($thresholdValue > 1) {
                $thresholdValue = $thresholdValue / 100;
            }

            return $presentRatio < $thresholdValue;
        });
    }

    public function calculatePresenceRatio(LeaveRequest $leaveRequest, array $window): float
    {
        $division = Division::query()->withCount('employees')->find($leaveRequest->division_id);
        if (! $division) {
            return 1.0;
        }

        $start = Carbon::parse($window['start'] ?? $leaveRequest->start_date)->startOfDay();
        $end = Carbon::parse($window['end'] ?? $leaveRequest->end_date)->endOfDay();

        $totalEmployees = (int) ($division->employees_count ?? $division->employees()->count());

        if ($totalEmployees === 0) {
            return 1.0;
        }

        $dateRange = [$start->toDateString(), $end->toDateString()];

        $relevantStatuses = [
            LeaveRequestStatus::SUBMITTED->value,
            LeaveRequestStatus::WAITING_APPROVAL_KEPALA->value,
            LeaveRequestStatus::WAITING_APPROVAL_SDM->value,
            LeaveRequestStatus::WAITING_APPROVAL_BOTH->value,
            LeaveRequestStatus::APPROVED->value,
            LeaveRequestStatus::FINALIZED->value,
        ];

        $employeesOnLeave = $division->leaveRequests()
            ->whereIn('status', $relevantStatuses)
            ->where(function ($query) use ($dateRange) {
                [$startDate, $endDate] = $dateRange;

                $query->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($overlap) use ($startDate, $endDate) {
                        $overlap->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                    });
            })
            ->distinct('user_id')
            ->count('user_id');

        $candidateCountsAsLeave = in_array($leaveRequest->status?->value, $relevantStatuses, true);
        $overlapsWindow = $this->overlapsWindow($leaveRequest, $start, $end);

        if ($overlapsWindow && ! $candidateCountsAsLeave) {
            $employeesOnLeave++;
        }

        $availableEmployees = max($totalEmployees - $employeesOnLeave, 0);

        return $availableEmployees / $totalEmployees;
    }

    private function overlapsWindow(LeaveRequest $leaveRequest, Carbon $windowStart, Carbon $windowEnd): bool
    {
        if (! $leaveRequest->start_date || ! $leaveRequest->end_date) {
            return false;
        }

        $requestStart = Carbon::parse($leaveRequest->start_date)->startOfDay();
        $requestEnd = Carbon::parse($leaveRequest->end_date)->endOfDay();

        return $requestStart->lessThanOrEqualTo($windowEnd) && $requestEnd->greaterThanOrEqualTo($windowStart);
    }

    private function policyFor(LeaveRequest $leaveRequest): ?LeavePolicy
    {
        return LeavePolicy::query()
            ->where('leave_type_id', $leaveRequest->leave_type_id)
            ->where(function ($query) use ($leaveRequest) {
                $query->whereNull('division_id')
                    ->orWhere('division_id', $leaveRequest->division_id);
            })
            ->orderByDesc('division_id')
            ->first();
    }
}
