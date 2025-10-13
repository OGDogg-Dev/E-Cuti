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
        if ($user->hasAnyRole(['super_admin', 'hr_manager', 'division_head'])) {
            return true;
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
