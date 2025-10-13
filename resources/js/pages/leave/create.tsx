import AppLayout from '@/layouts/app-layout';
import { LeaveRequestForm } from '@/features/leave-requests/components/leave-request-form';
import { dashboard, leaveRequests, leaveRequestCreate } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Permohonan Cuti', href: leaveRequests().url },
    { title: 'Ajukan Cuti', href: leaveRequestCreate().url },
];

type LeaveRequestCreatePageProps = {
    leaveTypes: Array<{
        id: number;
        code: string;
        name: string;
        requires_document: boolean;
        policy_id: number | null;
    }>;
    leaveBalances: Array<{
        id: number;
        leave_type_id: number;
        leave_type_name: string | null;
        remaining: number;
        used: number;
        year: number;
    }>;
    sharedQuota?: {
        year: number;
        total: number;
        used: number;
        remaining: number;
    } | null;
    profile: {
        name: string;
        email: string;
        employee_number?: string | null;
        division?: string | null;
    };
};

export default function LeaveRequestCreatePage({ leaveTypes, leaveBalances, sharedQuota, profile }: LeaveRequestCreatePageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajukan Cuti" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-foreground">Formulir Pengajuan Cuti</h1>
                    <p className="text-sm text-muted-foreground">
                        Lengkapi data berikut. Sistem akan menghitung durasi kerja otomatis dan mengirim ke alur persetujuan yang sesuai.
                    </p>
                </div>

                <LeaveRequestForm
                    leaveTypes={leaveTypes}
                    leaveBalances={leaveBalances}
                    sharedQuota={sharedQuota ?? null}
                    profile={profile}
                />
            </div>
        </AppLayout>
    );
}
