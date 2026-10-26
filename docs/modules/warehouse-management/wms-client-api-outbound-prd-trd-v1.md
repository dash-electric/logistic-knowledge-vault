---
title: WMS — Client API create outbound request (fase 2)
module: warehouse-management
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:
engineer:
created: 2026-10-22
links:
  context: ./wms-context-v1.md
  parent: ./wms-prd-trd-v2.md  (§ "Client — fase 2 (kontrak dikunci, belum diimplementasi)")
  api-key: nest-logistic-service docs/api-integration/api-key.md
  webhook: nest-logistic-service docs/api-integration/webhook-payload-v2.md
  sync: nest-logistic-service docs/warehouse/outbound-order-shipment-sync.md
  contract: nest-logistic-service docs/api-integration/outbound-order.md  (kontrak partner — fase 1 API, fase 2 webhook + toggle)
  mockup: ./wms-client-api-outbound-mockup-v1.html  (interaktif — Link › Developer › Webhooks: Shipment + Outbound order, Webhook list)
  webhook-trd: ./wms-outbound-order-webhook-prd-trd-v1.md  (webhook status order + Webhook list — memperluas dokumen ini)
  presentation:
---

# WMS — Client API create outbound request — PRD/TRD v1

Dokumen ini mengimplementasikan kontrak fase 2 yang sudah dikunci di `wms-prd-trd-v2.md` (§ Client — fase 2). Yang baru di
sini: detail body, aturan hub, idempotensi, respons teredaksi, pelacakan status, dan sandbox. Aturan validasi, state machine,
dan sambungan WMS ↔ Shipments **tidak diubah**, hanya dirujuk.

---

# Part 1 — Product Requirements (PRD)

## Problem

Client WMS (pilot: SwipeRX) sekarang memasukkan outbound request lewat **form manual** atau **upload CSV** di web ops. Dua-duanya
butuh orang Dash: ops mengetik ulang atau client mengirim file lalu ops meng-upload. Dampaknya:

- Order sampai ke gudang **terlambat** (menunggu jam kerja ops / batch upload), padahal picking FEFO dan surat jalan sudah otomatis.
- **Salah ketik** alamat/SKU/qty di jalur manual, yang sekarang harus dibetulkan lewat "Ubah" atau cancel & buat ulang.
- Client tidak punya **konfirmasi mesin** bahwa order diterima (hanya WA / email ke ops), dan tidak bisa mencocokkan status
  ke sistemnya sendiri sampai AWB terbit.

Client yang sama sudah terintegrasi lewat `POST /v1/integration/shipments` (API key + webhook) untuk shipment non-gudang,
jadi jalur mesin-ke-mesin-nya sudah ada; yang belum ada adalah pintu masuk **order gudang**.

## Context

- WMS v2 sudah menyiapkan pintu ketiga: `OutboundOrderSource.CLIENT_API`, kolom `wh_outbound_orders.api_key_id` dan
  `is_sandbox`, idempotensi `(client_id, external_id, is_sandbox)`, baris timeline "Order diterima dari client API", dan satu
  validator untuk tiga pintu. Tidak ada migration baru.
- Modul `api-integration` sudah punya API key (`dash_live_` / `dash_test_`), scope, guard, filter error, dan webhook
  `shipment.*` ke partner. Order WMS yang di-ship membuat shipment dengan `bookingId = externalID`, jadi webhook yang sudah
  dipakai client **otomatis** memberi status pengiriman tanpa event baru.
- Keputusan produk yang sudah ada (v2 §Key decisions no. 11): **key & scope yang sama** dengan shipments (`shipments:write`),
  controller di modul WMS.

## Users & jobs

| Pengguna | Pekerjaan |
|---|---|
| **Sistem client** (ERP / OMS SwipeRX) | Kirim order ke gudang Dash begitu order mereka terbentuk; tahu order diterima (id + kode); kirim ulang aman kalau timeout; tahu kalau SKU / alamat salah **saat itu juga**; lihat status order & pengiriman. |
| **Integrator client** | Coba dulu di sandbox dengan key `dash_test_` tanpa mengganggu data gudang; baca contoh request/response. |
| **Ops gudang Dash** | Melihat order API di daftar Outbound request seperti order manual/CSV (sumber "Client API"), lalu memprosesnya tanpa langkah tambahan. Tidak melihat order sandbox. |
| **Ops integrasi Dash** | Mengaktifkan hub untuk client, memberi key, dan menelusuri order yang ditolak. |

## Scope

### In scope
- `POST /v1/integration/outbound-orders` — buat satu outbound request REGULAR, idempoten per `externalID`.
- `GET /v1/integration/outbound-orders/:id` dan `GET /v1/integration/outbound-orders` (daftar milik client) — respons
  **teredaksi** (tanpa bin, picker, lot, catatan ops).
- `POST /v1/integration/outbound-orders/:id/cancel` — selama order belum SHIPPED (aturan sama dengan ops).
- Sandbox: key `dash_test_` → order `is_sandbox`, tidak tampil di ops, idempotensi terpisah per environment.
- Pelacakan: status order di GET + webhook `shipment.*` yang sudah ada setelah AWB terbit (`bookingId = externalID`).
- Peringatan stok dalam respons create (informasi, tidak memblokir — sama dengan form).
- Koleksi API (`dash-api-collections`, "Dash Integration") + contoh sukses/gagal untuk partner.
- **Ubah hub di detail outbound request (web ops):** karena hub dipilih otomatis (terdekat), ops harus bisa memindahkan order
  ke hub lain selama `OPEN` — lewat "Ubah" yang sudah ada, dengan pilihan hub yang menampilkan jarak + ketersediaan stok.

### Out of scope
- Order **TRANSFER** antar hub lewat API (hanya form manual).
- **Ubah** order lewat API (penerima/alamat/jarak) — client cancel lalu buat ulang dengan `externalID` baru.
- Upload CSV lewat API, bulk create (satu request = satu order; client memanggil berulang).
- Event webhook untuk status order gudang — **dipindah** ke `wms-outbound-order-webhook-prd-trd-v1.md` (topik
  `OUTBOUND_ORDER`), bukan lagi non-goal.
- Katalog SKU lewat API (SKU tetap didaftarkan ops / import).
- Client memilih hub (`hubID` di body) atau mengubah hub setelah order dibuat — hub dipilih server (Req. 4).
- Pemilihan hub berdasarkan zona/jarak jalan (Mapbox): fase ini haversine saja.
- Rate limit per key (mengikuti kondisi `api-key.md`: belum ada).
- Scope baru (`warehouse:*`), key per hub, portal self-service untuk hub.

## Requirements

1. Client yang memegang key dengan scope `shipments:write` (atau `all`) dapat membuat outbound request dengan satu POST;
   identitas client **hanya** dari key (`auth.provider_id`), tidak pernah dari body.
2. `externalID` wajib dan unik per `(client, environment)`. POST ulang dengan `externalID` yang sudah ada menjawab
   `200 { result: "EXISTS" }` beserta order yang ada — **tanpa** membandingkan body (idempotensi by key, bukan by isi).
3. Body divalidasi oleh **`OutboundOrderValidator` yang sama** dengan form dan CSV (v2 § Validasi): semua masalah dijawab
   sekaligus (`422 VALIDATION`, `errors[]` per field), `SKU_INACTIVE` bila hanya itu masalahnya.
4. **Hub dipilih server**, client tidak mengirim `hubID` (field `hubID` yang dikirim → `422 hubID`). Aturan:
   1. Kandidat = hub Dash (core-service tipe HUB, `hasStaff`, koordinat valid) yang punya storage tree WMS.
   2. **Hub terdekat** ke titik tujuan (haversine garis lurus, `DistanceHelper.haversineKm`) menjadi `hubID`; seri →
      `hubId` lebih kecil. Jarak hanya untuk memilih, **tidak disimpan** (`distance` order tetap `null`, dispatch yang
      mengukur); dikembalikan sekali di respons create sebagai `hubDistanceKm` (informasi).
   3. Stok **tidak** menggeser pilihan hub, tapi dicek di **semua** hub kandidat untuk client itu (satu query): per SKU,
      available di hub terpilih vs qty → `stockWarnings[]`, masing-masing dengan `availableElsewhere[]` (hub lain yang
      memegang SKU itu + qty) supaya client dan ops tahu stok harus ditransfer dari mana. Order tetap dibuat (seperti form).
   4. Tidak ada hub kandidat sama sekali (belum ada hub dengan storage tree / koordinat) → `422 NO_HUB_AVAILABLE`.
   Hub tanpa koordinat valid di core-service dilewati (dilog `warn`).
5. Order yang berhasil lahir `OPEN`, `source = CLIENT_API`, `api_key_id` = key pemanggil, `createdBy` = prefix key, satu
   baris timeline "Order diterima dari client API · external ID … · hub terdekat: {nama} ({jarak} km)" (+ "stok kurang: SKU …,
   tersedia di {hub lain}" bila ada warning), dan tampil di
   daftar Outbound request ops dengan tag **Client API** — diproses persis seperti order lain (picking, ready, submit shipping).
6. Respons create memuat `hub` yang dipilih, `hubDistanceKm`, dan `stockWarnings` (SKU yang qty-nya melebihi available **di hub
   terpilih**, dengan `availableElsewhere[]`) sebagai informasi; order tetap dibuat.
7. GET detail & daftar hanya mengembalikan order **milik client** dan **environment key** yang sama (cross-client /
   cross-env → `404`, keberadaan tidak bocor), dengan field teredaksi (§ API contracts).
8. Cancel lewat API mengikuti aturan ops: hanya `OPEN | PREPARING | READY_TO_PICKUP`, wajib `reason`, melepas reservasi
   picking; `409 INVALID_STATUS_TRANSITION` selain itu. Dicatat di timeline dengan origin `CLIENT`.
9. Key `dash_test_` membuat order sandbox: tidak muncul di daftar/summary/export ops, tidak mengubah stok nyata saat
   di-ship (mengikuti `shipments.is_sandbox` yang ada), dan `externalID` boleh sama dengan order live.
10. Setelah submit shipping, client menerima webhook `shipment.*` yang sudah ada dengan `shipment.bookingId = externalID`
    dan `waybill`; GET order memuat `fulfillment.waybill`, dan `status` order mencerminkan pengiriman (`IN_DELIVERY` /
    `DELIVERED` / `FAILED`).
11. Setiap request ditolak oleh guard tercatat sebagai `AUTH_REJECTED` pada key (perilaku `api-key.md` yang ada).
12. Dokumentasi partner: satu halaman (body, kode error, contoh sukses/gagal, sandbox) + request di koleksi "Dash Integration".
13. **Ubah hub (ops).** Di detail outbound request, "Ubah" memuat field **Hub** selama `status = OPEN` (belum ada reservasi
    stok). Pilihan = hub kandidat yang sama dengan Req. 4 (hub Dash dengan storage tree), urut jarak, tiap opsi menampilkan
    jarak garis lurus ke tujuan dan cakupan stok ("stok 2/3 baris" + rincian per SKU). Simpan → `hub_id` + snapshot `hub`
    berganti, `distance` dihitung ulang mengikuti `DISTANCE_WMS_CALCULATION_MODE` (default `NONE` → `null`), dicatat di
    `outbound_request_data_history` (`HUB_UPDATED`, `{ hub_id, hub }` from→to) **tanpa** baris timeline (aturan edit data).
    Order `PREPARING` ke atas → `409 HUB_NOT_EDITABLE` (batalkan picking dulu → `OPEN` → ubah hub). Hanya order `REGULAR`
    (transfer antar hub tidak). Client melihat hub baru di `GET` berikutnya; tidak ada event webhook khusus (hub baru ikut
    di event status berikutnya — TRD webhook).

## Edge cases & failure states

| Kasus | Perilaku |
|---|---|
| Timeout di client setelah order tersimpan, client retry | `200 EXISTS` dengan order yang sama (idempoten). |
| Dua request paralel `externalID` sama | Satu `CREATED`, satu `EXISTS` (unique index + retry on unique violation yang ada). |
| `externalID` sama, isi berbeda | Tetap `EXISTS` dengan order lama; tidak ada update. Client harus cancel + buat ulang dengan id baru. |
| SKU tidak ada / nonaktif | `422 VALIDATION` (`lines[i].sku`, `SKU_NOT_IN_CATALOG`) / `422 SKU_INACTIVE`. Tidak ada order parsial. |
| Client belum punya storage/stok di hub mana pun | `422 NO_HUB_AVAILABLE` (pesan: hubungi Dash untuk mengaktifkan gudang). |
| Koordinat di luar Indonesia / tanggal lampau / qty ≤ 0 | `422 VALIDATION` dengan semua field bermasalah sekaligus. |
| Stok lengkap hanya di hub yang jauh | Hub **terdekat** tetap dipilih; `stockWarnings[].availableElsewhere` menyebut hub jauh itu → ops transfer antar hub (atau cancel & buat ulang manual di hub jauh). |
| Stok tidak ada di hub mana pun | Hub terdekat dipilih; `stockWarnings[]` dengan `availableElsewhere: []`; order tetap dibuat, picking nanti yang gagal (`INSUFFICIENT_STOCK`) dan ops yang menangani — lihat Open question 2. |
| Dua hub berjarak sama | Yang `hubID`-nya lebih kecil (deterministik, bisa direproduksi di log). |
| Core-service tidak bisa dihubungi saat memilih hub | `503 FULFILLMENT_UNAVAILABLE`; tidak ada yang ditulis; client retry (idempoten). |
| Hub kandidat tanpa koordinat | Dilewati saat memilih (dilog `warn`); bila itu satu-satunya kandidat → `422 NO_HUB_AVAILABLE`. |
| Key revoked / expired / scope kurang | `401` / `403` dari `ApiKeyGuard`, dicatat `AUTH_REJECTED`. |
| GET order milik client lain atau beda environment | `404 OUTBOUND_ORDER_NOT_FOUND`. |
| Cancel saat order sudah `SHIPPED` atau setelahnya | `409 INVALID_STATUS_TRANSITION` (client membatalkan shipment lewat `POST /v1/integration/shipments/:id/cancel` bila masih boleh). |
| Payload > batas (100 baris) | `422 VALIDATION` `lines`. |
| Ops ubah hub saat `OPEN` | Hub & snapshot berganti, `distance` dihitung ulang (mode default → `null`), data history `HUB_UPDATED`; order pindah ke daftar hub baru; `stockWarnings` tidak disimpan jadi tidak perlu dihitung ulang. |
| Ops ubah hub saat `PREPARING`/`READY_TO_PICKUP` | `409 HUB_NOT_EDITABLE` — stok sudah direservasi di hub lama; batalkan picking dulu. |
| Ops ubah hub ke hub yang stoknya juga kurang | Boleh (pilihan menampilkan cakupan stok sebagai informasi, bukan larangan). |
| Ops ubah hub pada order `TRANSFER` | Field Hub tidak ditampilkan; API → `422 hubID` (hanya `REGULAR`). |

## Success criteria

- Client pilot membuat ≥ 90 % outbound request-nya lewat API dalam 4 minggu setelah go-live (sumber `CLIENT_API` di daftar).
- Nol order dobel dari retry client (tidak ada dua order dengan `externalID` sama per client/env — dijamin index).
- Waktu dari order terbentuk di sistem client sampai tampil di Outbound request ops < 1 menit (sebelumnya: menunggu upload).
- Penolakan validasi dijawab di request pertama (tidak ada order yang harus dibetulkan ops karena salah ketik dari API).
- Tidak ada laporan "status tidak sampai": webhook shipment untuk order API terkirim dengan `bookingId = externalID`.

---

# Part 2 — Technical Requirements (TRD)

## Summary

Tambahkan controller `WarehouseIntegrationController` di modul `warehouse` (`/v1/integration/outbound-orders`), dijaga
`ApiKeyGuard` + `@Scopes(shipments:*)` dan `IntegrationExceptionFilter` seperti `IntegrationShipmentController`. Create
memanggil `CreateOutboundOrderUseCase` yang sudah ada dengan `source = CLIENT_API`, client/sandbox/key dari `auth`;
`EXTERNAL_ID_TAKEN` yang dilempar use case diubah menjadi `200 EXISTS` oleh use case pembungkus. GET/daftar/cancel membungkus
use case ops yang ada dengan pembatasan `clientId` + `isSandbox` dan pemetaan ke entity teredaksi. Tidak ada tabel, kolom,
scope, event, atau port baru.

## Architecture

- **Modul:** `warehouse` (controller + 4 use case integrasi + DTO + entity). Tetap **tidak mengimpor** modul lain
  (`warehouse-architecture.spec.ts`); `ApiKeyGuard`, `Scopes`, `IntegrationExceptionFilter` ada di `@infrastructure`, jadi
  tidak melanggar aturan.
- **Auth:** `ApiKeyGuard` mensintesis `BaseAuthPayload` (`type: CLIENT_USER`, `provider_id = client_id`,
  `is_sandbox = environment === 'TEST'`). Fallback JWT `PROVIDER_USER`/`CLIENT_USER` seperti shipments (portal client).
  `apiKeyId` diambil dari `auth` (perlu guard mengisi `auth.api_key_id` — lihat Key decisions no. 4).
- **Alur status** tidak berubah: order → GI → submit shipping → shipment (`bookingId = externalID`) → webhook
  `shipment.*` → status balik ke order lewat PubSub. Lihat `outbound-order-shipment-sync.md`.
- **Pemilihan hub (`OutboundHubSelector`, domain service WMS, pure + dua query):**
  1. `WarehouseRepository.listHubsWithStorages()` → id hub yang punya storage tree (query baru, `SELECT DISTINCT hub_id
     FROM wh_storages`, kecil).
  2. `CoreService.listHubs()` → hub Dash (`GET /v1/pitstop?type=HUB&hasStaff=true&size=100`, **call baru** di
     `CoreService`, di-cache 60 detik seperti masterdata di adapter) → koordinat; irisan dengan (1) = kandidat.
  3. Pure: `haversineKm(tujuan, hub)` tiap kandidat → terkecil (seri → `hubId` terkecil) = `hubId`. Hub tanpa koordinat
     dilewati. Diuji unit tanpa DB.
  4. `WarehouseRepository.sumAllocatableBySkuAcrossHubs(hubIds, clientId, skus)` → available per (hub, SKU) dalam **satu**
     query (varian `sumAllocatableBySku` yang sudah ada, `GROUP BY hub_id, sku`) → `stockWarnings` (hub terpilih) +
     `availableElsewhere` (hub lain). **Tidak mengubah** pilihan hub.
  Semua di luar transaksi (seperti `loadContext`); `hubId` + snapshot nama/kode + jarak diteruskan ke use case create yang
  ada. Form manual & CSV **tidak berubah** (ops tetap memilih hub).

```
Client ──x-api-key──▶ WarehouseIntegrationController (warehouse)
                        ├─ create ──▶ CreateIntegrationOutboundOrderUseCase
                        │               ├─ OutboundHubSelector (kandidat → terdekat haversine; stok semua hub → warnings)
                        │               └─▶ CreateOutboundOrderUseCase (ada, hubId hasil pilihan)
                        ├─ get/list ─▶ Get/ListIntegrationOutboundOrdersUseCase ─▶ OutboundOrderRepository (filter client+sandbox)
                        └─ cancel ──▶ CancelIntegrationOutboundOrderUseCase ──▶ CancelOutboundOrderUseCase (ada)
```

## API contracts

Semua: `@Controller('v1/integration/outbound-orders')`, `@UseGuards(ApiKeyGuard)`, `@UseFilters(IntegrationExceptionFilter)`,
`@AuthTypes(PROVIDER_USER, CLIENT_USER)`. Envelope sukses `{ status: "Success", data }`; gagal
`{ status: "Failed", error, code?, errors? }` (filter integrasi yang ada; `errors[]` diteruskan dari `WarehouseErrors`).

```
POST /v1/integration/outbound-orders            @Scopes(shipments:write)   HTTP 200
GET  /v1/integration/outbound-orders            @Scopes(shipments:read)
GET  /v1/integration/outbound-orders/:id        @Scopes(shipments:read)
POST /v1/integration/outbound-orders/:id/cancel @Scopes(shipments:cancel)  HTTP 200
```

### POST — body (`CreateIntegrationOutboundOrderRequestDto`)

```jsonc
{
  "externalID": "SO-2026-001234",          // wajib; trim; unik per client + environment
                                            // (tidak ada hubID — hub dipilih server, Req. 4; field `hubID` yang dikirim ditolak 422 `hubID`)
  "serviceType": "SAME_DAY",                // opsional: SAME_DAY (default) | NEXT_DAY
  "expectedDeliveryDate": "2026-10-24",     // wajib; YYYY-MM-DD; ≥ hari ini WIB
  "recipient": { "name": "Apotek Sehat", "phone": "081234567890" },      // keduanya wajib; telepon bebas format
  "destination": {
    "address": "Jl. Kemang Raya No. 8, Jakarta Selatan",                 // wajib
    "latitude": -6.2615, "longitude": 106.8139,                          // wajib; wilayah Indonesia
    "notes": "Pagar hijau"                                               // opsional
  },
  "lines": [ { "sku": "100001", "qty": 12 } ],   // 1–100 baris; SKU unik; qty > 0, ≤ 2 desimal, ≤ 1.000.000
  "notes": "Kirim pagi"                           // opsional
}
```

Penjelasan field (semua masalah dijawab sekaligus di `errors[]`):

| Field | Tipe | Wajib | Aturan | `errors[].field` |
|---|---|---|---|---|
| `externalID` | string | **ya** | trim, tidak kosong; unik per client **per environment**; **tanpa batas panjang**; nilai sama → `200 EXISTS` | `externalID` |
| `serviceType` | `SAME_DAY` \| `NEXT_DAY` | tidak — default `SAME_DAY` | nilai lain → 422 | `serviceType` |
| `expectedDeliveryDate` | string `YYYY-MM-DD` | **ya** | tanggal valid, **≥ hari ini WIB** (`ctx.today`) | `expectedDeliveryDate` |
| `recipient` | object | **ya** | | `recipient` |
| `recipient.name` | string | **ya** | trim, tidak kosong; tanpa batas panjang | `recipient.name` |
| `recipient.phone` | string | **ya** | spasi, `-`, `.`, `(`, `)` dibuang lalu tidak kosong; **format bebas** (aturan WMS) — disimpan ternormalisasi | `recipient.phone` |
| `destination` | object | **ya** | | `destination` |
| `destination.address` | string | **ya** | trim, tidak kosong; tanpa batas panjang | `destination.address` |
| `destination.latitude` | number | **ya** | angka finite **-11,5 … 6,5** (Indonesia); string / kosong ditolak | `destination.latitude` |
| `destination.longitude` | number | **ya** | angka finite **94,5 … 141,5** | `destination.longitude` |
| `destination.notes` | string | tidak — default `""` | trim | `destination.notes` |
| `lines` | array | **ya** | **1 – 100** baris (`OUTBOUND_LIMITS.lines`) | `lines` |
| `lines[i].sku` | string | **ya** | trim + **UPPERCASE**; ada di katalog client & aktif (`SKU_NOT_IN_CATALOG` / `SKU_INACTIVE`); unik dalam order | `lines[i].sku` |
| `lines[i].qty` | number | **ya** | `> 0`; maks **2 desimal**; `≤ 1.000.000` (`OUTBOUND_LIMITS.maxQty`) | `lines[i].qty` |
| `notes` | string | tidak — default `""` | trim | `notes` |
| `hubID` | — | **dilarang** | hub dipilih server (Req. 4) | `hubID` |
| field lain | — | dilarang | DTO integrasi `whitelist + forbidNonWhitelisted` → 422 | nama field |

Diisi server, tidak bisa dikirim: `source = CLIENT_API`, `type = REGULAR`, `method = DELIVERY`, `hub` (dipilih), `client`
(dari key), `orderDate` (hari ini WIB), `isSandbox` (dari key), kota tujuan (`DestinationCityResolver` dari alamat/titik),
`distance` (tidak dihitung di pintu API). Bentuk `errors[]`: `{ field, message, lineIndex | null }` (`WarehouseFieldErrorEntity`),
pesan Bahasa Indonesia dari `OutboundOrderValidator` yang ada — **validator tidak diubah**, DTO integrasi hanya
mempersempit (lines ≤ 100, `hubID` dilarang).

Pemetaan ke `CreateOutboundOrderRequestEntity`: `source: CLIENT_API`, `type: REGULAR`, `clientId: auth.provider_id`,
`hubId/hubName/hubCode` dari `OutboundHubSelector`, `clientName/clientCode: null` (snapshot diambil `loadContext` dari
core-service), `isSandbox:
auth.is_sandbox`, `apiKeyId: auth.api_key_id`, `actor: key prefix` (`dash_live_k9F2qX7m…`) atau email JWT,
`destination.distance: undefined` (mengikuti `DISTANCE_WMS_CALCULATION_MODE`, default `NONE` → `null`).

### POST — respons

```jsonc
{ "status": "Success", "data": {
  "result": "CREATED",                      // atau "EXISTS" (replay externalID)
  "order": { /* IntegrationOutboundOrderEntity, di bawah — order.hub = hub yang dipilih server */ },
  "hubDistanceKm": 3.1,                     // garis lurus tujuan → hub terpilih (informasi; tidak disimpan); null pada EXISTS
  "stockWarnings": [                        // SKU yang qty-nya > available di hub terpilih; [] pada EXISTS
    { "sku": "100001", "requested": 12, "available": 5,
      "availableElsewhere": [ { "hub": { "id": 874, "name": "Dash Hub Blok M", "code": "DASH_BLM" }, "available": 40 } ] }
  ]
} }
```

| Field | Tipe | Keterangan |
|---|---|---|
| `result` | `CREATED` \| `EXISTS` | `EXISTS` = replay `externalID` di environment ini; body tidak dibandingkan |
| `order` | `IntegrationOutboundOrderEntity` | status `OPEN` saat `CREATED`; apa adanya saat `EXISTS` |
| `hubDistanceKm` | number \| null | garis lurus tujuan → hub terpilih, 1 desimal; informasi, tidak disimpan; `null` saat `EXISTS` |
| `stockWarnings[]` | array | baris yang `qty`-nya > available di hub terpilih; `[]` bila semua tercukupi dan saat `EXISTS` |
| `stockWarnings[].sku` | string | uppercase |
| `stockWarnings[].requested` | number | qty yang dikirim |
| `stockWarnings[].available` | number | available di hub terpilih = on hand − reserved, stok REGULAR (`sumAllocatableBySku`) |
| `stockWarnings[].availableElsewhere[]` | array | hub lain yang memegang SKU itu, urut `available` DESC; `[]` bila tidak ada di mana pun |
| `…availableElsewhere[].hub` | `{ id, name, code }` | snapshot core-service |
| `…availableElsewhere[].available` | number | |

### Entity teredaksi — `IntegrationOutboundOrderEntity`

```jsonc
{
  "id": "uuid", "code": "OUT-SWR-102226-Ab3K", "externalID": "SO-2026-001234",
  "status": "OPEN",                          // OPEN | PREPARING | READY_TO_PICKUP | SHIPPED | IN_DELIVERY | DELIVERED | FAILED | CANCELLED
  "hub": { "id": 906, "name": "Dash Hub Kemang", "code": "DASH_KMG" },
  "serviceType": "SAME_DAY", "orderDate": "2026-10-22", "expectedDeliveryDate": "2026-10-24",
  "recipient": { "name": "…", "phone": "…" },
  "destination": { "address": "…", "latitude": -6.2615, "longitude": 106.8139, "notes": "…" },
  "lines": [ { "sku": "100001", "itemName": "Atlas Headstrap", "uomName": "pcs", "qty": 12 } ],
  "notes": "…",
  "fulfillment": { "waybill": null },        // AWB, terisi setelah SHIPPED; shipment dicari lewat waybill / bookingId = externalID (tanpa shipmentID)
  "cancellation": null,                      // { reason, cancelledAt } bila CANCELLED
  "createdAt": "…", "updatedAt": "…"
}
```

**Tidak dikembalikan:** bin/storage, picker, lot/batch, `qtyReserved/qtyPicked`, goods issue, surat jalan, upload, timeline
ops, `distance`, `isSandbox` (tersirat dari key), `createdBy`.

| Field | Tipe | Nullable | Keterangan |
|---|---|---|---|
| `id` | uuid | tidak | dipakai di semua route `…/:id` |
| `code` | string | tidak | kode order Dash (unik) — yang dilihat ops gudang |
| `externalID` | string | tidak | milik client, apa adanya (trim) |
| `status` | enum | tidak | `OPEN` \| `PREPARING` \| `READY_TO_PICKUP` \| `SHIPPED` \| `IN_DELIVERY` \| `DELIVERED` \| `FAILED` \| `CANCELLED` (3 terakhir sebelum `CANCELLED` = proyeksi pengiriman) |
| `hub` | `{ id: number, name, code }` | tidak | dipilih server (terdekat); ops bisa memindahkan saat `OPEN` (Req. 13) — baca ulang tiap `GET` |
| `serviceType` | `SAME_DAY` \| `NEXT_DAY` | tidak | |
| `orderDate` | `YYYY-MM-DD` (WIB) | tidak | hari order dibuat |
| `expectedDeliveryDate` | `YYYY-MM-DD` | tidak | seperti dikirim |
| `recipient.name` | string | tidak | |
| `recipient.phone` | string | tidak | ternormalisasi (tanda baca dibuang) |
| `destination.address` | string | tidak | |
| `destination.latitude` / `longitude` | number | tidak | 6 desimal (`numeric(9,6)`) |
| `destination.notes` | string | tidak — `""` bila kosong | |
| `lines[].sku` | string | tidak | uppercase |
| `lines[].itemName` / `uomName` | string | tidak | snapshot katalog saat create |
| `lines[].qty` | number | tidak | maks 2 desimal |
| `notes` | string | tidak — `""` bila kosong | |
| `fulfillment.waybill` | string | **ya** | AWB, terisi saat `SHIPPED`; `null` sebelumnya |
| `cancellation` | `{ reason, cancelledAt, by }` | **ya** | hanya saat `CANCELLED`; `by` = `CLIENT` \| `DASH` (dari `cancelled_by` / origin timeline) |
| `createdAt` / `updatedAt` | ISO-8601 UTC | tidak | `updatedAt` berubah di tiap perubahan status/data — kunci polling murah |

### GET daftar — query

`status?` (satu nilai), `externalID?` (exact), `createdFrom?`/`createdTo?` (`YYYY-MM-DD`, WIB), `page=1`, `limit=20 (≤100)`
→ `{ data: [entity], pagination: { total, page, size, lastPage } }`, urut `createdAt DESC`. Selalu difilter
`clientId = auth.provider_id` dan `isSandbox = auth.is_sandbox`.

| Param | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `status` | enum (satu nilai) | tidak | `OPEN` … `CANCELLED` |
| `externalID` | string | tidak | exact setelah trim |
| `createdFrom` / `createdTo` | `YYYY-MM-DD` | tidak | hari kalender WIB, inklusif |
| `page` | integer ≥ 1 | tidak — default `1` | |
| `limit` | integer 1 – 100 | tidak — default `20` | |

### POST cancel — body `{ "reason": "Order dibatalkan pembeli" }` (wajib) → `{ status: "Success", data: { order } }`.

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `reason` | string | **ya** | trim, tidak kosong; tanpa batas panjang; tampil ke ops & dikembalikan sebagai `cancellation.reason` |

### Ops — ubah hub (web ops; bukan API client)

Memperluas endpoint "Ubah" yang ada, bukan endpoint baru:

```
PATCH /v1/warehouse/outbound-orders/:id          body yang ada + `hubID?: number`      (UpdateOutboundOrderUseCase)
GET   /v1/warehouse/outbound-orders/:id/hub-options                                 (baru — isi dropdown)
```

`hub-options` → `{ data: [ { hub: { id, name, code }, distanceKm, current: boolean, stock: { coveredLines, totalLines,
lines: [ { sku, requested, available } ] } } ] }`, urut `distanceKm` ASC; kandidat & perhitungan memakai `OutboundHubSelector`
+ `sumAllocatableBySkuAcrossHubs` yang sama dengan create (Req. 4). `hubID` di PATCH: hanya `status = OPEN` dan `type =
REGULAR` (`409 HUB_NOT_EDITABLE` / `422 hubID`), harus salah satu kandidat (`422 hubID`), snapshot nama/kode dari
core-service; `hubID` sama dengan sekarang → tidak ada tulisan. Akses mengikuti aturan hub yang ada (user harus punya akses ke
hub tujuan). Dicatat `outbound_request_data_history` action **`HUB_UPDATED`** (`DataHistoryAction` baru) dengan
`changes = { hub_id: {from,to}, hub: {from,to} }`, origin `WMS`, tanpa timeline.

### Kode error (HTTP → `error`)

| HTTP | `error` / `code` | Kapan |
|---|---|---|
| 401 | `UNAUTHORIZED` | key tidak ada/salah/revoked/expired |
| 403 | `FORBIDDEN` | scope kurang; key tanpa client |
| 404 | `OUTBOUND_ORDER_NOT_FOUND` | id bukan milik client / beda environment / tidak ada |
| 409 | `INVALID_STATUS_TRANSITION` | cancel setelah SHIPPED (`currentStatus` di `errors[]`) |
| 422 | `VALIDATION` + `errors[{field,message}]` | semua masalah field sekaligus |
| 422 | `SKU_INACTIVE` | hanya SKU nonaktif yang bermasalah |
| 422 | `NO_HUB_AVAILABLE` | tidak ada hub Dash dengan storage tree (+ koordinat) untuk dipilih |
| 503 | `FULFILLMENT_UNAVAILABLE` | core-service tidak bisa dihubungi saat memilih hub — retry |

Koleksi: `dash-api-collections/collections/Dash Integration/Warehouse/Outbound Orders/` — `Create.yml`, `Create (replay →
EXISTS).yml`, `Create (422 validation).yml`, `Get.yml`, `List.yml`, `Cancel.yml`; environment `sandbox.yml` memakai key
`dash_test_`.

## Data model

**Tidak ada migration.** Dipakai kolom yang sudah ada di `wh_outbound_orders`: `source = 'CLIENT_API'`, `external_id`
(unique `(client_id, external_id, is_sandbox)`), `is_sandbox`, `api_key_id`, `created_by`. Timeline: `wh_outbound_order_events`
origin `CLIENT`. ERD (`docs/modules/erd/erd.mermaid`) sudah memuat kolom-kolom ini — tidak perlu diubah.

Index tambahan (opsional, satu migration kecil bila daftar client lambat): `wh_outbound_orders (client_id, is_sandbox,
created_at DESC)`.

## Cross-module impacts

| Modul | Dampak |
|---|---|
| `api-integration` | Tidak berubah. Scope `shipments:write/read/cancel` dipakai ulang (sesuai v2 no. 11). `ApiKeyGuard` perlu mengisi `auth.api_key_id` (ada di `@infrastructure/guards`, bukan modul). |
| `warehouse-shipment-adapter` | Tidak berubah: `bookingId = outboundOrder.externalID` sudah ada; webhook `CREATED` lahir di submit shipping. |
| `webhook` | Tidak berubah. Endpoint webhook TEST menerima order sandbox, LIVE menerima live (sudah per-environment). |
| FE ops (`react-logistic-web`) | Tag sumber **Client API** sudah ada (`SOURCE_META.CLIENT_API`). **Ubah hub:** `OutboundRequestEditModal` mendapat field Hub (hanya saat `OPEN` & `REGULAR`; `noNativeSelect` — pakai select DS) diisi dari `hub-options`, label opsi "{nama} · {jarak} km · stok {n}/{m} baris" + rincian SKU di bawah pilihan; `warehouse.api.ts` + `hubID` di payload Ubah; detail header menampilkan hub + alasan otomatis ("dipilih otomatis — terdekat") untuk order Client API. Opsional: prefix key di detail. |
| Portal client (`next-portal-v2-web`) | Di luar scope; API bisa dipanggil dengan JWT client bila nanti dibutuhkan. |

## Failure modes & observability

- **Idempotensi:** `findByExternalId(clientId, externalId, isSandbox)` sebelum insert + `RetryHelper.onUniqueViolation`
  (sudah ada). Use case integrasi menangkap `EXTERNAL_ID_TAKEN` → `EXISTS`.
- **Atomik:** order + lines + event satu transaksi; validasi & snapshot core-service di luar tx. Tidak ada order parsial.
- **Log:** satu baris info per create (`clientId`, `keyPrefix`, `externalID`, `result`, `hubID`, `lineCount`) dan per
  penolakan 422 (`error`, jumlah `errors`). Tidak mencatat body penuh (data pribadi penerima).
- **Metrik/alert yang cukup untuk pilot:** hitung 5xx di path `/v1/integration/outbound-orders` (alert bila > 0 dalam 5
  menit) dan rasio 422 per client per jam (> 50 % → integrator salah mapping SKU).
- **Deteksi rusak di produksi:** order `CLIENT_API` berhenti masuk padahal client aktif → cek `AUTH_REJECTED` di
  `api_key_events` (key revoked/expired) sebelum menduga bug.

## Security & permissions

- Identitas client hanya dari key (`auth.provider_id`); hub dipilih server, jadi client tidak bisa mengarahkan order ke hub
  sembarang — order tetap milik client, dan GET selalu difilter client + environment. Stok hub lain hanya dibaca untuk
  memilih, tidak pernah dikembalikan ke client (hanya `stockWarnings` hub terpilih).
- Sandbox terpisah per environment key; cross-env → 404.
- Validasi input di DTO (tipe, wajib, rentang) + `OutboundOrderValidator` (aturan bisnis). Tanpa batas panjang teks
  (kolom `text`), telepon bebas format — sesuai aturan WMS; `lines ≤ 100`.
- Respons teredaksi: tidak membocorkan storage, picker, lot, atau catatan ops.
- Sesuai `api-key.md`: belum ada rate limit per key; throttle `AUTH_REJECTED` 1/menit tetap berlaku.

## Rollout

1. **Deploy BE** (satu PR `nest-logistic-service`): controller + use case + DTO/entity + spec + doc. Tanpa migration dan
   tanpa flag — endpoint tidak bisa dipanggil tanpa key, dan key client pilot belum punya scope sampai diberikan.
2. **Staging:** buat key `dash_test_` untuk SwipeRX, pastikan hub 906 **dan** 874 punya storage tree + stok SwipeRX, jalankan
   koleksi (create dengan tujuan dekat Blok M dan stok hanya di Kemang → hub **Blok M** terpilih + `stockWarnings` menyebut Kemang di
   `availableElsewhere`; tujuan dekat Kemang → Kemang tanpa warning;
   EXISTS → list → cancel; create → picking → submit shipping → webhook `CREATED`/`AT_HUB` dengan `bookingId`).
3. **Pilot live:** key `dash_live_` scope `shipments:write, shipments:read, shipments:cancel`; webhook endpoint LIVE client
   sudah ada.
4. **Rollback:** revoke key (sisi ops) atau revert PR; order yang sudah dibuat tetap valid sebagai order `CLIENT_API`.

Increment terkecil yang aman: POST + GET detail saja (list & cancel menyusul di PR yang sama atau berikutnya).

## Testing strategy

- **Unit (jest):** `OutboundHubSelector` (pure) — hub terdekat dipilih walau stoknya kurang; seri jarak → `hubId` terkecil; hub
  tanpa koordinat dilewati; tanpa kandidat → `NO_HUB_AVAILABLE`; `stockWarnings` hanya SKU yang kurang di hub terpilih,
  `availableElsewhere` berisi hub lain yang memegang SKU itu (urut available DESC), kosong bila tidak ada di mana pun. Use case create — `CREATED`, `EXISTS` (replay), mapping `auth → entity`
  (client/sandbox/key/actor), `hubID` di body → 422, core-service gagal → 503 tanpa tulis; get/list — filter client + sandbox, 404 cross-client, redaksi
  (snapshot entity tidak memuat field terlarang); cancel — delegasi + 409.
- **Ubah hub:** use case update — `hubID` saat `OPEN` mengganti `hub_id` + snapshot, menulis data history `HUB_UPDATED`,
  tidak menulis timeline, `distance` dihitung ulang per mode; `PREPARING` → `409 HUB_NOT_EDITABLE`; `TRANSFER` / hub bukan
  kandidat → `422 hubID`; hub sama → tanpa tulisan. `hub-options` — urut jarak, `current` benar, cakupan stok per SKU dari
  satu query. FE: field Hub hanya tampil saat `OPEN` (vitest `OutboundRequestEditModal`).
- **Controller spec** (pola `warehouse-routes.spec.ts`): guard & scope per route, `IntegrationExceptionFilter` membentuk
  envelope `Failed` dengan `errors[]` dari `WarehouseErrors`.
- **Arsitektur:** `warehouse-architecture.spec.ts` tetap hijau (tidak ada import modul lain).
- **E2E lokal/staging** (Playwright/curl, `E2E_WMS_CLIENT_CODE=SWR`): create via key → order tampil di ops dengan tag
  Client API → picking → submit shipping → `GET /v1/integration/shipments?search=externalID` menemukan shipment dengan
  `bookingId = externalID`; sandbox key → order tidak tampil di ops.
- **Kontrak:** contoh di koleksi "Dash Integration" dijalankan di staging sebelum merge (sukses + replay + 422 + 404).

## Key decisions & deferred choices

1. **Hub dipilih server = hub terdekat (haversine); stok hanya informasi** — mengubah kontrak v2 (`hubID` wajib di body).
   Alasan (keputusan Yogi 2026-10-22, dipertegas 2026-10-26): client tidak tahu di gudang mana stoknya, jadi `hubID`
   dibuang dari body. Jarak garis lurus cukup untuk memilih (bukan jarak order; pure, tanpa Mapbox). Stok **tidak**
   menggeser pilihan: hub terdekat tetap dipilih, dan stok dicek di **semua** hub client agar `stockWarnings` menyebut dari
   hub mana stok bisa ditransfer — keputusan transfer/split tetap di ops, sama seperti form. Hanya pintu API; form & CSV
   tetap ops yang memilih. Bila nanti ingin "hub terdekat yang punya stok", ubah skor di `OutboundHubSelector` tanpa
   mengubah kontrak.
2. **Idempotensi by `externalID` saja**, tidak membandingkan body: sama dengan `POST /v1/integration/shipments`
   (`bookingId`) dan CSV; menghindari perbedaan semantik "sama/beda" yang membingungkan integrator.
3. ~~**Tidak ada webhook untuk status gudang**~~ — **dibalik 2026-10-22** (keputusan Yogi setelah mock): status gudang
   dikirim sebagai topik webhook terpisah `OUTBOUND_ORDER` (`ORDER_STATUS_CHANGED`, body `data.order` = entity teredaksi
   di atas). Spesifikasinya di `wms-outbound-order-webhook-prd-trd-v1.md`; dokumen ini tidak berubah selain catatan ini.
4. **`ApiKeyGuard` mengisi `auth.api_key_id`.** Hari ini guard hanya menaruh `auth.name = api-key:<prefix>` dan
   `is_sandbox` (`api-key.guard.ts`, blok sintesis payload); kolom `api_key_id` yang disiapkan v2 belum punya sumber.
   Perubahan kecil di infrastruktur, aman untuk controller lain (field baru opsional).
5. **Controller di modul `warehouse`** (bukan `api-integration`) sesuai v2 no. 11, supaya `api-integration` tidak perlu
   mengimpor WMS dan use case ops dipakai langsung.
6. **Jarak tidak dihitung** (ikut `DISTANCE_WMS_CALCULATION_MODE`, default `NONE`): dispatch yang mengukur.

7. **Ubah hub = perluasan "Ubah", hanya saat `OPEN`, tanpa timeline.** Karena hub dipilih otomatis, ops butuh jalan keluar
   kalau pilihan terdekat tidak cocok (stok di hub lain, hub penuh). `OPEN` adalah satu-satunya status tanpa efek samping di
   hub lama (belum ada reservasi/GI); setelah itu jalurnya tetap batalkan picking dulu — tidak dibuat shortcut yang harus
   melepas reservasi diam-diam. Data history, bukan timeline, mengikuti aturan edit data yang sudah dipakai alamat.
   Dropdown menampilkan jarak + stok supaya keputusan ops punya dasar yang sama dengan server.

Diserahkan ke implementer: nama file mengikuti CLAUDE.md Nest (`warehouse-integration.controller.ts`,
`create-integration-outbound-order.usecase.ts`, dst.); bentuk `pagination` mengikuti helper repo; teks pesan error Bahasa
Indonesia seperti `WarehouseErrors` yang ada.

## Open questions

1. Apakah pilot butuh **`GET /v1/integration/outbound-orders` daftar** di rilis pertama, atau cukup detail by id?
2. **Stok kurang di hub terpilih (atau di semua hub)**: tetap buat order dengan peringatan (usulan, seperti form) atau tolak
   `422 INSUFFICIENT_STOCK` supaya client tahu lebih awal? Konfirmasi dengan ops gudang.
3. Perlu **batas jarak** (mis. hub > 50 km dari tujuan tidak dipilih walau stoknya lengkap)?
4. ~~Apakah client ingin **webhook status gudang**~~ — terjawab: ya, lihat `wms-outbound-order-webhook-prd-trd-v1.md`.
5. Perlu **scope khusus** (`warehouse:write`) agar key shipments tidak otomatis bisa membuat order gudang? (v2 memutuskan
   scope sama; konfirmasi ulang dengan client pilot.)
6. Batas **100 baris / order** dan tanpa bulk — cukup untuk volume SwipeRX?

## Changelog

- 2026-10-22 — created (detail dari kontrak fase 2 `wms-prd-trd-v2.md`)
- 2026-10-22 — hub dipilih server (stok di semua hub Dash → terdekat haversine), `hubID` dihapus dari body; error
  `NO_HUB_AVAILABLE` menggantikan `HUB_NOT_ENABLED` di pintu API
- 2026-10-22 — keputusan no. 3 dibalik: webhook status order ada (TRD terpisah `wms-outbound-order-webhook-prd-trd-v1.md`)
- 2026-10-26 — kontrak partner (request/response, error, tracking fase 1) ditulis di
  `nest-logistic-service/docs/api-integration/outbound-order.md`; webhook = fase 2 di belakang `ENABLE_OUTBOUND_ORDER_WEBHOOK`
- 2026-10-26 — aturan hub dipertegas: **terdekat haversine** menjadi `hubID`; stok dicek di semua hub client hanya untuk
  `stockWarnings` + `availableElsewhere` (tidak menggeser pilihan); `hubDistanceKm` di respons create
- 2026-10-26 — **ubah hub** di detail outbound request (ops, hanya `OPEN`, `PATCH …/:id` + `GET …/:id/hub-options`, data history
  `HUB_UPDATED`) masuk scope dokumen ini agar dikerjakan bersama
- 2026-10-26 — `fulfillment` cukup `{ waybill }` (tanpa `status`/`shipmentID`); status pengiriman tercermin di `status` order
- 2026-10-26 — tabel penjelasan field (tipe / wajib / aturan / kunci `errors[]`) untuk body create, respons, entity, query daftar,
  cancel — selaras dengan `OutboundOrderValidator` yang ada (tanpa batas panjang teks, telepon bebas format)
