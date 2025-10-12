import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

import { type DivisionCapacitySnapshot } from '../types';

interface DivisionCapacityGridProps {
    data: DivisionCapacitySnapshot[];
    className?: string;
}

const STATUS_LABELS: Record<DivisionCapacitySnapshot['status'], string> = {
    OK: 'Aman',
    WARNING: 'Waspada',
    CRITICAL: 'Kritis',
};

const STATUS_STYLES: Record<DivisionCapacitySnapshot['status'], string> = {
    OK: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    CRITICAL: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

export function DivisionCapacityGrid({ data, className }: DivisionCapacityGridProps) {
    return (
        <Card
            className={cn(
                'border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900',
                className,
            )}
        >
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-primary" />
                    Kapasitas Divisi 30 hari ke depan
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Menghitung permohonan dengan status pending, approved, dan finalized.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.map((division) => {
                        const utilization = Math.round(division.loadPercentage);
                        return (
                            <div
                                key={division.division}
                                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-4 text-sm dark:border-border/40"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-semibold text-foreground">
                                        {division.name}
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-1 text-xs font-medium',
                                            STATUS_STYLES[division.status],
                                        )}
                                    >
                                        {STATUS_LABELS[division.status]}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {division.availableCount} tersedia · {division.onLeaveCount} cuti · total {division.totalMembers} orang
                                </div>
                                <div className="h-2 rounded-full bg-border/70">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            division.status === 'CRITICAL'
                                                ? 'bg-rose-500'
                                                : division.status === 'WARNING'
                                                  ? 'bg-amber-500'
                                                  : 'bg-emerald-500',
                                        )}
                                        style={{ width: `${utilization}%` }}
                                    />
                                </div>
                                <Separator />
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div>Minimum layanan {division.minServiceThreshold} orang.</div>
                                    {division.upcomingRequests.length > 0 ? (
                                        <div>
                                            Agenda terdekat:{' '}
                                            {division.upcomingRequests
                                                .slice(0, 2)
                                                .map(
                                                    (request) =>
                                                        `${request.employee.name} (${request.period.startDate} – ${request.period.endDate})`,
                                                )
                                                .join('; ')}
                                            {division.upcomingRequests.length > 2 && ' dan lainnya'}
                                        </div>
                                    ) : (
                                        <div>Tidak ada bentrok dalam 30 hari ke depan.</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
