<?php

namespace App\Http\Resources\Leave;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

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
            'signature_status' => optional($this->signature_status)->value,
            'submitted_at' => optional($this->submitted_at)->toIso8601String(),
            'finalized_at' => optional($this->finalized_at)->toIso8601String(),
            'employee' => $this->formatEmployeeMetadata(),
            'contact' => $this->formatContactMetadata(),
            'document' => $this->formatDocumentMetadata($request),
            'attachments' => $this->whenLoaded('attachments', function () use ($request) {
                $user = $request->user();

                if (! $user) {
                    return [];
                }

                $userGate = Gate::forUser($user);

                return $this->attachments
                    ->filter(fn ($attachment) => $userGate->allows('view', $attachment))
                    ->map(fn ($attachment) => [
                        'filename' => $attachment->filename,
                        'mime_type' => $attachment->mime_type,
                        'size' => $attachment->size,
                        'downloadable' => $userGate->allows('download', $attachment),
                        'url' => $userGate->allows('download', $attachment)
                            ? $attachment->storage_path
                            : null,
                    ]);
            }),
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
     * @return array<string, mixed>
     */
    private function formatDocumentMetadata(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [
                'downloadable' => false,
                'format' => 'PDF',
                'url' => null,
            ];
        }

        $gate = Gate::forUser($user);

        $canDownload = $gate->allows('download-leave-documents', $this->resource);

        return [
            'downloadable' => $canDownload,
            'format' => 'PDF',
            'url' => $canDownload ? route('api.leave-requests.document', $this->resource) : null,
        ];
    }
}
