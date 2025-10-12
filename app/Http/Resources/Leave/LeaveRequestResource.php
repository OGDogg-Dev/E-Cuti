<?php

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LeaveRequest */
class LeaveRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'leave_type' => [
                'id' => $this->leaveType?->id,
                'name' => $this->leaveType?->name,
            ],
            'division' => [
                'id' => $this->division?->id,
                'name' => $this->division?->name,
            ],
            'start_date' => optional($this->start_date)->toDateString(),
            'end_date' => optional($this->end_date)->toDateString(),
            'duration' => $this->durationInDays(),
            'reason' => $this->reason,
            'status' => $this->status->value,
            'document_number' => $this->document_number,
            'signature_status' => $this->signature_status->value,
            'submitted_at' => optional($this->submitted_at)->toIso8601String(),
            'finalized_at' => optional($this->finalized_at)->toIso8601String(),
            'attachments' => $this->whenLoaded('attachments', fn () => $this->attachments->map(fn ($attachment) => [
                'filename' => $attachment->filename,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'url' => $attachment->storage_path,
            ])),
        ];
    }
}
