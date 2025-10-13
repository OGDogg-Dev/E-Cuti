<?php

namespace App\Providers;

use App\Models\LeaveAttachment;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Policies\LeaveAttachmentPolicy;
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
        Gate::policy(LeaveAttachment::class, LeaveAttachmentPolicy::class);

        Gate::define('view-approval-inbox', function (User $user): bool {
            return $user->hasAnyRole(['kepala_kantor', 'sdm', 'admin']);
        });

        Gate::define('process-approval', function (User $user, LeaveRequest $leaveRequest, string $stage): bool {
            return app(LeaveRequestWorkflowService::class)
                ->userCanProcessStage($user, $leaveRequest, $stage);
        });

        Gate::define('manage-leave-balance', function (User $user): bool {
            return $user->hasAnyRole(['kepala_kantor', 'sdm', 'admin']);
        });

        Gate::define('download-leave-attachments', function (User $user): bool {
            return $user->hasAnyRole(['sdm', 'admin']);
        });

        Gate::define('download-leave-documents', function (User $user, ?LeaveRequest $leaveRequest = null): bool {
            return $user->hasAnyRole(['kepala_kantor', 'sdm', 'admin']);
        });
    }
}
