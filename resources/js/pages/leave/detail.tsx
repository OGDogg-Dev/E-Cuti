import AppLayout from '@/layouts/app-layout';
import { LeaveRequestStatusBadge } from '@/features/leave-requests/components/leave-request-status-badge';
import { MOCK_LEAVE_REQUESTS } from '@/features/leave-requests/data/mock';
import { formatDateRange } from '@/features/leave-requests/utils';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CalendarRange, Clock3, FileText, ShieldAlert, UserCheck } from 'lucide-react';
import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { approvalsInbox, dashboard, leaveRequestDetail, leaveRequests } from '@/routes';
import { type BreadcrumbItem } from '@/types';

interface PageProps {
    leaveRequestId: string;
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

export default function LeaveRequestDetailPage() {
    const { leaveRequestId } = usePage<PageProps>().props;

    const leaveRequest = useMemo(
        () => MOCK_LEAVE_REQUESTS.find((request) => request.id === leaveRequestId) ?? null,
        [leaveRequestId],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Permohonan Cuti', href: leaveRequests().url },
        {
            title: leaveRequest ? leaveRequest.shortCode : 'Detail Permohonan',
            href: leaveRequestDetail(leaveRequestId).url,
        },
    ];

    if (!leaveRequest) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Permohonan tidak ditemukan" />
                <div className="flex flex-1 items-center justify-center p-8">
                    <Card className="max-w-lg text-center">
                        <CardHeader>
                            <CardTitle>Permohonan tidak ditemukan</CardTitle>
                            <CardDescription>
                                Permohonan dengan ID {leaveRequestId} tidak tersedia. Silakan kembali ke daftar permohonan cuti.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link
                                href={leaveRequests().url}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                Kembali ke daftar permohonan
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const pendingApprovals = leaveRequest.approvals.filter((approval) => approval.status === 'PENDING');
    const completedApprovals = leaveRequest.approvals.filter((approval) => approval.status !== 'PENDING');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${leaveRequest.shortCode}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-foreground">{leaveRequest.shortCode}</h1>
                    <p className="text-sm text-muted-foreground">
                        Rincian permohonan cuti serta status persetujuan terbaru.
                    </p>
                </div>

                <Card className="border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900">
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">
                                {leaveRequest.employee.name}{' '}
                                <span className="text-sm font-normal text-muted-foreground">
                                    · {leaveRequest.employee.divisionName}
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                NIP {leaveRequest.employee.nip} · {leaveRequest.employee.position}
                            </CardDescription>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                    {leaveRequest.type.name}
                                </Badge>
                                <span>Diajukan {formatDateTime(leaveRequest.submittedAt)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 text-right">
                            <LeaveRequestStatusBadge status={leaveRequest.status} />
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                <span>SLA: {formatDateTime(leaveRequest.sla.dueAt)}</span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                                <CalendarRange className="mt-0.5 h-4 w-4 text-primary" />
                                <div className="space-y-1">
                                    <div className="font-medium text-foreground">
                                        Periode {leaveRequest.period.workingDays} hari kerja
                                    </div>
                                    <div className="text-muted-foreground">
                                        {formatDateRange(leaveRequest.period.startDate, leaveRequest.period.endDate)}
                                    </div>
                                    {leaveRequest.period.holidays.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Mengabaikan {leaveRequest.period.holidays.length} hari libur nasional.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                                <UserCheck className="mt-0.5 h-4 w-4 text-primary" />
                                <div className="space-y-1">
                                    <div className="font-medium text-foreground">Approval</div>
                                    {pendingApprovals.length > 0 ? (
                                        <p className="text-muted-foreground">
                                            Menunggu: {pendingApprovals
                                                .map((approval) =>
                                                    approval.delegatedTo
                                                        ? `${approval.role} (delegasi ${approval.delegatedTo})`
                                                        : approval.role,
                                                )
                                                .join(', ')}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground">Semua approver telah merespons.</p>
                                    )}
                                    {completedApprovals.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Riwayat:{' '}
                                            {completedApprovals
                                                .map((approval) =>
                                                    `${approval.role} ${approval.status.toLowerCase()} ${
                                                        approval.actor ? `oleh ${approval.actor}` : ''
                                                    }`,
                                                )
                                                .join('; ')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                                <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
                                <div className="space-y-1">
                                    <div className="font-medium text-foreground">Kepatuhan</div>
                                    <p className="text-muted-foreground">{leaveRequest.thresholdImpact.message}</p>
                                    {leaveRequest.blackoutViolation && (
                                        <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            Melanggar blackout period divisi.
                                        </p>
                                    )}
                                    {leaveRequest.attachmentsRequired && !leaveRequest.hasSupportingDocument && (
                                        <p className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                                            <FileText className="h-3.5 w-3.5" />
                                            Lampiran wajib belum lengkap.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {leaveRequest.notes && (
                            <div className="space-y-2 text-sm">
                                <h2 className="font-semibold text-foreground">Catatan Pemohon</h2>
                                <p className="text-muted-foreground">{leaveRequest.notes}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div>Diperbarui {formatDateTime(leaveRequest.lastUpdatedAt)}</div>
                            <div className="flex gap-4">
                                <span>
                                    <span className="font-medium">Pengajuan ID:</span> {leaveRequest.id}
                                </span>
                                <Link
                                    href={approvalsInbox().url}
                                    className="text-primary hover:underline"
                                >
                                    Buka antrian persetujuan
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
