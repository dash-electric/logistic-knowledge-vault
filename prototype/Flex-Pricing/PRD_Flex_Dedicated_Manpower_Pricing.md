# Dash — Flex (Dedicated Manpower) Pricing & Scheduling — PRD (Draft v1)

The product spec for selling and operating **dedicated manpower / dedicated courier** ("lumpsum" / daily-flat) as a first-class model across Dash's surfaces. Today the platform sells only **per-delivery** logistics (distance × weight × additional fees); ~**14 of 26–27 active clients** are actually billed **per shift/rider/day**, and the system has no way to represent it. This PRD adds a **"Flex" service category** with a **"Dedicated Courier"** service type, unblocks **Next Portal** order-creation for daily-only clients (the acute bleeding point, e.g. MAP Boga), and — in a later wave — moves the **scheduling + manpower operations** (assign-rider/dispatch, attendance, overtime, payroll) into **Dash Logistic (Mithril)** where the schedule, reminder-WA, dispatch, and driver app already live.

> **Build status.** Draft for review — no build approved yet. Source: the *BO-Pricing-Dedicated* dedicated session (11 Aug 2026) + the *BackOffice-Pricing / Next Portal-Create Delivery* daily-ops panduan. The strategic decision this PRD commits to is the **two-domain split** (pricing → Core/BackOffice + Next Portal now; execution → Logistic next) — see *Recommendation & sequencing*. Two items are on the critical path and must be closed before backend build: **(1) the pricing master-data store (Core vs Logistic)** and **(2) the Express-guard behaviour** for Flex clients.

## How to read this document

Structure is **Phases → Epics → Tickets**, phased by **release wave** (order each slice ships), not by platform. The document opens with product framing (Problem, Existing condition, Users, Goals, Metrics), the **Recommendation & sequencing** (the core "old vs new system" call), a **Release timeline**, and **Cross-cutting standards** every epic inherits. Each **Phase** carries its own problem/scope/success; each **Epic** is specified in full (Problem · Scope in/out · Tickets · HEART). Each **Ticket** carries a discipline tag **`Backend`/`Frontend`/`Mobile`**, a priority **`P0`/`P1`/`P2`**, an **Entry point**, a **User story**, **Acceptance criteria** (GIVEN → WHEN → THEN, one behaviour each), and — where useful — **Technical notes**, **Edge cases**, and **Existing-condition status** (what the live BackOffice/Next Portal already does vs the requirement). Ticket ids `T<phase>.<epic>.<n>`; ACs `AC-<phase>.<epic>.<n>.<m>`.

---

## Problem

Dash's platform models **one unit of sale: the delivery** (per-resi, priced on distance tier + weight tier + additional fees). But a large slice of the business rents out **manpower by the shift** — a "lumpsum" / daily-flat arrangement — and that model has no representation anywhere in the system. Five problems recur (evidenced in the 11 Aug pricing session):

1. **No daily-flat pricing model.** The only pricing primitives are Distance and Weight tiers. There is no "Rp 200.000 / shift / rider" primitive, no overtime primitive (by time or distance), and no per-client commission field (currently 15–20%, flat per client). Ops track it all off-system.
2. **Next Portal order-creation is blocked for dedicated clients.** Order creation is **gated on pricing config** — no valid pricing rule → the client can't create a delivery (price 0 / "di luar coverage"). Dedicated clients who self-serve on Next Portal (e.g. **MAP Boga**) are effectively broken, because a distance/weight rule is meaningless for them.
3. **Scheduling is split across two systems.** Shift/schedule lives in BackOffice, but reminder-WA + dispatch + the driver app are being built in Logistic — keeping shift in both means **double maintenance** ("bikin shift double lagi").
4. **No manpower-ops primitives.** Assigning a **specific dedicated rider** vs falling back to **auto-dispatch**, **attendance validation** as the basis for daily payment, and **overtime capture** (with client approval + photo evidence) have no home in the system.
5. **Overtime is a live dispute magnet.** Overtime only counts if the client requests it up front; without a clear SOP + evidence trail, clients (e.g. **Alpha**) dispute even a **1-minute** delta as an overtime hour.

Compounding it: naming is unsettled (legacy **"Fleet+"** vs proposed **"Flex"**), and invoicing + payroll for dedicated clients are still **fully manual** (weekly PDF emailed to the client, cross-checked by hand).

## Existing condition (what the live system does today)

**BackOffice — Client → Pricing tab (per client).**
- **Basic Configuration:** Client + Client Code (auto), **Service Category** (`Express` | `Logistic`), **Service Type** locked to category (`Express → Instant / Sameday / Multi-stop`; `Logistic → Regular / Sameday / Next Day`).
- **Pricing Rule:** **Distance** (`Flat` base + `Tier` step per km) and **Weight** (`Flat` base + rate/kg), each tier auto-chaining `From = previous To + 0.001`. A **Quick Calculator** simulates Distance Fare + Weight Surcharge + Price-per-Stop (from stop 3) + Other Price (Logistic Tax 1.1%, Insurance, Parking, QR, Rounding). Max **6 stops**. **Publish** writes the rule; summary shows on client detail.
- **Additional Fees (client-level, all orders):** Price per Stop, Pajak Logistic toggle, **Payment Method** (`Invoicing` | `Pay per Order (QRIS)`), Parking, **Insurance** tiers (Basic/Standard/Platinum/Ultimate — can't disable, can be 0).
- **Client → Pengaturan tab:** `Allow Self Order Customer`, `Enable Return Destination`, **`Portal Allow Invoicing Summary`**, **`Portal Bypass Self Service Client`**, Min/Max POP/POD, Allocation Radius (Instant/SameDay/Fallback/MultiStop), **`Client Service` dropdown = `Express` | `Fleet+` | `Flex`**, Shipping Doc Signature Options, Portal Multi Stop Options.

> **Key discovery:** a **`Flex`** slot **already exists** in the `Client Service` dropdown. We are formalizing an existing-but-unused concept, not inventing one — which lowers the integration cost.

**Next Portal — Create Delivery (client self-serve).** Login → Deliveries → **+ Create Delivery** → Pickup (address + Sender + phone + notes) → Drop-off (address + Recipient + phone + notes) + **Package** (name/type/weight/size) → optional **+ Add Stops** → **Service Type** (Pick-up time `Now`/`Schedule` + product e.g. `Dash Instant`) → **Payment** (`Invoice` default) → **Book Delivery** → **Review Delivery** (route, total distance, service type, protection) → **Confirm & Process**. The flow is **entirely per-delivery** and **depends on pricing + coverage/allocation radius** to enable **Book Delivery**.

**Dash Logistic (Mithril) — Shipment-Workflow prototype.** Already contains a **"✦ Dedicated Driver / All riders"** assignment tab, **dispatch**, and seed rows carrying `layanan: "Dedicated"` + `shift: "Morning"`. It does **not** yet contain any pricing config — pricing still lives only in BackOffice/Core, which Next Portal reads from.

## Users & jobs

| Role | Surface | Job to be done |
| --- | --- | --- |
| **Pricing admin / BD** | BackOffice (P1) → Logistic (P2) | Configure a client's **Flex / Dedicated Courier** pricing (daily-flat min, overtime, commission) as master data |
| **Client ops PIC** | Next Portal | Create a delivery for a **daily-only (Flex)** client without being blocked by per-delivery pricing |
| **Ops admin** | Logistic (Mithril) | Bulk-upload the day's manpower; **assign a specific dedicated rider** or fall back to **dispatch**; reconcile attendance → billing |
| **Driver (dedicated)** | Driver App | Run the shift; get an **8-hour warning**; **extend** only on client-approved overtime |
| **Finance / Ops** | Logistic (P2) | Turn attendance × daily rate + overtime + commission into invoice + payroll (manual in P1) |

## Goals

1. Represent **daily-flat (lumpsum) pricing** as a first-class model: **`Flex` category + `Dedicated Courier` service type**, daily min (Rp 200.000/shift/rider), overtime (by time **or** distance), per-client commission — **without mutating historical per-delivery data**.
2. **Unblock Next Portal** so a Flex/daily-only client can create a delivery even when no per-delivery pricing exists, while keeping distance/variable info readable in the backend for reference.
3. Move **scheduling + manpower operations** into **Logistic** (assign-rider/dispatch, attendance validation, overtime capture, driver-app shift warning) so shift stops living in two systems.
4. Give daily-flat billing a **defensible evidence spine** (attendance per shift + client-approved overtime with photo + named rider + duration) to kill overtime disputes.

**Non-goals (this PRD).** Automated invoicing/payroll calculation in Phase 1 (stays manual — pricing is master-data-for-recon first); a brand-new pricing microservice built greenfield in Phase 1; migrating the per-delivery pricing model itself; X-Dock / 2W flows; anything requiring the still-disconnected UJP system.

## Success metrics (product-level · HEART)

Baselines from the current manual/blocked state; "before = 0/blocked" where the capability doesn't exist.

| HEART | Metric | Baseline (before) | Target (after) | Instrument |
| --- | --- | --- | --- | --- |
| **Task success** | Flex/daily-only clients able to create an order on Next Portal | **blocked** (pricing gate) | **100%** of Flex clients can Book Delivery | Next Portal order-create success by `client_service = Flex` |
| **Adoption** | Dedicated clients with a Flex pricing rule configured | 0 in system | **14/14** active dedicated clients | BackOffice pricing rule audit by category |
| **Integrity** | Wrong-model orders (Flex client accidentally booking Express) | possible (no guard) | **0** | Express-guard block log |
| **Task success** | Daily billing backed by attendance evidence (P2) | ~0% (paper) | **≥ 95%** of shift-days with attendance validation | attendance record vs invoiced shift-days |
| **Happiness / effort** | Overtime disputes per client per month | high (1-min deltas disputed, e.g. Alpha) | **−50%** by end-Q3 | dispute log tagged `overtime` |
| **Self-service** | Shift maintained in **one** system (no double-entry) | 2 systems | **1** (Logistic) after P2 | schedule source audit |

---

## Recommendation & sequencing (the "old vs new system" call)

**Verdict: neither "all in BackOffice" nor "jump straight to Mithril" — split the problem by data domain and route each to its natural home, phased by urgency.** The meeting tangled two different concerns; separating them dissolves the debate.

| Concern | What it is | Natural home | When |
| --- | --- | --- | --- |
| **Pricing master data** (Flex daily-flat, overtime, commission) | *Config / master data* that **Next Portal already reads from Core** | **Core / BackOffice** (reuse existing pricing tab + the existing `Flex` slot) | **Phase 1 — now** |
| **Scheduling + manpower ops** (assign-rider/dispatch, attendance, overtime capture, payroll, driver shift warning) | *Operational execution* that lives beside schedule + reminder-WA + dispatch + driver app | **Dash Logistic (Mithril)** | **Phase 2 — next** |

**Why this order (and why not the alternatives):**

- **Phase 1 in BackOffice + Next Portal is the fastest, lowest-risk unblock.** Next Portal reads pricing from Core; the `Flex` client-service slot already exists; the per-client pricing tab already exists. Adding a daily-flat pricing type + a Next-Portal bypass reuses all of it and directly unblocks the **14 dedicated clients** (incl. the self-serve ones like MAP Boga). This matches the engineers' "system lama dulu = cepet."
- **Jumping straight to Mithril (Option B) does not solve the acute pain.** The bleeding point is **Next-Portal order creation**, and Next Portal reads pricing from **Core**. Putting Flex pricing only in Mithril would still leave MAP Boga blocked unless we also build a pricing service and re-point Next Portal — the slow path the team explicitly wanted to avoid. And since invoicing/payroll stay manual near-term, a full Logistic build buys little immediate value.
- **Deferring everything (Option C) has a live cost:** blocked self-serve clients, ongoing overtime disputes, and the looming double-shift-maintenance tax. Not acceptable.
- **Phase 2 belongs in Logistic — and, critically, the home already exists.** The live Mithril platform already ships **Scheduled Instant** (daily rider slots, Master Jadwal, Day Off, Rider Utama/Cadangan), **Dispatches**, and **Zones**. So Phase 2 **enhances the existing Scheduled Instant** (billing-basis, attendance, overtime, recon) rather than building new menus — keeping shift in **one** system. Pricing-UI migration and invoicing/payroll automation (a dedicated Finance module) are **P2**, deferrable without blocking. *(Mithril **Invoices** = surat-jalan monitoring, not billing recon — recon exports from Scheduled Instant, where the data lives.)*

This is a **strangler-fig migration**: stabilize a stable contract (pricing in Core, read by Next Portal) now, grow the new capabilities in Logistic, and retire the BackOffice pricing UI only once Logistic is the single pane (Phase 3). It mirrors the "one engine, three surfaces" philosophy already adopted for 4W EXIM.

**Explicit Phase-1 scope discipline (agreed in-meeting):** pricing is **master-data-for-reconciliation** first. Invoicing + payroll calculation stay **manual**; we are not building the calculation engine in Phase 1.

---

## Release timeline & milestones (proposed — pending Ops/Eng confirmation)

Business weeks (Aug 2026): W2 = 11–15 Aug · W3 = 18–22 Aug · W4 = 25–29 Aug.

| # | Milestone / track | Window | Owner | Status |
| --- | --- | --- | --- | --- |
| M1 | **Decisions closed** — pricing store (Core vs Logistic), category-name final (`Flex`), Express-guard behaviour | W2 | PM + Eng lead | **TBC** |
| M2 | **Phase 1 — Flex pricing model in BackOffice** (category/type + daily-flat + overtime + commission) | W2 → W3 | BE + FE | Planned |
| M3 | **Phase 1 — Next Portal daily-only order creation** (bypass + guard) | W3 | FE + BE | Planned |
| M4 | **Phase 1 pilot** — configure 2–3 dedicated clients (incl. MAP Boga) + validate Next-Portal booking | end W3 | Ops + BD | Planned |
| M5 | **Phase 2 — Manpower ops in Logistic** (allocation + assign-rider/dispatch, attendance, overtime, shift warning) | W4+ | Full stack | Planned |
| M6 | **Phase 2 — Pricing UI migration + invoicing/payroll automation in Logistic** | later | Full stack | Planned |

---

## Cross-cutting standards

**Two-domain invariant.** **Pricing = config/master-data** (Core/BackOffice, read by Next Portal); **scheduling/manpower = execution** (Logistic). No feature crosses this line without an explicit decision. Next Portal always reads pricing from Core.

**No historical mutation.** Adding `Flex` / `Dedicated Courier` and the daily-flat model **must not** rewrite or invalidate existing per-delivery pricing rules. New category is additive; legacy `Fleet+` rows are preserved and mapped, not deleted (mirrors the BackOffice "convert semua jadi baru, data lama tetap ada" principle and the tier "Publish, jangan hapus" behaviour).

**Terminology.** Business term **"shift"** replaces **"hari"** wherever the daily unit appears (1 shift = **8 hours incl. break**; start time varies, mostly 08:00–09:00). "Lamsam" = daily-flat lump sum. Keep a curated English allowlist (Flex, Dedicated Courier, Express, POP/POD, QRIS, Invoicing, Next Portal). Driver copy stays plain imperative Bahasa.

**Pricing primitives (new).** `daily_flat` (min Rp 200.000 / shift / rider — configurable), `overtime` (mode = `TIME` per-hour **or** `DISTANCE` per-km; e.g. Rp 30.000–40.000/hour), `commission` (per-client flat %, e.g. 15–20%). Revenue vs payroll are **separate numbers** (example: Rp 200.000 revenue → Rp 140.000 rider). Overtime only exists on **daily/shift** schemes — **per-delivery schemes have no overtime**.

**Express-guard (critical-path decision).** A client configured **Flex-only** must not be able to accidentally create an **Express** order. Decide the behaviour: **(a)** hide non-Flex service types in Next Portal for Flex-only clients, and/or **(b)** hard-block at order-create with a clear message. Default recommendation: **both** — hide in UI + server-side guard. *(Open — M1.)*

**Pricing store (critical-path decision).** Phase 1 stores Flex pricing as **master data in Core/BackOffice** (Next Portal reads it there). Whether Phase 2 **migrates the store** to Logistic or keeps Core as source-of-truth with a Logistic UI is an **engineering decision to close at M1** — it changes the Phase-2 data-plumbing.

**Next-Portal daily-only behaviour (agreed).** If a client has **only** daily pricing: order creation is **allowed**; per-delivery price is treated as **null / not enforced** (distance/weight/coverage validation bypassed); distance & variable info **stay readable in the backend** for reference; **billing follows the daily scheme**; the client's view of price can be hidden via the existing **`Portal Allow Invoicing Summary`** toggle. (Note the phrasing correction from the session: don't literally null the invoice — invoicing happens at period end on the daily scheme.)

**Design system.** Dash Logistic GSM: Plus Jakarta Sans + JetBrains Mono; Primary purple `#7D52F4`; tabular numerals; one primary action per surface; responsive (side-nav → drawer; tables → horizontal scroll). Bahasa Indonesia primary.

---

# Phase 1 — Flex Pricing Model (Core/BackOffice) + Next-Portal Unblock

**Problem.** Dedicated clients can't be priced or served: no daily-flat model exists, and Next Portal blocks their order creation.

**Scope — in.** `Flex` category + `Dedicated Courier` service type in the pricing config; daily-flat + overtime + commission primitives; Next-Portal daily-only order creation + Express-guard. **Out.** Invoicing/payroll automation; scheduling/manpower ops; any UI in Logistic.

**Phase success.** BD can publish a Flex pricing rule for a client; that client can create a delivery on Next Portal without a per-delivery price; a Flex-only client cannot book Express.

## Epic 1.1 — Flex / Dedicated Courier pricing model (BackOffice)

**Problem.** The pricing tab supports only Distance/Weight tiers; daily-flat has no representation.

**Scope — in.** Category/type extension; daily-flat, overtime, commission fields; publish + non-mutating storage. **Out.** Any calculation/billing engine.

### Requirements — Tickets

#### T1.1.1 — Add `Flex` category + `Dedicated Courier` service type · `Backend + Frontend` · `P0`
**Entry point.** BackOffice → Client → **Pricing** tab → **+ Tambah** → **Basic Configuration** (`Service Category` / `Service Type`).
**User story.** As a pricing admin, I want to choose **Flex → Dedicated Courier** in the pricing rule, so that a dedicated client is priced on the right model.
**Acceptance criteria.**

**AC-1.1.1.1 — Flex category selectable**
- **GIVEN** the Basic Configuration step
- **WHEN** the admin opens `Service Category`
- **THEN** `Flex` is available alongside `Express` and `Logistic`, and selecting it locks `Service Type` to **`Dedicated Courier`** (single option in P1)
- *Tech:* additive enum; legacy `Fleet+` maps to `Flex/Dedicated Courier` for display, existing rows untouched.

**AC-1.1.1.2 — Consistency with `Client Service` config**
- **GIVEN** the client's `Pengaturan → Client Service` dropdown already offers `Express | Fleet+ | Flex`
- **WHEN** a Flex pricing rule is published
- **THEN** the two stay consistent (a Flex pricing rule implies `Client Service = Flex`), with no orphaned mismatch
- *Tech:* reconcile the existing `Fleet+` value → `Flex` (name decision, M1); do not hard-delete `Fleet+`.

**AC-1.1.1.3 — Next selectable only when valid**
- **GIVEN** category = Flex
- **WHEN** required Basic fields are set
- **THEN** **Next** enables and routes to the **Flex pricing step** (not the Distance/Weight tier step)

**Existing-condition status.** BackOffice today: `Service Category` = `Express | Logistic` only; `Service Type` locked per category; `Flex` exists only in the separate `Client Service` config dropdown. This ticket connects them.

#### T1.1.2 — Daily-flat pricing fields · `Backend + Frontend` · `P0`
**Entry point.** Pricing step (Flex branch).
**User story.** As a pricing admin, I want to set the daily/shift rate, so that a dedicated client is billed per shift/rider.
**Acceptance criteria.**

**AC-1.1.2.1 — Daily-flat base**
- **GIVEN** the Flex pricing step
- **WHEN** the admin configures pricing
- **THEN** they set a **daily-flat rate** with a **unit = shift** (label "shift", 1 shift = 8h incl. break) and a **minimum Rp 200.000 / shift / rider** default (editable per client)
- *Tech:* replace the "hari" wording with "shift" per Cross-cutting; store `unit`, `rate`, `min`.

**AC-1.1.2.2 — Revenue vs payroll separation**
- **GIVEN** a daily-flat rate (revenue) is set
- **WHEN** the admin optionally records the **rider payout** (payroll) and **commission %**
- **THEN** revenue, payout, and commission are stored as **distinct** fields (e.g. 200.000 revenue → 140.000 payout; commission 15–20%)
- *Tech:* commission is **per-client flat**; payroll is per-client flat (rider-level variance out of P1).

**AC-1.1.2.3 — No per-delivery tiers required**
- **GIVEN** category = Flex
- **WHEN** the Flex pricing step renders
- **THEN** Distance/Weight tiers and coverage validation are **not required** and are hidden or optional (kept readable in backend only for reference)

#### T1.1.3 — Overtime configuration (time or distance) · `Backend + Frontend` · `P0`
**Entry point.** Pricing step (Flex branch) → Overtime section.
**User story.** As a pricing admin, I want to set an overtime rate by time or distance, so that client-approved overtime can be priced.
**Acceptance criteria.**

**AC-1.1.3.1 — Overtime mode**
- **GIVEN** the Overtime section
- **WHEN** the admin configures it
- **THEN** they pick **mode = `TIME` (per hour)** or **`DISTANCE` (per km)**, with a rate (e.g. Rp 30.000–40.000/hour); clients with unknown distance use **TIME**
- *Tech:* `overtime.mode ∈ {TIME, DISTANCE}`, `overtime.rate`, optional `overtime.min_unit` (hour).

**AC-1.1.3.2 — Overtime is daily-only**
- **GIVEN** a per-delivery pricing rule
- **WHEN** the pricing step renders
- **THEN** no Overtime section is shown (overtime does not exist for per-delivery/per-resi schemes)

**Edge case.** Overtime is **evidence-gated** operationally (client request + photo + named rider + duration) — that capture is **Phase 2** (T2.2.x); Phase 1 only prices it.

#### T1.1.4 — Publish + non-mutating storage · `Backend` · `P0`
**Acceptance criteria.**

**AC-1.1.4.1 — Publish Flex rule**
- **GIVEN** a valid Flex pricing rule
- **WHEN** the admin clicks **Publish**
- **THEN** it saves and shows on the client's pricing summary, exactly like the existing Distance/Weight publish behaviour
- *Tech:* reuse the existing publish path; add `pricing_type = flex`.

**AC-1.1.4.2 — History preserved**
- **GIVEN** a client that previously had per-delivery or `Fleet+` pricing
- **WHEN** a Flex rule is added
- **THEN** the old rule is retained (not overwritten) and the change is auditable
- *Tech:* mirrors BackOffice "data lama tetap ada, di-convert jadi baru"; never hard-delete.

### Epic 1.1 — Success metrics (HEART)

| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Adoption | Dedicated clients with a Flex rule | 0 | 14/14 | pricing audit |
| Task success | Flex rule publishable without touching tiers | impossible | 100% | publish logs |
| Integrity | Historical pricing rows preserved | n/a | 100% | audit trail |

## Epic 1.2 — Next Portal daily-only order creation

**Problem.** Order creation is gated on per-delivery pricing; Flex clients are blocked.

**Scope — in.** Bypass pricing/coverage validation for daily-only clients; Express-guard; price display handling. **Out.** Automated Flex invoicing.

### Requirements — Tickets

#### T1.2.1 — Allow order creation with daily-only pricing · `Backend + Frontend` · `P0`
**Entry point.** Next Portal → Deliveries → **+ Create Delivery** → … → **Book Delivery**.
**User story.** As a Flex client PIC, I want to create a delivery even though I'm billed per shift, so that I can still book pickups without a per-delivery price.
**Acceptance criteria.**

**AC-1.2.1.1 — Bypass pricing gate for daily-only**
- **GIVEN** a client whose only pricing is Flex/daily
- **WHEN** they complete the Create Delivery flow
- **THEN** **Book Delivery** enables **without** a valid per-delivery price, and distance/weight/coverage validation is **bypassed** (order not blocked by "di luar coverage")
- *Tech:* read `pricing_type`; if `flex`-only → skip per-delivery price + coverage checks; still capture distance/variables to backend for reference.

**AC-1.2.1.2 — Price display**
- **GIVEN** a Flex-only client on Next Portal
- **WHEN** the order/review renders
- **THEN** the per-delivery price shows as **not applicable / hidden** (not a misleading number), and the client's invoice view can be suppressed via **`Portal Allow Invoicing Summary`**
- *Tech:* don't fabricate a per-delivery price; billing follows the daily scheme at period end.

**AC-1.2.1.3 — Backend keeps the data**
- **GIVEN** a bypassed order
- **WHEN** it's created
- **THEN** distance, stops, weight remain **readable in the backend** for reference/recon, even though they don't drive price

**Existing-condition status.** Next Portal today **requires** valid pricing + in-coverage address to enable **Book Delivery**; a daily-only client cannot proceed. This ticket introduces the daily-only path.

#### T1.2.2 — Express-guard for Flex-only clients · `Backend + Frontend` · `P0`
**User story.** As Dash, I want a Flex-only client to be unable to book Express, so that we don't get un-priced Express orders.
**Acceptance criteria.**

**AC-1.2.2.1 — Guard behaviour (decision M1)**
- **GIVEN** a client configured Flex-only
- **WHEN** they try to select/book a non-Flex service type (e.g. Express/Instant)
- **THEN** the non-Flex option is **hidden in the portal** **and** blocked server-side with a clear message
- *Tech:* server-side guard is authoritative; UI hide is UX. Confirm exact copy with BD/Ops.

### Epic 1.2 — Success metrics (HEART)

| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Task success | Flex clients can Book Delivery | blocked | 100% | order-create success by `client_service` |
| Integrity | Un-priced Express orders by Flex clients | possible | 0 | guard block log |

---

# Phase 2 — Manpower Operations & Scheduling (Dash Logistic / Mithril)

**Problem.** Dedicated-manpower ops need a **billing/evidence spine** — attendance as the payable basis, overtime that survives disputes, and a recon hand-off to Finance. The earlier assumption of building *new* menus for this was wrong.

**Context — the key finding (revised).** The live **Dash Logistic (Mithril)** platform **already ships the operational home**: **Scheduled Instant** (`Schedule` menu → tabs **Slot Harian / Master Jadwal / Day Off Rider**) with per-client daily rider **slots**, **Tambah Slot** carrying shift times + **Rider Utama + Rider Cadangan** ("first-call jika utama TIDAK/No Response") + a **Dedicated / All Riders** pool, plus slot status + change history. **Dispatches** (batch HUB_SCANNED → rider trips) and **Zones** (hex zones + mitra) also exist. So **Phase 2 = enhance Scheduled Instant, not new menus.** *(Mithril **Invoices** = surat-jalan monitoring, **not** billing recon — do not reuse it for recon.)* Priorities here use **P1** (must-ship, unblocks Flex ops + defensible billing) / **P2** (valuable, deferrable without blocking).

**Scope — in (enhance Scheduled Instant, P1).** Flex **billing-basis** on the slot; **confirmation vs attendance** as distinct states; **attendance validation** as the payable basis (min-hours SOP, partial-shift handling, validator audit); **overtime capture** (client-approval + evidence; **time or distance**; **single or batch**); **Import Slot Massal**; **recon CSV export** from Scheduled Instant; **substitution/fallback** (promote cadangan / lepas ke Dispatch) surfaced on the slot. **Out (P2, deferred).** Invoicing/payroll automation + a dedicated **Finance module**; driver-app **8h warning**; pricing-UI **migration** into Logistic; X-Dock/2W; UJP integration.

**Phase success.** For **Flex** clients, Ops run the day inside the existing **Scheduled Instant**: confirm → validate attendance (the payable basis, audited) → capture client-approved overtime with evidence (time or km, single or batch) → **export a recon CSV** for Finance. **Non-Flex** Scheduled-Instant clients are unaffected (segmentation), and shift lives in **one** system.

## Epic 2.1 — Scheduled Instant as the Flex ops home (billing-basis · segmentation · substitution)

**Problem.** The existing slot must become the unit of billing for Flex, while staying inert for non-Flex clients, and the absent-rider fallback (already implicit via Rider Cadangan) must be an explicit action.

### Requirements — Tickets

#### T2.1.1 — Flex billing-basis on the slot + segmentation · `Frontend + Backend` · `P1`
**Entry point.** `Schedule` → Slot Harian → row / slot detail.
**User story.** As Ops, I want each Flex slot to show its daily rate as the billing basis, so that a validated slot = one billable shift.
**Acceptance criteria.**
**AC-2.1.1.1 — Billing-basis shown for Flex only**
- **GIVEN** a slot whose client `Client Service = Flex`
- **WHEN** the slot renders (table + detail)
- **THEN** it shows the **daily rate / shift** (and OT rate) read from the **Phase-1 Flex pricing** as the billing basis
- **AND** a **non-Flex** Scheduled-Instant client shows **"—"** (no daily billing-basis, no OT) — the enhancement is **gated by `Client Service = Flex`**
- *Tech:* rate is read from the pricing master (Core), never hardcoded on the slot; handle mid-period rate change (Appendix C).

#### T2.1.2 — Substitution & dispatch fallback on the slot · `Frontend + Backend` · `P1`
**User story.** As Ops, when a dedicated rider is a no-show, I want to promote the backup or release the slot to Dispatch, so that the day still runs.
**Acceptance criteria.**
**AC-2.1.2.1 — Promote cadangan / release to Dispatch**
- **GIVEN** a slot whose Rider Utama is **absent** (`att = none`)
- **WHEN** Ops opens the slot
- **THEN** Ops can **Panggil Rider Cadangan** (promote backup → utama) or **Lepas ke Dispatch (zona)** (fallback to the existing Dispatches + Zones engine)
- *Tech:* reuses the existing **Rider Utama/Cadangan** model + **Dispatches**/**Zones**; "cadangan" = first-call, dispatch = zone fallback. Partial-attendance riders are **not** offered substitution (they showed up).

## Epic 2.2 — Attendance validation (the payable basis)

**Problem.** Daily-flat billing needs proof the rider worked, and "rider confirmed" must not be confused with "rider present".

### Requirements — Tickets

#### T2.2.1 — Confirmation vs attendance (two states) · `Frontend + Backend` · `P1`
**User story.** As Ops, I want "will attend" and "did attend" as separate states, so that billing is based on real presence.
**Acceptance criteria.**
**AC-2.2.1.1 — Distinct states**
- **GIVEN** a slot
- **WHEN** it renders
- **THEN** **Terkonfirmasi (akan hadir)** — rider confirmation (existing reminder-WA flow) — is shown **separately** from **Hadir tervalidasi** (check-in). Confirmation alone is **never** a payable basis.

#### T2.2.2 — Attendance = payable basis + validator audit · `Backend + Mobile` · `P1`
**User story.** As Finance, I want a validated attendance record with who/when, so that daily billing is defensible.
**Acceptance criteria.**
**AC-2.2.2.1 — Presence = payable, audited**
- **GIVEN** a daily-flat shift
- **WHEN** attendance is validated (rider check-in, or Ops manual validation)
- **THEN** the shift becomes payable **and** the record stores **validated-by (user) + timestamp** (dispute defense)
- *Tech:* ties to the existing Attendance module + driver-app shift start/end; server-verified timestamp.

#### T2.2.3 — Min-hours rule + partial-shift handling · `Frontend + Backend` · `P1` + **SOP**
**User story.** As Ops, I want a rule for what counts as a paid shift, so that early-leave/short shifts are handled consistently.
**Acceptance criteria.**
**AC-2.2.3.1 — Min-hours & partial decision**
- **GIVEN** a rider who checked in but worked **< the minimum hours** (`hadir = check-in + min X jam`)
- **WHEN** Ops reviews the slot
- **THEN** the status shows **Hadir sebagian**, and Ops must decide **Bayar penuh (1 shift)** or **Tidak dibayar** — the decision is recorded (by/when)
- **SOP (open, Ops):** define **X** (minimum payable hours), no-checkout handling, and who owns the pay/no-pay decision.

## Epic 2.3 — Overtime capture (dispute-proof)

**Problem.** Overtime is a dispute magnet (Alpha disputes 1-minute deltas); it must be approval-gated, evidenced, unit-correct, and fast for many riders.

### Requirements — Tickets

#### T2.3.1 — Approval-gated overtime + evidence · `Mobile + Backend` · `P1`
**User story.** As Ops, I want overtime recorded only with prior client approval and proof, so that disputes stop.
**Acceptance criteria.**
**AC-2.3.1.1 — Approval + evidence required; attendance-gated**
- **GIVEN** overtime is claimed for a shift
- **WHEN** Ops records it
- **THEN** it counts **only** with **PIC-klien name + photo/screenshot evidence + rider + duration**; without them it is **auto-rejected** and excluded from recon
- **AND** overtime can be recorded **only after attendance is validated** (OT presumes the rider worked)
- *Tech:* structured record replaces the ad-hoc WA practice; stores approved-by, requested-time, actual, evidence.

#### T2.3.2 — Time or distance unit · `Frontend + Backend` · `P1`
**Acceptance criteria.**
**AC-2.3.2.1 — Unit follows pricing mode**
- **GIVEN** a Flex client whose overtime is priced **per jam** or **per km** (Phase-1 pricing)
- **WHEN** Ops captures OT
- **THEN** the input is **jam** or **km** accordingly, and recon values it by the matching rate

#### T2.3.3 — Batch overtime (multiple riders) · `Frontend` · `P1`
**Acceptance criteria.**
**AC-2.3.3.1 — One action, many riders (validated)**
- **GIVEN** several riders of the **same client & day** have client-approved overtime
- **WHEN** Ops selects them (row checkboxes) and records OT
- **THEN** one **shared approval + evidence + duration** applies to all selected — no per-rider repetition
- **AND** the action is **blocked** (clear message, not just a warning) if the selection spans **more than one client** (approval/evidence differ per client), or includes a rider **not attendance-validated**, or a **non-Flex / no-overtime** client
- *Tech:* enforce at the batch trigger **and** at save (defense in depth); same-day is implied by the day-scoped board.

## Epic 2.4 — Import Slot Massal + Recon export

### Requirements — Tickets

#### T2.4.1 — Import Slot Massal · `Frontend + Backend` · `P1`
**User story.** As Ops, I want to create many slots via CSV, so that clients without a recurring template are set up quickly.
**Acceptance criteria.**
**AC-2.4.1.1 — When to use + rider/dispatch column**
- **GIVEN** a client **without a Master Jadwal** or with a **variable daily rider count** (e.g. TPI, Next-Portal clients)
- **WHEN** Ops imports a CSV (`Klien · Tanggal · Jam Mulai · Jam Selesai · Rider Utama? · Rider Cadangan · Batch`)
- **THEN** slots are created; a **blank rider** column routes that slot to **Dispatch**
- *Tech:* clients **with** a Master Jadwal generate slots **automatically** — import is not for them.

#### T2.4.2 — Recon CSV export (in Scheduled Instant) · `Frontend + Backend` · `P1`
**User story.** As Ops, I want a per-period recon of shifts + overtime for Finance, so that invoicing is prepared without a manual PDF.
**Acceptance criteria.**
**AC-2.4.2.1 — Recon from where the data lives**
- **GIVEN** a period (date-range) + client filter
- **WHEN** Ops clicks **Download Rekon**
- **THEN** a CSV lists only **Flex** slots with **validated attendance**, each with shift count + **approved OT (by its unit)** + value, and a total
- *Tech:* recon lives in **Scheduled Instant** (not Invoices = surat-jalan, not Shipment = per-delivery); **invoicing stays manual** this phase.

## Epic 2.5 — Deferred (P2 — buildable later without blocking)

#### T2.5.1 — Driver-app 8h warning + extend/auto-off · `Mobile` · `P2`
- Warns near 8h; **Extend** (authority = **client**) creates an OT record; or **Auto-off**. Ties to T2.3.1.

#### T2.5.2 — Pricing-UI migration to Logistic · `Frontend + Backend` · `P2`
- Manage Flex pricing in Logistic (Core stays source-of-truth **or** store migrates — M1 decision); Next Portal reads a stable contract.

#### T2.5.3 — Invoicing + payroll automation (Finance module) · `Backend` · `P2`
- Compute invoice + payroll from **validated attendance × rate + approved OT + commission**, with revenue/payout/commission split — replacing the weekly manual PDF.

## Edge cases & open decisions (Phase 2)

| # | Item | Type | Best-practice resolution |
| --- | --- | --- | --- |
| E1 | **Confirmation ≠ attendance** | P1 | Two states; confirmation (reminder-WA) is never a payable basis |
| E2 | **Min-hours for a payable shift** | **SOP (Ops)** | Define `X` jam, no-checkout handling, and pay/no-pay owner for partial shifts |
| E3 | **Validator audit** | P1 | Store who validated + server timestamp (dispute defense) |
| E4 | **OT gated on attendance** | P1 | Cannot record OT before attendance is validated |
| E5 | **OT unit: time vs distance** | P1 | Capture jam/km per the client's pricing mode |
| E6 | **Batch OT (multi-rider)** | P1 | Same client/day; shared approval + evidence |
| E7 | **Flex vs non-Flex segmentation** | P1 | Billing-basis/OT only when `Client Service = Flex` |
| E8 | **Rider day-off ↔ slot conflict** | P2 | Warn + suggest cadangan when an assigned rider has a Day Off |
| E9 | **Pricing source = Core** | Eng | Recon reads rate from pricing master; define mid-period rate-change behaviour |
| E10 | **Multi-rider slot vs per-rider row** | Design | Calendar = per-client summary; Table = per-rider (chosen — better attendance/OT granularity) |
| E11 | **Payroll/invoice automation + Finance module** | P2 | Recon CSV now; automation later |

### Epic 2.x — Success metrics (HEART)

| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Self-service | Shift maintained in one system | 2 systems | 1 | schedule source audit |
| Task success | Shift-days backed by **validated + audited** attendance | ~0% | ≥ 95% | attendance record (validator+ts) vs invoiced days |
| Happiness | Overtime disputes / client / month | high (Alpha 1-min) | −50% | dispute log tagged `overtime` |
| Integrity | OT recorded with approval + evidence | ~0% structured | 100% | OT record completeness |
| Task success | Recon prepared without manual PDF | 100% manual PDF | ≥ 70% via export | `rekon_exported` per period |

---

# Phase 3 — Consolidation (brief)

Once Logistic is the single operational pane and pricing/invoicing/payroll are stable there, **deprecate the BackOffice pricing UI** for Flex, keep one unified pricing service that Next Portal reads, and fold `Fleet+` fully into `Flex`. No new capability — this closes the strangler-fig migration.

---

## Appendix A — Open decisions (owners + due)

| # | Decision | Options | Owner | Due |
| --- | --- | --- | --- | --- |
| A1 | **Category name final** | `Flex` (leaning) vs `Fleet+` (legacy); "Dedicated Courier" as service type | PM + BD | M1 |
| A2 | **Historical-data mapping** | how `Fleet+`/legacy rows map to `Flex` without loss | Eng | M1 |
| A3 | **Pricing store** | Core source-of-truth vs migrate to Logistic in P2 | Eng lead | M1 |
| A4 | **Express-guard behaviour** | hide-only vs block-only vs both (recommended) | PM + Eng | M1 |
| A5 | **Where service-type is chosen in the flow** | step 1 vs step 2 of pricing setup | Design + PM | M2 |
| A6 | **Attendance mechanism** | what validates presence per shift (existing Attendance vs new) | Eng + Ops | P2 kickoff |
| A7 | **Bulk-upload spec** | format/template + assign-rider column + dispatch toggle | Eng + Ops | P2 kickoff |
| A8 | **Overtime + extend SOP** | client-approval flow, evidence standard, responsible party | Ops | P2 kickoff |
| A9 | **PG Edam vs PG Restore** | DB tooling clarification raised in-meeting (technical aside) | Eng | when relevant |

## Appendix B — Reference numbers (from the 11 Aug session)

- Active clients: **26–27**; dedicated (daily) active: **14**; total riders ~**80** (Alpha **55**, rest **25** across clients).
- Daily-flat minimum: **Rp 200.000 / shift / rider**; example split: revenue 200k → rider payout 140k.
- Commission: **15–20%**, flat per client, by work complexity.
- Overtime: **Rp 30.000–40.000 / hour**, time-based common; distance-based only where distance is known.
- Shift: **8 hours incl. break**; start varies (mostly 08:00–09:00).
- Next-Portal dedicated example: **MAP Boga**. Bulk-upload-heavy clients: **TPI**, Next-Portal clients. Non-plotted example: **NCS** (just ensure rider attends).
