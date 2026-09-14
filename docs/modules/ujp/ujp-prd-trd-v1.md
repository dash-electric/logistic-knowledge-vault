---
title: UJP Creation in react-logistic-web
module: ujp
doctype: prd-trd
version: 1
status: superseded
superseded_by: ./ujp-prd-v2.md
product_owner: muhamad.zulfikar@dashelectric.co
engineer:
created: 2026-09-01
links:
  context: ./ujp-context-v1.md
  mockup: ./ujp-mockup-v1.html
  prototype: ./ujp-prototype-v1.html
  simulation: ./ujp-flow-simulation-v1.html
  presentation:
---

# UJP Creation in react-logistic-web — PRD/TRD v1

> **Superseded by [ujp-prd-v2.md](./ujp-prd-v2.md) and [ujp-trd-v2.md](./ujp-trd-v2.md)** (2026-09-11) after the engineering and design reviews. Kept for history; decisions D1–D5 here were revised.

> Port the `logisticdash` UJP (running-cost transport request) creation flow into the REST-based `react-logistic-web` console. Background and the current flow live in [ujp-context-v1.md](./ujp-context-v1.md) — this doc is what we build and how.

---

# Part 1 — Product Requirements (PRD)

## Problem

Ops creates UJPs in a **separate Supabase app** (`logisticdash`), then hand-carries the approved result into the main console as a **CSV import** (`CreateShipment4WModal`). That round-trip is slow and error-prone: the CSV drops the client and coordinates, dates are re-parsed `dd/mm/yyyy`, and there's no single place to see a UJP's status, cost breakdown, or approval trail alongside the shipment it becomes. Evidence: the 4W import code already carries workarounds for UJP label/coordinate mismatches (`direct4wStops.ts` `PLACE_ALIASES`, lane-fold tests), which only exist because the two systems are disjoint.

## Context

`react-logistic-web` is now the console of record for shipments, dispatch, and invoicing. Keeping the *cost-authorization* half of a trip in a second app splits the operational picture and the margin data. With the design-system kit and REST services already in place, UJP creation can live natively here — and the 4W wizard can later read a native UJP instead of a CSV.

## Users & jobs

- **Ops user** — create a UJP for a trip: pick client/route/unit/driver, let costs autofill, review the *uang jalan*, submit for approval.
- **Approver (finance/manager/owner)** — review the cost breakdown and anomaly flags, approve/reject; approval must forward the trip cash and dispatch.
- **Owner** — revert a wrong decision; edit before approval.
- **Downstream (shipments)** — consume an approved UJP to prefill a 4W shipment (later phase).

## Scope

### In scope
- Native **Create UJP** screen (all sections in the context doc), with live running-cost preview.
- **UJP list**, **UJP detail** (with approval trail), and **approval actions** (approve / reject / cancel / revert / edit).
- Driver **and** subcon payee paths; single **and** multidrop; conditional **ring** with address suggestion.
- Server-owned side-effects: schedule auto-create, Google-Sheet mirror (if kept), Spend-Control + Dispatch forwards on approve.
- A `src/services/api/ujp.ts` FE service + routes under `/ujp/*`.

### Out of scope
- Redesigning tariff / margin / `revenue_addons` reporting — UJP only *captures cost*; revenue is computed downstream.
- Rebuilding the 4W CSV import (stays; later reads native UJP).
- Basecamp/Spend-Control and Dispatch internals (BE integration detail, not FE).
- A portal surface for editing `ujp_*` master data (assume masters are seeded/managed elsewhere in Phase 1).

## Requirements

1. A user with create rights can submit a UJP that persists with status `SUBMITTED` and an `approval_logs` entry.
2. The running-cost totals shown match `ujp-calculations.ts` **exactly** for every input combination (ICE, EV, `bbmFixOverride`, e-money `"no"`, subcon).
3. The **e-money `"no"`** case moves the entire Flazz component into Transfer.
4. **Subcon** hides unit/e-money/baseline requirements and bills 100% of `nominalTransfer` to Transfer (Flazz = 0); subcon UJPs are excluded from the Dispatch forward.
5. The **ring** field appears **only** when the selected client has an active `PER_RING` tariff on the delivery date, and is required when shown; the address-based suggestion never auto-picks an ambiguous ring.
6. Autofill works for: route plan → costs/km, master route → costs, vehicle → EV baseline/harga, shift → hours, driver → bank details, subcon → vendor bank details.
7. Validation blocks submit and lists every missing required field (mirrors the context doc's rules), scrolling to the first invalid field.
8. On submit, the server (not the browser) creates the schedule and, if enabled, mirrors to the Google Sheet.
9. An approver can approve/reject from the detail page; approve sets `decided_by/at`, forwards Spend-Control (when `transfer > 0`) and Dispatch (unless subcon), and records each forward in `approval_logs`.
10. Reference IDs follow `^UJP-\d{8}-\d{4}(-\d+)?$` and are server-authoritative.

## Edge cases & failure states

- **Empty masters** — dropdowns show a clear empty state; the form still allows manual entry where the source form does.
- **Sheet/Dispatch/Spend-Control failure on approve** — the decision still commits; the failure is logged to `approval_logs` and surfaced as a toast (matches source behavior — forwards are best-effort, not transactional with the decision).
- **Permission boundary** — non-approvers see the detail read-only; edit/cancel/revert gated per the context doc's role matrix.
- **Combine** — if the second (linked) trip fails to persist, the first must not be orphaned silently; surface the partial result.
- **Delivery date in the past** — blocked at validation (`>= today`, WIB).

## Success criteria

- Ops creates UJPs in `react-logistic-web` with **zero CSV round-trips** for the covered clients.
- A random sample of new UJPs reconciles to the penny against the same inputs computed in `logisticdash` / the Google Sheet.
- Approval-to-dispatch works end to end for at least one live client without manual Supabase edits.

---

# Part 2 — Technical Requirements (TRD)

## Summary

Build a native UJP module: a **`nest-logistic-service`** entity + REST endpoints that own writes, totals recomputation, and the side-effect fan-out; and a **`react-logistic-web`** feature (service module, list/detail/create/approval pages) built on the design-system kit. The money formula and ring heuristic are ported **verbatim** from `logisticdash` (`ujp-calculations.ts`, `ring-match.ts`) and computed on **both** sides — FE for live preview, BE as the source of truth on write.

## Architecture

- **`nest-logistic-service`** owns the `ujp` entity, its master lookups (or proxies to existing masters), totals recomputation, and the create/approve side-effects (schedule, sheet, dispatch, spend-control) that currently run client-side in `logisticdash`. This is the layering fix: **the browser must not orchestrate money.**
- **`react-logistic-web`** owns only presentation + input: `src/services/api/ujp.ts` (axios, mirrors `shipments.ts` conventions), pages under `src/pages/ujp/`, routes in `src/router/routes.tsx`, using `@/components` primitives per `CLAUDE.md` (Modal, Button, Badge, SearchableDropdown, StepIndicator, DatePicker) and Google Maps (already wired) for the picker.
- **Phase-0 fallback (gate G1):** if the BE module can't land first, a thin gateway may keep Supabase `travel_requests` as the store behind the same REST contract, so the FE is written once against `/v1/ujp`.

## API contracts

New collection folder `Logistic Service/UJP/` in `dash-api-collections` (updated in the same work). Indicative shapes:

```
# Masters
GET  /v1/ujp/masters/ops-teams | project-clients | emoney-options | service-types | delivery-types | shifts
GET  /v1/ujp/masters/route-plans
GET  /v1/ujp/masters/subcon-vendors
GET  /v1/ujp/clients/:id/tariff?date=YYYY-MM-DD      # -> { tipe, rings:[{id,nama,ratePerTrip}] }
GET  /v1/vehicles/:id/energy-config?date=            # -> { konsumsiPerKm, hargaEnergi }

# Lifecycle
POST /v1/ujp                    # body = UJP DTO (+ combine?); server recomputes totals, creates schedule, mirrors sheet
GET  /v1/ujp?status=&client=&search=&page=
GET  /v1/ujp/:id                # + approvalLogs[]
PATCH /v1/ujp/:id               # edit, guarded by status/role
POST /v1/ujp/:id/decision       # { action: approved|rejected, note? } -> forwards
POST /v1/ujp/:id/cancel
POST /v1/ujp/:id/revert
POST /v1/ujp/estimate           # optional: server-side recompute for preview parity
```

`POST /v1/ujp` request DTO carries every field in the context doc's data model (camelCase); the server **ignores client-sent totals** and recomputes `totalKmWithMargin`, `estimasiBbmLiter`, `totalBbmCost`, `totalUangJalanFlazz`, `totalUangJalanTransfer`, `estimatedAmount` from the raw inputs before persisting.

## Data model

New entity `UJP` (superset of the `travel_requests` running-cost columns — see the context doc for the field list), plus child collections `ujp_extra_drops` and `ujp_delivery_legs` (normalize the current JSONB, or keep JSONB if the BE prefers), and `ujp_approval_logs`. Status enum `DRAFT | SUBMITTED | APPROVED | REJECTED | CANCELLED`. **`docs/modules/erd/erd.mermaid` must be updated in the same change** with the `UJP` entity and its relations to `clients`, `drivers`, `vehicles`, `subcon_vendors`, `schedules`, and the tariff/ring tables it reads.

Backward compatibility: if Phase-0 keeps `travel_requests`, the new columns already exist; the DTO maps snake_case ↔ camelCase. Reference-ID format is unchanged so existing rows stay valid.

## Cross-module impacts

- **shipments** — later reads an approved UJP to prefill the 4W wizard (replaces CSV); no change required in this phase, but the DTO should expose the fields `direct4wStops.ts` needs.
- **schedules** — created/linked by the BE on UJP create (was client-side); the `ujp_id` link and ring-fill logic move server-side.
- **dispatch / spend-control / sheets** — forward targets on approve; owned by BE.

## Failure modes & observability

- Side-effect forwards (schedule/sheet/dispatch/spend-control) are **best-effort and idempotent**, decoupled from the decision transaction; each attempt writes an `approval_logs` note and emits a metric. Auto-schedule matches by driver+date+shift to stay idempotent on retry.
- Log + alert on: decision committed but Dispatch forward failed (ops must know a driver may not be dispatched); sheet mirror disabled/misconfigured; totals recompute mismatch vs client preview (indicates a formula drift bug).

## Security & permissions

- Create: authenticated ops. Approve/reject: `owner | manager | finance` (`canApproveUjp`). Cancel: requester while submitted/draft. Revert: owner. Edit: owner, or manager while submitted, or requester while submitted/draft.
- Server validates all inputs and **recomputes money** — never trusts client totals. Reference ID is server-generated.

## Rollout

1. **Phase 0** — BE UJP entity + master endpoints (or Supabase gateway); FE `ujp.ts` + read-only list. *Gate G1.*
2. **Phase 1** — Create screen with live totals + server recompute; server-side schedule + sheet.
3. **Phase 2** — Detail + approval (approve/reject/cancel/revert/edit) + approval dashboard anomaly flags (T1/T2/T3).
4. **Phase 3** — Combine, multidrop legs, subcon, ring auto-suggest, then wire the 4W wizard to read native UJP.

Smallest safe increment: Phase 0 read-only list behind a feature flag. Rollback = hide the routes; no destructive migration if Phase-0 reuses `travel_requests`.

## Testing strategy

- **Unit (must-cover):** the ported `calculateUjpTotals` across ICE / EV / `bbmFixOverride` / e-money `"no"` / subcon; `suggestRingId` including the ambiguous→null case; reference-ID regex.
- **Contract:** `POST /v1/ujp` recompute matches FE preview for a fixture matrix; masters shapes match the collection.
- **Integration:** approve → schedule linked, Dispatch forwarded (non-subcon), Spend-Control forwarded when `transfer > 0`, sheet decision written; revert removes the schedule.

## Key decisions & deferred choices

- **D1** Port `ujp-calculations.ts` and `ring-match.ts` verbatim; compute on FE (preview) **and** BE (truth).
- **D2** Use `@/components` design-system primitives only (no bespoke inputs) per `react-logistic-web/CLAUDE.md`.
- **D3** All side-effects move server-side.
- **D4** Google Maps replaces Mapbox for picker + distance.
- **D5 (recommended)** Present the create flow as a `StepIndicator` wizard rather than one long scroll; deferred to the implementing engineer, but section order and validation must match the context doc.

## Open questions

- **G1 (blocker)** Native `nest-logistic-service` UJP module vs Supabase-behind-a-gateway for Phase 0?
- **G2** Migrate historical `travel_requests` UJPs, or keep read-only in `logisticdash`?
- **G3** Keep the Google-Sheet mirror once native list/detail exist?
- **G4** Reuse existing `drivers`/`vehicles`/`clients` masters in the target BE, or replicate the `ujp_*` masters?

## Changelog

- 2026-09-01 — created; PRD/TRD for porting UJP creation into react-logistic-web, with server-owned side-effects and verbatim formula reuse.
