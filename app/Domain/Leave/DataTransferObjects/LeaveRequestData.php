<?php

namespace App\Domain\Leave\DataTransferObjects;

use App\Enums\LeaveRequestStatus;
use App\Http\Requests\Leave\StoreLeaveRequestRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;

class LeaveRequestData
{
    public function __construct(
        public readonly User $user,
        public readonly int $leaveTypeId,
        public readonly int $policyId,
        public readonly Carbon $startDate,
        public readonly Carbon $endDate,
        public readonly string $reason,
        public readonly ?UploadedFile $attachment,
        public readonly array $metadata,
    ) {
    }

    public static function fromRequest(StoreLeaveRequestRequest $request, User $user): self
    {
        $metadata = [
            'email' => $request->string('email')->toString(),
            'employee_type' => $request->string('employee_type')->toString(),
            'full_name' => $request->string('full_name')->toString(),
            'nip' => $request->input('nip'),
            'position' => $request->string('position')->toString(),
            'address_during_leave' => $request->string('address_during_leave')->toString(),
            'contact_phone' => $request->string('contact_phone')->toString(),
        ];

        return new self(
            user: $user,
            leaveTypeId: (int) $request->input('leave_type_id'),
            policyId: (int) $request->input('policy_id'),
            startDate: $request->date('start_date'),
            endDate: $request->date('end_date'),
            reason: $request->string('reason')->toString(),
            attachment: $request->file('attachment'),
            metadata: $metadata,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toModelAttributes(): array
    {
        return [
            'user_id' => $this->user->getKey(),
            'division_id' => $this->user->division_id,
            'leave_type_id' => $this->leaveTypeId,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
            'duration' => 0,
            'reason' => $this->reason,
            'status' => LeaveRequestStatus::DRAFT,
            'metadata' => $this->metadata,
        ];
    }
}

