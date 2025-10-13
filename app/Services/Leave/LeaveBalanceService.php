<?php

namespace App\Services\Leave;

use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class LeaveBalanceService
{
    public function getBalance(int $userId, int $leaveTypeId, ?int $year = null): ?LeaveBalance
    {
        $year ??= Carbon::now()->year;

        return LeaveBalance::query()
            ->where('user_id', $userId)
            ->where('leave_type_id', $leaveTypeId)
            ->where('year', $year)
            ->first();
    }

    public function ensureSufficientBalance(int $userId, int $leaveTypeId, float $duration, ?int $year = null): bool
    {
        $year ??= Carbon::now()->year;

        $balance = $this->getBalance($userId, $leaveTypeId, $year);

        if (! $balance) {
            return false;
        }

        if ($this->usesSharedQuota($leaveTypeId)) {
            $summary = $this->sharedQuotaSummary($userId, $year);

            return $summary !== null && $summary['remaining'] >= $duration;
        }

        return $balance->remaining_balance >= $duration;
    }

    public function applyFinalization(LeaveRequest $leaveRequest): void
    {
        $balance = $this->getBalance($leaveRequest->user_id, $leaveRequest->leave_type_id, (int) $leaveRequest->start_date->year);

        if (! $balance) {
            throw new \RuntimeException('Saldo cuti tidak ditemukan.');
        }

        $balance->used_balance += $leaveRequest->durationInDays();
        $balance->audit_trail = collect($balance->audit_trail ?? [])
            ->push([
                'event' => 'finalization',
                'leave_request_id' => $leaveRequest->id,
                'duration' => $leaveRequest->durationInDays(),
                'timestamp' => Carbon::now()->toDateTimeString(),
            ])->all();

        $balance->save();
    }

    public function adjustBalance(int $balanceId, float $amount, string $reason): LeaveBalance
    {
        $balance = LeaveBalance::findOrFail($balanceId);
        $balance->adjusted_balance += $amount;
        $trail = collect($balance->audit_trail ?? []);
        $trail->push([
            'event' => 'adjustment',
            'amount' => $amount,
            'reason' => $reason,
            'timestamp' => Carbon::now()->toDateTimeString(),
        ]);
        $balance->audit_trail = $trail->all();
        $balance->save();

        return $balance;
    }

    public function balancesForDashboard(?int $divisionId = null): Collection
    {
        return LeaveBalance::query()
            ->with(['user:id,name,division_id', 'leaveType:id,name'])
            ->when($divisionId, function ($query) use ($divisionId) {
                $query->whereHas('user', fn ($q) => $q->where('division_id', $divisionId));
            })
            ->get();
    }

    public function sharedQuotaForUser(int $userId, ?int $year = null): ?array
    {
        $year ??= Carbon::now()->year;

        $summary = $this->sharedQuotaSummary($userId, $year);

        if (! $summary) {
            return null;
        }

        return [
            'year' => $year,
            'total' => $summary['opening'],
            'used' => $summary['used'],
            'remaining' => $summary['remaining'],
        ];
    }

    private function usesSharedQuota(int $leaveTypeId): bool
    {
        $policy = LeavePolicy::query()->where('leave_type_id', $leaveTypeId)->first();

        return $policy ? $policy->allowsSharedQuota() : false;
    }

    private function sharedQuotaSummary(int $userId, int $year): ?array
    {
        $balances = LeaveBalance::query()
            ->where('user_id', $userId)
            ->where('year', $year)
            ->get();

        if ($balances->isEmpty()) {
            return null;
        }

        $opening = $balances->max(function (LeaveBalance $balance) {
            return (float) $balance->opening_balance
                + (float) $balance->carry_over_balance
                + (float) $balance->adjusted_balance;
        });

        $used = (float) $balances->sum('used_balance');

        return [
            'opening' => $opening,
            'used' => $used,
            'remaining' => max(0.0, $opening - $used),
        ];
    }
}
