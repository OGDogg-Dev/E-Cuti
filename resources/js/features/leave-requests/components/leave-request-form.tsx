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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlertTriangle, CalendarCheck2, ClipboardList, FileDown, MailCheck } from 'lucide-react';

import { LEAVE_POLICIES } from '../constants';
import { calculateWorkingDays, formatDateRange } from '../utils';
import { type LeaveRequestDraft, type LeaveTypeCode } from '../types';

interface LeaveRequestFormProps {
    className?: string;
}

type FormState = Omit<LeaveRequestDraft, 'workingDays'>;

const initialState: FormState = {
    leaveType: 'TAHUNAN',
    startDate: '',
    endDate: '',
    reason: '',
    attachments: [],
    halfDay: false,
    contactDuringLeave: '',
    delegatedApprover: '',
    notifyTeam: true,
};

function formatWorkingDays(startDate: string, endDate: string) {
    if (!startDate || !endDate) {
        return '0 hari kerja';
    }
    const days = calculateWorkingDays(startDate, endDate);
    return `${days} hari kerja`;
}

function formatSla(hours: number) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0 && remainingHours > 0) {
        return `${days} hari ${remainingHours} jam`;
    }
    if (days > 0) {
        return `${days} hari`;
    }
    return `${hours} jam`;
}

function buildDocPreviewContent(draft: LeaveRequestDraft): string {
    const attachmentsSummary = draft.attachments.length
        ? draft.attachments.map((file) => `• ${file.name || 'Lampiran tanpa nama'}`).join('\n')
        : '• Tidak ada lampiran';

    return `Permohonan Cuti Pegawai\n\n` +
        `Jenis Cuti : ${draft.leaveType}\n` +
        `Periode   : ${draft.startDate || '-'} s/d ${draft.endDate || '-'} (${draft.workingDays} hari kerja)\n` +
        `Half-day  : ${draft.halfDay ? 'Ya' : 'Tidak'}\n` +
        `Alasan    : ${draft.reason || '-'}\n\n` +
        `Kontak selama cuti : ${draft.contactDuringLeave || '-'}\n` +
        `Delegasi approver  : ${draft.delegatedApprover || '-'}\n` +
        `Notifikasi tim     : ${draft.notifyTeam ? 'Ya' : 'Tidak'}\n\n` +
        `Lampiran:\n${attachmentsSummary}\n` +
        `\nGenerated otomatis dari formulir e-Cuti.`;
}

function buildDocFileName(draft: LeaveRequestDraft): string {
    const dateSegment = draft.startDate ? draft.startDate.replace(/-/g, '') : 'draft';
    return `permohonan-cuti-${dateSegment}.doc`;
}

export function LeaveRequestForm({ className }: LeaveRequestFormProps) {
    const [formState, setFormState] = useState<FormState>(initialState);
    const [draftPreview, setDraftPreview] = useState<LeaveRequestDraft | null>(null);
    const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
    const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
    const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedPolicy = useMemo(
        () => LEAVE_POLICIES.find((policy) => policy.code === formState.leaveType),
        [formState.leaveType],
    );

    const workingDays = useMemo(
        () => calculateWorkingDays(formState.startDate, formState.endDate),
        [formState.endDate, formState.startDate],
    );

    function resetSubmissionFeedback() {
        if (submitTimeoutRef.current) {
            clearTimeout(submitTimeoutRef.current);
            submitTimeoutRef.current = null;
        }
        setSubmissionState('idle');
        setSubmissionMessage(null);
    }

    function handleChange<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
        setFormState((prev) => ({ ...prev, [key]: value }));
        if (draftPreview) {
            setDraftPreview(null);
        }
        if (submissionState !== 'idle' || submissionMessage) {
            resetSubmissionFeedback();
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        resetSubmissionFeedback();
        setDraftPreview({ ...formState, workingDays });
    }

    function handleResetForm() {
        resetSubmissionFeedback();
        setFormState(initialState);
        setDraftPreview(null);
        setDocPreviewUrl(null);
    }

    function handleEditDraft() {
        resetSubmissionFeedback();
        setDraftPreview(null);
    }

    function handleFinalizeSubmission() {
        if (!draftPreview) {
            return;
        }

        resetSubmissionFeedback();
        setSubmissionState('submitting');

        submitTimeoutRef.current = setTimeout(() => {
            setSubmissionState('success');
            setSubmissionMessage(
                'Permohonan cuti Anda telah dikirim ke SDM Admin untuk verifikasi awal. Anda akan menerima notifikasi saat status berubah.',
            );
            submitTimeoutRef.current = null;
        }, 800);
    }

    useEffect(() => {
        if (!draftPreview) {
            setDocPreviewUrl(null);
            return;
        }

        const content = buildDocPreviewContent(draftPreview);
        const blob = new Blob([content], {
            type: 'application/msword',
        });
        const url = URL.createObjectURL(blob);
        setDocPreviewUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [draftPreview]);

    useEffect(() => () => {
        if (submitTimeoutRef.current) {
            clearTimeout(submitTimeoutRef.current);
        }
    }, []);

    const submitButtonLabel =
        submissionState === 'submitting'
            ? 'Mengirim...'
            : submissionState === 'success'
                ? 'Pengajuan Terkirim'
                : 'Kirim Pengajuan Cuti';

    const disableSubmitButton = submissionState === 'submitting' || submissionState === 'success';

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('space-y-6', className)}
            aria-labelledby="leave-form-title"
        >
            <Card className="border border-sidebar-border/70 bg-card dark:border-sidebar-border/70 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle id="leave-form-title" className="text-lg">
                        Ajukan Permohonan Cuti
                    </CardTitle>
                    <CardDescription>
                        Sistem akan memvalidasi saldo, blackout window, dan threshold divisi sebelum mengirim permohonan ke approver.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <Label htmlFor="leave-type">Jenis cuti</Label>
                        <Select
                            value={formState.leaveType}
                            onValueChange={(value) => handleChange('leaveType', value as LeaveTypeCode)}
                        >
                            <SelectTrigger id="leave-type">
                                <SelectValue placeholder="Pilih jenis cuti" />
                            </SelectTrigger>
                            <SelectContent>
                                {LEAVE_POLICIES.map((policy) => (
                                    <SelectItem key={policy.code} value={policy.code}>
                                        {policy.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedPolicy && (
                            <p className="text-xs text-muted-foreground">
                                {selectedPolicy.description}
                            </p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="contact">Kontak selama cuti</Label>
                        <Input
                            id="contact"
                            placeholder="Nomor HP / email"
                            value={formState.contactDuringLeave}
                            onChange={(event) => handleChange('contactDuringLeave', event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Informasi ini akan dibagikan kepada approver dan tim untuk kebutuhan mendesak.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="start-date">Tanggal mulai</Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={formState.startDate}
                            onChange={(event) => handleChange('startDate', event.target.value)}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="end-date">Tanggal selesai</Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={formState.endDate}
                            min={formState.startDate || undefined}
                            onChange={(event) => handleChange('endDate', event.target.value)}
                        />
                        {formState.startDate && formState.endDate && (
                            <p className="text-xs text-muted-foreground">
                                {formatDateRange(formState.startDate, formState.endDate)} ({workingDays} hari kerja)
                            </p>
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <Label htmlFor="reason">Alasan cuti</Label>
                        <textarea
                            id="reason"
                            value={formState.reason}
                            onChange={(event) => handleChange('reason', event.target.value)}
                            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                            placeholder="Jelaskan alasan pengajuan dan rencana serah terima pekerjaan."
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="delegated-approver">Delegasi approver (opsional)</Label>
                        <Input
                            id="delegated-approver"
                            placeholder="Nama delegasi"
                            value={formState.delegatedApprover}
                            onChange={(event) => handleChange('delegatedApprover', event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Gunakan saat Kepala Kantor atau SDM sedang cuti/dinas sehingga tugas dialihkan otomatis.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="attachments">Lampiran pendukung</Label>
                        <Input
                            id="attachments"
                            type="file"
                            multiple
                            onChange={(event) =>
                                handleChange('attachments', event.target.files ? Array.from(event.target.files) : [])
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Format PDF/JPG/PNG. Ukuran maksimal 5 MB per file.
                        </p>
                        {selectedPolicy?.requiresDocument && (
                            <div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                <AlertTriangle className="h-4 w-4" /> Lampiran wajib untuk jenis cuti ini.
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 text-sm">
                            <Checkbox
                                checked={formState.halfDay}
                                onCheckedChange={(checked) => handleChange('halfDay', Boolean(checked))}
                            />
                            Ajukan sebagai half-day / jam-an (jika diizinkan policy)
                        </label>
                        <label className="flex items-center gap-3 text-sm">
                            <Checkbox
                                checked={formState.notifyTeam}
                                onCheckedChange={(checked) => handleChange('notifyTeam', Boolean(checked))}
                            />
                            Kirim notifikasi ke tim divisi
                        </label>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t border-sidebar-border/60 bg-muted/30 p-6 text-sm text-muted-foreground dark:border-sidebar-border/70 dark:bg-neutral-950/40">
                    {selectedPolicy && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <ClipboardList className="h-4 w-4 text-primary" /> SLA Persetujuan
                            </div>
                            <p>
                                Kepala Kantor: {formatSla(selectedPolicy.sla.kepalaKantorHours)} · SDM: {formatSla(selectedPolicy.sla.sdmHours)} · Eskalasi otomatis jika lebih dari {formatSla(selectedPolicy.sla.escalationHours)}.
                            </p>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarCheck2 className="h-4 w-4" /> Durasi pengajuan: {formatWorkingDays(formState.startDate, formState.endDate)}.
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MailCheck className="h-4 w-4" /> Notifikasi akan dikirim ke approver setelah validasi awal berhasil.
                    </div>
                </CardFooter>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetForm}
                >
                    Reset Form
                </Button>
                <Button type="submit" className="gap-2">
                    Review Permohonan
                </Button>
            </div>

            {draftPreview && (
                <Card className="border border-primary/40 bg-primary/5 dark:border-primary/40 dark:bg-primary/10">
                    <CardHeader>
                        <CardTitle className="text-base">Ringkasan Draft Permohonan</CardTitle>
                        <CardDescription>
                            Data berikut akan dikirim ke backend setelah Anda menekan tombol submit pada langkah berikutnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                        <div className="grid gap-1">
                            <span className="font-semibold text-foreground">Jenis Cuti</span>
                            <span className="text-muted-foreground">
                                {LEAVE_POLICIES.find((policy) => policy.code === draftPreview.leaveType)?.name ?? draftPreview.leaveType}
                            </span>
                        </div>
                        <div className="grid gap-1">
                            <span className="font-semibold text-foreground">Periode</span>
                            <span className="text-muted-foreground">
                                {draftPreview.startDate && draftPreview.endDate
                                    ? `${formatDateRange(draftPreview.startDate, draftPreview.endDate)} (${draftPreview.workingDays} hari kerja)`
                                    : 'Belum ditentukan'}
                            </span>
                        </div>
                        <div className="grid gap-1">
                            <span className="font-semibold text-foreground">Alasan</span>
                            <span className="text-muted-foreground whitespace-pre-wrap">
                                {draftPreview.reason || 'Belum diisi'}
                            </span>
                        </div>
                        <div className="grid gap-1">
                            <span className="font-semibold text-foreground">Lampiran</span>
                            <span className="text-muted-foreground">
                                {draftPreview.attachments.length > 0
                                    ? `${draftPreview.attachments.length} file terpilih`
                                    : 'Tidak ada lampiran'}
                            </span>
                        </div>
                        <div className="grid gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-foreground">
                                <span className="font-semibold">Draft Surat Permohonan (.DOC)</span>
                                {docPreviewUrl ? (
                                    <Button
                                        asChild
                                        size="sm"
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <a href={docPreviewUrl} download={buildDocFileName(draftPreview)}>
                                            <FileDown className="h-3.5 w-3.5" /> Unduh Draft
                                        </a>
                                    </Button>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Menyiapkan berkas .DOC...</span>
                                )}
                            </div>
                            <p className="text-muted-foreground">
                                Dokumen ini akan diteruskan ke SDM Admin dan Kepala Kantor untuk proses verifikasi dan persetujuan.
                            </p>
                        </div>
                        <Separator />
                        <p className="text-xs text-muted-foreground">
                            Pastikan kembali saldo cuti mencukupi. Sistem akan memblokir pengajuan jika saldo kurang atau melanggar blackout period.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 border-t border-primary/20 bg-primary/5 p-4 text-sm dark:border-primary/30 dark:bg-primary/20">
                        {submissionMessage && (
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300" role="status" aria-live="polite">
                                {submissionMessage}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button variant="ghost" onClick={handleEditDraft} disabled={submissionState === 'submitting'}>
                                Edit Draft
                            </Button>
                            <Button onClick={handleFinalizeSubmission} disabled={disableSubmitButton} className="gap-2">
                                <CalendarCheck2 className="h-4 w-4" /> {submitButtonLabel}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}
        </form>
    );
}
