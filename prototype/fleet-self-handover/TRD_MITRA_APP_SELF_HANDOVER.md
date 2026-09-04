# TRD — Self Handover Mitra di Aplikasi Driver (kotlin-driver-mobile)

Audiens: mobile engineer `kotlin-driver-mobile`.
Companion: [API_CONTRACT_SELF_HANDOVER.md](./API_CONTRACT_SELF_HANDOVER.md) ·
[E2E_TEST_SELF_HANDOVER.md](./E2E_TEST_SELF_HANDOVER.md) ·
mockup visual: `self-handover-mockup.html` (folder ini; semua token/komponen
diambil dari repo mobile, bukan karangan).

## 1. Ringkasan

Fleet rider (mitra) melakukan serah terima dan pengembalian unit dari
aplikasinya sendiri. Backend sudah live di branch
`feature/self-handover-bast` (nest-fleet-service): endpoint DRIVER-auth
menerima **tanda tangan SVG**, BAST digenerate asinkron dari template resmi
(PT. Dash Elektrik Indonesia).

Celah produk yang diisi: hari ini menu **"Data Motor"** justru disembunyikan
untuk fleet rider — `Driver.canViewBikeData = !isFleetBike`
(`feature/profile/domain/model/BikeDataAccess.kt`) dengan komentar *"a fleet
rider, whose vehicle is the handover's and shows up there instead"*. Fitur
ini adalah "shows up there instead"-nya.

## 2. User journey (6 layar — lihat mockup)

```
00 GET driver/v1/me/profile → isEligibilityToSelfHandover?
        │ false → menu Motor TIDAK muncul (stop)
        ▼ true
01 Profil ──▶ 02 Motor (kosong) ──▶ 03 Scan QR ──▶ 04 Form Serah Terima
                    ▲                                        │
                    └───────── 06 Pengembalian ◀── 05 Motor (unit aktif)
```

**Gate eligibility (langkah 00, WAJIB)**: seluruh fitur — menu Motor, serah
terima, DAN pengembalian — hanya ada saat profil driver mengembalikan
`isEligibilityToSelfHandover: true` (driver-service menghitungnya dari env
`SELF_HANDOVER_PROVIDER_IDS` vs `driverProviders[].id`). Field ini baru;
sudah live di branch `feature/self-handover-bast` nest-driver-service.

- **Cabang A (belum pegang unit)**: Profil → Motor → empty state → Scan QR
  label unit → konfirmasi unit → form serah terima (odometer, ceklist,
  tanda tangan) → submit → layar Motor menampilkan unit aktif.
- **Cabang B (sedang pegang unit)**: Profil → Motor → detail unit + dokumen
  BAST → "Kembalikan Motor" → form pengembalian (kondisi, odometer akhir,
  2 foto bukti, ceklist kondisi, tanda tangan) → slide-to-confirm → kembali
  ke empty state.

QR pada label unit berisi **vehicle ID** — label ini dicetak ops dari halaman
Vehicles di FMS web (fitur print label QR yang sudah rilis).

## 3. Arsitektur & penempatan kode

Ikuti resep add-a-feature di skill `modularization`:

- **Module baru `:feature:selfhandover`** — MVVM (ViewModel → Repository,
  tanpa use case), Hilt, kontrak repository di `domain/repository` slice ini.
- **Entry point**: baris menu di `ProfileScreen` (section Aktivitas Kerja),
  komunikasi antar-module via callback/slot seperti baris lain
  (`onNavigateToSelfHandover`). Logika tampil:
  - `isFleetBike == true` → tampilkan **"Motor"** (fitur ini); subtitle =
    plat unit aktif atau "Belum ada unit di tanganmu".
  - selain itu → perilaku lama ("Data Motor" read-only) tidak berubah.
- **Gate ganda**: remote config `feature_self_handover_enabled` (kill-switch
  rilis, pola `isBikeDataEnabled`) **DAN** `isEligibilityToSelfHandover` dari
  profil (gate bisnis per-provider). Menu Motor muncul hanya bila keduanya
  true; `isFleetBike` menentukan varian menu seperti di bawah.
- **Scanner**: CameraX + `mlkit-barcode-scanning` (sudah di
  `gradle/libs.versions.toml`; pola kamera di `feature/camera` /
  skill `camera/camerax`).

## 4. Komponen design system yang dipakai ulang (semua sudah ada)

| Kebutuhan | Komponen (`core/designsystem/components/`) |
|---|---|
| Baris menu Profil | `ProfileMenuItem` (feature/profile) — judul + subtitle + chevron |
| CTA utama / sekunder | `ButtonPrimary`, `ButtonOutline` — radius 8dp, LARGE 48dp |
| Tanda tangan | `SignatureCanvas` — **perlu ditambah export SVG** (lihat §6) |
| Sheet konfirmasi unit hasil scan | `FlexibleBottomSheet` |
| Pilihan kondisi unit | `RadioTileGroup` |
| Konfirmasi pengembalian (aksi permanen) | `SlideButton` |
| Chip status (Aktif / Sedang dibuat…) | `TagComponents` |
| Loading list/detail | `ShimmerEffect` |

Token: `theme/Color.kt` (PurplePrimary `#5E2AAC`, PurpleSurface, Neutral*,
Success*, Warning*) + `theme/Type.kt` (Plus Jakarta Sans). Kartu unit meniru
pola kartu di `feature/rent/presentation/rentaldetail/RentalDetailScreen.kt`
(radius 16, border `NeutralBorder`, baris label/nilai ala `PaymentRow`).

## 5. Kontrak data & endpoint

Base URL = fleet-service. Auth = **JWT driver house token** (sama dengan
`rent/driver/v1/*`). Envelope: `{ "status": <httpStatus|`"Success"`>, "data": … }`.

### Siap dipakai (sudah live di branch backend)

| # | Endpoint | Dipakai layar | Catatan |
|---|---|---|---|
| 1 | `GET /v1/handovers/self/vehicles/:vehicleID` | 03 | **WAJIB dipanggil segera setelah scan**, sebelum form. `200` = detail unit lengkap (sheet konfirmasi render dari sini). `409` dua varian pesan (lihat §5.1) |
| 2 | `POST /v1/handovers/self` | 04 | Body TANPA identitas driver dan **TANPA hub** (hub = hub milik unit, derive server-side dari row vehicle); `bastSignatureSvg` wajib. Respons `{ handoverID, bastPending: true }` |
| 3 | `PATCH /v1/handovers/self/:id/return` | 06 | `returnBastSignatureSvg` wajib; `403` bila bukan pemilik row |

#### 5.0 Sumber data client & pitstop (dari profil — bukan input teks)

Keduanya dipilih dari `GET driver/v1/me/profile` → `driverProviders[]`:

- **Client/mitra** → `driverProviders[{ id, name, code }]` →
  `clientID`/`clientName` di payload create.
- **Pitstop/hub** → 🆕 `driverProviders[].pitstops[{ id, name, code }]` →
  kirim `hubID` (+`hubName`) saja di payload create. **`hubCityID`/
  `hubCityName` tidak perlu dikirim** — fleet-service melengkapinya sendiri
  via core `GET /v1/pitstop/:hubID` (profil memang tidak membawa city).
- **Auto-fill bila hanya satu** (kasus umum): satu provider + satu pitstop →
  kedua field terisi otomatis, tanpa UI picker. Lebih dari satu → picker
  sederhana (dropdown/sheet). Tidak pernah input teks manual.

#### 5.1 Alur layar 03 (scan) — kontrak gate

```
scan QR → vehicleID → GET /v1/handovers/self/vehicles/:vehicleID
  200            → tampilkan sheet konfirmasi (plat/model/OEM/warna/hub) → Lanjut
  409 "…sedang Anda booking"        → unit ini milik pemanggil → arahkan ke layar 05 (Motor)
  409 "…dipakai oleh mitra lain…"   → tampilkan pesan apa adanya + tutup ke kamera;
                                       ops SUDAH menerima alert Slack otomatis — app tidak perlu aksi lain
  400 non-IDLE / 404               → pesan apa adanya, kamera tetap jalan
```

Detail body/field/validasi: lihat API contract (jangan duplikasi di kode —
generate DTO dari contoh di sana).

### ⚠️ Gap backend — perlu ditambah sebelum integrasi (sudah diverifikasi belum ada)

| # | Kebutuhan | Usulan | Dipakai layar |
|---|---|---|---|
| ~~G2~~ | ~~Resolve hasil scan QR~~ | ✅ **Sudah live**: `GET /v1/handovers/self/vehicles/:vehicleID` (lihat §5.1) | 03 |
| ~~G5~~ | ~~Eligibility + pitstop di profil~~ | ✅ **Sudah live** (branch driver-service): `isEligibilityToSelfHandover` + `driverProviders[].pitstops` di `GET driver/v1/me/profile` | 00, 04 |
| G1 | Unit yang sedang dipegang driver (JWT) + `bastLink`/`returnBastLink` | Extend `GET /fleet/driver/v1/me` (sudah DRIVER-auth, tapi hari ini rent-centric — membaca `rental.handoverID`, handover mitra tanpa rental tidak muncul) **atau** endpoint baru `GET /v1/handovers/self/me` | 01 (subtitle), 02/05 |
| G3 | Katalog ceklist untuk DRIVER | `GET /v1/handovers/checklist-catalog` sekarang WEB+INTERNAL — tambahkan `DRIVER` di `@AuthTypes` | 04, 06 |
| G4 | Upload foto (ceklist + 2 foto bukti return) dari app | Jalur upload driver-auth ke temp bucket FMS (cek dulu `feature/upload` existing — kemungkinan tinggal reuse; kalau tidak, backend expose endpoint upload driver-auth) | 04, 06 |

> G1 & G3 kecil (masing-masing < ½ hari BE). Jangan mulai layar 05 sebelum
> G1 disepakati bentuk responsnya.

### Polling BAST (layar 05)

Setelah submit, `bastPending: true`. Tampilkan chip "Sedang dibuat…" pada
baris dokumen; refresh data saat layar dibuka + pull-to-refresh (polling
berkala tidak perlu — dokumen biasanya jadi < 30 detik; jangan long-poll).

## 6. SignatureCanvas → export SVG (perubahan komponen)

`SignatureCanvas` sudah merekam stroke; tambahkan `toSvg(): String` yang
men-serialisasi stroke menjadi `<path>` polyline. Kontrak output (sudah
terbukti lolos validator backend — referensi implementasi web:
`react-fleet-management-web/src/components/SignaturePad` `format="svg"`):

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">
  <rect width="{w}" height="{h}" fill="#ffffff"/>          ← ground putih wajib
  <path d="M{x} {y} L{x} {y} …" fill="none" stroke="#111827"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  (stroke 1 titik → <circle r="1"/>)
</svg>
```

Aturan yang di-enforce backend (`400` bila dilanggar): root `<svg>`, maks
**256 KB**, tanpa `<script>`/atribut `on*`/`<foreignObject>`/DOCTYPE/
`javascript:`/href eksternal (hanya `#…` dan `data:` yang boleh). Serialisasi
polyline sederhana di atas otomatis memenuhi semuanya — jangan embed
image/font ke dalam SVG.

## 7. State & error per layar

| Layar | State | Perilaku |
|---|---|---|
| 02/05 Motor | loading | Shimmer |
| 02 | kosong | Empty state + CTA Scan QR |
| 03 Scan | QR bukan vehicle ID / `404` | Toast/error sheet, kamera tetap jalan |
| 03 | `409` "sedang Anda booking" | Bukan error bagi user — navigate ke layar 05 (Motor) |
| 03 | `409` "dipakai oleh mitra lain" | Tampilkan pesan backend apa adanya; ops sudah dapat alert Slack otomatis |
| 03 | `400` unit non-`IDLE` bebas | Pesan backend apa adanya (mis. status IN_REPAIR) |
| 04 Submit | `400` (SVG/ceklist/unit berubah status) | Tampilkan pesan backend apa adanya; form tidak di-reset |
| 04 Submit | driver ternyata sudah punya handover aktif | `400 "…has an active handover"` → arahkan ke layar 05 |
| 05 | `bastPending` | Chip "Sedang dibuat…" pada dokumen; refresh mengisi link PDF |
| 06 Submit | `403` | "Unit ini bukan atas namamu" → refresh layar Motor |
| 06 Submit | `MAJOR_DAMAGE` | Sukses; copy sukses menyebut unit masuk penanganan kerusakan |
| Semua submit | offline/timeout | Retry manual; **jangan** auto-retry POST create (bisa dobel guard-nya di backend, tapi UX-nya tetap jelek) |

## 8. Analytics (core/analytics)

Minimal: `self_handover_scan_opened`, `self_handover_unit_resolved`,
`self_handover_submitted`, `self_handover_return_submitted`,
`self_handover_bast_opened`. Parameter: `vehicle_id`, `handover_id`.

## 9. Acceptance criteria

1. Menu **Motor** hanya muncul saat `isEligibilityToSelfHandover: true` (+
   remote config on); non-fleet rider dan driver non-eligible tetap perilaku
   lama — tidak ada regresi.
1b. Form serah terima: client & pitstop terisi otomatis saat masing-masing
   hanya satu di profil; picker muncul saat lebih dari satu.
2. Scan QR label unit `IDLE` → konfirmasi → form → submit `201` → layar Motor
   menampilkan unit + (setelah refresh) PDF BAST bisa dibuka.
3. Unit non-IDLE / QR asing → pesan jelas, tidak bisa lanjut.
4. Return: hanya unit milik sendiri; sukses → empty state; BAST return muncul.
5. Tanda tangan wajib di kedua form; hasil SVG lolos submit (tidak pernah
   `400` karena format dari serialisasi §6).
6. Kill app setelah submit sebelum BAST jadi → buka lagi layar Motor: state
   benar dari server (tidak ada state lokal yang jadi sumber kebenaran).
7. Flag `feature_self_handover_enabled` off → menu Motor tidak muncul.

## 10. Out of scope (v1)

- Notifikasi push "BAST terbit" (backend belum kirim notif untuk dunia mitra).
- Edit/batalkan handover dari app (tetap lewat ops/FMS).
- Lapor kerusakan dari layar Motor (baris info mengarahkan ke hub).
- Offline queueing form.
