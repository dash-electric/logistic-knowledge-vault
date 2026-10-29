---
title: WMS — Outbound order CR-1 — export CSV, stok kembali saat cancel, kota tujuan, jarak dari dispatch
module: warehouse-management
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:
engineer:
created: 2026-10-26
links:
  context: ./wms-context-v1.md
  parent: ./wms-prd-trd-v2.md  (§ Outbound request, § Aksi balik, § Sinkronisasi shipment)
  client-api: ./wms-client-api-outbound-prd-trd-v1.md
  webhook: ./wms-outbound-order-webhook-prd-trd-v1.md
  sync: nest-logistic-service docs/warehouse/outbound-order-shipment-sync.md
  curl: nest-logistic-service docs/warehouse/wms-v2-curl.md (§ 19 Aksi balik)
  core: nodejs-core-service src/application/routes/city.js, routes/poi.js
  mockup:
  presentation:
---

# WMS — Outbound order CR-1 — PRD/TRD v1

Empat perubahan kecil-menengah pada **outbound order** (menu ops "Outbound request"; API `/v1/warehouses/outbound-orders`),
satu rilis:

| # | Perubahan | Ringkas |
|---|---|---|
| **A** | **Export CSV** outbound order | Tombol Download CSV di daftar, filter yang sama dengan daftar, satu baris per baris produk. |
| **B** | **Stok kembali saat cancel** | Cancel setelah SHIPPED (langsung dari order, atau karena shipment-nya dibatalkan dan tersinkron) mengembalikan stok ke bin asal **dengan** ledger + timeline. Hari ini order hanya jadi `FAILED` dan stok hilang sampai GR retur manual. |
| **C** | **Kota tujuan** | `destination_city` **selalu dari master kota core-service**: dicocokkan dari teks alamat, lalu reverse-geocode koordinat lewat core; tidak ketemu → kosong + peringatan, ops pilih sendiri dari daftar kota core (create & Ubah). Tampil di detail, daftar, export, filter. |
| **D** | **Jarak dari dispatch → order** | Jarak hub→tujuan yang diukur dispatch (Mapbox) disalin ke order bila order belum punya; tampil di detail (sudah) dan export. |

Semua additive, tanpa flag. Yang menyentuh stok (B) mengikuti aturan "aksi balik hanya sebelum end state" (v2 § Aksi balik).

> **Status rilis (2026-10-29).** Diprioritaskan ulang oleh Yogi: yang dirilis dulu adalah **C (kota tujuan)** — cityID +
> cityName di data order (dari alamat → reverse-geocode core → kosong), bisa diedit (ops cari kota dari master core di
> logistic web), tampil di detail (plus **kurir: nama + no. HP**, dari rider shipment Dash), ikut di export, dan tampil
> juga di **Link** (portal klien, read-only). Branch: BE `feat/wms-outbound-city` (migration `0125_wms_outbound_city`),
> FE `feat/wms-outbound-city`, Link `feat/wms-outbound-city` — semua dari `main` 2026-10-29.
> **A** sudah ada di `main` lewat PR #522 (satu baris per order, kolom ops-only untuk internal; rilis ini menambah kolom
> `ID Kota Tujuan` + `Kota Tujuan`) — § A di bawah adalah desain awal dan tidak dipakai. **B**, **D**, **E** ditunda; kode
> lengkapnya tetap ada di branch `feat/wms-outbound-order-cr1` (BE + FE) untuk dilanjutkan nanti. **E** (kota ke shipment &
> delivery-service) dibatalkan untuk sekarang (DS tidak disentuh).

---

# Part 1 — Product Requirements (PRD)

## Problem

- **A.** Ops dan finance merekap outbound request (per client, per hari, per status) dengan menyalin tabel web — tidak ada
  export, padahal stok sudah punya tiga export CSV. Pertanyaan rutin: "berapa order SwipeRX minggu ini per SKU", "mana yang
  belum ship".
- **B.** Shipment hasil WMS bisa dibatalkan ops di halaman Shipments (item `HUB_SCANNED` dibatalkan → shipment `CANCELLED`)
  saat barang **masih di hub**. Event-nya sampai ke WMS, order jadi `FAILED`, tetapi stok yang sudah dipotong saat submit
  shipping **tidak kembali**: barang ada di rak, sistem bilang nol. Ops harus membuat PO RETURN + GR manual — sering lupa,
  stok on-hand lebih kecil dari fisik, picking order berikutnya gagal `INSUFFICIENT_STOCK`. Sebaliknya `undo-ship` sudah
  mengembalikan stok dengan benar — logikanya ada, hanya tidak dipakai di jalur cancel.
- **C.** Alamat tujuan hanya teks bebas + koordinat. Tidak bisa menjawab "order ke Bogor berapa", tidak bisa difilter per
  kota, dan export tanpa kota tidak terpakai untuk rekap wilayah.
- **D.** Sejak jarak WMS dimatikan (`DISTANCE_WMS_CALCULATION_MODE=NONE`), `distance` order null; dispatch mengukurnya di
  shipment (`shipments.distance`, history `DISTANCE_MEASURED`), tetapi angka itu tidak pernah kembali ke order. Detail
  order menampilkan "Jarak dari hub: —" padahal shipment-nya tahu.

## Context

- Export stok sudah punya pola lengkap: `toCsvFile` (BOM + RFC4180 + sanitasi formula), `ReplyHelper.attachment`,
  `stockCsvFilename`, FE `getFile` + `downloadBlob` + toast. Tinggal dipakai ulang.
- Jalur stok: `wh_stocks` (`qty_on_hand`, `qty_reserved`, CHECK `on_hand ≥ reserved`), ledger append-only
  `wh_stock_movements` (`type` INBOUND|OUTBOUND|TRANSFER|ADJUSTMENT, `ref_type`, `qty_delta` bertanda). `undo-shipping`
  sudah punya `restock` (lock baris stok, cek baris masih sama, `on_hand += qty`, ledger `OUTBOUND` +qty, refCode
  "(batal shipping)"). Cabang `feat/wms-stock-type` (migration 0124) menambah `stock_type` ke kunci unik `wh_stocks` dan ke
  baris GI — restock harus mengembalikan ke baris dengan `stock_type` yang sama.
- Sinkronisasi shipment → order: PubSub `shipment-status-updated` → `warehouse-shipment-adapter` →
  `WarehouseFulfillmentPort.applyUpdates`; `CANCELLED | RETURNED | FAILED` → order `FAILED`. Shipment WMS lahir `AT_HUB`;
  pembatalan hanya mungkin selama item `CREATED`/`HUB_SCANNED` (barang belum keluar hub), jadi event `CANCELLED` **selalu**
  berarti barang masih di hub.
- Core-service: `GET /v1/cities` (publik, semua kota aktif, `{id, name, code, province_id, wilayahid_code, timezone}`),
  tanpa pencarian nama; nama memuat tipe ("Kota Bogor", "Kabupaten Bogor", "Jakarta Selatan"). Tidak ada resolver
  teks→kota; reverse-geocode ada (`/v1/poi/*/address-by-geolocation`) tapi memanggil Google/Mapbox per titik. Logistic
  sudah punya `AddressHelper.city(address)` (parser teks sederhana, dipakai public-track & UJP).
- Jarak: hook Shipments → WMS sudah ada untuk **alamat** (`ShipmentDestinationHookRegistry` → adapter →
  `applyDestination`, history `DESTINATION_UPDATED`). Pola yang sama dipakai untuk jarak.

## Users & jobs

| Pengguna | Pekerjaan |
|---|---|
| **Ops gudang** | Download rekap outbound request sesuai filter layar + rentang tanggal (maks 2 bulan); membatalkan order yang sudah di-submit shipping selama barang masih di hub tanpa harus "undo ship lalu cancel" dua langkah; melihat stok kembali otomatis dan jejaknya. |
| **Ops Shipments / dispatch** | Membatalkan shipment WMS seperti biasa; tidak perlu memberi tahu gudang. |
| **Finance / PM** | Rekap per kota, per client, per SKU dari CSV. |
| **Client (via Link/API)** | `GET /v1/integration/outbound-orders/:id` memuat `destination.city` dan `distance` (informasi). |

## Scope

### In scope
- **A.** `GET /v1/warehouses/outbound-orders/export` + tombol **Download CSV** di daftar Outbound request (filter aktif +
  tab status + pencarian). Satu baris per baris produk; kolom § API contracts.
- **B.** (1) Shipment `CANCELLED` tersinkron → stok kembali ke bin/lot asal (on-hand saja, tidak di-reserve), GI `CANCELLED`,
  order `CANCELLED` + alasan dari shipment, ledger + timeline + data history. (2) Tombol **Batalkan** pada order `SHIPPED`
  dengan `fulfillment.status = AT_HUB` (carrier Dash): membatalkan shipment lewat gateway lalu restock yang sama — satu
  aksi, bukan undo-ship + cancel. (3) Order TRANSFER: PO TRANSFER tujuan ikut dibatalkan (seperti undo-ship).
- **C.** Kolom `destination_city_id` + `destination_city` (snapshot nama master core) diisi otomatis saat create (form/CSV/API)
  dan saat alamat diubah: teks alamat → master; gagal → reverse-geocode koordinat lewat core → master; gagal → **kosong**
  + peringatan di form/detail. Ops memilih/mengganti kota dari daftar kota core di **create** dan **Ubah**; CSV
  `destination_city` opsional (harus ada di master). Tampil di detail, daftar, export, filter; backfill order lama.
- **D.** Hook jarak Shipments → WMS: setelah dispatch mengisi `shipments.distance`, order yang `distance`-nya null diisi
  nilai yang sama + data history `DISTANCE_MEASURED` origin `DISPATCH`; backfill order lama; kolom export.

### Out of scope
- Shipment `RETURNED` / `FAILED` setelah ship — tetap order `FAILED` + GR retur manual (retur ditunda, v2 § Out of scope).
  Lihat Open questions 1.
- Membatalkan order yang `fulfillment.status` ≠ `AT_HUB` (sudah dispatch) — tetap 409; barang sudah di luar hub.
- Menyimpan kota **di luar master** core (teks bebas) — kalau tidak ada di core, kosong.
- Kota pada transfer antar hub (tujuannya hub), purchase order, shipment non-WMS.
- Export PDF / Excel; export goods issue / picking (menyusul kalau diminta).
- Mengubah cara WMS menghitung jarak sendiri (`DISTANCE_WMS_CALCULATION_MODE` tetap, default `NONE`).

## Requirements

**A — Export**
1. `GET /v1/warehouses/outbound-orders/export` menerima filter yang sama dengan daftar (`hubID`, `clientID`, `status`,
   `source`, `type`, `method`, `uploadID`, `search`, `dateFrom/dateTo`, `deliveryFrom/deliveryTo`) ditambah
   `destinationCity`, tanpa paging. Rentang `dateFrom..dateTo` (tanggal dibuat) **wajib** dan maksimum **2 bulan (62 hari
   WIB)**; FE mengirim rentang dari filter "Tanggal dibuat" (default: 1 bulan terakhir bila kosong). Melebihi / kosong →
   `422 VALIDATION`.
2. Satu baris CSV per **baris produk** (order tanpa baris — tidak ada — tetap satu baris); kolom order diulang. Urutan:
   `created_at DESC, code, line_no`. Kolom dan format § API contracts; BOM UTF-8, CRLF, sanitasi formula, nama file
   `outbound-orders-DDMMYYYY.csv`.
3. FE: tombol **Download CSV** di header daftar (sebelah Upload CSV), memakai filter + tab + pencarian yang sedang aktif;
   spinner saat proses; toast sukses/gagal dengan pola stok; order sandbox tidak ikut (filter daftar sudah
   mengecualikannya).

**B — Stok kembali saat cancel**
4. Event fulfillment `CANCELLED` untuk order di `SHIPPED_STATES` dengan GI `SHIPPED`: dalam **satu transaksi** — baris GI
   dikunci, baris stok dikunci; per baris GI `qty_on_hand += qty_picked` pada baris stok asal (`storage, client, sku,
   batch[, stock_type]`); satu ledger `wh_stock_movements` per baris (`type OUTBOUND`, `qty_delta +qty`, `ref_type
   GOODS_ISSUE`, `ref_code "{GI} (shipment dibatalkan)"`, `storage_to = storage asal`); GI → `CANCELLED`
   (`cancelled_at/by`); order → `CANCELLED` — **status yang sama** dengan cancel sebelum ship, bukan `FAILED`
   (`cancelled_at` = `occurredAt` event, `cancelled_by` = `changedBy` event, `cancellation_reason` = alasan shipment atau
   "Shipment dibatalkan"), `fulfillment_status = CANCELLED`, `shipment_id` &
   `waybill` **dipertahankan** (audit), `goods_issue_id` → null; timeline satu baris origin `FULFILLMENT`
   (`source_event_id` = eventID, idempoten) "Shipment dibatalkan — stok dikembalikan" dengan AWB, alasan, dan ringkasan
   `n baris · total qty`.
5. Baris stok asal **tidak ada lagi** (dihapus) tetapi storage-nya ada → baris dibuat ulang lewat upsert kunci unik dengan
   `on_hand = qty`, `expired_date`/`item_name`/`uom_name` dari snapshot baris GI. Storage asal **tidak ada** → tidak ada
   perubahan stok; order → `FAILED` (perilaku lama) + timeline "Stok tidak bisa dikembalikan otomatis: lokasi {kode} sudah
   dihapus — lakukan GR retur manual". Event **tetap di-ack** (tidak nack/retry).
6. Order `TRANSFER`: PO TRANSFER di hub tujuan dibatalkan dalam transaksi yang sama bila belum punya GR; bila sudah punya GR
   → seperti Req. 5 jalur gagal (`FAILED` + timeline "PO transfer sudah diterima sebagian").
7. Tombol **Batalkan** (ops) pada order `SHIPPED` + `fulfillment.status = AT_HUB` + carrier `DASH`: alasan wajib;
   `checkCancel` gateway (`CANCELLABLE` saja; lainnya `409 SHIPMENT_IN_TRANSIT`); dalam tx: `gateway.cancel(shipment)` +
   restock Req. 4 (actor = user, origin timeline `WMS`, judul "Order dibatalkan setelah submit shipping — stok
   dikembalikan"); `afterCancel` setelah commit. Event `CANCELLED` dari shipment yang kemudian datang **diabaikan**
   (order sudah `CANCELLED`, `source_event_id` baru tapi status bukan `SHIPPED_STATES`).
8. `HANDOVER` (carrier bukan Dash) dan `LION_PARCEL`: Batalkan setelah ship tetap 409 (tidak ada gateway cancel).
9. Semua restock mengembalikan **on-hand saja** (`qty_reserved` tidak naik) — berbeda dengan undo-ship yang me-reserve ulang
   karena order kembali `READY_TO_PICKUP`.
10. Laporan pergerakan stok (export) menampilkan baris pengembalian dengan `Tipe = Outbound`, `Kategori` positif, `Reference
    = {GI} (shipment dibatalkan)`; mutasi stok (In/Out) menghitungnya sebagai In (qty_delta positif).

**C — Kota tujuan**
11. `wh_outbound_orders.destination_city_id integer NULL` (core `m_city.id`, soft ref) + `destination_city text NULL`
    (snapshot nama master). **Hanya nilai master** yang disimpan — tidak ada teks bebas. Diisi saat create (form, CSV,
    client API; hub transfer: null) dan saat `destination.address`/koordinat berubah di Ubah tanpa kota dipilih, oleh
    `DestinationCityResolver`: (a) kandidat teks dari alamat (`AddressHelper.city`) → normalisasi (buang "Kota/Kab./
    Kabupaten/Kota Administrasi", huruf kecil, tanpa tanda baca) → cocok persis / sebagian unik ke master kota core
    (`GET /v1/cities`, cache 1 jam); (b) tidak cocok → reverse-geocode koordinat lewat core
    (`GET /v1/poi/map/place/address-by-geolocation`, field `city` = Google admin level 2) → cocokkan ke master dengan cara
    yang sama; (c) tetap tidak cocok (atau core tidak bisa dihubungi) → **kosong** (`null`, `null`) + `cityWarning`
    "Kota tidak ditemukan dari alamat/koordinat — pilih manual" di respons create/update dan di detail/daftar.
12. **Create & Ubah**: field **Kota** = select dari daftar kota core (`GET /v1/warehouses/cities`, cari di FE), prefilled
    dari `GET /v1/warehouses/outbound-orders/resolve-city?address&latitude&longitude` begitu alamat/koordinat terisi;
    bila resolver gagal, select kosong + peringatan kuning, tetap bisa simpan (kota kosong). Nilai pilihan ops menang dan
    dikirim sebagai `destination.cityID`; server memvalidasi id ada di master (`422 CITY_NOT_IN_MASTER`). Perubahan dicatat
    di `outbound_request_data_history` (`destination_city`, `destination_city_id` di diff `DESTINATION_UPDATED`).
13. CSV import: kolom opsional `destination_city` (nama master, cocok persis/sebagian unik); tidak cocok → dry-run
    **peringatan** `CITY_NOT_IN_MASTER` per baris (tidak memblokir; disimpan kosong, ops lengkapi lewat Ubah). Kosong →
    resolver (a)(b). Template memuat kolom ini. Client API: `destination.city` opsional (nama), aturan sama; entity
    teredaksi memuat `destination.city { id, name } | null`.
14. Tampil: detail § Destination KV **Kota** (kosong → badge peringatan "Kota belum dikenali" + tombol Ubah); daftar kolom
    Recipient baris kedua "{kota} · {alamat}" (kosong → ikon peringatan); filter daftar **Kota** (`destinationCityID`,
    select dari daftar core; plus opsi "Belum dikenali" = `destinationCityID=none`); export kolom "Kota Tujuan".
    Core-service tidak diubah.
15. Backfill: `POST /internal/v1/warehouses/outbound-orders/backfill-city` (INTERNAL_SERVICE) — order dengan
    `destination_city_id IS NULL`, batch 200, idempoten, memakai resolver (a) lalu (b) (reverse-geocode dibatasi
    `maxGeocode` per panggilan), jawab `{ scanned, matched, geocoded, unresolved }`; dijalankan sekali per environment
    setelah deploy.

**D — Jarak dari dispatch**
16. Setelah `ShipmentDistanceService.fillMissing` menulis `shipments.distance`, hook jarak memanggil
    `WarehouseFulfillmentPort.applyDistance` **di transaksi yang sama**: order dengan `fulfillment_shipment_id` = shipment
    **dan** `distance IS NULL` → `distance` = nilai shipment (meter), satu baris `outbound_request_data_history`
    (`DISTANCE_MEASURED`, origin `DISPATCH`, `changed_by` = actor dispatch, `changes {distance:{from:null,to}}`). Order yang
    sudah punya jarak (mode HAVERSINE/MAPS, atau diketik ops) **tidak** ditimpa.
17. Detail: "Jarak dari hub" (sudah ada) terisi; export kolom "Jarak dari Hub (km)" 2 desimal; client API `distance`
    (meter) ikut terisi.
18. Backfill: `POST /internal/v1/warehouses/outbound-orders/backfill-distance` — order `distance IS NULL` dengan
    `fulfillment_shipment_id` yang shipment-nya punya `distance` → salin + history, batch 500, idempoten.

## Edge cases & failure states

| Kasus | Perilaku |
|---|---|
| Export tanpa rentang tanggal / > 62 hari | `422 VALIDATION` `dateFrom`/`dateTo` ("wajib, maksimum 2 bulan"); FE mengirim default 1 bulan terakhir dan menolak rentang > 2 bulan sebelum memanggil. |
| Export hasil 0 baris | File CSV hanya header (seperti export stok). |
| Export order tanpa GI / belum ship | Kolom GI, AWB, carrier kosong; `Qty Reserved/Picked` 0. |
| Shipment dibatalkan tetapi order sudah `READY_TO_PICKUP` karena undo-ship lebih dulu | `filterOwned` tidak menemukan (shipment id sudah null) → diabaikan (ada). |
| Event `CANCELLED` datang dua kali | `source_event_id` unik → transaksi kedua gagal unik → diabaikan, stok tidak dobel. |
| Event `CANCELLED` untuk order yang sudah `CANCELLED` lewat tombol Batalkan (Req. 7) | Status bukan `SHIPPED_STATES` → diabaikan. |
| Baris stok asal sudah dihapus, storage ada | Upsert membuat baris baru dengan on-hand = qty (Req. 5). |
| Storage asal dihapus | Tidak restock; order `FAILED` + timeline instruksi GR retur manual; event di-ack (Req. 5). |
| Baris stok asal ada tapi sudah pindah storage/SKU/batch (data berubah) | Kunci unik mencegah ini (storage+client+sku+batch[+type] adalah identitas baris); yang mungkin hanya "dihapus" → upsert. |
| Sebagian item shipment sudah dispatch, sebagian dibatalkan | Rollup shipment bukan `CANCELLED` (partial) → tidak ada event cancel → tidak ada restock. Bila nanti seluruhnya gagal → `FAILED` (manual). |
| Batalkan (ops) saat shipment sudah dispatch | `checkCancel` → `IN_TRANSIT` → `409 SHIPMENT_IN_TRANSIT`; pesan: batalkan lewat Shipments setelah barang kembali ke hub, lalu GR retur. |
| Batalkan (ops) ketika `cancel` gateway gagal di tengah (item sudah berubah) | Transaksi rollback, `409 SHIPMENT_IN_TRANSIT`; tidak ada stok berubah. |
| Order TRANSFER, PO tujuan sudah GR sebagian | Restock tidak dilakukan, order `FAILED` + timeline (Req. 6). |
| `stock_type` RETURN pada baris GI (cabang stock-type) | Kembali ke baris `stock_type` yang sama. |
| Alamat tanpa pola kota ("Jl. Mawar 5") | Lanjut ke reverse-geocode koordinat; ketemu → kota master; tidak → kosong + peringatan, ops pilih di form. |
| Kandidat cocok ke >1 kota master ("Bogor" → Kota Bogor & Kabupaten Bogor) | Ambigu → coba reverse-geocode (hasil Google menyebut tipe); tetap ambigu → kosong + peringatan. |
| Core-service tidak bisa dihubungi saat create | Master dari cache; cache kosong / geocode gagal → kota kosong + peringatan (create **tidak** gagal, dilog `warn`); backfill mengisi nanti. |
| Ops memilih kota yang tidak ada di master (id palsu) | `422 CITY_NOT_IN_MASTER`. |
| Kota master dinonaktifkan di core setelah dipakai | Snapshot nama tetap; `city_id` tetap (soft ref). |
| Dispatch mengukur, order sudah punya jarak manual | Tidak ditimpa (Req. 16); history tidak ditulis. |
| Shipment diukur ulang setelah alamat diedit (`distance` shipment di-null-kan lalu diisi lagi) | Order: `applyDestination` sudah menulis `distance` dari edit alamat (null bila mode NONE) → hook mengisi lagi bila null. |
| Order `SHIPPED` punya ≥2 shipment (tidak mungkin: satu GI satu shipment) | — |

## Success criteria

- A: ops berhenti meminta rekap manual; CSV 2 bulan untuk hub terbesar < 5 detik (ukur di staging dengan data Kemang).
- B: nol selisih stok dari pembatalan shipment: tiap event `CANCELLED` pada order `SHIPPED` menghasilkan ledger `+qty`
  (audit SQL mingguan: GI `CANCELLED` dengan `shipped_at` ≠ null ⇔ ada movement "(shipment dibatalkan)").
- C: ≥ 90 % order baru punya `destination_city_id` (cocok master) di 2 minggu pertama; sisanya terlihat di filter "Kota
  kosong" untuk dilengkapi ops.
- D: 100 % order `SHIPPED` yang shipment-nya sudah di-dispatch punya `distance` (audit SQL: join shipments.distance).

---

# Part 2 — Technical Requirements (TRD)

## Summary

**A** menambah satu use case export dengan pola stok (`toCsvFile`, `ReplyHelper.attachment`) di atas query daftar yang ada
(`listConditions`) + join baris. **B** mengekstrak `restock` dari `undo-shipping` menjadi `OutboundRestockService`
(on-hand saja, upsert) dan memakainya di dua tempat: `applyUpdates` saat `CANCELLED` (jalur sync) dan use case baru
`CancelShippedOutboundOrderUseCase` (tombol Batalkan); GI mendapat transisi `SHIPPED → CANCELLED`. **C** menambah dua kolom +
`DestinationCityResolver` (pure, diuji unit) + `CoreService.listCities()` ber-cache, dipanggil di factory/normalize dan
Ubah; FE select kota + filter + kolom. **D** menambah `ShipmentDistanceHookRegistry` di modul shipment (cermin hook alamat),
adapter mengimplementasikannya ke `applyDistance` baru di `WarehouseFulfillmentPort`. Tiga migration kecil, dua route
backfill internal, tanpa flag.

## Architecture

```
A  OutboundOrderController.export ─▶ ExportOutboundOrdersUseCase ─▶ OutboundOrderRepository.listExportRows(filter)
                                        └─ outbound-order-csv.ts (headers + format, pure) ─▶ CsvFileEntity ─▶ ReplyHelper.attachment

B  shipment-status-updated (PubSub) ─▶ adapter listener ─▶ OutboundOrderFulfillmentSync.apply
      └─▶ WarehouseFulfillmentPort.applyUpdates(tx, updates)   [warehouse]
             └─ status CANCELLED && order ∈ SHIPPED_STATES && GI SHIPPED
                  └─▶ OutboundRestockService.restockAndCancel(tx, order, gi, {actor, reason, origin: FULFILLMENT, sourceEventId})
                         ├─ lock GI → lock/upsert wh_stocks → on_hand += qty → wh_stock_movements (+qty)
                         ├─ GI CANCELLED · order CANCELLED · (TRANSFER: PO tujuan CANCELLED)
                         └─ timeline + outbound_request_data_history
   Ops "Batalkan" (SHIPPED, AT_HUB) ─▶ CancelShippedOutboundOrderUseCase
      ├─ planShipment: gateway.checkCancel (CANCELLABLE)        [luar tx, seperti undo-shipping]
      ├─ tx: gateway.cancel(shipment) → OutboundRestockService.restockAndCancel(origin: WMS)
      └─ afterCommit: gateway.afterCancel

C  create / import / client API / update ─▶ OutboundOrderFactory.normalize ─▶ DestinationCityResolver.resolve(address, city?)
      └─ CoreService.listCities() (GET /v1/cities, cache 1 h, in-memory)      [shared]
   internal backfill-city ─▶ BackfillOutboundCityUseCase (batch 500)

D  dispatch snapshot ─▶ ShipmentDistanceService.fillMissing (tx) ─▶ ShipmentDistanceHookRegistry.onMeasured(tx, rows)
      └─▶ adapter WarehouseShipmentDistanceHook ─▶ WarehouseFulfillmentPort.applyDistance(tx, {shipmentID, distance, actor})
             └─ UPDATE wh_outbound_orders SET distance WHERE fulfillment_shipment_id = ? AND distance IS NULL  + data history
   internal backfill-distance ─▶ BackfillOutboundDistanceUseCase
```

- **Batas modul tetap:** `warehouse` tidak mengimpor modul lain; `shipment` hanya mendefinisikan registry hook; adapter
  menyambung (sudah pola `ShipmentDestinationHook`). `OutboundRestockService` ada di `warehouse/domain/services`, dipakai
  `undo-shipping` juga (parameter `reReserve: true`) agar satu implementasi restock.
- **Core client:** `CoreService.listCities()` baru (`GET /v1/cities`, publik, tetap kirim bearer internal), cache
  in-memory 1 jam seperti `reasonTextCache`; resolver pure menerima array master.

## API contracts

### A — Export

```
GET /v1/warehouses/outbound-orders/export        @AuthTypes(ADMIN, INTERNAL_SERVICE)   — dideklarasikan sebelum GET :id
  query: OutboundOrderFilterRequestDto + status? + destinationCity?   (tanpa page/limit)
  200: text/csv; charset=utf-8 · Content-Disposition: attachment; filename="outbound-orders-DDMMYYYY.csv"
  422: VALIDATION (dateFrom/dateTo wajib, rentang > 62 hari, tanggal tidak valid)
```

Kolom (`OUTBOUND_EXPORT_HEADERS`, `warehouse/domain/services/outbound-order-csv.ts`), satu baris per baris produk:

```
'Request ID','External ID','Sumber','Tipe','Perusahaan','Hub','Hub Tujuan',
'Status','Status Pengiriman','Metode','Layanan',
'Tanggal Order','Tanggal Kirim (ETA)',
'Penerima','Telepon','Alamat Tujuan','Kota Tujuan','Latitude','Longitude','Catatan Tujuan','Jarak dari Hub (km)',
'SKU','Nama Produk','UoM','Qty Order','Qty Reserved','Qty Picked','Catatan Baris',
'Goods Issue','Status GI','Surat Jalan','Picker',
'AWB','Carrier','Batch Upload','Catatan Order','Alasan Batal','Dibatalkan Oleh','Dibatalkan Pada',
'Dibuat Oleh','Dibuat Pada','Diupdate Pada'
```

Format mengikuti `stock-csv.ts`: tanggal-waktu `DD/MM/YYYY HH:mm:ss` WIB, tanggal `DD-MM-YYYY`, angka `plainNumber`
(2 desimal tanpa nol di belakang), `Jarak` = `distance/1000` 2 desimal atau `''`, status via `statusLabel` (`Ready To
Pickup`), `Sumber` label `Manual | CSV | Client API`, `Tipe` `Regular | Transfer`, `Status Pengiriman` label
`FulfillmentStatus`. Koordinat 6 desimal. Nilai null → `''`.

Repository `listExportRows(filter: OutboundOrderFilterEntity & { status? })`: satu SQL — `wh_outbound_orders` dengan
`listConditions` yang ada, `LEFT JOIN wh_outbound_order_lines` (urut `line_no`), `LEFT JOIN wh_goods_issues` (aktif via
`goods_issue_id`) + agregat `qty_reserved/qty_picked` per `(gi, sku)` dari `wh_goods_issue_lines`, `LEFT JOIN
wh_outbound_order_uploads`. Tanpa LIMIT; rentang wajib ≤ 62 hari di use case (`assertDateRanges` + cek rentang) menjaga ukuran.
FE: `warehouseApi.downloadOutboundOrdersCsv(params)` → `getFile('/outbound-orders/export', params,
datedCsvName('outbound-orders'))`; tombol di `OutboundRequestListPage` header, `data-testid="outbound-csv-download"`;
rentang = filter "Tanggal dibuat" (ujung terbuka ditutup: `dateTo` = hari ini, `dateFrom` = 30 hari sebelum `dateTo`),
default 30 hari terakhir; > 62 hari ditolak di FE sebelum memanggil.

### B — Cancel setelah ship

```
POST /v1/warehouses/outbound-orders/:id/cancel          body { reason }            (route ada; aturan diperluas)
  OPEN | PREPARING | READY_TO_PICKUP  → perilaku lama (lepas reserve)
  SHIPPED + fulfillment.status = AT_HUB + carrier DASH → CancelShippedOutboundOrderUseCase (Req. 7)
  lainnya → 409 INVALID_STATUS_TRANSITION (CANCEL) · dispatch sudah jalan → 409 SHIPMENT_IN_TRANSIT
  200: { order, releasedGoodsIssueCode?, restocked?: { lines, totalQty } }
```

Tidak ada route baru; FE menampilkan **Batalkan** pada status `SHIPPED` bila `fulfillment.status === 'AT_HUB' && carrier
=== 'DASH'` dengan teks konfirmasi "Shipment {AWB} akan dibatalkan dan stok dikembalikan ke lokasi asal".

Port (ada) `WarehouseFulfillmentPort.applyUpdates` — tidak berubah tanda tangannya; implementasi `warehouse` menangani
`CANCELLED` lewat `OutboundRestockService`. `FulfillmentUpdateRequestEntity.reason` dipakai sebagai `cancellation_reason`.

`OutboundRestockService.restockAndCancel(tx, { order, issue, actor, reason, origin, sourceEventId?, cancelledAt })`:
1. `lockGoodsIssue(issue.id)`; baris GI (`stockId, storageId, sku, batchNumber, stockType?, qtyPicked, expiredDate,
   itemName, uomName`).
2. Storage asal masih ada? (`wh_storages` by id, tidak dihapus) — tidak → lempar `RestockImpossible(storageCode)` yang
   ditangkap pemanggil → jalur `FAILED` + timeline (Req. 5), **bukan** rollback seluruh event.
3. Per baris: `upsertStockOnHand({ storageId, clientId, sku, batchNumber, stockType, hubId, expiredDate, itemName, uomName },
   +qty)` — `INSERT … ON CONFLICT (kunci unik) DO UPDATE SET qty_on_hand = qty_on_hand + EXCLUDED.qty_on_hand` (lock
   implisit baris), lalu `insertMovements` `{ type: OUTBOUND, refType: GOODS_ISSUE, refId, refCode: "{code} (shipment
   dibatalkan)" | "{code} (dibatalkan setelah submit shipping)", storageToId/Name: asal, qtyDelta: +qty }`.
4. GI `status = CANCELLED, cancelled_at, cancelled_by`; order `status = CANCELLED, cancelled_*, cancellation_reason,
   goods_issue_id = null, fulfillment_status = CANCELLED` (shipment id/waybill tetap).
5. TRANSFER → `cancelTransferPurchaseOrder` (ada di undo-shipping) — PO punya GR → `RestockImpossible('PO transfer sudah
   diterima')`.
6. Timeline (origin sesuai pemanggil, `source_event_id` bila dari event) + `outbound_request_data_history`
   (`STATUS_CANCELLED` — action baru — `changes { status: { from: SHIPPED, to: CANCELLED }, stock: { restoredLines, totalQty } }`).

`undo-shipping` memanggil service yang sama dengan `mode: 'RE_RESERVE'` (on_hand+qty & reserved+qty, GI → READY_TO_PICKUP) —
refactor tanpa perubahan perilaku; `STOCK_ROW_CHANGED` tetap untuk mode itu (ops interaktif boleh gagal keras), mode cancel
memakai upsert.

### C — Kota

```
GET   /v1/warehouses/cities                                → data: [{ id, name, provinceId }]   (proxy cache master core, untuk select FE)
GET   /v1/warehouses/outbound-orders/resolve-city          ?address=&latitude=&longitude=   → { city: { id, name } | null, source: "ADDRESS" | "GEOCODE" | null, warning?: string }
PATCH /v1/warehouses/outbound-orders/:id                   body.destination.cityID?: number | null   (opsional; null = kosongkan; tidak dikirim = resolver bila alamat/koordinat berubah)
POST  /v1/warehouses/outbound-orders                       body.destination.cityID? (sama)
POST  /v1/integration/outbound-orders                      (tanpa input kota dari klien) — entity: destination.cityID: number | null, destination.city: string | null (resolver dari alamat → koordinat; tampil juga di Link sandbox & docs API)
GET   /v1/warehouses/outbound-orders(+/export)             ?destinationCityID=<id>|none
POST  /internal/v1/warehouses/outbound-orders/backfill-city  ?limit=200&maxGeocode=200   → { scanned, matched, geocoded, unresolved }   (ADMIN | INTERNAL_SERVICE)
```

`OutboundOrderEntity` + `destinationCity: string | null`, `destinationCityID: number | null`. Peringatan di FE diturunkan
dari `destinationCityID = null` (detail: "Belum dikenali — pilih lewat Ubah"; daftar: ikon "Kota?"); `resolve-city`
yang membawa `warning` dipakai form saat mengetik. CSV kolom opsional `destination_city` (ditambahkan ke
`OUTBOUND_CSV_COLUMNS` dan `OUTBOUND_CSV_ORDER_COLUMNS`, template) — nama yang tidak cocok master disimpan kosong (tidak
ada warning dry-run khusus; ops melihatnya di daftar/filter "Belum dikenali").

`DestinationCityResolver` (domain service, pure matching + dua sumber lewat port `CityMasterPort`):

```
resolve({ address, latitude, longitude, hint? }) :
  master   = cityMaster.list()                                   // GET /v1/cities, cache 1 h; [] bila core gagal
  m1 = match(hint ?? AddressHelper.city(address), master)       // (a) teks
  if m1 → { city: m1, source: ADDRESS }
  geo = cityMaster.reverseGeocodeCity(latitude, longitude)      // (b) GET /v1/poi/map/place/address-by-geolocation → .city ; null bila gagal
  m2 = match(geo, master)
  if m2 → { city: m2, source: GEOCODE }
  → { city: null, source: null, warning: "Kota tidak ditemukan dari alamat/koordinat — pilih manual" }

match(candidate, master):
  norm(x) = lower(x) tanpa awalan "kota administrasi|kota adm.|kota|kabupaten|kab." , tanpa tanda baca, spasi tunggal
  typeOf(x) ∈ { KOTA, KABUPATEN, null } dari awalan sebelum dinormalisasi
  exact   = master.filter(m => norm(m.name) === norm(candidate))
  exact.length === 1 → it
  exact.length  >  1 → yang typeOf-nya sama dengan typeOf(candidate) bila tepat satu; selain itu null (ambigu)
  exact.length === 0 → partial = master.filter(m => norm(m.name).includes(norm(candidate)) || norm(candidate).includes(norm(m.name)))
                       partial.length === 1 → it ; selain itu null
```

### D — Jarak

```
(modul shipment) ShipmentDistanceHookRegistry.register(hook)        hook: { onMeasured(tx, rows: { shipmentId, distance, actor }[]): Promise<void>; afterCommit?(shipmentIds): Promise<void> }
(port warehouse) WarehouseFulfillmentPort.applyDistance(tx, updates: { shipmentID, distance, actor }[]): Promise<number>   // jumlah order diisi
POST /internal/v1/warehouses/outbound-orders/backfill-distance   ?limit=500   → { scanned, filled }   (modul adapter — satu-satunya yang boleh membaca shipments + wh_outbound_orders; ADMIN | INTERNAL_SERVICE)
```

`ShipmentDistanceService.fillMissing` memanggil `registry.onMeasured(tx, filledRows)` setelah `fillMissingDistances`
RETURNING (hanya baris yang benar-benar diisi), lalu `afterCommit` (no-op untuk WMS). `applyDistance` implementasi:
`filterOwned(shipmentIds)` → `UPDATE wh_outbound_orders SET distance = v.distance, updated_at = now() FROM (values) v WHERE
fulfillment_shipment_id = v.shipment_id AND distance IS NULL RETURNING id, distance` → satu `outbound_request_data_history`
per baris (`DISTANCE_MEASURED`, `DISPATCH`, `changed_by = actor` mis. "dispatch DSP…").

## Data model

Migration (drizzle-kit generate, `pnpm run db:generate`):

1. **`wh_outbound_orders`**: `destination_city text NULL`, `destination_city_id integer NULL`; index
   `wh_outbound_orders_destination_city_idx (hub_id, destination_city_id)`.
2. **`wh_goods_issues`**: tidak ada kolom baru; transisi `SHIPPED → CANCELLED` adalah aturan kode (`cancelled_at/by` sudah
   ada). `GoodsIssueStatus` tetap.
3. **`wh_stocks`**: tidak berubah; `upsertStockOnHand` memakai kunci unik yang ada (`storage_id, client_id, sku,
   batch_number` — atau `+ stock_type` setelah `feat/wms-stock-type` merge; implementasi membaca kunci dari schema, bukan
   hardcode).
4. **`outbound_request_data_history`**: nilai `action` baru `STATUS_CANCELLED` (enum TS `DataHistoryAction`; kolom text —
   tidak ada migration).
5. **`wh_stock_movements`**: tidak berubah (`type OUTBOUND`, `qty_delta` positif = pengembalian, konsisten dengan undo-ship).

ERD `docs/modules/erd/erd.mermaid`: `WH_OUTBOUND_ORDERS` + `destination_city`, `destination_city_id`; catatan pada
`distance` ("filled by dispatch via ShipmentDistanceHook when null"); catatan `WH_GOODS_ISSUES.status` "CANCELLED also from
SHIPPED (shipment cancelled → restock)". Diperbarui di perubahan ini.

Kompatibilitas: kolom kota nullable, backfill mengisi; order lama `FAILED` karena shipment cancel sebelum rilis **tidak**
di-restock otomatis (lihat Rollout 3 — skrip audit sekali jalan untuk ops).

## Cross-module impacts

| Modul | Dampak |
|---|---|
| `warehouse` | Export use case + csv service + repo `listExportRows`; `OutboundRestockService` (dipakai undo-ship, sync CANCELLED, cancel SHIPPED); `CancelShippedOutboundOrderUseCase` (dipanggil dari route cancel yang ada berdasarkan status); `DestinationCityResolver` + `CityMasterPort` + resolve-city/cities route + factory/normalize + Ubah + CSV parser/template + validator; `applyDistance` di port impl; dua use case backfill + controller internal; entity/DTO. |
| `shared` (`CoreService`) | `listCities()` + cache 1 jam; `reverseGeocodeCity(lat, long)` (`GET /v1/poi/map/place/address-by-geolocation`, best-effort, null bila gagal). |
| `shipment` | `ShipmentDistanceHookRegistry` (provider + export, cermin `ShipmentDestinationHookRegistry`); `ShipmentDistanceService.fillMissing` memanggil hook. Tidak ada perubahan kontrak. |
| `warehouse-shipment-adapter` | `WarehouseShipmentDistanceHook` + registrasi `onModuleInit`; `OutboundOrderFulfillmentSync` tidak berubah (port yang menangani). |
| `dispatch` | Tidak berubah (hook dipanggil di shipment). |
| Client API (`WarehouseIntegrationController`) | `destination.city` di DTO/entity; `distance` sudah ada di entity. |
| Webhook order (`wms-outbound-order-webhook-prd-trd-v1`) | Event `CANCELLED` dari jalur B membawa `reason.code = CANCELLED_BY_OPS` + message; `order.destination.city` ikut di snapshot. |
| FE ops (`react-logistic-web`) | Tombol Download CSV; Batalkan pada SHIPPED/AT_HUB; field Kota di Ubah (select dari `/v1/warehouses/cities`); filter Kota; kolom kota di daftar; KV Kota di detail; CSV modal: kolom opsional baru. |
| Link (`react-link-web`) | Tidak wajib; `destination.city` tampil di detail order bila ada. |
| core-service | **Tidak diubah** (dibaca `GET /v1/cities` dan `GET /v1/poi/map/place/address-by-geolocation`). |
| `dash-api-collections` | `Warehouse/Outbound Orders/Export.yml`, `Cancel (SHIPPED).yml`, `Backfill city.yml`, `Backfill distance.yml`, `Cities.yml`. |

## Failure modes & observability

- **Restock atomik** dengan status + timeline + ledger; `source_event_id` unik = idempotensi jalur event; use case Batalkan
  memakai `expectedUpdatedAt`? — tidak (cancel yang ada juga tidak); cukup lock baris order + GI.
- **Event tidak pernah nack karena restock**: `RestockImpossible` → jalur `FAILED` + timeline, ack. Kegagalan DB/infra
  tetap nack (retry backoff ada).
- **Log**: `wms.restock` (`orderId`, `giCode`, `origin`, `lines`, `totalQty`, `eventId?`), `wms.restock.impossible`
  (`reason`, `storageCode`), `wms.city.resolve` (level debug: `candidate`, `source`, `cityId`), `wms.city.master-miss`
  (warn, cache kosong & core gagal), `wms.distance.applied` (`shipmentId`, `orderId`, `distance`), `wms.export`
  (`filter`, `rows`, `ms`).
- **Alert**: `wms.restock.impossible` > 0 / hari (ops harus GR retur manual — kirim ke channel ops WMS); export > 10 s
  (p95) → pertimbangkan streaming.
- **Audit SQL** (dipakai success criteria): GI `CANCELLED` dengan `shipped_at IS NOT NULL` tanpa movement "(shipment
  dibatalkan)" = bug.

## Security & permissions

- Export, cancel, Ubah: ADMIN/INTERNAL_SERVICE seperti route outbound lain; hub dibatasi `useWarehouse().hubID` di FE dan
  `hubID` filter di BE (tidak ada perubahan model akses).
- Backfill: `INTERNAL_SERVICE` saja (`/internal/v1/...`, bearer internal) — dijalankan ops engineering lewat curl koleksi.
- Export mengandung data pribadi penerima (nama, telepon, alamat) — sama dengan tabel daftar yang sudah terlihat ops; tidak
  dilog isinya, hanya jumlah baris.
- `destinationCityID` filter: integer / `none`; `cityID` yang dikirim ops divalidasi ada di master.
- Stok hanya bisa kembali ke storage **hub order itu** (baris GI menyimpan storage hub sendiri) — tidak ada jalur memindahkan
  stok antar hub lewat cancel.

## Rollout

Rilis 1 (kota) — tiga PR dari `main`, DS tidak disentuh:

1. **PR BE** `feat/wms-outbound-city` (migration `0125_wms_outbound_city`: 2 kolom + index): deploy staging → jalankan
   `POST /internal/v1/warehouses/outbound-orders/backfill-city?limit=200&maxGeocode=200` berulang sampai `scanned = 0`
   (text pass gratis, geocode dibatasi) → cek daftar/detail/export (kolom `ID Kota Tujuan`, `Kota Tujuan`).
2. **PR FE** `feat/wms-outbound-city` setelah BE di staging: Kota (create otomatis + pilih, Ubah, filter "Kota tujuan"
   incl. "Belum dikenali", daftar, detail), **Kurir** (nama + telepon) di detail, kolom CSV import `destination_city`.
3. **PR Link** `feat/wms-outbound-city` (bisa bareng FE): kota di daftar & detail Outbound request, sandbox order detail,
   contoh/dokumentasi API (`destination.cityID` / `city`). Export Link otomatis ikut (header bersama).
4. **Produksi**: BE → backfill city → FE + Link. **Rollback**: FE/Link revert → kolom hilang; BE revert → kolom tinggal
   nullable (tanpa rollback migration).
5. Dokumen BE: `docs/api-integration/outbound-order.md` (field `destination.cityID` / `city` — sudah), `wms-v2-curl.md`
   (resolve-city, cities, backfill — menyusul).

Rilis berikutnya (ditunda): **B** (stok kembali saat cancel setelah ship), **D** (jarak dispatch → order), **E** (kota ke
shipment & delivery-service) — port dari `feat/wms-outbound-order-cr1` setelah rilis 1 masuk.

## Testing strategy

- **Unit (jest, `--maxWorkers=2`)**
  - `outbound-order-csv.ts`: header persis, format tanggal/angka/jarak/label, null → `''`, sanitasi formula pada alamat
    berawalan `=`.
  - `ExportOutboundOrdersUseCase`: rentang > 31 hari → 422; default 31 hari; filter diteruskan utuh.
  - `OutboundRestockService`: baris stok ada → on_hand naik, reserved tetap; baris dihapus → upsert; storage dihapus →
    `RestockImpossible`; ledger +qty per baris dengan refCode benar; mode `RE_RESERVE` = perilaku undo-ship lama (spec
    `undo-shipping.usecase.spec.ts` tetap hijau); `stock_type` dipertahankan (bila cabang merge).
  - `UpdateOutboundOrderFulfillmentUseCase`/`applyUpdates`: `CANCELLED` pada `SHIPPED` + GI `SHIPPED` → restock + order
    `CANCELLED` + timeline `source_event_id`; event dobel → tidak dobel; `RETURNED`/`FAILED` → tetap `FAILED` tanpa stok;
    `RestockImpossible` → `FAILED` + timeline, tidak throw; TRANSFER → PO tujuan cancel / impossible.
  - `CancelShippedOutboundOrderUseCase`: `checkCancel` bukan `CANCELLABLE` → 409 tanpa tulis; HANDOVER → 409; sukses →
    `gateway.cancel` dipanggil dalam tx, restock origin WMS, `afterCancel` setelah commit; event CANCELLED susulan diabaikan.
  - `DestinationCityResolver` (pure, tabel kasus): "Jl. X, Kota Bogor, Jawa Barat" → MASTER Kota Bogor; "…, Bogor, …" →
    TEXT "Bogor" (ambigu); "Kab. Bogor" → MASTER Kabupaten Bogor; "Jakarta Selatan" → MASTER "Kota Administrasi Jakarta
    Selatan" (partial unik); hint menang; tanpa kandidat → NONE; master kosong → TEXT.
  - `CoreService.listCities`: cache 1 jam, core gagal + cache ada → cache; core gagal + cache kosong → `[]` + warn.
  - `applyDistance`: hanya `distance IS NULL`; history per baris; shipment bukan milik WMS → 0.
  - `ShipmentDistanceService.fillMissing`: hook dipanggil hanya dengan baris yang terisi, di dalam tx.
- **Controller spec**: route `export` sebelum `:id`; `cancel` memilih use case per status; internal backfill hanya
  INTERNAL_SERVICE; `warehouse-architecture.spec.ts` hijau.
- **E2E lokal** (Playwright, tanpa agen, pola `wms-e2e-local-run`): (B) create → picking → ready → submit shipping →
  Shipments: cancel item HUB_SCANNED → tunggu event → order `CANCELLED`, stok bin asal kembali, export pergerakan stok
  memuat baris "(shipment dibatalkan)"; (B2) Batalkan dari detail order SHIPPED; (A) Download CSV dengan filter → file
  terbuka, header benar; (C) create dengan alamat "…, Kota Bogor, …" → detail Kota "Kota Bogor"; Ubah kota manual; CSV
  dengan `destination_city`; (D) preview dispatch → `distance` order terisi + history `DISTANCE_MEASURED`.
- **Staging**: backfill city/distance pada data Kemang (874 storage, 492 bin stok) — ukur durasi, periksa `unresolved`.

## Key decisions & deferred choices

1. **Cancel setelah ship = `CANCELLED` + stok kembali, bukan `FAILED` + GR manual.** Event `CANCELLED` hanya mungkin saat
   barang masih di hub (item `CREATED`/`HUB_SCANNED`), jadi secara fisik barang ada di rak — sistem harus setuju. `FAILED`
   dipertahankan untuk `RETURNED`/`FAILED` (barang pernah keluar; kondisi fisik tidak pasti → retur manual, sesuai keputusan
   "retur nanti dulu").
2. **Restock on-hand saja, tanpa reserve** — order berakhir `CANCELLED`, tidak ada yang perlu dipegang; berbeda dari
   undo-ship yang kembali ke `READY_TO_PICKUP`. Satu service dua mode supaya tidak ada dua implementasi pengembalian stok.
3. **Upsert, bukan `STOCK_ROW_CHANGED`, di jalur event.** Konsumen PubSub tidak boleh macet karena baris stok dihapus
   opname; identitas baris = kunci unik, jadi "berubah" hanya mungkin "dihapus" → buat ulang. Interaktif (undo-ship)
   tetap gagal keras seperti sekarang.
4. **Storage dihapus → `FAILED` + instruksi, bukan bin karantina otomatis.** Tidak ada konsep bin default per hub; menaruh
   stok di bin tebakan lebih berbahaya daripada minta ops GR retur (jalur yang sudah ada).
5. **Tombol Batalkan pada SHIPPED/AT_HUB** (bukan hanya lewat Shipments): sesuai prinsip "setiap aksi maju punya kebalikan
   selama belum end state"; implementasinya = undo-ship tanpa re-reserve + cancel, jadi murah dan konsisten.
6. **Kota hanya dari master core; teks dulu, reverse-geocode kedua, manusia terakhir.** Teks alamat gratis dan biasanya
   cukup; reverse-geocode (core → Google, `city` = admin level 2, sumber yang sama dengan nama master) dipakai hanya saat
   teks gagal/ambigu; kalau dua-duanya gagal, **jangan menebak** — kosong + peringatan, ops memilih dari daftar core
   (keputusan Yogi 2026-10-26: "kalau gak ada di core yaudah empty, kasih capability edit, kasih warning"). Nama kota
   yang tidak ada di master tidak pernah disimpan supaya filter/rekap konsisten.
7. **Snapshot nama + soft id** (`destination_city`, `destination_city_id`) — pola yang sama dengan `hub`/`client` snapshot;
   core bisa menonaktifkan kota tanpa merusak order lama.
8. **Jarak hanya mengisi yang null** — jarak yang diketik ops atau dihitung mode HAVERSINE/MAPS adalah keputusan sadar;
   dispatch tidak menimpanya. Sama dengan aturan `fillMissing` di shipment.
9. **Hook, bukan event PubSub, untuk jarak** — jarak bukan perubahan status; hook alamat sudah membuktikan polanya; satu
   transaksi, tidak ada outbox baru.
10. **Export per baris produk** (bukan per order) — rekap SKU/qty adalah pertanyaan utama; satu order ≤ 100 baris; ops
    pivot di spreadsheet. Rentang wajib ≤ 2 bulan (keputusan Yogi) menjaga file puluhan ribu baris maksimal.

Diserahkan ke implementer: nama file (`export-outbound-orders.usecase.ts`, `outbound-restock.service.ts`,
`cancel-shipped-outbound-order.usecase.ts`, `destination-city.resolver.ts`, `shipment-distance.hook.ts`,
`warehouse-shipment-distance.hook.ts`); bentuk select kota FE (reuse combobox DS); apakah `GET /v1/warehouses/cities`
perlu `search` (master ~500 baris — cukup filter di FE).

## E — Kota ikut ke shipment & delivery-service (tambahan 2026-10-29)

Permintaan Yogi: delivery-service (DS) punya kapabilitas menerima **kota** saat logistic men-dispatch (bulk create
delivery), kota-nya **opsional**; dan kota tampil di download outbound order (sudah: kolom "Kota Tujuan", § A).

**DS (`ts-delivery-service`, branch `feat/bulk-delivery-city`)** — `t_addresses` sudah punya `origin_city` /
`destination_city` (diisi dari reverse-geocode `addressesByCoordinate` saat bulk create). Perubahan: validasi
`POST /v1/deliveries/bulk` menerima `origin.city` dan `destination.city` (string opsional, trim, boleh null/kosong);
use case v2 memakai nilai kiriman **lebih dulu**, baru hasil geocode (`item.destination.city || geocode.city || null`).
Tanpa migrasi, kontrak lama tetap valid.

**Logistic (`nest-logistic-service`, branch `feat/wms-outbound-order-cr1`)** — kolom baru `shipments.destination_city`
(migration `0125_shipment_destination_city`, nullable):
- diisi saat **submit shipping** dari `wh_outbound_orders.destination_city` (nama master core), dan mengikuti **Ubah**
  WMS (kota berubah → shipment ikut, lewat `FulfillmentDestinationEntity.city` → `ShipmentDestinationService`,
  history `destination_city`); Ubah di menu Shipments tidak menyentuhnya (tidak ada resolver di sana);
- client API `POST /v1/integration/shipments` menerima `destination.city` (label bebas, ≤ 200 char) → disimpan;
  CSV import / H2H: null;
- **Dispatch bridge** (`commit-dispatch` → `POST /v1/deliveries/bulk`) mengirim `destination.city` hanya bila ada;
- `GET /v1/shipments/:id` & list memuat `destinationCity` (buat FE nanti);
- backfill shipment lama: `POST /internal/v1/warehouses/outbound-orders/backfill-shipment-city?limit=` (adapter).

Catatan: kota di shipment = **label** (bukan FK master) — DS hanya menyimpan teks; sumber kebenaran id master tetap
`wh_outbound_orders.destination_city_id`.

## Open questions

1. **`RETURNED`** (barang kembali ke hub setelah gagal kirim): tetap manual, atau otomatis masuk sebagai stok `RETURN`
   (cabang stock-type) ke bin asal? Usulan: tahap berikutnya setelah stock-type merge — butuh keputusan bin tujuan retur.
2. Order lama `FAILED` karena shipment cancel sebelum rilis — cukup daftar audit untuk ops (usulan), atau restock otomatis
   sekali jalan?
3. ~~Fallback reverse-geocode~~ — diputuskan: selalu dicoba lewat core setelah teks gagal (Req. 11).
4. Apakah kota perlu juga di **shipment** (`shipments.destination_city`) supaya dispatch/rekap shipment non-WMS ikut? Di luar
   scope WMS; kalau ya, resolver yang sama bisa dipakai di `create-shipment`.
5. Export: perlu juga **per order** (satu baris per order, tanpa SKU) sebagai mode kedua seperti modal export stok?
6. ~~Batas 31 hari~~ — diputuskan 2 bulan (62 hari).

## Changelog

- 2026-10-26 — created (permintaan Yogi: export outbound order; stok kembali saat cancel order/shipment; kota tujuan dari
  alamat + master core; jarak dispatch disinkron ke order, tampil di export & detail)
- 2026-10-26 — review Yogi: status cancel konsisten `CANCELLED`; kota hanya master core (teks → reverse-geocode core →
  kosong + peringatan, ops pilih dari daftar core di create/Ubah); export wajib rentang tanggal maks 2 bulan
- 2026-10-29 — § E: kota ikut ke `shipments.destination_city` (migration 0125) dan dikirim ke delivery-service
  `destination.city` (opsional) saat dispatch; DS `feat/bulk-delivery-city` menerima & memprioritaskannya
- 2026-10-26 — diimplementasikan: BE `feat/wms-outbound-order-cr1` (migration `0124_wms_outbound_order_cr1`), FE
  `feat/wms-outbound-order-cr1`; e2e `e2e/warehouse-outbound-cr1.e2e.spec.ts`. Resolver teks memindai semua segmen koma
  alamat (helper saja melewatkan "…, Jakarta Selatan"); marker Kota/Kab. dicocokkan sebagai kata utuh (master punya
  "Kab Pegunungan Bintang", "Kabanjahe").
- 2026-10-29 — **re-scope (Yogi): rilis 1 = C saja** (+ kurir nama/HP di detail, + kolom kota di export yang sudah ada di
  main #522, + Link). Branch baru dari `main`: BE/FE/Link `feat/wms-outbound-city` (migration `0125_wms_outbound_city`);
  e2e FE `e2e/warehouse-outbound-city.e2e.spec.ts`. Client API: `destination.cityID` / `city` di response (resolver juga
  jalan untuk order dari API). B, D, E ditunda — kode tetap di `feat/wms-outbound-order-cr1`; DS tidak disentuh.
- 2026-10-29 — Yogi: peringatan "kota belum dikenali" hanya di logistic web (Alert di atas detail + inline + daftar); Link tetap
  menampilkan kota tanpa peringatan. Header CSV outbound request diganti **bahasa Inggris, nama mengikuti kolom
  `wh_outbound_orders`** gaya export shipment (`Code`, `Client Name`, `Destination City ID`, `Destination City`, `Fulfillment
  Status`, `Created Date`, …); urutan & format sel tetap; kolom kota di set bersama (ops + Link).
