<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Leave\ApprovalController;
use App\Http\Controllers\Leave\LeaveRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);

    Route::get('/approvals/inbox', [ApprovalController::class, 'inbox']);
    Route::post('/approvals/{leaveRequest}/action', [ApprovalController::class, 'action']);

    Route::get('/dashboards/leadership', [DashboardController::class, 'leadership']);
    Route::get('/dashboards/division', [DashboardController::class, 'division']);
});
