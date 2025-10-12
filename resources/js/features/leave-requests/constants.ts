import { type DivisionPolicy, type LeavePolicyDefinition, type LeaveRequestStatus } from './types';

export const DIVISION_POLICIES: DivisionPolicy[] = [
    { code: 'SDM', name: 'SDM', totalMembers: 18, minServiceThreshold: 1 },
    { code: 'PERENCANA_PROGRAM', name: 'Perencana Program', totalMembers: 12, minServiceThreshold: 2 },
    { code: 'ASET_BMN', name: 'Aset BMN', totalMembers: 10, minServiceThreshold: 2 },
    { code: 'KEPENGUSAHAAN', name: 'Kepengusahaan', totalMembers: 9, minServiceThreshold: 2 },
    { code: 'KEUANGAN', name: 'Keuangan', totalMembers: 15, minServiceThreshold: 4 },
    { code: 'HUMAS_DAN_UMUM', name: 'Humas & Umum', totalMembers: 11, minServiceThreshold: 1 },
    { code: 'SARANA_DAN_DIGITAL', name: 'Sarana & Digital', totalMembers: 14, minServiceThreshold: 1 },
    { code: 'PRASARANA', name: 'Prasarana', totalMembers: 13, minServiceThreshold: 2 },
    { code: 'WASDAL', name: 'WASDAL', totalMembers: 7, minServiceThreshold: 1 },
    { code: 'K3', name: 'K3', totalMembers: 8, minServiceThreshold: 1 },
    { code: 'KEBERSIHAN', name: 'Kebersihan', totalMembers: 20, minServiceThreshold: 3 },
];

export const LEAVE_POLICIES: LeavePolicyDefinition[] = [
    {
        code: 'TAHUNAN',
        name: 'Cuti Tahunan',
        maxDays: 12,
        requiresDocument: false,
        fractionalAllowed: false,
        description:
            'Hak cuti tahunan maksimal 12 hari kerja. Dapat diambil bertahap dan mendukung carry-over dengan kedaluwarsa.',
        sla: { kepalaKantorHours: 24, sdmHours: 24, escalationHours: 12 },
    },
    {
        code: 'SAKIT',
        name: 'Cuti Sakit',
        maxDays: null,
        requiresDocument: true,
        fractionalAllowed: false,
        description:
            'Lampirkan surat dokter untuk cuti lebih dari dua hari. Sistem akan memvalidasi kelengkapan dokumen wajib.',
        sla: { kepalaKantorHours: 12, sdmHours: 12, escalationHours: 8 },
    },
    {
        code: 'MELAHIRKAN',
        name: 'Cuti Melahirkan',
        maxDays: null,
        requiresDocument: true,
        fractionalAllowed: false,
        description:
            'Durasi mengikuti kebijakan ketenagakerjaan. Saldo otomatis menyesuaikan ketika finalisasi dilakukan SDM.',
        sla: { kepalaKantorHours: 24, sdmHours: 24, escalationHours: 12 },
    },
    {
        code: 'ALASAN_PENTING',
        name: 'Cuti Alasan Penting',
        maxDays: 5,
        requiresDocument: true,
        fractionalAllowed: false,
        description:
            'Digunakan untuk kepentingan keluarga/dukacita. Bukti pendukung wajib diunggah sebelum finalisasi.',
        sla: { kepalaKantorHours: 24, sdmHours: 24, escalationHours: 12 },
    },
    {
        code: 'DLTN',
        name: 'Di Luar Tanggungan Negara',
        maxDays: null,
        requiresDocument: true,
        fractionalAllowed: false,
        description:
            'Memerlukan persetujuan PPK dan TTE. Sistem akan meminta nomor surat dinas ketika status disetujui.',
        sla: { kepalaKantorHours: 36, sdmHours: 36, escalationHours: 24 },
    },
];

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Diajukan',
    WAITING_APPROVAL_KEPALA: 'Menunggu Kepala Kantor',
    WAITING_APPROVAL_SDM: 'Menunggu SDM',
    WAITING_APPROVAL_BOTH: 'Menunggu Kepala & SDM',
    APPROVED: 'Disetujui',
    FINALIZED: 'Final',
    REJECTED: 'Ditolak',
    CANCELLED: 'Dibatalkan',
};

export const TIMEFRAME_OPTIONS = [
    { value: 'NEXT_7_DAYS', label: '7 hari ke depan' },
    { value: 'NEXT_30_DAYS', label: '30 hari ke depan' },
    { value: 'THIS_MONTH', label: 'Bulan ini' },
    { value: 'ALL', label: 'Semua periode' },
] as const;
