<?php

namespace App\Http\Controllers\Leave;

use App\Enums\LeaveRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequestRequest;
use App\Http\Resources\Leave\LeaveRequestResource;
use App\Models\LeavePolicy;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveRequestWorkflowService;
use App\Services\Leave\ThresholdEvaluator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class LeaveRequestController extends Controller
{
    public function __construct(
        private readonly LeaveRequestWorkflowService $workflowService,
        private readonly ThresholdEvaluator $thresholdEvaluator
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $requests = LeaveRequest::query()
            ->with(['leaveType', 'division'])
            ->where('user_id', Auth::id())
            ->latest('created_at')
            ->paginate($request->integer('per_page', 15));

        return LeaveRequestResource::collection($requests);
    }

    public function store(StoreLeaveRequestRequest $request)
    {
        $leaveRequest = LeaveRequest::create([
            'user_id' => Auth::id(),
            'division_id' => Auth::user()?->division_id,
            'leave_type_id' => $request->input('leave_type_id'),
            'start_date' => $request->date('start_date'),
            'end_date' => $request->date('end_date'),
            'reason' => $request->string('reason')->toString(),
            'status' => LeaveRequestStatus::DRAFT,
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('leave-attachments');

            $leaveRequest->attachments()->create([
                'filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'storage_path' => $path,
            ]);
        }

        $policy = LeavePolicy::findOrFail($request->integer('policy_id'));

        if ($this->thresholdEvaluator->violatesThreshold($leaveRequest)) {
            return response()->json([
                'message' => 'Pengajuan melewati ambang minimum layanan.',
                'suggested_dates' => $this->suggestAlternativeDates($leaveRequest),
            ], 409);
        }

        $this->workflowService->submit($leaveRequest, $policy);

        return new LeaveRequestResource($leaveRequest->fresh(['leaveType', 'division', 'attachments']));
    }

    private function suggestAlternativeDates(LeaveRequest $leaveRequest): ?array
    {
        $start = $leaveRequest->start_date;
        $end = $leaveRequest->end_date;

        $candidate = $this->workflowService->suggestAlternativeDates(
            $start,
            $end,
            function ($candidateStart, $candidateEnd) use ($leaveRequest) {
                $clone = $leaveRequest->replicate();
                $clone->start_date = $candidateStart;
                $clone->end_date = $candidateEnd;

                return ! $this->thresholdEvaluator->violatesThreshold($clone);
            }
        );

        if (! $candidate) {
            return null;
        }

        return [
            'start_date' => $candidate[0]->toDateString(),
            'end_date' => $candidate[1]->toDateString(),
        ];
    }
}
