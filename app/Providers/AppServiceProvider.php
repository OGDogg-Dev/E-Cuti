<?php

namespace App\Providers;

use App\Models\LeaveRequest;
use App\Models\User;
use App\Policies\LeaveRequestPolicy;
use App\Services\Leave\LeaveRequestWorkflowService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(LeaveRequest::class, LeaveRequestPolicy::class);

        Gate::define('view-approval-inbox', function (User $user): bool {
            return $user->hasAnyRole(['division_head', 'hr_manager', 'super_admin']);
        });

        Gate::define('process-approval', function (User $user, LeaveRequest $leaveRequest, string $stage): bool {
            return app(LeaveRequestWorkflowService::class)
                ->userCanProcessStage($user, $leaveRequest, $stage);
        });
    }
}
