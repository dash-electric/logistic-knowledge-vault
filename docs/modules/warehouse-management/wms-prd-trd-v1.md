---
title: Warehouse Management MVP
module: warehouse-management
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner: aldi.iskandar@dashelectric.co
engineer:
created: 2026-08-12
links:
  context: ./wms-context-v1.md
  mockup:                # ./wms-mockup-v1.html — not yet produced
  presentation:          # ./wms-product-presentation-v1.html — not yet produced
---

# Warehouse Management MVP — PRD/TRD v1

---

# Part 1 — Product Requirements (PRD)

## Problem

Dash hubs can only cross-dock: goods that arrive must leave on a route within hours, because nothing tracks goods *at rest*. When a client wants us to hold inventory — buffer stock for their outlets, returned goods awaiting disposition, seasonal overflow — we have no bins, no on-hand counts, no expiry tracking, and no audit trail of what went in or out. Storage requests are today either declined or handled off-system on spreadsheets, which means unbilled service, untraceable discrepancies, and no answer to "how much of SKU X does client Y have at hub Z right now?"

## Context

The domain model is adapted from a full-scale reference WMS (see the [context doc](./wms-context-v1.md), § Reference design, for the full adopt/cut table). This PRD deliberately ships the smallest system that keeps the reference's three core invariants — reserve-then-deduct, FEFO allocation, ledger-per-change — and cuts everything else (ERP sync, purchase orders, vendor management, storage hierarchy, approval workflows, inter-hub transfers).

## Users & jobs

- **Hub receiver** — "goods arrived; record what actually came and which bin I put it in."
- **Hub picker** — "show me which bin and lot to pick for this order, let me confirm, then ship it."
- **Ops admin** — "set up bins, create issues for client orders, fix wrong counts, answer stock questions with the ledger."
- **Client** (indirect) — owns the goods; needs their stock to be accurate and FEFO-rotated. No system access in MVP.

## Scope

### In scope

- 3-level storage hierarchy per hub — LOCATION → SECTION → BIN (Postgres `ltree`, same technique as the reference). Locations carry the type (`STORAGE` / `QUARANTINE` / `STAGING`), sections and bins inherit it; every level has active/inactive status.
- Stock records at bin × client × SKU × lot granularity, with on-hand / reserved / available and expiry date. Stock attaches to bins only.
- **Goods receipt** (inbound): draft with lines (SKU, qty, expiry, destination bin), then post — posting increments on-hand and auto-generates lot codes.
- **Goods issue** (outbound): create against a client + free-text order reference; the system auto-allocates lots FEFO and reserves them; picker confirms picking; shipping deducts stock. Cancel releases reservations.
- **Transfer**: atomic bin-to-bin move within one hub (also the quarantine mechanism).
- **Movement ledger**: append-only record of every quantity change, queryable by hub, client, SKU, and document.

### Out of scope

Explicit non-goals — each existed in the reference platform and is cut on purpose:

- Purchase orders, vendors, vendor bills — GR captures `supplier_name` as free text.
- Inter-hub transfers, multi-level approvals — v2 candidate; MVP quarantine transfer covers returns.
- ERP/Odoo/IMS integration of any kind.
- **Stock opname / count adjustments of any kind** (decided 2026-08-12). No in-system mechanism to correct on-hand counts; physical-vs-system discrepancies are tracked off-system until an opname feature ships. This is the MVP's biggest accepted risk — named here so it is a decision, not an oversight.
- Bin capacity tracking and fill-percentage views.
- Product/SKU master and UoM conversion — SKU is a client-declared string, one UoM per line.
- Client-facing portal, billing computation, barcode/handheld scanning flows.
- Partial shipment of a goods issue (a GI ships whole or is cancelled).

## Requirements

1. An ops admin can build a hub's storage tree: locations (with type), sections under a location, bins under a section — each with a code unique per hub and a status. A bin's category and lineage are derivable from its `ltree` path; stock and document lines only ever attach to bins. Inactive storages (at any level) reject new stock but still show existing stock.
2. A receiver can create a GR draft for a hub + client with ≥1 line (SKU, item name, UoM, qty > 0, optional expiry, destination bin) and edit it while `DRAFT`.
3. Posting a GR increments on-hand in each line's bin, stamps an auto-generated lot code (`LOT{yymmdd}{seq}`) per line, and writes one `INBOUND` ledger row per line. Posting is idempotent and irreversible.
4. Creating a GI for a client with requested SKU quantities auto-allocates from bins under `STORAGE` locations only, FEFO (earliest expiry, then oldest lot), reserving each allocated line. If total available is insufficient for any SKU, creation fails whole with per-SKU shortfall detail — no partial reservation survives.
5. A picker can mark a GI `PICKED`; shipping a `PICKED` GI deducts on-hand and reserved per line and writes `OUTBOUND` ledger rows. Cancelling an unshipped GI releases all reservations. Shipped GIs cannot be cancelled.
6. A transfer moves given quantities of specific lots between two bins in the same hub atomically (source available must cover it) and writes `TRANSFER` ledger rows.
7. Stock can be listed by hub with filters (location/section/bin, client, SKU, lot) showing on-hand, reserved, available, and expiry; the ledger can be listed by hub with filters (type, client, SKU, document code, date range).
8. All quantity math happens transactionally: no sequence of concurrent operations can drive `qty_on_hand < qty_reserved` or either below zero (DB constraints enforce this as the last line of defense).
9. Every document records who created/posted/shipped it and when; documents get sequential codes `GR/GI/TRF{yymmdd}{seq5}`.

## Edge cases & failure states

- **Insufficient stock at GI creation** → 422 with per-SKU `requested / available / shortfall`; nothing reserved.
- **Concurrent GIs racing for the same lot** → row-level locking on stock records; loser re-allocates or fails with shortfall.
- **Expired stock** — allocation does not skip expired lots in MVP (client may still want them out); UI flags expiry passed. Disposition = transfer to a quarantine bin.
- **GR posted with wrong quantities** — posting is irreversible and there is no adjustment feature; the correction path is a compensating GR (for under-receipt) or a GI/transfer out (for over-receipt), each leaving its own ledger trail. Ugly but auditable; opname fixes this properly in v2.
- **GR posted to a bin that just went inactive** (or whose parent went inactive) → posting fails per line with the storage named; receiver edits the draft.
- **Empty states** — hub with no bins prompts bin setup before GR; GI against a client with zero stock returns shortfall for every SKU.
- **Duplicate submission** (double-tap on post/ship) → idempotent by document status transition; second call returns the already-transitioned document, not an error.

## Success criteria

- A pilot hub runs a full month of receipts/issues for ≥1 client with **zero off-system spreadsheet tracking**.
- Physical spot-check vs system on-hand at pilot end: discrepancy explained 100% by ledger entries (every gap traceable to a document).
- FEFO holds: no GI ships a younger lot while an older available lot of the same SKU existed under `STORAGE` locations at allocation time (auditable from the ledger).
- Ops can answer "stock of SKU X for client Y at hub Z" in one query/screen.

---

# Part 2 — Technical Requirements (TRD)

## Summary

A new self-contained module inside `nest-logistic-service` (same placement as stop-workflow and docking-dashboard): nine new tables prefixed `wh_`, one internal REST surface under `/v1/warehouse/*`, no external service calls. Storage is a 3-level `ltree` hierarchy (requires the `ltree` Postgres extension — new to this database). Hubs and clients are referenced by external id + JSONB snapshot, matching every other module. All stock mutations run in DB transactions with row locks on `wh_stocks`, guarded by check constraints; every mutation appends to `wh_stock_movements`.

## Architecture

- **Owner:** `nest-logistic-service`, new `warehouse` module (controller → service → Drizzle repository, consistent with existing modules).
- **Boundaries crossed:** reads hub and client masters from core-service at document creation (snapshot pattern — no runtime dependency afterward). Nothing else. Dispatch/route modules are not touched; a shipped GI's `reference` field is the only (soft) link to the delivery world.
- **Concurrency model:** allocation and every stock mutation use `SELECT … FOR UPDATE` on the affected `wh_stocks` rows inside one transaction. Constraints (`qty_on_hand >= qty_reserved`, both `>= 0`) make violation a 500-with-rollback rather than silent corruption.

## API contracts

All under `{{baseUrlLogistic}}/v1/warehouse`, ops JWT, standard `{status, message, data}` envelope. Collection folder: `Logistic Service/Internal/Warehouse/` (added in this change).

```
POST   /v1/warehouse/storages                    create storage node {hubID, code, name, category, type? (LOCATION only), parentID? (required for SECTION/BIN)}
GET    /v1/warehouse/storages?hubID=&category=&type=&status=   flattened rows with location/section lineage (reference's storages_with_parent view shape)
POST   /v1/warehouse/goods-receipts              create draft {hubID, clientID, supplierName?, notes?, lines[{storageID (BIN), sku, itemName, uomName, qty, expiredDate?}]}
POST   /v1/warehouse/goods-receipts/:id/post     DRAFT→POSTED; commits stock, stamps lot codes
POST   /v1/warehouse/goods-issues                create + FEFO reserve {hubID, clientID, reference?, lines[{sku, qty}]}
POST   /v1/warehouse/goods-issues/:id/pick       RESERVED→PICKED {pickerName}
POST   /v1/warehouse/goods-issues/:id/ship       PICKED→SHIPPED; deducts stock
POST   /v1/warehouse/goods-issues/:id/cancel     RESERVED|PICKED→CANCELLED; releases reserve
POST   /v1/warehouse/transfers                   atomic move {hubID, sourceStorageID (BIN), destStorageID (BIN), notes?, lines[{sku, lotNumber, qty}]}
GET    /v1/warehouse/stocks?hubID=&storageID=&clientID=&sku=&lotNumber=   storageID accepts any level — filters to bins under it (ltree descendant query)
GET    /v1/warehouse/movements?hubID=&type=&clientID=&sku=&refCode=&dateFrom=&dateTo=
```

Key error responses: `422 INSUFFICIENT_STOCK` (GI create / transfer, with per-SKU shortfall array), `409 INVALID_STATUS_TRANSITION` (post/pick/ship/cancel on wrong status — response body carries the document's current state so retries are idempotent), `409 STORAGE_INACTIVE`, `409 DUPLICATE_STORAGE_CODE`, `422 STORAGE_NOT_BIN` (document line pointed at a LOCATION/SECTION), `422 INVALID_PARENT` (e.g. BIN parented to a LOCATION, or parent in another hub).

## Data model

Nine tables, added to `docs/modules/erd/erd.mermaid` in this change (`WH_*` block). Highlights:

- `wh_storages` — 3-level hierarchy via an `ltree` `path` column (self-reference by path, no `parent_id` — parent is `subpath(path, 0, nlevel(path)-1)`, category derives from `nlevel`: 1 = LOCATION, 2 = SECTION, 3 = BIN; same technique as the reference). `type` lives on LOCATION rows only and is inherited by descendants. Requires `CREATE EXTENSION ltree` (first use in this database). GiST index on `path` for descendant queries.
- `wh_stocks` — unique `(storage_id, client_id, sku, lot_number)`, `storage_id` must be a BIN; checks `qty_on_hand >= 0`, `qty_reserved >= 0`, `qty_on_hand >= qty_reserved`. All quantities `numeric(12,2)`.
- `wh_stock_movements` — append-only; `type` `INBOUND|OUTBOUND|TRANSFER`; polymorphic `ref_type`/`ref_id`/`ref_code` to the causing document (no FK, same pattern as the reference platform); signed `qty_delta` plus `storage_from_id`/`storage_to_id`.
- Documents (`wh_goods_receipts`, `wh_goods_issues`, `wh_transfers`) carry denormalized `client` / `hub` JSONB snapshots and `created_by` / actor-timestamp columns; lines carry denormalized `sku`/`item_name`/`uom_name` so history reflects values at transaction time.
- No soft delete: documents are never deleted, only status-transitioned; storages deactivate.
- Migrations are purely additive — no existing table changes (plus the `ltree` extension).

## Cross-module impacts

None at the interface level: no existing module is consumed or modified beyond core-service master reads (hubs, clients) that every module already performs. Named explicitly: **inbound/dispatch/route/invoice modules are untouched**; WMS stock is a parallel universe to shipment items in MVP. Bridging a GI into a shipment/route is a v2 decision.

## Failure modes & observability

- Every mutation endpoint is transactional; partial failure = full rollback (this includes multi-line GR posting and GI allocation).
- Idempotency via status transitions: repeating post/pick/ship/cancel on an already-transitioned document returns 409 with current state — safe for client retries.
- Logged/metered: allocation shortfall events (per SKU), constraint-violation rollbacks (should be ~0; alert if > 0/day — indicates a locking bug), GR-post and GI-ship latencies.
- Alert condition: any `wh_stocks` row where `qty_on_hand < qty_reserved` found by a daily integrity sweep (belt-and-braces over the constraint).

## Security & permissions

Ops JWT required on all endpoints (same guard as other internal dashboard modules). No per-hub access control in MVP (the reference had a `warehouse_access` table — cut; revisit when non-ops roles get access). Input validation at DTO layer: qty > 0, enum whitelists, line-array non-empty, bin/hub/client existence.

## Rollout

1. Migrations (additive, incl. `ltree` extension) + module behind env flag `WAREHOUSE_MODULE_ENABLED`.
2. Enable on staging; seed one pilot hub's storage tree; dry-run a scripted receive→issue→transfer cycle.
3. Production enable for the pilot hub only (flag + hub allowlist); run one month against the pilot client.
4. Rollback = disable flag; tables are additive and inert when the flag is off. No backfill needed (greenfield data).

Smallest deployable increment: storages + stocks + GR + ledger (receive-only). GI and transfer can follow in the same release train but are separately mergeable.

## Testing strategy

- **Unit:** FEFO allocator (expiry ordering, lot tiebreak, multi-bin split, shortfall aggregation, quarantine/staging-lineage exclusion); status machines for GR/GI; storage-tree validation (category/parent rules, cross-hub parent rejection).
- **Integration (DB):** concurrent GI allocation on the same lot (locking); GR post idempotency; cancel-releases-reserve; `ltree` descendant queries (stock filter by location/section); constraint violations roll back cleanly.
- **Contract:** every endpoint vs the collection examples (success + failure per request file).
- **Property-style:** random sequences of GR/GI/transfer always keep `on_hand ≥ reserved ≥ 0` and ledger-sum == on-hand per stock record.

## Key decisions & deferred choices

- **Hubs are the warehouses** — no warehouse master table. Constraint: storage trees/stock survive hub deactivation and must be drained manually (documented gotcha).
- **3-level hierarchy kept** (revised 2026-08-12; v1 draft initially flattened to bins) — same LOCATION → SECTION → BIN `ltree` design as the reference. Type lives on the LOCATION and is inherited; stock and document lines attach to BINs only.
- **No stock opname / count adjustment** (decided 2026-08-12) — cut entirely from MVP, including the lightweight adjustment doc an earlier draft had. Discrepancy handling is off-system until v2.
- **One ledger table** replaces the reference's four tracking tables; daily mutation rollups become a query (or materialized view later), not a table.
- **Stock deducts at ship, not at pick** — kept from the reference; picked-but-not-shipped goods remain visible as reserved stock.
- **FEFO not FIFO** — the reference allocated FIFO by lot number; we order by expiry first since expiry is what actually matters, with lot age as tiebreak.
- Deferred to implementer: pagination/sort defaults on list endpoints (follow existing module conventions); exact lot-code sequence scoping (global vs per-hub — either is fine, must be collision-free).

## Open questions

- Does GI need a link to an actual shipment/route (bridge to delivery flow), or does ops re-enter issued goods as a shipment CSV in MVP? Current assumption: re-enter; `reference` field carries the waybill.
- Pilot hub and client selection.
- Should expired lots be excluded from FEFO allocation by default (current answer: no, flag in UI)?
- With opname cut, what is the operational SOP when a pilot count mismatch is found (who tracks it, where) — needed before pilot start.

## Changelog

- 2026-08-12 — created; scope distilled from external reference WMS docs (flow + 52-table ERD) down to 10-table MVP
- 2026-08-12 — kept the reference's 3-level storage hierarchy (`ltree`), was flat bins; cut stock opname/adjustment feature entirely (9 tables now)
