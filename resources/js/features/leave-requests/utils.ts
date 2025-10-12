import {
    DIVISION_POLICIES,
    LEAVE_STATUS_LABELS,
} from './constants';
import {
    type DivisionCapacitySnapshot,
    type LeaveRequest,
    type LeaveRequestStatus,
    type LeaveRequestSummary,
} from './types';

export function formatStatusLabel(status: LeaveRequestStatus): string {
    return LEAVE_STATUS_LABELS[status];
}

export function calculateWorkingDays(
    startDate: string,
    endDate: string,
    holidays: string[] = [],
): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 0;
    }

    let total = 0;
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (cursor <= endUtc) {
        const day = cursor.getUTCDay();
        const iso = cursor.toISOString().slice(0, 10);
        if (day !== 0 && day !== 6 && !holidays.includes(iso)) {
            total += 1;
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return total;
}

export function isSlaBreached(request: LeaveRequest, referenceDate: Date): boolean {
    const due = new Date(request.sla.dueAt);
    if (Number.isNaN(due.getTime())) {
        return false;
    }

    if (!(request.status.startsWith('WAITING_') || request.status === 'SUBMITTED')) {
        return false;
    }

    return due.getTime() < referenceDate.getTime();
}

export function summarizeLeaveRequests(
    requests: LeaveRequest[],
    referenceDate: Date,
): LeaveRequestSummary {
    return requests.reduce<LeaveRequestSummary>(
        (summary, request) => {
            summary.total += 1;

            if (
                request.status === 'WAITING_APPROVAL_KEPALA' ||
                request.status === 'WAITING_APPROVAL_SDM' ||
                request.status === 'WAITING_APPROVAL_BOTH' ||
                request.status === 'SUBMITTED'
            ) {
                summary.pendingApproval += 1;
            }

            if (request.status === 'APPROVED') {
                summary.approved += 1;
            }

            if (request.status === 'FINALIZED') {
                summary.finalized += 1;
            }

            if (request.status === 'REJECTED') {
                summary.rejected += 1;
            }

            if (isSlaBreached(request, referenceDate)) {
                summary.slaBreached += 1;
            }

            if (request.approvals.some((approval) => approval.delegatedTo)) {
                summary.delegated += 1;
            }

            if (request.thresholdImpact.level !== 'OK') {
                summary.thresholdAlerts += 1;
            }

            return summary;
        },
        {
            total: 0,
            pendingApproval: 0,
            approved: 0,
            finalized: 0,
            rejected: 0,
            slaBreached: 0,
            delegated: 0,
            thresholdAlerts: 0,
        },
    );
}

function overlapsWithWindow(request: LeaveRequest, windowStart: Date, windowEnd: Date): boolean {
    const start = new Date(request.period.startDate);
    const end = new Date(request.period.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
    }
    return start <= windowEnd && end >= windowStart;
}

export function calculateDivisionCapacity(
    requests: LeaveRequest[],
    referenceDate: Date,
): DivisionCapacitySnapshot[] {
    const horizonEnd = new Date(referenceDate);
    horizonEnd.setDate(horizonEnd.getDate() + 30);

    return DIVISION_POLICIES.map((division) => {
        const upcomingRequests = requests.filter((request) => {
            if (request.employee.divisionCode !== division.code) {
                return false;
            }

            if (request.status === 'REJECTED' || request.status === 'CANCELLED') {
                return false;
            }

            return overlapsWithWindow(request, referenceDate, horizonEnd);
        });

        const onLeaveCount = upcomingRequests.length;
        const availableCount = Math.max(division.totalMembers - onLeaveCount, 0);
        const loadPercentage = division.totalMembers
            ? Math.min((onLeaveCount / division.totalMembers) * 100, 100)
            : 0;

        let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
        if (availableCount < division.minServiceThreshold) {
            status = 'CRITICAL';
        } else if (availableCount === division.minServiceThreshold) {
            status = 'WARNING';
        }

        return {
            division: division.code,
            name: division.name,
            totalMembers: division.totalMembers,
            minServiceThreshold: division.minServiceThreshold,
            onLeaveCount,
            availableCount,
            loadPercentage,
            status,
            upcomingRequests,
        };
    });
}

export function isPendingStatus(status: LeaveRequestStatus | 'ALL' | 'ALL_PENDING'): boolean {
    if (status === 'ALL_PENDING') {
        return true;
    }

    return (
        status === 'SUBMITTED' ||
        status === 'WAITING_APPROVAL_KEPALA' ||
        status === 'WAITING_APPROVAL_SDM' ||
        status === 'WAITING_APPROVAL_BOTH'
    );
}

export function isWithinTimeframe(
    request: LeaveRequest,
    timeframe: 'ALL' | 'NEXT_7_DAYS' | 'NEXT_30_DAYS' | 'THIS_MONTH',
    referenceDate: Date,
): boolean {
    if (timeframe === 'ALL') {
        return true;
    }

    const start = new Date(request.period.startDate);
    if (Number.isNaN(start.getTime())) {
        return false;
    }

    const windowStart = new Date(referenceDate);
    const windowEnd = new Date(referenceDate);

    if (timeframe === 'NEXT_7_DAYS') {
        windowEnd.setDate(windowStart.getDate() + 7);
    } else if (timeframe === 'NEXT_30_DAYS') {
        windowEnd.setDate(windowStart.getDate() + 30);
    } else {
        // THIS_MONTH
        windowStart.setDate(1);
        windowEnd.setMonth(windowStart.getMonth() + 1);
        windowEnd.setDate(0);
    }

    return overlapsWithWindow(request, windowStart, windowEnd);
}

export function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(start) +
        ' – ' +
        new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(end);
}
