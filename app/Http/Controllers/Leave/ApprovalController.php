<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveRequestWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ApprovalController extends Controller
{
    public function __construct(private readonly LeaveRequestWorkflowService $workflowService)
    {
    }

    public function inbox(Request $request)
    {
        Gate::authorize('view-approval-inbox');

        $user = Auth::user()->loadMissing('roles');
        $perPage = $request->integer('per_page', 15);

        $allowedStatuses = $this->workflowService->allowedStatusesFor($user);
        $allowedStages = $this->workflowService->allowedStagesFor($user);

        if ($allowedStatuses === [] || $allowedStages === []) {
            $requests = LeaveRequest::query()
                ->whereRaw('1 = 0')
                ->paginate($perPage);

            return response()->json($requests);
        }

        $requests = LeaveRequest::query()
            ->with(['leaveType', 'user', 'division'])
            ->whereIn('status', $allowedStatuses)
            ->whereHas('approvals', function ($query) use ($user, $allowedStages) {
                $query->whereNull('acted_at')
                    ->whereIn('stage', $allowedStages)
                    ->where(function ($query) use ($user) {
                        $query->whereNull('approver_id')
                            ->orWhere('approver_id', $user->id);
                    });
            })
            ->paginate($perPage);

        return response()->json($requests);
    }

    public function action(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'stage' => ['required', 'string'],
            'action' => ['required', 'in:APPROVE,REJECT'],
            'notes' => ['nullable', 'string'],
        ]);

        $user = Auth::user()->loadMissing('roles');

        Gate::authorize('process-approval', [$leaveRequest, $validated['stage']]);

        $this->workflowService->recordDecision(
            $leaveRequest,
            $user,
            $validated['stage'],
            $validated['action'],
            $validated['notes'] ?? null
        );

        if ($leaveRequest->status->value === 'APPROVED') {
            $this->workflowService->finalize($leaveRequest);
        }

        return response()->json($leaveRequest->fresh());
    }
}
