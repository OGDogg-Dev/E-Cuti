# AGENTS.md — Playbook Pengembangan e‑Cuti (Laravel 12 + React/Vite TS)

> **Stack terdeteksi (dari struktur repo):** Backend **Laravel 12 (PHP)** + API `/routes/api.php`, Frontend **TypeScript + Vite** (React) dengan Tailwind/shadcn; ada `composer.json`, `artisan`, `app/`, `database/`, `resources/`, `vite.config.ts`, `tsconfig.json`, `package.json`. RBAC di-backend (Spatie Permission direkomendasikan), PDF+QR di worker, storage S3‑compatible.
>
> Alur persetujuan final: **SDM → Kepala Kantor** (Kepala menandatangani & finalize setelah SDM setuju). RBAC: Pegawai (self), SDM/Admin (all + approve tahap 1 + adjust saldo), Kepala (all + approve tahap 2 + tanda tangan + adjust saldo).

Zona waktu proyek: **Asia/Jakarta**. Timestamp disimpan **UTC** di DB.

---

## 0) Prinsip Proyek
- **Spec as Code**: Policy approval, threshold/blackout & SLA dalam JSON + schema validator.
- **Small PRs & Fast CI**: PR ≤ ~400 LOC, wajib lint + unit + contract/e2e.
- **Idempotent & Atomic**: approve/reject/adjust **harus** idempotent & transaksional.
- **Security by Default**: RBAC (middleware + policy), signed/presigned download, antivirus untuk upload.
- **Observability**: log JSON, health/ready checks, (opsional) metrics p95 & job lag.

---

## 1) Struktur Monorepo (rekomendasi)
```
/app/                     # Laravel app (Controllers, Policies, Models, Services, Jobs)
/bootstrap/
/config/
/database/                # migrations, seeders, factories
/public/
/resources/
  /js|ts/                 # React + Vite (TS) sumber UI
  /views/                 # Blade/SSR jika perlu
/routes/
  api.php                 # REST API
/storage/
/tests/                   # PHPUnit (API), Playwright/Cypress (e2e)
composer.json
package.json
vite.config.ts
tsconfig.json
```
> Frontend **React + Vite (TS)** direkomendasikan ditempatkan di `resources/ts` (atau `resources/js`) dan di-serve via Vite dev server/compiled assets.

---

## 2) Agen & Tanggung Jawab

| Agen | Fokus | Output |
|---|---|---|
| **Architect** | boundary modul, ADR | `/docs/adr/*.md` |
| **Schema/Migration** | skema DB, index, FK | `/database/migrations/*`, seed |
| **Policy Engine** | policy JSON + schema | `/config/policies/*.json`, `policy.schema.json` |
| **Backend API** | controller/service, OpenAPI | `app/Http/*`, `app/Services/*`, `routes/api.php`, `openapi.yaml` |
| **Jobs/Workers** | finalize, SLA, sign retry | `app/Jobs/*` |
| **Security** | RBAC, policy, upload | `app/Policies/*`, middleware |
| **Frontend UI** | SPA, guards, hooks | `resources/ts/*` |
| **QA/Test** | unit, contract, e2e | `tests/*`, `/resources/ts/tests/*` |
| **DevOps** | Docker/compose, CI | `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` |
| **Docs** | sistem/API/agents | `/docs/*.md` |

---

## 3) Backend (Laravel 12)

### 3.1 Paket & Konfigurasi
- **Auth**: Sanctum (`laravel/sanctum`).
- **RBAC**: Spatie Permission (`spatie/laravel-permission`).
- **PDF**: `barryvdh/laravel-snappy` **atau** `spatie/browsershot`.
- **Storage**: S3/MinIO (`league/flysystem-aws-s3-v3`), bucket **private**.
- **Queue**: Redis/Database queue (`php artisan queue:work`).
- **Antivirus**: ClamAV (service terpisah) – validasi file saat upload.

**Kernel aliases (contoh)** `app/Http/Kernel.php`
```php
protected $routeMiddleware = [
  'role' => \Spatie\Permission\Middlewares\RoleMiddleware::class,
  'permission' => \Spatie\Permission\Middlewares\PermissionMiddleware::class,
  'role_or_permission' => \Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class,
];
```

### 3.2 Model & Tabel Inti
- `divisions`, `employees (division_id, manager_id)`
- `holidays` (tanggal libur/cuti bersama)
- `leave_types`, `leave_policies` (JSON policy, threshold/blackout/SLA)
- `leave_balances` (opening/used/carry_in/carry_expiry per tahun & jenis)
- `leave_requests` (status; mode serial; flags)
- `approvals` (request_id, level, role, status, note, decided_at)
- `attachments` (private storage key + hash)
- `documents` (doc_number, signer_role=KEPALA_KANTOR, qr_hash, tte_status, storage_key)
- `service_rosters` (kebutuhan kapasitas divisi per hari)
- `audit_logs` (aksi, actor_id, entity, diff)

> PK **UUID**, `*_at` TIMESTAMPTZ (UTC). Index: `leave_requests(status, employee_id)`, `approvals(request_id)`, `holidays(date)`.

### 3.3 Routes (ringkas) – `routes/api.php`
```php
Route::middleware(['auth:sanctum'])->group(function () {
  // Pegawai (self scope via Policy)
  Route::apiResource('leave-requests', LeaveRequestController::class);

  // Approvals
  Route::get('approvals/inbox', [ApprovalController::class, 'inbox'])
    ->middleware('role:SDM|KEPALA_KANTOR|ADMIN');

  Route::post('leave-requests/{lr}/approve', [ApprovalController::class, 'approve'])
    ->middleware('role:SDM|KEPALA_KANTOR|ADMIN');

  Route::post('leave-requests/{lr}/reject', [ApprovalController::class, 'reject'])
    ->middleware('role:SDM|KEPALA_KANTOR|ADMIN');

  // Balances (SDM/Kepala/Admin)
  Route::post('employees/{id}/leave-balances/adjust', [BalanceController::class, 'adjust'])
    ->middleware('role:SDM|KEPALA_KANTOR|ADMIN');

  // Documents & Attachments (download signed)
  Route::get('documents/{doc}', [DocumentController::class, 'download'])->middleware('signed');
  Route::get('verify-document/{qr}', [DocumentController::class, 'verify']);
});
```

### 3.4 Policies (kritis)
`AuthServiceProvider.php`
```php
protected $policies = [
  \App\Models\LeaveRequest::class => \App\Policies\LeaveRequestPolicy::class,
  \App\Models\Document::class => \App\Policies\DocumentPolicy::class,
];
```
`LeaveRequestPolicy.php` (intisari)
```php
public function view(User $u, LeaveRequest $lr): bool {
  if ($u->hasAnyRole(['SDM','ADMIN','KEPALA_KANTOR'])) return true;
  return $lr->employee_id === $u->id; // Pegawai hanya miliknya
}
public function actOnAsSDM(User $u, LeaveRequest $lr): bool {
  return $u->hasAnyRole(['SDM','ADMIN']) && $lr->status === 'WAITING_APPROVAL_SDM';
}
public function actOnAsKepala(User $u, LeaveRequest $lr): bool {
  return $u->hasRole('KEPALA_KANTOR') && $lr->status === 'WAITING_APPROVAL_KEPALA';
}
public function adjustBalance(User $u): bool {
  return $u->hasAnyRole(['SDM','ADMIN','KEPALA_KANTOR']);
}
```

### 3.5 Controller Approve (alur **SDM → Kepala**)
```php
public function approve(Request $req, LeaveRequest $lr) {
  $req->validate(['role' => 'required|in:SDM,KEPALA_KANTOR', 'note' => 'nullable|string']);
  $idKey = $req->header('Idempotency-Key'); abort_unless($idKey, 400, 'Missing Idempotency-Key');

  return DB::transaction(function () use ($req, $lr) {
    $lr = LeaveRequest::whereKey($lr->id)->lockForUpdate()->firstOrFail();

    if ($req->role === 'SDM') {
      $this->authorize('actOnAsSDM', $lr);
      $lr->markApproval('SDM','APPROVED',$req->note);
      $lr->status = 'WAITING_APPROVAL_KEPALA';
    } else {
      $this->authorize('actOnAsKepala', $lr);
      $lr->markApproval('KEPALA_KANTOR','APPROVED',$req->note);
      $lr->status = 'APPROVED';
      dispatch(new FinalizeLeaveRequest($lr->id, signer:'KEPALA_KANTOR'));
    }
    $lr->save();
    Audit::log('APPROVE', $lr->id, ['role'=>$req->role]);
    return response()->json($lr);
  });
}
```

### 3.6 Finalize Job (atomic)
- Lock `leave_balances` baris pegawai/jenis/tahun (`FOR UPDATE`).
- Validasi saldo → kurangi `used` sesuai durasi (prioritaskan carry).
- Bangkitkan **nomor surat** (`SPC/[DIV]/[SEQ]/[ROMAWI]/[TAHUN]`) + **qr_hash**.
- Render **PDF** dari template HTML → simpan ke **S3 private** (catat `storage_key`).
- (Opsional) **TTE** (update `tte_status`, `signed_at`).
- Kirim **notifikasi** (email/in-app) ke pemohon.

### 3.7 Upload & Download
- Upload: validasi **MIME/ukuran**, **scan antivirus**, simpan **private**.
- Download: **signed route** → buang **presigned URL** sementara dari S3.

---

## 4) Frontend (React + Vite + TypeScript)

### 4.1 Stack UI
- **React 18 + Vite (TS)**
- **TailwindCSS** + **shadcn/ui** (lihat `components.json` jika ada)
- **React Router** (role‑based route guards)
- **React Query** untuk fetching/cache
- **React Hook Form** + **Zod** untuk validasi
- **Axios** client dengan interceptors (JWT, error mapping)

### 4.2 Struktur UI
```
resources/ts/
  app/
    main.tsx, routes.tsx, providers.tsx
  lib/
    api.ts (axios), auth.ts (JWT helpers), guards.tsx
  features/
    leave/ (form, list, detail, hooks)
    approvals/ (inbox SDM & Kepala)
    policy/ (viewer config)
    documents/ (list & download)
  components/
    ui/ (shadcn), common/
  styles/
    index.css (tailwind)
```

### 4.3 Guard & Hooks
**Route Guard (role)**
```tsx
export function RoleGuard({ allow, children }: { allow: Array<'PEGAWAI'|'SDM'|'KEPALA_KANTOR'|'ADMIN'>; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.role) ? <>{children}</> : <Navigate to="/" replace />;
}
```
**Approve Hook**
```ts
export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p:{id:string; role:'SDM'|'KEPALA_KANTOR'; note?:string}) =>
      api.post(`/leave-requests/${p.id}/approve`, p, { headers: {'Idempotency-Key': crypto.randomUUID()} }),
    onSuccess: () => qc.invalidateQueries({queryKey:['leave-requests','inbox']}),
  });
}
```

### 4.4 Halaman Prioritas
1. **Dashboard** (ringkasan saldo & activity).
2. **Ajukan Cuti** (form + kalkulasi durasi realtime + indikator kapasitas).
3. **Permohonan Saya** (tabel + filter + status).
4. **Inbox SDM** (WAITING_APPROVAL_SDM) + aksi approve/reject.
5. **Inbox Kepala** (WAITING_APPROVAL_KEPALA) + approve & tanda tangan.
6. **Saldo Pegawai** (SDM/Kepala) → adjust saldo.
7. **Dokumen**: daftar & **download signed**.
8. **Kebijakan & Kalender Libur** (SDM/Admin).

### 4.5 UX Wajib
- Disable tombol submit saat konflik threshold → tampilkan **saran tanggal** (dari API `409`).
- Tampilkan **badge** merah/kuning/hijau kapasitas divisi untuk tanggal yang dipilih.
- Konfirmasi saat **edit/batal** (reset approval).

---

## 5) Policy Engine & Berkas Kebijakan
- File: `/config/policies/*.json` → schema `/config/policies/policy.schema.json`.
- Contoh (`serial SDM→Kepala`):
```json
{
  "mode": "serial",
  "levels": [
    {"role": "SDM", "sla_hours": 48, "on_timeout": "ESCALATE"},
    {"role": "KEPALA_KANTOR", "sla_hours": 48, "on_timeout": "ESCALATE", "signs_document": true}
  ],
  "required_docs": [
    {"when": {"type": "SAKIT", "min_days": 3}, "doc_types": ["surat_dokter"]}
  ],
  "download": {
    "attachments": {"roles": ["SDM","KEPALA_KANTOR"], "self_always": true},
    "documents": {"roles": ["SDM","KEPALA_KANTOR"], "self_always": true}
  }
}
```

---

## 6) Keamanan
- **RBAC** via Spatie Permission + **Policies** + scoping query.
- **Idempotency-Key** untuk approve/reject/adjust.
- **Upload**: MIME whitelist, ukuran maksimum, antivirus.
- **Download**: signed route → presigned S3, **expiry** pendek.
- **JWT**: access pendek + refresh; rate‑limit login dan aksi approve.
- **Audit**: catat semua mutasi dengan `actor_id` & `diff`.

---

## 7) Observability & Health
- `GET /healthz`: DB/Redis/S3.
- `GET /readyz`: policy loaded, queue aktif.
- Log terstruktur: `ts, request_id, actor_id, action, entity, entity_id, status`.
- (Opsional) Metrics: p95 latency, job lag, error rate.

---

## 8) DevOps & Perintah
**Install**
```
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm ci
npm run dev  # atau build
```
**Queue & Workers**
```
php artisan queue:work
php artisan schedule:work
```
**Vite** (dev server UI): `npm run dev`

**.env.example (inti)**
```
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Jakarta
SANCTUM_STATEFUL_DOMAINS=localhost:5173

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=ecuti
DB_USERNAME=ecuti
DB_PASSWORD=ecuti

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=access
AWS_SECRET_ACCESS_KEY=secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=ecuti
AWS_ENDPOINT=http://localhost:9000
AWS_USE_PATH_STYLE_ENDPOINT=true

REDIS_HOST=localhost
MAIL_MAILER=smtp
CLAMAV_HOST=clamav
```

---

## 9) Test Plan (Minimum)
- **Submit**: saldo cukup/kurang; libur di tengah; weekend only.
- **Serial SDM→Kepala**: approve→approve→finalize (sukses).
- **Reject**: SDM reject; Kepala reject setelah SDM approve.
- **Race**: double‑click approve → tetap idempotent.
- **Threshold**: Keuangan akhir bulan → `409` + saran tanggal.
- **Download**: pemilik vs non‑pemilik → 403.
- **QR Verify**: hash valid/invalid.
- **Security**: upload file berbahaya → ditolak.

---

## 10) CI/CD (GitHub Actions contoh)
- Jobs: **lint (PHP & TS)** → **unit (PHPUnit)** → **contract tests** → **e2e headless** → **build** → **artifact**.
- Secrets: jangan commit; pakai GitHub Secrets untuk kredensial S3/DB/SMTP.

Workflow ringkas `.github/workflows/ci.yml` (sketsa):
```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3', extensions: mbstring, coverage: none }
      - run: composer install --no-interaction --prefer-dist
      - run: cp .env.testing .env && php artisan key:generate
      - run: php artisan migrate --env=testing
      - run: vendor/bin/phpunit
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
```

---

## 11) Definition of Done (DoD)
**Backend**
- Endpoint sesuai OpenAPI; RBAC & policy teruji; transaksi & idempotensi di approve/reject/adjust; PDF+QR terbit; `/verify-document/{qr}` bekerja; healthz/readyz OK.

**Frontend**
- Halaman prioritas tersedia; guards role & action; validasi form jelas; unduh signed bekerja; e2e hijau.

**Umum**
- Dokumentasi (`sistem.md`, `AGENTS.md`) mutakhir; CI hijau; tidak ada secrets di repo.

---

## 12) Sprint Plan (3 Sprint)
- **Sprint 0**: Auth+RBAC kerangka, migrasi inti, policy loader, ci skeleton.
- **Sprint 1**: Core flow (submit → SDM → Kepala → finalize), upload/download, notifikasi dasar.
- **Sprint 2**: Threshold/saran tanggal, delegasi approver, dashboard, TTE opsi, hardening security & e2e.

---

Gunakan file ini sebagai *playbook* implementasi sesuai stack repo (Laravel 12 + React/Vite TS). Rujuk `sistem.md` untuk domain detail & kebijakan.
