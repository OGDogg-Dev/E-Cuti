import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { leaveRequestDetail } from '@/routes';
import { Link } from '@inertiajs/react';
import { AlarmClock, AlertTriangle, Check, CheckCircle2, Eye, FileDown, Paperclip } from 'lucide-react';

import { LeaveRequestStatusBadge } from '@/features/leave-requests/components/leave-request-status-badge';
import { isSlaBreached } from '@/features/leave-requests/utils';
import { type LeaveRequest } from '@/features/leave-requests/types';

interface ApprovalQueueTableProps {
    requests: LeaveRequest[];
    className?: string;
    abilities?: {
        canApprove: boolean;
        canViewDetail: boolean;
        canDownloadDocument: boolean;
        canDownloadAttachments: boolean;
    };
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

export function ApprovalQueueTable({
    requests,
    className,
    abilities = {
        canApprove: false,
        canViewDetail: false,
        canDownloadDocument: false,
        canDownloadAttachments: false,
    },
}: ApprovalQueueTableProps) {
    const now = new Date();
    const slaBreached = requests.filter((request) => isSlaBreached(request, now)).length;
    const delegated = requests.filter((request) =>
        request.approvals.some((approval) => approval.delegatedTo),
    ).length;

    return (
        <Card
            className={cn(
                'border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader>
                <CardTitle className="text-lg">Antrian Persetujuan</CardTitle>
                <CardDescription>
                    Urutkan prioritas berdasarkan SLA dan risiko layanan agar cuti tidak mengganggu operasional.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm dark:border-border/40 md:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <AlarmClock className="h-5 w-5 text-primary" />
                        <div>
                            <div className="text-sm font-semibold text-foreground">
                                {slaBreached} melewati SLA
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Prioritaskan untuk menghindari eskalasi otomatis ke delegasi.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                            <div className="text-sm font-semibold text-foreground">
                                {requests.filter((r) => r.thresholdImpact.level !== 'OK').length} risiko layanan
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pastikan divisi tidak turun di bawah minimum layanan.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <div>
                            <div className="text-sm font-semibold text-foreground">
                                {delegated} sedang didelegasikan
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pantau agar delegasi menyelesaikan sebelum eskalasi berikutnya.
                            </p>
                        </div>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-sidebar-border/60 p-8 text-center text-sm text-muted-foreground dark:border-sidebar-border">
                        Tidak ada permohonan yang menunggu persetujuan. Sistem akan mengirim notifikasi jika ada pengajuan baru.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-left text-sm">
                            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Pemohon</th>
                                    <th className="px-4 py-3">Jenis</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">SLA</th>
                                    <th className="px-4 py-3">Delegasi</th>
                                    <th className="px-4 py-3">Catatan</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                                {requests.map((request) => {
                                    const pending = request.approvals.filter(
                                        (approval) => approval.status === 'PENDING',
                                    );
                                    const slaWarning = isSlaBreached(request, now);
                                    const firstDownloadableAttachment = request.attachments?.find(
                                        (attachment) => attachment.downloadable && attachment.url,
                                    );
                                    const hasDocument = abilities.canDownloadDocument && Boolean(request.document?.url);
                                    const hasAttachments =
                                        abilities.canDownloadAttachments && Boolean(firstDownloadableAttachment?.url);
                                    const hasActions =
                                        abilities.canApprove || abilities.canViewDetail || hasDocument || hasAttachments;
                                    return (
                                        <tr key={request.id} className="bg-background">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">
                                                    {request.employee.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {request.employee.divisionName} · {request.shortCode}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                                                    {request.type.name}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <LeaveRequestStatusBadge status={request.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span>{formatDateTime(request.sla.dueAt)}</span>
                                                    {slaWarning && (
                                                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                                                            SLA
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {pending.length > 0
                                                    ? pending
                                                          .map((approval) =>
                                                              approval.delegatedTo
                                                                  ? `${approval.role} → ${approval.delegatedTo}`
                                                                  : approval.role,
                                                          )
                                                          .join(', ')
                                                    : 'Tidak ada delegasi'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {request.thresholdImpact.level !== 'OK'
                                                    ? request.thresholdImpact.message
                                                    : request.notes || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {hasActions ? (
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        {abilities.canApprove && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                                                                onClick={() =>
                                                                    alert(
                                                                        `Permohonan ${request.shortCode} siap disetujui. Implementasi produksi akan membuka modal persetujuan dengan catatan dan saldo terbaru.`,
                                                                    )
                                                                }
                                                            >
                                                                <Check className="h-3.5 w-3.5" /> Setujui
                                                            </Button>
                                                        )}
                                                        {abilities.canViewDetail && (
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={leaveRequestDetail(request.id).url}>
                                                                    <Eye className="h-3.5 w-3.5" /> Detail
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasDocument && request.document?.url && (
                                                            <Button asChild variant="outline" size="sm">
                                                                <a href={request.document.url} download={request.document.filename}>
                                                                    <FileDown className="h-3.5 w-3.5" /> Dokumen
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {hasAttachments && firstDownloadableAttachment?.url && (
                                                            <Button asChild variant="outline" size="sm">
                                                                <a
                                                                    href={firstDownloadableAttachment.url}
                                                                    download={firstDownloadableAttachment.filename}
                                                                >
                                                                    <Paperclip className="h-3.5 w-3.5" /> Lampiran
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Tidak ada aksi</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <Separator />
                <p className="text-xs text-muted-foreground">
                    Gunakan tombol approve/reject pada detail permohonan untuk menambahkan catatan resmi. Sistem menyimpan audit trail lengkap termasuk delegasi dan SLA.
                </p>
            </CardContent>
        </Card>
    );
}
