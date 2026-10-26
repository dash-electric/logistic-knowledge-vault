---
title: Warehouse Management v2 — Outbound, Supply & Inbound, integrasi Shipments (modular)
module: warehouse-management
doctype: prd-trd
version: 2
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:
engineer:
created: 2026-10-07
links:
  context: ./wms-context-v1.md
  previous: ./wms-prd-trd-v1.md
  mockup: ../../../prototype/Warehouse/Logistic-Mithril_Warehouse-WMS.html
  presentation:
  superseded-note: nest-logistic-service docs/warehouse/outbound-order-shipment-sync.md (catatan desain lama — "shipment lahir saat create" dan dependensi langsung WMS → modul shipment DIGANTI dokumen ini)
---

# Warehouse Management v2 — PRD/TRD v2

> v2 membawa WMS dari MVP gudang mandiri (v1: storage, stok, GR, GI, transfer, ledger) menjadi alur lengkap:
> **Outbound request (manual / upload CSV) → Picking → Shipping → AWB otomatis di Shipments → status pengiriman kembali ke WMS**,
> plus **Purchase order → Inbound request → Goods receipt**, dan **dokumen print** (picking list, surat jalan, goods receipt,
> purchase order). Syarat arsitektur: **module WMS modular** — kode WMS tidak mengimpor module lain; integrasi dengan Shipments
> lewat **panggilan interface** (bukan event). v1 tetap berlaku untuk bagian yang tidak diubah (storage tree, FEFO, invariant
> stok, ledger). Mockup klikabel: `prototype/Warehouse/Logistic-Mithril_Warehouse-WMS.html`.

---

# Part 1 — Product Requirements (PRD)

## Problem

1. **GI v1 putus dari pengiriman.** Setelah goods issue di-ship, ops harus membuat shipment lagi (CSV/manual). Double entry,
   AWB tidak terhubung ke stok yang keluar, dan tidak ada jejak dari order client sampai POD.
2. **Tidak ada header order.** v1 hanya punya GI dengan `reference` teks bebas. Data order (penerima, alamat, expected delivery,
   ref client) tidak punya tempat, tidak ada idempotency, dan tidak ada cara memasukkan banyak order sekaligus.
3. **Tidak ada rencana barang masuk.** GR v1 berdiri sendiri; tidak ada PO untuk dicocokkan.
4. **Tidak ada dokumen fisik.** Picker, kurir, dan penerima butuh kertas: picking list, surat jalan, bukti terima, PO ke supplier.
5. **Kopling.** Catatan desain sebelumnya membuat WMS mengimpor repository Shipments, Webhook, dan CoreService, sehingga WMS tidak
   bisa jalan, dites, atau dipisah tanpa module lain.

## Context

- Modul `warehouse` v1 ada di `nest-logistic-service` (main), gelap di balik `ENABLE_WAREHOUSE`, dan **sudah mandiri**
  (hanya mengimpor `@infrastructure/*` dan `@database/*`). v2 mempertahankan sifat itu.
- Alur & menu diadaptasi dari WMS eFishery, dengan perbedaan inti: **saat shipping di-submit, barang otomatis menjadi shipment
  di menu Shipments**.
- Fase 1 order masuk lewat **form manual** dan **upload CSV** oleh ops. **Client API** create outbound order adalah fase
  berikutnya, memakai **API key yang sama persis** dengan create shipment; kontraknya dikunci di dokumen ini.
- Import CSV mengikuti pola import Shipments/Addresses yang sudah ada (template dari BE → dry-run → commit, all-or-nothing).
- Print mengikuti pola web yang sudah ada (`EvidencePrintModal`, `LabelPreviewModal`): preview dulu, lalu Cetak / Download PDF,
  dibuat di FE dengan `@react-pdf/renderer` dan `qrcode` (sudah terpasang).

## Users & jobs

| Peran | Pekerjaan |
|---|---|
| Ops admin gudang | Memasukkan outbound request (form/CSV), membuat picking order, memantau shipping; membuat & confirm PO |
| Picker | Mencetak picking list, mengambil bin & lot sesuai daftar, mengisi qty picked, menandai Ready to pick up |
| Hub receiver | Menerima barang terhadap inbound request; mencetak bukti goods receipt |
| Kurir / ops logistic | Menerima surat jalan + AWB yang sudah At hub, lalu dispatch seperti biasa |
| Client (fase 2) | Mengirim order lewat API dengan key yang sama; melacak via webhook `shipment.*` yang sudah ada |

## Scope

### In scope

1. **Menu Warehouse** bertingkat (grup Warehouse ops): Dashboard → **Stock**; Warehouse management → **Storage**;
   Outbound management → **Outbound request**, **Goods issue** → **Picking** | **Shipping**; Supply management →
   **Purchase order**; Inbound management → **Inbound request** | **Goods receipt**.
2. **Outbound request (OO)** sebagai header order client, dengan tiga pintu masuk yang memakai validasi yang sama:
   **form manual** (fase 1), **upload CSV** (fase 1), **client API** (fase 2).
3. **Picking order** = goods issue: reserve FEFO all-or-nothing (single & bulk), assign picker, qty picked per baris,
   **Ready to pick up** menerbitkan nomor surat jalan.
4. **Shipping**: submit (single & bulk) memotong stok dan **membuat AWB di Shipments dalam transaksi yang sama** (DOCKING,
   origin hub, item sudah hub-scanned, shipment At hub). Status pengiriman kembali ke WMS lewat interface.
5. **Purchase order** (Draft → Confirmed / Cancelled), **Inbound request** (PO confirmed + progress), **Goods receipt** terhadap
   inbound request (split bin/expiry, foto surat jalan, tutup backorder).
6. **Stock** (ringkasan + tabel bin × lot + ledger) dan **Storage** (tree v1).
7. **Print**: picking list, surat jalan, goods receipt, purchase order (preview → Cetak / Download PDF).
8. Module adapter baru **`warehouse-shipment-adapter`** — satu-satunya tempat yang mengenal WMS dan Shipments sekaligus.

### Out of scope

- Status/aksi "sync gagal". Integrasi sinkron di transaksi yang sama: berhasil semua atau gagal semua dengan pesan error biasa.
- Shipping sebagian (partial ship) satu GI, dan short-pick (pick < reserve). Short-pick = cancel picking lalu buat ulang.
- Cancel setelah shipping di-submit; retur stok otomatis saat pengiriman gagal (ditangani lewat GR retur manual).
- Edit outbound request setelah picking order dibuat; edit/hapus order lewat CSV (CSV hanya membuat order baru).
- Geocoding alamat → koordinat (lat/long wajib diisi di form dan CSV).
- Transfer antar hub, stock opname, billing gudang, portal client, playground API, event webhook baru `outbound_order.*`.
- Print massal (banyak dokumen sekali cetak) dan cetak label koli — kandidat v3.
- Client API create outbound order — **fase 2** (kontrak di dokumen ini).

## Requirements

**Menu & data dasar**

1. Sidebar dan route mengikuti Scope #1; item list menampilkan badge jumlah dokumen yang menunggu aksi.
2. Semua endpoint WMS di balik `ENABLE_WAREHOUSE`; setiap dokumen mencatat aktor dan waktu tiap transisi.

**Outbound request — input**

3. **Form manual:** ops membuat OO untuk satu hub + client: ≥1 baris (SKU dari katalog client, qty > 0, SKU tidak dobel),
   penerima (nama, telepon HP Indonesia), tujuan (alamat, latitude, longitude dalam wilayah Indonesia, catatan opsional),
   expected delivery (tidak di masa lalu), service type (`SAME_DAY` | `NEXT_DAY`), catatan order opsional, ref client opsional.
   Form bisa diisi otomatis dari alamat tersimpan client. Qty yang melebihi stok available ditampilkan sebagai peringatan, tidak
   memblokir.
4. **Ref client / external ID** idempoten per `(client_id, external_id, is_sandbox)`: ref yang sudah ada mengembalikan OO lama
   (`EXISTS`), tidak membuat baru. Form manual boleh tanpa ref; external ID lalu diisi dengan kode OO.
5. **Upload CSV:** ops memilih hub + client, mengunduh template dari BE, mengunggah file `.csv` (maks 1.000 baris data, 2 MB).
   Satu baris = satu SKU; baris dengan `external_id` yang sama digabung menjadi satu order dan wajib punya data order yang sama
   (penerima, alamat, koordinat, tanggal, service, catatan).
6. **Preview CSV (dry-run)** menampilkan: jumlah baris, order baru, order yang sudah ada (dilewati), error per baris
   (`row`, `field`, `value`, `reason`), peringatan stok per SKU, dan kolom tak dikenal. Error bisa diunduh sebagai CSV.
7. **Commit CSV** memvalidasi ulang file yang sama; **all-or-nothing**: bila ada error, tidak ada order yang dibuat. Order yang
   `external_id`-nya sudah ada dilewati, bukan error. Setiap commit tercatat sebagai upload (`OOU…`) dengan nama file, jumlah
   dibuat/dilewati, dan aktor; setiap OO hasil CSV menyimpan upload asalnya.
8. List outbound request bisa difilter per sumber (Manual / CSV / Client API) dan dicari dengan kode upload.

**Picking & shipping**

9. Create picking order dari OO `OPEN` (single dan bulk ≤ 50) me-reserve FEFO dari bin `ACTIVE` di bawah lokasi `STORAGE`.
   Stok kurang → gagal utuh dengan shortfall per SKU. OO → `PREPARING`.
10. Picker di-assign per GI; qty picked per baris `0 ≤ qty_picked ≤ qty_reserved`; progres picking dihitung dari baris.
11. Ready to pick up mensyaratkan picker dan semua baris terpenuhi; menerbitkan surat jalan `SJ/{hubCode}/{yymm}/{seq4}` unik per
    hub per bulan. GI dan OO → `READY_TO_PICKUP`.
12. Delete picking (cancel GI) diperbolehkan selama belum di-ship: reserve dilepas, OO kembali `OPEN`.
13. Cancel OO diperbolehkan di `OPEN`, `PREPARING`, `READY_TO_PICKUP` dengan alasan wajib; reserve dilepas.
14. Submit shipping (single dan bulk ≤ 50, transaksi per item) pada GI `READY_TO_PICKUP` dalam **satu transaksi**: potong on hand
    & reserved, ledger `OUTBOUND`, GI → `SHIPPED`, OO → `SHIPPED`, **dan** shipment + item dibuat lewat `FulfillmentGateway`.
    Gagal di langkah mana pun = semua rollback dan respons error (tidak ada state setengah jadi).
15. Sesudah submit sukses, AWB langsung tampil di detail shipping WMS dan di menu Shipments (`AT_HUB`, item `HUB_SCANNED`).
16. Perubahan status shipment (dispatched, in delivery, completed, failed, returned, cancelled) tercermin di OO dan shipping pada
    transaksi yang sama dengan perubahan status shipment.
17. Bila adapter Shipments dimatikan (flag), WMS tetap berfungsi: submit shipping memotong stok tanpa membuat AWB, dan UI menulis
    "Integrasi Shipments nonaktif".

**Inbound**

18. PO dibuat `DRAFT` (client, hub, supplier, estimasi tiba, baris SKU + qty). Confirm → muncul di Inbound request
    (`SCHEDULED`). Cancel hanya `DRAFT`, atau `CONFIRMED` yang belum punya goods receipt.
19. Goods receipt terhadap inbound request: satu submit langsung posted; split bin/expiry; total per SKU ≤ sisa PO; bin harus BIN
    `ACTIVE` di hub PO; lot terbit; ledger `INBOUND`; status penerimaan → `PARTIAL_RECEIPT` / `FINISHED`; "tutup sisa PO" → `FINISHED`.

**Stock, storage, print, fase 2**

20. Stock: ringkasan per hub (SKU, bin terisi, on hand, reserved, available), tabel bin × lot dengan expiry, dan ledger.
21. Storage mengikuti v1, ditambah kode hub pada snapshot.
22. **Print** dengan preview sebelum cetak, ukuran A4, tombol Cetak dan Download PDF:
    - **Picking list** (GI, semua status): baris diurutkan per bin; bin + path, SKU, lot, expiry, qty ambil, kolom qty diambil
      dan centang; tanda tangan picker & checker; QR kode GI.
    - **Surat jalan** (GI `READY_TO_PICKUP` ke atas): nomor SJ + QR, pengirim (client d/a hub), penerima, ref (OO, ref client,
      GI, AWB bila sudah ada), baris barang (qty, UoM, koli, berat) + total; tanda tangan gudang, kurir, penerima.
    - **Goods receipt** (GR posted): PO, supplier, SJ supplier, baris (qty, expiry, bin, lot); tanda tangan penerima & pengantar.
    - **Purchase order** (bukan cancelled): client, supplier, hub tujuan + alamat, estimasi tiba, baris; tanda tangan.
23. **Fase 2:** `POST /v1/integration/outbound-orders` menerima `x-api-key` yang sama dengan create shipment; client dari key;
    hasilnya OO `OPEN` dengan validasi Req 3–4.

## Edge cases & failure states

| Kasus | Perilaku |
|---|---|
| Form manual tidak lengkap/salah | Semua kesalahan ditampilkan sekaligus di atas form (bukan satu per satu); tidak ada yang tersimpan |
| Ref client sudah ada (form/CSV/API) | Form & API: kembalikan OO lama (`EXISTS`). CSV: order itu dilewati, dihitung "sudah ada" |
| CSV tanpa kolom wajib / kosong / > 1.000 baris / bukan .csv | Ditolak di level file sebelum preview (`422 CSV_INVALID_FILE`) |
| CSV: baris `external_id` sama tapi data order beda | Error pada baris yang beda (satu error per baris, field yang beda disebut) |
| CSV: SKU tak dikenal, qty ≤ 0, telepon/koordinat/tanggal salah | Error per baris; commit diblokir (all-or-nothing) |
| CSV: qty melebihi stok available | Peringatan saja; order tetap dibuat `OPEN`, picking gagal sampai ada GR |
| File berubah antara preview dan commit | Commit memvalidasi ulang file yang dikirim; yang dibuat selalu hasil validasi saat commit |
| Dua commit CSV yang sama bersamaan | Unique `(client_id, external_id, is_sandbox)` → yang kedua melewati order yang sudah ada |
| Stok kurang saat create picking | `422 INSUFFICIENT_STOCK` + `[{sku, requested, available, shortfall}]`; tidak ada reserve |
| Dua picking rebutan lot yang sama | `SELECT … FOR UPDATE` pada `wh_stocks`; yang kalah mendapat 422 dengan available terkini |
| Ready to pick up saat pick belum lengkap | `422 PICKING_INCOMPLETE` atau `422 PICKER_REQUIRED` |
| Submit shipping gagal membuat shipment (validasi Shipments, DB) | Seluruh transaksi rollback: stok tidak terpotong, GI tetap `READY_TO_PICKUP`, respons error dengan pesan dari Shipments |
| Core-service (alamat hub, kode provider) tidak bisa dihubungi | Submit shipping gagal sebelum transaksi dibuka (`503 FULFILLMENT_UNAVAILABLE`); ops coba lagi |
| Submit shipping ganda | Panggilan kedua `409 INVALID_STATUS_TRANSITION` dengan state terkini; shipment tidak dobel |
| Shipment cancelled/failed/returned setelah ship | OO → `FAILED` + timeline; barang fisik ditangani lewat GR retur ke karantina (manual) |
| Update status WMS gagal saat Shipments berubah status | Perubahan status shipment ikut gagal (satu transaksi). Mitigasi: flag adapter bisa dimatikan seketika |
| GR melebihi sisa PO / bin salah | `422 OVER_RECEIPT` / `409 STORAGE_INACTIVE` / `422 STORAGE_NOT_BIN` / `422 BIN_NOT_IN_HUB` |
| Cancel PO yang sudah punya GR | `409 PO_HAS_RECEIPTS` |
| Print surat jalan sebelum Ready to pick up | Tombol tidak tersedia (nomor SJ belum ada) |
| Lot kedaluwarsa | Tetap ikut FEFO (keputusan v1), ditandai di UI dan picking list |

## Success criteria

- Pilot satu hub × satu client selama satu bulan: **100%** OO yang di-ship punya AWB tanpa input manual di Shipments.
- ≥ 80% order pilot masuk lewat upload CSV tanpa bantuan engineer; tidak ada order dobel dari upload ulang file yang sama.
- Nol shipment yatim (shipment WMS tanpa GI) dan nol GI `SHIPPED` tanpa shipment selama adapter aktif.
- Integritas stok v1 tetap: `on_hand ≥ reserved ≥ 0` dan jumlah ledger = on hand per baris stok.
- Test arsitektur lulus: kode `src/modules/warehouse/**` tidak mengimpor module fitur lain.

---

# Part 2 — Technical Requirements (TRD)

## Summary

WMS tetap satu module NestJS mandiri (`src/modules/warehouse`) dengan tabel `wh_*` miliknya. v2 menambah Outbound Order (form,
CSV dry-run/commit, upload log), Purchase Order, nomor surat jalan, dan progres picking. Integrasi ke Shipments memakai
**ports & adapters**: WMS mendefinisikan port keluar `FulfillmentGateway` dan port masuk `WarehouseFulfillmentPort`; module
Shipments mendapat satu titik ekstensi generik `ShipmentStatusHook` di funnel perubahan statusnya. Module baru
`warehouse-shipment-adapter` mengimplementasikan keduanya dan mendaftarkannya ke registry saat boot. Semua panggilan sinkron di
transaksi yang sama, sehingga tidak ada event, outbox, retry, atau state "sync gagal". Dokumen print dibuat di FE.

## Architecture

### Prinsip modular (aturan keras)

| Boleh diimpor oleh `src/modules/warehouse/**` | Dilarang |
|---|---|
| `@infrastructure/*` (base, guards termasuk `ApiKeyGuard`, helpers termasuk `CsvHelper`/`MultipartHelper`, config, logger) | `@shipment/*`, `@webhook/*`, `@dispatch/*`, `@inbound/*`, `@api-integration/*`, `@delivery/*`, `@batch/*`, `@route/*`, module fitur lain |
| `@database/*` (schema & enum) | `CoreService` atau service lain yang memanggil master eksternal |
| | Import use case / repository module lain |

- **Port milik WMS** (abstract class di `domain/`): `FulfillmentGateway` (apa yang WMS butuh dari pengirim) dan
  `WarehouseFulfillmentPort` (cara pihak luar melaporkan status pengiriman ke WMS).
- **Titik ekstensi milik Shipments** (generik, tidak menyebut WMS): `ShipmentStatusHook` + `ShipmentStatusHookRegistry`. Dipanggil
  di `recordStatusChange` — funnel tunggal yang sudah menulis status history, timeline, dan outbox webhook.
- **Registry, bukan import silang.** WMS mengekspor `FulfillmentGatewayRegistry`; Shipments mengekspor
  `ShipmentStatusHookRegistry`. Adapter mengimpor kedua module dan mendaftarkan implementasinya di `onModuleInit`. Tidak ada
  module inti yang mengimpor adapter, sehingga tidak ada siklus module dan WMS bisa jalan tanpa adapter.
- **Hub & client** tetap snapshot (pola v1): FE mengirim `hubName`/`hubCode`/`clientName`. Untuk fase 2 (API), snapshot diambil dari
  data WMS sendiri (`wh_storages.hub`, `wh_skus.client`).
- **Penegakan:** spec arsitektur yang memindai import (`warehouse` tidak boleh impor module fitur lain; `shipment` tidak boleh
  impor `@warehouse/*`) + `no-restricted-imports` ESLint.
- **Ekstraksi nanti:** bila WMS dipisah jadi service sendiri, cukup ganti implementasi port dengan adapter HTTP; kode WMS tetap.

### Komponen

```
┌───────────────────────────────── nest-logistic-service ─────────────────────────────────┐
│                                                                                          │
│  WarehouseModule (src/modules/warehouse) — tidak mengimpor module fitur lain             │
│    HTTP ops /v1/warehouse/* · HTTP client /v1/integration/outbound-orders (fase 2)       │
│    port keluar  FulfillmentGateway ◀── FulfillmentGatewayRegistry (export)               │
│    port masuk   WarehouseFulfillmentPort (export, diimplementasi use case WMS)            │
│                         ▲  register()                     ▲ applyUpdates(tx, …)          │
│                         │                                 │                               │
│  WarehouseShipmentAdapterModule (src/modules/warehouse-shipment-adapter)  ── baru        │
│    DashShipmentFulfillmentGateway implements FulfillmentGateway                          │
│       └ ShipmentRepository / ItemRepository (export ShipmentModule), webhook created     │
│       └ CoreService (alamat hub, kode provider)                                          │
│    WarehouseShipmentStatusHook implements ShipmentStatusHook ──▶ WarehouseFulfillmentPort│
│                         │  register()                                                    │
│                         ▼                                                                │
│  ShipmentModule — + ShipmentStatusHookRegistry (export); recordStatusChange memanggil hook│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Port & kontrak (domain WMS)

```ts
// src/modules/warehouse/domain/repositories/fulfillment.gateway.ts
export abstract class FulfillmentGateway {
  /** Di luar transaksi: lookup eksternal (alamat hub, kode provider), validasi, hitung waybill. */
  abstract prepare(input: FulfillmentShipmentRequestEntity): Promise<FulfillmentShipmentPlanEntity>;
  /** Di dalam transaksi WMS: tulis shipment + item (+ webhook created ke outbox). */
  abstract commit(tx: DBTransaction, plan: FulfillmentShipmentPlanEntity): Promise<FulfillmentShipmentResponseEntity>;
  /** Setelah commit, fire-and-forget: fast path pengiriman webhook. */
  abstract afterCommit(result: FulfillmentShipmentResponseEntity): void;
}

// src/modules/warehouse/domain/repositories/warehouse-fulfillment.port.ts
export abstract class WarehouseFulfillmentPort {
  /** Dipanggil di transaksi pemilik perubahan status; mengabaikan shipment yang bukan milik WMS. */
  abstract applyUpdates(tx: DBTransaction, updates: FulfillmentUpdateRequestEntity[]): Promise<number>;
}
```

- `FulfillmentShipmentRequestEntity`: `outboundOrder {id, code, externalID, isSandbox, serviceType, notes}`,
  `goodsIssue {id, code, suratJalanNo}`, `client {id, name}`, `hub {id, name, code}`, `recipient {name, phone}`,
  `destination {address, latitude, longitude, notes}`, `lines[{sku, itemName, uomName, qty, weightKg}]`, `actor`.
- `FulfillmentShipmentResponseEntity`: `{provider: 'DASH_LOGISTIC', shipmentID, waybill, status: 'AT_HUB'}`.
- `FulfillmentUpdateRequestEntity`: `{shipmentID, waybill, status: DISPATCHED|IN_DELIVERY|DELIVERED|FAILED|RETURNED|CANCELLED,
  occurredAt, actor, riderCode?, reason?}`.

Titik ekstensi Shipments (generik):

```ts
// src/modules/shipment/domain/services/shipment-status-hook.ts
export abstract class ShipmentStatusHook {
  abstract onStatusChanged(tx: DBTransaction, changes: ShipmentStatusChangeEntity[]): Promise<void>;
}
// ShipmentStatusHookRegistry: register(hook), notify(tx, changes) — dipanggil di akhir recordStatusChange
```

### Alur submit shipping → AWB (satu transaksi)

1. `ShipGoodsIssueUseCase` membaca GI + OO (luar transaksi), validasi status `READY_TO_PICKUP`.
2. Bila gateway terdaftar: `gateway.prepare(req)` — adapter memanggil CoreService (pitstop hub → alamat & koordinat origin;
   provider → kode untuk prefix waybill) dan menghitung item (1 per baris OO; koli = qty untuk UoM diskrit, 1 untuk `kg`/`liter`;
   berat = qty × `weight_kg`). Gagal → `503 FULFILLMENT_UNAVAILABLE`, belum ada yang ditulis.
3. Transaksi: lock GI + `wh_stocks` `FOR UPDATE` → potong on hand & reserved → ledger `OUTBOUND` → `gateway.commit(tx, plan)`:
   `ShipmentRepository.upsert` (DOCKING, `needs_pickup = false`, `hub_id`, origin = hub, catatan tujuan, `booking_id` =
   external ID, `is_sandbox`; booking yang sudah dipakai channel lain → `409 FULFILLMENT_DUPLICATE_BOOKING`) →
   `ItemRepository.bulkCreate` → enqueue webhook `shipment.created` → `ItemRepository.bulkMarkHubScanned` (jalur yang sama
   dengan import CLIENT_PITSTOP) → GI `SHIPPED` → OO `SHIPPED`, `fulfillment_shipment_id`, `fulfillment_waybill`,
   `fulfillment_status = AT_HUB` → timeline OO. Commit.
4. Setelah commit: `gateway.afterCommit(result)` → `webhookTasksService.enqueueDeliver`, lalu rollup status shipment ke
   `AT_HUB` lewat `reconcileStatus` (menulis history, timeline, webhook `arrived_at_hub`). `reconcileStatus` membuka
   transaksinya sendiri dan hanya melihat data yang sudah commit, jadi rollup tidak bisa ikut transaksi WMS. Sesaat shipment
   masih `CREATED` dengan item sudah `HUB_SCANNED`; bila rollup terlewat, reconcile berikutnya (commit dispatch) memperbaikinya.
   Opsi lanjutan: varian `reconcileStatus` yang menerima `tx`.
5. Bila gateway **tidak** terdaftar (flag adapter mati): langkah 2 dan `commit` dilewati; OO `SHIPPED` dengan
   `fulfillment_status = null`; UI menulis "Integrasi Shipments nonaktif".

Catatan: hook status (di bawah) ikut terpanggil saat rollup `AT_HUB` di langkah 4; port WMS mengenali status itu sebagai
`AT_HUB` yang sudah tercatat dan tidak menulis ulang.

Akibat operasional (terlihat di e2e lokal): shipment hasil WMS lahir `AT_HUB`, jadi `POST /v1/shipments/:id/cancel` (hanya untuk
`CREATED`) menolaknya. Penutupan manual oleh ops memakai `force-terminal` (`COMPLETE` / `FAIL` + reason `OPS_OVERRIDE`), dan
hook tetap membawa statusnya ke OO. `items.item_name` diisi SKU (unik per shipment); nama barang, qty, dan UoM ada di
`items.description`.

### Alur status balik (satu transaksi dengan Shipments)

- Setiap perubahan status shipment lewat `recordStatusChange` → `ShipmentStatusHookRegistry.notify(tx, changes)`.
- `WarehouseShipmentStatusHook` memetakan status lalu memanggil `WarehouseFulfillmentPort.applyUpdates(tx, updates)`; WMS mencari OO
  lewat index `fulfillment_shipment_id` (satu query untuk semua perubahan di batch itu), mengabaikan shipment yang bukan miliknya.

| Status shipment | Fulfillment status | Status OO | Timeline OO |
|---|---|---|---|
| `AT_HUB` | `AT_HUB` | `SHIPPED` | "AWB terhubung" (dari langkah ship) |
| `DISPATCHED` | `DISPATCHED` | `SHIPPED` | "Dispatch committed · rider" |
| `IN_DELIVERY` | `IN_DELIVERY` | `IN_DELIVERY` | "Out for delivery" |
| `COMPLETED` | `DELIVERED` | `DELIVERED` | "Delivered (POD)" |
| `FAILED` / `RETURNED` / `CANCELLED` | sama | `FAILED` | alasan dari shipment |
| `IN_DISPUTE` | diabaikan | tetap | — |

- **Kebijakan gagal:** error dari port WMS ikut menggagalkan transaksi Shipments (konsisten, tidak perlu rekonsiliasi). Port WMS
  hanya satu `UPDATE` + satu `INSERT` timeline per OO dan dites ketat; flag `ENABLE_WAREHOUSE_SHIPMENT_ADAPTER` mematikan
  registrasi hook bila ada masalah di production.

### State machine

**Outbound order** (proyeksi dari GI + fulfillment):

```
OPEN ──create picking──▶ PREPARING ──ready to pick up──▶ READY_TO_PICKUP ──submit shipping──▶ SHIPPED
  ▲                          │                                                                │
  └──── delete picking ──────┘                                                   status hook  ▼
OPEN | PREPARING | READY_TO_PICKUP ──cancel──▶ CANCELLED                 IN_DELIVERY ──▶ DELIVERED
                                                                               └──────────▶ FAILED
```

**Goods issue:** `RESERVED → PICKED → READY_TO_PICKUP → SHIPPED`, `CANCELLED` dari tiga status pertama. `PICKED` diset otomatis
saat semua baris `qty_picked = qty_reserved` dan kembali `RESERVED` bila qty diturunkan. Label UI picking (Not picked / Partially
picked / All picked) diturunkan dari baris; label UI shipping mengikuti status OO setelah `SHIPPED`. GI v1 tanpa OO tetap boleh
`PICKED → SHIPPED` lewat endpoint v1 (tanpa AWB); GI yang terikat OO wajib lewat `READY_TO_PICKUP`.

**Purchase order:** `status` `DRAFT → CONFIRMED`, `DRAFT | CONFIRMED (tanpa GR) → CANCELLED`; `receipt_status`
`SCHEDULED → PARTIAL_RECEIPT → FINISHED`. Inbound request = PO `CONFIRMED`.

### Validasi outbound order (satu sumber untuk form, CSV, API)

`OutboundOrderValidator` (domain service WMS) dipakai oleh create manual, dry-run/commit CSV, dan endpoint client fase 2:

| Field | Aturan |
|---|---|
| hub | ada storage tree di hub tsb (`HUB_NOT_ENABLED`) |
| client | wajib; SKU dicek ke katalog client |
| external ID | opsional untuk manual (default kode OO), wajib untuk CSV & API; maks 64 karakter |
| recipient name | wajib, maks 120 |
| recipient phone | HP Indonesia: `^(\+62\|62\|0)8[0-9]{7,12}$` setelah spasi/strip dibuang; disimpan ternormalisasi |
| destination address | wajib, maks 500 |
| latitude / longitude | angka; lat −11,5 s/d 6,5; long 94,5 s/d 141,5 |
| expected delivery date | `YYYY-MM-DD`, ≥ hari ini (zona Asia/Jakarta) |
| service type | `SAME_DAY` (default) \| `NEXT_DAY` |
| lines | ≥ 1, SKU ada di katalog (`SKU_NOT_IN_CATALOG`), SKU unik per order, qty > 0 (maks 2 desimal) |
| stok | **peringatan** bila total qty per SKU > available hub (tidak memblokir) |

### CSV

- Template dari BE (`GET …/import/template`) supaya kolom tidak menyimpang dari parser. Kolom: `external_id, recipient_name,
  recipient_phone, destination_address, latitude, longitude, destination_notes, expected_delivery_date, service_type, sku, qty,
  notes`. Wajib: semua kecuali `destination_notes`, `service_type`, `notes`. Header tidak case-sensitive; kolom tak dikenal
  diabaikan dan dilaporkan; BOM UTF-8 diterima.
- Parsing lewat `CsvHelper` dan upload lewat `MultipartHelper.readCsvUpload` (sama dengan import Shipments).
- Dry-run stateless: tidak menyimpan apa pun. Commit menerima file yang sama, mengulang validasi, lalu dalam satu transaksi
  menulis `wh_outbound_order_uploads` + semua OO baru. Ada error → `422 CSV_HAS_ERRORS` dengan daftar error, tidak ada yang ditulis.

### Print (FE)

- Komponen PDF per dokumen di `src/pages/warehouse/print/` (`PickingListPdf`, `DeliveryNotePdf`, `GoodsReceiptPdf`,
  `PurchaseOrderPdf`) dengan `@react-pdf/renderer`; QR dari paket `qrcode` (isi: kode dokumen). Satu `WarehousePrintModal`:
  preview → **Cetak** (blob ke iframe tersembunyi) / **Download PDF** — pola sama dengan `EvidencePrintModal`.
- Data print diambil dari endpoint detail yang ada (tidak ada endpoint print khusus, tidak ada PDF di BE). Field yang dibutuhkan
  print sudah tercakup di respons detail (lihat API contracts).

### Frontend (react-logistic-web)

- **Feature folder mandiri** `src/pages/warehouse/`: `routes.tsx`, `api/warehouse.api.ts` (klien bertipe untuk `/v1/warehouse/*`,
  menggantikan `src/services/api/warehouse.ts`), `types.ts`, `pages/<menu>/`, `components/` (termasuk
  `OutboundRequestFormModal`, `OutboundCsvImportModal`), `print/`.
- **Larangan import:** tidak mengimpor `src/pages/shipments/**` atau fitur lain. Boleh: wrapper `src/components/*`,
  `@/design-system/*` per file, instance HTTP bersama, konteks auth. Ke Shipments hanya lewat URL.
- **Sidebar:** `NAV_GROUPS` di `src/components/layout/Sidebar.tsx` mendukung anak bertingkat (tiga level) di layer app;
  `src/design-system/` tidak diedit langsung. Setiap node Warehouse (child dan grandchild) punya ikon.
- **Form bertahap (stepper):** form dengan banyak isian memakai `StepIndicator` + footer Batal/Kembali/Lanjut
  (`components/wizard.tsx`). *Create outbound request*: Order → Penerima & tujuan → Produk → Review. *Create PO*: Info PO →
  Barang → Review. *New goods receipt*: Inbound request → Put-away → Penerimaan → Review. Lanjut hanya menjaga isian wajib
  langkah itu; validasi tetap di server, dan 422 mengembalikan user ke langkah paling awal yang punya error (ringkasan error
  menandai langkah asalnya). Form SKU dan Storage tetap satu layar (isiannya sedikit).
- **SKU di tempat (PO):** di langkah Barang, opsi *+ SKU baru…* pada select SKU baris (atau tombol *SKU baru*) membuka panel
  inline berisi field master SKU lengkap (SKU, nama, UoM, dimensi, berat) dan memanggil `POST /skus` untuk client PO. SKU
  langsung masuk katalog — tetap ada walau PO batal disimpan — lalu otomatis terpilih di baris. Outbound request tidak punya
  opsi ini (SKU baru belum punya stok).
- **Route:** `/warehouse/stock`, `/warehouse/storage`, `/warehouse/outbound-request[/:id]`, `/warehouse/picking[/:id]`,
  `/warehouse/shipping[/:id]`, `/warehouse/purchase-order[/:id]`, `/warehouse/inbound-request[/:id]`, `/warehouse/goods-receipt`,
  `/warehouse/goods-receipt/new?po=`, `/warehouse/goods-receipt/:id`. `/warehouse` lama → redirect ke `/warehouse/stock`.
- **Modal CSV** mengikuti `src/pages/addresses/components/ImportModal.tsx`: pilih hub + client, dropzone, Download template,
  preview (kartu ringkasan, tabel error + Download error CSV, peringatan stok, daftar order), Import.

## API contracts

Envelope `{status, message, data}`, pagination konvensi repo. Ops: `@UseGuards(AuthGuard, WarehouseEnabledGuard)`,
`@AuthTypes(ADMIN, INTERNAL_SERVICE)`. Endpoint baru/berubah wajib masuk `dash-api-collections`
(`Logistic Service/Internal/Warehouse/`) dengan contoh sukses dan gagal.

### Ops — `/v1/warehouse`

```
# Stock & storage (v1 + tambahan)
GET    /stocks?hubID=&storageID=&clientID=&sku=&lotNumber=          v1
GET    /stocks/summary?hubID=                                        {skuCount, binsInUse, qtyOnHand, qtyReserved, qtyAvailable}
GET    /movements?hubID=&type=&clientID=&sku=&refCode=&dateFrom=&dateTo=
POST   /storages            + hubCode?          GET /storages?hubID=&category=&type=&status=
POST   /skus                + weightKg?         GET /skus?clientID=&search=     POST /skus/import

# Outbound request — input
POST   /outbound-orders                                              form manual (source MANUAL)
GET    /outbound-orders/import/template?clientID=                    text/csv (contoh baris memakai SKU client)
POST   /outbound-orders/import:dry-run                               multipart: file, hubID, clientID → preview
POST   /outbound-orders/import:commit                                multipart: file, hubID, clientID → upload + order dibuat
GET    /outbound-orders/imports?hubID=&clientID=&page=&limit=        riwayat upload (OOU…)

# Outbound request — list & aksi
GET    /outbound-orders?hubID=&clientID=&status=&source=&uploadID=&search=&page=&limit=
GET    /outbound-orders/summary?hubID=&source=                       jumlah per status (badge tab)
GET    /outbound-orders/:id                                          header + lines (qtyReserved/qtyPicked) + goodsIssue + fulfillment + upload + events
POST   /outbound-orders/:id/cancel                                   {reason}
POST   /outbound-orders/:id/picking-order                            create GI + reserve FEFO
POST   /outbound-orders/picking-orders/bulk                          {outboundOrderIDs[≤50]} → per item {outboundOrderID, ok, goodsIssueID?, error?}

# Goods issue — picking & shipping
GET    /goods-issues?hubID=&stage=PICKING|SHIPPING&status=&search=&page=&limit=
       status PICKING: NOT_PICKED|PARTIALLY_PICKED|ALL_PICKED; SHIPPING: READY_TO_PICKUP|SHIPPED|IN_DELIVERY|DELIVERED|FAILED
GET    /goods-issues/summary?hubID=&stage=                           {total, byStatus:[{key, count}]} untuk badge tab
GET    /goods-issues/:id                                             + lines (bin, path, lot, expiry, qtyReserved, qtyPicked) + outboundOrder (penerima, tujuan, notes) + fulfillment
PATCH  /goods-issues/:id/picker                                      {pickerName, expectedUpdatedAt?}
PUT    /goods-issues/:id/lines                                       {lines:[{sku, stockID, qty}], expectedUpdatedAt?} ganti seluruh daftar reservasi; menyimpan = Picked
PATCH  /goods-issues/:id/lines/:lineId                               {qtyPicked}
POST   /goods-issues/:id/pick-all
POST   /goods-issues/:id/ready-to-pickup                             {pickerName?, expectedUpdatedAt?} menerbitkan suratJalanNo
       expectedUpdatedAt = goodsIssue.updatedAt yang dimuat (token versi header, bergerak di tiap mutasi); tertinggal → 409 GOODS_ISSUE_STALE,
       dicek setelah baris GI dikunci, tidak ada yang ditulis. Dipakai bulk edit picking (modal satu-per-satu, satu request per GI).
POST   /goods-issues/:id/cancel                                      v1; v2: OO kembali OPEN
POST   /goods-issues/:id/ship                                        v1 endpoint; v2: wajib READY_TO_PICKUP bila terikat OO; membuat AWB
POST   /goods-issues/ship/bulk                                       {goodsIssueIDs[≤50]} → per item {goodsIssueID, ok, waybill?, error?}

# Purchase order, inbound request, goods receipt
GET    /purchase-orders?hubID=&clientID=&status=&search=&page=&limit=      GET /purchase-orders/:id
POST   /purchase-orders            POST /purchase-orders/:id/confirm      POST /purchase-orders/:id/cancel {reason}
GET    /inbound-requests?hubID=&receiptStatus=&search=&page=&limit=        GET /inbound-requests/:id
POST   /inbound-requests/:id/goods-receipts                          create + post sekaligus
GET    /goods-receipts?hubID=&search=&page=&limit=                   GET /goods-receipts/:id
POST   /goods-receipts            POST /goods-receipts/:id/post      v1 (GR tanpa PO — retur/kompensasi), tanpa UI di v2
```

Create manual:

```json
POST /v1/warehouse/outbound-orders
{
  "hubID": 3, "hubName": "Hub Bandung", "hubCode": "BDG",
  "clientID": 12, "clientName": "FORE",
  "externalID": "FORE-SO-88190",
  "serviceType": "SAME_DAY",
  "expectedDeliveryDate": "2026-10-09",
  "recipient":   { "name": "Fore Coffee Braga", "phone": "+6281211100021" },
  "destination": { "address": "Jl. Braga No. 10, Bandung", "latitude": -6.9175, "longitude": 107.6095, "notes": "lantai 2" },
  "lines": [ { "sku": "FORE-CUP-12OZ", "qty": 20 }, { "sku": "FORE-LID-12OZ", "qty": 20 } ],
  "notes": "kirim sebelum jam 10"
}
201 { "status": "Success", "message": "Outbound order created", "data": {
      "result": "CREATED",                       // "EXISTS" bila external ID sudah ada → order lama, tidak membuat baru
      "order": { "id": "…", "code": "OO261007OQYOK", "externalID": "FORE-SO-88190", "source": "MANUAL", "status": "OPEN",
                 "hub": {…}, "client": {…}, "lineCount": 2, "totalQty": 40, "goodsIssue": null,
                 "fulfillment": { "status": null, "shipmentID": null, "waybill": null }, … },
      "stockWarnings": [ { "sku": "FORE-CUP-12OZ", "requested": 20, "available": 12 } ] } }
422 { "status": "Failed", "error": "3 isian perlu diperbaiki", "code": "VALIDATION",
      "errors": [ { "field": "recipient.phone", "message": "Telepon harus nomor HP Indonesia", "lineIndex": null },
                  { "field": "lines[0].sku", "message": "SKU tidak ada di katalog FORE", "lineIndex": 0 }, … ] }
```

Dry-run CSV:

```json
POST /v1/warehouse/outbound-orders/import:dry-run      (multipart: file, hubID, clientID)
200 { "data": {
  "summary": { "rows": 8, "orders": 5, "toCreate": 1, "existing": 1, "errors": 6, "warnings": 0 },
  "ignoredColumns": [],
  "orders": [ { "externalID": "FORE-SO-73119", "rows": [2, 3], "recipientName": "…", "destinationAddress": "…",
                "lineCount": 2, "totalQty": 18, "status": "NEW | EXISTS | ERROR", "existingCode": null, "errorCount": 0 } ],
  "errors": [ { "row": 6, "field": "sku", "value": "FORE-CUP-12OZ-XL", "message": "SKU tidak ada di katalog FORE" } ],
  "warnings": [ { "sku": "FORE-BEAN-1KG", "requested": 500, "available": 65 } ]
} }
422 CSV_INVALID_FILE (kolom wajib hilang, kosong, > 1.000 baris, > 2 MB, bukan CSV)
```

Commit CSV: `200 {upload: {id, code, hubID, clientID, fileName, totalRows, createdCount, skippedCount, createdBy, createdAt},
orderIDs: [...]}`; `422 CSV_HAS_ERRORS` (body memuat `errors` seperti dry-run); `422 CSV_NOTHING_TO_CREATE` (semua `external_id`
sudah ada).

Kode error lain: `422 INSUFFICIENT_STOCK`, `422 SKU_NOT_IN_CATALOG`, `422 HUB_NOT_ENABLED`, `422 PICKER_REQUIRED`,
`422 PICKING_INCOMPLETE`, `422 QTY_PICKED_OUT_OF_RANGE`, `422 OVER_RECEIPT`, `422 STORAGE_NOT_BIN`, `422 BIN_NOT_IN_HUB`,
`409 STORAGE_INACTIVE`, `409 INVALID_STATUS_TRANSITION` (body membawa state terkini), `409 GOODS_ISSUE_STALE`
(`expectedUpdatedAt` tertinggal; `errors[0].currentUpdatedAt`), `409 PO_HAS_RECEIPTS`,
`409 USE_LINE_PICKING` (pick v1 pada GI milik order), `503 FULFILLMENT_UNAVAILABLE`, `422 FULFILLMENT_HUB_INVALID` (pitstop hub
tanpa alamat/koordinat), `409 FULFILLMENT_DUPLICATE_BOOKING`, serta error lain dari Shipments yang diteruskan apa adanya.

Semua error WMS memakai envelope `{status: 'Failed', error: <pesan>, code: <KODE>, errors?: [...]}` lewat
`WarehouseExceptionFilter` (filter global membuang `errors`).

### Client — fase 2 (kontrak dikunci, belum diimplementasi)

> Detail implementasi (body, respons teredaksi, idempotensi, sandbox, cancel, rollout) ada di
> [`wms-client-api-outbound-prd-trd-v1.md`](./wms-client-api-outbound-prd-trd-v1.md). **Satu perubahan terhadap kontrak di
> bawah:** `hubID` tidak dikirim client — hub dipilih server (hub Dash **terdekat** garis lurus/haversine; stok dicek di semua hub
> hanya untuk peringatan), lihat dokumen itu.
> Webhook status order (topik `OUTBOUND_ORDER`, `ORDER_STATUS_CHANGED`) dan Webhook list di Link › Developer:
> [`wms-outbound-order-webhook-prd-trd-v1.md`](./wms-outbound-order-webhook-prd-trd-v1.md).

```
POST /v1/integration/outbound-orders
  Guard: ApiKeyGuard (@infrastructure/guards) + WarehouseEnabledGuard
  Scope: ApiKeyScope.SHIPMENTS_WRITE — key & scope sama dengan POST /v1/integration/shipments; tidak ada key/scope baru
  Client: auth.provider_id (dari key); sandbox mengikuti environment key (dash_test_ → is_sandbox)
  Body: sama dengan create manual tanpa hubName/hubCode/clientID/clientName; externalID wajib
  200 { "result": "CREATED" | "EXISTS", "id", "code", "externalID", "status": "OPEN", "hubID", "lines": [...] }
GET  /v1/integration/outbound-orders/:id     scope SHIPMENTS_READ; respons diredaksi (tanpa bin, picker, lot)
```

Controller fase 2 tinggal di module WMS (`warehouse-integration.controller.ts`). Pelacakan memakai webhook `shipment.*` yang
sudah ada setelah AWB lahir (`bookingId = externalID`).

## Data model

Lewat schema Drizzle (`src/database/schema/table/*.table.ts`) lalu `pnpm run db:generate`; file migrasi hasil generate tidak
diedit manual. Kolom string baru `text`; `check` hanya untuk aturan domain. Enum di `@database/schema/enum/warehouse.enum.ts`.
ERD diperbarui di `docs/modules/erd/erd.mermaid` (blok `WH_*` v2).

### Tabel baru

| Tabel | Kolom utama | Catatan |
|---|---|---|
| `wh_outbound_orders` | `id`, `code` (OO{yymmdd}{random5}), `source` (MANUAL\|CSV\|CLIENT_API), `external_id`, `upload_id` null FK, `hub_id`, `hub` jsonb, `client_id`, `client` jsonb, `status`, `service_type`, `method`, `recipient_name`, `recipient_phone`, `destination_address`, `destination_lat`/`destination_long` numeric(9,6), `destination_notes`, `notes`, `order_date`, `expected_delivery_date` date, `is_sandbox`, `api_key_id` null, `goods_issue_id` null, `fulfillment_status` null, `fulfillment_shipment_id` uuid null, `fulfillment_waybill` null, `cancelled_at/by`, `cancellation_reason`, `created_by`, `created_at`, `updated_at` | unik `(client_id, external_id, is_sandbox)`; index `(hub_id, status)`, `(hub_id, source)`, `client_id`, `upload_id`, `fulfillment_shipment_id`, `created_at` |
| `wh_outbound_order_lines` | `id`, `outbound_order_id` FK cascade, `sku`, `item_name`, `uom_name`, `qty` numeric(12,2) check > 0, `notes`, `created_at` | nama/UoM didenormalisasi dari `wh_skus` |
| `wh_outbound_order_events` | `id`, `outbound_order_id` FK, `status` null, `title`, `note`, `actor`, `origin` (WMS\|FULFILLMENT\|CLIENT), `occurred_at` | timeline append-only |
| `wh_outbound_order_uploads` | `id`, `code` (OOU{yymmdd}{random5}), `hub_id`, `hub`, `client_id`, `client`, `file_name`, `total_rows`, `created_count`, `skipped_count`, `created_by`, `created_at` | satu baris per commit CSV sukses; index `(hub_id, created_at)` |
| `wh_purchase_orders` | `id`, `code` (PO{yymmdd}{random5}), `hub_id`, `hub`, `client_id`, `client`, `supplier_name`, `est_arrival_at`, `notes`, `status`, `receipt_status` null, `confirmed_at/by`, `cancelled_at/by`, `cancellation_reason`, `created_by`, `created_at`, `updated_at` | index `(hub_id, status)`, `(hub_id, receipt_status)` |
| `wh_purchase_order_lines` | `id`, `purchase_order_id` FK cascade, `sku`, `item_name`, `uom_name`, `qty` check > 0, `qty_received` default 0, `created_at`, `updated_at` | check `0 ≤ qty_received ≤ qty` |
| `wh_document_sequences` | `scope` PK (mis. `SJ:3:2610`), `last_value` int, `updated_at` | penomoran surat jalan berurutan di dalam transaksi |

### Tabel diubah (aditif)

| Tabel | Perubahan |
|---|---|
| `wh_goods_issues` | + `outbound_order_id` null FK, + `surat_jalan_no` null unik, + `ready_at`, `ready_by`; status + `READY_TO_PICKUP`; `reference` = kode OO |
| `wh_goods_issue_lines` | + `qty_picked` numeric(12,2) default 0, check `0 ≤ qty_picked ≤ qty_reserved` |
| `wh_goods_receipts` | + `purchase_order_id` null FK, + `arrived_at`, + `delivery_note_no`, + `delivery_note_photo_url`, + `closes_backorder` bool default false |
| `wh_goods_receipt_lines` | + `purchase_order_line_id` null FK |
| `wh_skus` | + `weight_kg` numeric(8,3) null |
| snapshot hub | + `code?` (untuk surat jalan; fallback `H{hubId}`) |

Tidak ada tabel baru di sisi Shipments. Hubungan shipment ↔ OO cukup `wh_outbound_orders.fulfillment_shipment_id` (soft
reference, tanpa FK lintas module) dan `shipments.booking_id = external ID`.

### Enum

`OutboundOrderStatus` (OPEN, PREPARING, READY_TO_PICKUP, SHIPPED, IN_DELIVERY, DELIVERED, FAILED, CANCELLED),
`OutboundOrderSource` (MANUAL, CSV, CLIENT_API), `FulfillmentStatus` (AT_HUB, DISPATCHED, IN_DELIVERY, DELIVERED, FAILED, RETURNED,
CANCELLED), `PurchaseOrderStatus` (DRAFT, CONFIRMED, CANCELLED), `PurchaseOrderReceiptStatus` (SCHEDULED, PARTIAL_RECEIPT, FINISHED),
`ShipmentServiceType` untuk OO (SAME_DAY, NEXT_DAY); `GoodsIssueStatus` + `READY_TO_PICKUP`.

### Kompatibilitas data

Asumsi: v1 belum punya data production (flag mati). Semua perubahan aditif/nullable, jadi GI/GR v1 tetap valid tanpa OO/PO.

## Cross-module impacts

| Module | Dampak | Interface |
|---|---|---|
| `warehouse` | Fitur v2; tetap tanpa import module fitur lain | HTTP `/v1/warehouse/*`; export `FulfillmentGatewayRegistry`, `WarehouseFulfillmentPort` |
| `warehouse-shipment-adapter` | **Baru** | Import `WarehouseModule`, `ShipmentModule` (ShipmentRepository, ItemRepository, ShipmentStatusHookRegistry), `WebhookModule` (EnqueueWebhookEventsUseCase, WebhookTasksService — preseden `CreateIntegrationShipmentUseCase`), `CoreService` |
| `shipment` | + `ShipmentStatusHook` & `ShipmentStatusHookRegistry` (export); `recordStatusChange` memanggil `notify` di akhir. Tanpa hook terdaftar = perilaku sama persis | titik ekstensi generik |
| `webhook` | Tidak berubah. `shipment.created` dari adapter membawa `data.source = "WAREHOUSE"` dan `data.outboundOrder {id, code, externalID}` | `EnqueueWebhookEventsUseCase` |
| `dispatch`, `inbound`, `batch`, `route` | Tidak berubah. Item hasil adapter sudah `HUB_SCANNED` + `hub_id`, masuk koleksi dispatch seperti item hasil scan | — |
| `api-integration` | Tidak berubah. Endpoint fase 2 di module WMS memakai `ApiKeyGuard` dari infrastructure | — |
| `app.module.ts` | + `WarehouseShipmentAdapterModule` | — |
| `react-logistic-web` | Feature folder warehouse baru, sidebar bertingkat, modal manual & CSV, print; halaman Shipments tidak diubah | — |

## Failure modes & observability

| Gangguan | Perilaku | Yang terlihat ops |
|---|---|---|
| Validasi Shipments menolak saat ship | Transaksi WMS rollback | Toast error dengan pesan Shipments; GI tetap Ready to pick up |
| CoreService down saat ship | Gagal sebelum transaksi | `503 FULFILLMENT_UNAVAILABLE`, coba lagi |
| Adapter dimatikan | Ship tanpa AWB | "Integrasi Shipments nonaktif" di detail shipping |
| Port WMS error saat status shipment berubah | Perubahan status shipment gagal | Error di aksi Shipments (dispatch dll.); matikan flag adapter bila mendesak |
| CSV salah | Tidak ada yang ditulis | Tabel error + Download error CSV |
| Pelanggaran constraint stok | Rollback (v1) | Error 500, alert |

Log & metrik (winston + log-based metrics): `wms_ship_total{result}`, `wms_ship_fulfillment_ms`, `wms_csv_import_total{result}`,
`wms_csv_rows_total`, `wms_fulfillment_updates_applied_total{status}`, `wms_fefo_shortfall_total{sku}`. Alert: rasio ship gagal
> 5% per jam; error port WMS di hook Shipments > 0. Sweep integritas harian v1 tetap. Data penerima (PII) tidak ditulis penuh di log.

## Security & permissions

- Ops: JWT + `@AuthTypes(ADMIN, INTERNAL_SERVICE)` seperti v1; belum ada pembatasan per hub (Open questions).
- Upload CSV: hanya `.csv`/`text/csv`, maks 2 MB dan 1.000 baris; isi sel diperlakukan sebagai teks (tidak dievaluasi); error CSV
  yang diunduh di-escape (cegah formula injection: sel diawali `=`, `+`, `-`, `@` diberi prefix `'`).
- Fase 2: identitas client hanya dari key; client hanya membaca order miliknya; hub harus di allowlist; respons diredaksi.
- Print dibuat di browser dari data yang sudah boleh dilihat ops; tidak ada endpoint dokumen publik.

## Rollout

1. **BE-0 — rapikan v1 ke konvensi repo** tanpa ubah perilaku (use case per file + `*-entity.ts`, helper ke
   `@infrastructure/helpers`, hapus `actorOf`).
2. Migrasi aditif (`pnpm run db:generate`), lalu WMS v2 di balik `ENABLE_WAREHOUSE`.
3. Titik ekstensi Shipments (registry kosong = perilaku lama) — aman dirilis lebih dulu.
4. Adapter di balik `ENABLE_WAREHOUSE_SHIPMENT_ADAPTER` (registrasi gateway & hook hanya bila aktif).
5. Staging e2e hub pilot: manual + CSV → picking → print → ready → ship → AWB → dispatch → delivery.
6. Production: nyalakan kedua flag + `WAREHOUSE_HUB_ALLOWLIST`.
7. Fase 2: endpoint client + `WAREHOUSE_CLIENT_ALLOWLIST`.

Rollback: matikan flag. Shipment yang sudah dibuat adapter adalah shipment biasa dan tidak dihapus. Tidak ada infra baru
(tanpa Pub/Sub, tanpa Cloud Scheduler).

### Work breakdown & estimasi

| Paket | Isi | Estimasi |
|---|---|---|
| BE-0 | Penyelarasan konvensi kode v1 | 1 hari |
| BE-1 | Schema, enum, migrasi | 1 hari |
| BE-2 | OO: validator, create manual, list/detail/summary, cancel | 1,5 hari |
| BE-3 | CSV: template, dry-run, commit, riwayat upload | 1,5 hari |
| BE-4 | Picking: create (single/bulk), picker, qty picked, ready + surat jalan | 2 hari |
| BE-5 | Ship + port `FulfillmentGateway` + port masuk + registry | 1,5 hari |
| BE-6 | Adapter Shipments + titik ekstensi status hook | 2 hari |
| BE-7 | PO, inbound request, GR v2, stock summary | 2 hari |
| BE-8 | Test arsitektur, koleksi API `.yml`, dokumentasi | 1 hari |
| FE-1 | Feature folder, klien API, sidebar bertingkat, routing | 1,5 hari |
| FE-2 | Stock + Storage | 1 hari |
| FE-3 | Outbound request + form manual + import CSV | 2,5 hari |
| FE-4 | Picking + Shipping (list, detail, bulk) | 2,5 hari |
| FE-5 | PO, Inbound request, Goods receipt | 2,5 hari |
| FE-6 | Print 4 dokumen + modal preview | 1,5 hari |
| QA | E2E staging hub pilot | 1,5 hari |
| Fase 2 | Endpoint client + koleksi + docs | 1,5 hari |

Total fase 1 ≈ BE 13,5 hari, FE 11,5 hari, QA 1,5 hari.

## Testing strategy

- **Unit:** validator OO (semua aturan tabel), parser & dry-run CSV (grup per `external_id`, konflik header, duplikat, kolom tak
  dikenal, batas baris), FEFO (v1), progres picking & auto-`PICKED`, guard Ready to pick up, penomoran surat jalan, pemetaan
  status di hook, matematika penerimaan PO.
- **Integrasi DB (`DATABASE_URL_TEST`):** ship menulis stok + shipment + item + history dalam satu transaksi; gateway gagal →
  rollback total; commit CSV all-or-nothing; upload paralel file yang sama tidak membuat dobel; hook status mengubah OO di
  transaksi Shipments; registry kosong = perilaku Shipments lama.
- **Arsitektur:** spec yang gagal bila `src/modules/warehouse/**` mengimpor module fitur lain, atau `shipment` mengimpor `@warehouse/*`.
- **E2E staging:** Req 3–22.
- **Web:** RTL per halaman (form manual: semua error tampil; modal CSV: preview & all-or-nothing; print modal: preview → cetak) +
  Playwright alur outbound dan inbound (pedoman CLAUDE.md web).

## Key decisions & deferred choices

1. **WMS modular lewat ports & adapters, panggilan interface sinkron** (bukan event). Alasan: arahan produk; lebih sederhana
   (tanpa outbox, retry, Pub/Sub); konsisten (stok dan AWB berubah bersama).
2. **Registry, bukan import silang**: module inti hanya mengekspor registry/port; adapter yang mendaftar. Tidak ada siklus module,
   adapter bisa dimatikan dengan flag.
3. **Shipment lahir saat submit shipping**, bukan saat order dibuat (mengganti catatan desain lama).
4. **Tidak ada status "sync gagal"**: kegagalan integrasi = kegagalan request biasa, semua rollback.
5. **Hook status Shipments di dalam transaksi Shipments**; error port WMS ikut menggagalkan perubahan status (konsistensi > ketersediaan
   untuk volume pilot; flag sebagai katup darurat).
6. **Tiga pintu masuk order, satu validator** (form, CSV, API).
7. **Import CSV meniru import Shipments**: template dari BE, dry-run stateless, commit memvalidasi ulang, all-or-nothing untuk error;
   order yang sudah ada dilewati (idempoten), stok kurang hanya peringatan.
8. **Print di FE** dengan `@react-pdf/renderer` (pola yang sudah ada); BE tidak membuat PDF.
9. **Inbound request = tampilan PO `CONFIRMED`**; **GR v2 = create + post sekaligus**; endpoint GR v1 dipertahankan untuk GR tanpa PO.
10. **Surat jalan berurutan** per hub per bulan; kode dokumen lain tetap `random5`.
11. **Client API fase 2 memakai key dan scope yang sama** (`shipments:write`), controller di module WMS.
12. **Item shipment = 1 per baris OO.** Kolom `items.quantity`/`koli` bertipe integer > 0, jadi untuk UoM diskrit
    quantity = koli = `ceil(qty)` (2,5 karton dikirim sebagai 3 paket); untuk `kg`/`liter` quantity = koli = 1. Berat = qty ×
    `weight_kg` dibulatkan 3 desimal; 0 bila SKU belum punya berat (`items.weight` NOT NULL).
13. **Lot kedaluwarsa tetap ikut FEFO** (v1).

Diserahkan ke implementer: default pagination & sort mengikuti module lain; nama file mengikuti CLAUDE.md Nest; bulk endpoint
wajib transaksi per item; upload foto surat jalan memakai pola upload GCS yang ada.

## Open questions

1. Apakah v1 sudah punya data di production? Dokumen ini berasumsi belum.
2. Menu untuk **SKU catalog** dan **Transfer** (fitur v1) belum ada di struktur menu. Implementasi awal menaruh **SKU** di bawah
   Warehouse management (katalog wajib ada untuk validasi order); Transfer belum punya menu. Perlu konfirmasi.
3. **GR tanpa PO** (retur gagal kirim, kompensasi) butuh UI. Usulan: aksi "Receipt tanpa PO" ke bin karantina di Goods receipt.
4. Apakah `weight_kg` wajib untuk SKU client WMS (berat shipment, tarif)?
5. Apakah shipment `FAILED` terminal atau bisa dikirim ulang (mapping OO)?
6. Sumber kode hub untuk surat jalan: dikirim FE saat membuat storage (usulan) atau master lain?
7. Perlu pembatasan akses ops per hub sebelum pilot?
8. Batas CSV 1.000 baris / 2 MB cukup untuk client pilot?
9. Fase 2: client pilot, allowlist, dan SLA.
10. Short-pick: cukup cancel & buat ulang, atau perlu "pick sebagian lalu lepas sisa reserve"?

## Changelog

- 2026-10-07 — dibuat: outbound order, PO/inbound request, surat jalan, integrasi Shipments, menu v2, kontrak client API fase 2.
- 2026-10-07 — implementasi awal di `feat/wms-v2` (nest + web): rollup `AT_HUB` dipindah ke `afterCommit` (alasan di § Alur
  submit shipping), aturan quantity/koli/berat item disesuaikan dengan kolom integer Shipments, endpoint ringkasan tab goods
  issue, kode error `FULFILLMENT_HUB_INVALID`, `FULFILLMENT_DUPLICATE_BOOKING`, `USE_LINE_PICKING`; `GET /goods-receipts` kini
  terpaginasi.
- 2026-10-07 — revisi: (a) input outbound request lewat form manual dan upload CSV (template, dry-run, commit all-or-nothing,
  riwayat upload) — menjawab open question "order fase 1 masuk dari mana"; (b) dokumen print picking list, surat jalan, goods
  receipt, purchase order; (c) integrasi WMS ↔ Shipments diganti dari event (outbox + Pub/Sub + polling) menjadi panggilan
  interface sinkron (ports & adapters + registry). Tabel `wh_outbox`, `wh_inbox`, `warehouse_shipment_links` dihapus dari desain;
  `wh_outbound_order_uploads` ditambah.
- 2026-10-07 — UX: form outbound request, PO dan goods receipt menjadi stepper; PO bisa membuat SKU di tempat (`POST /skus`,
  tanpa perubahan API); ikon untuk semua child/grandchild menu Warehouse.
- 2026-10-07 — koreksi kontrak agar sama dengan implementasi: respons create OO `{result, order, stockWarnings}` (201), envelope
  422 `{error: pesan, code, errors[{field, message, lineIndex}]}`, field dry-run `destinationAddress`/`totalQty`, upload
  `createdCount`/`skippedCount`; catatan shipment `AT_HUB` tidak bisa di-cancel (pakai force-terminal) dan `item_name` = SKU.
