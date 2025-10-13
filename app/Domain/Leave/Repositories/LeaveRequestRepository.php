<?php

namespace App\Domain\Leave\Repositories;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class LeaveRequestRepository
{
    public function paginateForUser(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $user->loadMissing('roles');

        $query = LeaveRequest::query()
            ->with(['leaveType', 'division'])
            ->latest('created_at');

        if ($user->hasAnyRole(['super_admin', 'hr_manager'])) {
            // Full access, no additional constraints.
        } elseif ($user->hasRole('division_head')) {
            $query->where('division_id', $user->division_id);
        } else {
            $query->where('user_id', $user->getKey());
        }

        if ($status = Arr::get($filters, 'status')) {
            $query->whereIn('status', (array) $status);
        }

        if ($type = Arr::get($filters, 'leave_type_id')) {
            $query->where('leave_type_id', $type);
        }

        return $query->paginate($perPage);
    }
}

