# E2E Test — Self Handover Mitra (curl)

Companion [API_CONTRACT_SELF_HANDOVER.md](./API_CONTRACT_SELF_HANDOVER.md).
Semua langkah bisa dijalankan di lokal/staging tanpa aplikasi mobile.

> **Mode dev**: bila `BAST_GENERATION_MODE` bukan `cloud-tasks` (default lokal
> `fake`), create/return **tidak** benar-benar enqueue — hanya log. Jadi di
> dev, setelah create/return, trigger endpoint generate **manual** (langkah 3
> & 6). Di staging `cloud-tasks`, langkah itu terjadi otomatis beberapa detik
> setelah commit.

## Persiapan

```bash
export BASE_URL=http://localhost:3000        # fleet-service (sesuaikan APP_PORT / host staging)
export DRIVER_BASE_URL=http://localhost:3001 # driver-service
export DRIVER_TOKEN="<JWT driver>"           # login akun driver test via driver-service
export WEB_TOKEN="<JWT FMS web>"             # untuk generate manual / verifikasi
```

Butuh: satu unit ber-status **IDLE** (`vehicleID`-nya), dan driver test
**tanpa handover aktif**. Katalog kode checklist:
`GET $BASE_URL/v1/handovers/checklist-catalog`.

SVG contoh yang lolos validasi:

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160"><rect width="300" height="160" fill="#ffffff"/><path d="M20 85 L50 20 L80 110 L110 60 L160 20" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round"/></svg>
```

## Happy path

### -1. Eligibility — profil driver (driver-service)

```bash
curl -sS "$DRIVER_BASE_URL/driver/v1/me/profile" \
  -H "Authorization: Bearer $DRIVER_TOKEN" | python3 -m json.tool
```

✅ Expect `data.isEligibilityToSelfHandover: true` (provider driver ada di env
`SELF_HANDOVER_PROVIDER_IDS` driver-service) dan
`data.driverProviders[].pitstops[]` terisi — sumber client & pitstop di
langkah 1. Kalau `false`: fitur tidak boleh tampil di app; set env dulu.

### 0. Gate pasca-scan — check unit (token DRIVER)

```bash
curl -sS "$BASE_URL/v1/handovers/self/vehicles/<UUID unit IDLE>" \
  -H "Authorization: Bearer $DRIVER_TOKEN" | python3 -m json.tool
```

✅ Expect `200` + detail kendaraan lengkap (plat, model, OEM, warna, hub,
status `IDLE`) — data yang dirender sheet konfirmasi di app.

### 1. Create self handover (token DRIVER)

```bash
curl -sS -X POST "$BASE_URL/v1/handovers/self" \
  -H "Authorization: Bearer $DRIVER_TOKEN" -H "Content-Type: application/json" -d '{
  "vehicleID": "<UUID unit IDLE>",
  "clientID": 7, "clientName": "PT Maju Bersama Logistik",
  "hubID": 9, "hubName": "Hub Kemang",
  "odometer": 1250,
  "handoverDate": "2026-09-03T09:30:00+07:00",
  "sellingPrice": 1500000, "deposit": 500000, "depositMitraToDash": 2000000,
  "bastSignatureSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 160\"><rect width=\"300\" height=\"160\" fill=\"#ffffff\"/><path d=\"M20 85 L50 20 L80 110\" fill=\"none\" stroke=\"#111827\" stroke-width=\"2\"/></svg>",
  "checklistItems": [
    { "code": "spion_kiri", "present": true }, { "code": "spion_kanan", "present": true },
    { "code": "plat_depan", "present": true }, { "code": "plat_belakang", "present": true },
    { "code": "battery", "present": true }, { "code": "battery_2", "present": true },
    { "code": "charger", "present": true }, { "code": "remote_utama", "present": true }
  ]
}' | python3 -m json.tool
```

✅ Expect `201`, `data.handoverID`, `bastPending: true`. Simpan:
`export HID=<handoverID>`.

✅ Side effect: unit jadi `ACTIVE`; row punya `bast_signature` terisi,
`bast_link` NULL; **kolom `hub_city_id`/`hub_city_name` terisi** walau tidak
dikirim — fleet melengkapinya dari core `GET /v1/pitstop/9`. (client & hub
dari profil driver — langkah -1.)

### 2. (staging) tunggu ±10 detik / (dev) lanjut langkah 3

### 3. Generate BAST manual — token WEB/internal

```bash
curl -sS -X POST "$BASE_URL/v1/handovers/self/$HID/generate-bast" \
  -H "Authorization: Bearer $WEB_TOKEN" -H "Content-Type: application/json" \
  -d '{"requestedBy":"qa@dashelectric.co"}' | python3 -m json.tool
```

✅ Expect `generated: true` + `bastLink` berakhiran
`/{handoverID}/bast-handover.pdf`.

✅ Buka PDF-nya, cek terhadap dokumen resmi: kop **PT. DASH ELEKTRIK
INDONESIA**; nomor `XXXXXXXX/BAST/FL-DE/{romawi}/{yy}` (tanpa segmen OEM);
PIHAK KEDUA = nama driver + NIK + **Alamat Domisili** + No. HP + **Kontak
Darurat** (dari KYC driver-service — "-" bila KYC kosong); lembar ceklist 9
baris tanpa kolom harga, ✓ sesuai payload; PASAL 1–6; blok ttd PIHAK PERTAMA
**kosong** (hanya garis — keputusan produk, Dash tidak ttd digital) + ttd
mitra (SVG payload); footer `Template self-handover v1`.

### 4. Idempotency — hit generate lagi

```bash
curl -sS -X POST "$BASE_URL/v1/handovers/self/$HID/generate-bast" \
  -H "Authorization: Bearer $WEB_TOKEN" -H "Content-Type: application/json" -d '{}' | python3 -m json.tool
```

✅ Expect `generated: false`, `skippedReason: "ALREADY_GENERATED"`,
`bastLink` **identik** dengan langkah 3.

### 5. Return self handover (token DRIVER, pemilik row)

```bash
curl -sS -X PATCH "$BASE_URL/v1/handovers/self/$HID/return" \
  -H "Authorization: Bearer $DRIVER_TOKEN" -H "Content-Type: application/json" -d '{
  "returnDate": "2026-09-10T16:00:00+07:00",
  "returnOdometer": 4321,
  "returnCondition": "GOOD",
  "returnReason": "CONTRACT_END",
  "vehicleReturnImageURL": "https://storage.googleapis.com/<temp-bucket>/foto-return.jpg",
  "vehicleAndMitraReturnImageURL": "https://storage.googleapis.com/<temp-bucket>/foto-mitra.jpg",
  "returnBastSignatureSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 160\"><rect width=\"300\" height=\"160\" fill=\"#ffffff\"/><path d=\"M20 40 L80 120 L140 40\" fill=\"none\" stroke=\"#111827\" stroke-width=\"2\"/></svg>",
  "checklistItems": [
    { "code": "spion_kanan", "present": true, "condition": "DAMAGED", "note": "retak" }
  ]
}' | python3 -m json.tool
```

✅ Expect `200`, `bastPending: true`. Unit balik `IDLE`
(`MAJOR_DAMAGE` → `BROKEN`).

### 6. Generate return BAST (dev: manual)

```bash
curl -sS -X POST "$BASE_URL/v1/handovers/self/$HID/generate-return-bast" \
  -H "Authorization: Bearer $WEB_TOKEN" -H "Content-Type: application/json" -d '{}' | python3 -m json.tool
```

✅ Expect `bastLink` berakhiran `/bast-return.pdf`; nomor `…/BAST-RTN/FL-DE/…`;
judul "BERITA ACARA PENGEMBALIAN…"; **tanpa** PASAL; keterangan ceklist
"Kaca Spion Kanan: rusak (retak)".

### 7. Verifikasi state akhir

`GET $BASE_URL/v1/handovers/$HID` (token WEB) → `bastLink` dan
`returnBastLink` terisi URL GCS.

## Negative tests

| # | Skenario | Perintah (inti) | Expect |
|---|---|---|---|
| N1 | Token WEB ke endpoint self | `POST /v1/handovers/self` dgn `$WEB_TOKEN` | `401`/`403` |
| N2 | SVG berbahaya | `bastSignatureSvg: "<svg onload=\"alert(1)\"></svg>"` | `400`, handover tidak dibuat |
| N3 | SVG > 256 KB | payload digelembungkan | `400` |
| N4 | Unit non-IDLE | `vehicleID` unit ACTIVE | `400 "Vehicle is not idle"` |
| N5 | Rider masih pegang unit | create kedua dgn driver sama | `400 "…has an active handover"` |
| N6 | Return punya orang lain | `PATCH /self/<HID-driver-lain>/return` | `403` |
| N7 | Return dua kali | ulangi langkah 5 | `200`, `bastPending: false` (no-op) |
| N8 | Generate di row rent | `POST /self/<handover-milik-rental>/generate-bast` | `200`, `skippedReason: "RENT_ROW"` |
| N9 | Generate di row lama (upload manual) | `POST /self/<handover-legacy>/generate-bast` | `200`, `skippedReason: "MISSING_MITRA_SIGNATURE"` |
| N10 | Flow lama tetap utuh | `POST /v1/handovers` payload lama + `bastLink` | perilaku tidak berubah |
| N11 | Check unit milik sendiri | `GET /self/vehicles/<unit yg sedang dipegang>` dgn token pemegangnya | `409 "Vehicle ini sedang Anda booking"` |
| N12 | Check unit milik mitra lain | `GET /self/vehicles/<unit driver lain>` | `409 "…dipakai oleh mitra lain…"` **dan** alert muncul di channel Slack ops (issue/maintenance) |
| N13 | Check unit non-IDLE tanpa handover | `GET /self/vehicles/<unit IN_REPAIR>` | `400 "Vehicle tidak tersedia…"` |
| N14 | Eligibility off | kosongkan `SELF_HANDOVER_PROVIDER_IDS` di driver-service → hit profil | `isEligibilityToSelfHandover: false` (app wajib menyembunyikan fitur) |

## Test otomatis yang sudah ada (jalankan sebelum rilis)

```bash
npx jest src/modules/handover src/modules/rent-ops
```

- `check-self-handover-vehicle.usecase.spec.ts` — 200 detail, 409 milik
  sendiri (tanpa alert), 409 mitra lain (+ isi alert Slack), Slack gagal →
  tetap 409, 404, 400 non-IDLE.
- `create-self-handover.usecase.spec.ts` — gate SVG, identitas dari token
  (bukan body), driver tak dikenal, ownership 403/404, enqueue post-commit.
- `generate-self-bast.usecase.spec.ts` — semua skip reason, idempotency,
  race di record guard, transient → throw, isi HTML (NIK/alamat/kontak
  darurat/PT Elektrik, nomor tanpa OEM, IMEI bukan engine_number).
- `validate-signature-svg.spec.ts` — seluruh aturan sanitasi.
- Suite rent (`bast-template.spec`, `generate-bast.usecase.spec`) — bukti
  dunia rent tidak berubah.
