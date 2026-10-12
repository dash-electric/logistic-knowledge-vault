---
title: Transfer storage (approval) & stock opname — koreksi dan pemindahan stok yang terjejak
module: warehouse-management
doctype: prd-trd
version: 1
status: in-review        # draft | in-review | approved | shipped | superseded
product_owner:
engineer: yogi.ermanto@dashelectric.co
created: 2026-10-12
links:
  context: ./wms-context-v1.md
  mockup: ../../../prototype/Warehouse/Logistic-Mithril_Warehouse-WMS.html
  presentation:
  related: ./wms-prd-trd-v2.md
  contract: nest-logistic-service docs/warehouse/storage-transfer-stock-opname.md (kontrak implementasi, sumber detail kolom/endpoint)
  reference: eFishery be-warehouse-management-system services/transferstorage + services/stockopname; monorepo-frontend-upstream-ops pages/warehouseManagement/{transferStorage,stockOpname}
---

# Transfer storage (approval) & stock opname — PRD/TRD v1

> Dua fitur yang dipakai harian di WMS referensi (eFishery) dan sengaja dipotong di MVP Dash (keputusan 2026-08-12).
> v1 Dash sudah punya transfer bin-ke-bin **instan** tanpa status; dokumen ini mengubahnya menjadi dokumen ber-approval
> dan menambah stock opname dengan dua tahap persetujuan (manager gudang → FAT). Tanpa Odoo, tanpa RBAC: aksi dibatasi
> oleh status dokumen. Diputuskan 2026-10-12 lebih dulu dari storage occupancy (lihat `wms-storage-occupancy-prd-trd-v1.md`).

---

# Part 1 — Product Requirements (PRD)

## Problem

1. **Merapikan stok tidak terjejak.** Pindah bin hari ini langsung jadi tanpa persetujuan dan tanpa jejak siapa yang
   minta/menyetujui; salah pindah baru ketahuan saat picking. Ops meminta alur ajukan → setujui → siapkan → selesai
   seperti yang mereka kenal di WMS sebelumnya.
2. **Selisih fisik vs sistem tidak bisa dikoreksi di sistem.** Satu-satunya cara adalah GR/GI kompensasi, yang mengotori
   histori dan laporan client. Hasil hitung fisik dicatat di spreadsheet, tidak pernah masuk sistem, dan stok yang
   "ada di sistem tapi tidak ada di rak" tetap bisa dialokasikan ke order.

## Context

WMS v2 sudah memberi pohon storage, stok per bin × client × SKU × batch (`qty_on_hand` ≥ `qty_reserved`), FEFO, dan
ledger append-only. Kedua fitur ini memakai primitif yang sama: reservasi untuk "mengunci" stok selama menunggu
persetujuan, dan ledger untuk setiap perubahan on-hand. Referensi perilaku: eFishery (lihat frontmatter), dipangkas
dari sinkronisasi Odoo, email FAT, dan label konversi/dead-stock.

## Users & jobs

- **Ops gudang** — mengajukan transfer saat merapikan rak / karantina; menghitung fisik dan mengisi hasil opname (manual atau CSV).
- **Manager gudang** — menyetujui/menolak transfer dan opname tahap 1.
- **FAT (finance)** — menyetujui/menolak opname tahap 2; ini yang mengubah stok.
- **Picker** — tidak terganggu: stok yang sedang ditransfer/diopname minus tidak bisa dialokasikan.

## Scope

### In scope
- Transfer storage: dokumen `REQUESTED → APPROVED → PREPARING → DONE`, `REJECTED` dari REQUESTED; satu bin asal → satu bin
  tujuan per dokumen, baris per SKU × batch; reservasi saat diajukan, pemindahan + ledger saat DONE; timeline.
- Stock opname: dokumen per hub × client; baris per storage × SKU × batch dengan qty sistem, fisik, gap; batch baru untuk
  stok yang ditemukan; gap 0 → langsung DONE tanpa penyesuaian; gap ≠ 0 → approval manager (reservasi selisih minus) →
  approval FAT (posting on-hand + ledger `ADJUSTMENT`); tolak di tahap mana pun melepas reservasi; lock (storage, SKU)
  selama opname aktif; import CSV (dry-run) dan berita acara wajib; timeline.
- Halaman FE: list (tab per status + filter), form wizard, detail dengan tombol aksi per status, timeline; tautan dari
  ledger di halaman Stock ke dokumen asal.

### Out of scope
- Sinkronisasi Odoo/ERP, email notifikasi FAT, RBAC per aksi (semua role bisa, dibatasi status).
- Baris konversi / dead-stock (label DEAD_FRESH / DEAD_BROKEN / CONVERSION) dari eFishery.
- Edit dokumen yang sudah diajukan, re-count; transfer antar hub (tetap lewat outbound TRANSFER).
- Print/PDF untuk kedua dokumen.

## Requirements

1. Transfer dibuat dengan asal ≠ tujuan, keduanya bin ACTIVE satu hub; tiap baris ≤ available (on_hand − reserved) batch
   itu; saat dibuat, `qty_reserved` naik sebesar qty baris; kode `TRF-INT-{MMDDYY}-{RAND4}`.
2. Transfer hanya bisa di-approve dari REQUESTED, disiapkan dari APPROVED, diselesaikan dari PREPARING, ditolak dari
   REQUESTED dengan alasan; aksi pada status lain → `409 INVALID_STATUS_TRANSITION`; aksi yang diulang pada status target
   bersifat idempotent.
3. Saat DONE: on_hand & reserved asal turun, on_hand tujuan naik (upsert baris stok dengan batch/expiry yang sama), satu baris
   ledger `TRANSFER` per baris dokumen. Saat REJECTED: reservasi dilepas, tidak ada ledger.
4. Opname: tiap baris menunjuk storage ACTIVE di hub dan SKU aktif milik client; batch yang ada harus ada di `wh_stocks`
   storage itu; batch baru dibuat dari kode opname + expiry (atau NOEXP) dengan `qty_system = 0`.
5. Opname dengan semua gap 0 langsung `DONE` tipe `WITHOUT_ADJUSTMENT` tanpa mengubah stok. Selainnya
   `WAITING_MANAGER_APPROVAL` tipe `WITH_ADJUSTMENT`.
6. (Storage, SKU) yang ada di opname non-terminal tidak boleh dimasukkan ke opname lain → `409 OPNAME_LOCKED` menyebut kode
   opname pemegangnya; pemilihan batch di form menandai baris terkunci.
7. Approve manager mereservasi |gap| untuk baris minus (gagal `422 INSUFFICIENT_STOCK` bila available kurang) lalu
   `WAITING_FAT_APPROVAL`. Approve FAT memposting: gap positif menaikkan on_hand, gap negatif menurunkan on_hand & reserved,
   batch baru membuat baris stok; satu baris ledger `ADJUSTMENT` (ref `STOCK_OPNAME`, delta bertanda) per baris gap ≠ 0;
   status `DONE`.
8. Tolak manager → `REJECTED_BY_MANAGER` (tidak ada reservasi); tolak FAT → `REJECTED_BY_FAT` dan reservasi dilepas.
   Alasan wajib, tersimpan di timeline.
9. Import CSV opname (`sku, storage_name, batch_number, qty_physical, notes`) memvalidasi per baris dan mengembalikan
   total/sukses/gagal + pesan `Baris N: …`; baris sukses mengisi form (dry-run, tidak menyimpan).
10. Ledger: tipe `ADJUSTMENT` tampil di halaman Stock dan export CSV; laporan mutasi memasukkan adjustment (+ sebagai masuk,
    − sebagai keluar).
11. Semua perubahan status tercatat sebagai event (status, judul Indonesia, catatan, aktor, waktu) dan tampil sebagai
    timeline terbaru di atas, seperti halaman Shipments.

## Edge cases & failure states

- **Stok tujuan sudah ada batch sama dengan expiry berbeda** → `409 EXPIRY_MISMATCH` saat DONE (aturan GR yang sama); dokumen
  tetap PREPARING, ops memperbaiki data lalu mengulang.
- **Stok asal dikurangi GI lain sebelum DONE** → tidak mungkin: reservasi transfer menahan qty itu dari FEFO.
- **Opname minus pada batch yang sebagian direservasi GI** → approve manager gagal dengan shortfall; ops menunggu GI
  terkirim atau menolak opname.
- **Storage dinonaktifkan di tengah jalan** → transfer/opname yang sudah berjalan tetap boleh diselesaikan (stok sudah ada
  di sana); yang baru ditolak saat dibuat (`422 STORAGE_INACTIVE`).
- **Dua ops membuat opname untuk (storage, SKU) yang sama bersamaan** → advisory lock per hub di create, yang kedua `409 OPNAME_LOCKED`.
- **Transfer lama (instan) sebelum kolom status ada** → dianggap `DONE` (default kolom), tetap tampil di list.

## Success criteria

- Tidak ada lagi GR/GI "kompensasi" untuk koreksi stok di hub pilot dalam 1 bulan setelah rilis (dicek dari catatan GR/GI).
- Semua pemindahan bin punya pemohon, penyetuju, dan waktu di timeline; audit sample 20 dokumen lolos.
- Selisih hasil opname bulanan masuk sistem ≤ 1 hari kerja setelah hitung fisik, dengan ledger yang jumlahnya = on-hand.

---

# Part 2 — Technical Requirements (TRD)

## Summary

Transfer memakai tabel `wh_transfers` yang ada ditambah kolom status/aktor dan tabel event; use case create diubah dari
"pindah langsung" menjadi "reservasi", dan pemindahan + ledger pindah ke use case DONE. Opname memakai tiga tabel baru
(`wh_stock_opnames`, `_lines`, `_events`), dua nilai enum ledger baru (`ADJUSTMENT` / `STOCK_OPNAME`), dan sepuluh use
case kecil satu file per aksi. Semua di module `warehouse`, memakai primitif stok yang ada (`lockStocksByIds`,
`adjustStock`, `upsertStockIncrement`, `insertMovements`). FE menambah dua grup halaman di menu Warehouse management.

## Architecture

- Module `warehouse` (`nest-logistic-service`), tetap modular. Repository baru `TransferRepository` dan
  `StockOpnameRepository` (abstract di `domain/repositories`, impl di `data/repositories`, didaftarkan manual).
- State machine mengikuti pola `PickingMutationBase`: lock dokumen → cek transisi → mutasi dalam satu transaksi; urutan
  lock: dokumen → baris stok dalam satu statement `FOR UPDATE` terurut id.
- Reservasi transfer dan opname adalah `qty_reserved` biasa, sehingga FEFO/GI otomatis menghormatinya tanpa kode khusus.
- FE: `react-logistic-web/src/pages/warehouse/pages/{storage-transfer,stock-opname}`; API client, types, status map,
  history builder, sidebar, routes ditambah secara aditif.

## API contracts

Detail lengkap (DTO, validasi, error) ada di kontrak implementasi (`links.contract`). Ringkas:

```
POST /v1/warehouses/transfers                     ajukan (reservasi)                → TransferEntity
GET  /v1/warehouses/transfers?hubID&status&search&dateFrom&dateTo&page&limit   → paged
GET  /v1/warehouses/transfers/summary             counts per status
GET  /v1/warehouses/transfers/:id                 header + lines + events
POST /v1/warehouses/transfers/:id/approve | /preparing | /done | /reject {reason}

GET  /v1/warehouses/stock-opnames                 paged, filter hubID/clientID/status/type/search/date
GET  /v1/warehouses/stock-opnames/summary
GET  /v1/warehouses/stock-opnames/available-batches?hubID&clientID&storageID&sku&excludeOpnameID
POST /v1/warehouses/stock-opnames/import          multipart CSV, dry-run → { totalData, totalSuccess, totalFail, messages, lines }
POST /v1/warehouses/stock-opnames                 { hubID, clientID, notes?, reportUrl, lines[{ storageID, sku, batchNumber?, expiredDate?, qtyPhysical, notes? }] }
GET  /v1/warehouses/stock-opnames/:id
POST /v1/warehouses/stock-opnames/:id/approve | /reject {reason} | /fat-approve | /fat-reject {reason}
```

Kode error: `INVALID_STATUS_TRANSITION` (409), `INSUFFICIENT_STOCK` (422, errors[] sku/batch/requested/available/shortfall),
`OPNAME_LOCKED` (409), `EXPIRY_MISMATCH` (409), `VALIDATION` (422, `lines[i].field`). Koleksi API (`dash-api-collections`)
diperbarui saat PR BE dibuat.

## Data model

- `wh_transfers` + `status` (default `DONE` untuk baris lama), `approved_*`, `preparing_*`, `done_*`, `rejected_*`,
  `reject_reason`, `updated_at`; index `(hub_id, status, created_at desc, id desc)`. `wh_transfer_lines` + `stock_id`,
  `uom_name`, `expired_date`. Baru: `wh_transfer_events`.
- Baru: `wh_stock_opnames`, `wh_stock_opname_lines` (unik `(opname, storage, sku, batch)`), `wh_stock_opname_events`.
- Enum: `TransferStatus`, `StockOpnameStatus`, `StockOpnameType`; `StockMovementType.ADJUSTMENT`, `StockMovementRefType.STOCK_OPNAME`.
- Migrasi dihasilkan sekali (`pnpm run db:generate`, nama `wms_transfer_opname`), tidak ditulis tangan. ERD diperbarui di
  perubahan yang sama (`docs/modules/erd/erd.mermaid`).

## Cross-module impacts

Tidak ada; module warehouse saja. Halaman Stock (FE warehouse) menambah tautan dari baris ledger `TRANSFER` / `STOCK_OPNAME`
ke dokumennya dan label tipe `ADJUSTMENT`.

## Failure modes & observability

- Semua aksi transaksional; kode acak di-retry pada unique violation; aksi idempotent pada status target.
- Invarian ledger (`Σ qty_delta per stok == qty_on_hand`) tetap dijaga: transfer menulis ledger hanya saat DONE, opname hanya
  saat FAT approve. Property test acak GR/GI/transfer/opname ditambahkan ke suite warehouse.
- Alert: tidak ada yang baru; error 5xx lewat filter exception yang sama.

## Security & permissions

Semua endpoint `ADMIN | INTERNAL_SERVICE` seperti endpoint WMS lain. Tidak ada RBAC per aksi (keputusan: gating lewat status
dulu; RBAC approval menyusul bersama modul user WMS). Input CSV: maksimal 5 MB / 2.000 baris, catatan ≤ 200 karakter.

## Rollout

1. BE + migrasi (kolom nullable/default, tabel baru) — aman tanpa downtime; transfer lama otomatis `DONE`.
2. FE halaman Transfer storage dan Stock opname di balik menu (tanpa flag; flag WMS dihapus 2026-10-08).
3. Pilot satu hub: SOP opname bulanan memakai CSV + berita acara; manager & FAT memakai halaman detail.
Rollback: FE dapat dicabut; BE: transfer baru yang masih REQUESTED/APPROVED/PREPARING harus di-reject dulu agar reservasi lepas.

## Testing strategy

- Unit BE: state machine (termasuk idempotent dan transisi salah), reservasi/pelepasan, posting on-hand & ledger, lock opname,
  import CSV, DTO. Invarian `on_hand ≥ reserved ≥ 0` dan ledger-sum di property test.
- FE: list/tab/filter, wizard validasi & payload, aksi detail memanggil endpoint yang benar, sidebar/routes, noNativeSelect.
- Integrasi (DB test): DONE transfer memindahkan stok dan ledger; FAT approve pada batch baru membuat baris stok.
- E2E Playwright smoke: ajukan transfer → approve → preparing → done; buat opname gap → approve manager → approve FAT.

## Key decisions & deferred choices

- **Mengubah transfer instan menjadi ber-status, bukan membuat dokumen kedua** — satu konsep "transfer storage" di produk;
  baris lama dianggap DONE. Konsekuensi: `POST /transfers` tidak lagi memindahkan stok seketika.
- **Satu bin asal → satu bin tujuan per dokumen** (bukan per baris seperti eFishery yang per section): lebih sederhana untuk
  ops dan cocok dengan model stok di bin; multi-bin = beberapa dokumen.
- **Dua tahap approval dipertahankan** (manager → FAT) karena koreksi stok berdampak ke nilai persediaan client; tanpa RBAC
  dulu, dibatasi status.
- **Reservasi selisih minus saat approve manager** meniru eFishery supaya stok yang "hilang" tidak sempat dialokasikan.
- Ditunda: RBAC per aksi, notifikasi FAT, konversi/dead-stock, print, edit dokumen.

## Open questions

- Perlukah batas waktu (SLA) untuk opname yang menunggu FAT, dengan pengingat?
- Apakah FAT perlu melihat nilai rupiah selisih (butuh harga per SKU yang belum ada di SKU master)?

## Changelog

- 2026-10-12 — created; kontrak implementasi di nest-logistic-service `docs/warehouse/storage-transfer-stock-opname.md`; implementasi dimulai di branch `feat/wms-transfer-opname` (BE & FE).
