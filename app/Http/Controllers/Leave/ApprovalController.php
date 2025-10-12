<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveRequestWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApprovalController extends Controller
{
    public function __construct(private readonly LeaveRequestWorkflowService $workflowService)
    {
    }

    public function inbox(Request $request)
    {
        $user = Auth::user()->loadMissing('roles');

        $requests = LeaveRequest::query()
            ->with(['leaveType', 'user', 'division'])
            ->whereHas('approvals', function ($query) use ($user) {
                $query->whereNull('acted_at')
                    ->whereIn('stage', $user->roles->pluck('name'));
            })
            ->paginate($request->integer('per_page', 15));

        return response()->json($requests);
    }

    public function action(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'stage' => ['required', 'string'],
            'action' => ['required', 'in:APPROVE,REJECT'],
            'notes' => ['nullable', 'string'],
        ]);

        $this->workflowService->recordDecision(
            $leaveRequest,
            Auth::id(),
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
