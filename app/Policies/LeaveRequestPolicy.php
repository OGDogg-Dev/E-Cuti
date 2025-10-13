<?php

namespace App\Policies;

use App\Models\LeaveRequest;
use App\Models\User;

class LeaveRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'super_admin',
            'hr_manager',
            'division_head',
            'employee',
        ]);
    }

    public function view(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user->hasAnyRole(['super_admin', 'hr_manager'])) {
            return true;
        }

        if ($user->hasRole('division_head')) {
            return (int) $user->division_id === (int) $leaveRequest->division_id;
        }

        return $user->getKey() === $leaveRequest->user_id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'employee',
            'division_head',
            'hr_manager',
            'super_admin',
        ]);
    }
}
