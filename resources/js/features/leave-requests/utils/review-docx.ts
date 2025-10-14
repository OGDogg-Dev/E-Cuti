import {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

type ParagraphAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];

export interface ReviewEmployee {
    full_name?: string | null;
    email?: string | null;
    employee_type?: string | null;
    nip?: string | null;
    position?: string | null;
    unit_name?: string | null;
    city?: string | null;
}

export interface ReviewContact {
    address_during_leave?: string | null;
    contact_phone?: string | null;
}

export interface ReviewLeaveType {
    id?: number | null;
    code?: string | null;
    name?: string | null;
}

export interface ReviewLeaveTypeOption {
    id?: number | null;
    code?: string | null;
    name: string;
}

export interface ReviewData {
    status?: string | null;
    leave_type?: ReviewLeaveType | null;
    start_date?: string | null;
    end_date?: string | null;
    duration?: number | null;
    reason?: string | null;
    employee: ReviewEmployee;
    contact: ReviewContact;
    supervisor_name?: string | null;
    supervisor_nip?: string | null;
    supervisor_position?: string | null;
    supervisor_division?: string | null;
}

export interface ReviewDocxOptions {
    leaveTypes?: ReviewLeaveTypeOption[];
}

const ID_MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

function normalise(value: string | null | undefined): string | null {
    return value ? value.toLowerCase().trim() : null;
}

function parseISO(input?: string | null): Date | undefined {
    if (!input) {
        return undefined;
    }

    const parsed = new Date(input);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDate(date?: Date): string {
    if (!date) {
        return '-';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = ID_MONTHS[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

function formatRange(start?: string | null, end?: string | null): string {
    const startDate = parseISO(start);
    const endDate = parseISO(end);

    if (!startDate || !endDate) {
        return '-';
    }

    return `${formatDate(startDate)} s.d. ${formatDate(endDate)}`;
}

function paragraph(text: string, options: Partial<{ bold: boolean; italics: boolean; align: ParagraphAlignment }> = {}) {
    return new Paragraph({
        alignment: options.align,
        spacing: { after: 120 },
        children: [
            new TextRun({
                text,
                bold: options.bold ?? false,
                italics: options.italics ?? false,
            }),
        ],
    });
}

function tableRow(label: string, value: string) {
    return new TableRow({
        children: [
            new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                children: [paragraph(label)],
            }),
            new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                children: [paragraph(`: ${value}`)],
            }),
        ],
    });
}

function checkboxLine(active: boolean, label: string) {
    return paragraph(`${active ? '☑' : '☐'} ${label}`);
}

function buildLeaveTypeParagraphs(review: ReviewData, options: ReviewDocxOptions): Paragraph[] {
    const defaultLeaveTypes: ReviewLeaveTypeOption[] = [
        { name: 'Cuti Tahunan' },
        { name: 'Cuti Sakit' },
        { name: 'Cuti Karena Alasan Penting' },
        { name: 'Cuti Besar' },
        { name: 'Cuti Melahirkan' },
        { name: 'Cuti di Luar Tanggungan Negara' },
    ];

    const available = options.leaveTypes
        ?.filter((type): type is ReviewLeaveTypeOption => Boolean(type?.name?.trim()))
        .map((type) => ({
            id: type.id ?? null,
            code: type.code ?? null,
            name: type.name.trim(),
        }));

    const leaveTypes = available && available.length > 0 ? available : defaultLeaveTypes;

    const selectedId = review.leave_type?.id ?? null;
    const selectedCode = normalise(review.leave_type?.code);
    const selectedName = normalise(review.leave_type?.name);

    return leaveTypes.map((type) => {
        const isSelected =
            (selectedId !== null && type.id !== null && Number(type.id) === Number(selectedId)) ||
            (!!selectedCode && !!type.code && normalise(type.code) === selectedCode) ||
            (!!selectedName && normalise(type.name) === selectedName);

        return checkboxLine(isSelected, type.name);
    });
}

export async function downloadReviewDocx(review: ReviewData, options: ReviewDocxOptions = {}) {
    const leaveTypeName = review.leave_type?.name ?? '-';
    const employeeName = review.employee?.full_name ?? '-';
    const employeeNip = review.employee?.nip ?? '-';
    const employeePosition = review.employee?.position ?? '-';
    const employeeUnit = review.employee?.unit_name ?? '-';
    const employeeEmail = review.employee?.email ?? '-';
    const employeeStatus = review.employee?.employee_type ?? '-';
    const employeeCity = review.employee?.city ?? 'Surakarta';
    const reason = review.reason ?? '-';
    const leaveAddress = review.contact?.address_during_leave ?? '-';
    const leavePhone = review.contact?.contact_phone ?? '-';
    const duration = `${review.duration ?? 0} hari`;
    const period = formatRange(review.start_date, review.end_date);
    const today = new Date();

    const employeeTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            tableRow('Nama', employeeName),
            tableRow('NIP / NRP', employeeNip),
            tableRow('Jabatan', employeePosition),
            tableRow('Masa Kerja', '—'),
            tableRow('Unit Kerja', employeeUnit),
            tableRow('Email', employeeEmail),
            tableRow('Status Pegawai', employeeStatus),
        ],
    });

    const contactTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [tableRow('Alamat', leaveAddress), tableRow('Telp.', leavePhone)],
    });

    const applicantSignature = [
        paragraph('Hormat saya,', { align: AlignmentType.RIGHT }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
            children: [
                new TextRun({
                    text: `(${employeeName})\nNIP. ${employeeNip}`,
                }),
            ],
        }),
    ];

    const supervisorBlock = [
        paragraph('VII. PERTIMBANGAN ATASAN LANGSUNG', { bold: true }),
        paragraph('DISETUJUI     PERUBAHAN     DITANGGUHKAN     TIDAK DISETUJUI'),
        paragraph('\n\n\n\n'),
        paragraph(review.supervisor_position ?? 'Kepala Kantor', { align: AlignmentType.LEFT }),
        paragraph(review.supervisor_name ?? 'Kepala Kantor', { align: AlignmentType.LEFT }),
        paragraph(`NIP. ${review.supervisor_nip ?? '—'}`, { align: AlignmentType.LEFT }),
    ];

    const decisionBlock = [
        paragraph('VIII. KEPUTUSAN YANG BERWENANG MEMBERIKAN CUTI', { bold: true }),
        paragraph('DISETUJUI     PERUBAHAN     DITANGGUHKAN     TIDAK DISETUJUI'),
        paragraph('\n\n\n\n'),
        paragraph(review.supervisor_position ?? 'Kepala Kantor', { align: AlignmentType.LEFT }),
        paragraph(review.supervisor_name ?? 'Kepala Kantor', { align: AlignmentType.LEFT }),
        paragraph(`NIP. ${review.supervisor_nip ?? '—'}`, { align: AlignmentType.LEFT }),
    ];

    const coverLetter = [
        paragraph(`${employeeCity}, ${formatDate(today)}`, { align: AlignmentType.RIGHT }),
        paragraph('Lampiran : 1 (satu) lembar'),
        paragraph('Perihal    : Permohonan Cuti'),
        paragraph('\nYth.'),
        paragraph(review.employee?.unit_name ?? 'Kepala Kantor', { bold: true }),
        paragraph(`di-\n${employeeCity.toUpperCase()}`),
        paragraph('\nDengan hormat,'),
        paragraph('Yang bertandatangan di bawah ini:'),
        paragraph(`Nama        : ${employeeName}`),
        paragraph(`NIP/NRP     : ${employeeNip}`),
        paragraph(`Jabatan     : ${employeePosition}`),
        paragraph(`Unit Kerja  : ${employeeUnit}`),
        paragraph(`\nDengan ini mengajukan permohonan ${leaveTypeName.toLowerCase()} selama ${duration} terhitung ${period}.`),
        paragraph(`Alamat selama melaksanakan cuti: ${leaveAddress} (${leavePhone}).`),
        paragraph('Demikian permohonan ini saya sampaikan. Atas perhatian dan kebijaksanaannya, saya ucapkan terima kasih.'),
        paragraph('\nHormat saya,'),
        new Paragraph({ spacing: { before: 400 } }),
        paragraph(employeeName, { bold: true }),
    ];

    const document = new Document({
        sections: [
            {
                properties: {},
                children: [
                    paragraph(`${employeeCity}, ${formatDate(today)}`, { align: AlignmentType.RIGHT }),
                    paragraph('Kepada Yth. Kepala Kantor'),
                    paragraph(`di ${employeeCity}`),
                    new Paragraph({
                        text: 'FORMULIR PERMINTAAN DAN PEMBERIAN CUTI ASN',
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    paragraph('I. DATA PEGAWAI', { bold: true }),
                    employeeTable,
                    paragraph('\nII. JENIS CUTI YANG DIAMBIL', { bold: true }),
                    ...buildLeaveTypeParagraphs(review, options),
                    paragraph('\nIII. ALASAN CUTI', { bold: true }),
                    paragraph(reason),
                    paragraph('\nIV. LAMANYA CUTI', { bold: true }),
                    paragraph(`Selama: ${duration}`),
                    paragraph(`Periode: ${period}`),
                    paragraph('\nV. CATATAN CUTI', { bold: true }),
                    paragraph('(Diisi pejabat kepegawaian, N / N-1 / N-2 jika diperlukan)'),
                    paragraph('\nVI. ALAMAT SELAMA MENJALANKAN CUTI', { bold: true }),
                    contactTable,
                    ...applicantSignature,
                    paragraph('\n'),
                    ...supervisorBlock,
                    paragraph('\n'),
                    ...decisionBlock,
                ],
            },
            {
                properties: {},
                children: coverLetter,
            },
        ],
    });

    const blob = await Packer.toBlob(document);
    const filename = `Formulir_Review_Cuti_${employeeName.replace(/\s+/g, '_') || 'Pegawai'}.docx`;

    saveAs(blob, filename);
}
