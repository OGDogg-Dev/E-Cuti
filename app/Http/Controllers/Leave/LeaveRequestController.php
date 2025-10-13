<?php

namespace App\Http\Controllers\Leave;

use App\Domain\Leave\Actions\SubmitLeaveRequestAction;
use App\Domain\Leave\DataTransferObjects\LeaveRequestData;
use App\Domain\Leave\Exceptions\ThresholdViolationException;
use App\Domain\Leave\Repositories\LeaveRequestRepository;
use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequestRequest;
use App\Http\Resources\Leave\LeaveRequestResource;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class LeaveRequestController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly LeaveRequestRepository $leaveRequests,
        private readonly SubmitLeaveRequestAction $submitLeaveRequest,
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LeaveRequest::class);

        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing('roles');

        $requests = $this->leaveRequests->paginateForUser(
            $user,
            $request->all(),
            $request->integer('per_page', 15)
        );

        return LeaveRequestResource::collection($requests);
    }

    public function store(StoreLeaveRequestRequest $request)
    {
        $this->authorize('create', LeaveRequest::class);

        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing('roles');
        $data = LeaveRequestData::fromRequest($request, $user);

        try {
            $leaveRequest = $this->submitLeaveRequest->execute($data);
        } catch (ThresholdViolationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'suggested_dates' => $exception->suggestedDates(),
            ], 409);
        }

        return (new LeaveRequestResource($leaveRequest))
            ->response()
            ->setStatusCode(201);
    }
}
