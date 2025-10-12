<?php

namespace App\Services\Leave;

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
            if (! $threshold || ! $window) {
                return false;
            }

            $presentRatio = $this->calculatePresenceRatio($leaveRequest, $window);

            return $presentRatio < $threshold;
        });
    }

    public function calculatePresenceRatio(LeaveRequest $leaveRequest, array $window): float
    {
        $division = Division::find($leaveRequest->division_id);
        if (! $division) {
            return 1.0;
        }

        $start = Carbon::parse($window['start'] ?? $leaveRequest->start_date);
        $end = Carbon::parse($window['end'] ?? $leaveRequest->end_date);

        $teamSize = $division->leaveRequests()
            ->whereBetween('start_date', [$start, $end])
            ->distinct('user_id')
            ->count('user_id');

        $totalEmployees = $division->leaveRequests()
            ->whereYear('start_date', $start->year)
            ->distinct('user_id')
            ->count('user_id');

        if ($totalEmployees === 0) {
            return 1.0;
        }

        $presence = max(0, $totalEmployees - $teamSize);

        return $presence / $totalEmployees;
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
