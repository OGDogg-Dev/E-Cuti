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
        $query = LeaveRequest::query()
            ->with(['leaveType', 'division'])
            ->where('user_id', $user->getKey())
            ->latest('created_at');

        if ($status = Arr::get($filters, 'status')) {
            $query->whereIn('status', (array) $status);
        }

        if ($type = Arr::get($filters, 'leave_type_id')) {
            $query->where('leave_type_id', $type);
        }

        return $query->paginate($perPage);
    }
}

