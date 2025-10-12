import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlarmClock, CheckCircle2, CircleDashed, FileWarning, GitPullRequest } from 'lucide-react';

import { type LeaveRequestSummary } from '../types';

interface LeaveRequestSummaryProps {
    summary: LeaveRequestSummary;
    className?: string;
}

const metricIcons = {
    pendingApproval: CircleDashed,
    slaBreached: AlarmClock,
    thresholdAlerts: FileWarning,
    approved: GitPullRequest,
    finalized: CheckCircle2,
};

type MetricKey = keyof typeof metricIcons;

const metricDescriptions: Record<MetricKey, string> = {
    pendingApproval: 'Menunggu aksi Kepala Kantor atau SDM',
    slaBreached: 'Lewat SLA, akan otomatis diekalasi ke delegasi',
    thresholdAlerts: 'Berpotensi melanggar kapasitas minimal divisi',
    approved: 'Siap difinalisasi oleh SDM',
    finalized: 'Sudah terbit surat & potong saldo',
};

export function LeaveRequestSummary({ summary, className }: LeaveRequestSummaryProps) {
    const metrics: MetricKey[] = ['pendingApproval', 'slaBreached', 'thresholdAlerts', 'approved', 'finalized'];

    return (
        <Card
            className={cn(
                'grid gap-4 border border-sidebar-border/70 bg-card p-4 shadow-sm dark:border-sidebar-border/70 dark:bg-neutral-900 md:grid-cols-5',
                className,
            )}
        >
            {metrics.map((metricKey, index) => {
                const Icon = metricIcons[metricKey];
                const value = summary[metricKey];
                return (
                    <div key={metricKey} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                <Icon className="h-4 w-4" />
                            </span>
                            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                {metricKey === 'pendingApproval'
                                    ? 'Pending Approval'
                                    : metricKey === 'slaBreached'
                                      ? 'SLA'
                                      : metricKey === 'thresholdAlerts'
                                        ? 'Threshold'
                                        : metricKey === 'approved'
                                          ? 'Approved'
                                          : 'Finalized'}
                            </div>
                        </div>
                        <div className="text-2xl font-semibold">{value}</div>
                        <p className="text-sm text-muted-foreground">
                            {metricDescriptions[metricKey]}
                        </p>
                        {index < metrics.length - 1 && (
                            <Separator className="md:hidden" orientation="horizontal" />
                        )}
                    </div>
                );
            })}
        </Card>
    );
}
