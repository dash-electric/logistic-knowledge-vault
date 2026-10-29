---
title: WMS — Client API stock (GET /v1/integration/stocks) — PRD/TRD v1
module: warehouse-management
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:
engineer:
created: 2026-10-29
links:
  context: ./wms-context-v1.md
  parent: ./wms-prd-trd-v2.md  (§ Client fase 2)
  client-api: ./wms-client-api-outbound-prd-trd-v1.md
  contract: nest-logistic-service docs/api-integration/stock.md
  mockup:
  presentation:
---

# WMS — Client API stock — PRD/TRD v1

Klien (kasus pertama: **Atlas**) membaca stok barangnya di gudang Dash lewat API, dengan kredensial yang sama seperti
API outbound order (`x-api-key` scope `shipments:read`/`all`, atau JWT portal Link).

## Keputusan (Yogi, 2026-10-29)

| # | Keputusan | Alasan |
|---|---|---|
| 1 | **Satu baris per SKU**, dijumlah semua hub — **hub tidak ditampilkan** | "hub gk usah di show": hub mana yang pegang stok urusan Dash; satu order dikirim dari satu hub yang Dash pilih |
| 2 | Query hanya **`search`** (kode SKU / nama item, contains) + **`page`** + **`limit ≤ 100`** | "gk usah ada filter2 dulu"; "max total data 100 aja biar kita gk berat" → `limit > 100` = 400 |
| 3 | `qtyAvailable` = stok **allocatable** (storage ACTIVE di bawah lokasi STORAGE, free qty) — aturan FEFO yang sama dengan pemilihan hub order | Angka yang benar-benar bisa dipakai order; stok karantina/bin nonaktif ikut `qtyOnHand` tapi tidak di `qtyAvailable` |
| 4 | `batches[]` ikut (hub + bin dijumlah, urutan FEFO) + `updatedAt` | Klien farmasi butuh kedaluwarsa per batch; tanpa membuka bin/hub |
| 5 | Sandbox (`dash_test_`): katalog SKU ACTIVE @100 | Konsisten dengan `SANDBOX_STOCK_PER_SKU` yang dicek order sandbox |
| 6 | Read-only, tanpa webhook stok | Poll sesuai kebutuhan; cap 100 baris/panggilan menjaga beban |

## Kontrak

`GET /v1/integration/stocks?search=&page=1&limit=20` → `{ status, data: { data: Stock[], pagination } }`

```
Stock { sku, itemName, uomName, qtyOnHand, qtyReserved, qtyAvailable,
        batches: [{ batchNumber, expiredDate: YYYY-MM-DD | null, qtyOnHand, qtyReserved, qtyAvailable }],
        updatedAt: ISO | null }
```

Detail field, contoh respons, sandbox dan error: `nest-logistic-service/docs/api-integration/stock.md`.

## Teknis

- `WarehouseIntegrationStockController` (`v1/integration/stocks`, `ApiKeyGuard`, `IntegrationExceptionFilter`,
  `@Scopes(SHIPMENTS_READ)`) → `ListIntegrationStocksUseCase` → `WarehouseRepository.listClientStockBySku` (GROUP BY
  sku; `available` = `SUM(CASE WHEN b.status='ACTIVE' AND loc.type='STORAGE' THEN GREATEST(on_hand − reserved, 0))`,
  COUNT(*) atas subquery untuk total, LIMIT/OFFSET) + `listClientStockBatches` (GROUP BY sku, batch, expired_date).
- Dua query per panggilan; tanpa migration, tanpa modul baru. Portal Link read-only spec (`client-portal-read-only.spec`)
  mengecualikan controller ini sebagai client API.
- Uji: use case (live + sandbox + paging) dan controller Fastify (scope, whitelist, 400 limit>100, 403 tanpa client).

## Changelog

- 2026-10-29 — created & implemented (BE branch `feat/wms-outbound-city` follow-up PR).
