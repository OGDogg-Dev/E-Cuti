# AGENTS.md — Playbook Lengkap Agen Backend & Frontend e‑Cuti
> Dokumen operasional untuk *coding agents* (manusia/LLM) yang membangun **backend** dan **frontend** e‑Cuti.  
> Spesifikasi fungsional & teknis ada di `sistem.md`. RBAC & alur final: **SDM → Kepala Kantor** (Kepala menandatangani & finalisasi setelah SDM menyetujui).

Zona waktu proyek: **Asia/Jakarta**. Waktu disimpan **UTC** di DB.

---

## 0) Prinsip & Aturan Proyek
- **Spec as Code**: kebijakan & flow persetujuan disimpan sebagai JSON, divalidasi oleh schema.
- **Small PRs, Fast CI**: PR ≤ ~400 LOC, wajib **lint + unit + contract/e2e**.
- **Idempotency & Atomicity**: semua aksi persetujuan/adjust saldo harus idempotent dan transaksional.
- **Security by Default**: RBAC ketat (middleware + policy/gate), signed/presigned download, scan antivirus.
- **Observability**: log JSON, healthcheck, (opsional) metrics p95 latency, job lag.
- **Definition of Done (DoD)**: ada di §12; semua PR harus memenuhi DoD modulnya.

---

## 1) Tumpukan Teknologi (pilih salah satu jalur)
### Jalur A — **Laravel 11 (PHP) + Sanctum** + PostgreSQL + MinIO (S3) + Redis + React/Vite (TS)
- **Kelebihan**: produktif, paket Spatie Permission, queue bawaan, familiar di ekosistem PHP.

### Jalur B — **NestJS (Node/TS)** + TypeORM + PostgreSQL + MinIO + BullMQ (Redis) + React/Vite (TS)
- **Kelebihan**: konsisten TypeScript end‑to‑end, arsitektur modular, DX modern.

> Dokumen ini memuat instruksi untuk **keduanya**. Pilih satu & konsisten.

---

## 2) Struktur Repo yang Disarankan
```
/api/                 # backend (Laravel atau Nest)
/web/                 # frontend (React + Vite + Tailwind)
/docs/                # dokumentasi, ADR, diagram
  sistem.md
  AGENTS.md
  API.md              # (opsional) OpenAPI lengkap
/db/
  migrations/         # SQL (jika Nest) atau otomatis (Laravel)
  seed.sql
/config/
  policies/           # *.policy.json (approval, thresholds, blackout)
  policy.schema.json
/templates/pdf/       # template HTML surat
/tests/
  api/                # contract/unit
  e2e/                # e2e (Playwright/Cypress)
.github/
  workflows/ci.yml
.env.example
```

---

## 3) Pemetaan Agen & Tanggung Jawab
| Agen | Fokus | Output (artefak) |
|---|---|---|
| **Backend Architect** | arsitektur, modul, ADR | `/docs/adr/*.md` |
| **Schema/Migration Agent** | skema DB, indeks, FK | `/db/migrations/*.sql` (Nest) / migrasi artisan (Laravel) |
| **Policy Engine Agent** | schema & validator kebijakan | `/config/policies/*.json`, `policy.schema.json` |
| **API Agent** | kontrak OpenAPI, controller/service | `/api/src|app/*`, `openapi.yaml` |
| **Jobs/Worker Agent** | `finalize`, `sla_watcher`, dll | `/api/src|app/Jobs/*` |
| **Security Agent** | RBAC, gate/policy, upload, secrets | middleware, policy, scan |
| **Frontend UI Agent** | halaman SPA + PWA | `/web/src/*` |
| **QA/Test Agent** | unit/contract/e2e/load | `/tests/*` & CI |
| **DevOps Agent** | Docker/compose, CI/CD, env | `Dockerfile`, `compose.yml`, `ci.yml` |
| **Docs Agent** | README, API.md, changelog | `/docs/*` |

---

## 4) Backend — Modul & Tugas

### 4.1 Modul Wajib
- **Auth & RBAC**  
  - **Laravel**: Sanctum, Spatie Permission (`role`: PEGAWAI, SDM, KEPALA_KANTOR, ADMIN).  
  - **Nest**: Passport/JWT, `RolesGuard`, `Policies` (CASL/hand‑rolled).
- **Policy Engine**  
  - Muat `*.policy.json` → validasi dengan `policy.schema.json`.  
  - Menyediakan helper `getFlowFor(type, division)` (mode, levels, SLA, doc rules).
- **Leave Core**  
  - Entities: `employees`, `leave_types`, `leave_policies`, `leave_balances`, `leave_requests`, `approvals`, `documents`, `attachments`, `holidays`, `service_rosters`, `audit_logs`.  
  - Service: **durasi kerja** (exclude weekend/libur), **saldo** (prorata, carry, lock row), **threshold & blackout**.
- **Approvals Engine** (alur **SDM → Kepala**)
  - Serial: `WAITING_APPROVAL_SDM` → `WAITING_APPROVAL_KEPALA`.  
  - Hanya role yang sesuai status yang boleh bertindak.
- **Finalize Pipeline**  
  - Lock saldo (`SELECT ... FOR UPDATE`), potong, buat nomor & QR, render PDF, TTE (opsional), notifikasi.
- **Downloads (signed)**  
  - Attachment & PDF via **signed/presigned URL**, tidak ada file publik.
- **Notifications**  
  - SMTP/Email; (opsional) webpush; template i18n.
- **Jobs/Workers**  
  - `finalize`, `sla_watcher`, `pdf_sign_retry`, `carryover_close`, `report_cache`.
- **Observability**  
  - `/healthz`, `/readyz`, log JSON (request_id, actor_id, action).

### 4.2 Skema Database (ringkas)
Lihat `sistem.md §7`. PK **UUID**, waktu **UTC**. Indeks: `leave_requests(status, employee_id)`, `approvals(request_id)`, `holidays(date)`.

### 4.3 Rute/Endpoint (kontrak ringkas)
- Auth: `POST /auth/login`, `POST /auth/refresh`  
- Me: `GET /me` (profil + saldo)  
- Referensi: `GET /leave-types`, `GET /leave-policies`, `GET /holidays`  
- Leave: `GET/POST /leave-requests`, `GET/PATCH/DELETE /leave-requests/{id}`  
- Attachments: `POST /leave-requests/{id}/attachments` (upload), `GET /leave-requests/{id}/attachments/{attId}` (signed)  
- Approvals: `POST /leave-requests/{id}/approve`, `POST /leave-requests/{id}/reject`  
- Documents: `GET /documents/{id}` (signed), `GET /verify-document/{qr_hash}`  
- Balance: `POST /employees/{id}/leave-balances/adjust`

**Kode error**: `400/401/403/404/409/422/503`.

### 4.4 RBAC & Policy (aturan minimum)
- **View**: Pegawai hanya miliknya; SDM/Kepala semua.  
- **Create/Update/Delete**: hanya pemilik (selama pending).  
- **Approve SDM**: hanya SDM/Admin saat status `WAITING_APPROVAL_SDM`.  
- **Approve Kepala**: hanya Kepala saat `WAITING_APPROVAL_KEPALA`.  
- **Adjust Balance**: SDM/Kepala/Admin.  
- **Download** (attachment/doc): milik sendiri **atau** SDM/Kepala/Admin.  
- Semua di‑gate di controller **dan** di query scoping.

### 4.5 SOP Implementasi (Laravel)
1. **Paket**: `laravel/sanctum`, `spatie/laravel-permission`, `barryvdh/laravel-snappy` (PDF) atau `spatie/browsershot`, `league/flysystem-aws-s3-v3`.  
2. **Kernel**: daftarkan middleware `role`, `permission`.  
3. **AuthServiceProvider**: registrasi policy (`LeaveRequestPolicy`, `DocumentPolicy`).  
4. **Routes**: grouping `auth:sanctum` + `role` + `can:*` untuk aksi sensitif.  
5. **Controller**: selalu panggil `$this->authorize(...)`.  
6. **Queue**: gunakan `database/redis` queue; jalankan worker `php artisan queue:work`.  
7. **Storage**: gunakan disk `s3` privat; buat presigned untuk download.

### 4.6 SOP Implementasi (NestJS)
1. **Lib**: `@nestjs/jwt`, `@nestjs/typeorm`, `class-validator`, `bullmq`, `aws-sdk`/`minio`.  
2. **Guards**: `JwtAuthGuard`, `RolesGuard`, `PoliciesGuard`.  
3. **Interceptors**: `ClassSerializer`, `Logging`, `Timeout`.  
4. **Modules**: `AuthModule`, `UsersModule`, `LeaveModule`, `PolicyModule`, `DocsModule`, `JobsModule`.  
5. **Filters**: map error bisnis → HTTP code konsisten.  
6. **Queues**: `finalizeQueue`, `slaQueue`.  
7. **Storage**: presigned URL dari S3/MinIO client.

### 4.7 Pseudocode Kritis
**Approve SDM → Kepala → Finalize**
```pseudo
POST /leave-requests/{id}/approve { role }
require Idempotency-Key
tx:
  lr = lock(leave_requests.id = id)
  if role == 'SDM' and lr.status == WAITING_APPROVAL_SDM:
     mark approval SDM APPROVED
     lr.status = WAITING_APPROVAL_KEPALA
  else if role == 'KEPALA_KANTOR' and lr.status == WAITING_APPROVAL_KEPALA:
     mark approval Kepala APPROVED
     lr.status = APPROVED
     enqueue finalize(lr.id, signer='KEPALA_KANTOR')
  else:
     403/409
commit
```
**Finalize Job**
```pseudo
tx:
  bal = lock(leave_balances for employee & type & year)
  if bal.available < lr.duration: fail('422 balance')
  bal.used += lr.duration
  doc = create(doc_number, qr_hash, signer_role='KEPALA_KANTOR')
commit
render PDF → upload S3 → update doc.storage_key
(opsional) call TTE → update tte_status
send email to employee
```

---

## 5) Frontend — Modul & Tugas (React + Vite + Tailwind)
### 5.1 Arsitektur
- **State**: React Query untuk data fetching/cache, Zustand/Redux (opsional) untuk UI state.  
- **Form**: React Hook Form + Zod (validasi skema).  
- **UI Kit**: Tailwind + shadcn/ui; icon `lucide-react`.  
- **Routing**: `react-router` (route guard berdasar role).  
- **i18n**: `react-i18next` (ID default).  
- **PWA**: Vite PWA plugin (opsional).

### 5.2 Halaman
1. **Login** (JWT/SSO).  
2. **Dashboard** (peran adaptif): ringkasan saldo, permohonan saya, inbox persetujuan.  
3. **Ajukan Cuti**: form (jenis, tanggal, alasan, lampiran); live durasi (exclude weekend/libur via `/holidays`).  
4. **Daftar Permohonan Saya** (PEGAWAI) + Detail.  
5. **Inbox SDM**: status `WAITING_APPROVAL_SDM` (Approve/Reject).  
6. **Inbox Kepala**: status `WAITING_APPROVAL_KEPALA` (Approve & tanda tangan).  
7. **Kebijakan & Hari Libur** (SDM/Admin).  
8. **Saldo Pegawai** (SDM/Kepala): adjust saldo.  
9. **Dokumen & Lampiran**: daftar & download (signed).  
10. **Laporan**: heatmap cuti, tren, pelanggaran threshold (filter periode/divisi).

### 5.3 Guards & Permission di UI
- **RoleGate**: render‑guard komponen berdasarkan role.  
- **RecordScope**: memastikan data “milik saya” vs “semua” sebelum render.  
- **Action buttons**: hanya terlihat jika memenuhi policy (mis. Approve SDM/Kepala sesuai status).

### 5.4 Kontrak Data (TypeScript)
```ts
type LeaveType = { id:string; code:'TAHUNAN'|'SAKIT'|'MELAHIRKAN'|'DLTN'; name:string };
type LeaveRequest = {
  id:string; type:LeaveType; start_date:string; end_date:string; duration_days:number;
  status:'SUBMITTED'|'WAITING_APPROVAL_SDM'|'WAITING_APPROVAL_KEPALA'|'APPROVED'|'FINALIZED'|'REJECTED'|'CANCELLED';
  approved_head:boolean; approved_hr:boolean; reason?:string;
};
```
**Hook contoh**
```ts
export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p:{id:string; role:'SDM'|'KEPALA_KANTOR'; note?:string}) =>
      api.post(`/leave-requests/${p.id}/approve`, p, { headers: {'Idempotency-Key': nanoid()} }),
    onSuccess: () => qc.invalidateQueries({queryKey:['leave-requests']}),
  });
}
```

### 5.5 UX Penting
- **Durasi realtime** saat pilih rentang tanggal (exclude weekend/libur).  
- **Indikator kapasitas** (badge merah/kuning/hijau) sebelum submit.  
- **Konfirmasi** saat edit/batal (reset approval).  
- **Toaster** untuk notifikasi aksi.  
- **Unduh** dokumen & lampiran via URL bertanda (expired).

### 5.6 E2E & A11y
- **Playwright/Cypress**: skenario serial SDM→Kepala, reject di salah satu tahap, threshold 409.  
- **Aksesibilitas**: label inputs, fokus jelas, keyboard‑friendly.

---

## 6) Kebijakan & Policy Engine
- **Schema** `policy.schema.json` memvalidasi: mode (`serial|parallel_and`), levels (role + SLA), required_docs, aturan download, threshold/blackout.  
- **Loader** baca `config/policies/*.json` ke cache; reload saat aplikasi start.  
- **Resolver** memilih policy berdasar `leave_type` & (opsional) `division`.  
- **Validator** memastikan policy backward‑compatible (migrasi aman).

---

## 7) Security Checklist
- **RBAC** di middleware **dan** policy; query scoping berdasarkan role.  
- **Uploads**: validasi MIME/ukuran, **virus scan** (ClamAV), simpan private bucket.  
- **Downloads**: signed/presigned URL + policy `download`.  
- **Auth**: JWT pendek + refresh; revoke di server saat logout.  
- **Idempotency-Key** untuk mutasi; rate‑limit login/approve.  
- **Secrets**: `.env`, jangan commit; gunakan variabel lingkungan CI.  
- **Logging**: tanpa PII sensitif; *redact* token/kunci.

---

## 8) Observability & Health
- **/healthz**: DB, Redis, Storage. **/readyz**: policy loaded, queue OK.  
- Log JSON: `ts, level, request_id, actor_id, action, entity, entity_id, status`.  
- (Opsional) Prometheus metrics: request latency p95, job lag, error rate.

---

## 9) DevOps & CI/CD
- **Docker**: service `api`, `web`, `db` (Postgres), `redis`, `minio`, `clamav`, `worker`.  
- **Compose** target:
  - `make up`, `make migrate`, `make seed`, `make test`, `make lint`.  
- **CI** (GitHub Actions):
  - Step: lint → unit → contract → e2e (headless) → build → artifact.  
- **CD**: staging → canary → prod (feature flag untuk fitur besar).

**.env.example (gabungan)**
```
APP_URL=http://localhost:3000
API_URL=http://localhost:8080
JWT_SECRET=change_me
DB_URL=postgres://ecuti:ecuti@db:5432/ecuti
REDIS_URL=redis://redis:6379
S3_ENDPOINT=http://minio:9000
S3_BUCKET=ecuti
S3_ACCESS_KEY=access
S3_SECRET_KEY=secret
SMTP_URL=smtp://user:pass@mail:587
CLAMAV_HOST=clamav
TZ=Asia/Jakarta
```

---

## 10) Test Matrix Minimum (API + UI)
- **Submit**: saldo cukup/tidak; libur di tengah; weekend only.  
- **Serial**: SDM approve ⇒ Kepala approve ⇒ finalize sukses.  
- **Reject**: SDM reject; Kepala reject sesudah SDM approve.  
- **Race**: dua approve cepat + finalize sekali (idempotent).  
- **Threshold**: Keuangan akhir bulan → `409` + saran tanggal.  
- **Download**: pemilik vs non‑pemilik (403).  
- **QR Verify**: hash valid/invalid.  
- **Security**: upload file aneh → ditolak; rate‑limit approve.

---

## 11) Prompt Template untuk Agen (LLM)

### 11.a Migrasi Skema (Nest / SQL)
```
Anda adalah Schema Agent. Baca /docs/sistem.md §7.
Buat file migrasi PostgreSQL: semua tabel inti + indeks + FK + constraints.
Gunakan UUID PK, TIMESTAMPTZ now().
Simpan ke /db/migrations/0001_init.sql.
```
### 11.b Controller Approve/Reject (Laravel)
```
Anda adalah API Agent. Implementasikan endpoint:
POST /leave-requests/{id}/approve (role: SDM atau KEPALA_KANTOR)
POST /leave-requests/{id}/reject
Syarat:
- Middleware auth:sanctum + policy actOn
- Header Idempotency-Key wajib
- Mode serial SDM→Kepala; status sesuai
- Transaksi DB & audit log
- Unit & contract tests
```
### 11.c Worker Finalize
```
Anda adalah Jobs Agent. Buat job 'FinalizeLeaveRequest':
- Lock saldo, validasi, update used
- Buat documents (nomor, qr_hash)
- Render PDF dari template HTML, upload S3
- (Opsional) TTE; kirim email
Tambahkan retry backoff; idempotent dengan key request_id.
```
### 11.d React Form Ajukan Cuti
```
Anda adalah Frontend Agent. Bangun halaman Ajukan Cuti:
- RHF + Zod; perhitungan durasi realtime (exclude weekend/libur dari /holidays)
- Cek saldo & kapasitas; tampilkan indikator
- Submit ke /leave-requests; tampilkan hasil & navigasi ke detail
- Unit & e2e test (Playwright)
```

---

## 12) Definition of Done (DoD)
**Backend**
- [ ] Endpoint sesuai OpenAPI (request/response & kode error konsisten).  
- [ ] RBAC teruji (unit/policy + e2e).  
- [ ] Idempotency & transaksi untuk approve/reject/adjust.  
- [ ] Finalize menghasilkan PDF + QR; verifikasi QR berjalan.  
- [ ] Observability & healthz aktif.

**Frontend**
- [ ] Halaman sesuai daftar §5.2, responsif & aksesibel.  
- [ ] Route guard & action guard berbasis role/status.  
- [ ] Form validasi yang jelas; pesan error ramah pengguna.  
- [ ] e2e hijau untuk alur utama (SDM→Kepala) & edge cases.  

**Umum**
- [ ] Dokumentasi diperbarui (README/API.md jika ada).  
- [ ] CI hijau; tidak ada secrets di repo; CHANGELOG entri rilis.

---

## 13) Rencana Sprint (3 Sprint)
**Sprint 0 — Foundations**  
- Auth + RBAC kerangka; migrasi inti; policy loader; OpenAPI skeleton; CI.

**Sprint 1 — Core Flow**  
- CRUD `leave_requests` + durasi kerja; serial SDM→Kepala (approve/reject); `finalize` (saldo, PDF+QR); upload & download signed; notifikasi dasar.

**Sprint 2 — Hardening & UX**  
- Threshold/blackout + saran tanggal; delegasi approver; dashboard & laporan; TTE opsional; security gates (scan upload, rate limit); e2e lengkap.

---

## 14) Struktur Folder (contoh)

### Laravel
```
/api/app
  /Http/Controllers
  /Http/Middleware
  /Models
  /Policies
  /Services/Leave
  /Jobs
  /Notifications
  /Providers
  /Rules
  /View (jika perlu)
/api/routes/api.php
```

### NestJS
```
/api/src
  /auth
  /common/{guards,interceptors,filters}
  /policy
  /leave/{controllers,services,entities,repos}
  /documents
  /jobs
  /notifications
  main.ts
```

### React
```
/web/src
  /app/{routes,providers}
  /components/{ui,domain}
  /features/{leave,approvals,policy,documents}
  /hooks
  /lib/{api,auth,guards}
  /pages
```

---

## 15) Catatan Implementasi Tambahan
- **Nomor Surat**: generator harus **atomic & monotonik** per divisi/bulan. Simpan counter per kunci (`divisi|bulan|tahun`) dengan `FOR UPDATE`.  
- **Recompute Durasi** di server saat approve (antisipasi manipulasi klien).  
- **Saran Tanggal Alternatif**: saat 409 threshold, kalkulasi tanggal berikut yang tidak melanggar.  
- **Masking** PII sensitif pada response & log.  
- **Retry** TTE & upload; circuit‑breaker pada SMTP.

---

Selesai. Gunakan dokumen ini sebagai **playbook eksekusi** untuk agen backend & frontend. Semua yang tidak tertulis rujuk ke `sistem.md`.
