import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    Clock3,
    GitBranch,
    LineChart,
    ShieldCheck,
    Sparkles,
    Users2,
} from 'lucide-react';
import type { ComponentType } from 'react';

type Feature = {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
};

type WorkflowStep = {
    title: string;
    description: string;
};

type Stat = {
    value: string;
    label: string;
    description: string;
};

const features: Feature[] = [
    {
        title: 'Matriks persetujuan dinamis',
        description:
            'Rancang alur serial atau paralel dengan delegasi otomatis, kompatibel dengan struktur organisasi dan kebutuhan audit.',
        icon: GitBranch,
    },
    {
        title: 'Kontrol SLA dan beban divisi',
        description:
            'Pantau SLA setiap tahap, kapasitas cuti per divisi, dan trigger eskalasi sebelum beban kerja kritis tercapai.',
        icon: Clock3,
    },
    {
        title: 'Integrasi data keseimbangan cuti',
        description:
            'Sinkronkan saldo cuti, carry-over, dan penyesuaian otomatis sehingga karyawan dan SDM memiliki satu sumber kebenaran.',
        icon: LineChart,
    },
    {
        title: 'Keamanan dan kepatuhan',
        description:
            'Setiap dokumen cuti dilengkapi QR hash, log aktivitas granular, dan penetapan akses berbasis peran.',
        icon: ShieldCheck,
    },
];

const stats: Stat[] = [
    {
        value: '350+',
        label: 'Permohonan / bulan',
        description: 'Diproses tanpa bottleneck melalui matriks persetujuan otomatis.',
    },
    {
        value: '92%',
        label: 'Tingkat kepuasan',
        description: 'Karyawan puas karena transparansi status dan notifikasi real-time.',
    },
    {
        value: '< 4 jam',
        label: 'Rata-rata SLA',
        description: 'Waktu respon rata-rata turun drastis dengan pengingat dan eskalasi cerdas.',
    },
];

const workflow: WorkflowStep[] = [
    {
        title: 'Konfigurasi kebijakan',
        description:
            'Import tipe cuti, kuota, blackout period, dan approval matrix yang sudah disediakan pada paket implementasi.',
    },
    {
        title: 'Aktifkan divisi & role',
        description:
            'Hubungkan kepala divisi, SDM, dan delegasi persetujuan. Saldo cuti bawaan dapat diimpor atau gunakan seeder awal.',
    },
    {
        title: 'Luncurkan & pantau',
        description:
            'Karyawan mengajukan cuti, sistem mengawal SLA dan memberikan insight kapasitas secara real-time.',
    },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth.user);
    const primaryCta = isAuthenticated ? dashboard() : register();
    const secondaryCta = isAuthenticated ? dashboard() : login();
    const currentYear = new Date().getFullYear();

    return (
        <>
            <Head title="Sistem e-Cuti">
                <meta
                    name="description"
                    content="Modernisasi pengelolaan cuti dengan matriks persetujuan dinamis, SLA terukur, dan arsip digital siap audit."
                />
            </Head>
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-50">
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.32),_transparent_70%)] blur-3xl" />
                    <div className="absolute left-1/2 top-1/2 h-96 w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
                </div>
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-6 lg:py-10">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/80">
                                Sistem e-Cuti
                            </p>
                            <h1 className="text-lg font-semibold text-white">PT Mandiri Digital Nusantara</h1>
                        </div>
                    </div>
                    <nav className="flex items-center gap-3 text-sm">
                        {isAuthenticated ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                                prefetch
                            >
                                <CalendarCheck className="h-4 w-4" /> Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-flex items-center gap-2 rounded-full border border-transparent px-5 py-2 font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
                                    prefetch
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                                    prefetch
                                >
                                    Buat akun
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 px-6 pb-16">
                    <section className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
                        <div className="space-y-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
                                Terintegrasi end-to-end
                            </span>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                                    Kelola cuti secara gesit dengan transparansi penuh dan kendali SLA real-time.
                                </h2>
                                <p className="max-w-2xl text-base leading-relaxed text-slate-300">
                                    e-Cuti menyatukan kebutuhan karyawan, kepala divisi, dan SDM dalam satu workspace. Pengajuan, persetujuan, hingga arsip digital berjalan otomatis dengan insight kapasitas divisi dan eskalasi terukur.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link
                                    href={primaryCta}
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
                                    prefetch
                                >
                                    <Sparkles className="h-4 w-4" /> Mulai sekarang
                                </Link>
                                <Link
                                    href={secondaryCta}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
                                    prefetch
                                >
                                    Lihat cara kerja sistem →
                                </Link>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {stats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur transition hover:border-emerald-400/30 hover:bg-emerald-400/10"
                                    >
                                        <p className="text-2xl font-semibold text-white">{stat.value}</p>
                                        <p className="text-sm font-medium text-emerald-200/90">{stat.label}</p>
                                        <p className="mt-2 text-xs text-slate-300">{stat.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_-60px_rgba(16,185,129,0.6)] backdrop-blur">
                            <div className="absolute -right-12 -top-16 hidden h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl lg:block" />
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-white">
                                    Monitor SLA, kapasitas, dan delegasi dalam satu tampilan ringkas.
                                </h3>
                                <p className="text-sm text-slate-300/90">
                                    Dashboard operasional menampilkan status permohonan, jalur persetujuan aktif, dan dampak kapasitas per divisi. Insight ini memudahkan pengambilan keputusan sebelum bottleneck terjadi.
                                </p>
                                <ul className="space-y-4 text-sm text-slate-200">
                                    <li className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                        <span>Audit trail digital dengan hash QR untuk setiap dokumen cuti dan tanda tangan elektronik.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Users2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                        <span>Delegasi otomatis saat pejabat cuti, memastikan tidak ada permohonan yang terlewat.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CalendarCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                        <span>Integrasi kalender blackout dan jadwal penting untuk menjaga layanan kritikal tetap berjalan.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-10">
                        <div className="max-w-3xl space-y-3">
                            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-200/80">
                                Fitur utama
                            </p>
                            <h3 className="text-3xl font-bold text-white sm:text-4xl">
                                Landasan operasional cuti yang siap diaudit dan mudah diadopsi.
                            </h3>
                            <p className="text-base text-slate-300">
                                Susun kebijakan, jalankan proses persetujuan, dan dokumentasikan seluruh lifecycle cuti tanpa meninggalkan platform.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {features.map((feature) => (
                                <article
                                    key={feature.title}
                                    className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
                                >
                                    <feature.icon className="mb-4 h-10 w-10 text-emerald-300 transition group-hover:scale-110" />
                                    <h4 className="text-xl font-semibold text-white">{feature.title}</h4>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-200">{feature.description}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
                        <div className="space-y-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-emerald-200/80">
                                Alur implementasi
                            </p>
                            <h3 className="text-3xl font-bold text-white sm:text-4xl">
                                Mulai produksi dalam hitungan hari, bukan minggu.
                            </h3>
                            <p className="text-base text-slate-300">
                                Ikuti tiga langkah terukur untuk mengaktifkan e-Cuti dan pastikan setiap pemangku kepentingan mendapatkan pengalaman terbaik sejak hari pertama.
                            </p>
                            <div className="space-y-6">
                                {workflow.map((step, index) => (
                                    <div key={step.title} className="flex gap-4">
                                        <span className="mt-1 flex size-9 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-sm font-semibold text-emerald-200">
                                            {index + 1}
                                        </span>
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-semibold text-white">{step.title}</h4>
                                            <p className="text-sm leading-relaxed text-slate-200">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 p-8 shadow-[0_40px_120px_-80px_rgba(15,118,110,0.6)]">
                            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
                            <div className="relative space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                                    Kolaborasi lintas divisi
                                </div>
                                <h4 className="text-lg font-semibold text-white">
                                    Satu platform untuk karyawan, kepala divisi, dan tim SDM.
                                </h4>
                                <p className="text-sm text-slate-300">
                                    Notifikasi cerdas, insight kapasitas, dan laporan kepatuhan tersedia real-time sehingga koordinasi lintas unit tidak lagi terhambat spreadsheet manual.
                                </p>
                                <ul className="space-y-4 text-sm text-slate-200">
                                    <li className="flex items-start gap-3">
                                        <Users2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                        <span>Portal karyawan dengan histori cuti, bukti dokumen, dan status persetujuan terkini.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                        <span>Reminder SLA otomatis dan eskalasi ke atasan ketika tenggat kritis mendekat.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <LineChart className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                        <span>Laporan harian dan bulanan siap unduh untuk kebutuhan audit serta rapat manajemen.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-10 text-slate-900 shadow-[0_40px_120px_-80px_rgba(16,185,129,0.8)] dark:text-white">
                        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-emerald-500/30 to-transparent lg:block" />
                        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
                            <div className="space-y-4">
                                <h4 className="text-3xl font-bold leading-tight">
                                    Siap memodernisasi proses cuti di organisasi Anda?
                                </h4>
                                <p className="text-base leading-relaxed text-emerald-950/80 dark:text-emerald-100">
                                    Gunakan dataset seeder bawaan untuk langsung mencoba alur produksi: tipe cuti, divisi, peran, saldo awal, hingga contoh permohonan lengkap dengan persetujuan multi-level.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 text-sm">
                                <Link
                                    href={primaryCta}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-emerald-700 transition hover:bg-slate-100"
                                    prefetch
                                >
                                    <CalendarCheck className="h-4 w-4" /> Masuk ke dashboard
                                </Link>
                                <Link
                                    href={secondaryCta}
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                                    prefetch
                                >
                                    Hubungi tim implementasi
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-6 text-xs text-slate-400">
                    © {currentYear} PT Mandiri Digital Nusantara · Sistem e-Cuti.
                </footer>
            </div>
        </>
    );
}
