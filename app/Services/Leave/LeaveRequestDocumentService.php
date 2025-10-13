<?php

namespace App\Services\Leave;

use App\Models\LeaveRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class LeaveRequestDocumentService
{
    public function generate(LeaveRequest $leaveRequest): \Barryvdh\DomPDF\PDF
    {
        $leaveRequest->loadMissing(['user', 'leaveType', 'division', 'attachments', 'approvals.approver']);

        $metadata = $leaveRequest->metadata ?? [];
        $employee = [
            'full_name' => $metadata['full_name'] ?? $leaveRequest->user?->name,
            'email' => $metadata['email'] ?? $leaveRequest->user?->email,
            'nip' => $metadata['nip'] ?? $leaveRequest->user?->employee_number,
            'position' => $metadata['position'] ?? null,
            'employee_type' => $metadata['employee_type'] ?? null,
        ];

        $contact = [
            'address_during_leave' => $metadata['address_during_leave'] ?? null,
            'contact_phone' => $metadata['contact_phone'] ?? null,
        ];

        $payload = [
            'leaveRequest' => $leaveRequest,
            'employee' => $employee,
            'contact' => $contact,
            'metadata' => $metadata,
            'duration' => $leaveRequest->durationInDays(),
            'period' => [
                'start' => optional($leaveRequest->start_date)->toDateString(),
                'end' => optional($leaveRequest->end_date)->toDateString(),
            ],
            'submittedAt' => optional($leaveRequest->submitted_at)->toDateTimeString(),
            'approvals' => $leaveRequest->approvals,
        ];

        return Pdf::loadView('pdf.leave-request', $payload)->setPaper('a4');
    }

    public function fileName(LeaveRequest $leaveRequest): string
    {
        $dateSegment = optional($leaveRequest->start_date)->format('Ymd') ?? Carbon::now()->format('Ymd');

        return sprintf('formulir-cuti-%s.pdf', $dateSegment);
    }
}
