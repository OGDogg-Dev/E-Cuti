<?php

namespace App\Services\Leave;

use App\Models\LeaveBalance;
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
        $balance = $this->getBalance($userId, $leaveTypeId, $year);

        return $balance !== null && $balance->remaining_balance >= $duration;
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
}
