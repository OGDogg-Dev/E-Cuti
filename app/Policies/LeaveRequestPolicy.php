<?php

namespace App\Policies;

use App\Models\LeaveRequest;
use App\Models\User;

class LeaveRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'admin',
            'sdm',
            'kepala_kantor',
            'pegawai',
        ]);
    }

    public function view(User $user, LeaveRequest $leaveRequest): bool
    {
        if ($user->hasAnyRole(['admin', 'sdm', 'kepala_kantor'])) {
            return true;
        }

        return $user->getKey() === $leaveRequest->user_id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'pegawai',
            'kepala_kantor',
            'sdm',
            'admin',
        ]);
    }
}
