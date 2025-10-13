<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Leave\ApprovalController;
use App\Http\Controllers\Leave\LeaveBalanceController;
use App\Http\Controllers\Leave\LeaveRequestController;
use App\Http\Controllers\Leave\LeaveRequestDocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    Route::get('/leave-requests/{leaveRequest}/document', [LeaveRequestDocumentController::class, 'show'])
        ->name('api.leave-requests.document');

    Route::get('/approvals/inbox', [ApprovalController::class, 'inbox']);
    Route::post('/approvals/{leaveRequest}/action', [ApprovalController::class, 'action']);

    Route::get('/leave-balances', [LeaveBalanceController::class, 'index']);

    Route::get('/dashboards/leadership', [DashboardController::class, 'leadership']);
    Route::get('/dashboards/division', [DashboardController::class, 'division']);
});
