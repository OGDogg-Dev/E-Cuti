import AppLayout from '@/layouts/app-layout';
import { ApprovalQueueTable } from '@/features/approvals/components/approval-queue-table';
import { MOCK_LEAVE_REQUESTS } from '@/features/leave-requests/data/mock';
import { type LeaveRequest } from '@/features/leave-requests/types';
import { approvalsInbox, dashboard, leaveRequests } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Permohonan Cuti', href: leaveRequests().url },
    { title: 'Antrian Persetujuan', href: approvalsInbox().url },
];

function isPendingForApproval(request: LeaveRequest) {
    return (
        request.status === 'SUBMITTED' ||
        request.status === 'WAITING_APPROVAL_KEPALA' ||
        request.status === 'WAITING_APPROVAL_SDM' ||
        request.status === 'WAITING_APPROVAL_BOTH'
    );
}

export default function ApprovalsInboxPage() {
    const pendingRequests = useMemo(
        () =>
            MOCK_LEAVE_REQUESTS.filter(isPendingForApproval).sort(
                (a, b) => new Date(a.sla.dueAt).getTime() - new Date(b.sla.dueAt).getTime(),
            ),
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Antrian Persetujuan" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-foreground">Antrian Persetujuan</h1>
                    <p className="text-sm text-muted-foreground">
                        Lihat permohonan yang menunggu aksi Anda atau delegasi agar SLA dan layanan tetap terjaga.
                    </p>
                </div>

                <ApprovalQueueTable requests={pendingRequests} />
            </div>
        </AppLayout>
    );
}
