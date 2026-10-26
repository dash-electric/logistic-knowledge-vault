---
title: WMS — Outbound order integration — API client (fase 1) + webhook (fase 2, toggle)
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
  contract: nest-logistic-service docs/api-integration/outbound-order.md  (kontrak partner — request/response/error, toggle)
  mockup: ./wms-client-api-outbound-mockup-v1.html  (interaktif — Link › Developer › Webhooks: Shipment + Outbound order, Webhook list)
  api-key: nest-logistic-service docs/api-integration/api-key.md
  webhook: nest-logistic-service docs/api-integration/webhook.md, webhook-delivery.md, webhook-payload-v2.md
  sync: nest-logistic-service docs/warehouse/outbound-order-shipment-sync.md
  link: react-link-web src/pages/developer (index.tsx, WebhooksSection.tsx, AddWebhookEndpointModal.tsx, ApiDocsTab.tsx, sandbox/)
  presentation:
---

# WMS — Outbound order integration — PRD/TRD v1

Satu dokumen untuk seluruh integrasi **outbound order** (nama mengikuti API: `/v1/integration/outbound-orders`; di web ops
menunya tetap "Outbound request"). Dua fase, **keduanya dikerjakan sekarang**:

| Fase | Isi | Status saat merge |
|---|---|---|
| **1 — API (prioritas)** | `POST / GET / list / cancel` outbound order dengan API key; hub dipilih server (terdekat); sandbox; **ubah hub** di detail ops | aktif begitu client punya key |
| **2 — Webhook** | topik webhook `OUTBOUND_ORDER` (`ORDER_STATUS_CHANGED`), Webhook list + retry di Link › Developer | **mati** — toggle env `ENABLE_OUTBOUND_ORDER_WEBHOOK=false`; dinyalakan per environment |

Mengimplementasikan kontrak fase 2 yang dikunci di `wms-prd-trd-v2.md` (§ Client — fase 2) dengan satu perubahan: `hubID`
tidak dikirim client. Aturan validasi, state machine, dan sambungan WMS ↔ Shipments **tidak diubah**, hanya dirujuk. Kontrak
partner (bentuk request/response yang jadi acuan implementasi & koleksi) ada di `nest-logistic-service/docs/api-integration/
outbound-order.md`; dokumen ini memuat alasan, aturan, dan desain teknisnya.

---

# Part 1 — Product Requirements (PRD)

## Problem

### Fase 1 — API

Client WMS (pilot: SwipeRX) sekarang memasukkan outbound request lewat **form manual** atau **upload CSV** di web ops. Dua-duanya
butuh orang Dash: ops mengetik ulang atau client mengirim file lalu ops meng-upload. Dampaknya:

- Order sampai ke gudang **terlambat** (menunggu jam kerja ops / batch upload), padahal picking FEFO dan surat jalan sudah otomatis.
- **Salah ketik** alamat/SKU/qty di jalur manual, yang sekarang harus dibetulkan lewat "Ubah" atau cancel & buat ulang.
- Client tidak punya **konfirmasi mesin** bahwa order diterima (hanya WA / email ke ops), dan tidak bisa mencocokkan status
  ke sistemnya sendiri sampai AWB terbit.

Client yang sama sudah terintegrasi lewat `POST /v1/integration/shipments` (API key + webhook) untuk shipment non-gudang,
jadi jalur mesin-ke-mesin-nya sudah ada; yang belum ada adalah pintu masuk **order gudang**.

### Fase 2 — Webhook (toggle)

- Client yang membuat order lewat API (pilot: SwipeRX) **tidak punya sinyal mesin** antara "order diterima" dan "AWB terbit".
  Dari `OPEN` sampai `SHIPPED` bisa berjam-jam (picking, ready, submit shipping); yang bisa mereka lakukan hanya polling
  `GET /v1/integration/outbound-orders/:id`. Pertanyaan "udah diproses belum?" masuk ke ops lewat WA.
- Kalau order **dibatalkan ops** (stok habis, alamat salah), client baru tahu saat polling — pesanan di sistem mereka tetap
  "menunggu".
- Untuk webhook shipment yang sudah jalan, client **tidak bisa melihat apa yang sudah dikirim** ke endpoint mereka selain di
  Sandbox (per shipment). Kalau endpoint mereka sempat mati (deploy, sertifikat kedaluwarsa), mereka tidak tahu event mana
  yang gagal dan tidak bisa meminta kirim ulang — ops Dash yang membaca `webhook_outbox` manual (`webhook-delivery.md` §9:
  "per-endpoint recent deliveries listing — later, needs product pull").

## Context

### Fase 1 — API

- WMS v2 sudah menyiapkan pintu ketiga: `OutboundOrderSource.CLIENT_API`, kolom `wh_outbound_orders.api_key_id` dan
  `is_sandbox`, idempotensi `(client_id, external_id, is_sandbox)`, baris timeline "Order diterima dari client API", dan satu
  validator untuk tiga pintu. Tidak ada migration baru.
- Modul `api-integration` sudah punya API key (`dash_live_` / `dash_test_`), scope, guard, filter error, dan webhook
  `shipment.*` ke partner. Order WMS yang di-ship membuat shipment dengan `bookingId = externalID`, jadi webhook yang sudah
  dipakai client **otomatis** memberi status pengiriman tanpa event baru.
- Keputusan produk yang sudah ada (v2 §Key decisions no. 11): **key & scope yang sama** dengan shipments (`shipments:write`),
  controller di modul WMS.

### Fase 2 — Webhook (toggle)

- Pipeline webhook sudah lengkap untuk shipment: endpoint per client per environment (`webhook_endpoints`, secret sekali
  tampil), outbox transaksional (`webhook_outbox`, satu baris per event × endpoint aktif), fast path Cloud Tasks + retry
  tick (backoff 1m → 5m → 15m → 1h → 3h → 6h → 12h, gagal ke-8 = `DEAD`), tanda tangan `x-dash-signature`, wall
  LIVE/TEST, dan UI Link (Endpoints, Sandbox › Webhooks per shipment).
- Order WMS yang di-ship menjadi shipment dengan `bookingId = externalID`, jadi status **pengiriman** sudah sampai ke client
  lewat webhook shipment. Yang kosong hanya status **gudang**.
- Pipeline-nya spesifik shipment (`shipment_id`, `shipments.event_seq`, snapshot shipment). Menambah topik berarti
  menggeneralisasi outbox, bukan membuat pipeline kedua.
- Modul `warehouse` tidak mengimpor modul lain (`warehouse-architecture.spec.ts`); sambungan WMS ↔ dunia luar lewat port
  yang diimplementasikan `warehouse-shipment-adapter` (sudah mengimpor `WebhookModule`).

## Users & jobs

### Fase 1 — API

| Pengguna | Pekerjaan |
|---|---|
| **Sistem client** (ERP / OMS SwipeRX) | Kirim order ke gudang Dash begitu order mereka terbentuk; tahu order diterima (id + kode); kirim ulang aman kalau timeout; tahu kalau SKU / alamat salah **saat itu juga**; lihat status order & pengiriman. |
| **Integrator client** | Coba dulu di sandbox dengan key `dash_test_` tanpa mengganggu data gudang; baca contoh request/response. |
| **Ops gudang Dash** | Melihat order API di daftar Outbound request seperti order manual/CSV (sumber "Client API"), lalu memprosesnya tanpa langkah tambahan. Tidak melihat order sandbox. |
| **Ops integrasi Dash** | Mengaktifkan hub untuk client, memberi key, dan menelusuri order yang ditolak. |

### Fase 2 — Webhook (toggle)

| Pengguna | Pekerjaan |
|---|---|
| **Sistem client** (ERP/OMS) | Menerima push tiap status order gudang berubah, dengan order lengkap di body; mencocokkan ke pesanan mereka via `externalID`; melanjutkan ke status pengiriman lewat `fulfillment.waybill` (webhook shipment `bookingId = externalID`) saat `SHIPPED`. |
| **Integrator client** | Mendaftarkan endpoint order terpisah dari endpoint shipment (URL + secret sendiri); mencoba di Sandbox; melihat payload persis yang dikirim; mengirim ulang yang gagal setelah endpoint mereka pulih — tanpa menghubungi Dash. |
| **Ops integrasi Dash** | Menjawab "kenapa webhook-nya nggak masuk" dari daftar yang sama (sebagai ADMIN), bukan dari query DB. |
| **Ops gudang** | Tidak ada perubahan alur; status order yang mereka ubah otomatis terkirim. |

## Scope

### In scope

#### Fase 1 — API (dikerjakan dulu)

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

#### Fase 2 — Webhook (di belakang `ENABLE_OUTBOUND_ORDER_WEBHOOK`)

- `webhook_endpoints.topic` (`SHIPMENT` | `OUTBOUND_ORDER`); satu endpoint aktif per `(client, environment, topic)`;
  Link › Developer › Webhooks menampilkan **dua section** (Webhooks · Shipment, Webhooks · Outbound order) dengan modal
  tambah endpoint yang sama.
- Event `ORDER_STATUS_CHANGED` untuk **setiap** perubahan status gudang: `OPEN` (dibuat), `PREPARING`, `READY_TO_PICKUP`,
  `SHIPPED`, `CANCELLED`, termasuk aksi balik (undo ready / undo shipping / hapus picking). Body `{ event, order }` dengan
  `order` = entity teredaksi yang sama dengan `GET /v1/integration/outbound-orders/:id`.
- Berlaku untuk order dari **semua pintu** (form, CSV, API) — fan-out per client, seperti shipment. Sandbox → endpoint TEST.
- **Webhook list** (Link › Developer › Webhooks › Webhook list): satu baris per ref (shipment / order), topik via segmented
  control, filter environment / status webhook / rentang tanggal / AWB-booking ID-kode order-externalID; baris dibuka →
  riwayat event + payload; **Retry now** hanya pada event terbaru yang `FAILED`/`DEAD`; **Retry all failed**; **Send now**
  bila event terbaru `SKIPPED` karena belum ada endpoint.
- API yang mendasarinya (`/v1/integration/webhooks*`) bisa dipakai client langsung dengan API key.
- Log per percobaan (`webhook_delivery_attempts`: HTTP status, latensi, error) — ditampilkan di riwayat.
- API docs di Link: group "Outbound order" + "Order webhooks".
- `GET /v1/integration/outbound-orders/:id/webhook-deliveries` (paritas dengan shipment) untuk Sandbox order detail.

### Out of scope

- Order **TRANSFER** antar hub lewat API (hanya form manual).
- **Ubah** order lewat API (penerima/alamat/jarak) — client cancel lalu buat ulang dengan `externalID` baru.
- Upload CSV lewat API, bulk create (satu request = satu order; client memanggil berulang).
- Katalog SKU lewat API (SKU tetap didaftarkan ops / import).
- Client memilih hub (`hubID` di body) atau mengubah hub setelah order dibuat — hub dipilih server (Req. 4).
- Pemilihan hub berdasarkan zona/jarak jalan (Mapbox): fase ini haversine saja.
- Rate limit per key (mengikuti kondisi `api-key.md`: belum ada).
- Scope baru (`warehouse:*`), key per hub, portal self-service untuk hub.
- Event untuk status **proyeksi pengiriman** di order (`IN_DELIVERY`, `DELIVERED`, `FAILED` order) — itu cermin event
  shipment yang sudah dikirim ke endpoint `SHIPMENT` (`bookingId = externalID`). Tidak dikirim dua kali.
- Event untuk **transfer antar hub** (`type = TRANSFER`), purchase order, stock opname.
- Event khusus saat ops **mengubah hub** order `OPEN` (Req. F2-13 fase 1) — hub baru ikut di `order.hub` pada event
  status berikutnya; partner yang perlu tahu lebih cepat memakai `GET`.
- Satu endpoint untuk dua topik (satu URL dua body) — lihat Open questions.
- Pilih-pilih event (subscription list) — tetap "semua event topik ini", partner mengabaikan yang tidak dikenal.
- Simulator order di Sandbox (seperti simulator shipment) — Sandbox hub memproses order test secara alami; menyusul.
- Auto-disable endpoint yang terus gagal, dashboard per endpoint (`webhook-delivery.md` §8 — tetap "later").
- Mengubah perilaku retry otomatis event lama (lihat Key decisions no. 13).

## Requirements

### Fase 1 — API

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
    di event status berikutnya — § Fase 2).

### Fase 2 — Webhook (semua berlaku hanya saat toggle `true`, kecuali F2-16 yang mendefinisikan toggle itu)

F2-1. Endpoint webhook punya `topic`; nilai lama = `SHIPMENT`. Satu endpoint **aktif** per `(client, environment, topic)`;
   mendaftar yang kedua → `409 ENDPOINT_EXISTS` (disable dulu). Endpoint `SHIPMENT` yang ada **tidak** menerima event order,
   dan sebaliknya.
F2-2. Setiap perubahan status gudang order (`OPEN`→`PREPARING`→`READY_TO_PICKUP`→`SHIPPED`, `→CANCELLED`, dan aksi balik)
   menghasilkan **tepat satu** event `ORDER_STATUS_CHANGED` di transaksi yang sama dengan perubahan status (tidak ada event
   tanpa commit, tidak ada commit tanpa event). Order yang baru dibuat menghasilkan event `OPEN`.
F2-3. Body event: envelope `{ status: "Success", message: "OK", data: { event, order } }`. `event`: `id` (dedupe, sama pada
   setiap retry), `type: "ORDER_STATUS_CHANGED"`, `sequence` (monoton per order, gap sah), `status` (status order **setelah**
   event, vocabulary internal sama dengan GET), `message` (Bahasa Indonesia, § API contracts), `occurredAt`, `reason`
   (hanya `CANCELLED`). `order` = `IntegrationOutboundOrderEntity` saat itu (`SHIPPED` membawa `fulfillment.waybill`).
F2-4. Tanda tangan, header, timeout, backoff, `DEAD`, `SKIPPED`, wall LIVE/TEST — **identik** dengan webhook shipment
   (`webhook-delivery.md`). Partner memverifikasi dengan secret endpoint order (bukan secret endpoint shipment).
F2-5. Event order hanya di-fan-out ke endpoint `OUTBOUND_ORDER` client pemilik order, environment mengikuti `is_sandbox`.
   Client tanpa endpoint order sama sekali → tidak ada baris outbox (seperti shipment).
F2-6. Bila client **punya** endpoint topik itu tapi **tidak ada yang aktif** (semua disabled), event tetap dicatat satu baris
   `SKIPPED` (`endpoint_id = null`, `last_error = NO_ACTIVE_ENDPOINT`) supaya muncul di Webhook list dan bisa **Send now**
   setelah endpoint baru didaftarkan.
F2-7. Webhook list menampilkan, per ref (topik + environment pemanggil): referensi (AWB + bookingId, atau kode order +
   externalID), **status terbaru** (= `event.status` event terakhir), status delivery event terakhir (`Queued / Sending /
   Delivered / Failed / Gave up / Skipped`), endpoint tujuan, waktu kirim terakhir; filter + pencarian; urut waktu event
   terbaru DESC; paging server.
F2-8. Baris dibuka → **riwayat** semua event ref itu (sequence DESC) dengan status delivery masing-masing, daftar percobaan
   event terbaru (waktu, hasil HTTP/timeout, latensi), dan **payload persis** yang dikirim.
F2-9. **Retry now** hanya untuk event dengan `sequence` tertinggi pada ref itu dan delivery `FAILED` atau `DEAD`. Event lama
   yang gagal ditampilkan "superseded — not retryable". Retry mengantrekan **event yang sama** (`event.id` & payload sama)
   ke endpoint yang aktif **sekarang**; siklus backoff dimulai dari nol. Event terbaru `DONE`/in-flight → `409`.
F2-10. **Send now** untuk event terbaru `SKIPPED` (Req. F2-6 atau endpoint di-disable sebelum terkirim) bila sekarang ada endpoint
    aktif — semantik sama dengan retry (payload beku event itu).
F2-11. **Retry all failed** = Retry now untuk semua ref yang event terbarunya `FAILED`/`DEAD` pada topik + environment itu
    (maks 500 per panggilan, jawab jumlahnya). Retry manual dibatasi 60 panggilan/menit per client.
F2-12. Semua endpoint list/retry hanya mengembalikan/menyentuh data **client pemanggil** pada **environment pemanggil**
    (API key → environment key; JWT portal → `X-Api-Mode`). ADMIN boleh lintas client dengan `clientId`.
F2-13. Link: section Webhooks · Outbound order memakai komponen yang sama dengan Shipment (card endpoint, banner wall, modal
    dua fase dengan secret sekali tampil, Disable). API docs menambah group "Outbound order" (Create / Track or webhook /
    Cancel / Delivery) dan "Order webhooks" (tabel field + contoh).
F2-14. `GET /v1/integration/outbound-orders/:id/webhook-deliveries` mengembalikan riwayat event order itu dengan bentuk yang
    sama dengan `…/shipments/:id/webhook-deliveries`.
F2-15. Retensi: baris outbox `DONE` dan percobaannya dihapus setelah 30 hari, `DEAD`/`SKIPPED` setelah 90 hari (nightly, di
    tick yang ada). Webhook list hanya menampilkan yang masih ada.
F2-16. **Toggle** `ENABLE_OUTBOUND_ORDER_WEBHOOK` (boolean env, default `false`, dibaca saat boot). `false` → publisher order
    no-op (tidak ada baris outbox, `event_seq` tidak naik), `POST /v1/integration/webhook-endpoints` dengan
    `topic = OUTBOUND_ORDER` → `422 WEBHOOK_TOPIC_DISABLED`, `GET /v1/integration/webhook-topics` melaporkan
    `enabled: false` dan Link menyembunyikan section + segmen Outbound order. Topik `SHIPMENT` tidak terpengaruh.
    Menyalakan **tidak** mem-backfill event yang terjadi saat mati; endpoint yang sudah terdaftar tetap ada.

## Edge cases & failure states

### Fase 1 — API

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

### Fase 2 — Webhook (toggle)

| Kasus | Perilaku |
|---|---|
| Client mendaftar endpoint order pada environment yang sudah punya endpoint order aktif | `409 ENDPOINT_EXISTS`; UI menampilkan "Already has an active endpoint — disable it first". |
| Endpoint shipment & order sama-sama menunjuk URL yang sama | Boleh (unique index per topik). Secret berbeda; partner membedakan lewat `event.type` / `data.order` vs `data.shipment`. |
| Order dibuat saat client belum punya endpoint order | Tidak ada baris (Req. F2-5). Setelah endpoint didaftarkan, event berikutnya terkirim; event lampau tidak dikirim ulang (seperti shipment). |
| Semua endpoint order client disabled saat event terjadi | Satu baris `SKIPPED NO_ACTIVE_ENDPOINT` (Req. F2-6) → Send now setelah endpoint baru. |
| Endpoint di-disable saat ada event `PENDING`/`FAILED` | Baris → `SKIPPED` (perilaku ada). Retry/Send now ke endpoint aktif baru membuat baris baru dengan `event.id` sama. |
| Retry diklik dua kali cepat | Klik kedua `409 IN_FLIGHT` (baris sudah `PENDING`/`PROCESSING`); UI menonaktifkan tombol sampai refresh. |
| Retry pada event yang bukan terbaru (klien lama / dua tab) | `409 SUPERSEDED` dengan `latestSequence`; UI refresh baris. |
| Event terbaru `DEAD`, lalu status order berubah lagi sebelum di-retry | Event baru dikirim; event `DEAD` lama tinggal riwayat, "superseded — not retryable". |
| Event terbaru `FAILED` masih dalam backoff, user klik Retry | Diizinkan: `next_retry_at = now`, `attempts = 0`; fast path langsung mencoba. |
| Undo shipping (`SHIPPED` → `READY_TO_PICKUP`) | Event `READY_TO_PICKUP` dikirim dengan pesan "Pengiriman dibatalkan, kembali siap dikirim"; `order.fulfillment` kembali null. Shipment-nya mengirim `CANCELLED` ke endpoint shipment (ada). |
| Hapus picking (`PREPARING` → `OPEN`) | Event `OPEN` dengan pesan "Picking dibatalkan, order kembali terbuka". |
| Order sandbox (key `dash_test_` / Sandbox hub) | Hanya ke endpoint `OUTBOUND_ORDER` TEST; muncul di Webhook list bila `X-Api-Mode: sandbox`. |
| Order TRANSFER antar hub | Tidak ada event (out of scope); tidak muncul di list. |
| Bulk (CSV 500 baris, bulk picking, bulk submit shipping) | Endpoint di-prefetch sekali per `(client, env)`; snapshot dibangun per order dari data yang sudah dimuat; tetap satu transaksi per batch seperti sekarang. |
| Client API key `shipments:read` memanggil list topik `OUTBOUND_ORDER` | Diizinkan (scope sama, v2 no. 11). |
| Pencarian `q` tidak cocok apa pun | Daftar kosong + "No shipments/orders match this filter". |
| Baris outbox sudah dipangkas retensi | Tidak tampil; riwayat `GET …/events` hanya yang tersisa. |
| Partner mengembalikan 2xx untuk retry event yang sudah pernah diterima | Partner dedupe lewat `event.id` (kontrak ada). |

## Success criteria

### Fase 1 — API

- Client pilot membuat ≥ 90 % outbound request-nya lewat API dalam 4 minggu setelah go-live (sumber `CLIENT_API` di daftar).
- Nol order dobel dari retry client (tidak ada dua order dengan `externalID` sama per client/env — dijamin index).
- Waktu dari order terbentuk di sistem client sampai tampil di Outbound request ops < 1 menit (sebelumnya: menunggu upload).
- Penolakan validasi dijawab di request pertama (tidak ada order yang harus dibetulkan ops karena salah ketik dari API).
- Tidak ada laporan "status tidak sampai": webhook shipment untuk order API terkirim dengan `bookingId = externalID`.

### Fase 2 — Webhook (toggle)

- Client pilot menerima **100 %** transisi `OPEN → PREPARING → READY_TO_PICKUP → SHIPPED` order API sebagai webhook dengan
  `sequence` naik dan `order.externalID` benar (dicek dari outbox `DONE` vs `wh_outbound_order_events` selama 2 minggu).
- Nol tiket "webhook nggak masuk" yang harus dijawab ops dengan query DB: client membacanya sendiri di Webhook list.
- Setelah endpoint client mati ≥ 1 jam lalu pulih, client memulihkan diri dengan Retry all failed tanpa Dash (dicatat di
  pilot).
- Tidak ada regresi pipeline shipment: jumlah `DONE`/`DEAD` per hari dan latensi fast path sebelum/sesudah rilis sama
  (log `webhook.deliver`).

---

# Part 2 — Technical Requirements (TRD)

## Summary

Satu paket kerja dua fase. **Fase 1 (prioritas):** controller `WarehouseIntegrationController` di modul `warehouse`
(`/v1/integration/outbound-orders`), hub dipilih server (terdekat haversine; stok dicek di semua hub untuk `stockWarnings`),
idempotensi by `externalID`, respons teredaksi, cancel, sandbox, plus **ubah hub** di detail ops saat `OPEN` — tanpa migration.
**Fase 2 (di belakang `ENABLE_OUTBOUND_ORDER_WEBHOOK`, default `false`):** generalisasi outbox webhook ke topik
(`SHIPMENT` | `OUTBOUND_ORDER`), event `ORDER_STATUS_CHANGED` dari modul `warehouse` lewat port yang diimplementasikan
`warehouse-shipment-adapter`, Webhook list + retry event terbaru di Link — empat migration additive. Keduanya dikerjakan
sekarang; fase 2 di-merge mati dan dinyalakan per environment.

### Fase 1 — API

Tambahkan controller `WarehouseIntegrationController` di modul `warehouse` (`/v1/integration/outbound-orders`), dijaga
`ApiKeyGuard` + `@Scopes(shipments:*)` dan `IntegrationExceptionFilter` seperti `IntegrationShipmentController`. Create
memanggil `CreateOutboundOrderUseCase` yang sudah ada dengan `source = CLIENT_API`, client/sandbox/key dari `auth`;
`EXTERNAL_ID_TAKEN` yang dilempar use case diubah menjadi `200 EXISTS` oleh use case pembungkus. GET/daftar/cancel membungkus
use case ops yang ada dengan pembatasan `clientId` + `isSandbox` dan pemetaan ke entity teredaksi. Tidak ada tabel, kolom,
scope, event, atau port baru.

### Fase 2 — Webhook (toggle)

Generalisasi outbox webhook dari "shipment" ke "ref bertopik": `webhook_endpoints.topic`, `webhook_outbox.topic + ref_id
(+ label denormalisasi)`, `EnqueueWebhookEventsUseCase` menerima topik, ref, snapshot, dan `sequence` dari pemanggil.
Produser order adalah modul `warehouse` lewat port OUT baru `OutboundOrderWebhookPort` (default no-op), diimplementasikan di
`warehouse-shipment-adapter` dengan use case enqueue webhook; per-order `event_seq` di `wh_outbound_orders`. Webhook list,
riwayat, retry, dan retry-all adalah query + use case baru di modul `webhook` dengan controller `v1/integration/webhooks`,
plus tabel `webhook_delivery_attempts` yang ditulis `DeliverWebhookUseCase`. Link menambah prop `topic` pada komponen
Webhooks yang ada, satu halaman Webhook list, dan dua section docs. Empat migration kecil, semuanya additive dan
backward-compatible; tanpa flag.

## Architecture

### Fase 1 — API

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

### Fase 2 — Webhook (toggle)

```
                 warehouse (tidak mengimpor modul lain)
  create/picking/ready/submit-shipping/cancel/undo-* use case
        │  dalam tx: status order berubah + timeline + event_seq++ 
        ▼
  OutboundOrderWebhookPort (OUT, abstract; default NoopOutboundOrderWebhookPort)
        │ publish({ tx, ref, sequence, event, snapshot, endpoints? }) → outboxIds
        │ afterCommit(outboxIds)
        ▼
  warehouse-shipment-adapter ── WebhookOutboundOrderPublisher (registrasi saat boot, pola FulfillmentGatewayRegistry)
        │                           ├─ EnqueueWebhookEventsUseCase({ topic: OUTBOUND_ORDER, ref, sequence, snapshot, … })
        │                           └─ WebhookTasksService.enqueueDeliver(outboxIds)   ← setelah commit
        ▼
  webhook ── outbox → fast path / retry tick → POST partner (HMAC)   ← tidak berubah, kecuali:
             • endpoint & outbox bertopik, group retry per (endpoint, ref_id)
             • DeliverWebhookUseCase menulis webhook_delivery_attempts per percobaan
             • ListWebhooks / ListWebhookEvents / RetryWebhook / RetryAllFailedWebhooks use case
             • WebhookListController  v1/integration/webhooks  (ApiKeyGuard: key ATAU JWT + X-Api-Mode)

  shipment ── recordStatusChange → EnqueueWebhookEventsUseCase({ topic: SHIPMENT, … })   ← sama seperti sekarang
```

- **Kepemilikan:** `webhook` memiliki endpoint, outbox, attempts, list/retry. `warehouse` memiliki kapan event order
  terjadi, isinya (status, pesan, reason), snapshot teredaksi (`IntegrationOutboundOrderEntity` mapper dari TRD client
  API), dan `event_seq`-nya. Adapter hanya menyambung keduanya.
- **Batas modul:** `warehouse` tetap tanpa import modul lain (port abstrak + no-op default di dalam `warehouse`, spec
  arsitektur tetap hijau). `webhook` **tidak** membaca `wh_outbound_orders`: label referensi (`ref_label`, `ref_external_id`)
  dan status terbaru (`payload.data.event.status`) ada di baris outbox, jadi list adalah query satu tabel.
- **Satu pipeline:** tidak ada worker, task queue, atau tick kedua. Retry group key berubah dari `shipment_id` ke `ref_id`
  (untuk shipment nilainya sama).
- **Link:** `WebhooksSection` dan `AddWebhookEndpointModal` menerima `topic`; `WebhookListSection` baru memakai
  `DeliveryStatusPill`/`JsonBlock` dari `sandbox/sandboxUi`; sub-nav `?tab=webhooks&view=endpoints|list`.

## API contracts

### Fase 1 — API

Semua: `@Controller('v1/integration/outbound-orders')`, `@UseGuards(ApiKeyGuard)`, `@UseFilters(IntegrationExceptionFilter)`,
`@AuthTypes(PROVIDER_USER, CLIENT_USER)`. Envelope sukses `{ status: "Success", data }`; gagal
`{ status: "Failed", error, code?, errors? }` (filter integrasi yang ada; `errors[]` diteruskan dari `WarehouseErrors`).

```
POST /v1/integration/outbound-orders            @Scopes(shipments:write)   HTTP 200
GET  /v1/integration/outbound-orders            @Scopes(shipments:read)
GET  /v1/integration/outbound-orders/:id        @Scopes(shipments:read)
POST /v1/integration/outbound-orders/:id/cancel @Scopes(shipments:cancel)  HTTP 200
```

#### POST — body (`CreateIntegrationOutboundOrderRequestDto`)

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

#### POST — respons

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

#### Entity teredaksi — `IntegrationOutboundOrderEntity`

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

#### GET daftar — query

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

#### POST cancel — body `{ "reason": "Order dibatalkan pembeli" }` (wajib) → `{ status: "Success", data: { order } }`.

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `reason` | string | **ya** | trim, tidak kosong; tanpa batas panjang; tampil ke ops & dikembalikan sebagai `cancellation.reason` |

#### Ops — ubah hub (web ops; bukan API client)

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

#### Kode error (HTTP → `error`)

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

### Fase 2 — Webhook (toggle)

Envelope sukses `{ status: "Success", data }`, gagal `{ status: "Failed", error, code? }` (`IntegrationExceptionFilter`).
Semua route baru di koleksi `dash-api-collections/collections/Dash Integration/Webhooks/` (lihat Rollout).

#### Endpoint webhook — ditambah `topic`

```
POST /v1/integration/webhook-endpoints          body { url, environment, topic?: "SHIPMENT" | "OUTBOUND_ORDER" }   (default SHIPMENT)
GET  /v1/integration/webhook-endpoints          ?topic?   → data[] + field `topic` di tiap baris
POST /v1/integration/webhook-endpoints/:id/disable                                           (tidak berubah)
```

`409 ENDPOINT_EXISTS` bila sudah ada endpoint aktif `(client, environment, topic)`. Respons create tetap `{ id, url,
environment, topic, createdAt, secret }` — secret sekali. `422 WEBHOOK_TOPIC_DISABLED` bila toggle topik itu mati (Req. F2-16).

```
GET /v1/integration/webhook-topics   → { data: [ { topic: "SHIPMENT", enabled: true }, { topic: "OUTBOUND_ORDER", enabled: <toggle> } ] }
```

Link memanggilnya sekali saat tab Webhooks dibuka untuk memutuskan section/segmen mana yang tampil.

#### Webhook list

```
GET /v1/integration/webhooks
  ?topic=SHIPMENT|OUTBOUND_ORDER   (default SHIPMENT)
  &webhookStatus=ALL|FAILED|DONE|QUEUED|SKIPPED   (FAILED = FAILED+DEAD; QUEUED = PENDING+PROCESSING; default ALL)
  &q=                             (prefix, case-insensitive, pada ref_label ATAU ref_external_id)
  &from=YYYY-MM-DD&to=YYYY-MM-DD  (WIB, pada occurredAt event terbaru; default 30 hari terakhir)
  &page=1&limit=20 (≤100)
  &clientId=                      (ADMIN saja)
```

Environment: API key → environment key; JWT → `X-Api-Mode: sandbox` = TEST, selain itu LIVE (mekanisme Link yang ada).
Scope key: `shipments:read` (kedua topik — v2 no. 11).

```jsonc
{ "status": "Success", "data": {
  "data": [ {
    "topic": "OUTBOUND_ORDER",
    "refId": "9c1e4f0a-…",                               // shipments.id | wh_outbound_orders.id
    "reference": { "label": "OUT-SWR-102226-Ab3K", "externalId": "SO-2026-001234" },   // AWB+bookingId | code+externalID
    "latestStatus": "SHIPPED",                            // event.status event terbaru (vocabulary internal)
    "latest": {
      "eventId": "…", "eventType": "ORDER_STATUS_CHANGED", "sequence": 4, "occurredAt": "…",
      "endpoint": { "id": "…", "url": "https://…", "environment": "LIVE", "disabled": false } | null,
      "delivery": { "status": "DONE", "attempts": 1, "lastError": null, "nextRetryAt": null, "deliveredAt": "…",
                    "httpStatus": 200, "latencyMs": 290 },
      "retryable": false,                                 // status ∈ FAILED|DEAD|SKIPPED && ada endpoint aktif sekarang
      "retryBlockedReason": null                          // "ALREADY_DELIVERED" | "IN_FLIGHT" | "NO_ACTIVE_ENDPOINT"
    },
    "lastSentAt": "…"                                     // createdAt baris outbox terbaru (atau deliveredAt bila DONE)
  } ],
  "summary": { "failed": 3, "skipped": 1 },               // ref dengan event terbaru FAILED/DEAD · SKIPPED (untuk banner)
  "pagination": { "total": 412, "page": 1, "size": 20, "lastPage": 21 }
} }
```

#### Riwayat satu ref

```
GET /v1/integration/webhooks/:topic/:refId/events
GET /v1/integration/outbound-orders/:id/webhook-deliveries      (paritas; = events topik OUTBOUND_ORDER)
GET /v1/integration/shipments/:id/webhook-deliveries            (ada; tidak berubah)
```

Baris = `IntegrationWebhookDeliveryEntity` yang ada (eventId, eventType, sequence, eventStatus, occurredAt, endpoint,
delivery, createdAt, payload) **ditambah** `delivery.attemptsLog[]: { attemptNo, attemptedAt, httpStatus | null, latencyMs,
error | null }` dan `superseded: boolean` (= bukan sequence tertinggi). Urut sequence DESC.

#### Retry / send

```
POST /v1/integration/webhooks/:topic/:refId/retry                 @Scopes(shipments:write)   HTTP 200
POST /v1/integration/webhooks/retry-all-failed?topic=&limit=500   @Scopes(shipments:write)   HTTP 200
```

Retry: cari baris outbox `sequence` tertinggi untuk `(client, environment, topic, refId)`:

| Keadaan event terbaru | Hasil |
|---|---|
| `DONE` | `409 ALREADY_DELIVERED` |
| `PENDING` / `PROCESSING` | `409 IN_FLIGHT` |
| `FAILED` / `DEAD`, endpoint barisnya masih aktif | baris itu → `PENDING`, `attempts = 0`, `next_retry_at = now`, `last_error` dipertahankan; fast path |
| `FAILED` / `DEAD` / `SKIPPED`, endpoint barisnya disabled / null, ada endpoint aktif | **baris baru** (`event_id`, `sequence`, `payload` sama; `endpoint_id` = aktif) `PENDING`; baris lama tetap |
| `SKIPPED` / disabled, tidak ada endpoint aktif | `409 NO_ACTIVE_ENDPOINT` |
| `refId` bukan sequence yang diminta (tidak dipakai — selalu terbaru) | — |

Respons `{ data: { outboxId, eventId, sequence, endpoint } }`. Retry-all: `{ data: { requested, queued, skipped: {
alreadyDelivered, inFlight, noActiveEndpoint } } }`. Rate limit 60/menit/client (`429 RATE_LIMITED`).

Kode error baru: `ENDPOINT_EXISTS` (409), `ALREADY_DELIVERED` (409), `IN_FLIGHT` (409), `SUPERSEDED` (409 — hanya bila
client mengirim `?sequence=` dan itu bukan yang terbaru), `NO_ACTIVE_ENDPOINT` (409), `WEBHOOK_REF_NOT_FOUND` (404 — ref
tanpa baris outbox milik client/env ini), `RATE_LIMITED` (429).

#### Webhook body — topik `OUTBOUND_ORDER`

Header & tanda tangan sama dengan shipment: `content-type: application/json`, `x-dash-signature: t=<unix>,v1=HMAC_SHA256(secret,
"<t>.<rawBody>")`, timeout 10 s, HTTPS, tanpa redirect; 2xx = terkirim.

```jsonc
{
  "status": "Success", "message": "OK",
  "data": {
    "event": {
      "id": "9c1e4f0a-…",                 // dedupe — sama pada setiap retry
      "type": "ORDER_STATUS_CHANGED",
      "sequence": 4,                      // per order, monoton, gap sah
      "status": "SHIPPED",                // OPEN | PREPARING | READY_TO_PICKUP | SHIPPED | CANCELLED — status order SETELAH event
      "message": "Dikirim — AWB DLSWR2610081QPR5UD",
      "occurredAt": "2026-10-22T07:15:02.000Z",
      "reason": null                      // hanya CANCELLED: { "code": "CANCELLED_BY_CLIENT" | "CANCELLED_BY_OPS", "message": "<alasan>" }
    },
    "order": { /* IntegrationOutboundOrderEntity — wms-client-api-outbound-prd-trd-v1.md § Entity teredaksi */
      "id": "…", "code": "OUT-SWR-102226-Ab3K", "externalID": "SO-2026-001234", "status": "SHIPPED",
      "hub": { "id": 906, "name": "Dash Hub Kemang", "code": "DASH_KMG" },
      "serviceType": "SAME_DAY", "orderDate": "2026-10-22", "expectedDeliveryDate": "2026-10-24",
      "recipient": { "name": "…", "phone": "…" }, "destination": { "address": "…", "latitude": -6.26, "longitude": 106.81, "notes": "" },
      "lines": [ { "sku": "100001", "itemName": "Atlas Headstrap", "uomName": "pcs", "qty": 12 } ],
      "notes": "", "fulfillment": { "waybill": "DLSWR2610081QPR5UD" },
      "cancellation": null, "createdAt": "…", "updatedAt": "…"
    }
  }
}
```

`event.message` per status (satu tempat: `warehouse/domain/services/outbound-order-webhook-content.ts`):

| Transisi | `status` | `message` |
|---|---|---|
| dibuat (form / CSV / API) | `OPEN` | Order diterima |
| picking order dibuat | `PREPARING` | Sedang dipersiapkan — picking FEFO |
| ready to pick up | `READY_TO_PICKUP` | Siap dikirim |
| submit shipping | `SHIPPED` | Dikirim — AWB {waybill} |
| cancel (client / ops) | `CANCELLED` | Order dibatalkan: {reason} |
| undo ready | `PREPARING` | Dikembalikan ke persiapan |
| undo shipping | `READY_TO_PICKUP` | Pengiriman dibatalkan, kembali siap dikirim |
| hapus picking / GI | `OPEN` | Picking dibatalkan, order kembali terbuka |

Tidak ada `hubName`/`media` (selalu null / `[]` — dihilangkan dari body order; partner memakai `order.hub`).

#### Port internal (modul `warehouse`)

```ts
// warehouse/domain/repositories/outbound-order-webhook.port.ts
abstract class OutboundOrderWebhookPort {
  abstract listActiveEndpoints(clientId: number, isSandbox: boolean): Promise<WebhookEndpointRef[]>;   // prefetch batch
  abstract publish(req: {
    tx: DBTransaction;
    ref: { id: string; label: string; externalId: string; clientId: number; isSandbox: boolean };   // label = code
    sequence: number;                                     // wh_outbound_orders.event_seq setelah ++ (oleh WMS, dalam tx)
    event: { status: OutboundOrderStatus; message: string; occurredAt: string; reason?: { code: string; message: string } | null };
    snapshot: IntegrationOutboundOrderEntity;             // teredaksi, dibangun WMS dari data yang sudah dimuat use case
    endpoints?: WebhookEndpointRef[];
  }): Promise<{ eventId: string | null; outboxIds: string[] }>;
  abstract afterCommit(outboxIds: string[]): Promise<void>;   // fast path; best-effort
}
```

Default `NoopOutboundOrderWebhookPort` (`outboxIds: []`) di `WarehouseModule`; adapter mengganti lewat
`OutboundOrderWebhookRegistry` (pola `FulfillmentGatewayRegistry`). `EnqueueWebhookEventsRequestEntity` di modul `webhook`
mendapat `topic?` (default `SHIPMENT`), `ref?` (menggantikan `shipment` untuk topik lain), `sequence?` (bila diberikan,
use case **tidak** menaikkan `shipments.event_seq`), `snapshot` generik untuk `OUTBOUND_ORDER`; kunci envelope `shipment` |
`order` dipilih dari topik.

## Data model

### Fase 1 — API

**Tidak ada migration.** Dipakai kolom yang sudah ada di `wh_outbound_orders`: `source = 'CLIENT_API'`, `external_id`
(unique `(client_id, external_id, is_sandbox)`), `is_sandbox`, `api_key_id`, `created_by`. Timeline: `wh_outbound_order_events`
origin `CLIENT`. ERD (`docs/modules/erd/erd.mermaid`) sudah memuat kolom-kolom ini — tidak perlu diubah.

Index tambahan (opsional, satu migration kecil bila daftar client lambat): `wh_outbound_orders (client_id, is_sandbox,
created_at DESC)`.

### Fase 2 — Webhook (toggle)

Empat migration (`pnpm run db:generate`, jangan tulis tangan), semua additive:

1. **`webhook_endpoints`** — `topic text NOT NULL DEFAULT 'SHIPMENT'` (enum `WebhookTopic` di TS saja). Unique partial
   `(client_id, environment, topic, url) WHERE disabled_at IS NULL` menggantikan yang lama (drop + create). Aturan "satu
   aktif per (client, env, topic)" ditegakkan di `CreateWebhookEndpointUseCase` (lock baris client `FOR UPDATE` lewat
   `pg_advisory_xact_lock(client_id)` + cek), bukan index, supaya pesan errornya jelas.
2. **`webhook_outbox`** — `topic text NOT NULL DEFAULT 'SHIPMENT'`; `ref_id uuid` (backfill `= shipment_id`, lalu `NOT
   NULL`); `ref_label text` + `ref_external_id text` (backfill dari `shipments.waybill`/`booking_id` lewat join, `NOT NULL
   DEFAULT ''`); `endpoint_id` → **nullable** (Req. F2-6); `shipment_id` → nullable (tetap diisi untuk topik SHIPMENT; dihapus
   di rilis berikutnya). Index: `webhook_outbox_endpoint_ref_seq_idx (endpoint_id, ref_id, sequence)` menggantikan
   `…_endpoint_shipment_seq_idx`; `webhook_outbox_list_idx (client_id, environment, topic, ref_id, sequence DESC)` untuk
   list/latest; `webhook_outbox_ref_label_idx (client_id, environment, topic, ref_label text_pattern_ops)` dan idem
   `ref_external_id` untuk `q` prefix. `webhook_outbox_shipment_id_idx` tetap sampai kolomnya dihapus.
3. **`wh_outbound_orders`** — `event_seq integer NOT NULL DEFAULT 0` (seperti `shipments.event_seq`); dinaikkan WMS dalam
   tx perubahan status (`UPDATE … SET event_seq = event_seq + 1 RETURNING event_seq`).
4. **`webhook_delivery_attempts`** (baru) — `id uuid PK`, `outbox_id uuid NOT NULL` (soft ref `webhook_outbox.id`),
   `attempt_no int NOT NULL`, `http_status int NULL`, `latency_ms int NOT NULL`, `error text NULL` (sama format
   `last_error`), `attempted_at timestamptz NOT NULL DEFAULT now()`; unique `(outbox_id, attempt_no)`. Ditulis
   `DeliverWebhookUseCase` setiap percobaan (termasuk reclaim stalled = satu baris `error = 'RECLAIMED'`). Dipangkas
   bersama baris outbox-nya (Req. F2-15; prune `DONE` > 30 hari, `DEAD`/`SKIPPED` > 90 hari — nightly di `tick`, batch 5.000).

Kompatibilitas data berjalan: baris outbox lama `PENDING`/`FAILED` ikut backfill `ref_id`/label dalam migration yang sama
(satu `UPDATE … FROM shipments`), jadi tick setelah deploy memakai group key baru tanpa jeda. Rollback migration: drop
kolom/tabel baru; kode lama tidak membaca kolom baru.

**ERD** `docs/modules/erd/erd.mermaid` diperbarui di perubahan ini: section baru "Partner webhooks" (`WEBHOOK_ENDPOINTS`,
`WEBHOOK_OUTBOX`, `WEBHOOK_DELIVERY_ATTEMPTS` — dua yang pertama sudah ada di DB tapi belum tergambar), `event_seq` di
`WH_OUTBOUND_ORDERS`.

## Cross-module impacts

### Fase 1 — API

| Modul | Dampak |
|---|---|
| `api-integration` | Tidak berubah. Scope `shipments:write/read/cancel` dipakai ulang (sesuai v2 no. 11). `ApiKeyGuard` perlu mengisi `auth.api_key_id` (ada di `@infrastructure/guards`, bukan modul). |
| `warehouse-shipment-adapter` | Tidak berubah: `bookingId = outboundOrder.externalID` sudah ada; webhook `CREATED` lahir di submit shipping. |
| `webhook` | Tidak berubah. Endpoint webhook TEST menerima order sandbox, LIVE menerima live (sudah per-environment). |
| FE ops (`react-logistic-web`) | Tag sumber **Client API** sudah ada (`SOURCE_META.CLIENT_API`). **Ubah hub:** `OutboundRequestEditModal` mendapat field Hub (hanya saat `OPEN` & `REGULAR`; `noNativeSelect` — pakai select DS) diisi dari `hub-options`, label opsi "{nama} · {jarak} km · stok {n}/{m} baris" + rincian SKU di bawah pilihan; `warehouse.api.ts` + `hubID` di payload Ubah; detail header menampilkan hub + alasan otomatis ("dipilih otomatis — terdekat") untuk order Client API. Opsional: prefix key di detail. |
| Portal client (`next-portal-v2-web`) | Di luar scope; API bisa dipanggil dengan JWT client bila nanti dibutuhkan. |

### Fase 2 — Webhook (toggle)

| Modul | Dampak |
|---|---|
| `webhook` | Generalisasi enqueue (topic/ref/sequence/snapshot), outbox bertopik, `webhook_delivery_attempts`, use case list/events/retry/retry-all, controller `v1/integration/webhooks`, `topic` di endpoint create/list, prune retensi di tick. Pipeline deliver/tick: group key `ref_id`; selebihnya sama. |
| `shipment` | `recordStatusChange` & milestone producer: tidak berubah secara fungsi — hanya memasok `ref` label (waybill, bookingId) ke enqueue (satu field tambahan; use case bisa mengisinya sendiri dari snapshot bila kosong). |
| `warehouse` | Port `OutboundOrderWebhookPort` + registry + no-op; `event_seq` repo; `outbound-order-webhook-content.ts`; pemanggilan di 8 use case transisi (create, commit-import, create-picking (+bulk), ready-to-pickup, undo-ready, submit-shipping (+bulk), undo-shipping, cancel, hapus GI → OPEN). Mapper `IntegrationOutboundOrderEntity` dipakai ulang (fase 1). `GET …/outbound-orders/:id/webhook-deliveries` di `WarehouseIntegrationController` memanggil use case `webhook` lewat port yang sama (`listEvents(refId)`). |
| `warehouse-shipment-adapter` | `WebhookOutboundOrderPublisher` (implementasi port) + registrasi saat boot; mengimpor `WebhookModule` (sudah). |
| `api-integration` | `ListIntegrationWebhookDeliveriesUseCase` memakai use case events generik (`topic: SHIPMENT`) + `attemptsLog`/`superseded`. Tidak ada scope baru. |
| `scheduled-instant` / Cloud Scheduler | Tick yang ada menambah langkah prune (tidak ada job baru). |
| Link (`react-link-web`) | § Rollout 4. |
| Web ops (`react-logistic-web`) | Tidak ada. |
| `dash-api-collections` | Folder `Webhooks/`: `Endpoints — create (topic).yml`, `List.yml`, `Events.yml`, `Retry.yml`, `Retry all failed.yml`; `Warehouse/Outbound Orders/Webhook deliveries.yml`. |

## Failure modes & observability

### Fase 1 — API

- **Idempotensi:** `findByExternalId(clientId, externalId, isSandbox)` sebelum insert + `RetryHelper.onUniqueViolation`
  (sudah ada). Use case integrasi menangkap `EXTERNAL_ID_TAKEN` → `EXISTS`.
- **Atomik:** order + lines + event satu transaksi; validasi & snapshot core-service di luar tx. Tidak ada order parsial.
- **Log:** satu baris info per create (`clientId`, `keyPrefix`, `externalID`, `result`, `hubID`, `lineCount`) dan per
  penolakan 422 (`error`, jumlah `errors`). Tidak mencatat body penuh (data pribadi penerima).
- **Metrik/alert yang cukup untuk pilot:** hitung 5xx di path `/v1/integration/outbound-orders` (alert bila > 0 dalam 5
  menit) dan rasio 422 per client per jam (> 50 % → integrator salah mapping SKU).
- **Deteksi rusak di produksi:** order `CLIENT_API` berhenti masuk padahal client aktif → cek `AUTH_REJECTED` di
  `api_key_events` (key revoked/expired) sebelum menduga bug.

### Fase 2 — Webhook (toggle)

- **Atomik:** event order lahir di transaksi WMS yang sama (`publish` menerima `tx`); fast path hanya setelah commit
  (`afterCommit`), gagal fast path → tick (perilaku ada). Tidak ada event tanpa status, tidak ada status tanpa event.
- **Idempotensi retry:** `claimForDelivery` atomik (ada) + `IN_FLIGHT` 409 mencegah dobel kirim; baris baru retry memakai
  `event_id` sama → partner dedupe.
- **Superseded:** retry manual selalu memverifikasi `sequence` = max untuk ref (satu query `SELECT max(sequence)`) di
  transaksi yang sama dengan `UPDATE`; `SUPERSEDED` bila kalah balapan.
- **Rate limit** retry/retry-all per client (in-memory per instance cukup untuk pilot; catat di log bila kena).
- **Log** (winston → SigNoz), menambah ke yang ada: `webhook.enqueue` + `topic`, `refId`; `webhook.deliver` + `topic`;
  baru `webhook.retry` (`clientId`, `topic`, `refId`, `outcome`, `fromStatus`, `newOutboxId?`), `webhook.retry-all`
  (`requested/queued/skipped`), `webhook.prune` (`deleted`).
- **Alert:** (1) `DEAD` per endpoint `OUTBOUND_ORDER` > 20 dalam 1 jam (endpoint mati — sebelum auto-disable ada); (2)
  `webhook.retry` `outcome = ERROR` > 0 / 5 menit; (3) tick `errored` > 0 (ada). Pilot: cek harian jumlah event
  `ORDER_STATUS_CHANGED` vs baris `wh_outbound_order_events` origin WMS dengan status — selisih = bug produser.
- **Deteksi rusak di produksi:** Webhook list kosong padahal order berjalan → endpoint order belum didaftarkan (bukan bug);
  baris `SKIPPED NO_ACTIVE_ENDPOINT` menumpuk → client lupa mengaktifkan endpoint baru.

## Security & permissions

### Fase 1 — API

- Identitas client hanya dari key (`auth.provider_id`); hub dipilih server, jadi client tidak bisa mengarahkan order ke hub
  sembarang — order tetap milik client, dan GET selalu difilter client + environment. Stok hub lain hanya dibaca untuk
  memilih, tidak pernah dikembalikan ke client (hanya `stockWarnings` hub terpilih).
- Sandbox terpisah per environment key; cross-env → 404.
- Validasi input di DTO (tipe, wajib, rentang) + `OutboundOrderValidator` (aturan bisnis). Tanpa batas panjang teks
  (kolom `text`), telepon bebas format — sesuai aturan WMS; `lines ≤ 100`.
- Respons teredaksi: tidak membocorkan storage, picker, lot, atau catatan ops.
- Sesuai `api-key.md`: belum ada rate limit per key; throttle `AUTH_REJECTED` 1/menit tetap berlaku.

### Fase 2 — Webhook (toggle)

- List/events/retry hanya baris `client_id = auth.provider_id` **dan** `environment` pemanggil; ADMIN lintas client via
  `clientId` (seperti endpoint controller). Ref client lain / env lain → `404 WEBHOOK_REF_NOT_FOUND` (keberadaan tidak bocor).
- Payload yang ditampilkan adalah payload yang memang sudah dikirim ke client itu — tidak membuka data baru. Secret
  endpoint tidak pernah ikut (entity endpoint tanpa secret, ada).
- Retry adalah aksi tulis: scope `shipments:write` untuk key; JWT portal role client yang sudah boleh mengelola endpoint.
  Rate limit mencegah partner men-DDoS endpoint-nya sendiri lewat Dash.
- `topic` divalidasi `IsIn(WebhookTopic)`; `q` dipotong 100 karakter, prefix match (bukan `%…%`) agar index terpakai.
- Event order tidak pernah dikirim ke endpoint `SHIPMENT` (fan-out difilter `topic` di `listActive`).

## Rollout

Satu rilis, satu backlog, urutan PR ke `main`. Fase 1 dikerjakan dulu dan bisa dipakai client tanpa menunggu fase 2; fase 2
di-merge dalam keadaan **mati** (`ENABLE_OUTBOUND_ORDER_WEBHOOK=false`) dan dinyalakan per environment.

1. **PR-1 — Fase 1 API (prioritas):** `WarehouseIntegrationController` + 4 use case integrasi + `OutboundHubSelector`
   (terdekat haversine, stok semua hub → `stockWarnings`) + DTO/entity sesuai tabel field; `ApiKeyGuard` mengisi
   `auth.api_key_id`; **ubah hub** (`PATCH …/:id` + `hubID`, `GET …/:id/hub-options`, data history `HUB_UPDATED`) + FE ops;
   koleksi "Dash Integration/Warehouse/Outbound Orders"; kontrak partner `docs/api-integration/outbound-order.md`. **Tanpa
   migration.** Staging: skenario § Testing fase 1 (create dekat Blok M dengan stok hanya di Kemang → Blok M + warning
   menyebut Kemang; EXISTS; list; cancel; ubah hub saat OPEN; picking → submit shipping → webhook `SHIPMENT` dengan
   `bookingId = externalID`). Pilot: key `dash_test_` → `dash_live_` (scope `shipments:*`).
2. **PR-2 — Fase 2, modul `webhook` (BE-1):** migration 1, 2, 4 (`topic` endpoint; `topic`/`ref_*` outbox, `endpoint_id`
   nullable; `webhook_delivery_attempts`); enqueue generik; attempts di deliver; group key `ref_id`; `topic` di endpoint API;
   `GET /v1/integration/webhook-topics`; list/events/retry/retry-all + controller; prune retensi di tick. Independen dari WMS —
   Webhook list topik `SHIPMENT` langsung berguna. Regresi: `sandbox-webhook-e2e-testing.md` penuh.
3. **PR-3 — Fase 2, produser order (BE-2):** migration 3 (`wh_outbound_orders.event_seq`); port `OutboundOrderWebhookPort` +
   registry + no-op; content service; pemanggilan di use case transisi; publisher di adapter dengan **cek toggle**;
   `ENABLE_OUTBOUND_ORDER_WEBHOOK` di `config.ts` + `.env.example` (`false`); `WEBHOOK_TOPIC_DISABLED` di create endpoint;
   `GET …/outbound-orders/:id/webhook-deliveries`.
4. **PR Link (`react-link-web`):** fase 1 — API docs group "Outbound order" (Create / Get detail / Cancel / Tracking lewat
   shipment), bisa rilis bersama PR-1; fase 2 — section "Webhooks · Outbound order", sub-nav Webhook list, docs "Order
   webhooks" — komponen dirender hanya bila `GET /webhook-topics` melaporkan `OUTBOUND_ORDER.enabled = true`, jadi bisa
   di-merge kapan saja.
5. **Nyalakan toggle:** staging `true` → client pilot mendaftar endpoint `OUTBOUND_ORDER` TEST, uji alur `OPEN → … → SHIPPED`,
   cancel, retry → produksi `true` → endpoint LIVE. Tidak ada backfill event yang terjadi saat toggle mati.
6. **Rollback:** fase 2 → toggle `false` (publisher no-op seketika) atau revert PR-3; migration additive tetap. Fase 1 →
   revoke scope key / revert PR-1; order `CLIENT_API` yang sudah ada tetap valid.

Increment terkecil yang aman: **PR-1 saja**.

## Testing strategy

### Fase 1 — API

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

### Fase 2 — Webhook (toggle)

- **Unit (jest, `--maxWorkers=2`):**
  - `webhook`: enqueue generik — topik SHIPMENT tanpa `sequence` menaikkan `event_seq` shipment (perilaku lama, spec ada
    tetap hijau); topik OUTBOUND_ORDER memakai `sequence` dari pemanggil, envelope `data.order`, fan-out hanya endpoint
    topik itu, nol endpoint aktif + ≥1 endpoint ada → satu baris `SKIPPED NO_ACTIVE_ENDPOINT`, nol endpoint sama sekali →
    nol baris. Retry — tabel keadaan § API (DONE 409, in-flight 409, FAILED reset, SKIPPED → baris baru, no endpoint 409),
    cek `max(sequence)` (SUPERSEDED). Retry-all — cap 500 + ringkasan. List — grouping per ref (`DISTINCT ON`), filter
    status (FAILED = FAILED+DEAD), `q` prefix pada label **atau** external id, isolasi client/env. Deliver — satu baris
    attempts per percobaan (sukses, HTTP error, timeout, reclaim). Prune — batas umur per status. Endpoint create —
    `ENDPOINT_EXISTS` per topik, unique index per topik.
  - `warehouse`: content service — pesan per transisi (tabel § API) termasuk undo; tiap use case transisi memanggil
    `publish` **sekali** dengan status/sequence benar dan `afterCommit` hanya setelah commit (mock port; pola spec
    `picking-shipping.usecases.spec.ts`); bulk memprefetch endpoint sekali; port no-op default tidak mengubah hasil use
    case; `warehouse-architecture.spec.ts` hijau.
  - adapter: publisher memetakan port → enqueue request; `afterCommit` → `enqueueDeliver`.
- **Controller spec** (pola `warehouse-routes.spec.ts`): guard/scope per route `v1/integration/webhooks*`, `X-Api-Mode`
  → environment, ADMIN `clientId`.
- **E2E staging** (curl/Playwright, tanpa agen): alur § Rollout 2; plus matikan endpoint test (URL 503) → event `FAILED` →
  Webhook list menampilkan Failed + banner → pulihkan endpoint → Retry now → `DONE`, attempts log 2 baris; Retry all
  failed; Send now setelah endpoint disabled → baru.
- **Kontrak:** koleksi `Dash Integration/Webhooks` dijalankan di staging sebelum merge; contoh payload order masuk ke
  `webhook-payload-v2.md` §12 (E2E examples) sebagai bagian "Outbound order".
- **Regresi shipment:** `sandbox-webhook-e2e-testing.md` dijalankan penuh setelah BE-1 (group key berubah).

## Key decisions & deferred choices

### Fase 1 — API

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
   di atas). Spesifikasinya di § Fase 2 dokumen ini (dikerjakan sekarang, di belakang toggle).
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

### Fase 2 — Webhook

8. **Topik di endpoint, bukan subscription list.** Satu endpoint = satu topik; partner memilih URL/secret per topik dan
   mem-parse satu bentuk body per endpoint. Lebih sederhana daripada satu URL dengan dua bentuk `data` (dan tetap bisa
   ditambah nanti: endpoint dengan `topic = ALL`). Endpoint lama otomatis `SHIPMENT` — nol perubahan untuk partner yang ada.
9. **Generalisasi outbox, bukan pipeline kedua.** Satu worker, satu tick, satu kontrak tanda tangan/retry; yang berubah
   hanya kunci group (`ref_id`) dan label referensi yang didenormalisasi ke baris supaya modul `webhook` tidak membaca
   tabel WMS.
10. **Produser di `warehouse` lewat port, sequence milik WMS.** `warehouse` tidak boleh mengimpor `webhook`; `webhook` tidak
   boleh menaikkan kolom tabel WMS. Jadi WMS menaikkan `wh_outbound_orders.event_seq` sendiri dan mengirimnya; use case
   enqueue menerima `sequence` opsional. Adapter yang menyambungkan — sama persis dengan `FulfillmentGateway`.
11. **`event.status` memakai vocabulary internal order (`OPEN`, bukan `RECEIVED`)** — D18 webhook shipment: webhook dan
   GET membaca satu vocabulary, partner yang mereconcile event yang hilang tidak perlu peta kedua. `event.type` tetap
   dibedakan (`ORDER_STATUS_CHANGED`) agar handler yang menerima dua topik di satu codebase bisa switch tanpa menebak dari
   bentuk `data`.
12. **Semua perubahan status gudang dikirim, termasuk aksi balik;** proyeksi pengiriman tidak. Aksi balik jarang tapi
   nyata (undo shipping karena salah kirim) dan client harus tahu pesanannya mundur. Proyeksi (`IN_DELIVERY` dst.) sudah
   datang dari webhook shipment dengan `bookingId = externalID` — mengirimnya dua kali hanya membingungkan.
13. **Retry manual hanya event terbaru; retry otomatis event lama tidak diubah.** Event terbaru membawa snapshot penuh
   (`order`/`shipment` saat itu), jadi mengirim ulang event lama yang gagal tidak menambah informasi dan bisa mengirim
   status mundur. Tapi backoff otomatis event lama tetap jalan seperti sekarang (narrowing 2026-10-21) — partner yang
   menyimpan riwayat lengkap tetap mendapatnya; UI hanya menandainya "superseded — not retryable". Menutup otomatis event
   lama saat event baru terkirim (`SKIPPED SUPERSEDED`) ditunda — Open question 8.
14. **`SKIPPED NO_ACTIVE_ENDPOINT` hanya untuk client yang punya endpoint topik itu.** Tanpa ini Webhook list tidak bisa
   menampilkan "terlewat karena endpoint mati" dan Send now tidak punya payload beku. Client tanpa endpoint sama sekali
   tetap nol baris — tidak ada beban untuk 90 % client yang tidak memakai webhook.
15. **Retry = payload beku, bukan snapshot baru.** Prinsip outbox ("a retry sends what happened, not what is") dipertahankan;
   karena hanya event terbaru yang boleh di-retry, "what happened" = "what is" secara praktis.
16. **Per-attempt log tabel terpisah**, bukan JSON array di baris outbox — baris outbox ditulis tiap percobaan oleh claim
   atomik; append JSON di sana memperbesar kontensi tanpa perlu. Dipangkas bersama outbox.
17. **Reset `attempts = 0` saat retry manual** — kalau tidak, retry pada baris `DEAD` langsung `DEAD` lagi pada kegagalan
    berikutnya; satu siklus backoff penuh setelah aksi sadar partner adalah ekspektasi yang wajar.

18. **Toggle = satu env boolean global, dicek saat publish.** Bukan flag per client (pilot satu partner), bukan "ada endpoint
    = nyala" (ops harus bisa mematikan tanpa menyentuh data client). Dicek di publisher adapter supaya `warehouse` tidak
    membaca config webhook dan restart saja cukup; dicek lagi di create endpoint supaya client tidak mendaftar ke topik yang
    gelap. Tanpa backfill saat dinyalakan — konsisten dengan "event sebelum endpoint ada tidak dikirim".

Diserahkan ke implementer: nama file mengikuti CLAUDE.md Nest (`list-webhooks.usecase.ts`, `retry-webhook.usecase.ts`,
`webhook-list.controller.ts`, `webhook-outbound-order.publisher.ts`); bentuk `pagination` mengikuti helper repo; pesan
error Bahasa Indonesia seperti `WebhookErrors`/`WarehouseErrors`; lebar kolom dan copy di Link mengikuti mockup; apakah
`q` juga mencari `event.id` (mock menyebutnya — boleh, exact match uuid).

## Open questions

### Fase 1 — API

1. Apakah pilot butuh **`GET /v1/integration/outbound-orders` daftar** di rilis pertama, atau cukup detail by id?
2. **Stok kurang di hub terpilih (atau di semua hub)**: tetap buat order dengan peringatan (usulan, seperti form) atau tolak
   `422 INSUFFICIENT_STOCK` supaya client tahu lebih awal? Konfirmasi dengan ops gudang.
3. Perlu **batas jarak** (mis. hub > 50 km dari tujuan tidak dipilih walau stoknya lengkap)?
4. ~~Apakah client ingin **webhook status gudang**~~ — terjawab: ya, lihat § Fase 2 dokumen ini.
5. Perlu **scope khusus** (`warehouse:write`) agar key shipments tidak otomatis bisa membuat order gudang? (v2 memutuskan
   scope sama; konfirmasi ulang dengan client pilot.)
6. Batas **100 baris / order** dan tanpa bulk — cukup untuk volume SwipeRX?

### Fase 2 — Webhook

7. **Satu endpoint dua topik** (`topic = ALL`)? Mock & TRD ini: tidak. Tanya SwipeRX saat review kontrak.
8. **Menutup event lama yang masih gagal saat event baru terkirim** (`SKIPPED SUPERSEDED`): mengurangi retry sia-sia ke
   endpoint yang pulih, tapi partner yang menyusun riwayat dari webhook kehilangan satu langkah. Default TRD: tidak ditutup.
9. **Retensi** 30/90 hari cukup? Sandbox boleh lebih pendek (7 hari) — belum diputuskan; TRD memakai angka yang sama.
10. **Retry self-serve** untuk client (TRD ini) atau ops-only lewat ADMIN? Mock: self-serve.
11. Apakah ops gudang perlu melihat status webhook di web ops (detail outbound request) — di luar scope; ADMIN bisa lewat
   Link list dengan `clientId`.
12. Order **MANUAL/CSV** ikut dikirim (TRD ini: ya, per client). Konfirmasi tidak ada client yang kaget menerima event order
   yang dibuat ops untuknya.

## Changelog

- 2026-10-22 — created (detail dari kontrak fase 2 `wms-prd-trd-v2.md`)
- 2026-10-22 — hub dipilih server (stok di semua hub Dash → terdekat haversine), `hubID` dihapus dari body; error
  `NO_HUB_AVAILABLE` menggantikan `HUB_NOT_ENABLED` di pintu API
- 2026-10-22 — keputusan no. 3 dibalik: webhook status order ada (sekarang § Fase 2 dokumen ini)
- 2026-10-26 — kontrak partner (request/response, error, tracking fase 1) ditulis di
  `nest-logistic-service/docs/api-integration/outbound-order.md`; webhook = fase 2 di belakang `ENABLE_OUTBOUND_ORDER_WEBHOOK`
- 2026-10-26 — aturan hub dipertegas: **terdekat haversine** menjadi `hubID`; stok dicek di semua hub client hanya untuk
  `stockWarnings` + `availableElsewhere` (tidak menggeser pilihan); `hubDistanceKm` di respons create
- 2026-10-26 — **ubah hub** di detail outbound request (ops, hanya `OPEN`, `PATCH …/:id` + `GET …/:id/hub-options`, data history
  `HUB_UPDATED`) masuk scope dokumen ini agar dikerjakan bersama
- 2026-10-26 — `fulfillment` cukup `{ waybill }` (tanpa `status`/`shipmentID`); status pengiriman tercermin di `status` order
- 2026-10-26 — tabel penjelasan field (tipe / wajib / aturan / kunci `errors[]`) untuk body create, respons, entity, query daftar,
  cancel — selaras dengan `OutboundOrderValidator` yang ada (tanpa batas panjang teks, telepon bebas format)
- 2026-10-22 — created (dari mock interaktif `wms-client-api-outbound-mockup-v1.html`; membalik keputusan no. 3 TRD
  client API)
- 2026-10-26 — dijadikan **fase 2** di belakang toggle `ENABLE_OUTBOUND_ORDER_WEBHOOK` (default off); kontrak partner
  dipisah ke `nest-logistic-service/docs/api-integration/outbound-order.md`; `GET /webhook-topics`, `WEBHOOK_TOPIC_DISABLED`
- 2026-10-26 — **digabung** menjadi satu dokumen: fase 1 API (prioritas) + fase 2 webhook (toggle) dikerjakan sekarang;
  `wms-outbound-order-webhook-prd-trd-v1.md` dihapus (isinya di § Fase 2)
