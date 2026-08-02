---
title: Shipment API Integration (Client)
module: shipment-api-integration
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:           # owns Part 1 (PRD)
engineer:                # owns Part 2 (TRD)
created: 2026-07-31
links:
  context: ./shipapi-context-v1.md
  mockup: ./shipapi-mockup-v1.html
  presentation: ./shipapi-product-presentation-v1.html
---

# Shipment API Integration (Client) — PRD/TRD v1

---

# Part 1 — Product Requirements (PRD)

## Problem

What problem are we solving, for whom, and how do we know it's real? Link evidence (support tickets, ops reports, data) rather than asserting.

## Context

Why now? What changed? How does this fit current priorities? (Module background belongs in the context doc — link it, don't repeat it.)

## Users & jobs

Who touches this feature and what are they trying to get done? Be specific about roles (e.g. dispatcher, driver, ops admin), not "users".

## Scope

### In scope
-

### Out of scope
-

Explicit non-goals prevent scope creep during AI-assisted drafting. Be aggressive here.

## Requirements

Numbered, testable statements. Each one should be verifiable in the post-ship review.

1.
2.

## Edge cases & failure states

What happens when things go wrong? Empty states, permission boundaries, partial failures, offline behavior.

## Success criteria

How will the post-ship review judge this? Observable outcomes, not vanity metrics.

---

# Part 2 — Technical Requirements (TRD)

## Summary

One paragraph: the technical approach in plain language. A reviewer should grasp the shape of the change before reading further.

## Architecture

Which service(s)/module(s) own this, what crosses boundaries, and through which interfaces. Note anything that violates current layering and why.

## API contracts

Endpoints, DTOs, events. Shapes below are mirrored in `dash-api-collections/collections/Development/Logistic Service/Integration/` (updated in the same change). Auth: folder-level bearer `{{h2hToken}}`. Envelope: `{ "status": "Success" | "Failed", ... }` per existing integration endpoints. Status vocabulary: Status Model v2 only (custody) + `tracking_statuses` template codes (milestones).

### C1 — Track shipment with history (extends existing endpoint, additive)

```
GET /integration/v1/shipments/{waybill}
```

Extends the existing response. Every existing field is preserved; additions are marked NEW.

```jsonc
{
  "status": "Success",
  "data": {
    "waybill": "DL123",
    "status": "IN_DISPUTE",                  // v2 shipment rollup
    "hasReturn": true,
    "type": "DOCKING",                       // NEW — DOCKING | DIRECT_2W | DIRECT_4W
    "returnToOrigin": false,                 // NEW
    "itemsSummary": { "total": 3, "scanned": 3, "byStatus": { "COMPLETED": 2, "IN_RETURN": 1 } },
    "items": [
      {
        "itemId": "…", "itemName": "P3", "status": "IN_RETURN", "condition": null,
        "return": { "reasonCode": "R4b", "reasonLabel": "Produk tidak sesuai pesanan", "weight": 2.5 },
        "activeLeg": { "seq": 2, "type": "RETURN_TO_HUB", "deliveryUid": "DE-01-R", "deliveryStatus": "IN_DELIVERY" },   // NEW — v2 §9
        "legs": [                            // NEW — v2 §9, from item_delivery_legs
          { "seq": 1, "type": "LAST_MILE",     "deliveryUid": "DE-01",   "deliveryStatus": "COMPLETED" },
          { "seq": 2, "type": "RETURN_TO_HUB", "deliveryUid": "DE-01-R", "deliveryStatus": "IN_DELIVERY" }
        ]
      }
    ],
    "timeline": [                            // merged, ascending occurredAt
      { "type": "STATUS",                    // NEW field on existing entries
        "code": "AT_HUB", "entity": { "type": "shipment" },
        "message": "First item verified at hub", "occurredAt": "2026-07-27T03:05:12Z" },
      { "type": "MILESTONE",                 // NEW entry kind — stepper submissions
        "code": "PICKING_UP",                //   tracking_statuses.code
        "name": "Sedang Dijemput",           //   tracking_statuses.name (label)
        "isFinal": false,
        "stepperName": "Gate In",            //   snapshot from shipment_milestone_history
        "proofType": "POP",
        "stop": { "sequence": 1, "stopType": "PICKUP", "isReturnLeg": false, "name": "Gudang Client A" },
        "attachments": [
          { "key": "KEY_PASS", "label": "Gate Pass",
            "images": [ { "url": "https://…", "capturedAt": "2026-07-27T02:58:41Z", "lat": -6.2151, "long": 106.8451 } ] }
        ],
        "occurredAt": "2026-07-27T03:02:10Z" }
    ]
  }
}
```

Rules:
- **Timeline merge**: `shipment_status_history` + `item_status_history` → `STATUS` entries; `shipment_milestone_history` (+ joined proof/form snapshot) → `MILESTONE` entries. Ordered by `occurredAt` ascending; on equal timestamps `STATUS` sorts before `MILESTONE`, then insertion order — deterministic, so a client diffing two polls never sees entries swap.
- **Additivity**: existing clients that ignore unknown fields keep working; `type` is present on every entry.
- **Vocabulary**: `STATUS.code` ∈ v2 item+shipment statuses only; `MILESTONE.code` ∈ `tracking_statuses` seed only. Never DS-internal, batch/dispatch, or legacy values.
- Errors: `404` unknown or other-tenant waybill (existing shape, unchanged).

### C2 — Create single-drop shipment

```
POST /integration/v1/shipments/single-drop
```

One origin → one destination. Sibling endpoints `/multi-drop`, `/multi-pickup` follow in their own contracts (same conventions).

```jsonc
// Request
{
  "bookingId": "BK-2026-0731-001",         // required, ≤64 chars, unique per client (idempotency key)
  "type": "DOCKING",                        // optional — DOCKING | DIRECT_2W | DIRECT_4W, default DOCKING
  "returnToOrigin": false,                  // optional, default false
  "origin": {                               // required for DIRECT_*; optional for DOCKING (set at hub inbound scan)
    "name": "Gudang Client A", "address": "Jl. …",
    "lat": -6.2151, "long": 106.8451,       // optional — lane cache / geocoding resolves when absent
    "phone": "+62811…"
  },
  "destination": {                          // required
    "name": "Apotek Sehat", "address": "Jl. …", "lat": -6.2001, "long": 106.8167, "phone": "+62812…"
  },
  "sender":   { "name": "PT Client A", "phone": "+62811…" },
  "receiver": { "name": "Apotek Sehat", "phone": "+62812…" },   // required
  "items": [                                // required, min 1
    { "itemName": "P1", "invoice": "PO-123", "description": null,
      "quantity": 1, "koli": 1, "weight": 2.5, "volume": 0.01, "price": 150000 }
  ]
}

// 201 Created
{ "status": "Success",
  "data": { "waybill": "DL401", "bookingId": "BK-2026-0731-001", "type": "DOCKING",
            "status": "CREATED", "returnToOrigin": false, "itemsCount": 1,
            "createdAt": "2026-07-31T08:00:00Z" } }
```

Idempotency (decided: bookingId + payload fingerprint):
- Dedup key stays `(client_id, booking_id)` — existing partial-unique index semantics.
- On create, persist a **canonical-JSON SHA-256 fingerprint** of the request (sorted keys, no insignificant whitespace, defaults materialized) on the shipment.
- Retry with same `bookingId` + **identical fingerprint** → `200` with the existing shipment and `"idempotentReplay": true` — safe under client retries and Cloud-Tasks-style redelivery.
- Same `bookingId` + **different fingerprint** → `409 Conflict`: `{ "status": "Failed", "message": "bookingId already used with a different payload", "error": "Conflict", "data": { "waybill": "DL401" } }`. Never silently ignore changed payloads (this replaces today's silent-EXISTS behavior for this endpoint).

Validation (422 with per-field errors): `bookingId` required ≤64 · `type` in enum · `items` min 1, `weight > 0`, `quantity ≥ 1`, `koli ≥ 1` · `destination.address/lat/long` required · `origin` required iff `type` is `DIRECT_*` · `receiver.name/phone` required · `itemName` unique within request.

Data-model note: requires one new column — `shipments.request_fingerprint` (text, nullable; set only by integration creates). Recorded in the [multidrop scoped ERD](../shipment-multi-drop/multidrop-erd-v1.md).

## Data model

New/changed entities, migrations, indexes. Note backward compatibility for in-flight data. **Update `docs/modules/erd/erd.mermaid` in the same change.**

## Cross-module impacts

Which other modules consume or are consumed by this change? List the interfaces touched.

## Failure modes & observability

Error handling strategy, retries/idempotency where relevant, what gets logged/metered, and what alert would tell us this is broken in production.

## Security & permissions

AuthZ rules, data exposure, input validation boundaries.

## Rollout

Migration order, feature flags, backfill, rollback plan. What's the smallest safely deployable increment?

## Testing strategy

What must be covered before merge: unit boundaries, integration paths, contract tests.

## Key decisions & deferred choices

Non-obvious choices made here (and why), plus choices intentionally left to the implementing engineer/agent with the constraints they must respect.

## Open questions

Anything unresolved at handoff.

## Changelog

- 2026-07-31 — scaffolded from template; requirements not yet gathered
- 2026-07-31 — API contracts drafted for C1 (tracking with merged STATUS/MILESTONE timeline, legs, attachments — additive extension of GET shipment) and C2 (create single-drop; per-shape path under /integration/v1; bookingId + payload-fingerprint idempotency, 409 on changed payload). Mirrored into the Integration collection. Rest of the doc still template.
