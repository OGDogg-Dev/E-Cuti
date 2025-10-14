import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { calculateWorkingDays, formatDateRange } from '@/features/leave-requests/utils';
import { cn } from '@/lib/utils';
import { AlertTriangle, Download, Eye, FileWarning } from 'lucide-react';

type LeaveTypeOption = {
    id: number;
    code: string;
    name: string;
    requires_document: boolean;
    policy_id: number | null;
};

type LeaveBalanceSummary = {
    id: number;
    leave_type_id: number;
    leave_type_name: string | null;
    remaining: number;
    used: number;
    year: number;
};

type SharedQuotaSummary = {
    year: number;
    total: number;
    used: number;
    remaining: number;
};

type ProfileSummary = {
    name: string;
    email: string;
    employee_number?: string | null;
    division?: string | null;
};

type LeaveRequestFormProps = {
    leaveTypes: LeaveTypeOption[];
    leaveBalances: LeaveBalanceSummary[];
    sharedQuota: SharedQuotaSummary | null;
    profile: ProfileSummary;
    className?: string;
};

type SubmissionState = 'idle' | 'loading' | 'success' | 'error';

type ValidationErrors = Record<string, string[]>;

type LeaveRequestResponse = {
    id: number;
    leave_type: {
        id: number | null;
        name: string | null;
    } | null;
    start_date: string | null;
    end_date: string | null;
    duration: number;
    reason: string;
    status: string;
    employee: {
        full_name: string | null;
        email: string | null;
        nip: string | null;
        position: string | null;
        employee_type: string | null;
    };
    contact: {
        address_during_leave: string | null;
        contact_phone: string | null;
    };
    document: {
        downloadable: boolean;
        format?: string | null;
        url: string | null;
    };
};

type ConflictSuggestion = {
    start_date?: string;
    end_date?: string;
} | null;

const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
    ASN: 'ASN (Aparatur Sipil Negara)',
    PPNPN: 'PPNPN (Pegawai Pemerintah Non Pegawai Negeri)',
};

function unwrapResource<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && payload !== null && 'data' in payload) {
        return (payload as { data: T }).data;
    }

    return payload as T;
}

function getXsrfToken(): string | null {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfCookie(): Promise<string | null> {
    let token = getXsrfToken();

    if (token) {
        return token;
    }

    try {
        await fetch('/sanctum/csrf-cookie', {
            method: 'GET',
            credentials: 'include',
        });
    } catch (error) {
        console.error('Gagal memuat cookie CSRF', error);
        return null;
    }

    token = getXsrfToken();

    return token;
}

function formatEmployeeType(type?: string | null): string {
    if (!type) {
        return '-';
    }

    return EMPLOYEE_TYPE_LABELS[type] ?? type;
}

export function LeaveRequestForm({
    leaveTypes,
    leaveBalances,
    sharedQuota,
    profile,
    className,
}: LeaveRequestFormProps) {
    const [formState, setFormState] = useState({
        email: profile.email ?? '',
        employeeType: 'ASN',
        fullName: profile.name ?? '',
        nip: profile.employee_number ?? '',
        position: '',
        leaveTypeId: leaveTypes[0]?.id ? String(leaveTypes[0].id) : '',
        startDate: '',
        endDate: '',
        reason: '',
        addressDuringLeave: '',
        contactPhone: '',
        attachment: null as File | null,
    });
    const errorFieldMap: Record<keyof typeof formState, string> = {
        email: 'email',
        employeeType: 'employee_type',
        fullName: 'full_name',
        nip: 'nip',
        position: 'position',
        leaveTypeId: 'leave_type_id',
        startDate: 'start_date',
        endDate: 'end_date',
        reason: 'reason',
        addressDuringLeave: 'address_during_leave',
        contactPhone: 'contact_phone',
        attachment: 'attachment',
    };
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [reviewState, setReviewState] = useState<SubmissionState>('idle');
    const [reviewMessage, setReviewMessage] = useState<string | null>(null);
    const [reviewData, setReviewData] = useState<LeaveRequestResponse | null>(null);
    const [isDownloadingPreview, setIsDownloadingPreview] = useState(false);
    const [previewDownloadError, setPreviewDownloadError] = useState<string | null>(null);
    const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
    const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
    const [submittedRequest, setSubmittedRequest] = useState<LeaveRequestResponse | null>(null);
    const [conflictSuggestion, setConflictSuggestion] = useState<ConflictSuggestion>(null);
    const reviewSummaryRef = useRef<HTMLDivElement | null>(null);
    const finalSummaryRef = useRef<HTMLDivElement | null>(null);

    const selectedLeaveType = useMemo(() => {
        if (!formState.leaveTypeId) {
            return undefined;
        }

        return leaveTypes.find((type) => type.id === Number(formState.leaveTypeId));
    }, [formState.leaveTypeId, leaveTypes]);

    const quotaForDisplay = useMemo(() => {
        if (sharedQuota) {
            return sharedQuota;
        }

        if (!selectedLeaveType) {
            return undefined;
        }

        const balance = leaveBalances.find((entry) => entry.leave_type_id === selectedLeaveType.id);

        if (!balance) {
            return undefined;
        }

        return {
            year: balance.year,
            total: balance.remaining + balance.used,
            used: balance.used,
            remaining: balance.remaining,
        } satisfies SharedQuotaSummary;
    }, [leaveBalances, selectedLeaveType, sharedQuota]);

    const workingDays = useMemo(() => {
        if (!formState.startDate || !formState.endDate) {
            return 0;
        }

        return calculateWorkingDays(formState.startDate, formState.endDate);
    }, [formState.startDate, formState.endDate]);

    const canSubmit = reviewState === 'success' && reviewData !== null;

    useEffect(() => {
        if (reviewState === 'success' && reviewSummaryRef.current) {
            reviewSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [reviewState]);

    useEffect(() => {
        if (submissionState === 'success' && finalSummaryRef.current) {
            finalSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [submissionState]);

    function handleInputChange(key: keyof typeof formState, value: string | File | null) {
        setFormState((previous) => ({
            ...previous,
            [key]: value,
        }));
        const mappedKey = errorFieldMap[key];
        if (errors[mappedKey]) {
            setErrors((prev) => ({ ...prev, [mappedKey]: [] }));
        }
        setReviewState('idle');
        setReviewMessage(null);
        setReviewData(null);
        setPreviewDownloadError(null);
        setSubmissionMessage(null);
        setConflictSuggestion(null);
        setSubmissionState('idle');
    }

    function buildFormData(): FormData {
        const formData = new FormData();
        formData.append('email', formState.email);
        formData.append('employee_type', formState.employeeType);
        formData.append('full_name', formState.fullName);
        if (formState.nip) {
            formData.append('nip', formState.nip);
        }
        formData.append('position', formState.position);
        if (selectedLeaveType?.id) {
            formData.append('leave_type_id', String(selectedLeaveType.id));
        }
        if (selectedLeaveType?.policy_id) {
            formData.append('policy_id', String(selectedLeaveType.policy_id));
        }
        formData.append('start_date', formState.startDate);
        formData.append('end_date', formState.endDate);
        formData.append('reason', formState.reason);
        formData.append('address_during_leave', formState.addressDuringLeave);
        formData.append('contact_phone', formState.contactPhone);
        if (formState.attachment) {
            formData.append('attachment', formState.attachment);
        }

        return formData;
    }

    async function handleReview() {
        setReviewState('loading');
        setReviewMessage(null);
        setSubmissionMessage(null);
        setPreviewDownloadError(null);
        setReviewData(null);
        setErrors({});

        if (!selectedLeaveType || !selectedLeaveType.policy_id) {
            setReviewState('error');
            setErrors({
                leave_type_id: ['Kebijakan cuti tidak tersedia untuk jenis cuti ini.'],
            });
            return;
        }

        const formData = buildFormData();

        try {
            const xsrfToken = await ensureCsrfCookie();
            const response = await fetch('/api/leave-requests/review', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                },
                credentials: 'include',
                body: formData,
            });

            if (response.ok) {
                const json = await response.json();
                const payload = unwrapResource<LeaveRequestResponse>(json);
                setReviewData(payload);
                setReviewMessage('Review berhasil disiapkan. Silakan unduh formulir sebelum mengirim permohonan.');
                setReviewState('success');
                return;
            }

            if (response.status === 422) {
                const payload = await response.json();
                setErrors(payload.errors ?? {});
                setReviewMessage('Beberapa data belum valid. Mohon periksa kembali formulir.');
                setReviewState('error');
                return;
            }

            const text = await response.text();
            setReviewMessage(text || 'Gagal menyiapkan review permohonan.');
            setReviewState('error');
        } catch (error) {
            console.error(error);
            setReviewMessage('Gagal terhubung ke server saat menyiapkan review.');
            setReviewState('error');
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmissionState('loading');
        setSubmissionMessage(null);
        setErrors({});
        setSubmittedRequest(null);
        setConflictSuggestion(null);

        if (!reviewData || reviewState !== 'success') {
            setSubmissionState('error');
            setSubmissionMessage('Silakan review permohonan dan unduh formulir terlebih dahulu.');
            return;
        }

        if (!selectedLeaveType || !selectedLeaveType.policy_id) {
            setSubmissionState('error');
            setErrors({
                leave_type_id: ['Kebijakan cuti tidak tersedia untuk jenis cuti ini.'],
            });
            return;
        }

        const formData = buildFormData();

        try {
            const xsrfToken = await ensureCsrfCookie();
            const response = await fetch('/api/leave-requests', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                },
                credentials: 'include',
                body: formData,
            });

            if (response.status === 201) {
                const json = await response.json();
                const payload = unwrapResource<LeaveRequestResponse>(json);
                setSubmittedRequest(payload);
                setSubmissionMessage('Permohonan cuti berhasil dikirim dan menunggu validasi SDM.');
                setSubmissionState('success');
                return;
            }

            if (response.status === 409) {
                const payload = await response.json();
                setSubmissionMessage(payload.message ?? 'Permohonan bertentangan dengan kebijakan cuti.');
                setConflictSuggestion(payload.suggested_dates ?? null);
                setSubmissionState('error');
                return;
            }

            if (response.status === 422) {
                const payload = await response.json();
                setErrors(payload.errors ?? {});
                setSubmissionMessage('Beberapa data belum valid. Mohon periksa kembali formulir.');
                setSubmissionState('error');
                return;
            }

            const text = await response.text();
            setSubmissionMessage(text || 'Terjadi kesalahan tidak terduga saat mengirim permohonan.');
            setSubmissionState('error');
        } catch (error) {
            console.error(error);
            setSubmissionMessage('Gagal mengirim permohonan karena masalah jaringan.');
            setSubmissionState('error');
        }
    }

    async function handleDownloadPreview() {
        if (!reviewData) {
            setPreviewDownloadError('Siapkan review permohonan sebelum mengunduh formulir.');
            return;
        }

        setIsDownloadingPreview(true);
        setPreviewDownloadError(null);

        const formData = buildFormData();

        try {
            const xsrfToken = await ensureCsrfCookie();
            const response = await fetch('/api/leave-requests/review/document', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                },
                credentials: 'include',
                body: formData,
            });

            if (response.status === 422) {
                const payload = await response.json();
                setErrors(payload.errors ?? {});
                setReviewData(null);
                setReviewState('error');
                setReviewMessage('Beberapa data belum valid. Mohon lakukan review ulang sebelum mengunduh formulir.');
                setPreviewDownloadError('Beberapa data belum valid sehingga formulir tidak dapat diunduh.');
                return;
            }

            if (!response.ok) {
                const text = await response.text();
                setPreviewDownloadError(text || 'Gagal menyiapkan dokumen review.');
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `preview-formulir-cuti-${formState.startDate || 'terkini'}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            setPreviewDownloadError('Gagal terhubung ke server saat menyiapkan dokumen.');
        } finally {
            setIsDownloadingPreview(false);
        }
    }

    return (
        <div className={cn('flex flex-col gap-6', className)}>
            <Card className="border border-primary/20 bg-primary/5 dark:border-primary/30">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Sisa Kuota Cuti Tahun {new Date().getFullYear()}</CardTitle>
                    <CardDescription>
                        Informasi ini ditarik langsung dari saldo cuti yang tercatat di sistem SDM.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sharedQuota ? (
                        <div className="rounded-lg border border-primary/40 bg-background/90 p-4 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Kuota lintas jenis
                            </p>
                            <p className="text-3xl font-semibold text-primary">
                                {sharedQuota.remaining.toLocaleString('id-ID', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                hari tersisa
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total kuota {sharedQuota.total.toLocaleString('id-ID', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                hari untuk tahun {sharedQuota.year}, telah digunakan{' '}
                                {sharedQuota.used.toLocaleString('id-ID', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                hari.
                            </p>
                        </div>
                    ) : null}

                    {leaveBalances.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada saldo cuti yang terdata untuk akun ini.</p>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {leaveBalances.map((balance) => (
                                <div
                                    key={balance.id}
                                    className="rounded-lg border border-primary/30 bg-background/80 p-4 shadow-sm"
                                >
                                    <p className="text-sm font-medium text-foreground">
                                        {balance.leave_type_name ?? 'Jenis cuti'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {sharedQuota
                                            ? `Sudah digunakan ${balance.used.toLocaleString('id-ID', {
                                                  minimumFractionDigits: 0,
                                                  maximumFractionDigits: 2,
                                              })} hari`
                                            : `Sisa ${balance.remaining.toLocaleString('id-ID', {
                                                  minimumFractionDigits: 0,
                                                  maximumFractionDigits: 2,
                                              })} hari`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="leave-form-title">
                <Card className="border border-sidebar-border/60 bg-card dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle id="leave-form-title" className="text-lg">
                            Formulir Permintaan Cuti
                        </CardTitle>
                        <CardDescription>
                            Lengkapi data berikut untuk memulai proses persetujuan cuti. SDM akan memvalidasi terlebih dahulu
                            sebelum diteruskan ke Kepala Kantor.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Nama Lengkap</Label>
                            <Input
                                id="full-name"
                                value={formState.fullName}
                                onChange={(event) => handleInputChange('fullName', event.target.value)}
                                required
                                placeholder="Nama sesuai identitas"
                            />
                            {errors.full_name && (
                                <p className="text-xs text-destructive">{errors.full_name[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formState.email}
                                onChange={(event) => handleInputChange('email', event.target.value)}
                                required
                                placeholder="nama@instansi.go.id"
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employee-type">Status Pegawai</Label>
                            <Select
                                value={formState.employeeType}
                                onValueChange={(value) => handleInputChange('employeeType', value)}
                            >
                                <SelectTrigger id="employee-type">
                                    <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ASN">ASN</SelectItem>
                                    <SelectItem value="PPNPN">PPNPN</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.employee_type && (
                                <p className="text-xs text-destructive">{errors.employee_type[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nip">NIP / NRP</Label>
                            <Input
                                id="nip"
                                value={formState.nip}
                                onChange={(event) => handleInputChange('nip', event.target.value)}
                                placeholder="198701012020011001"
                            />
                            {errors.nip && <p className="text-xs text-destructive">{errors.nip[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Jabatan</Label>
                            <Input
                                id="position"
                                value={formState.position}
                                onChange={(event) => handleInputChange('position', event.target.value)}
                                required
                                placeholder="Contoh: Analis SDM"
                            />
                            {errors.position && <p className="text-xs text-destructive">{errors.position[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="leave-type">Jenis Cuti</Label>
                            <Select
                                value={formState.leaveTypeId}
                                onValueChange={(value) => handleInputChange('leaveTypeId', value)}
                            >
                                <SelectTrigger id="leave-type">
                                    <SelectValue placeholder="Pilih jenis cuti" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map((leaveType) => (
                                        <SelectItem key={leaveType.id} value={String(leaveType.id)}>
                                            {leaveType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.leave_type_id && (
                                <p className="text-xs text-destructive">{errors.leave_type_id[0]}</p>
                            )}
                            {selectedLeaveType?.requires_document && (
                                <div className="flex items-start gap-2 rounded-md border border-amber-400/60 bg-amber-100/70 p-3 text-xs text-amber-900 dark:border-amber-300/60 dark:bg-amber-900/20 dark:text-amber-100">
                                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                    Lampiran bukti wajib untuk jenis cuti ini.
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Mulai Cuti</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={formState.startDate}
                                onChange={(event) => handleInputChange('startDate', event.target.value)}
                                required
                            />
                            {errors.start_date && <p className="text-xs text-destructive">{errors.start_date[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Selesai Cuti</Label>
                            <Input
                                id="end-date"
                                type="date"
                                min={formState.startDate || undefined}
                                value={formState.endDate}
                                onChange={(event) => handleInputChange('endDate', event.target.value)}
                                required
                            />
                            {errors.end_date && <p className="text-xs text-destructive">{errors.end_date[0]}</p>}
                            {formState.startDate && formState.endDate && (
                                <p className="text-xs text-muted-foreground">
                                    {formatDateRange(formState.startDate, formState.endDate)} · {workingDays} hari kerja
                                </p>
                            )}
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="reason">Alasan Cuti</Label>
                            <textarea
                                id="reason"
                                value={formState.reason}
                                onChange={(event) => handleInputChange('reason', event.target.value)}
                                required
                                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                placeholder="Jelaskan alasan cuti dan rencana serah terima tugas."
                            />
                            {errors.reason && <p className="text-xs text-destructive">{errors.reason[0]}</p>}
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="address">Alamat Selama Cuti</Label>
                            <textarea
                                id="address"
                                value={formState.addressDuringLeave}
                                onChange={(event) => handleInputChange('addressDuringLeave', event.target.value)}
                                required
                                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                placeholder="Alamat lengkap yang dapat dihubungi selama cuti"
                            />
                            {errors.address_during_leave && (
                                <p className="text-xs text-destructive">{errors.address_during_leave[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact-phone">Nomor Telepon</Label>
                            <Input
                                id="contact-phone"
                                value={formState.contactPhone}
                                onChange={(event) => handleInputChange('contactPhone', event.target.value)}
                                required
                                placeholder="08xxxxxxxxxx"
                            />
                            {errors.contact_phone && (
                                <p className="text-xs text-destructive">{errors.contact_phone[0]}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="attachment">Lampiran Bukti</Label>
                            <Input
                                id="attachment"
                                type="file"
                                accept="application/pdf,image/jpeg,image/png"
                                onChange={(event) => handleInputChange('attachment', event.target.files?.[0] ?? null)}
                            />
                            {errors.attachment && <p className="text-xs text-destructive">{errors.attachment[0]}</p>}
                        </div>
                        {quotaForDisplay && (
                            <div className="md:col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary-900 dark:border-primary/40 dark:bg-primary/10 dark:text-primary-200">
                                {sharedQuota
                                    ? `Kuota cuti lintas jenis tersisa ${quotaForDisplay.remaining.toLocaleString('id-ID')} hari kerja untuk tahun ${quotaForDisplay.year}.`
                                    : `Sisa saldo cuti ${selectedLeaveType?.name ?? ''}: ${quotaForDisplay.remaining.toLocaleString('id-ID')} hari kerja.`}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 border-t border-sidebar-border/50 bg-muted/30 p-4 text-sm text-muted-foreground dark:border-sidebar-border/70 dark:bg-neutral-900/30">
                        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                            <span>Durasi pengajuan</span>
                            <span className="font-medium text-foreground">{workingDays} hari kerja</span>
                        </div>
                        {selectedLeaveType?.requires_document && (
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                                <FileWarning className="h-4 w-4" aria-hidden="true" /> Pastikan lampiran bukti telah sesuai.
                            </div>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                disabled={reviewState === 'loading'}
                                onClick={handleReview}
                            >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                {reviewState === 'loading' ? 'Menyiapkan Review...' : 'Review Permohonan'}
                            </Button>
                            <Button type="submit" disabled={!canSubmit || submissionState === 'loading'}>
                                {submissionState === 'loading' ? 'Mengirim...' : 'Kirim Permohonan'}
                            </Button>
                        </div>
                        {reviewMessage && (
                            <p
                                role="status"
                                className={cn(
                                    'text-sm',
                                    reviewState === 'success'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-destructive',
                                )}
                            >
                                {reviewMessage}
                            </p>
                        )}
                        {submissionMessage && (
                            <p
                                role="status"
                                className={cn(
                                    'text-sm',
                                    submissionState === 'success'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-destructive',
                                )}
                            >
                                {submissionMessage}
                            </p>
                        )}
                        {conflictSuggestion && (
                            <div className="rounded-md border border-amber-400 bg-amber-100 p-3 text-xs text-amber-900 dark:border-amber-300/60 dark:bg-amber-900/30 dark:text-amber-100">
                                Sistem menyarankan jadwal alternatif mulai {conflictSuggestion.start_date ?? '-'} hingga {conflictSuggestion.end_date ?? '-'}.
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </form>

            {reviewData && (
                <div ref={reviewSummaryRef}>
                    <Card className="border border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10">
                        <CardHeader>
                            <CardTitle className="text-base">Review Permohonan Cuti</CardTitle>
                            <CardDescription>
                                Periksa kembali detail pengajuan sebelum dikirim untuk persetujuan berjenjang.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Status</span>
                                <span className="text-muted-foreground">
                                    {reviewData.status === 'DRAFT'
                                        ? 'DRAFT · Belum diajukan'
                                        : reviewData.status}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Jenis Cuti</span>
                                <span className="text-muted-foreground">{reviewData.leave_type?.name ?? '-'}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Periode</span>
                                <span className="text-muted-foreground">
                                    {reviewData.start_date && reviewData.end_date
                                        ? `${formatDateRange(reviewData.start_date, reviewData.end_date)} · ${reviewData.duration} hari`
                                        : '-'}
                                </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-3">
                                    <span className="font-semibold text-foreground">Data Pegawai</span>
                                    <dl className="grid gap-2 text-sm">
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nama Lengkap</dt>
                                            <dd className="text-foreground">{reviewData.employee.full_name ?? '-'}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                                            <dd className="text-foreground">{reviewData.employee.email ?? '-'}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status Pegawai</dt>
                                            <dd className="text-foreground">{formatEmployeeType(reviewData.employee.employee_type)}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">NIP / NRP</dt>
                                            <dd className="text-foreground">{reviewData.employee.nip ?? '-'}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Jabatan</dt>
                                            <dd className="text-foreground">{reviewData.employee.position ?? '-'}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div className="grid gap-3">
                                    <span className="font-semibold text-foreground">Kontak Selama Menjalankan Cuti</span>
                                    <dl className="grid gap-2 text-sm">
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Alamat</dt>
                                            <dd className="text-foreground whitespace-pre-line">
                                                {reviewData.contact.address_during_leave ?? '-'}
                                            </dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nomor Telepon</dt>
                                            <dd className="text-foreground">{reviewData.contact.contact_phone ?? '-'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Alasan Cuti</span>
                                <p className="rounded-md border border-primary/20 bg-primary/10 p-3 text-muted-foreground">
                                    {reviewData.reason}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleDownloadPreview}
                                    disabled={isDownloadingPreview}
                                >
                                    <Download className="h-4 w-4" aria-hidden="true" />
                                    {isDownloadingPreview
                                        ? 'Menyiapkan Dokumen...'
                                        : 'Unduh Formulir Review (DOCX)'}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Gunakan formulir ini untuk memastikan seluruh data sudah sesuai sebelum dikirim.
                                </span>
                            </div>
                            {previewDownloadError && (
                                <p className="text-xs text-destructive">{previewDownloadError}</p>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}

            {submittedRequest && (
                <div ref={finalSummaryRef}>
                    <Card className="border border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10">
                        <CardHeader>
                            <CardTitle className="text-base">Permohonan Berhasil Dikirim</CardTitle>
                            <CardDescription>
                                Simak kembali detail yang terekam di sistem sebelum menunggu persetujuan berjenjang.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Status</span>
                                <span className="text-muted-foreground">{submittedRequest.status}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Jenis Cuti</span>
                                <span className="text-muted-foreground">{submittedRequest.leave_type?.name ?? '-'}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Periode</span>
                                <span className="text-muted-foreground">
                                    {submittedRequest.start_date && submittedRequest.end_date
                                        ? `${formatDateRange(submittedRequest.start_date, submittedRequest.end_date)} · ${submittedRequest.duration} hari`
                                        : '-'}
                                </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-3">
                                    <span className="font-semibold text-foreground">Data Pegawai</span>
                                    <dl className="grid gap-2 text-sm">
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nama Lengkap</dt>
                                            <dd className="text-foreground">{submittedRequest.employee.full_name ?? '-'}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                                            <dd className="text-foreground">{submittedRequest.employee.email ?? '-'}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status Pegawai</dt>
                                            <dd className="text-foreground">{formatEmployeeType(submittedRequest.employee.employee_type)}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">NIP / NRP</dt>
                                            <dd className="text-foreground">{submittedRequest.employee.nip ?? '-'}</dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Jabatan</dt>
                                            <dd className="text-foreground">{submittedRequest.employee.position ?? '-'}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div className="grid gap-3">
                                    <span className="font-semibold text-foreground">Kontak Selama Menjalankan Cuti</span>
                                    <dl className="grid gap-2 text-sm">
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Alamat</dt>
                                            <dd className="text-foreground whitespace-pre-line">
                                                {submittedRequest.contact.address_during_leave ?? '-'}
                                            </dd>
                                        </div>
                                        <div className="grid gap-0.5">
                                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nomor Telepon</dt>
                                            <dd className="text-foreground">{submittedRequest.contact.contact_phone ?? '-'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid gap-1">
                                <span className="font-semibold text-foreground">Alasan Cuti</span>
                                <p className="rounded-md border border-primary/20 bg-primary/10 p-3 text-muted-foreground">
                                    {submittedRequest.reason}
                                </p>
                            </div>
                            {submittedRequest.document.downloadable && submittedRequest.document.url && (
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                    <Button asChild size="sm" className="gap-2">
                                        <a href={submittedRequest.document.url} target="_blank" rel="noreferrer">
                                            <Download className="h-4 w-4" /> Unduh Formulir{' '}
                                            {(submittedRequest.document.format ?? 'PDF')}
                                        </a>
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Hanya dapat diakses oleh SDM/Admin/Kepala Kantor.
                                    </span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">
                                Salinan formulir juga tersedia di menu detail permohonan untuk monitoring proses persetujuan.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
