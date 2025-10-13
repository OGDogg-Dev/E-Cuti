<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestPageController extends Controller
{
    public function __construct(private readonly LeaveBalanceService $leaveBalanceService)
    {
    }

    public function create(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing(['division', 'leaveBalances.leaveType', 'roles']);

        $leaveTypes = LeaveType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'requires_document']);

        $policies = LeavePolicy::query()
            ->whereIn('leave_type_id', $leaveTypes->pluck('id'))
            ->where(function ($query) use ($user) {
                $query->whereNull('division_id');

                if ($user->division_id) {
                    $query->orWhere('division_id', $user->division_id);
                }
            })
            ->get(['id', 'leave_type_id', 'division_id', 'threshold_rules', 'additional_constraints']);

        $policyMap = $policies
            ->sortByDesc(fn ($policy) => $policy->division_id === $user->division_id ? 1 : 0)
            ->keyBy('leave_type_id');

        $usesSharedQuota = $policyMap
            ->values()
            ->contains(fn (LeavePolicy $policy) => $policy->allowsSharedQuota());

        $currentYear = Carbon::now()->year;
        $balancesForYear = $user->leaveBalances->where('year', $currentYear);
        $sharedQuota = $usesSharedQuota
            ? $this->leaveBalanceService->sharedQuotaForUser($user->getKey(), $currentYear)
            : null;

        $leaveTypePayload = $leaveTypes->map(function (LeaveType $type) use ($policyMap) {
            return [
                'id' => $type->id,
                'code' => $type->code,
                'name' => $type->name,
                'requires_document' => (bool) $type->requires_document,
                'policy_id' => optional($policyMap->get($type->id))->id,
            ];
        });

        $balances = $balancesForYear
            ->map(fn ($balance) => [
                'id' => $balance->id,
                'leave_type_id' => $balance->leave_type_id,
                'leave_type_name' => $balance->leaveType?->name,
                'remaining' => $balance->remaining_balance,
                'used' => (float) $balance->used_balance,
                'year' => $balance->year,
            ])
            ->values();

        return Inertia::render('leave/create', [
            'leaveTypes' => $leaveTypePayload,
            'leaveBalances' => $balances,
            'sharedQuota' => $sharedQuota,
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'employee_number' => $user->employee_number,
                'division' => $user->division?->name,
            ],
        ]);
    }
}
