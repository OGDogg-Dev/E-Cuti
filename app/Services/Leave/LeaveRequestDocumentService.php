<?php

namespace App\Services\Leave;

use App\Models\LeaveRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Style\Table as TableStyle;

class LeaveRequestDocumentService
{
    public function generatePdf(LeaveRequest $leaveRequest): \Barryvdh\DomPDF\PDF
    {
        $payload = $this->preparePayload($leaveRequest);

        return Pdf::loadView('pdf.leave-request', $payload)->setPaper('a4');
    }

    public function generateDocx(LeaveRequest $leaveRequest): string
    {
        $payload = $this->preparePayload($leaveRequest);

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(11);

        $section = $phpWord->addSection([
            'marginTop' => 720,
            'marginRight' => 720,
            'marginBottom' => 720,
            'marginLeft' => 720,
        ]);

        $section->addTitle('Formulir Permintaan dan Pemberian Cuti ASN', 1);
        $section->addText(sprintf('Dicetak pada %s', Carbon::now('Asia/Jakarta')->translatedFormat('d F Y H:i')), ['italic' => true], ['spaceAfter' => 200]);

        $this->renderKeyValueTable(
            $section,
            'Informasi Pegawai',
            [
                'Nama Pegawai' => $payload['employee']['full_name'] ?? '-',
                'Email' => $payload['employee']['email'] ?? '-',
                'Jenis Pegawai' => $payload['employee']['employee_type'] ?? '-',
                'NIP / NRP' => $payload['employee']['nip'] ?? '-',
                'Jabatan' => $payload['employee']['position'] ?? '-',
                'Unit Kerja' => $payload['leaveRequest']->division?->name ?? '-',
            ]
        );

        $leaveTypeName = $payload['leaveRequest']->leaveType?->name ?? '-';
        $period = $payload['period']['start'] && $payload['period']['end']
            ? sprintf('%s s/d %s', $payload['period']['start'], $payload['period']['end'])
            : '-';

        $this->renderKeyValueTable(
            $section,
            'Detail Permohonan',
            [
                'Jenis Cuti' => $leaveTypeName,
                'Periode' => $period,
                'Durasi (hari kerja)' => number_format((float) $payload['duration'], 2),
                'Alamat Selama Cuti' => $payload['contact']['address_during_leave'] ?? '-',
                'Nomor Kontak' => $payload['contact']['contact_phone'] ?? '-',
                'Tanggal Pengajuan' => $payload['submittedAt']
                    ? Carbon::parse($payload['submittedAt'])->translatedFormat('d F Y H:i')
                    : '-',
            ]
        );

        $section->addTextBreak(1);
        $section->addText('Alasan Cuti', ['bold' => true]);
        $section->addText($payload['leaveRequest']->reason ?? '-', [], ['spaceAfter' => 240]);

        if ($payload['approvals']->isNotEmpty()) {
            $section->addText('Jejak Persetujuan', ['bold' => true]);
            $table = $section->addTable([
                'borderSize' => 6,
                'borderColor' => '999999',
                'cellMargin' => 80,
                'layout' => TableStyle::LAYOUT_FIXED,
            ]);

            $table->addRow();
            foreach (['Tahap', 'Penanggung Jawab', 'Status', 'Tanggal', 'Catatan'] as $header) {
                $table->addCell(2000)->addText($header, ['bold' => true]);
            }

            $payload['approvals']->each(function ($approval) use ($table): void {
                $table->addRow();
                $table->addCell(2000)->addText($approval->stage ?? '-');
                $table->addCell(2000)->addText($approval->approver?->name ?? '-');
                $table->addCell(2000)->addText($approval->action ?? 'PENDING');
                $table->addCell(2000)->addText(
                    optional($approval->acted_at)->translatedFormat('d F Y H:i') ?? '-'
                );
                $table->addCell(2000)->addText($approval->notes ?? '-');
            });

            $section->addTextBreak(1);
        }

        $section->addText('Dokumen ini merupakan salinan otomatis yang dihasilkan sistem e-Cuti.', ['italic' => true], ['spaceBefore' => 240]);

        $writer = IOFactory::createWriter($phpWord, 'Word2007');
        ob_start();
        $writer->save('php://output');

        return (string) ob_get_clean();
    }

    public function fileName(LeaveRequest $leaveRequest, string $extension = 'pdf'): string
    {
        $dateSegment = optional($leaveRequest->start_date)->format('Ymd') ?? Carbon::now()->format('Ymd');

        return sprintf('formulir-cuti-%s.%s', $dateSegment, ltrim($extension, '.'));
    }

    /**
     * @return array<string, mixed>
     */
    private function preparePayload(LeaveRequest $leaveRequest): array
    {
        if ($leaveRequest->exists) {
            $leaveRequest->loadMissing(['user', 'leaveType', 'division', 'attachments', 'approvals.approver']);
        } else {
            if (! $leaveRequest->relationLoaded('user') && $leaveRequest->user) {
                $leaveRequest->setRelation('user', $leaveRequest->user);
            }

            if (! $leaveRequest->relationLoaded('leaveType') && $leaveRequest->leaveType) {
                $leaveRequest->setRelation('leaveType', $leaveRequest->leaveType);
            }

            if (! $leaveRequest->relationLoaded('division') && $leaveRequest->division) {
                $leaveRequest->setRelation('division', $leaveRequest->division);
            }

            if (! $leaveRequest->relationLoaded('attachments')) {
                $leaveRequest->setRelation('attachments', $leaveRequest->attachments ?? collect());
            }

            if (! $leaveRequest->relationLoaded('approvals')) {
                $leaveRequest->setRelation('approvals', ($leaveRequest->approvals ?? collect())->sortBy('id')->values());
            }
        }

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

        $approvals = $leaveRequest->approvals instanceof Collection
            ? $leaveRequest->approvals
            : collect($leaveRequest->approvals);

        return [
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
            'approvals' => $approvals,
        ];
    }

    private function renderKeyValueTable($section, string $title, array $rows): void
    {
        $section->addText($title, ['bold' => true], ['spaceBefore' => 160, 'spaceAfter' => 80]);

        $table = $section->addTable([
            'borderSize' => 6,
            'borderColor' => '999999',
            'cellMargin' => 80,
        ]);

        foreach ($rows as $label => $value) {
            $table->addRow();
            $table->addCell(3000)->addText($label, ['bold' => true]);
            $table->addCell(6000)->addText($value !== '' ? (string) $value : '-');
        }
    }
}
