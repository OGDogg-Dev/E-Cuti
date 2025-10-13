<?php

namespace App\Services\Leave;

use App\Models\LeavePolicy;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LeavePolicyResolver
{
    public function resolve(User $user, int $policyId, int $leaveTypeId): LeavePolicy
    {
        $policy = LeavePolicy::query()
            ->whereKey($policyId)
            ->where('leave_type_id', $leaveTypeId)
            ->where(function ($query) use ($user) {
                $query->whereNull('division_id')
                    ->orWhere('division_id', $user->division_id);
            })
            ->first();

        if (! $policy) {
            throw ValidationException::withMessages([
                'policy_id' => 'Kebijakan cuti tidak berlaku untuk pegawai ini.',
            ]);
        }

        return $policy;
    }
}
