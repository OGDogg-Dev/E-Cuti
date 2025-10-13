<?php

use App\Http\Controllers\Leave\LeaveRequestPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('leave/requests', function () {
        return Inertia::render('leave/index');
    })->name('leaveRequests');

    Route::get('leave/requests/create', [LeaveRequestPageController::class, 'create'])
        ->name('leaveRequestCreate');

    Route::get('leave/requests/{leaveRequest}', function (string $leaveRequest) {
        return Inertia::render('leave/detail', [
            'leaveRequestId' => $leaveRequest,
        ]);
    })->name('leaveRequestDetail');

    Route::get('approvals/inbox', function () {
        return Inertia::render('approvals/index');
    })->name('approvalsInbox');
});
