<?php

namespace App\Policies;

use App\Models\LeaveAttachment;
use App\Models\User;

class LeaveAttachmentPolicy
{
    public function view(User $user, LeaveAttachment $attachment): bool
    {
        if ($user->hasAnyRole(['admin', 'sdm'])) {
            return true;
        }

        $leaveRequest = $attachment->leaveRequest;

        if (! $leaveRequest) {
            $attachment->loadMissing('leaveRequest');
            $leaveRequest = $attachment->leaveRequest;
        }

        if (! $leaveRequest) {
            return false;
        }

        return (int) $leaveRequest->user_id === (int) $user->getKey();
    }

    public function download(User $user, LeaveAttachment $attachment): bool
    {
        return $user->hasAnyRole(['admin', 'sdm']);
    }
}
