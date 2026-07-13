---
title: Docking Analytics Dashboard
module: docking-dashboard
doctype: prd-trd
version: 1
status: draft
product_owner: aldi.iskandar@dashelectric.co
engineer:
created: 2026-07-10
links:
  context: ./dock-context-v1.md
  mockup: ./dock-mockup-v1.html            # deferred — see Open questions
  presentation: ./dock-product-presentation-v1.html  # deferred — see Open questions
---

# Docking Analytics Dashboard — PRD/TRD v1

---

# Part 1 — Product Requirements (PRD)

## Problem

Leadership can only see hub docking performance through hand-built weekly update decks. The numbers exist (the 30 Jun 2026 weekly update reports hub scan at 8.1s median/pkg, preview→commit at 8m 15s, rider scan at 19.3s/item across three hubs), but each week someone assembles them by hand, single-week snapshots hide trends, and thin samples get hand-written caveats ("Jakarta Barat is a 1-day sample"). Rollout decisions — Jakarta Pusat vs Malang is on the table right now — are being made from one-week, hand-collated snapshots.

There is a second, subtler problem the weekly deck works around manually: **raw totals mislead without volume context**. Jakarta Selatan's 45m 3s of inbound scanning is the *best* per-item performance in the network (8.1s/pkg across 2,488 packages), but a total-time table alone reads as "slowest hub". Every view must pair time with volume, and lead cross-hub comparison with velocity (sec/item).

Evidence: `weekly-update-2026-06-30.html` (outside the vault — evidence, not spec; definitions restated in [dock-context-v1.md](./dock-context-v1.md)); the 2026-06-25 scoping session decisions recorded in the context doc.

## Context

The write side (daily 00:00 WIB ETL into `DASHBOARD_HUB_DAILY_SNAPSHOTS`) and all 13 endpoint contracts already exist — the contracts as ground truth in the API collection (`Logistic Service/Dashboard/` + `Internal/Dashboard/`, per vault rule 1), and an implementation of both halves on the service's **unmerged `feat/dashboard` branch** (verified 2026-07-12; see context doc gotchas for merge-drift state). What has never shipped is any of it: the branch must be brought to main, and the leadership-facing surface built. This PRD (a rebuild — the prior v1 doc was deleted from the vault) specifies the dashboard page, documents the contract baseline, and adds three metric extensions accepted in the 2026-07-10 review: the volume↔velocity correlation chart, the stage waterfall with idle gaps, and the volume-stress indicator.

Read the module [context doc](./dock-context-v1.md) first — it defines the docking stages, all metric semantics, and the standing product decisions (leadership audience, daily cadence, MA-for-trends, velocity-first comparison, ink-default charts).

## Users & jobs

- **Leadership / management (primary):** "Which hubs are performing, which way are they trending, and where do I intervene or roll out next?" Opens the dashboard on the ops portal, weekly by habit and mid-week around decisions.
- **Product/ops analyst (secondary):** pulls the week's numbers for the weekly product update; verifies a field report ("dispatch feels slow in Bekasi") against the trend.
- **On-call engineer (tertiary):** confirms the dashboard is healthy — coverage, staleness, ETL status — when a number looks wrong.

Not a user: hub floor operators and riders. Floor-level live views belong to the inbound module.

## Scope

### In scope

- Ops-portal **Docking dashboard page**: hub selector (single hub or all-hubs), window selector (`1d | 7d | 30d | 90d`), optional `asOf` day anchor for historical views. Default: all-hubs, `7d`, latest data.
- **Stage velocity metrics** per the existing contract: inbound, dispatch, rider scan — MA headline + trend, per-day series, distribution (min/median/max) where the contract provides it.
- **Volume context everywhere:** every total is paired with its volume; the cross-hub table leads with velocity.
- **Cross-hub comparison** (table on all-hubs view + `compare` endpoint charts).
- **Planner stress, throughput, zone breakdown, coverage** panels per the existing contract.
- **Volume ↔ velocity correlation chart** (new, UI-only): day-level scatter of volume vs stage velocity.
- **Stage waterfall with idle gaps** (new): per-cycle gap1 (inbound→preview) and gap2 (commit→handover), median across cycles; one new endpoint.
- **Volume-stress indicator** (new): window avg items/day vs trailing-30-day p90, banded; added to overview + detail responses.
- **`asOf` parameter** (new, contract extension): anchor any read endpoint to a historical date.
- **Data-quality surfacing:** INSUFFICIENT_SAMPLES, lowCoverage, stale, per-day etlStatus, null-not-zero rendering.

### Out of scope

- Real-time/live backlog, alerts, floor-ops signals — inbound module owns these (standing decision).
- Hour-of-day heatmap UI, CSV/deck export, release markers on trends — rejected in the 2026-07-10 review.
- AI weekly summary and auto-generated weekly deck — vision-level future consumers of this API, not this version.
- Write-side/ETL *logic* changes — the ETL exists on `feat/dashboard`; merging it to main is a rollout step of this feature, but changing what it captures is out of bounds.
- `pendingMetrics` activation (`rider_packing_time`, `zero_overnight_rate`, `dock_time_distribution`) — blocked on delivery-service integration; contract slots reserved.
- Arbitrary `from`/`to` date ranges — `asOf` + window enum covers the need; see Open questions.
- New user/role management — the page uses existing portal auth.

## Requirements

Each requirement is verifiable in the post-ship review.

1. The portal page renders an **all-hubs overview** listing every hub with: MA headline + trend arrow + % change for each of the three stage velocities, planner stress, scanned count, volume-stress band, and a lowCoverage badge where coverage < 0.8 — matching `GET /v1/dashboard/hubs`.
2. Selecting a hub renders the **hub detail view** with all sections of `GET /v1/dashboard/hubs/{id}` (velocities, planner stress, throughput totals, zone breakdown headline, coverage, pending metrics listed as "coming soon" with their reason).
3. Each stage velocity has a **trend panel**: per-day bars/points (`secPerItem`) with the 7-day MA line (`maSecPerItem`), rendered ink-default; the MA line is the visually dominant element (standing decision: MA for trends).
4. Rider scan velocity shows its **within-window distribution** (min / median / max, sample size) alongside the MA headline (standing decision: median is a distribution stat, not a trend smoother).
5. Every **total time or count is displayed with its volume context** (e.g. "45m 3s · 2,488 pkgs · 191/day"); no total appears without volume on the same visual element.
6. The **cross-hub table sorts by velocity by default**, shows volume as context columns, and never offers items/hour as a comparison column.
7. The **correlation chart** plots one dot per day (x = items scanned, y = stage velocity sec/item) for the selected hub and stage, with a stage switcher; in all-hubs mode it renders small multiples per hub (no multi-color single scatter). Chart is ink-default per GSM.
8. The **stage waterfall** renders, for the selected hub and window: median inbound duration → median gap1 → median preview→commit duration → median gap2 → median rider scan duration, with per-cycle counts and an `overlappedCycles` indicator when clamped-negative gaps occurred.
9. The **volume-stress indicator** shows the ratio and band — NORMAL [0, 0.8), ELEVATED [0.8, 1.0], AT_CEILING > 1.0 — per hub; hubs with 14–29 days of history show a short-history badge; hubs with <14 days show "insufficient history", not a value.
10. **Data-quality states are first-class:** null values render as "—" (never 0); INSUFFICIENT_SAMPLES renders an explicit thin-data state; `freshness.stale` renders a banner with `dataAsOf`; per-day etlStatus is inspectable on the coverage panel.
11. Days with `etl_status` FAILED or PARTIAL are **excluded from every aggregate and MA**; EMPTY days count as zero-activity days. The **coverage ratio counts included days only** (a present-but-PARTIAL day does not count as "present"), and the coverage response carries an explicit `excludedDays` count — an exclusion can never be invisible at the ratio level.
12. With `asOf=YYYY-MM-DD` the page (and every read endpoint) anchors its window to that date; default remains latest. Future dates are rejected.
13. The default view is **all-hubs, window `7d`, latest data**, loading in under 2 seconds at current scale (p99 API < 500ms for the overview call).
14. All timestamps and date boundaries are **WIB (Asia/Jakarta)**, matching the ETL and the contract's `freshness.timezone`.
15. Every figure uses **tabular numerals**; the page follows the GSM (one accent color as punctuation, hairline rules, no gradients/shadows).
16. The read API returns **aggregates only** — no raw item/batch rows (which contain addresses and phone numbers) ever appear in any response.

## Edge cases & failure states

- **New hub, thin history (the Jakarta Barat case):** INSUFFICIENT_SAMPLES on velocities, INSUFFICIENT_HISTORY on volume stress; page renders states, not errors, and never extrapolates.
- **ETL failed/partial for a day:** day excluded from aggregates (R11); coverage drops; below 0.8 the hub is badged lowCoverage everywhere it appears.
- **ETL late (stale):** banner "data through {dataAsOf}" on every view; no attempt to compute the missing day.
- **Zero-activity day (EMPTY):** a genuine zero-volume day — appears as zero volume, velocity null ("—").
- **Empty window (no rows at all):** dedicated empty state naming the window and hub, offering the closest window with data.
- **Single-day window (`1d`):** trend panels collapse to distribution-only; MA suppressed (needs ≥4 included days); in-progress day renders the contract's zero-sample shape.
- **Negative idle gaps** (preview created before inbound finished — expected once "preview before inbound" ships): clamped to 0 in the median but counted and surfaced as `overlappedCycles` so the model's shift is visible, not hidden.
- **Multi-dispatch days:** gaps and dispatch durations computed per cycle and aggregated as the median across cycles; never assume one dispatch per day (real data shows 2+).
- **Cross-midnight items:** every event attributes to the WIB date of its own timestamp; items present in two snapshot rows are not double-counted.
- **Permission failure:** portal session expired/unauthorized → portal's standard re-auth flow; the page never renders cached figures to an unauthenticated user.
- **Slow/failed API call:** per-panel skeleton loading; per-panel error state with retry — one failing panel must not blank the page.
- **User navigates mid-load / rapid selector changes:** in-flight requests cancelled or ignored by request token; last selection wins; no flash of mismatched hub data.

## Success criteria

- Post-ship weekly updates source their docking numbers from the dashboard (spot-check: the deck's numbers reconcile with the dashboard for the same window).
- **Golden reconciliation passes:** dashboard values for the 2026-06-24→30 window match the hand-computed 30 Jun weekly deck within rounding.
- The next hub-rollout discussion references dashboard trends (leadership actually uses it — ask them).
- Zero incidents of a misleading number traced to silent data-quality inclusion (FAILED/PARTIAL leakage into aggregates).
- On-call can answer "why is this number weird" from the coverage panel + logs alone, without reading ETL code.

---

# Part 2 — Technical Requirements (TRD)

## Summary

Add a read-side metrics service to `nest-logistic-service` that computes docking metrics from `DASHBOARD_HUB_DAILY_SNAPSHOTS` JSONB at query time (compute-on-read), exposed at `/v1/dashboard/*` behind portal bearer auth, per the pre-existing collection contract. Add one new endpoint (stage timeline), extend two responses (volumeStress) and all read endpoints with an optional `asOf` anchor. Build one ops-portal page consuming it. No schema changes; a per-(hub, day) computed-stats cache keeps latency flat since snapshot rows are immutable after ETL.

## Architecture

```
  Ops portal (new Docking page)
      │  bearer providerTokenPortal
      ▼
  nest-logistic-service
      ├── DashboardMetricsController  /v1/dashboard/*        (10 existing + 1 new contract)
      ├── DashboardMetricsService     ← single metric-definition layer (all formulas live here once)
      ├── SnapshotStatsCache          ← per (hub_id, snapshot_date) computed stats; filled post-ETL,
      │                                 immutable thereafter (in-process or Redis; implementer's choice)
      └── DashboardSnapshotRepository → SELECT … FROM dashboard_hub_daily_snapshots
                                         WHERE hub_id = ? AND snapshot_date BETWEEN ? AND ?
```

- The read path touches **only** the snapshot table — never operational tables (constraint from the context doc).
- Query-window expansion is explicit in the service: a request reads up to `window×2 + 6` days (the MA lookback **plus the preceding window for `trend.priorMa`**), + trailing 30 days when volume stress is included.
- All formulas live in one `DashboardMetricsService` so cards, tables, trends, and compare views can never drift apart. A shared `WindowResolver` handles window/asOf validation, day inclusion/exclusion (FAILED/PARTIAL rules), and lookback expansion for **all** endpoints — the exclusion rule must exist in exactly one place.
- ASCII diagram comments are part of the implementation: the metrics pipeline in `DashboardMetricsService`'s header, and the cross-day cycle-assembly logic (D+1 finalization) at the stage-timeline implementation site.
- Layering note: the existing write-side lives under the internal namespace; this adds the first portal-authenticated surface to `nest-logistic-service`. It follows whatever guard pattern the service already uses for portal JWTs; if none exists, the guard is implemented as part of this work (see Open questions on role granularity).

## API contracts

Ground truth: `dash-api-collections/collections/Development/Logistic Service/Dashboard/` (10 files, folder auth `providerTokenPortal`). The TRD does not restate unchanged shapes — the collection is the contract. Changes in this version:

```
GET /v1/dashboard/hubs/{hubId}/stage-timeline?window=7d[&asOf=YYYY-MM-DD]   (NEW)
```

Response `data`: `hubId`, `hubName`, `freshness{…}`, `cycles` summary
`{count, overlappedCycles}`, and `stages`: ordered array
`[{key: "inbound"|"gap1"|"dispatch"|"gap2"|"riderScan", medianDurationSec, itemCountMedian, perCycle: [...] }]`.
Gap definitions: per dispatch cycle, `gap1 = max(0, dispatch.created_at − max(scanned_at of that dispatch's items))`, `gap2 = max(0, min(handed_over_at of the dispatch's batches' items) − committed_at)`; aggregate = median across cycles in the window; clamped negatives increment `overlappedCycles`. Failure examples: 400 invalid window/asOf, 200 INSUFFICIENT_SAMPLES shape.

**Cycle attribution & finalization:** a dispatch cycle belongs to the WIB date of `dispatch.created_at`. Because handovers can complete after the 00:00 WIB cutoff, cycle assembly reads the following day's snapshot row as well, and a day's stage-timeline stats **finalize only after the next day's ETL** — the stats-cache entry for day D's timeline is written at day D+1's ETL, not day D's. Until then the day renders as in-progress.

```
GET /v1/dashboard/hubs            (CHANGED — adds volumeStress per row)
GET /v1/dashboard/hubs/{hubId}    (CHANGED — adds volumeStress block)
```

`volumeStress`: `{ratio, band: "NORMAL"|"ELEVATED"|"AT_CEILING", windowAvgItemsPerDay, trailingP90ItemsPerDay, shortHistory: bool, status: "OK"|"INSUFFICIENT_HISTORY"}`. Ratio = window avg items/day ÷ trailing-30-day p90 (FAILED/PARTIAL days excluded from both sides; EMPTY counts as 0-volume day). Bands are half-open: NORMAL [0, 0.8), ELEVATED [0.8, 1.0], AT_CEILING > 1.0. `<14` history days → INSUFFICIENT_HISTORY, null ratio; 14–29 → computed, `shortHistory: true`.

```
GET /v1/dashboard/hubs/{hubId}/coverage    (CHANGED — coverage counts included days)
```

`presentDays` counts days that are present **and included** (etl_status OK or EMPTY); new `excludedDays` field counts present-but-excluded days (PARTIAL/FAILED). `coverage = presentDays ÷ expectedDays` unchanged in formula but stricter in meaning — a hub with 7 rows of which 2 are PARTIAL shows coverage 5/7, not 1.0.

**Unknown-hub normalization (contract fix):** "known" is defined **from the snapshot table itself** (read path never queries the hub master): a hub with ≥1 snapshot row ever is known; a hub id with no row ever returns **404 HubNotFound** on every read endpoint (including any hub in the `compare` `hubs=` list — the whole request 404s). A *known* hub with no data in the requested window returns 200 with INSUFFICIENT_SAMPLES/empty shapes (the existing hub-99 examples). The all-hubs overview lists distinct hubs present in the snapshot table — a newly onboarded hub appears the morning after its first ETL run (accepted one-day lag). This resolves an internal inconsistency in the pre-existing collection, where `Get Hub Zone Breakdown.yml` had an example named "404 - Hub Not Found" that returned 200 — that example is corrected in this change.

```
ALL /v1/dashboard/* read endpoints    (CHANGED — optional asOf=YYYY-MM-DD)
```

Anchors `windowEnd` to `asOf` (must be ≤ latest snapshot date; future → 400). Omitted → latest, current behavior unchanged (backward compatible).

Collection updates in this change (vault API rule 2): 1 new file (`Stage Timeline.yml`, success + INSUFFICIENT_SAMPLES + 400-asOf examples); `List Hubs Overview.yml` and `Get Hub Detail.yml` (volumeStress block); `List Hubs Overview.yml` (asOf success example); `Get Hub Coverage.yml` (excludedDays + PARTIAL-day example); `Get Hub Zone Breakdown.yml` (mislabeled 404 example corrected). The remaining read files (`Get Hub Detail`, `Get Hub Inbound Velocity`, `Get Hub Dispatch Velocity`, `Get Hub Rider Scan Velocity`, `Get Hub Planner Stress`, `Get Hub Throughput`, `Get Hub Zone Breakdown`, `Get Hub Coverage`, `Compare Hubs`) receive their `asOf` example in the implementation change that ships the param — declared here so the deliverable is enumerable, not vague.

## Data model

**No new entities beyond what the ERD already defines.** Migration `0038_add_dashboard_hub_daily_snapshots` exists on `feat/dashboard` and creates the table on merge; this PRD adds no further schema change. `docs/modules/erd/erd.mermaid` already contains the entity and needs no change (checked 2026-07-10). Backward compatibility: JSONB rows written by any prior ETL version must parse or be skipped-and-counted (see Failure modes) — never crash the request.

Required index: the natural unique key `(hub_id, snapshot_date)` must exist (verify at implementation; add if missing).

## Cross-module impacts

| Module / system | Interface | Impact |
|---|---|---|
| Ops portal | New page; calls `/v1/dashboard/*` with portal bearer token | New consumer; portal routing/menu entry behind a visibility flag |
| Inbound module | None (boundary decision: live ops stays there) | Named to prevent scope drift — no shared code |
| core-service | Portal JWT issuance/validation (existing); hub master (ETL-time only, already shipped) | No change; read path validates portal tokens per existing pattern |
| delivery-service | Future: `pendingMetrics` slots | No change now; contract already reserves the keys |
| analytics-dashboard module | None — separate module (naming disambiguation only) | No interface |
| dash-api-collections | 1 new + 3 touched request files | Same change set as this TRD |

## Failure modes & observability

| Codepath | Failure | Handling | User sees | Logged/metered |
|---|---|---|---|---|
| Any read endpoint | invalid window / hubId / asOf | 400 with named field (contract examples) | Inline form error | request log |
| Any read endpoint | no rows in range | 200, INSUFFICIENT_SAMPLES / empty shapes | Empty state | request log |
| Any read endpoint | DB down / timeout | 503 | Per-panel error + retry | error log + latency metric |
| JSONB parsing | malformed / drifted row | Skip row, count in `dataQuality.skippedDays`, structured log with row id | Coverage reflects it | **alert when skippedDays > 0** (schema-drift canary) |
| Metric math | zero items (÷0), empty percentile input | null, never 0 | "—" | none (by design) |
| MA | <4 included days | null + INSUFFICIENT_SAMPLES | Thin-data state | none |
| Stats cache | miss / cold start | Compute from row, fill cache | Slightly slower first hit | cache hit-rate metric |
| ETL (write side, existing) | FAILED / PARTIAL day | Excluded from aggregates (R11) | Badge + coverage drop | existing row_counts canary |

- Structured log per request: hubs, window, asOf, duration, skippedDays, cache hit/miss.
- Metrics: endpoint latency (p50/p99), error rate, cache hit rate, skippedDays counter.
- Alerts: skippedDays > 0 (drift canary); p99 > 1s sustained (perf regression).
- Runbook entries: "a day is missing from the dashboard", "a velocity shows —", "dashboard disagrees with the weekly deck" (answer: check coverage panel → snapshot status endpoint → skippedDays).
- Debuggability bar: any figure must be reconstructable from one snapshot row + the context doc's formula, three weeks later, from logs and the table alone.

## Security & permissions

- AuthN: portal bearer JWT (`providerTokenPortal` surface), validated per the service's existing portal-guard pattern. AuthZ: page and endpoints restricted to the portal role(s) mapped to leadership/management — exact role granularity is an Open question; default-deny if the role check cannot resolve.
- **PII boundary (R16):** snapshot JSONB embeds item rows with addresses/phones. Response DTOs are whitelisted aggregate shapes; a contract test asserts no address/phone/name keys appear in any response.
- Input validation: window enum, numeric hubId, `asOf` date format + not-future, hubs list ≤ all-hubs count on compare.
- No new secrets, no new dependencies. Standard access logging covers audit needs (read-only surface).

## Rollout

0. **Pre-flight A — bring `feat/dashboard` to main:** the full implementation (migration 0038, ETL, run/status/backfill, all 10 read endpoints) lives on that branch, 34 commits behind main as of 2026-07-12. Rebase or merge, re-verifying the ETL source queries against schema changes since 2026-06-24 (item_media, pod-per-package, dispatch disposition). This PRD's net-new work (stage-timeline, volumeStress, asOf, coverage excludedDays, unknown-hub 404s) lands on top of it.
0b. **Pre-flight B — auth:** verify the branch's `AuthGuard` on `/v1/dashboard/*` validates portal JWTs as this PRD requires. If not, scope the guard + core-service coordination before endpoint work begins.
0c. **Pre-flight C — daily trigger:** the service has no cron (by design). Wire an external scheduler to `POST /internal/v1/dashboard/snapshot/run` daily at 00:00 WIB. Until this exists, the dashboard has no fresh data.
1. Ship the metrics service + endpoints (the migration from `feat/dashboard` creates the table; endpoints are additive, no flag needed server-side).
2. Verify **backfill depth** per hub (ops step: `GET snapshot/status`, run `POST snapshot/backfill` if history < 30 days — endpoint auto-discovers full history). Volume stress needs ≥14 days to say anything.
2b. **Cache warm:** after each ETL run (and once post-deploy), warm the per-(hub, day) stats cache so the first leadership request of the day never pays the full JSONB compute.
3. Run **golden reconciliation** in staging: window 2026-06-24→30 vs the 30 Jun weekly deck numbers.
4. Ship the portal page behind a **menu-visibility flag**; enable for leadership.
5. Rollback: hide the menu entry (UI); endpoints are additive and can idle harmlessly. No data rollback exists or is needed (read-only).
6. Post-deploy checks (first hour): overview p99, skippedDays == 0, coverage panel matches snapshot/status for yesterday.

Smallest safely deployable increment: overview + detail endpoints with the portal page showing only the velocity cards; remaining panels ship behind the same flag as they land.

## Testing strategy

- **Unit — metric formulas** (fixture snapshot rows): sessionized velocities, MA with gaps (<4 days → null), FAILED/PARTIAL exclusion, EMPTY-as-zero, multi-dispatch median gaps, negative-gap clamp + overlappedCycles, cross-midnight attribution, volume-stress bands + history thresholds, ÷0 → null, `trend.priorMa` lookback (window×2 + 6 rows read), known-hub-vs-unknown-hub resolution from the snapshot table, asOf at the earliest snapshot date and before backfill start, stage-timeline D+1 finalization (day D renders in-progress until D+1's ETL), cold-vs-warm cache parity (identical numbers).
- **Contract tests:** every response validates against the collection examples (10 existing + 1 new + 2 changed); PII-absence assertion (no address/phone keys) on every endpoint.
- **Integration:** seeded snapshot rows across mixed etl_status; asOf anchoring; query-window expansion (7d request reads 13/37 rows as appropriate); cache fill-after-ETL behavior.
- **Golden reconciliation:** computed metrics for 2026-06-24→30 reconcile with the weekly deck's published numbers (8.1s hub scan JakSel, 8m 15s preview→commit JakBar, 19.3s rider scan, per-hub totals) within rounding. Highest-value test in the plan.
- **Perf check:** all-hubs 90d request against a year of realistic-size JSONB fixtures; assert p99 budget with cold and warm cache. Note the correlation-chart fan-out: all-hubs small multiples require N per-hub velocity calls per stage (compare points carry no itemCount) — acceptable behind the stats cache; a batched variant is a deferred option if N grows.
- **E2E (portal):** default view, hub switch, window switch, thin-history hub states, stale banner, per-panel error + retry, rapid selector changes (last-wins).

## Key decisions & deferred choices

- **Compute-on-read over precomputed metrics table** — snapshot grain was designed for it; the immutable post-ETL stats cache delivers precompute's latency without migrations or re-backfill ceremonies. Revisit only if hub count grows ~10x.
- **PARTIAL days excluded** (not badge-and-include): a half-captured day yields a confidently wrong velocity in rankings; exclusion + coverage visibility is safer than a badge next to a wrong number.
- **`asOf` + window enum instead of arbitrary from/to** — keeps MA semantics clean and matches leadership usage; deferred, not rejected.
- **Volume stress as p90-ratio with bands** — p90 of ≤30 samples is noisy, hence bands rather than a precise gauge; it is one current indicator per hub, not a rolling series.
- **Gap clamping made visible** — `max(0, …)` hides exactly the condition "preview before inbound" will create, so clamps are counted and surfaced (`overlappedCycles`).
- **Deferred to implementer:** cache store choice (in-process vs Redis — constraint: fill-after-ETL, no mid-day invalidation); exact wave/session threshold (constraint: must match the shipped ETL/contract semantics; document the value in the context doc when pinned); chart rendering library (constraint: GSM ink-default, tabular numerals, self-contained portal conventions).

## Open questions

- Which portal role(s) map to "leadership"? If none exists today, role creation is core-service work that must be scoped before launch (default-deny until resolved).
- `quantity > 1` items: do volume counts use item rows (current behavior) or quantity units? Affects deck-vs-dashboard reconciliation copy.
- Arbitrary from/to ranges: revisit if leadership asks for period-over-period views the window enum can't express.
- Gap1 semantics after "preview before inbound" ships: redefine (e.g. planning lead time) or retire gap1? Decide when that roadmap item lands; `overlappedCycles` is the bridge signal.
- `dock-mockup-v1.html` and `dock-product-presentation-v1.html` are deferred (2026-07-10 decision) — author before this doc moves to `in-review`; run /plan-design-review against the mockup.

## Changelog

- 2026-07-10 — created (v1). Rebuild after prior module docs were deleted; read-side contracts recovered from the API collection and adopted as baseline. Scope per the 2026-07-10 CEO review: baseline + correlation chart, stage waterfall, volume stress, asOf.
- 2026-07-12 — implementation-state correction after checking `nest-logistic-service`: both halves already implemented on unmerged `feat/dashboard` (run + backfill + status, 10 read endpoints, migration 0038). Rollout rewritten: pre-flight A (merge branch, re-verify ETL vs 34 commits of drift), B (portal-JWT guard check), C (external daily scheduler — none exists).
