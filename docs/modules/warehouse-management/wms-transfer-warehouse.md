# WMS — Transfer warehouse (antar hub)

> Status: kontrak implementasi (2026-10-17). Mengikuti pola **Transfer Warehouse eFishery** (request `TRF-EXT` →
> approval hub asal → approval hub tujuan → pengiriman → penerimaan), dipasang di atas alur Dash WMS v2 yang sudah ada
> (outbound order `TRANSFER` → picking → shipping → PO `TRANSFER` di hub tujuan → GR). Repo: `nest-logistic-service`
> (`src/modules/warehouse`, branch `feat/wms-transfer-warehouse`), `react-logistic-web` (`src/pages/warehouse`).

## Ringkasan

Transfer warehouse adalah **dokumen permintaan** pindah stok satu client dari hub asal ke hub tujuan. Bedanya dengan
membuat outbound order `TRANSFER` langsung: ada **dua tahap approval** (hub asal lalu hub tujuan), **alasan transfer**,
**snapshot stok tersedia** per SKU saat request, **tolak dengan alasan**, dan **timeline**. Begitu disetujui hub
tujuan, WMS otomatis menerbitkan outbound order `TRANSFER` (hub asal → hub tujuan) dan sisa alur memakai fitur yang
sudah ada: picking order (reserve FEFO), ready to pick up, submit shipping (terbit PO `TRANSFER` di hub tujuan), goods
receipt di hub tujuan. Status transfer setelah approval **diproyeksikan** dari order dan PO tersebut, tidak disimpan dua kali.

Padanan eFishery → Dash:

| eFishery | Dash |
|---|---|
| `company` | client (`clientID`, stok WMS per client) |
| `warehouse_source` / `warehouse_destination` | hub asal (`hubID`) / hub tujuan (`destinationHubID`), snapshot nama + kode |
| `qty_available` (IMS) snapshot | `qtyAvailable` = allocatable (on hand − reserved) di hub asal saat request |
| reserve IMS saat request, rollback saat reject | **tidak** reserve saat request; reserve terjadi saat picking order dibuat (alur existing). Validasi `qty ≤ qtyAvailable` saat request |
| `1ST_APPROVAL` (source) / `APPROVED` (destination) | `FIRST_APPROVED` / `APPROVED` |
| `WAITING_TO_PREPARE` | `APPROVED` (order `OPEN`, belum ada picking order) |
| `PREPARING / READY_TO_PICKUP / SHIPPED` | proyeksi dari status outbound order |
| `PARTIAL_RECEIPT / RECEIVED` | proyeksi dari `receiptStatus` PO `TRANSFER` di hub tujuan |
| `FAILED_SYNC_ODOO` + sync ulang | tidak ada (tanpa Odoo) |
| `transfer_warehouse_history` | `wh_hub_transfer_events` (timeline) |

## Status

Disimpan di `wh_hub_transfers.status` hanya siklus permintaan: `REQUESTED → FIRST_APPROVED → APPROVED`, atau
`REQUESTED | FIRST_APPROVED → REJECTED`. **Status efektif** (`status` di API) untuk `APPROVED` diturunkan dari order:

| Order (`wh_outbound_orders.status`) | PO `TRANSFER` (`receipt_status`) | Status transfer |
|---|---|---|
| `OPEN` | — | `APPROVED` (menunggu disiapkan) |
| `PREPARING` | — | `PREPARING` |
| `READY_TO_PICKUP` | — | `READY_TO_PICKUP` |
| `SHIPPED / IN_DELIVERY / DELIVERED / FAILED` | `SCHEDULED` / null | `SHIPPED` |
| idem | `PARTIAL_RECEIPT` | `PARTIAL_RECEIPT` |
| idem | `FINISHED` | `RECEIVED` |
| `CANCELLED` | — | `CANCELLED` (order dibatalkan setelah approval) |

Daftar nilai `HubTransferStatus`: `REQUESTED, FIRST_APPROVED, APPROVED, PREPARING, READY_TO_PICKUP, SHIPPED,
PARTIAL_RECEIPT, RECEIVED, REJECTED, CANCELLED`. Filter status dan badge tab dihitung di SQL dengan ekspresi yang sama
(join `wh_outbound_orders` dan `wh_purchase_orders.transfer_outbound_order_id`), jadi badge selalu sama dengan tabel.

## Aksi & aturan

- **Request** (`POST /hub-transfers`): hub asal ≠ hub tujuan; client wajib; minimal 1 baris; SKU ada di katalog client
  (aktif); qty > 0, maks 2 desimal; `qty ≤ qtyAvailable` di hub asal (422 `INSUFFICIENT_STOCK` dengan shortfall per SKU);
  SKU tidak boleh dobel; `expectedDeliveryDate` ≥ hari ini (WIB); alasan (`notes`) opsional maks 500. Kontak & tujuan
  pengiriman disimpan di dokumen: `recipientName` (default nama hub tujuan), `recipientPhone` (wajib, format HP
  Indonesia), `destinationAddress`, `destinationLatitude/Longitude` (FE isi dari master hub/pitstop, bisa diubah),
  `destinationNotes`. Kode `TRF-EXT-{MMDDYY}-{RAND4}` (WIB). Event `REQUESTED`.
- **Approve hub asal** (`POST /hub-transfers/:id/first-approve`): hanya dari `REQUESTED` → `FIRST_APPROVED`. Idempoten
  (sudah `FIRST_APPROVED` → 200 tanpa perubahan). Event "Disetujui hub asal".
- **Approve hub tujuan** (`POST /hub-transfers/:id/approve`): hanya dari `FIRST_APPROVED` → `APPROVED`, dan **dalam
  transaksi yang sama** membuat outbound order `TRANSFER` (source `MANUAL`, `externalID` = kode transfer, hub asal,
  client, `destinationHub`, recipient/destination dari dokumen, lines = baris transfer) + event order pertama; link
  `outbound_order_id`. Validasi order (katalog, tanggal) dijalankan ulang: gagal → 422 `VALIDATION`, tidak ada yang
  ditulis. Stok **tidak** di-reserve di sini (sama seperti order manual). Event "Disetujui hub tujuan · order {code}".
- **Tolak** (`POST /hub-transfers/:id/reject {reason}`): dari `REQUESTED | FIRST_APPROVED` → `REJECTED`, alasan wajib
  (maks 500). Event "Ditolak" dengan alasan.
- Aksi lain (`INVALID_STATUS_TRANSITION` 409 membawa `currentStatus`): approve pada status lain, reject setelah approved.
  Membatalkan setelah approved = cancel outbound order-nya (fitur existing) → transfer terbaca `CANCELLED`.
- Otorisasi: ops JWT `ADMIN` (sama seperti dokumen WMS lain). Tidak ada role per hub; label aksi di UI menyebut hub mana
  yang menyetujui dan timeline mencatat aktor.

## Endpoint (`/v1/warehouses`)

```
POST   /hub-transfers                         body di bawah → 201 {detail}
GET    /hub-transfers?hubID=&side=&clientID=&status=&destinationHubID=&sourceHubID=&createdBy=&search=&dateFrom=&dateTo=&page=&limit=
       hubID = hub konteks halaman; side = SOURCE|DESTINATION|ANY (default ANY: hub asal ATAU hub tujuan = hubID)
GET    /hub-transfers/summary?…filter sama…  {counts: {<status>: n}, total}
GET    /hub-transfers/:id                     {…summary, lines[], events[], outboundOrder, transferPurchaseOrder}
POST   /hub-transfers/:id/first-approve       → detail
POST   /hub-transfers/:id/approve             → detail (order TRANSFER terbit)
POST   /hub-transfers/:id/reject {reason}     → detail
```

Body request:

```json
{
  "hubID": 906, "hubName": "Dash Hub Kemang", "hubCode": "KMG",
  "destinationHubID": 874, "destinationHubName": "Dash Hub Blok M", "destinationHubCode": "DASH-BLOK-M",
  "clientID": 6, "clientName": "SwipeRX", "clientCode": "SWRX",
  "expectedDeliveryDate": "2026-10-20",
  "notes": "Restock hub Blok M",
  "recipientName": "Dash Hub Blok M", "recipientPhone": "081234567890",
  "destinationAddress": "Jl. Melawai Raya, Blok M, Jakarta Selatan",
  "destinationLatitude": -6.2443, "destinationLongitude": 106.7991, "destinationNotes": "",
  "lines": [{ "sku": "AMX-500", "qty": 12 }]
}
```

Summary (list row):

```
id, code, status (efektif), hubID, hub{id,name,code}, destinationHubID, destinationHub{…}, clientID, client{id,name},
expectedDeliveryDate, notes, lineCount, totalQty, createdBy, createdAt, updatedAt,
firstApprovedAt/By, approvedAt/By, rejectedAt/By, rejectReason,
outboundOrder {id, code, status} | null, transferPurchaseOrder {id, code, receiptStatus} | null
```

Detail = summary + `recipientName, recipientPhone, destinationAddress, destinationLatitude, destinationLongitude,
destinationNotes, lines[{lineNo, sku, itemName, uomName, qtyAvailable, qty}], events[{id, status, title, note, actor,
occurredAt}]` (events terbaru dulu).

## Data model

- `wh_hub_transfers`: id, code (unique), hub_id + hub jsonb, destination_hub_id + destination_hub jsonb, client_id +
  client jsonb, status (check), notes, expected_delivery_date (date), recipient_name, recipient_phone,
  destination_address, destination_lat, destination_long, destination_notes, outbound_order_id (fk, unique, null),
  first_approved_at/by, approved_at/by, rejected_at/by, reject_reason, created_by, created_at, updated_at.
  Index: (hub_id, created_at desc), (destination_hub_id, created_at desc), (client_id), (status).
- `wh_hub_transfer_lines`: id, hub_transfer_id (cascade), line_no, sku, item_name, uom_name, qty_available numeric(12,2),
  qty numeric(12,2) > 0, created_at.
- `wh_hub_transfer_events`: id, hub_transfer_id (cascade), status, title, note, actor, occurred_at.
- Satu migrasi `01xx_wms_hub_transfers` (drizzle-kit generate). Tanpa perubahan tabel lain.

## UI (react-logistic-web)

Menu **Stock control → Transfer warehouse** (di bawah Transfer storage), path `/warehouse/hub-transfer`.

- **List**: tab `Semua · Menunggu approval (REQUESTED+FIRST_APPROVED) · Diproses (APPROVED..SHIPPED) · Selesai
  (RECEIVED) · Ditolak (REJECTED+CANCELLED)` dengan badge dari `/summary`; kolom ID transfer · Client · Hub asal → Hub
  tujuan · Tanggal pengajuan · Pemohon · Estimasi kirim · Baris / qty · Status · aksi (Detail). Filter: client, hub asal,
  hub tujuan, pemohon, tanggal pengajuan, status; search kode / SKU / nama produk. Hub konteks halaman = asal atau tujuan.
  Tombol "Buat transfer".
- **Buat transfer** (wizard 3 langkah seperti Transfer storage): Informasi (hub asal = hub konteks, hub tujuan,
  client, estimasi kirim, alasan, kontak & alamat hub tujuan yang terisi dari master hub dan bisa diubah) → Daftar
  produk (SKU dari katalog client, kolom "Tersedia di hub asal" dari `/stocks/availability`, qty; dobel/kelebihan
  ditandai) → Review → Ajukan.
- **Detail**: header kode + status badge + aksi sesuai status (`Approve (hub asal)` / `Approve (hub tujuan)` / `Tolak`
  dengan alasan); kartu Informasi transfer (client, hub asal → hub tujuan + alamat, estimasi kirim, alasan, pemohon),
  Daftar produk (SKU, produk, UoM, tersedia saat request, qty transfer), Dokumen terkait (outbound order, PO transfer,
  tautan ke halaman masing-masing), Timeline (events + "Menunggu approval hub asal/tujuan" sebagai langkah berikutnya).
