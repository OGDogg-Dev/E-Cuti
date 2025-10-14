<?php

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\LeaveRequest */
class LeaveRequestPreviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => null,
            'leave_type' => [
                'id' => $this->leaveType?->id,
                'name' => $this->leaveType?->name,
                'code' => $this->leaveType?->code,
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
            'employee' => $this->formatEmployeeMetadata(),
            'contact' => $this->formatContactMetadata(),
            'document' => [
                'downloadable' => true,
                'format' => 'DOCX',
                'url' => null,
            ],
            'signers' => [
                'head' => $this->formatHeadSigner(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatEmployeeMetadata(): array
    {
        $metadata = $this->metadata ?? [];

        return [
            'full_name' => $metadata['full_name'] ?? $this->user?->name,
            'email' => $metadata['email'] ?? $this->user?->email,
            'nip' => $metadata['nip'] ?? $this->user?->employee_number,
            'position' => $metadata['position'] ?? null,
            'employee_type' => $metadata['employee_type'] ?? null,
            'division' => $this->division?->name,
            'unit_name' => $this->division?->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatContactMetadata(): array
    {
        $metadata = $this->metadata ?? [];

        return [
            'address_during_leave' => $metadata['address_during_leave'] ?? null,
            'contact_phone' => $metadata['contact_phone'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function formatHeadSigner(): ?array
    {
        $metadata = $this->getAttribute('supervisor_metadata');

        if (! is_array($metadata)) {
            return null;
        }

        return [
            'id' => $metadata['id'] ?? null,
            'name' => $metadata['name'] ?? null,
            'nip' => $metadata['nip'] ?? null,
            'position' => $metadata['position'] ?? null,
            'division' => $metadata['division'] ?? null,
        ];
    }
}
