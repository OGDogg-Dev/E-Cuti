<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Formulir Permintaan dan Pemberian Cuti ASN</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
        }
        h1, h2 {
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        th, td {
            border: 1px solid #374151;
            padding: 6px 8px;
            vertical-align: top;
        }
        .label {
            width: 35%;
            font-weight: bold;
        }
        .page {
            page-break-after: always;
        }
        .page:last-of-type {
            page-break-after: auto;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        ol {
            margin: 0;
            padding-left: 18px;
        }
        .meta {
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    @php
        $divisionName = $leaveRequest->division?->name ?? '-';
        $leaveTypeName = $leaveRequest->leaveType?->name ?? '-';
        $start = $period['start'] ? \Illuminate\Support\Carbon::parse($period['start'])->translatedFormat('d F Y') : '-';
        $end = $period['end'] ? \Illuminate\Support\Carbon::parse($period['end'])->translatedFormat('d F Y') : '-';
        $submitted = $submittedAt ? \Illuminate\Support\Carbon::parse($submittedAt)->translatedFormat('d F Y H:i') : '-';
    @endphp

    <div class="page">
        <h1>Formulir Permintaan dan Pemberian Cuti ASN</h1>

        <table>
            <tr>
                <td class="label">Nama Pegawai</td>
                <td>{{ $employee['full_name'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Jenis Pegawai</td>
                <td>{{ $employee['employee_type'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">NIP / NRP</td>
                <td>{{ $employee['nip'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Jabatan</td>
                <td>{{ $employee['position'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Unit Kerja</td>
                <td>{{ $divisionName }}</td>
            </tr>
            <tr>
                <td class="label">Email</td>
                <td>{{ $employee['email'] ?? '-' }}</td>
            </tr>
        </table>

        <table>
            <tr>
                <td class="label">Jenis Cuti</td>
                <td>{{ $leaveTypeName }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Mulai</td>
                <td>{{ $start }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Selesai</td>
                <td>{{ $end }}</td>
            </tr>
            <tr>
                <td class="label">Lamanya</td>
                <td>{{ number_format((float) $duration, 2) }} hari kerja</td>
            </tr>
            <tr>
                <td class="label">Alasan Cuti</td>
                <td>{{ $leaveRequest->reason }}</td>
            </tr>
            <tr>
                <td class="label">Alamat Selama Cuti</td>
                <td>{{ $contact['address_during_leave'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Nomor Kontak</td>
                <td>{{ $contact['contact_phone'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Tanggal Pengajuan</td>
                <td>{{ $submitted }}</td>
            </tr>
        </table>

        <div class="meta">
            <div class="section-title">Jejak Persetujuan</div>
            <table>
                <thead>
                    <tr>
                        <th>Stage</th>
                        <th>Penanggung Jawab</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($approvals as $approval)
                        <tr>
                            <td>{{ $approval->stage }}</td>
                            <td>{{ $approval->approver?->name ?? '-' }}</td>
                            <td>{{ $approval->action ?? 'PENDING' }}</td>
                            <td>{{ optional($approval->acted_at)->translatedFormat('d F Y H:i') ?? '-' }}</td>
                            <td>{{ $approval->notes ?? '-' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5">Belum ada data persetujuan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <div class="page">
        <h2>Lampiran Permohonan Cuti</h2>
        <div class="section-title">Rincian Pengajuan</div>
        <table>
            <tr>
                <td class="label">Nama Pegawai</td>
                <td>{{ $employee['full_name'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Jenis Cuti</td>
                <td>{{ $leaveTypeName }}</td>
            </tr>
            <tr>
                <td class="label">Periode</td>
                <td>{{ $start }} &ndash; {{ $end }}</td>
            </tr>
            <tr>
                <td class="label">Durasi</td>
                <td>{{ number_format((float) $duration, 2) }} hari kerja</td>
            </tr>
            <tr>
                <td class="label">Alasan</td>
                <td>{{ $leaveRequest->reason }}</td>
            </tr>
            <tr>
                <td class="label">Alamat Selama Cuti</td>
                <td>{{ $contact['address_during_leave'] ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Kontak</td>
                <td>{{ $contact['contact_phone'] ?? '-' }}</td>
            </tr>
        </table>

        <div class="section-title">Catatan Tambahan</div>
        <p style="margin:0 0 12px 0;">{{ $metadata['catatan_tambahan'] ?? 'Tidak ada catatan tambahan.' }}</p>
    </div>

    <div class="page">
        <h2>Lampiran Bukti Alasan Cuti</h2>
        @if ($leaveRequest->attachments->isEmpty())
            <p>Tidak ada lampiran bukti yang diunggah.</p>
        @else
            <ol>
                @foreach ($leaveRequest->attachments as $attachment)
                    <li>
                        {{ $attachment->filename }}<br>
                        <small>Tipe: {{ $attachment->mime_type }} &middot; Ukuran: {{ number_format($attachment->size / 1024, 2) }} KB</small>
                    </li>
                @endforeach
            </ol>
        @endif
    </div>
</body>
</html>
