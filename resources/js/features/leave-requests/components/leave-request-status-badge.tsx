import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { formatStatusLabel } from '../utils';
import { type LeaveRequestStatus } from '../types';

const VARIANTS: Record<LeaveRequestStatus, string> = {
    DRAFT: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
    SUBMITTED: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
    WAITING_APPROVAL_KEPALA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    WAITING_APPROVAL_SDM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    WAITING_APPROVAL_BOTH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    FINALIZED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
    CANCELLED: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200',
};

interface LeaveRequestStatusBadgeProps {
    status: LeaveRequestStatus;
    className?: string;
}

export function LeaveRequestStatusBadge({ status, className }: LeaveRequestStatusBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'border-transparent px-2.5 py-1 text-xs font-medium uppercase tracking-wide',
                VARIANTS[status],
                className,
            )}
        >
            {formatStatusLabel(status)}
        </Badge>
    );
}
