import { useMemo, useState } from 'react';

import { TIMEFRAME_OPTIONS } from '../constants';
import {
    calculateDivisionCapacity,
    isPendingStatus,
    isSlaBreached,
    isWithinTimeframe,
    summarizeLeaveRequests,
} from '../utils';
import {
    type DivisionCapacitySnapshot,
    type LeaveRequest,
    type LeaveRequestFilters,
    type LeaveRequestStatus,
    type LeaveRequestSummary,
} from '../types';

const DEFAULT_FILTERS: LeaveRequestFilters = {
    status: 'ALL',
    division: 'ALL',
    timeframe: 'NEXT_30_DAYS',
    searchTerm: '',
    showOnlyPendingApprovals: false,
    showSlaBreaches: false,
    showThresholdAlerts: false,
};

export function useLeaveRequestFilters(requests: LeaveRequest[]) {
    const [filters, setFilters] = useState<LeaveRequestFilters>(DEFAULT_FILTERS);
    const referenceDate = useMemo(() => new Date(), []);

    const summary: LeaveRequestSummary = useMemo(
        () => summarizeLeaveRequests(requests, referenceDate),
        [requests, referenceDate],
    );

    const divisionCapacity: DivisionCapacitySnapshot[] = useMemo(
        () => calculateDivisionCapacity(requests, referenceDate),
        [requests, referenceDate],
    );

    const filteredRequests = useMemo(() => {
        const activeStatuses: LeaveRequestStatus[] | 'ALL' =
            filters.status === 'ALL_PENDING'
                ? ['SUBMITTED', 'WAITING_APPROVAL_KEPALA', 'WAITING_APPROVAL_SDM', 'WAITING_APPROVAL_BOTH']
                : filters.status === 'ALL'
                  ? 'ALL'
                  : [filters.status];

        return requests.filter((request) => {
            if (
                activeStatuses !== 'ALL' &&
                !activeStatuses.includes(request.status as LeaveRequestStatus)
            ) {
                return false;
            }

            if (
                filters.division !== 'ALL' &&
                request.employee.divisionCode !== filters.division
            ) {
                return false;
            }

            if (filters.searchTerm.trim()) {
                const needle = filters.searchTerm.trim().toLowerCase();
                const haystack = `${request.employee.name} ${request.employee.nip} ${request.type.name} ${request.shortCode}`.toLowerCase();
                if (!haystack.includes(needle)) {
                    return false;
                }
            }

            if (
                filters.showOnlyPendingApprovals &&
                !isPendingStatus(request.status)
            ) {
                return false;
            }

            if (
                filters.showSlaBreaches &&
                !isSlaBreached(request, referenceDate)
            ) {
                return false;
            }

            if (
                filters.showThresholdAlerts &&
                request.thresholdImpact.level === 'OK'
            ) {
                return false;
            }

            if (!isWithinTimeframe(request, filters.timeframe, referenceDate)) {
                return false;
            }

            return true;
        });
    }, [filters, referenceDate, requests]);

    function updateFilter<Key extends keyof LeaveRequestFilters>(
        key: Key,
        value: LeaveRequestFilters[Key],
    ) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    function resetFilters() {
        setFilters(DEFAULT_FILTERS);
    }

    return {
        filters,
        setFilters,
        summary,
        divisionCapacity,
        filteredRequests,
        updateFilter,
        resetFilters,
        timeframeOptions: TIMEFRAME_OPTIONS,
    } as const;
}
