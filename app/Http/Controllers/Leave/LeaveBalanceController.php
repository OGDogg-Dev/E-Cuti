<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Http\Resources\Leave\LeaveBalanceResource;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class LeaveBalanceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing('roles');

        $targetUserId = $request->integer('user_id');
        $query = LeaveBalance::query()->with('leaveType');

        if ($targetUserId && $user->hasAnyRole(['admin', 'sdm', 'kepala_kantor'])) {
            $query->where('user_id', $targetUserId);
        } else {
            $query->where('user_id', $user->getKey());
        }

        $year = $request->integer('year', Carbon::now()->year);
        $balances = $query->where('year', $year)->get();

        return LeaveBalanceResource::collection($balances);
    }
}
