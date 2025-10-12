import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Filter, RotateCcw } from 'lucide-react';

import { LEAVE_STATUS_LABELS, TIMEFRAME_OPTIONS, DIVISION_POLICIES } from '../constants';
import { type LeaveRequestFilters, type LeaveRequestStatus } from '../types';

interface LeaveRequestFiltersProps {
    filters: LeaveRequestFilters;
    onChange: <Key extends keyof LeaveRequestFilters>(
        key: Key,
        value: LeaveRequestFilters[Key],
    ) => void;
    onReset: () => void;
    className?: string;
}

const pendingOptions: { value: LeaveRequestStatus | 'ALL_PENDING'; label: string }[] = [
    { value: 'ALL', label: 'Semua status' },
    { value: 'ALL_PENDING', label: 'Semua menunggu persetujuan' },
    { value: 'WAITING_APPROVAL_KEPALA', label: LEAVE_STATUS_LABELS.WAITING_APPROVAL_KEPALA },
    { value: 'WAITING_APPROVAL_SDM', label: LEAVE_STATUS_LABELS.WAITING_APPROVAL_SDM },
    { value: 'WAITING_APPROVAL_BOTH', label: LEAVE_STATUS_LABELS.WAITING_APPROVAL_BOTH },
    { value: 'SUBMITTED', label: LEAVE_STATUS_LABELS.SUBMITTED },
    { value: 'APPROVED', label: LEAVE_STATUS_LABELS.APPROVED },
    { value: 'FINALIZED', label: LEAVE_STATUS_LABELS.FINALIZED },
    { value: 'REJECTED', label: LEAVE_STATUS_LABELS.REJECTED },
    { value: 'CANCELLED', label: LEAVE_STATUS_LABELS.CANCELLED },
];

export function LeaveRequestFilters({ filters, onChange, onReset, className }: LeaveRequestFiltersProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-xl border border-sidebar-border/60 bg-card p-4 shadow-sm dark:border-sidebar-border/70 dark:bg-neutral-900',
                className,
            )}
        >
            <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Filter Permohonan
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={filters.status}
                        onValueChange={(value) => onChange('status', value as LeaveRequestFilters['status'])}
                    >
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                            {pendingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="division">Divisi</Label>
                    <Select
                        value={filters.division}
                        onValueChange={(value) => onChange('division', value as LeaveRequestFilters['division'])}
                    >
                        <SelectTrigger id="division">
                            <SelectValue placeholder="Semua divisi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua divisi</SelectItem>
                            {DIVISION_POLICIES.map((division) => (
                                <SelectItem key={division.code} value={division.code}>
                                    {division.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="timeframe">Periode</Label>
                    <Select
                        value={filters.timeframe}
                        onValueChange={(value) => onChange('timeframe', value as LeaveRequestFilters['timeframe'])}
                    >
                        <SelectTrigger id="timeframe">
                            <SelectValue placeholder="Periode" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEFRAME_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="search">Cari</Label>
                    <Input
                        id="search"
                        value={filters.searchTerm}
                        placeholder="Nama, NIP, kode, jenis cuti"
                        onChange={(event) => onChange('searchTerm', event.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                        id="pending-only"
                        checked={filters.showOnlyPendingApprovals}
                        onCheckedChange={(checked) =>
                            onChange('showOnlyPendingApprovals', Boolean(checked))
                        }
                    />
                    <span className="leading-tight">
                        Tampilkan hanya permohonan yang menunggu persetujuan
                    </span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                        id="sla-breach"
                        checked={filters.showSlaBreaches}
                        onCheckedChange={(checked) =>
                            onChange('showSlaBreaches', Boolean(checked))
                        }
                    />
                    <span className="leading-tight">
                        Prioritaskan yang melewati SLA
                    </span>
                </label>
                <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                        id="threshold"
                        checked={filters.showThresholdAlerts}
                        onCheckedChange={(checked) =>
                            onChange('showThresholdAlerts', Boolean(checked))
                        }
                    />
                    <span className="leading-tight">
                        Sorot pelanggaran threshold divisi
                    </span>
                </label>
            </div>

            <div className="flex items-center justify-end">
                <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Reset filter
                </Button>
            </div>
        </div>
    );
}
