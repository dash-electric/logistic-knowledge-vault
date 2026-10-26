---
title: WMS — Outbound order webhook & webhook list (Link › Developer)
module: warehouse-management
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:
engineer:
created: 2026-10-22
links:
  context: ./wms-context-v1.md
  parent: ./wms-client-api-outbound-prd-trd-v1.md  (API `/v1/integration/outbound-orders` — create/get/cancel)
  contract: nest-logistic-service docs/api-integration/outbound-order.md  (kontrak partner — fase 1 API + fase 2 webhook + toggle)
  mockup: ./wms-client-api-outbound-mockup-v1.html  (interaktif: Link › Developer › Webhooks — Endpoints + Webhook list)
  webhook-design: nest-logistic-service docs/api-integration/webhook.md, webhook-delivery.md, webhook-payload-v2.md
  sync: nest-logistic-service docs/warehouse/outbound-order-shipment-sync.md
  link: react-link-web src/pages/developer (index.tsx, WebhooksSection.tsx, AddWebhookEndpointModal.tsx, ApiDocsTab.tsx, sandbox/)
  presentation:
---

# WMS — Outbound order webhook & webhook list — PRD/TRD v1

**Fase 2** dari integrasi outbound order — fase 1 adalah API create/get/list/cancel (kontrak partner:
`nest-logistic-service/docs/api-integration/outbound-order.md`). Tiga hal, semuanya di permukaan integrasi yang sudah ada
(`/v1/integration/*`, Link › Developer), **di belakang satu toggle env `ENABLE_OUTBOUND_ORDER_WEBHOOK` (default `false`)**
supaya API bisa dipakai client lebih dulu dan webhook menyusul tanpa deploy ulang:

1. **Topik webhook kedua: `OUTBOUND_ORDER`.** Client mendaftarkan endpoint terpisah untuk status order gudang
   (`POST /v1/integration/outbound-orders`); endpoint `SHIPMENT` yang ada tidak berubah.
2. **Event status outbound order** lewat outbox webhook yang sama dengan shipment (fan-out, tanda tangan, retry, sandbox).
3. **Webhook list** di Link: satu baris per shipment / per order — status terbaru dan apakah webhook-nya sampai — dengan
   **Retry hanya untuk event terbaru**.

Nama fitur mengikuti API: **outbound order** (`/v1/integration/outbound-orders`, topik `OUTBOUND_ORDER`, body `data.order`).
Di web ops menu-nya tetap "Outbound request" — hanya label, bukan entitas berbeda.

Membalik keputusan no. 3 di `wms-client-api-outbound-prd-trd-v1.md` ("tidak ada webhook untuk status gudang") — keputusan
Yogi 2026-10-22 setelah melihat mock.

---

# Part 1 — Product Requirements (PRD)

## Problem

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

| Pengguna | Pekerjaan |
|---|---|
| **Sistem client** (ERP/OMS) | Menerima push tiap status order gudang berubah, dengan order lengkap di body; mencocokkan ke pesanan mereka via `externalID`; melanjutkan ke status pengiriman lewat `fulfillment.waybill` (webhook shipment `bookingId = externalID`) saat `SHIPPED`. |
| **Integrator client** | Mendaftarkan endpoint order terpisah dari endpoint shipment (URL + secret sendiri); mencoba di Sandbox; melihat payload persis yang dikirim; mengirim ulang yang gagal setelah endpoint mereka pulih — tanpa menghubungi Dash. |
| **Ops integrasi Dash** | Menjawab "kenapa webhook-nya nggak masuk" dari daftar yang sama (sebagai ADMIN), bukan dari query DB. |
| **Ops gudang** | Tidak ada perubahan alur; status order yang mereka ubah otomatis terkirim. |

## Scope

### In scope
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
- Event untuk status **proyeksi pengiriman** di order (`IN_DELIVERY`, `DELIVERED`, `FAILED` order) — itu cermin event
  shipment yang sudah dikirim ke endpoint `SHIPMENT` (`bookingId = externalID`). Tidak dikirim dua kali.
- Event untuk **transfer antar hub** (`type = TRANSFER`), purchase order, stock opname.
- Event khusus saat ops **mengubah hub** order `OPEN` (TRD client API Req. 13) — hub baru ikut di `order.hub` pada event
  status berikutnya; partner yang perlu tahu lebih cepat memakai `GET`.
- Satu endpoint untuk dua topik (satu URL dua body) — lihat Open questions.
- Pilih-pilih event (subscription list) — tetap "semua event topik ini", partner mengabaikan yang tidak dikenal.
- Simulator order di Sandbox (seperti simulator shipment) — Sandbox hub memproses order test secara alami; menyusul.
- Auto-disable endpoint yang terus gagal, dashboard per endpoint (`webhook-delivery.md` §8 — tetap "later").
- Mengubah perilaku retry otomatis event lama (lihat Key decisions no. 6).

## Requirements

1. Endpoint webhook punya `topic`; nilai lama = `SHIPMENT`. Satu endpoint **aktif** per `(client, environment, topic)`;
   mendaftar yang kedua → `409 ENDPOINT_EXISTS` (disable dulu). Endpoint `SHIPMENT` yang ada **tidak** menerima event order,
   dan sebaliknya.
2. Setiap perubahan status gudang order (`OPEN`→`PREPARING`→`READY_TO_PICKUP`→`SHIPPED`, `→CANCELLED`, dan aksi balik)
   menghasilkan **tepat satu** event `ORDER_STATUS_CHANGED` di transaksi yang sama dengan perubahan status (tidak ada event
   tanpa commit, tidak ada commit tanpa event). Order yang baru dibuat menghasilkan event `OPEN`.
3. Body event: envelope `{ status: "Success", message: "OK", data: { event, order } }`. `event`: `id` (dedupe, sama pada
   setiap retry), `type: "ORDER_STATUS_CHANGED"`, `sequence` (monoton per order, gap sah), `status` (status order **setelah**
   event, vocabulary internal sama dengan GET), `message` (Bahasa Indonesia, § API contracts), `occurredAt`, `reason`
   (hanya `CANCELLED`). `order` = `IntegrationOutboundOrderEntity` saat itu (`SHIPPED` membawa `fulfillment.waybill`).
4. Tanda tangan, header, timeout, backoff, `DEAD`, `SKIPPED`, wall LIVE/TEST — **identik** dengan webhook shipment
   (`webhook-delivery.md`). Partner memverifikasi dengan secret endpoint order (bukan secret endpoint shipment).
5. Event order hanya di-fan-out ke endpoint `OUTBOUND_ORDER` client pemilik order, environment mengikuti `is_sandbox`.
   Client tanpa endpoint order sama sekali → tidak ada baris outbox (seperti shipment).
6. Bila client **punya** endpoint topik itu tapi **tidak ada yang aktif** (semua disabled), event tetap dicatat satu baris
   `SKIPPED` (`endpoint_id = null`, `last_error = NO_ACTIVE_ENDPOINT`) supaya muncul di Webhook list dan bisa **Send now**
   setelah endpoint baru didaftarkan.
7. Webhook list menampilkan, per ref (topik + environment pemanggil): referensi (AWB + bookingId, atau kode order +
   externalID), **status terbaru** (= `event.status` event terakhir), status delivery event terakhir (`Queued / Sending /
   Delivered / Failed / Gave up / Skipped`), endpoint tujuan, waktu kirim terakhir; filter + pencarian; urut waktu event
   terbaru DESC; paging server.
8. Baris dibuka → **riwayat** semua event ref itu (sequence DESC) dengan status delivery masing-masing, daftar percobaan
   event terbaru (waktu, hasil HTTP/timeout, latensi), dan **payload persis** yang dikirim.
9. **Retry now** hanya untuk event dengan `sequence` tertinggi pada ref itu dan delivery `FAILED` atau `DEAD`. Event lama
   yang gagal ditampilkan "superseded — not retryable". Retry mengantrekan **event yang sama** (`event.id` & payload sama)
   ke endpoint yang aktif **sekarang**; siklus backoff dimulai dari nol. Event terbaru `DONE`/in-flight → `409`.
10. **Send now** untuk event terbaru `SKIPPED` (Req. 6 atau endpoint di-disable sebelum terkirim) bila sekarang ada endpoint
    aktif — semantik sama dengan retry (payload beku event itu).
11. **Retry all failed** = Retry now untuk semua ref yang event terbarunya `FAILED`/`DEAD` pada topik + environment itu
    (maks 500 per panggilan, jawab jumlahnya). Retry manual dibatasi 60 panggilan/menit per client.
12. Semua endpoint list/retry hanya mengembalikan/menyentuh data **client pemanggil** pada **environment pemanggil**
    (API key → environment key; JWT portal → `X-Api-Mode`). ADMIN boleh lintas client dengan `clientId`.
13. Link: section Webhooks · Outbound order memakai komponen yang sama dengan Shipment (card endpoint, banner wall, modal
    dua fase dengan secret sekali tampil, Disable). API docs menambah group "Outbound order" (Create / Track or webhook /
    Cancel / Delivery) dan "Order webhooks" (tabel field + contoh).
14. `GET /v1/integration/outbound-orders/:id/webhook-deliveries` mengembalikan riwayat event order itu dengan bentuk yang
    sama dengan `…/shipments/:id/webhook-deliveries`.
15. Retensi: baris outbox `DONE` dan percobaannya dihapus setelah 30 hari, `DEAD`/`SKIPPED` setelah 90 hari (nightly, di
    tick yang ada). Webhook list hanya menampilkan yang masih ada.
16. **Toggle** `ENABLE_OUTBOUND_ORDER_WEBHOOK` (boolean env, default `false`, dibaca saat boot). `false` → publisher order
    no-op (tidak ada baris outbox, `event_seq` tidak naik), `POST /v1/integration/webhook-endpoints` dengan
    `topic = OUTBOUND_ORDER` → `422 WEBHOOK_TOPIC_DISABLED`, `GET /v1/integration/webhook-topics` melaporkan
    `enabled: false` dan Link menyembunyikan section + segmen Outbound order. Topik `SHIPMENT` tidak terpengaruh.
    Menyalakan **tidak** mem-backfill event yang terjadi saat mati; endpoint yang sudah terdaftar tetap ada.

## Edge cases & failure states

| Kasus | Perilaku |
|---|---|
| Client mendaftar endpoint order pada environment yang sudah punya endpoint order aktif | `409 ENDPOINT_EXISTS`; UI menampilkan "Already has an active endpoint — disable it first". |
| Endpoint shipment & order sama-sama menunjuk URL yang sama | Boleh (unique index per topik). Secret berbeda; partner membedakan lewat `event.type` / `data.order` vs `data.shipment`. |
| Order dibuat saat client belum punya endpoint order | Tidak ada baris (Req. 5). Setelah endpoint didaftarkan, event berikutnya terkirim; event lampau tidak dikirim ulang (seperti shipment). |
| Semua endpoint order client disabled saat event terjadi | Satu baris `SKIPPED NO_ACTIVE_ENDPOINT` (Req. 6) → Send now setelah endpoint baru. |
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

Generalisasi outbox webhook dari "shipment" ke "ref bertopik": `webhook_endpoints.topic`, `webhook_outbox.topic + ref_id
(+ label denormalisasi)`, `EnqueueWebhookEventsUseCase` menerima topik, ref, snapshot, dan `sequence` dari pemanggil.
Produser order adalah modul `warehouse` lewat port OUT baru `OutboundOrderWebhookPort` (default no-op), diimplementasikan di
`warehouse-shipment-adapter` dengan use case enqueue webhook; per-order `event_seq` di `wh_outbound_orders`. Webhook list,
riwayat, retry, dan retry-all adalah query + use case baru di modul `webhook` dengan controller `v1/integration/webhooks`,
plus tabel `webhook_delivery_attempts` yang ditulis `DeliverWebhookUseCase`. Link menambah prop `topic` pada komponen
Webhooks yang ada, satu halaman Webhook list, dan dua section docs. Empat migration kecil, semuanya additive dan
backward-compatible; tanpa flag.

## Architecture

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

Envelope sukses `{ status: "Success", data }`, gagal `{ status: "Failed", error, code? }` (`IntegrationExceptionFilter`).
Semua route baru di koleksi `dash-api-collections/collections/Dash Integration/Webhooks/` (lihat Rollout).

### Endpoint webhook — ditambah `topic`

```
POST /v1/integration/webhook-endpoints          body { url, environment, topic?: "SHIPMENT" | "OUTBOUND_ORDER" }   (default SHIPMENT)
GET  /v1/integration/webhook-endpoints          ?topic?   → data[] + field `topic` di tiap baris
POST /v1/integration/webhook-endpoints/:id/disable                                           (tidak berubah)
```

`409 ENDPOINT_EXISTS` bila sudah ada endpoint aktif `(client, environment, topic)`. Respons create tetap `{ id, url,
environment, topic, createdAt, secret }` — secret sekali. `422 WEBHOOK_TOPIC_DISABLED` bila toggle topik itu mati (Req. 16).

```
GET /v1/integration/webhook-topics   → { data: [ { topic: "SHIPMENT", enabled: true }, { topic: "OUTBOUND_ORDER", enabled: <toggle> } ] }
```

Link memanggilnya sekali saat tab Webhooks dibuka untuk memutuskan section/segmen mana yang tampil.

### Webhook list

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

### Riwayat satu ref

```
GET /v1/integration/webhooks/:topic/:refId/events
GET /v1/integration/outbound-orders/:id/webhook-deliveries      (paritas; = events topik OUTBOUND_ORDER)
GET /v1/integration/shipments/:id/webhook-deliveries            (ada; tidak berubah)
```

Baris = `IntegrationWebhookDeliveryEntity` yang ada (eventId, eventType, sequence, eventStatus, occurredAt, endpoint,
delivery, createdAt, payload) **ditambah** `delivery.attemptsLog[]: { attemptNo, attemptedAt, httpStatus | null, latencyMs,
error | null }` dan `superseded: boolean` (= bukan sequence tertinggi). Urut sequence DESC.

### Retry / send

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

### Webhook body — topik `OUTBOUND_ORDER`

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

### Port internal (modul `warehouse`)

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

Empat migration (`pnpm run db:generate`, jangan tulis tangan), semua additive:

1. **`webhook_endpoints`** — `topic text NOT NULL DEFAULT 'SHIPMENT'` (enum `WebhookTopic` di TS saja). Unique partial
   `(client_id, environment, topic, url) WHERE disabled_at IS NULL` menggantikan yang lama (drop + create). Aturan "satu
   aktif per (client, env, topic)" ditegakkan di `CreateWebhookEndpointUseCase` (lock baris client `FOR UPDATE` lewat
   `pg_advisory_xact_lock(client_id)` + cek), bukan index, supaya pesan errornya jelas.
2. **`webhook_outbox`** — `topic text NOT NULL DEFAULT 'SHIPMENT'`; `ref_id uuid` (backfill `= shipment_id`, lalu `NOT
   NULL`); `ref_label text` + `ref_external_id text` (backfill dari `shipments.waybill`/`booking_id` lewat join, `NOT NULL
   DEFAULT ''`); `endpoint_id` → **nullable** (Req. 6); `shipment_id` → nullable (tetap diisi untuk topik SHIPMENT; dihapus
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
   bersama baris outbox-nya (Req. 15; prune `DONE` > 30 hari, `DEAD`/`SKIPPED` > 90 hari — nightly di `tick`, batch 5.000).

Kompatibilitas data berjalan: baris outbox lama `PENDING`/`FAILED` ikut backfill `ref_id`/label dalam migration yang sama
(satu `UPDATE … FROM shipments`), jadi tick setelah deploy memakai group key baru tanpa jeda. Rollback migration: drop
kolom/tabel baru; kode lama tidak membaca kolom baru.

**ERD** `docs/modules/erd/erd.mermaid` diperbarui di perubahan ini: section baru "Partner webhooks" (`WEBHOOK_ENDPOINTS`,
`WEBHOOK_OUTBOX`, `WEBHOOK_DELIVERY_ATTEMPTS` — dua yang pertama sudah ada di DB tapi belum tergambar), `event_seq` di
`WH_OUTBOUND_ORDERS`.

## Cross-module impacts

| Modul | Dampak |
|---|---|
| `webhook` | Generalisasi enqueue (topic/ref/sequence/snapshot), outbox bertopik, `webhook_delivery_attempts`, use case list/events/retry/retry-all, controller `v1/integration/webhooks`, `topic` di endpoint create/list, prune retensi di tick. Pipeline deliver/tick: group key `ref_id`; selebihnya sama. |
| `shipment` | `recordStatusChange` & milestone producer: tidak berubah secara fungsi — hanya memasok `ref` label (waybill, bookingId) ke enqueue (satu field tambahan; use case bisa mengisinya sendiri dari snapshot bila kosong). |
| `warehouse` | Port `OutboundOrderWebhookPort` + registry + no-op; `event_seq` repo; `outbound-order-webhook-content.ts`; pemanggilan di 8 use case transisi (create, commit-import, create-picking (+bulk), ready-to-pickup, undo-ready, submit-shipping (+bulk), undo-shipping, cancel, hapus GI → OPEN). Mapper `IntegrationOutboundOrderEntity` dipakai ulang (TRD client API). `GET …/outbound-orders/:id/webhook-deliveries` di `WarehouseIntegrationController` memanggil use case `webhook` lewat port yang sama (`listEvents(refId)`). |
| `warehouse-shipment-adapter` | `WebhookOutboundOrderPublisher` (implementasi port) + registrasi saat boot; mengimpor `WebhookModule` (sudah). |
| `api-integration` | `ListIntegrationWebhookDeliveriesUseCase` memakai use case events generik (`topic: SHIPMENT`) + `attemptsLog`/`superseded`. Tidak ada scope baru. |
| `scheduled-instant` / Cloud Scheduler | Tick yang ada menambah langkah prune (tidak ada job baru). |
| Link (`react-link-web`) | § Rollout 4. |
| Web ops (`react-logistic-web`) | Tidak ada. |
| `dash-api-collections` | Folder `Webhooks/`: `Endpoints — create (topic).yml`, `List.yml`, `Events.yml`, `Retry.yml`, `Retry all failed.yml`; `Warehouse/Outbound Orders/Webhook deliveries.yml`. |

## Failure modes & observability

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

- List/events/retry hanya baris `client_id = auth.provider_id` **dan** `environment` pemanggil; ADMIN lintas client via
  `clientId` (seperti endpoint controller). Ref client lain / env lain → `404 WEBHOOK_REF_NOT_FOUND` (keberadaan tidak bocor).
- Payload yang ditampilkan adalah payload yang memang sudah dikirim ke client itu — tidak membuka data baru. Secret
  endpoint tidak pernah ikut (entity endpoint tanpa secret, ada).
- Retry adalah aksi tulis: scope `shipments:write` untuk key; JWT portal role client yang sudah boleh mengelola endpoint.
  Rate limit mencegah partner men-DDoS endpoint-nya sendiri lewat Dash.
- `topic` divalidasi `IsIn(WebhookTopic)`; `q` dipotong 100 karakter, prefix match (bukan `%…%`) agar index terpakai.
- Event order tidak pernah dikirim ke endpoint `SHIPMENT` (fan-out difilter `topic` di `listActive`).

## Rollout

Satu toggle env `ENABLE_OUTBOUND_ORDER_WEBHOOK` (default `false`, Req. 16): kode fase 2 boleh di-deploy bersama fase 1 dalam
keadaan mati, dinyalakan di **staging** dulu, lalu produksi setelah client pilot menguji di sandbox. Di luar itu tidak ada flag —
endpoint topik `OUTBOUND_ORDER` tidak ada sampai client mendaftarkannya.

1. **PR BE-1 (modul `webhook`, bisa rilis sendiri):** migration 1, 2, 4; enqueue generik (`topic/ref/sequence`); deliver
   menulis attempts; group key `ref_id`; `topic` di endpoint API; list/events/retry/retry-all + controller; prune di tick;
   `attemptsLog`/`superseded` di deliveries shipment. Verifikasi di staging: webhook shipment tetap jalan (e2e sandbox
   `sandbox-webhook-e2e-testing.md`), Webhook list topik `SHIPMENT` menampilkan data lama (backfill benar), retry pada
   shipment `DEAD` buatan.
2. **PR BE-2 (WMS + adapter):** migration 3; port + registry + no-op; content service; pemanggilan di use case transisi;
   publisher di adapter (**cek toggle di sini**, bukan di use case WMS); `ENABLE_OUTBOUND_ORDER_WEBHOOK` di `config.ts`
   (`getBool`, Joi boolean) + `.env.example`; `GET /v1/integration/webhook-topics`; `WEBHOOK_TOPIC_DISABLED` di create endpoint; `GET …/outbound-orders/:id/webhook-deliveries`. Staging: daftarkan endpoint `OUTBOUND_ORDER` TEST
   SwipeRX → buat order API sandbox → picking → ready → submit shipping → 4 event `OPEN…SHIPPED` sampai, `sequence` 1–4,
   `order.fulfillment` terisi di `SHIPPED`; cancel → `CANCELLED` + reason; undo ready → `PREPARING`.
3. **PR BE-3 (opsional, rilis berikutnya):** drop `webhook_outbox.shipment_id` + index lama setelah satu siklus retensi.
4. **PR Link:** `services/api/webhooks.ts` (`topic` di row/create/list, `OUTBOUND_ORDER_WEBHOOK_EVENTS`), `WebhooksSection`
   + `AddWebhookEndpointModal` prop `topic` (dirender dua kali), `WebhookListSection` + `services/api/webhookList.ts`
   (list/events/retry/retry-all), sub-nav Endpoints | Webhook list di tab Webhooks, `ApiDocsTab` group Outbound order +
   Order webhooks, Sandbox order detail memakai `WebhookDeliveriesPanel`. Deploy setelah BE-1 (list shipment sudah berguna
   sendiri) — section Outbound order boleh tampil lebih dulu dengan event list; tanpa BE-2 ia hanya tidak pernah menerima
   event.
5. **Pilot:** SwipeRX daftar endpoint `OUTBOUND_ORDER` LIVE; pantau alert (1) 2 minggu; update
   `wms-client-api-outbound-prd-trd-v1.md` no. 3 → "ada, lihat TRD ini" (dilakukan bersama dokumen ini).
6. **Rollback:** BE-2 → `ENABLE_OUTBOUND_ORDER_WEBHOOK=false` (publisher no-op seketika, tanpa deploy) atau revert PR
   (`event_seq` tinggal kolom); BE-1 → revert kode, migration tetap
   (additive; kolom nullable tidak mengganggu kode lama kecuali group index — kode lama memakai index shipment yang masih
   ada).

Increment terkecil yang aman: BE-1 saja (Webhook list untuk shipment + retry) — sudah menjawab masalah ke-3 tanpa menyentuh
WMS.

## Testing strategy

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

1. **Topik di endpoint, bukan subscription list.** Satu endpoint = satu topik; partner memilih URL/secret per topik dan
   mem-parse satu bentuk body per endpoint. Lebih sederhana daripada satu URL dengan dua bentuk `data` (dan tetap bisa
   ditambah nanti: endpoint dengan `topic = ALL`). Endpoint lama otomatis `SHIPMENT` — nol perubahan untuk partner yang ada.
2. **Generalisasi outbox, bukan pipeline kedua.** Satu worker, satu tick, satu kontrak tanda tangan/retry; yang berubah
   hanya kunci group (`ref_id`) dan label referensi yang didenormalisasi ke baris supaya modul `webhook` tidak membaca
   tabel WMS.
3. **Produser di `warehouse` lewat port, sequence milik WMS.** `warehouse` tidak boleh mengimpor `webhook`; `webhook` tidak
   boleh menaikkan kolom tabel WMS. Jadi WMS menaikkan `wh_outbound_orders.event_seq` sendiri dan mengirimnya; use case
   enqueue menerima `sequence` opsional. Adapter yang menyambungkan — sama persis dengan `FulfillmentGateway`.
4. **`event.status` memakai vocabulary internal order (`OPEN`, bukan `RECEIVED`)** — D18 webhook shipment: webhook dan
   GET membaca satu vocabulary, partner yang mereconcile event yang hilang tidak perlu peta kedua. `event.type` tetap
   dibedakan (`ORDER_STATUS_CHANGED`) agar handler yang menerima dua topik di satu codebase bisa switch tanpa menebak dari
   bentuk `data`.
5. **Semua perubahan status gudang dikirim, termasuk aksi balik;** proyeksi pengiriman tidak. Aksi balik jarang tapi
   nyata (undo shipping karena salah kirim) dan client harus tahu pesanannya mundur. Proyeksi (`IN_DELIVERY` dst.) sudah
   datang dari webhook shipment dengan `bookingId = externalID` — mengirimnya dua kali hanya membingungkan.
6. **Retry manual hanya event terbaru; retry otomatis event lama tidak diubah.** Event terbaru membawa snapshot penuh
   (`order`/`shipment` saat itu), jadi mengirim ulang event lama yang gagal tidak menambah informasi dan bisa mengirim
   status mundur. Tapi backoff otomatis event lama tetap jalan seperti sekarang (narrowing 2026-10-21) — partner yang
   menyimpan riwayat lengkap tetap mendapatnya; UI hanya menandainya "superseded — not retryable". Menutup otomatis event
   lama saat event baru terkirim (`SKIPPED SUPERSEDED`) ditunda — Open question 2.
7. **`SKIPPED NO_ACTIVE_ENDPOINT` hanya untuk client yang punya endpoint topik itu.** Tanpa ini Webhook list tidak bisa
   menampilkan "terlewat karena endpoint mati" dan Send now tidak punya payload beku. Client tanpa endpoint sama sekali
   tetap nol baris — tidak ada beban untuk 90 % client yang tidak memakai webhook.
8. **Retry = payload beku, bukan snapshot baru.** Prinsip outbox ("a retry sends what happened, not what is") dipertahankan;
   karena hanya event terbaru yang boleh di-retry, "what happened" = "what is" secara praktis.
9. **Per-attempt log tabel terpisah**, bukan JSON array di baris outbox — baris outbox ditulis tiap percobaan oleh claim
   atomik; append JSON di sana memperbesar kontensi tanpa perlu. Dipangkas bersama outbox.
10. **Reset `attempts = 0` saat retry manual** — kalau tidak, retry pada baris `DEAD` langsung `DEAD` lagi pada kegagalan
    berikutnya; satu siklus backoff penuh setelah aksi sadar partner adalah ekspektasi yang wajar.

11. **Toggle = satu env boolean global, dicek saat publish.** Bukan flag per client (pilot satu partner), bukan "ada endpoint
    = nyala" (ops harus bisa mematikan tanpa menyentuh data client). Dicek di publisher adapter supaya `warehouse` tidak
    membaca config webhook dan restart saja cukup; dicek lagi di create endpoint supaya client tidak mendaftar ke topik yang
    gelap. Tanpa backfill saat dinyalakan — konsisten dengan "event sebelum endpoint ada tidak dikirim".

Diserahkan ke implementer: nama file mengikuti CLAUDE.md Nest (`list-webhooks.usecase.ts`, `retry-webhook.usecase.ts`,
`webhook-list.controller.ts`, `webhook-outbound-order.publisher.ts`); bentuk `pagination` mengikuti helper repo; pesan
error Bahasa Indonesia seperti `WebhookErrors`/`WarehouseErrors`; lebar kolom dan copy di Link mengikuti mockup; apakah
`q` juga mencari `event.id` (mock menyebutnya — boleh, exact match uuid).

## Open questions

1. **Satu endpoint dua topik** (`topic = ALL`)? Mock & TRD ini: tidak. Tanya SwipeRX saat review kontrak.
2. **Menutup event lama yang masih gagal saat event baru terkirim** (`SKIPPED SUPERSEDED`): mengurangi retry sia-sia ke
   endpoint yang pulih, tapi partner yang menyusun riwayat dari webhook kehilangan satu langkah. Default TRD: tidak ditutup.
3. **Retensi** 30/90 hari cukup? Sandbox boleh lebih pendek (7 hari) — belum diputuskan; TRD memakai angka yang sama.
4. **Retry self-serve** untuk client (TRD ini) atau ops-only lewat ADMIN? Mock: self-serve.
5. Apakah ops gudang perlu melihat status webhook di web ops (detail outbound request) — di luar scope; ADMIN bisa lewat
   Link list dengan `clientId`.
6. Order **MANUAL/CSV** ikut dikirim (TRD ini: ya, per client). Konfirmasi tidak ada client yang kaget menerima event order
   yang dibuat ops untuknya.

## Changelog

- 2026-10-22 — created (dari mock interaktif `wms-client-api-outbound-mockup-v1.html`; membalik keputusan no. 3 TRD
  client API)
- 2026-10-26 — dijadikan **fase 2** di belakang toggle `ENABLE_OUTBOUND_ORDER_WEBHOOK` (default off); kontrak partner
  dipisah ke `nest-logistic-service/docs/api-integration/outbound-order.md`; `GET /webhook-topics`, `WEBHOOK_TOPIC_DISABLED`
