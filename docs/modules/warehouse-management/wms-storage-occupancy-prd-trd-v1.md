---
title: Storage occupancy & peta gudang — kapasitas per bin, okupansi, denah
module: warehouse-management
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:
engineer: yogi.ermanto@dashelectric.co
created: 2026-10-12
links:
  context: ./wms-context-v1.md
  mockup: ./wms-storage-occupancy-mockup-v1.html
  presentation:
  related: ./wms-prd-trd-v2.md
  reference: eFishery be-warehouse-management-system (services/storagecapacity, view storage_sku_capacity_view) dan monorepo-frontend-upstream-ops (pages/dashboard/storageCapacity)
---

# Storage occupancy & peta gudang — PRD/TRD v1

> **Status: ditunda.** Diputuskan 2026-10-12 untuk mengerjakan transfer storage dan stock opname lebih dulu
> (keduanya syarat akurasi stok; okupansi membaca stok yang harus sudah dipercaya). Dokumen ini mengunci
> keputusan desain dan hasil assessment supaya pekerjaan bisa dilanjutkan tanpa mengulang diskusi.
> Mockup klikabel: `wms-storage-occupancy-mockup-v1.html` (empat halaman + simulasi end-to-end).

---

# Part 1 — Product Requirements (PRD)

## Problem

1. **Ops tidak tahu sisa ruang.** Hub hanya tahu stok per bin dalam unit. Tidak ada jawaban untuk "rak mana yang masih
   muat 2 m³ barang client X" selain jalan ke gudang. Put-away saat goods receipt memakai bin pertama yang terpikir.
2. **Tidak ada penanda bin penuh / hampir penuh.** Rak yang over kapasitas baru ketahuan saat barang tidak muat; tidak ada
   alert, tidak ada angka okupansi per hub untuk perencanaan rak baru atau penolakan order client.
3. **Tidak ada denah.** Nama bin (`A3-L2`) tidak punya posisi fisik di sistem; picker baru hafal lokasi setelah berminggu.
   Onboarding hub baru dan picker baru bergantung pada orang lama.

Bukti: keluhan ops saat smoke test WMS v2 (Okt 2026) — bin penuh di rak A sementara rak D kosong; tidak ada cara melihat
distribusi stok per rak tanpa export CSV stok dan menghitung manual.

## Context

WMS v2 (lihat `wms-prd-trd-v2.md`) sudah memberi: pohon storage LOCATION → SECTION → BIN (`wh_storages`, ltree), stok per
bin × client × SKU × lot (`wh_stocks`), SKU master dengan dimensi (`length_cm/width_cm/height_cm`) dan berat (`weight_kg`),
serta roll-up on-hand per subtree di list storage (`withStock`). Yang belum ada hanya **kapasitas** di storage dan
**posisi** storage di denah. eFishery (referensi WMS) sudah punya dashboard Storage Capacity; assessment-nya ada di § Key
decisions dan diterjemahkan ke model Dash di bawah.

## Users & jobs

- **Ops gudang (admin hub)** — mengatur kapasitas bin saat membuat rak, melihat rak mana penuh, merencanakan rak baru.
- **Picker / putaway** — mencari bin tujuan yang masih muat saat GR; menemukan bin di denah saat picking.
- **Supervisor hub / ops lead** — memantau okupansi per hub dan per client, memutuskan terima/tolak order besar.
- **CS / account** — menjawab client "stok saya pakai berapa ruang" (fase 3, laporan per client).

## Scope

### In scope
- Kolom kapasitas pada storage (bin): `capacity_cbm`, `capacity_kg`, `capacity_qty` (nullable) + dimensi `width_cm/depth_cm/height_cm`.
- Set kapasitas: per bin (edit storage), massal per section ("set kapasitas semua bin", opsi hanya yang belum diset), import/export CSV.
- Okupansi per storage (bin, roll-up ke section/location/hub) dalam m³ (default), kg, dan qty; status ambang eFishery
  (`TERSEDIA` / `TERISI` >0 / `HAMPIR_PENUH` >50 / `PENUH` >80) ditambah `OVER` >100 dan `KAPASITAS_BELUM_DIATUR`.
- Halaman **Okupansi storage** (pola dashboard Storage Capacity eFishery): filter pencarian/hub/status bin, drawer filter
  lokasi/section/bin/client, alert bin tanpa kapasitas dengan "Atur sekarang", board kartu per location, tabel per bin × SKU,
  export CSV sesuai filter.
- Halaman **Peta gudang**: denah isometrik per hub, warna bin dari okupansi, inspector bin/section/location, filter
  location/client, editor layout (tempatkan dari tray, drag snap 50 cm, putar, ubah level/bentuk, resize zona location).
- Tabel layout `wh_storage_layouts` (satu baris per storage yang ditempatkan) + endpoint simpan layout.
- Kolom okupansi di list Storage; KPI okupansi di dashboard Stock.

### Out of scope
- Kapasitas per SKU per warehouse (model eFishery `warehouse_stock_capacity`) — **ditolak**, lihat Key decisions.
- Posisi per bin (koordinat bebas) — bin diturunkan dari bentuk section dan urutan bin; override per bin (`slot`, `span`) ditunda.
- Import DXF/AutoCAD, denah 3D sungguhan, export PDF denah — fase lanjut.
- Rekomendasi put-away otomatis dan picking walk order — fase 3, hanya disebut di rollout.
- Riwayat okupansi dari waktu ke waktu (snapshot harian) — fase 3.
- Perubahan pada mekanisme stok (reserve/deduct/ledger) — tidak disentuh.

## Requirements

1. Ops dapat mengisi dimensi bin (lebar × dalam × tinggi cm); sistem menurunkan `capacity_cbm` yang boleh dikoreksi manual
   (mis. 80% efektif). `capacity_kg` dan `capacity_qty` opsional. Null berarti "belum diset", bukan nol.
2. Ops dapat menerapkan satu kapasitas ke semua bin satu section dalam satu aksi, dengan opsi "hanya bin yang belum diset".
3. Ops dapat import CSV kapasitas (`path|name, capacity_cbm, capacity_kg, capacity_qty`); baris section berlaku ke semua bin di
   bawahnya; kolom kosong tidak mengubah nilai; hasil dilaporkan total/sukses/gagal dengan pesan per baris. Export CSV memberi
   template berisi nilai saat ini.
4. Sistem menghitung okupansi per bin: `used_cbm = Σ qty_on_hand × cbm_per_unit(SKU)`, `used_kg = Σ qty × weight_kg`,
   `used_qty = Σ qty`; persen = used ÷ capacity; roll-up ke section/location/hub lewat `path <@`.
5. Status okupansi per bin memakai ambang eFishery (>0, >50, >80) + `OVER` (>100) + `KAPASITAS_BELUM_DIATUR` (ada stok,
   kapasitas null). Bin kosong tanpa kapasitas berstatus `TERSEDIA` tetapi dihitung di KPI "belum diset".
6. Halaman Okupansi storage menampilkan: alert jumlah bin tanpa kapasitas → "Atur sekarang" membuka Storage dengan filter
   belum diset; board per location (persen, progress warna 0 hijau / <51 kuning / <81 oranye / ≥81 merah, "x/y bin
   digunakan", detail per section "n bin · n tersedia"); tabel per bin × SKU (client, hub, lokasi, section, bin, SKU, nama
   produk, qty on hand, terpakai/kapasitas m³ + %, status); pagination; export CSV sesuai filter.
7. List Storage menampilkan kapasitas, terpakai, okupansi %, status per baris (location/section/bin).
8. Peta gudang membaca pohon storage dari `GET /storages` dan hanya menyimpan posisi: location = x, y, w, h; section = x, y
   relatif ke origin location, rotasi 0/90, bentuk `RACK|FLOOR`, `levels` (rak) atau `rows` + `cell_cm` (lantai). Bin
   dirender dari urutan bin di data: rak → kolom = ⌈n ÷ levels⌉, bin ke-i di (⌊i ÷ levels⌋, i mod levels).
9. Storage tanpa baris layout tampil di tray "Belum ditempatkan" (location dulu, baru section); menambah/menghapus
   section atau bin tetap lewat menu Storage; "Lepas dari peta" hanya menghapus baris layout.
10. Editor layout: drag section (snap 50 cm, dibatasi zona location), putar, ubah level/bentuk; geser location memindahkan
    section di dalamnya; resize location tidak boleh lebih kecil dari rak di dalamnya; Simpan mengirim semua baris layout
    hub dalam satu request.
11. Peta mewarnai bin dari okupansi mode m³ (default), qty, atau "bin terpakai"; filter client memudarkan bin tanpa stok
    client itu; inspector bin menampilkan lot per SKU/batch.
12. Semua angka okupansi berasal dari `wh_stocks` saat ini — tidak ada tabel okupansi yang ditulis oleh dokumen GR/GI.

## Edge cases & failure states

- **Kapasitas dikecilkan di bawah stok saat ini** → diizinkan, bin menjadi `OVER`; tidak memblokir GR (ops yang memutuskan).
- **SKU tanpa dimensi** → kontribusi m³ = 0 dan bin ditandai "ada SKU tanpa dimensi" (badge) supaya persen tidak menipu;
  mode qty tetap benar.
- **Bin INACTIVE** → tidak dihitung di KPI "bin aktif" tetapi stoknya tetap dihitung di roll-up section.
- **Location/section dihapus-nonaktifkan** sementara punya layout → baris layout dibiarkan (soft), tidak dirender.
- **Layout disimpan oleh dua admin bersamaan** → last-write-wins per hub dengan `updated_at` dicek (409 jika stale).
- **Hub tanpa layout** → peta kosong + tray penuh; halaman tetap berguna sebagai daftar.
- **Filter client di board** → kartu menghitung bin terpakai hanya oleh client itu; total bin tetap seluruh bin.

## Success criteria

- Dalam 2 minggu pilot: ≥ 90% bin tipe STORAGE di hub pilot punya `capacity_cbm` (KPI "belum diset" < 10%).
- Put-away GR memakai bin dengan sisa kapasitas cukup (tidak ada bin `OVER` baru akibat GR) — diukur dari ledger.
- Ops lead memakai halaman Okupansi (bukan export CSV stok) untuk keputusan rak baru — dicek lewat wawancara post-ship.
- Picker baru menemukan bin dari denah tanpa bertanya — observasi di hub pilot.

---

# Part 2 — Technical Requirements (TRD)

## Summary

Tambahkan kolom kapasitas dan dimensi pada `wh_storages`, satu view okupansi yang menjumlahkan `wh_stocks × wh_skus`
per storage dan di-roll-up lewat ltree, dan satu tabel `wh_storage_layouts` berisi posisi per storage. Tidak ada tabel
kapasitas per SKU, tidak ada perubahan pada alur stok. Dua halaman FE baru (Okupansi storage, Peta gudang) dan kolom
tambahan di Storage; semuanya membaca endpoint storage yang sudah ada ditambah tiga endpoint baru (okupansi, layout,
import/export kapasitas).

## Architecture

- **Pemilik:** module `warehouse` di `nest-logistic-service` (tetap modular — tidak mengimpor module lain).
- **Okupansi** dihitung saat dibaca (view / query), bukan disimpan: sumber kebenaran tetap `wh_stocks`. Jika query roll-up
  per hub terbukti berat (> 300 ms untuk 10k bin), ganti ke materialized view yang di-refresh setelah GR/GI post (fase 2).
- **Layout** adalah data presentasi murni: tabel terpisah, satu baris per storage, tanpa FK ke stok. Peta = `GET /storages`
  (pohon + stok) ⨝ `GET /storages/layout` (posisi) di FE.
- **FE**: `react-logistic-web/src/pages/warehouse` — halaman `StorageOccupancyPage`, `WarehouseMapPage`, komponen peta SVG
  isometrik (tanpa lib eksternal; proyeksi 30°, painter's order, pan/zoom, drag dengan unproject).

## API contracts

```
GET  /v1/warehouses/storages/occupancy?hubID&locationID?&sectionID?&status?&clientID?&search?&page&limit
     → { data: [{ storageID, path, category, name, location, section, capacityCbm, capacityKg, capacityQty,
                  usedCbm, usedKg, usedQty, pctCbm, status, binCount, binUsed, lines: [{clientID, client, sku, itemName, uomName, qtyOnHand}] }],
         summary: { binActive, binUsed, usedCbm, capacityCbm, pctCbm, binHot, binUnset }, pagination }
GET  /v1/warehouses/storages/occupancy/board?hubID&clientID?
     → [{ locationID, name, type, binQty, binUsed, pct, sections: [{ sectionID, name, binQty, binAvailable }] }]
GET  /v1/warehouses/storages/occupancy/csv?…same filters           → text/csv
PATCH /v1/warehouses/storages/:id            (sudah ada) + { widthCm?, depthCm?, heightCm?, capacityCbm?, capacityKg?, capacityQty? }
PUT  /v1/warehouses/storages/:id/bins/capacity   { capacityCbm?, capacityKg?, capacityQty?, widthCm?, depthCm?, heightCm?, onlyUnset: boolean }
     → { updated: n }                         (id = SECTION; berlaku ke semua BIN di bawahnya)
POST /v1/warehouses/storages/capacity/import  multipart csv (path|name, capacity_cbm, capacity_kg, capacity_qty)
     → { totalData, totalSuccess, totalFail, messages: string[] }
GET  /v1/warehouses/storages/capacity/export?hubID  → text/csv (template dengan nilai saat ini + qty_on_hand)
GET  /v1/warehouses/storages/layout?hubID     → [{ storageID, category, x, y, w?, h?, rotation?, shape?, levels?, rows?, cellCm?, updatedAt }]
PUT  /v1/warehouses/storages/layout           { hubID, updatedAt?, layouts: [ ...same shape... ] }   (replace semua baris hub; 409 LAYOUT_STALE)
```

Validasi: kapasitas ≥ 0 atau null; dimensi > 0; section/bin harus satu hub dengan `hubID`; `levels` 1–6; `rotation` ∈ {0, 90};
section tidak boleh ditempatkan jika location-nya belum punya baris layout (`422 LOCATION_NOT_PLACED`).
Status okupansi dihitung di BE (konstanta ambang di `constant`), bukan di SQL literal, supaya FE tidak menduplikasi.

## Data model

Tabel diubah (aditif):
- `wh_storages` + `width_cm numeric(8,1) null`, `depth_cm`, `height_cm`, `capacity_cbm numeric(10,3) null`,
  `capacity_kg numeric(10,2) null`, `capacity_qty numeric(12,2) null`. Diset di BIN (atau SECTION tipe lantai); null = belum diset.

Tabel baru:
- `wh_storage_layouts` — `id uuid PK`, `storage_id uuid FK → wh_storages.id unique`, `hub_id bigint`, `x int`, `y int`
  (cm; location relatif ke origin hub, section relatif ke origin location), `w int null`, `h int null` (location),
  `rotation smallint default 0`, `shape text null (RACK|FLOOR)`, `levels smallint null`, `rows smallint null`,
  `cell_cm smallint null`, `created_by`, `created_at`, `updated_at`. Index `(hub_id)`.

View:
- `wh_storage_occupancy_v` — per storage BIN: `used_cbm`, `used_kg`, `used_qty` dari `wh_stocks ⨝ wh_skus` (join pada
  `client_id, sku`); roll-up section/location dilakukan di query dengan `path <@`.

ERD: `docs/modules/erd/erd.mermaid` diperbarui (kolom kapasitas di `WH_STORAGES`, entitas `WH_STORAGE_LAYOUTS`,
ditandai PROPOSED selama status draft).

## Performance, reliability & scalability (requirement, not afterthought)

Target: satu hub besar = 20.000 bin, 100.000 baris stok, 50 ops bersamaan; peta tetap 60 fps saat diputar/di-zoom,
okupansi hub terbuka < 300 ms p95, memori tab browser < 150 MB.

**Backend**
- Okupansi dihitung di SQL dalam satu query agregat per permintaan: `wh_stocks ⨝ wh_skus` di-group per `storage_id`
  (used_cbm/kg/qty), lalu roll-up section/location lewat `path <@` dengan index GiST yang sudah ada. Tidak ada N+1, tidak ada
  perhitungan di Node per baris. Query dibatasi per hub dan mengembalikan hanya kolom yang dipakai.
- Endpoint peta memakai **payload kolumnar ringkas**: `GET /storages/map?hubID` → `{ storages: [[id, parentIdx, category, name, status]…],
  layouts: [[idx, x, y, w, h, rot, shape, levels, rows, cell]…], occupancy: [[idx, usedCbm, capCbm, usedQty, capQty, status]…] }`.
  20.000 bin ≈ 1 MB gzip, satu round-trip; detail bin (lot per SKU) diambil terpisah saat diklik (`GET /stocks?storageID`).
- Materialized view `wh_storage_occupancy_mv` di-refresh **inkremental** dari ledger (trigger pada `wh_stock_movements` menandai
  storage kotor; worker merefresh per hub tiap ≤ 5 detik) kalau query langsung > 300 ms. Mulai dari query langsung; ukur dulu.
- Cache HTTP: `ETag` + `Cache-Control: private, max-age=5` pada peta dan okupansi; `If-None-Match` membuat polling murah.
- Layout disimpan per hub dalam satu `PUT` idempotent dengan `updatedAt` (409 bila stale); tidak ada long-running request.
- Import CSV kapasitas diproses streaming (baris demi baris, batas 5.000 baris), transaksi per file.
- Observabilitas: durasi query okupansi dan ukuran payload dilog per hub; alert p95 > 500 ms.

**Frontend**
- Peta dirender di **Canvas 2D**, bukan SVG/DOM: satu elemen, tanpa node per bin, gambar ulang digabung per `requestAnimationFrame`.
  Hit-test lewat polygon-in-point pada daftar poligon frame terakhir (urutan painter), bukan event DOM. Ini yang dipakai mockup
  (`wms-storage-occupancy-mockup-v1.html`), terukur ≈ 8 ms/frame untuk 143 bin × 3 sisi di laptop biasa, dan skalanya linear.
- **Level of detail**: < 3 px per bin hanya atap tanpa garis; < 6 px tanpa sisi dan tanpa plakat section; plakat location selalu.
  Di luar viewport tidak digambar (culling per section memakai bounding box layar).
- Proyeksi isometrik dengan turntable (0–360°) dihitung dari dua rotasi murah; tidak ada WebGL agar jalan di laptop ops dan tanpa
  dependensi baru (bisa dipindah ke WebGL/OffscreenCanvas bila > 50.000 bin).
- Data peta disimpan sebagai typed array/struktur datar di memori (bukan objek per bin dengan closure), diturunkan sekali dari
  payload; ubah layout hanya memutakhirkan section yang berubah.
- Halaman okupansi dan tabel storage memakai pagination server (20–100 baris) dan virtualisasi baris; tidak pernah memuat seluruh
  daftar bin ke DOM.
- Polling okupansi 10 detik dengan `ETag`; berhenti saat tab tidak terlihat (`visibilitychange`).
- Tanpa library peta/3D tambahan: bundle tidak bertambah selain modul canvas ±15 KB.

## Cross-module impacts

- Tidak ada. Semua di module warehouse. Dashboard Stock (FE warehouse) menambah KPI dari `occupancy.summary`.
- Alert Slack okupansi hub > 85% (fase 3) memakai jalur alert yang sudah ada di module warehouse.

## Failure modes & observability

- Query okupansi dibatasi per hub; log durasi, alert bila p95 > 500 ms.
- Import CSV atomik per file (transaksi); baris gagal tidak mengubah apa pun, laporan per baris.
- Simpan layout: validasi semua baris dulu, lalu replace dalam satu transaksi; `409 LAYOUT_STALE` bila `updatedAt` yang dikirim
  lebih lama dari yang tersimpan.
- Tidak ada retry/idempotency khusus: semua endpoint tulis bersifat replace.

## Security & permissions

- Lihat okupansi/peta: semua role gudang. Ubah kapasitas, import, simpan layout: role admin hub / ops lead (gating yang sama
  dengan edit storage).
- Input CSV: batas 5 MB, 5.000 baris; nilai numerik divalidasi; path/name dicocokkan hanya dalam hub yang dipilih.

## Rollout

- **Fase 1 (±1 minggu):** kolom kapasitas + dimensi di storage; edit storage, kapasitas massal, import/export; view okupansi +
  `GET /storages/occupancy`; kolom okupansi di Storage; KPI di Stock; halaman Okupansi storage. Backfill: tidak ada (null = belum
  diset; alert mengarahkan ops).
- **Fase 2 (1–2 minggu):** `wh_storage_layouts` + endpoint layout; halaman Peta gudang dengan editor; mockup sudah final.
- **Fase 3:** saran bin put-away (sisa kapasitas terbesar, terdekat staging), picking walk order, snapshot okupansi harian, alert.
- Rollback: kolom nullable dan tabel terpisah — hapus halaman FE cukup; tidak ada data stok yang bergantung.

## Testing strategy

- Unit: kalkulator okupansi (m³/kg/qty, roll-up, ambang status, SKU tanpa dimensi), pengurai CSV, validasi layout
  (location belum ditempatkan, resize di bawah isi).
- Integrasi (DB test): view okupansi vs ledger (`Σ used_qty == Σ qty_on_hand`), import CSV atomik, simpan layout stale.
- FE: tree table, board/filters/export, editor (drag snap, place/unplace, bins mengikuti urutan data) — jest + e2e smoke.

## Key decisions & deferred choices

- **Kapasitas di storage (bin), bukan di warehouse/hub.** eFishery menyimpan `warehouse_stock_capacity` (warehouse × SKU →
  qty per pallet) dan diset di CRUD warehouse. Cocok untuk stok homogen (pakan, sak) dengan rak seragam dan satu bin satu SKU.
  Tidak cocok untuk Dash: bin campur SKU/client, rak tidak seragam, SKU baru harus diisi dulu sebelum okupansi kehitung
  (sumber status "belum diatur" yang sering), dan denah butuh angka per bin. Dash sudah punya dimensi/berat SKU, jadi m³ bisa
  dihitung tanpa tabel per SKU. Keputusan 2026-10-12.
- **Satuan utama m³**, kg dan qty opsional per bin untuk kasus barang berat-kecil atau client yang minta bin eksklusif.
- **Bin tidak punya koordinat sendiri** — diturunkan dari section (bentuk + urutan). Override per bin (`slot`, `span`) ditunda sampai ada
  kebutuhan nyata (rak rusak, bin lebar dobel).
- **Ambang status mengikuti eFishery** supaya ops yang pernah memakai WMS itu familiar; `OVER` ditambah karena Dash mengizinkan
  menaruh melebihi kapasitas tercatat.
- Deferred ke engineer: materialized view atau query langsung (ukur dulu); format CSV import memakai `path` atau `name`
  (keduanya diterima di mockup, pilih satu saat implementasi).

## Open questions

- Apakah client tertentu butuh "bin eksklusif" (tidak boleh campur) sebagai aturan sistem, atau cukup SOP?
- Siapa yang berhak mengubah layout di hub (admin hub saja, atau ops lead pusat)?
- Perlukah kapasitas di level SECTION untuk slot lantai tanpa bin (palet lepas)? Mockup mengasumsikan selalu ada bin.

## Changelog

- 2026-10-12 — created (draft, ditunda setelah transfer storage & stock opname); assessment eFishery, mockup v1 empat halaman + simulasi e2e.
- 2026-10-13 — mockup: turntable 0–360°, plakat nama, renderer Canvas 2D + LOD; bagian Performance, reliability & scalability ditambahkan (target angka, payload kolumnar, MV inkremental, canvas/LOD/virtualisasi).
