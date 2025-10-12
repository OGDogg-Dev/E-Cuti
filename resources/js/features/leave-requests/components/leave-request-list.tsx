import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    CalendarRange,
    Clock3,
    FileText,
    ShieldAlert,
    UserCheck,
} from 'lucide-react';

import { leaveRequestDetail } from '@/routes';
import { LeaveRequestStatusBadge } from './leave-request-status-badge';
import { formatDateRange } from '../utils';
import { type LeaveRequest } from '../types';

interface LeaveRequestListProps {
    requests: LeaveRequest[];
    className?: string;
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

export function LeaveRequestList({ requests, className }: LeaveRequestListProps) {
    if (requests.length === 0) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sidebar-border/60 p-12 text-center text-sm text-muted-foreground dark:border-sidebar-border',
                    className,
                )}
            >
                <FileText className="h-6 w-6" />
                <div>Belum ada permohonan dengan filter saat ini.</div>
                <p className="max-w-md text-xs text-muted-foreground">
                    Sesuaikan filter atau ubah rentang tanggal untuk melihat permohonan lainnya.
                </p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {requests.map((request) => {
                const pendingApprovals = request.approvals.filter(
                    (approval) => approval.status === 'PENDING',
                );
                const completedApprovals = request.approvals.filter(
                    (approval) => approval.status !== 'PENDING',
                );
                return (
                    <Card
                        key={request.id}
                        className="border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900"
                    >
                        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">
                                    {request.employee.name}{' '}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        · {request.employee.divisionName}
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    NIP {request.employee.nip} · {request.employee.position}
                                </CardDescription>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                        {request.type.name}
                                    </Badge>
                                    <span>Kode {request.shortCode}</span>
                                    <span>Diajukan {formatDateTime(request.submittedAt)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 text-right">
                                <LeaveRequestStatusBadge status={request.status} />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock3 className="h-4 w-4" />
                                    <span>SLA: {formatDateTime(request.sla.dueAt)}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                                    <CalendarRange className="mt-0.5 h-4 w-4 text-primary" />
                                    <div className="space-y-1">
                                        <div className="font-medium text-foreground">
                                            Periode {request.period.workingDays} hari kerja
                                        </div>
                                        <div className="text-muted-foreground">
                                            {formatDateRange(
                                                request.period.startDate,
                                                request.period.endDate,
                                            )}
                                        </div>
                                        {request.period.holidays.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Mengabaikan {request.period.holidays.length} hari libur nasional.
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
                                            <p className="text-muted-foreground">
                                                Semua approver telah merespons.
                                            </p>
                                        )}
                                        {completedApprovals.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Riwayat:{' '}
                                                {completedApprovals
                                                    .map((approval) =>
                                                        `${approval.role} ${approval.status.toLowerCase()} ${approval.actor ? `oleh ${approval.actor}` : ''}`,
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
                                        <p className="text-muted-foreground">
                                            {request.thresholdImpact.message}
                                        </p>
                                        {request.blackoutViolation && (
                                            <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                Melanggar blackout period divisi.
                                            </p>
                                        )}
                                        {request.attachmentsRequired && !request.hasSupportingDocument && (
                                            <p className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                                                <FileText className="h-3.5 w-3.5" />
                                                Lampiran wajib belum lengkap.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                                <div>
                                    Diperbarui {formatDateTime(request.lastUpdatedAt)}
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="border-primary/40 text-primary"
                                >
                                    <a href={leaveRequestDetail(request.id).url}>Lihat detail</a>
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="hidden" />
                    </Card>
                );
            })}
        </div>
    );
}
