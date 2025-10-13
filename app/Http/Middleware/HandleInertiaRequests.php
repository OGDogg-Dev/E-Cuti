<?php

namespace App\Http\Middleware;

use App\Models\LeaveRequest;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        if ($user) {
            $user->loadMissing('roles:id,name');
        }

        $abilities = [
            'viewLeaveRequests' => $user
                ? Gate::forUser($user)->allows('viewAny', LeaveRequest::class)
                : false,
            'createLeaveRequest' => $user
                ? Gate::forUser($user)->allows('create', LeaveRequest::class)
                : false,
            'viewApprovalInbox' => $user
                ? Gate::forUser($user)->allows('view-approval-inbox')
                : false,
            'manageLeaveBalances' => $user
                ? Gate::forUser($user)->allows('manage-leave-balance')
                : false,
            'downloadLeaveAttachments' => $user
                ? Gate::forUser($user)->allows('download-leave-attachments')
                : false,
        ];

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
                'abilities' => $abilities,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
