<?php

namespace App\Services\Dashboard;

use App\Enums\LeaveRequestStatus;
use App\Models\Division;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(private readonly LeaveBalanceService $balanceService)
    {
    }

    public function organizationHeatmap(): Collection
    {
        return LeaveRequest::query()
            ->select(DB::raw('DATE(start_date) as date'), DB::raw('count(*) as total'))
            ->whereYear('start_date', Carbon::now()->year)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->date => $row->total]);
    }

    public function divisionStaffingOverview(int $divisionId): array
    {
        $division = Division::with(['leaveRequests' => function ($query) {
            $query->whereIn('status', [
                LeaveRequestStatus::SUBMITTED,
                LeaveRequestStatus::WAITING_APPROVAL_KEPALA,
                LeaveRequestStatus::WAITING_APPROVAL_SDM,
                LeaveRequestStatus::WAITING_APPROVAL_BOTH,
                LeaveRequestStatus::APPROVED,
                LeaveRequestStatus::FINALIZED,
            ]);
        }])->findOrFail($divisionId);

        $today = Carbon::today();
        $activeToday = $division->leaveRequests->filter(fn ($request) => $request->start_date->lte($today) && $request->end_date->gte($today))->count();
        $thresholds = $division->service_thresholds ?? [];

        return [
            'active_today' => $activeToday,
            'thresholds' => $thresholds,
        ];
    }

    public function slaPerformance(): array
    {
        $requests = LeaveRequest::query()
            ->with('approvals')
            ->whereYear('start_date', Carbon::now()->year)
            ->get();

        $compliant = 0;
        $total = $requests->count();

        foreach ($requests as $request) {
            $allOnTime = $request->approvals->every(function ($approval) {
                if (! $approval->sla_snapshot) {
                    return true;
                }

                $deadline = Carbon::parse($approval->assigned_at)->addHours($approval->sla_snapshot['response_time_hours'] ?? 0);
                if (! $approval->acted_at) {
                    return Carbon::now()->lt($deadline);
                }

                return $approval->acted_at->lte($deadline);
            });

            if ($allOnTime) {
                $compliant++;
            }
        }

        return [
            'total' => $total,
            'compliant' => $compliant,
            'compliance_rate' => $total > 0 ? $compliant / $total : 1,
        ];
    }

    public function balanceSummary(): Collection
    {
        return $this->balanceService->balancesForDashboard()->groupBy('leaveType.name')->map(function ($balances) {
            return [
                'quota' => $balances->sum('opening_balance'),
                'used' => $balances->sum('used_balance'),
                'remaining' => $balances->sum(fn ($balance) => $balance->remaining_balance),
            ];
        });
    }
}
