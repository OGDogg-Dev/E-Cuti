# Sistem e-Cuti Kementerian Perhubungan

Implementasi modular berbasis Laravel 12 untuk mengelola pengajuan cuti, persetujuan berjenjang, dan finalisasi dokumen digital sesuai kebutuhan Kementerian Perhubungan.

## Arsitektur Direktori

```
app/
├── Enums/                # Enumerasi status cuti, flow approver, status tanda tangan
├── Http/
│   ├── Controllers/
│   │   ├── DashboardController.php
│   │   └── Leave/
│   │       ├── ApprovalController.php
│   │       └── LeaveRequestController.php
│   ├── Requests/Leave/   # Validasi form pengajuan cuti
│   └── Resources/Leave/  # Transformasi API response
├── Models/               # Entitas domain (Divisi, Kebijakan, Saldo, dll.)
├── Services/
│   ├── Dashboard/        # Ringkasan heatmap, SLA, saldo agregat
│   └── Leave/            # Kalkulasi hari kerja, workflow, saldo & threshold
└── ...
```

`database/migrations` memuat skema lengkap: RBAC, master cuti, kebijakan dinamis, saldo, permohonan, persetujuan, delegasi, kalender libur/blackout, SLA, dan audit trail.

## Fitur Utama

- **Pengajuan Cuti**: form API `/api/leave-requests` lengkap dengan unggah lampiran, perhitungan otomatis durasi hari kerja, validasi saldo, dan pengecekan threshold divisi.
- **Persetujuan Berjenjang / Paralel**: endpoint `/api/approvals/*` mengelola inbox approver, mencatat keputusan, eskalasi SLA (struktur data pada `service_levels`).
- **Finalisasi**: `LeaveRequestWorkflowService` memotong saldo, membangkitkan nomor surat resmi (`SPC/<DIV>/<SEQ>/<ROMAWI>/<TAHUN>`), QR hash, dan status tanda tangan elektronik.
- **Kebijakan Fleksibel**: `leave_policies` menyimpan matriks persetujuan, SLA, blackout, dan threshold (mis. minimum layanan divisi).
- **Delegasi & Audit**: tabel `approval_delegations` dan `audit_logs` menjaga alur delegasi saat approver cuti, serta jejak aksi.
- **Dashboard**: endpoint `/api/dashboards/*` menampilkan heatmap kehadiran, kepatuhan SLA, ringkasan saldo, serta indikator staffing divisi.

## Jalur API

| Metode | Endpoint | Deskripsi |
| ------ | -------- | --------- |
| GET    | `/api/leave-requests` | Daftar permohonan pegawai aktif |
| POST   | `/api/leave-requests` | Ajukan cuti baru + lampiran |
| GET    | `/api/approvals/inbox` | Inbox approver (Kepala Kantor/SDM/PPK) |
| POST   | `/api/approvals/{leaveRequest}/action` | Setujui/Tolak permohonan |
| GET    | `/api/dashboards/leadership` | Statistik pimpinan (heatmap, SLA, saldo) |
| GET    | `/api/dashboards/division` | Indikator kapasitas per divisi |

Semua endpoint berada di balik middleware `auth` dan terintegrasi dengan struktur RBAC (`roles`, `role_user`).

## Langkah Selanjutnya

1. Tambahkan seeder awal untuk jenis cuti, divisi, SLA, dan role default (Pegawai, Kepala Kantor, SDM, PPK, Admin, Auditor).
2. Integrasikan layanan tanda tangan elektronik (TTE) dan generator PDF (mis. Laravel Snappy) menggunakan data `document_number` & `qr_hash`.
3. Implementasikan notifikasi email/in-app & eskalasi otomatis berdasarkan konfigurasi `service_levels`.
4. Lengkapi front-end (Inertia/Vue/React) untuk form cuti, kalender tim, dan dashboard visual.

Sistem siap dikembangkan lebih lanjut untuk memenuhi seluruh alur operasional e-Cuti Kemenhub secara menyeluruh.
