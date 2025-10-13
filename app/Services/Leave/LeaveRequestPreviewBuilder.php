<?php

namespace App\Services\Leave;

use App\Enums\LeaveRequestStatus;
use App\Domain\Leave\DataTransferObjects\LeaveRequestData;
use App\Models\LeaveAttachment;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use Illuminate\Support\Collection;

class LeaveRequestPreviewBuilder
{
    public function __construct(private readonly WorkingDayCalculator $workingDayCalculator)
    {
    }

    public function build(LeaveRequestData $data): LeaveRequest
    {
        $leaveType = LeaveType::query()->findOrFail($data->leaveTypeId);

        $leaveRequest = new LeaveRequest($data->toModelAttributes());
        $leaveRequest->status = LeaveRequestStatus::DRAFT;
        $leaveRequest->duration = $this->workingDayCalculator->calculateDuration(
            $data->startDate->copy(),
            $data->endDate->copy()
        );
        $leaveRequest->setRelation('user', $data->user);
        $leaveRequest->setRelation('division', $data->user->division);
        $leaveRequest->setRelation('leaveType', $leaveType);
        $leaveRequest->setRelation('approvals', collect());
        $leaveRequest->setRelation('attachments', $this->buildAttachments($data));
        $leaveRequest->submitted_at = null;
        $leaveRequest->finalized_at = null;

        return $leaveRequest;
    }

    private function buildAttachments(LeaveRequestData $data): Collection
    {
        if (! $data->attachment) {
            return collect();
        }

        return collect([
            new LeaveAttachment([
                'filename' => $data->attachment->getClientOriginalName(),
                'mime_type' => $data->attachment->getClientMimeType(),
                'size' => $data->attachment->getSize(),
            ]),
        ]);
    }
}
