import { LeaveRequestSummary } from '@/features/leave-requests/components/leave-request-summary';
import { DivisionCapacityGrid } from '@/features/leave-requests/components/division-capacity-grid';
import { LeaveRequestStatusBadge } from '@/features/leave-requests/components/leave-request-status-badge';
import { MOCK_LEAVE_REQUESTS } from '@/features/leave-requests/data/mock';
import {
    calculateDivisionCapacity,
    formatDateRange,
    isSlaBreached,
    summarizeLeaveRequests,
} from '@/features/leave-requests/utils';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { approvalsInbox, dashboard, leaveRequests } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlarmClock,
    ArrowUpRight,
    BarChart3,
    CalendarClock,
    ClipboardCheck,
    Compass,
    FileText,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Role } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function isPending(requestStatus: string) {
    return (
        requestStatus === 'SUBMITTED' ||
        requestStatus === 'WAITING_APPROVAL_KEPALA' ||
        requestStatus === 'WAITING_APPROVAL_SDM' ||
        requestStatus === 'WAITING_APPROVAL_BOTH'
    );
}

function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    }).format(date);
}

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const canViewApprovalInbox = auth?.abilities?.viewApprovalInbox ?? false;
    const canManageLeaveBalances = auth?.abilities?.manageLeaveBalances ?? false;
    const canViewLeaveRequests = auth?.abilities?.viewLeaveRequests ?? false;
    const primaryRole = resolvePrimaryRole(auth?.user?.roles);
    const referenceDate = useMemo(() => new Date(), []);
    const summary = useMemo(
        () => summarizeLeaveRequests(MOCK_LEAVE_REQUESTS, referenceDate),
        [referenceDate],
    );
    const divisionCapacity = useMemo(
        () => calculateDivisionCapacity(MOCK_LEAVE_REQUESTS, referenceDate),
        [referenceDate],
    );

    const pendingApprovals = useMemo(
        () =>
            MOCK_LEAVE_REQUESTS.filter((request) => isPending(request.status))
                .sort(
                    (a, b) =>
                        new Date(a.sla.dueAt).getTime() - new Date(b.sla.dueAt).getTime(),
                )
                .slice(0, 5),
        [],
    );

    const recentActivities = useMemo(
        () =>
            [...MOCK_LEAVE_REQUESTS]
                .sort(
                    (a, b) =>
                        new Date(b.lastUpdatedAt).getTime() -
                        new Date(a.lastUpdatedAt).getTime(),
                )
                .slice(0, 5),
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold text-foreground">Ringkasan Operasional Cuti</h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau SLA persetujuan, kapasitas divisi, dan aktivitas terbaru sesuai matriks persetujuan e-Cuti.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canManageLeaveBalances && (
                            <Link
                                href={leaveRequests().url}
                                className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
                            >
                                <Sparkles className="h-4 w-4" /> Tambah Saldo Cuti
                            </Link>
                        )}
                        {canViewLeaveRequests && (
                            <Link
                                href={leaveRequests().url}
                                className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
                            >
                                <ClipboardCheck className="h-4 w-4" /> Kelola Permohonan
                            </Link>
                        )}
                    </div>
                </div>

                <RolePersonaPanel
                    role={primaryRole}
                    summary={summary}
                    abilities={{
                        canViewApprovalInbox,
                        canManageLeaveBalances,
                        canViewLeaveRequests,
                    }}
                />

                <LeaveRequestSummary summary={summary} />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <DivisionCapacityGrid data={divisionCapacity} />
                    <div className="flex flex-col gap-6">
                        {canViewApprovalInbox && (
                            <PendingApprovalsCard requests={pendingApprovals} />
                        )}
                        <RecentActivityCard requests={recentActivities} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PendingApprovalsCard({ requests }: { requests: typeof MOCK_LEAVE_REQUESTS }) {
    const now = new Date();
    return (
        <Card className="h-full border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                    <CardTitle className="text-base">Prioritas Persetujuan</CardTitle>
                    <CardDescription>
                        Urutkan berdasarkan tenggat SLA dan delegasi aktif.
                    </CardDescription>
                </div>
                <Link
                    href={approvalsInbox().url}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    Lihat semua
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {requests.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-sidebar-border/60 p-6 text-center text-sm text-muted-foreground dark:border-sidebar-border">
                        Tidak ada permohonan yang menunggu.
                    </div>
                ) : (
                    <ul className="space-y-3 text-sm">
                        {requests.map((request) => (
                            <li
                                key={request.id}
                                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 dark:border-border/40"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            {request.employee.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {request.employee.divisionName} · {request.shortCode}
                                        </div>
                                    </div>
                                    <LeaveRequestStatusBadge status={request.status} />
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                        {request.type.name}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                        <AlarmClock className="h-3.5 w-3.5" /> {formatDateTime(request.sla.dueAt)}
                                    </span>
                                    {isSlaBreached(request, now) && (
                                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                                            SLA Terlewati
                                        </span>
                                    )}
                                </div>
                                {request.thresholdImpact.level !== 'OK' && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        {request.thresholdImpact.message}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function RecentActivityCard({ requests }: { requests: typeof MOCK_LEAVE_REQUESTS }) {
    return (
        <Card className="border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900">
            <CardHeader>
                <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
                <CardDescription>
                    Finalisasi, persetujuan, dan pembaruan status lima terbaru.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {requests.map((request) => (
                    <div key={request.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="font-semibold text-foreground">
                                    {request.employee.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {request.employee.divisionName} · {formatDateRange(
                                        request.period.startDate,
                                        request.period.endDate,
                                    )}
                                </div>
                            </div>
                            <LeaveRequestStatusBadge status={request.status} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5" /> Diperbarui {formatDateTime(request.lastUpdatedAt)}
                        </div>
                        <Separator />
                    </div>
                ))}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                Audit trail lengkap tersedia di detail permohonan untuk keperluan pemeriksaan.
            </CardFooter>
        </Card>
    );
}

type PrimaryRole = 'sdm' | 'kepala' | 'pegawai';

function resolvePrimaryRole(roles?: Role[]): PrimaryRole {
    const normalized = (roles ?? []).map((role) => role.name.toLowerCase());

    if (normalized.some((name) => name.includes('sdm') || name.includes('hr') || name.includes('human resource'))) {
        return 'sdm';
    }

    if (normalized.some((name) => name.includes('kepala') || name.includes('pimpinan') || name.includes('head'))) {
        return 'kepala';
    }

    return 'pegawai';
}

interface RolePersonaPanelProps {
    role: PrimaryRole;
    summary: ReturnType<typeof summarizeLeaveRequests>;
    abilities: {
        canViewApprovalInbox: boolean;
        canManageLeaveBalances: boolean;
        canViewLeaveRequests: boolean;
    };
}

function RolePersonaPanel({ role, summary, abilities }: RolePersonaPanelProps) {
    const personaContent = getPersonaContent(role, summary);

    return (
        <Card className="border border-primary/30 bg-primary/5 text-sm text-primary-foreground shadow-sm">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                        {personaContent.badge}
                    </div>
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                        <personaContent.icon className="h-5 w-5 text-primary" />
                        {personaContent.title}
                    </CardTitle>
                    <CardDescription className="max-w-3xl text-muted-foreground">
                        {personaContent.description}
                    </CardDescription>
                </div>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    {personaContent.metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-background/60 p-3 text-left shadow-sm"
                        >
                            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">
                                {metric.label}
                            </span>
                            <span className="text-lg font-semibold text-foreground">{metric.value}</span>
                            <span>{metric.caption}</span>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <ul className="space-y-3 text-muted-foreground">
                    {personaContent.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{highlight}</span>
                        </li>
                    ))}
                </ul>
                <div className="grid gap-3 text-sm text-foreground lg:max-w-sm">
                    {personaContent.actions
                        .filter((action) => action.show(abilities))
                        .map((action) => (
                            <Link
                                key={action.label}
                                href={action.href}
                                className="inline-flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-background px-4 py-3 font-semibold text-primary transition hover:border-primary/50 hover:bg-primary/10"
                            >
                                <span className="flex items-center gap-2">
                                    <action.icon className="h-4 w-4" />
                                    {action.label}
                                </span>
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
}

function getPersonaContent(role: PrimaryRole, summary: ReturnType<typeof summarizeLeaveRequests>) {
    const baseMetrics = [
        {
            label: 'Pending',
            value: summary.pendingApproval,
            caption: 'Menunggu keputusan final',
        },
        {
            label: 'SLA',
            value: summary.slaBreached,
            caption: 'Butuh pengingat segera',
        },
        {
            label: 'Finalisasi',
            value: summary.finalized,
            caption: 'Selesai bulan ini',
        },
    ];

    if (role === 'sdm') {
        return {
            badge: 'Fokus SDM',
            title: 'Koordinasikan kapasitas dan saldo cuti',
            description:
                'Pastikan approval berjalan sesuai SLA sambil meninjau dampak terhadap kapasitas divisi dan saldo karyawan.',
            icon: Users,
            metrics: baseMetrics,
            highlights: [
                `${summary.thresholdAlerts} permohonan memerlukan evaluasi threshold sebelum disetujui.`,
                'Gunakan pengingat SLA otomatis untuk menjaga komitmen layanan.',
                'Delegasikan persetujuan saat pejabat inti tidak tersedia.',
            ],
            actions: [
                {
                    label: 'Buka antrian persetujuan',
                    href: approvalsInbox().url,
                    icon: CalendarClock,
                    show: ({ canViewApprovalInbox }: RolePersonaPanelProps['abilities']) => canViewApprovalInbox,
                },
                {
                    label: 'Kelola permohonan & saldo',
                    href: leaveRequests().url,
                    icon: FileText,
                    show: ({ canManageLeaveBalances, canViewLeaveRequests }) =>
                        canManageLeaveBalances || canViewLeaveRequests,
                },
            ],
        } as const;
    }

    if (role === 'kepala') {
        return {
            badge: 'Prioritas Kepala Kantor',
            title: 'Validasi dampak operasional sebelum menyetujui',
            description:
                'Tinjau kapasitas layanan, delegasi aktif, dan histori keputusan sebelum menandatangani permohonan cuti.',
            icon: BarChart3,
            metrics: baseMetrics,
            highlights: [
                `${summary.pendingApproval} permohonan menunggu persetujuan atau delegasi Anda.`,
                'Gunakan insight kapasitas divisi untuk menjaga kelangsungan layanan.',
                'Audit trail lengkap tersedia untuk setiap keputusan yang Anda ambil.',
            ],
            actions: [
                {
                    label: 'Lihat prioritas hari ini',
                    href: approvalsInbox().url,
                    icon: Compass,
                    show: ({ canViewApprovalInbox }) => canViewApprovalInbox,
                },
                {
                    label: 'Pantau permohonan aktif',
                    href: leaveRequests().url,
                    icon: CalendarClock,
                    show: ({ canViewLeaveRequests }) => canViewLeaveRequests,
                },
            ],
        } as const;
    }

    return {
        badge: 'Agenda Pegawai',
        title: 'Kelola rencana cuti dan pantau status',
        description:
            'Lihat riwayat pengajuan, status persetujuan, dan insight saldo untuk merencanakan cuti dengan percaya diri.',
        icon: UserCheck,
        metrics: baseMetrics,
        highlights: [
            'Pantau status persetujuan secara real-time tanpa harus menanyakan manual.',
            'Pastikan saldo cuti mencukupi sebelum menjadwalkan cuti berikutnya.',
            'Akses arsip surat cuti yang sudah disetujui kapan saja.',
        ],
        actions: [
            {
                label: 'Buat permohonan baru',
                href: leaveRequests().url,
                icon: Sparkles,
                show: ({ canViewLeaveRequests }) => canViewLeaveRequests,
            },
        ],
    } as const;
}
