# API Contract — Self Handover Mitra

Dua service terlibat:

| Service | Endpoint | Peran |
|---|---|---|
| **nest-driver-service** | `GET driver/v1/me/profile` | Eligibility + sumber data client & pitstop |
| **nest-fleet-service** | `/v1/handovers/self/*` | Gate scan, serah terima, pengembalian, generate BAST |

Auth semua endpoint driver-facing: `Authorization: Bearer <JWT driver>`
(house driver token, sama dengan `rent/driver/v1/*`).

**Envelope sukses**: `{ "status": <httpStatus>, "data": { … } }`
**Envelope error**: `{ "status": "Failed", "error": "<pesan>" }` dengan HTTP
status code sesuai (400/401/403/404/409).

Flow lama FMS (`POST /v1/handovers` + upload BAST manual) tidak berubah.

---

## 0. Flow lengkap (urutan wajib)

```
┌─ App start / buka Profil
│  GET driver/v1/me/profile  ──────────────────────────────── [driver-service]
│    └─ isEligibilityToSelfHandover == false → menu "Motor" TIDAK muncul. Stop.
│    └─ true → menu "Motor" muncul; simpan driverProviders[] (+pitstops[])
│
├─ SERAH TERIMA (belum pegang unit)
│  1. Scan QR label unit → vehicleID
│  2. GET /v1/handovers/self/vehicles/:vehicleID ───────────── [fleet-service]
│       200 → sheet konfirmasi unit; 409/400/404 → lihat §2
│  3. Form: client & pitstop dipilih dari driverProviders profil
│     (auto-fill bila masing-masing hanya satu), odometer, ceklist, ttd SVG
│  4. POST /v1/handovers/self ──────────────────────────────── [fleet-service]
│       201 { handoverID, bastPending: true }
│  5. BAST digenerate asinkron → bastLink terisi di row (±detik)
│
└─ PENGEMBALIAN (sedang pegang unit; juga di-gate isEligibilityToSelfHandover)
   6. PATCH /v1/handovers/self/:id/return ─────────────────── [fleet-service]
        200 { handoverID, bastPending: true } → returnBastLink menyusul
```

---

## 1. `GET driver/v1/me/profile` — eligibility + sumber client/pitstop

**Service: nest-driver-service** (endpoint existing; field baru ditandai 🆕).
Tanpa parameter — selalu profil pemilik token.

### Response `200` (potongan yang relevan untuk self handover)

```jsonc
{
  "status": 200,
  "data": {
    "uuid": "…", "code": "DRV-0421",
    "firstName": "Budi Santoso", "lastName": "",
    "email": "budi@mitra.co", "phoneNumber": "081234567890",
    "status": "ACTIVE",

    // Assignment provider/client — SUMBER field clientID/clientName di create.
    "driverProviders": [
      {
        "id": 7,
        "name": "PT Maju Bersama Logistik",
        "code": "MBL",
        // 🆕 pitstop assignment di bawah provider ini — SUMBER field
        // hubID/hubName di create. Auto-fill bila hanya satu.
        "pitstops": [
          { "id": 9, "name": "Hub Kemang", "code": "HUB-KMG" }
        ]
      }
    ],

    // 🆕 Gate fitur: true bila SALAH SATU provider di atas ada di env
    // SELF_HANDOVER_PROVIDER_IDS (driver-service, comma-separated: '1,2,3').
    // Menu "Motor" + self handover + self return hanya ada saat true.
    "isEligibilityToSelfHandover": true,

    // …field profil lain (handover, bike, tags, trainingModules, dst.) tidak
    // berubah — lihat GetMyDriverProfileResponseEntity.
    "handover": {
      "platNomor": "B 1234 ABC", "oemID": "…", "oemName": "ALVA",
      "modelName": "Cervo", "handoverDate": "2026-09-03T02:30:00.000Z",
      "vehicleHandoverImageURL": "https://…", "vehicleStnkLink": "https://…"
    }
  }
}
```

**Konfigurasi**: env baru di driver-service —
`SELF_HANDOVER_PROVIDER_IDS='1,2,3'` (kosong/unset = tidak ada yang eligible).

**Error**: `401 { "status": "Failed", "error": "Missing driver identity" }`.

---

## 2. `GET /v1/handovers/self/vehicles/:vehicleID` — gate pasca-scan

**Service: nest-fleet-service.** Dipanggil segera setelah scan QR label unit
(QR berisi vehicle ID), SEBELUM form ditampilkan.

### Request

```
GET /v1/handovers/self/vehicles/9f3a21c4-0000-4000-8000-000000000000
Authorization: Bearer <JWT driver>
```

### Response `200` — unit tersedia (IDLE, tanpa handover aktif)

Detail kendaraan lengkap (shape `GetByIDVehicleResponseModel`, sama dengan
detail vehicle FMS) — sheet konfirmasi dirender dari sini tanpa call lain:

```jsonc
{
  "status": 200,
  "data": {
    "ID": "9f3a21c4-…",
    "platNomor": "B 1234 ABC",
    "oemID": "uuid", "oemName": "ALVA",
    "modelID": "uuid", "modelName": "Cervo",
    "modelPurchasePrice": 25000000, "modelSellingPrice": 1500000,
    "modelDeposit": 500000, "modelContractType": "RTO",
    "color": "Matte Black",
    "vin": "MH1ALVA00XK000001",
    "engineNumber": null,
    "imei": "86451203991122",
    "status": "IDLE",
    "processType": "AVAILABLE",
    "hubID": 9, "hubName": "Hub Kemang",
    "hubCityID": 3, "hubCityName": "Jakarta Selatan",
    "businessUnit": "LOGISTIC", "entity": null,
    "stnkLink": "https://…", "vehicleImageURL": "https://…"
    // …field lain GetByIDVehicleResponseModel ikut terkirim
  }
}
```

### Response `409` — unit dipegang PEMANGGIL sendiri

```jsonc
// HTTP 409
{ "status": "Failed", "error": "Vehicle ini sedang Anda booking" }
```

App: arahkan ke layar Motor (unit aktif) — jangan tampilkan sebagai error.

### Response `409` — unit dipegang MITRA LAIN (+ alert Slack)

```jsonc
// HTTP 409
{ "status": "Failed", "error": "Vehicle ini sedang dipakai oleh mitra lain, silakan hubungi ops untuk konfirmasi" }
```

Side effect: **alert Slack otomatis** ke channel ops (webhook issue/incident,
fallback maintenance — `SLACK_ISSUE_INCIDENT_NOTIF_URL` →
`SLACK_MAINTENANCE_NOTIF_URL`) berisi unit, pemegang, siapa yang scan, dan
tombol View Vehicle ke FMS. Best-effort — Slack down tidak mengubah respons.

### Error lain

```jsonc
// HTTP 404
{ "status": "Failed", "error": "Vehicle is not found" }
// HTTP 400 — unit bebas tapi non-IDLE
{ "status": "Failed", "error": "Vehicle tidak tersedia untuk serah terima (status IN_REPAIR)" }
```

---

## 3. `POST /v1/handovers/self` — serah terima

**Service: nest-fleet-service.** Identitas driver dari JWT + internal read
driver-service — body TANPA `driverID`/`driverName`/`driverCode`/`createdBy`.

### Request

```jsonc
POST /v1/handovers/self
Authorization: Bearer <JWT driver>
Content-Type: application/json

{
  // dari hasil gate §2
  "vehicleID": "9f3a21c4-0000-4000-8000-000000000000",   // wajib

  // dari profil driver §1 — driverProviders (+pitstops), auto-fill bila satu.
  // Profil hanya tahu { id, name, code } — CUKUP kirim hubID (+hubName):
  // hubCityID/hubCityName TIDAK PERLU dikirim, server melengkapinya dari
  // core GET /v1/pitstop/:hubID (best-effort; core down → nilai yang dikirim
  // dipakai apa adanya).
  "clientID": 7,                        // opsional (int)
  "clientName": "PT Maju Bersama Logistik",              // opsional
  "hubID": 9,                           // opsional (int) — pitstop terpilih dari profil
  "hubName": "Hub Kemang",              // opsional — server isi dari core bila kosong
  "hubCityID": 3,                       // opsional — server isi dari core bila kosong
  "hubCityName": "Jakarta Selatan",     // opsional — kota di dokumen BAST; server isi dari core bila kosong

  // input form
  "odometer": 1250,                     // wajib (int)
  "handoverDate": "2026-09-03T09:30:00+07:00",           // wajib (ISO 8601)
  "purchasePrice": 0,                   // opsional (int)
  "sellingPrice": 1500000,              // opsional (int)
  "deposit": 500000,                    // opsional (int)
  "depositMitraToDash": 2000000,        // opsional (int)
  "notes": "Unit kondisi baik, baterai 100%",            // opsional

  // tanda tangan mitra — SVG mentah dari signature pad
  "bastSignatureSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 160\"><rect width=\"300\" height=\"160\" fill=\"#ffffff\"/><path d=\"M20 85 L50 20 L80 110\" fill=\"none\" stroke=\"#111827\" stroke-width=\"2\"/></svg>",  // WAJIB

  // ceklist per-part — katalog: GET /v1/handovers/checklist-catalog
  "checklistItems": [                   // wajib, min 1
    { "code": "spion_kiri",  "present": true,  "photoUrl": "https://…" },
    { "code": "spion_kanan", "present": true,  "photoUrl": "https://…" },
    { "code": "kunci_cadangan", "present": false }
  ]
}
```

**Aturan `bastSignatureSvg`** (dilanggar → `400`, handover tidak dibuat):
root `<svg>`; maks **256 KB**; dilarang `<script>`, atribut `on*`,
`<foreignObject>`, `<!DOCTYPE`/`<!ENTITY`, `javascript:`, `href`/`xlink:href`
eksternal (hanya `#fragment` dan `data:` yang boleh).

**Kode checklist valid**: `spion_kiri`, `spion_kanan`, `kunci_utama`,
`kunci_cadangan`, `remote_utama`, `remote_cadangan`, `plat_depan`,
`plat_belakang`, `battery`, `battery_2`, `charger`, `tracker_iot`,
`body_depan`, `body_samping_kiri`, `body_samping_kanan`, `body_belakang`.
Item tak dikirim = `present: false`; item `body_*` bila dikirim wajib
`present: true`; foto wajib per item present bila flag
`REQUIRE_HANDOVER_CHECKLIST_PHOTO` menyala.

### Response `201`

```jsonc
{
  "status": 201,
  "data": {
    "handoverID": "3c9d1e70-…",
    "bastPending": true      // BAST digenerate asinkron; bastLink menyusul
  }
}
```

Side effect: unit → `ACTIVE`; `bast_signature` tersimpan; Cloud Task generate
BAST di-enqueue (best-effort).

### Error

```jsonc
// 400 — validasi
{ "status": "Failed", "error": "Signature SVG contains a forbidden event handler attribute" }
{ "status": "Failed", "error": "Vehicle is not idle" }
{ "status": "Failed", "error": "Cannot assign driver Budi Santoso has an active handover" }
{ "status": "Failed", "error": "Vehicle is booked by driver Rider Lain (DRV-0777)" }
{ "status": "Failed", "error": "Driver 42 is not found" }
// 401 — token bukan DRIVER
```

---

## 4. `PATCH /v1/handovers/self/:id/return` — pengembalian

**Service: nest-fleet-service.** Hanya pemilik row (ownership by JWT).

### Request

```jsonc
PATCH /v1/handovers/self/3c9d1e70-…/return
Authorization: Bearer <JWT driver>
Content-Type: application/json

{
  "returnDate": "2026-09-10T16:00:00+07:00",  // wajib (ISO 8601)
  "returnOdometer": 4321,                     // wajib (int)
  "returnCondition": "GOOD",                  // wajib: GOOD | MINOR_DAMAGE | MAJOR_DAMAGE
  "returnReason": "CONTRACT_END",             // wajib: CONTRACT_END | MITRA_RESIGN | VEHICLE_SWAP | CLIENT_REQUEST | ACCIDENT | OTHER
  "returnReasonOther": "…",                   // wajib bila reason == OTHER
  "vehicleReturnImageURL": "https://storage.googleapis.com/…/foto-unit.jpg",        // wajib (URL)
  "vehicleAndMitraReturnImageURL": "https://storage.googleapis.com/…/foto-mitra.jpg", // wajib (URL)
  "returnBastSignatureSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\">…</svg>",     // WAJIB — aturan sama §3
  "returnNotes": "Baret tipis body kiri",     // opsional
  "checklistItems": [                          // opsional — item rusak bawa condition+note
    { "code": "spion_kanan", "present": true, "condition": "DAMAGED", "note": "retak" }
  ]
}
```

### Response `200`

```jsonc
{
  "status": 200,
  "data": { "handoverID": "3c9d1e70-…", "bastPending": true }
}
// Row yang sudah RETURNED → no-op idempoten:
{ "status": 200, "data": { "handoverID": "3c9d1e70-…", "bastPending": false } }
```

Side effect: handover → `RETURNED`; unit → `IDLE` (`MAJOR_DAMAGE` → `BROKEN`);
`return_bast_signature` tersimpan; generate BAST return di-enqueue.

### Error

```jsonc
// 403 — bukan pemilik
{ "status": "Failed", "error": "Handover does not belong to this driver" }
// 404
{ "status": "Failed", "error": "Handover is not found" }
// 400
{ "status": "Failed", "error": "Cannot return handover with status WAITING_HANDOVER. Only ACTIVE handovers can be returned." }
{ "status": "Failed", "error": "Vehicle still used in another issue/repo/maintenance" }
```

---

## 5. Callback generate BAST (bukan untuk app)

```
POST /v1/handovers/self/:id/generate-bast          → leg HANDOVER
POST /v1/handovers/self/:id/generate-return-bast   → leg RETURN
Auth: INTERNAL_SERVICE (Cloud Tasks) + WEB (regenerate manual dari FMS)
Body: { "requestedBy": "email@dash.co" }            // opsional; fallback "system"
```

### Response — selalu `200` kecuali error transient (`5xx` = sinyal retry queue)

```jsonc
// sukses
{ "status": 200, "data": { "generated": true, "bastLink": "https://storage.googleapis.com/…/3c9d1e70-…/bast-handover.pdf" } }
// skip terminal (tidak diretry)
{ "status": 200, "data": { "generated": false, "bastLink": null, "skippedReason": "MISSING_MITRA_SIGNATURE" } }
// idempoten
{ "status": 200, "data": { "generated": false, "bastLink": "https://…/bast-handover.pdf", "skippedReason": "ALREADY_GENERATED" } }
```

| `skippedReason` | Arti |
|---|---|
| `HANDOVER_NOT_FOUND` | ID tidak ada |
| `ALREADY_GENERATED` | Link leg tsb. sudah terisi (idempoten) |
| `RENT_ROW` | Row milik Dash Rent — generator rent yang mendokumentasikan |
| `MISSING_MITRA_SIGNATURE` | Kolom signature leg tsb. kosong (row upload manual) |
| `NOT_PICKED_UP` / `NOT_RETURNED` | `handoverDate` / `returnDate` belum ada |

Dokumen: template `bast-self-handover.v1.hbs` (PT. Dash Elektrik Indonesia;
blok ttd PIHAK PERTAMA sengaja kosong — hanya ttd mitra yang dicetak),
nomor `{8-hex UUID}/BAST/FL-DE/{romawi}/{yy}` (return: `BAST-RTN`), tersimpan
di `{handoverID}/bast-handover.pdf` / `bast-return.pdf` bucket utama.
Guard tulis: `WHERE bast_link IS NULL` / `WHERE return_bast_link IS NULL` —
duplicate delivery tidak pernah menimpa dokumen terbit.

---

## 6. Data model & konfigurasi

**Kolom baru `handover` (fleet, migration `0133`)**: `bast_signature`,
`return_bast_signature` (SVG mentah), `return_bast_number`,
`return_bast_template_version`, `return_bast_generated_at`. Leg handover
memakai kolom `bast_*` lama (shared dengan rent, dipisah guard `IS NULL`).

**Env**:

| Service | Env | Nilai |
|---|---|---|
| driver-service | `SELF_HANDOVER_PROVIDER_IDS` 🆕 | `'1,2,3'` — allowlist provider; kosong = tidak ada yang eligible |
| fleet-service | `BAST_GENERATION_MODE` / `BAST_GENERATION_QUEUE_NAME` / `FLEET_BASE_URL` / `DRIVER_BUCKET_MAIN_NAME` | reuse existing (rent BAST) — tidak ada env baru |
