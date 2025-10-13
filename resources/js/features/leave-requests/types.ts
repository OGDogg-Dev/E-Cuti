export type LeaveRequestStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'WAITING_APPROVAL_KEPALA'
    | 'WAITING_APPROVAL_SDM'
    | 'WAITING_APPROVAL_BOTH'
    | 'APPROVED'
    | 'FINALIZED'
    | 'REJECTED'
    | 'CANCELLED';

export type LeaveTypeCode =
    | 'TAHUNAN'
    | 'SAKIT'
    | 'MELAHIRKAN'
    | 'ALASAN_PENTING'
    | 'DLTN';

export interface LeavePolicyDefinition {
    code: LeaveTypeCode;
    name: string;
    maxDays?: number | null;
    requiresDocument: boolean;
    fractionalAllowed: boolean;
    description: string;
    sla: {
        kepalaKantorHours: number;
        sdmHours: number;
        escalationHours: number;
    };
}

export interface DivisionPolicy {
    code: string;
    name: string;
    totalMembers: number;
    minServiceThreshold: number;
}

export interface LeaveApproverState {
    role: 'KEPALA_KANTOR' | 'SDM' | 'PPK';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    actor?: string;
    delegatedTo?: string;
    dueAt?: string;
    completedAt?: string;
    note?: string;
}

export interface LeaveRequest {
    id: string;
    shortCode: string;
    employee: {
        id: string;
        name: string;
        nip: string;
        position: string;
        divisionCode: DivisionPolicy['code'];
        divisionName: string;
    };
    type: LeavePolicyDefinition;
    period: {
        startDate: string;
        endDate: string;
        workingDays: number;
        holidays: string[];
    };
    status: LeaveRequestStatus;
    submittedAt: string;
    lastUpdatedAt: string;
    sla: {
        dueAt: string;
        escalated: boolean;
    };
    approvals: LeaveApproverState[];
    thresholdImpact: {
        level: 'OK' | 'WARNING' | 'CRITICAL';
        message: string;
    };
    attachmentsRequired: boolean;
    hasSupportingDocument: boolean;
    blackoutViolation: boolean;
    notes?: string;
    attachments?: LeaveRequestAttachment[];
    document?: LeaveRequestDocument;
}

export interface LeaveRequestAttachment {
    filename: string;
    mimeType: string;
    size: number;
    url?: string | null;
    downloadable?: boolean;
}

export interface LeaveRequestDocument {
    filename: string;
    url?: string | null;
    generatedAt?: string;
    format: 'PDF' | 'DOCX';
    size?: number;
}

export interface LeaveRequestFilters {
    status: LeaveRequestStatus | 'ALL_PENDING' | 'ALL';
    division: DivisionPolicy['code'] | 'ALL';
    timeframe: 'ALL' | 'NEXT_7_DAYS' | 'NEXT_30_DAYS' | 'THIS_MONTH';
    searchTerm: string;
    showOnlyPendingApprovals: boolean;
    showSlaBreaches: boolean;
    showThresholdAlerts: boolean;
}

export interface LeaveRequestSummary {
    total: number;
    pendingApproval: number;
    approved: number;
    finalized: number;
    rejected: number;
    slaBreached: number;
    delegated: number;
    thresholdAlerts: number;
}

export interface DivisionCapacitySnapshot {
    division: DivisionPolicy['code'];
    name: string;
    totalMembers: number;
    minServiceThreshold: number;
    onLeaveCount: number;
    availableCount: number;
    loadPercentage: number;
    status: 'OK' | 'WARNING' | 'CRITICAL';
    upcomingRequests: LeaveRequest[];
}

export interface LeaveRequestDraft {
    leaveType: LeaveTypeCode;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    attachments: File[];
    halfDay: boolean;
    contactDuringLeave: string;
    delegatedApprover?: string;
    notifyTeam: boolean;
}
