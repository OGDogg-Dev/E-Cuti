# Sistem e‑Cuti — Spesifikasi Teknis

Dokumen ini menjelaskan **fitur** dan **alur kerja** e‑Cuti serta spesifikasi teknis inti agar dapat diimplementasikan langsung oleh coding agent. Fokus mencakup: alur persetujuan **Kepala Kantor & SDM**, dukungan **11 divisi**, surat **PDF + QR/TTE**, **SLA & eskalasi**, kebijakan cuti Indonesia (umum), keamanan & audit.

> Zona waktu default: **Asia/Jakarta**. Simpan waktu di DB dalam UTC + kolom `tz` untuk preferensi tampilan.

---

## 1) Ringkasan & Lingkup
- Tujuan: pengajuan → validasi → persetujuan → potong saldo → terbit surat → arsip + audit.
- Peran inti: **Pegawai**, **Kepala Kantor**, **SDM (HR)**, **PPK** (opsional), **Admin Sistem**, **Auditor**.
- Divisi yang didukung:
  1) SDM  2) Perencana Program  3) Aset BMN  4) Kepengusahaan  5) Keuangan  
  6) Humas & Umum  7) Sarana & Digital  8) Prasarana  9) WASDAL  10) K3  11) Kebersihan

Arsitektur referensi: Frontend SPA + PWA, Backend REST, DB PostgreSQL, Storage S3‑compatible, Queue/Jobs (Redis).

---

## 2) Fitur Utama

### A. Pegawai
- **Pengajuan Cuti**: pilih jenis, rentang tanggal, alasan, unggah lampiran.
- **Hitung Durasi Otomatis**: abaikan akhir pekan & hari libur nasional/cuti bersama.
- **Validasi Awal**: saldo cukup, tidak melanggar **blackout** & **threshold divisi**.
- **Kalender Divisi**: lihat bentrok tim; indikator kapasitas (merah/kuning/hijau).
- **Status Real‑time**: SUBMITTED → menunggu Kepala Kantor/SDM → APPROVED/REJECTED.
- **Riwayat & Unduh**: **Surat Persetujuan Cuti (PDF)** (nomor dinas + QR).

### B. Approver (Kepala Kantor, SDM, PPK opsional)
- **Kotak Masuk Persetujuan**: approve/reject + catatan.
- **Indikator Kapasitas**: warning bila melanggar minimum layanan divisi.
- **Delegasi**: alihkan tugas saat approver cuti/dinas.
- **SLA & Reminder**: pengingat otomatis; **auto‑escalate** saat lewat SLA.

### C. SDM (HR)
- **Jenis & Kebijakan Cuti**: tahunan, sakit, melahirkan, alasan penting, DLTN; **prorata**, **carry‑over** (dengan kedaluwarsa), opsi **half‑day/jam‑an**.
- **Matriks Persetujuan**: **Serial** (Kepala Kantor → SDM → PPK opsional) atau **Paralel AND** (Kepala Kantor & SDM harus setuju).
- **Hari Libur & Blackout**: kelola libur nasional/cuti bersama dan periode kritis (mis. akhir bulan Keuangan).
- **Manajemen Saldo**: grant/adjust saldo; audit trail.
- **Finalisasi**: validasi akhir, potong saldo, terbit surat PDF, set TTE/QR.

### D. Dokumen & Keabsahan
- **Surat PDF Bernomor** (format nomor dinas, mis. `SPC/KEU/0012/VII/2025`).
- **TTE** (opsional, status `SIGNED/PENDING/FAILED`).
- **QR Verifikasi**: scan membuka endpoint verifikasi yang menampilkan metadata dokumen & status validitas.

### E. Notifikasi & Eskalasi
- Email/in‑app untuk: pengajuan, menunggu persetujuan, approved/rejected, reminder SLA.
- **Auto‑escalate** ke delegasi/atasan saat melebihi SLA.

### F. Dashboard & Laporan
- **Pimpinan**: heatmap cuti, beban layanan per divisi, kepatuhan SLA.
- **SDM**: saldo agregat, tren pemakaian, pelanggaran threshold, ekspor CSV/XLSX.
- **Divisi**: kalender tim & prediksi under‑staffed.

### G. Keamanan & Audit
- **RBAC** (Pegawai, Kepala Kantor, SDM, PPK, Admin, Auditor).
- **Audit Trail** semua aksi (approve/reject/override), validasi MIME lampiran, enkripsi data sensitif.

---

## 3) Alur Kerja (Workflow)

### 0) Persiapan (SDM/Admin)
1. Konfigurasi **jenis cuti** & **policy** per divisi (flow, SLA, blackout, threshold).
2. Input/sinkron **hari libur** dan **roster** kapasitas (bila pakai shift).
3. Muat **saldo awal** per pegawai per tahun/jenis (termasuk carry‑over).

### 1) Pengajuan (Pegawai)
1. Isi form (jenis, tanggal, alasan, lampiran).  
2. Sistem menghitung **durasi kerja** (`start..end` tanpa weekend/holiday).  
3. Validasi saldo, dokumen wajib, **threshold divisi** & **blackout**.  
4. Jika lolos → `SUBMITTED` → dirutekan sesuai flow:
   - **Serial**: `WAITING_APPROVAL_KEPALA`.
   - **Paralel AND**: `WAITING_APPROVAL_BOTH` (dua aktor sekaligus).

### 2) Persetujuan (Serial – default)
**Tahap 1 – Kepala Kantor**: cek operasional & bentrok → **Approve** (lanjut ke SDM) / **Reject** (selesai).  
**Tahap 2 – SDM**: cek kebijakan & dokumen; **Approve** → `APPROVED` (picu finalisasi) / **Reject**.

**SLA & Delegasi**: reminder → eskalasi ke delegasi/atasan saat lewat SLA; approver dapat mengatur delegasi saat berhalangan.

### 3) Persetujuan (Paralel AND – opsional)
Kepala Kantor **dan** SDM harus approve; bila salah satu reject → `REJECTED`.

### 4) Finalisasi (otomatis setelah Approved)
1. **Lock & potong saldo** (prioritaskan carry‑over bila ada).  
2. **Terbitkan PDF**: nomor dinas, QR hash, render PDF; (opsional) panggil **TTE** dan simpan status.  
3. Notifikasi ke pegawai + tautan unduh PDF.  
4. Status → `FINALIZED`.

### 5) Kasus Khusus
- **Edit pengajuan** saat pending → **reset** seluruh approval.  
- **Batalkan** sebelum disetujui → `CANCELLED`.  
- **Finalisasi gagal** (saldo berubah karena race) → minta koreksi/penjadwalan ulang.  
- **Threshold dilanggar** (mis. Keuangan akhir bulan) → API `409` + saran tanggal alternatif.

### 6) Status Lifecycle
```
DRAFT → SUBMITTED → 
 (Serial) WAITING_APPROVAL_KEPALA → WAITING_APPROVAL_SDM → APPROVED → FINALIZED
 (Parallel) WAITING_APPROVAL_BOTH → APPROVED → FINALIZED
REJECTED | CANCELLED
```

---

## 4) Kebijakan & Jenis Cuti (contoh)
- **Tahunan** (kuota tahunan, prorata, carry‑over kadaluarsa).
- **Sakit** (lampiran surat dokter jika > X hari).
- **Melahirkan/Kehamilan** (durasi sesuai kebijakan).
- **Alasan Penting** (dukacita/keluarga; butuh bukti).
- **DLTN** (otorisasi tinggi/PPK).  
- **Parsial**: half‑day/jam‑an (opsional per `leave_type.fractional_allowed`).

**Contoh Policy (JSON)**
```json
{
  "mode": "serial",
  "levels": [
    {"role": "KEPALA_KANTOR", "sla_hours": 48, "on_timeout": "ESCALATE"},
    {"role": "SDM", "sla_hours": 48, "on_timeout": "ESCALATE"}
  ],
  "required_docs": [
    {"when": {"type": "SAKIT", "min_days": 3}, "doc_types": ["surat_dokter"]}
  ]
}
```

---

## 5) Threshold & Blackout per Divisi (ringkas)
- **Keuangan**: min 80% hadir saat akhir bulan/tahun, **blackout** `CUT_OFF`.
- **Aset BMN**: min 50% hadir saat **stock opname/rekonsiliasi**.
- **SDM**: minimal 1 admin aktif setiap hari kerja.
- **Humas & Umum**: selalu ada **front desk** saat jam layanan.
- **Sarana & Digital**: minimal 1 **on‑call** (role kritis: DBA/Network).
- **K3**: min 1 petugas **bersertifikat** on‑duty.
- **Kebersihan**: semua slot **shift** (pagi/siang/sore) terisi.
- **Perencana Program/WASDAL/Prasarana/Kepengusahaan**: atur **blackout** fase proyek, **coverage** inspeksi, dan **min staff** layanan.
> Implementasi: tolak pengajuan yang menurunkan `available < required`; berikan saran tanggal alternatif.

---

## 6) Data Model (tabel inti)
- `divisions`, `employees` (dengan `manager_id`), `holidays`
- `leave_types`, `leave_policies` (policy JSON, blackout, threshold)
- `leave_balances` (opening/used/carry_in/carry_expiry, per tahun & jenis)
- `leave_requests` (status, mode serial/paralel, flags approval)
- `approvals` (per level/role/status/catatan/waktu)
- `attachments` (lampiran; hash & storage key)
- `documents` (doc_number, tte_status, qr_hash, storage key)
- `service_rosters` (kebutuhan kapasitas harian divisi)
- `audit_logs` (jejak perubahan)

> Gunakan UUID untuk PK. Waktu `*_at` disimpan UTC.

---

## 7) API Kontrak (ringkas)
- `POST /auth/login` – login/SSO (JWT).
- `GET /me` – profil + saldo.
- `GET /leave-types` – daftar jenis cuti.
- `GET /leave-policies` – kebijakan aktif.
- `GET /leave-requests` – list (filter status/divisi/milik saya).
- `POST /leave-requests` – buat permohonan.
- `GET|PATCH|DELETE /leave-requests/{id}` – detail/ubah/batal.
- `POST /leave-requests/{id}/attachments` – unggah lampiran.
- `POST /leave-requests/{id}/approve` – body `{role, note}`.
- `POST /leave-requests/{id}/reject` – body `{role, reason}`.
- `GET /documents/{id}` – unduh PDF.
- `GET /verify-document/{qr_hash}` – verifikasi QR.

**Error umum**: `400/401/403/404/409/422/503` (validasi, auth, konflik threshold, saldo tidak cukup, dsb).

---

## 8) Dokumen & QR
- **Nomor**: `SPC/[DIV]/[NO_URUT]/[ROMAWI_BULAN]/[TAHUN]`.
- **QR**: `qr_hash = sha256(doc_number + request_id + issued_at + salt)` → dipakai oleh endpoint verifikasi.
- **Template HTML → PDF** (variabel: nama, NIP, jabatan, divisi, jenis, periode, durasi, sisa, penandatangan, tanggal TTD, QR).

---

## 9) Notifikasi, SLA & Eskalasi
- Subjek email:  
  - `[e‑Cuti] Permohonan #{shortId} menunggu persetujuan Anda`  
  - `[e‑Cuti] Permohonan #{shortId} DISETUJUI / DITOLAK`
- **SLA watcher** (tiap 15 menit): reminder; bila lewat → `on_timeout: ESCALATE` (buat approval ke delegasi/atasan).
- **Delegasi**: approver mengatur periode delegasi; sistem mengalihkan otomatis saat berhalangan.

---

## 10) Keamanan
- JWT access 15m + refresh 7d, CORS ketat, rate‑limit login.
- Validasi MIME & ukuran lampiran; **virus scan** (ClamAV).
- Enkripsi at‑rest untuk lampiran sensitif (medis).
- **RBAC middleware** untuk tiap endpoint; **audit** semua mutasi.

---

## 11) Frontend (halaman)
- **Dashboard** (peran adaptif), **Ajukan Cuti**, **Kalender Divisi**, **Antrian Persetujuan**, **Kebijakan & Libur**, **Saldo**, **Dokumen**.

---

## 12) Background Jobs (jadwal)
- `holiday_sync` (opsional; muat libur nasional).
- `carryover_close` (harian 00:30) – nolkan carry yang kadaluarsa.
- `sla_watcher` (*/15m) – reminder & eskalasi approval.
- `pdf_sign_retry` (*/10m) – ulangi TTE gagal.
- `report_cache` (tiap jam) – materialize view dashboard.

---

## 13) Pengujian (Acceptance Criteria contoh)
- **Ajukan tahunan 5 hari**, saldo cukup, bukan libur → status `WAITING_APPROVAL_KEPALA`.
- **Serial approve**: Kepala Kantor → SDM → `APPROVED` → *finalize* jalan.
- **Finalisasi memotong saldo**: sisa berkurang sesuai durasi; PDF + QR terbit.
- **Threshold divisi**: jika melanggar (mis. Keuangan akhir bulan) → `409` + saran tanggal alternatif.
- **Parallel AND**: salah satu reject → `REJECTED`.

---

## 14) Config Contoh (`config.yml`)
```yaml
app:
  base_url: https://app.ecuti.local
  api_url: https://api.ecuti.local
  timezone: Asia/Jakarta
security:
  jwt_secret: ${JWT_SECRET}
  token_ttl_minutes: 15
  refresh_ttl_days: 7
storage:
  s3_endpoint: http://minio:9000
  s3_bucket: ecuti
  access_key: ${S3_KEY}
  secret_key: ${S3_SECRET}
notifications:
  email_from: "no-reply@ecuti.local"
  smtp_url: ${SMTP_URL}
jobs:
  sla_check_interval_minutes: 15
  pdf_concurrency: 4
policies:
  default_leave_year_quota: 12
```

---

## 15) Seed Data (contoh)
```sql
INSERT INTO divisions(code,name,min_service_threshold) VALUES
('SDM','SDM',1),('PERENCANA_PROGRAM','Perencana Program',2),('ASET_BMN','Aset BMN',2),
('KEPENGUSAHAAN','Kepengusahaan',2),('KEUANGAN','Keuangan',4),('HUMAS_DAN_UMUM','Humas & Umum',1),
('SARANA_DAN_DIGITAL','Sarana & Digital',1),('PRASARANA','Prasarana',2),
('WASDAL','WASDAL',1),('K3','K3',1),('KEBERSIHAN','Kebersihan',3);

INSERT INTO leave_types(code,name,requires_doc,max_days,fractional_allowed) VALUES
('TAHUNAN','Cuti Tahunan',false,12,false),
('SAKIT','Cuti Sakit',true,null,false),
('MELAHIRKAN','Cuti Melahirkan',true,null,false),
('DLTN','Di Luar Tanggungan Negara',true,null,false);
```

---

## 16) Catatan Implementasi
- Pakai **UUID** PK; `*_at` UTC. Gunakan `SELECT ... FOR UPDATE` saat memotong saldo.
- Terapkan **idempotency‑key** pada approve/reject untuk cegah klik ganda.
- `audit_logs.diff` berisi snapshot minimal sebelum/sesudah.
- Policy & threshold dapat dioverride per divisi/per tanggal via `leave_policies` & `service_rosters`.

---

**Selesai.** Dokumen ini bisa ditempatkan sebagai `sistem.md` di root repo e‑Cuti.
