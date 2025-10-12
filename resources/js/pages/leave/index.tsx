import AppLayout from '@/layouts/app-layout';
import { LeaveRequestFilters } from '@/features/leave-requests/components/leave-request-filters';
import { LeaveRequestList } from '@/features/leave-requests/components/leave-request-list';
import { LeaveRequestSummary } from '@/features/leave-requests/components/leave-request-summary';
import { DivisionCapacityGrid } from '@/features/leave-requests/components/division-capacity-grid';
import { useLeaveRequestFilters } from '@/features/leave-requests/hooks/use-leave-request-filters';
import { MOCK_LEAVE_REQUESTS } from '@/features/leave-requests/data/mock';
import { dashboard, leaveRequestCreate, leaveRequests } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Permohonan Cuti',
        href: leaveRequests().url,
    },
];

export default function LeaveRequestsPage() {
    const { filters, filteredRequests, updateFilter, resetFilters, summary, divisionCapacity } =
        useLeaveRequestFilters(MOCK_LEAVE_REQUESTS);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permohonan Cuti" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold text-foreground">Permohonan Cuti</h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau status pengajuan cuti, SLA, dan risiko kapasitas divisi dalam satu tempat.
                        </p>
                    </div>
                    <ButtonLink href={leaveRequestCreate().url} />
                </div>

                <LeaveRequestSummary summary={summary} />

                <LeaveRequestFilters
                    filters={filters}
                    onChange={updateFilter}
                    onReset={resetFilters}
                />

                <LeaveRequestList requests={filteredRequests} />

                <DivisionCapacityGrid data={divisionCapacity} />
            </div>
        </AppLayout>
    );
}

function ButtonLink({ href }: { href: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
            <Plus className="h-4 w-4" /> Ajukan Cuti
        </Link>
    );
}
