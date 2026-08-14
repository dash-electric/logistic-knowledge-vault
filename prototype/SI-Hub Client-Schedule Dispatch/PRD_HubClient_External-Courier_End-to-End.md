# Dash Logistic — Hub Client (External-Courier Partner) End-to-End — PRD (Draft v1)

| | |
| --- | --- |
| **Document** | PRD — Hub Client (External-Courier Partner), End-to-End |
| **Version** | Draft v1 |
| **Date** | 14 August 2026 |
| **Owner** | Product & Design (Dash) |
| **Status** | Draft — approval requested for Phase 0–2 (internal); Phase 3–4 scoped, sequenced |
| **Domain** | Dash Logistic (Mithril) · Next Portal |
| **Framing** | Reusable **Hub Client / external-courier** capability |
| **Pilot 0** | Dash × NCS × Polda Bali — e-tilang (surat tilang) last-mile, Bali |
| **Surfaces** | Mithril (build & ops) · Next Portal (partner/customer monitoring) · partner courier app (rider execution) |
| **Volume (pilot)** | ~1,200–1,300 letters/day · riders: Denpasar 14, Badung 5 · SLA ≤ 5 days · success target 95% |
| **Pickup points** | Polda Bali · Polres Denpasar · Polres Badung (client-owned "Hub Client") |
| **Source input** | Technical alignment on 13 Aug 2026 (Dash × NCS) |

---

The product spec for a reusable **Hub Client** capability in the internal ops dashboard **Dash Logistic (Mithril)**: let Ops create shipments that are **picked up from a client-owned point** (not a Dash hub), dispatch them on a **scheduled cadence**, and let the partner/customer **monitor delivery via Next Portal**. Pilot 0 is the **Dash × NCS × Polda Bali e-tilang** operation — high-volume court-summons (surat tilang) last-mile in Bali. The capability is designed generically so any future external-courier / client-pickup partner can reuse it.

> **Build status.** The Mithril prototype was delivered & verified 14 Aug 2026, covering the three internal build asks: **(1)** Create Shipment → *Hub Client* tab; **(2)** Dispatch → *Export dispatch*; **(3)** *Jadwal Dispatch* (scheduled dispatch, SI H-1) as a Dispatch submenu. Engineering approval requested for **Phase 0–2 (internal)**; **Phase 3 (Next Portal monitoring)** is scoped here but sequenced after the internal loop is stable.

> **Key architecture decision (from the 13 Aug NCS technical meeting).** This is **NOT** a live Dash↔NCS API integration. NCS's own courier app already records every delivery, and Polda's data feed is still manual (Excel/spreadsheet, no route data). Therefore: Dash **uploads recipient data as CSV / form entry** into Mithril, runs it on the **Scheduled Instant (SI)** model (**H-1 upload → H0 dispatch/deliver**), Dash **owns routing & rider allocation** (NCS has none), and the partner/customer gets **read-only monitoring via Next Portal**. IT-NCS ↔ IT-Dash can align on API later; this phase does not depend on it.

## How to read this document

Structure is **Phases → Epics → Tickets**, phased by **release wave** (the order each slice ships), not by platform. The document opens with product-level framing (Problem, Context, Users, Goals, Metrics), a **Release timeline**, and **Cross-cutting standards** every epic inherits. Each **Epic** is specified in full: **Problem · Context · Scope (in/out) · Requirements (Tickets) · Success metrics (HEART)**.

Each **Ticket** carries a title tagged with the owning discipline **`Backend` / `Frontend` / `Ops`** and a **priority** **`P0`** (must-ship) / **`P1`** (high) / **`P2`** (later); an **Entry point**; a **User story** (`As a <role>, I want <capability> so that <outcome>`); **Acceptance criteria** as titled **GIVEN → WHEN → THEN** contracts (one behaviour per AC, optional *Tech:* note); and, where they help, **Technical notes / Empty state / Edge cases**. A **Prototype status** line states what the delivered prototype implements vs the intended requirement. Ticket ids are `T<phase>.<epic>.<n>`; ACs are `AC-<phase>.<epic>.<n>.<m>`.

---

## Problem

Dash is contracted (via **NCS**, the courier that holds the **Polda Bali e-tilang** account) to run **last-mile delivery of e-tilang letters** in Bali — projected **~1,200–1,300 letters/day** at pilot, growing. Today's operating reality creates five problems Mithril does not yet address:

1. **The pickup point is not a Dash hub.** Letters originate at **client-owned points** — Polda Bali, Polres Denpasar, Polres Badung. Mithril's Create Shipment only models origin as a **Dash Hub** (or the UJP-gated 4W route). There is no way to create a shipment whose pickup is a *client* location.
2. **No system routing on the partner side.** NCS's app records deliveries but **has no route/allocation engine**; Polda still shares data as **Excel/spreadsheet**. Dash's value is precisely **routing + rider allocation** — but Dash has no place to ingest the recipient list and turn it into dispatchable, routed work.
3. **The cadence is scheduled, not on-demand.** The operational SOP is **H-1**: the polres/polda sends a sheet, admin turns it into resi (~30 min for thousands of rows) and pastes onto letters, prints at H0, hands to NCS, capture at H-1. Mithril has **no scheduled-dispatch** mechanism to fire a hub's dispatch automatically at a set time.
4. **Partner/customer has no monitoring surface.** NCS and the customer (Polda/Polres) need delivery visibility + reporting, but there is **no read-only external view** of Dash-run deliveries for this account. Admin currently downloads reporting from NCS by hand.
5. **Reporting export is manual.** Dispatch data (rider, zone, resi, recipient, status, POD) cannot be exported from Mithril for reconciliation with the partner; the dispatch board is view-only.

Compounding all five: the success bar is **95%** (NCS's existing Sumatra runs sit **below 95%**, driven by **address-not-found** — data is *nama + alamat per KTP only*), so **address-not-found → return-to-origin** must be a first-class, admin-controllable outcome, and only **successful deliveries** count toward courier fee.

## Context

This is an **internal Mithril capability** plus an **external monitoring view on Next Portal** — not a new engine and not an API integration. It reuses Mithril's existing **hub → dispatch → delivery** spine and the **Scheduled Instant (SI)** scheduling model already in the platform. "Hub Client" is a new **origin type**: a client-owned pickup point registered by Ops in **Master · Hubs** (backoffice), selectable when creating a shipment. Rider execution happens in the **partner's app (NCS)** — Dash does **not** ship a driver app for this account in Phase 0; Dash provides routing/allocation and downloads reporting from NCS (and, later, exposes its own monitoring via Next Portal).

**Pilot 0 — Dash × NCS × Polda Bali (e-tilang).** Three maintained pickup points: **Polda Bali, Polres Denpasar, Polres Badung**. Riders: **Denpasar 14, Badung 5**. Admin: **2 per polda / 1 per polres** (mixed NCS + Dash rep); the **Dash admin sets routes & rider allocation**. SLA **≤ 5 days**; working days **Mon–Sun per polres/polda request**. Time zone caveat: platform standard is **WIB**; Bali is **WITA** — schedules are entered in **WIB** and converted operationally. Data is **assessed internally first** regardless of whether an NCS API lands later.

## Users & jobs

| Role | Surface | Job to be done |
| --- | --- | --- |
| **Ops admin (Dash)** | Mithril | Register the Hub Client; create a Hub-Client shipment (upload/entry recipients); set the dispatch schedule; own routing & rider allocation; export dispatch reporting; action address-not-found → return-to-origin |
| **Ops / BackOffice (Dash)** | Mithril · Master | Register the physical **Hub Client** (client-owned pickup point) so it is selectable in Create Shipment |
| **Rider (Dash, via partner app)** | NCS app | Execute delivery, capture proof — recorded in NCS's system (Dash pulls reporting) |
| **Partner PIC (NCS)** | Next Portal | Monitor delivery status & download reporting for the account |
| **Customer PIC (Polda / Polres)** | Next Portal | Track delivery progress / success rate for their letters |

## Goals

1. Let Ops **create a shipment whose pickup is a client-owned point** (Hub Client), with recipients entered by **form or CSV**, and a **live "Tinjau Pesanan" (review) panel** — mirroring the Dash-Hub bulk-shipment flow.
2. Let Ops **schedule dispatch per hub/pitstop at a set time (WIB)** on the **SI H-1 → H0** model, without touching each shipment manually.
3. Let Ops **export dispatch data** (configurable columns) as CSV for partner reconciliation.
4. Let the **partner/customer monitor delivery via Next Portal** (read-only), replacing manual reporting hand-off.
5. Make **address-not-found → return-to-origin** a first-class admin outcome, and instrument **success rate** toward the **95%** bar.

**Non-goals (this phase):** live Dash↔NCS API integration (import/CSV first; align later); a Dash driver app for this account (riders use the NCS app); automatic WITA↔WIB conversion in the scheduler UI (entered as WIB, converted operationally — documented, not built); RT/RW hand-off as a delivery outcome (pending Polda confirmation it is permitted); billing/fee computation from success rate (reporting exposes the inputs; fee logic out of scope).

## Success metrics (product-level · HEART)

Baselines set in pilot week 1 (Polda Bali). "before = 0/manual" where the surface didn't exist. Instrumented in Mithril (Mixpanel) + Next Portal.

| HEART | Metric | Baseline (before) | Target (after) | Instrument |
| --- | --- | --- | --- | --- |
| **Task success** | Recipient list → dispatchable shipment without leaving Mithril | 0 (no Hub-Client path) | ≥ 90% of pilot batches created via Hub Client tab | `shipment_created{type=HUB_CLIENT}` |
| **Adoption** | Scheduled dispatch replaces manual per-batch dispatch | 100% manual | ≥ 80% of pilot dispatches fired by schedule | `dispatch_run{trigger=schedule}` / total |
| **Task success** | Delivery success rate (successful / total) | < 95% (NCS Sumatra) | ≥ 95% by end of pilot | reporting export · status=success/total |
| **Effort** | Reporting hand-off effort (manual download from NCS) | manual per day | ≥ 70% of pilot reporting via one-click export | `dispatch_exported` per day |
| **Task success** | Address-not-found routed to return-to-origin (not lost) | ad-hoc | 100% of not-found items in a return-to-origin state | `delivery_status{=RETURN_ORIGIN}` |
| **Adoption** | Partner/customer activation on Next Portal within 7 days | 0 (no surface) | ≥ 1 active partner PIC + ≥ 1 customer PIC | `session_started` first-occurrence per portal account |
| **Self-service** | Ops registers a Hub Client with no engineering ticket | 0 (hardcoded hubs) | ≥ 1 Hub Client registered by Ops in pilot | Master · Hubs audit log |

---

## Release timeline & milestones

Business weeks (Aug 2026): **W2 = 11–15 Aug · W3 = 18–22 Aug · W4 = 25–29 Aug.**

| # | Milestone / track | Window | Owner | Status |
| --- | --- | --- | --- | --- |
| M0 | **Prototype (Mithril)** — Hub Client tab · Export dispatch · Jadwal Dispatch | **14 Aug (W2)** | Product/Design | **Done** |
| M1 | **Master · Hub Client registration** (backoffice) + data model | W3 | Backend + Ops | Planned |
| M2 | **Create Shipment — Hub Client** (form/CSV + review) | W3 | Frontend + Backend | Planned |
| M3 | **Dispatch — Export + Jadwal Dispatch (SI H-1)** | W3 → W4 | Frontend + Backend | Planned |
| M4 | **Pilot dry-run** — one Polda Bali batch end-to-end (create → schedule → dispatch → export) | **W4** | Ops + Eng | Planned |
| M5 | **Next Portal monitoring** for NCS + customer | W4 → after internal stable | Frontend + Backend | Planned |
| M6 | **Rider onboarding (NCS app) + admin training** | W4 | EPD + Ops | **TBC (NCS/Polda)** |

> **Sequencing rationale.** Hub Client registration (M1) unblocks Create Shipment (M2), which feeds Dispatch/Schedule (M3). The internal loop must run one **real Polda Bali batch** (M4) before the external monitoring surface (M5) is exposed to the partner. Rider onboarding depends on NCS/Polda scheduling.

---

## Cross-cutting standards

**Not-an-API contract.** Phase 0–3 use **CSV upload / form entry + scheduled dispatch + read-only portal**. No synchronous Dash↔NCS calls. Resi/AWB are generated **partner-side (NCS)**; Dash ingests **recipient identity only** and enriches with **zone, rider, schedule, route**. Any future API is additive and must not change the Ops flow.

**Hub Client = origin type (not a Dash hub).** A Hub Client is a **client-owned pickup point** with `{code, name, partner, zone, riders, area, address, coord}`, registered in **Master · Hubs** with a `hub_kind = HUB_CLIENT` flag. It is selectable as **origin** in Create Shipment and as **scope** in Jadwal Dispatch. It never counts as Dash hub capacity.

**Recipient data minimalism (KTP-only).** Ingested fields per recipient: **`nama`, `alamat`** (both required, per KTP), optional **`no_ref`** (client reference / tilang no). No phone, no PII beyond name+address. Address quality is the dominant success-rate risk — surface it, don't hide it.

**Scheduled Instant (SI) model — H-1 → H0.** Data uploaded **H-1**; a **Jadwal Dispatch** rule fires the dispatch automatically at a set **WIB** time on **H0** for items already in that hub's pipeline. Commit still passes the existing **scan gate**. Manual "Create dispatch" remains available as override.

**Address-not-found → return-to-origin.** When a delivery cannot complete due to address-not-found, the item moves to an admin-actionable **return-to-origin** state (returned to the Hub Client). Only **successful** deliveries count as delivered (courier-fee input). RT/RW hand-off is **not** a permitted alternative until Polda confirms.

**Time zone.** Schedules are entered and displayed in **WIB**. Bali operates in **WITA** (WIB+1). Conversion is operational (documented in-UI), not automated in Phase 0.

**Monitoring boundary.** The partner/customer surface is **Next Portal (read-only)**. Dash Link is **not** used for this account. Ops reporting export (CSV) is the interim reconciliation channel until Next Portal monitoring ships.

**Audit log & access control (cross-cutting — applies to every data mutation).** These are two distinct concerns; the product needs both:
- **Audit log / change history (who-did-what-when).** Every create / edit / delete / activate-deactivate on a governed entity — **Hub Client registration, shipment, dispatch schedule, and dispatch** — records an immutable entry: **actor name + email, action, timestamp, and a before→after diff** where practical. Each entity's detail view shows its **"Riwayat perubahan"**; an org-level activity log is available to admins. Entries are never editable or deletable. *(In the prototype this is implemented for the dispatch schedule — create/edit/delete/toggle each write an entry with name, email, timestamp; the same pattern extends to the other entities.)*
- **RBAC (who-is-allowed).** Access is role-scoped. Proposed roles: **Ops Admin** (full CRUD on shipments/schedules within their hubs/clients), **Ops Viewer** (read + export only), **Hub/BackOffice** (register Hub Clients, manage master), **Finance/BD** (read + reporting), **Partner/Customer** (Next Portal, read-only, single-account scoped). RBAC governs *permission*; the audit log records *what was done* — one does not replace the other. Server enforces both (client hiding is not security).

**Create-Shipment interaction standards (design, revised 14 Aug).** These govern every shipment type, so the surface scales as types grow:
- **Type-first, dedicated form.** Shipment type is chosen **at launch** from a grouped menu off the "Buat Shipment" button (Direct / Hub / Docking …), because the type changes the entire downstream form. The chosen type shows inside the form as a **breadcrumb chip with "Ganti tipe"** — *not* as in-form tabs or a 2-row card grid (both break down past ~4 types). Adding a type = one menu row + its form; no layout rework.
- **CSV is a *method* within a type, not a parallel path.** North-star: every create path (manual rows + CSV) lives under a chosen type. The current top-level "Import CSV" button stays as-is this phase (retrofitting it under Direct 2W touches existing data mappings = high effort, low near-term impact) — documented as debt, not built.
- **One review surface.** For high-volume internal entry, the form is **one screen with a persistent summary sidebar** (the review), and the primary CTA creates directly via a lightweight confirm dialog. No separate review page — rows are already visible, so a second screen adds a click without adding safety.
- **Single source of truth for dispatch time.** The shipment's dispatch time is **derived read-only from the Hub Client's active Jadwal Dispatch rule** — never a free-text/So dropdown. No rule → the field blocks with a link to create one. This keeps Create and Jadwal Dispatch from drifting.
- **Detail parity, split by cargo kind.** Non-4W shipments (incl. Hub Client) render the **standard detail** — Details / Parties / Route / Items-with-deliveries — identical across non-4W clients. The 4W step/spine detail is reserved for `exim` shipments only. The detail **adapts to cargo kind**: a **document** shipment (e-tilang: `cargo = doc`) **omits koli / weight / volume / package-type / size / insurance** — they don't apply to a letter — and shows a document-oriented item row (ref + address); a **parcel** shipment shows the full koli/weight/volume/type set. Same layout, fields gated by cargo kind.
- **Service scoping per Hub Client (not the retail menu).** A Hub Client does **not** expose the retail express menu (Express Now / Same Day / Next Day / Regular). Scheduled bulk courier (e-tilang) is inherently **`Terjadwal` (Scheduled)** — the service is set automatically, not chosen, and **no package-protection/insurance** option is shown. The service set is a **per-Hub-Client config** (`cargo`, `service`), so a future partner that genuinely needs, say, Same-Day can be configured without code — but the default for a document courier is Scheduled-only.
- **Config-driven operational rules.** The create-form operational notes (SLA, success target, return policy, monitoring surface, rider-app) are **read from each Hub Client's config**, never hardcoded per partner — so different partners with different terms render correctly, and a Hub Client with none shows nothing. Fields: `slaDays, successTarget, returnPolicy, monitoring, riderApp, partner, cargo, service`.
- **Final-verification confirm.** Creating a batch opens a confirm dialog that **lists every recipient (name + address)** for a last check before commit — not just a count. The primary create action carries the count; a Batal/close is always present.
- **Modal dismissal (all surfaces).** Every modal closes via **(1)** an explicit X / Batal, **(2)** click-outside (backdrop), and **(3)** Esc. Full-screen create layers (Hub Client, 4W) close via X, an explicit **Batal**, and Esc. No modal can trap the user (the earlier "must refresh to close" bug).
- **Schedule ↔ shipment coupling stays one-directional.** Create reads the dispatch time from Jadwal Dispatch (read-only). Ops never types a dispatch time on the shipment.

---

# Phase 0 — Master: Hub Client registration (backoffice)

**Problem.** Create Shipment can only pick Dash Hubs; there is no way to register a client-owned pickup point. **Context.** Ops needs a backoffice entry so the 3 pilot points (and future partners) become selectable. **Scope — in:** a `HUB_CLIENT`-kind hub with the fields above, managed in Master · Hubs. **Out:** capacity/zone-radius modelling beyond what Dash hubs already have.

## Epic 0.1 — Hub Client master data

### Requirements — Tickets

#### T0.1.1 — Hub Client entity + registration in Master · Hubs · `Backend + Frontend` · `P0`
- **Entry point** — Mithril · Master · Hubs · "Add hub" → kind = **Hub Client**.
- **User story** — *As an Ops/BackOffice admin, I want to register a client-owned pickup point so that it can be selected as a shipment origin and a dispatch-schedule scope.*
- **Acceptance criteria**
  - **AC-0.1.1.1 — Register Hub Client.** **GIVEN** I am in Master · Hubs **WHEN** I add a hub with kind `HUB_CLIENT` and fill `name, partner, zone, riders, area, address, coord` **THEN** it persists and appears in the hub list tagged **Hub Client**. *Tech: `hub_kind` enum `{DASH_HUB, HUB_CLIENT}`; reuse the hub table.*
  - **AC-0.1.1.2 — Selectable as origin.** **GIVEN** a registered Hub Client **WHEN** Ops opens Create Shipment → Hub Client tab **THEN** it appears in "Pilih Hub Client". 
  - **AC-0.1.1.3 — Selectable as schedule scope.** **GIVEN** a registered Hub Client **WHEN** Ops opens Jadwal Dispatch → Tambah jadwal **THEN** it appears in the hub/pitstop list, labelled "(Hub Client)".
  - **AC-0.1.1.4 — Zone binds riders.** **GIVEN** a Hub Client with `zone` + `riders` **WHEN** it is chosen anywhere **THEN** its zone and rider count auto-populate downstream (read-only). *Pilot seed: Polda Bali/Polres Denpasar → Denpasar·14; Polres Badung → Badung·5.*
- **Prototype status** — Prototype **seeds** the 3 Hub Clients as data (`HUB_CLIENTS`) and consumes them in Create Shipment, Jadwal Dispatch, and Export scope. The **backoffice registration screen itself is not built** — this ticket delivers it (flagged as a PRD note per the 13 Aug decision).

### Epic 0.1 — Success metrics (HEART)
| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Self-service | Hub Client registered by Ops without eng ticket | 0 | ≥ 1 in pilot | Master audit log |
| Task success | Registered Hub Client selectable in all 3 surfaces | n/a | 100% | manual QA + `hub_selected{kind=HUB_CLIENT}` |

---

# Phase 1 — Create Shipment: Hub Client

## Epic 1.1 — Hub Client shipment creation

**Problem.** No path to create a shipment picked up at a client point with a bulk recipient list. **Context.** Mirror the existing **Dash-Hub bulk-shipment** UX (2-panel: form left, review right) but with a **Hub Client** origin and **KTP-minimal recipients**. **Scope — in:** a new **Hub Client** tab in Tipe Shipment; form + CSV recipient entry; live review; create. **Out:** UJP gating (that is the 4W path); pricing/protection tiers (courier account, not retail).

### Requirements — Tickets

#### T1.1.1 — "Hub Client" tab in Tipe Shipment · `Frontend` · `P0`
- **Entry point** — Mithril · Shipments · Buat Shipment · **Tipe Shipment** tab bar.
- **User story** — *As an Ops admin, I want a Hub Client shipment type alongside Direct 4W so that I can create client-pickup shipments without misusing the 4W/UJP flow.*
- **Acceptance criteria**
  - **AC-1.1.1.1 — Peer tab.** **GIVEN** Create Shipment **WHEN** I view Tipe Shipment **THEN** I see **Hub Client** as a selectable peer to Docking (Soon), Direct 2W (Soon), Direct 4W.
  - **AC-1.1.1.2 — Switch preserves chrome.** **GIVEN** I am in Hub Client **WHEN** I click Direct 4W **THEN** the wizard switches to the 4W flow (and back), without a dead-end.
- **Prototype status** — Implemented. Hub Client appears both as a **type card** in the wizard's Tipe-pengiriman grid and as an **active tab** in the Hub Client form's own tab bar; selecting it opens the Hub Client 2-panel create screen.

#### T1.1.2 — Hub Client form (origin, partner, schedule) + live review · `Frontend + Backend` · `P0`
- **Entry point** — Buat Shipment · Hub Client.
- **User story** — *As an Ops admin, I want to pick the Hub Client, partner, and dispatch schedule with a live review so that I can create a correct batch in one screen.*
- **Acceptance criteria**
  - **AC-1.1.2.1 — Origin.** **GIVEN** the form **WHEN** I open "Pilih Hub Client" **THEN** I select from registered Hub Clients; zone + rider count auto-fill read-only.
  - **AC-1.1.2.2 — Schedule (SI).** **GIVEN** the form **WHEN** I set Tanggal kirim (H0) + Jam dispatch (WIB) **THEN** the copy states "data uploaded H-1, dispatched/delivered H0" and the review reflects it.
  - **AC-1.1.2.3 — Live review panel.** **GIVEN** the right-side "Tinjau Pesanan" panel **WHEN** I change hub/schedule/recipients **THEN** it live-updates Hub Client, partner, zone, schedule, and recipient count, and shows operational notes (SLA ≤ 5 days, target 95%, address-not-found → return-to-origin, monitoring via Next Portal).
  - **AC-1.1.2.4 — Review → confirm.** **GIVEN** valid input **WHEN** I click "Tinjau pesanan →" **THEN** I see a full recipient table and "Konfirmasi & Buat (n)"; confirming creates the shipment and lands items in the dispatch pipeline. *Tech: shipment `type=HUB_CLIENT`, `origin=hub_client_code`, `schedule={date,timeWIB}`.*
- **Prototype status** — Implemented end-to-end (form → review → confirm toast). Recipient count in the review panel updates on structural change; server would recompute on save.

#### T1.1.3 — Recipient entry: form rows + CSV import (KTP-minimal) · `Frontend + Backend` · `P0`
- **Entry point** — Buat Shipment · Hub Client · "Penerima".
- **User story** — *As an Ops admin, I want to add recipients by manual rows or CSV so that I can handle both small lists and thousand-row daily batches.*
- **Acceptance criteria**
  - **AC-1.1.3.1 — Manual rows.** **GIVEN** Input manual **WHEN** I add rows **THEN** each row captures **Nama penerima (req)** + **Alamat/KTP (req)**; I can add/remove rows.
  - **AC-1.1.3.2 — CSV import.** **GIVEN** Import CSV **WHEN** I upload a file with columns `hub_client, nama, alamat, no_ref?` **THEN** rows populate and switch to a reviewable list; a template is downloadable.
  - **AC-1.1.3.3 — Validation.** **GIVEN** rows **WHEN** I proceed **THEN** only rows with both nama + alamat count; empty/partial rows are excluded with a clear message. *Tech: dedupe by (nama, alamat); flag suspected-incomplete addresses for the success-rate risk.*
- **Empty state** — one blank row; CSV panel shows the column contract + template link.
- **Edge cases** — thousands of rows (virtualize/paginate the review table); duplicate recipients; address obviously incomplete (soft-warn, do not block).
- **Prototype status** — Implemented: manual rows (add/remove, live valid-count), Import CSV toggle with template link + simulated import that fills 6 Bali sample recipients. Real CSV parse/upload is the build.

### Epic 1.1 — Success metrics (HEART)
| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Task success | Batch created via Hub Client tab | 0 | ≥ 90% of pilot batches | `shipment_created{type=HUB_CLIENT}` |
| Effort | Time from recipient list → created shipment | manual (~30 min/thousand) | −50% via CSV | timer: import→confirm |
| Task success | Recipients ingested with valid nama+alamat | n/a | ≥ 98% of rows | validation reject rate |

---

# Phase 2 — Dispatch: Export + Jadwal Dispatch (SI)

## Epic 2.1 — Export dispatch

**Problem.** The dispatch board is view-only; partner reconciliation is manual. **Context.** Add a configurable CSV export. **Scope — in:** column picker, range/scope filters, CSV. **Out:** scheduled/automated export delivery (later).

### Requirements — Tickets

> **Export design (senior product + data).** The export is **reconciliation-first**: 1 row = 1 recipient/item, columns grouped so three systems (client sheet ↔ Dash ↔ courier) join cleanly. **Identity keys are always exported and cannot be unchecked** — `Kode dispatch, Tanggal, Resi/AWB, Nama penerima, Alamat penerima, Status kiriman`. Optional groups: **Client & alokasi** (`Client, Hub/Hub Client, Zona rider, Rider, Ref/PO`), **Waktu** (`Jam dispatch, Waktu update`), **Hasil** (`Link foto/POD, Catatan/alasan gagal`). Client-dependent columns degrade gracefully: `Jam dispatch` fills only for scheduled dispatches (blank for manual — same UI, no per-client variant), and `Ref/PO` is generic (no. tilang for e-tilang, PO for parcel clients). No separate resi/PO toggles beyond these — resi/AWB is a mandatory key, not an option.

#### T2.1.1 — Export dispatch (configurable columns) · `Frontend + Backend` · `P0`
- **Entry point** — Mithril · Dispatches · header · **Export dispatch**.
- **User story** — *As an Ops admin, I want to export dispatch data with chosen columns so that I can reconcile with NCS and report to the customer.*
- **Design principle — reconciliation-first, one export.** Export Dispatch is the **single detailed per-recipient export** (1 row = 1 recipient). It is grouped so the three systems (client sheet ↔ Dash ↔ NCS) can be joined: **Identitas** (`code, date, waybill/AWB, nama penerima, alamat` — **required, always exported**, the join keys), **Client & alokasi** (`client, hub/Hub Client, zona, rider(nama·kode), PO/Item`), **Waktu** (`jam dispatch, waktu update`), **Hasil** (`status kiriman, link foto POD, catatan/alasan gagal`). There is **no separate "resi" column** — the courier identifier is `Waybill / AWB`; `PO / Item` is the client reference (blank where a client has none, e.g. e-tilang).
- **Acceptance criteria**
  - **AC-2.1.1.1 — Grouped picker, required keys.** **GIVEN** the export dialog **WHEN** I open it **THEN** columns are grouped (Identitas / Client & alokasi / Waktu / Hasil); the Identitas + Status columns are **required (checked, non-removable)** so an export always reconciles; a live count shows total selected.
  - **AC-2.1.1.2 — Period + status + scope filters.** **GIVEN** the dialog **WHEN** I set date range, status (e.g. only `Committed`/`Completed`), and hub scope (incl. Hub Client) **THEN** the export honours them — so "how many completed in this period" is a filter, not a guess.
  - **AC-2.1.1.3 — Client-adaptive columns.** **GIVEN** a column that doesn't apply to a client (e.g. `jam dispatch` for a manually-created dispatch, `PO/Item` for e-tilang) **WHEN** exported **THEN** the cell is **blank** — no separate UI per client, one schema for all.
  - **AC-2.1.1.4 — Output.** **GIVEN** the dialog **WHEN** I click Download CSV **THEN** a UTF-8 CSV is produced; waybill/AWB + status originate from the hub's shipment source (partner system where applicable), enriched by Dash zone/rider/schedule.
- **Prototype status** — Implemented: grouped dialog (6 required + 8 optional), period/status/scope filters, live count, download toast, with the "blank where N/A" note. Real CSV assembly + source join is the build.

### Epic 2.1 — Success metrics (HEART)
| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Effort | Reporting produced via one-click export | 0 | ≥ 70% of pilot days | `dispatch_exported` |
| Task success | Export contains reconcilable keys (resi + status) | n/a | 100% of exports | column presence check |

## Epic 2.2 — Jadwal Dispatch (scheduled dispatch · SI H-1)

**Problem.** No mechanism to fire a hub's dispatch automatically at a set time. **Context.** SI model — H-1 upload, H0 dispatch — needs a per-hub schedule rule. **Scope — in:** a Dispatch **submenu** listing schedule rules; create/toggle/delete a rule (hub/pitstop, time WIB, active days, multi-client scope); duplicate to another hub. **Out:** automatic WITA↔WIB conversion in-UI; sub-hub/pitstop geofencing beyond hub selection.

> **Model decision — one rule = one hub.** A schedule rule targets **exactly one hub** (each hub has its own zone, rider pool, on/off state, and independent failure mode — a rule spanning many hubs would hide those). To apply the same cadence elsewhere, Ops uses **Duplicate** (clones time/days/client-scope, pick a new hub). Client scope within a hub is **multi-select** (All, or specific clients — a hub can serve several). A same-hub + same-time active rule is blocked as a likely duplicate.

### Requirements — Tickets

#### T2.2.1 — Jadwal Dispatch board (submenu under Dispatch) · `Frontend` · `P0`
- **Entry point** — Mithril · nav · Hub Ops · **Dispatches → Jadwal Dispatch** (sub-item).
- **User story** — *As an Ops admin, I want a list of dispatch schedules under Dispatch so that the auto-dispatch config lives next to the runs it produces.*
- **Acceptance criteria**
  - **AC-2.2.1.1 — Entry point.** **GIVEN** the nav **WHEN** I expand Dispatches **THEN** I see "Jadwal Dispatch" as a submenu that routes to the schedule board. *(Decision: submenu under Dispatch, not a Schedule tab.)*
  - **AC-2.2.1.2 — Board.** **GIVEN** the board **WHEN** it loads **THEN** each rule shows hub/pitstop (+kind), client scope, jam (WIB), active days (Sen–Min), status, and per-row actions (on/off + delete); plus summary stats (total, active, Hub Client).
  - **AC-2.2.1.3 — Row → detail.** **GIVEN** a rule **WHEN** I click it **THEN** a detail drawer shows its config + a **run history** (summary per run). Each run row **deep-links into Export Dispatch** for the per-recipient detail — there is **no separate detailed run-export** (avoids redundancy with Export Dispatch). The run's item count = items **dispatched** at run time, not yet-completed.
- **Prototype status** — Implemented: submenu, board (with delete + empty state), 3 stats (total/active/Hub Client — dropped the "next run" card), per-row on/off toggle, row → detail drawer with deep-linking run history, seeded with the 3 Polda Bali rules + a disabled Dash-Hub example.

#### T2.2.2 — Create/edit schedule rule · `Frontend + Backend` · `P0`
- **Entry point** — Jadwal Dispatch · **Tambah jadwal**.
- **User story** — *As an Ops admin, I want to set a hub's dispatch time and active days so that dispatch fires automatically on the SI H-1 cadence.*
- **Acceptance criteria**
  - **AC-2.2.2.1 — Create (one hub).** **GIVEN** the dialog **WHEN** I pick **one** hub/pitstop, jam (WIB), active days, and a client scope **THEN** a rule is created and appears active on the board; the hub's zona rider auto-shows (from Hub Client config) so its source is explicit.
  - **AC-2.2.2.2 — Multi-client scope.** **GIVEN** the scope control **WHEN** I choose "Semua client" or tick specific clients **THEN** the rule stores that scope and the board shows it (e.g. "Semua client", "NCS", or "3 client").
  - **AC-2.2.2.3 — Duplicate to another hub.** **GIVEN** an existing rule **WHEN** I click Duplicate **THEN** a create dialog opens pre-filled with the same time/days/client-scope and an empty hub, so I only pick the target hub.
  - **AC-2.2.2.4 — Conflict guard.** **GIVEN** an active rule for a hub at a time **WHEN** I try to save another active rule for the same hub + time **THEN** it blocks with a message.
  - **AC-2.2.2.5 — Validation + WIB.** **GIVEN** the dialog **WHEN** I save with no hub or no active day **THEN** it blocks; times are stated in **WIB** with a WITA-conversion note.
  - **AC-2.2.2.6 — Edit & delete.** **GIVEN** a rule **WHEN** I Edit it **THEN** the dialog opens pre-filled (hub, time, days, client-scope, catatan) and Save **updates in place** (title "Edit", CTA "Simpan perubahan"); Delete removes it with confirm. Manual dispatch remains available.
  - **AC-2.2.2.7 — Multi-client via dropdown.** **GIVEN** the Scope client control **WHEN** clients grow **THEN** it is a **dropdown + checklist** (not inline chips) so it scales: a summary label ("Semua client" / "NCS" / "3 client dipilih") over a checkbox list.
  - **AC-2.2.2.8 — Audit.** **GIVEN** any create/edit/delete/toggle **THEN** an audit entry (actor name + email + timestamp + action) is written and shown in the rule's **Riwayat perubahan**.
- **Prototype status** — Implemented: dialog (single hub w/ placeholder, **multi-client dropdown-checklist**, time WIB, day pills, catatan, X-close), zona-rider auto-display, conflict guard, **Edit (update-in-place)**, Duplicate, delete-with-confirm, row → detail drawer (config + run history + **Riwayat perubahan / audit log**), empty state. Scheduler job is the backend build.

### Epic 2.2 — Success metrics (HEART)
| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Adoption | Dispatches fired by schedule vs manual | 100% manual | ≥ 80% scheduled | `dispatch_run{trigger}` |
| Task success | Scheduled dispatch fires on correct day/time | n/a | ≥ 99% on-time | job log vs rule |
| Self-service | Rules created/edited by Ops without eng | 0 | ≥ 3 in pilot | schedule audit log |

---

# Phase 3 — Next Portal monitoring (partner + customer)

## Epic 3.1 — Read-only delivery monitoring

**Problem.** Partner/customer have no self-serve delivery visibility; reporting is hand-delivered. **Context.** Expose Dash-run delivery status + success rate + downloadable reporting to NCS and the customer on **Next Portal (read-only)**. **Scope — in:** account-scoped delivery list, status/success-rate summary, reporting download. **Out:** any write action; Dash Link; live map (P2).

### Requirements — Tickets

#### T3.1.1 — Partner/customer monitoring view · `Frontend + Backend` · `P1`
- **Entry point** — Next Portal · account login (NCS / Polda-Polres PIC).
- **User story** — *As a partner/customer PIC, I want to monitor my account's deliveries so that I no longer depend on a manual report.*
- **Acceptance criteria**
  - **AC-3.1.1.1 — Scoped list.** **GIVEN** a portal account **WHEN** I open monitoring **THEN** I see only my account's shipments/deliveries with status, zone, date; no cross-account data.
  - **AC-3.1.1.2 — Success rate.** **GIVEN** the view **WHEN** it loads **THEN** it shows delivered / total + success rate against the 95% bar, and a return-to-origin count.
  - **AC-3.1.1.3 — Reporting download.** **GIVEN** the view **WHEN** I export **THEN** I get the same reconcilable CSV as Ops (account-scoped). *Tech: reuse the T2.1.1 column contract, scoped by account.*
- **Prototype status** — **Not built this pass** (internal-first). Scoped here; sequenced after the internal loop runs one real batch (M4 → M5).

#### T3.1.2 — Analytics & instrumentation · `Backend + Frontend` · `P1`
- **Acceptance criteria** — **AC-3.1.2.1** emit `session_started`, `shipment_tracked`, `report_exported` per portal account for activation + effort metrics.
- **Prototype status** — Not built this pass.

### Epic 3.1 — Success metrics (HEART)
| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Adoption | Partner + customer activation within 7 days | 0 | ≥ 1 each | `session_started` first-occurrence |
| Effort | "Where is my delivery / report" load on Ops | high | −30% | CS tag + `shipment_tracked` |

---

# Phase 4 — Scaling intake (self-service upload → API)

> **The strategic question (VP).** Phase 0–3 assume a **Dash admin at the origin** turning the client's sheet into shipments. That's the correct *bootstrap* — it validates the flow with a human in the loop — but it is the **scaling bottleneck**: one admin per polda/polres, thousands of rows/day, manual re-keying. Phase 4 removes the human from the ingestion path in two sequenced steps.

## Epic 4.1 — Partner self-service upload (Next Portal)

**Problem.** Dash admin re-keys the client's sheet daily. **Context.** The partner already holds the source data; let them upload it into a Dash-owned intake, with Dash still owning routing/allocation. **Recommendation:** ship this **before** API — it removes the bottleneck with the least dependency and no NCS engineering.

**Scope — in:** a Next Portal **"Upload recipients"** flow scoped to the partner's Hub Client(s); an **Ops intake/review queue** in Mithril (validate → accept → becomes a Hub Client shipment). **Out:** client-side routing (Dash keeps routing); write access to delivery status.

- **T4.1.1 — Portal upload + intake queue · `Frontend + Backend` · `P1`.** Partner uploads CSV (same schema, Appendix B) scoped to their Hub Client; it lands in a Mithril **intake queue** (not directly live). Ops reviews (dedupe, address-quality flag, cutoff check) → **Accept** creates the Hub Client shipment; **Reject** returns it with a reason. *AC: uploads never auto-dispatch without Ops accept in Phase 4.1; idempotent per (batch_ref, hub, date).*
- **T4.1.2 — Cutoff & window enforcement · `Backend` · `P1`.** Uploads after the hub's **cutoff** roll to the next dispatch day; the portal states the cutoff and the resulting delivery date up front.
- **Note — surface choice.** For **NCS** (the partner) the upload surface is **Next Portal**. **Dash Link** is the equivalent surface for **general/other clients** who self-serve directly; the intake queue + validation are shared. Which clients get which portal is an account setting.

## Epic 4.2 — System-to-system API (NCS ↔ Dash)

**Problem.** Even self-service upload is a manual step. **Context.** When **IT-NCS ↔ IT-Dash align** (flagged "later" in the 13 Aug meeting) and NCS's system can push batches, replace upload with an API. **This is the north star, not the near-term build** — NCS data is still Excel today and the app has no route engine.

- **T4.2.1 — Inbound batch API + resi reconciliation · `Backend` · `P2`.** Accept recipient batches via API into the same intake pipeline; **resolve the resi-matching gap** (Dash shipment ↔ NCS resi ↔ POD) by exchanging a stable key at ingest time, so reconciliation stops being a manual CSV join. *This ticket also back-fills the Phase 0–3 gap where resi is only matched via export.*
- **T4.2.2 — Status/POD webhook back to partner · `Backend` · `P2`.** Push delivery status + POD reference so the partner's own system stays in sync without polling the portal.

**Decision framing (recommendation):** **do 4.1 now-ish, 4.2 when NCS is ready.** Self-service upload is high-impact / low-dependency and reuses everything already built; API is higher-impact but gated on a second party's roadmap. Building API first would idle behind NCS; building neither leaves Dash admins as the ceiling on volume.

### Phase 4 — Success metrics (HEART)
| HEART | Metric | Baseline | Target | Instrument |
| --- | --- | --- | --- | --- |
| Effort | Recipient batches ingested without Dash re-keying | 0% | ≥ 60% via portal upload | `intake_source{=portal}` / total |
| Task success | Uploads passing validation on first submit | n/a | ≥ 90% | intake reject rate |
| Adoption | Partner uses self-upload weekly | 0 | ≥ 1 partner steady-state | `upload_submitted` per partner/week |

---

## Appendix A — Pilot 0 operational flow (Dash × NCS × Polda Bali, e-tilang)

1. **H-1** — Polres/Polda sends the recipient sheet (nama + alamat, per KTP). Admin ingests into Mithril via **Hub Client** create (CSV/form). ~30 min to turn thousands of rows into resi (partner-side) + paste onto letters.
2. **H-1 capture** — letters printed, handed to NCS; items land in the Hub Client's dispatch pipeline.
3. **H0** — **Jadwal Dispatch** fires at the set WIB time; Dash admin owns routing + rider allocation (Denpasar 14 / Badung 5). Riders execute in the **NCS app**.
4. **Delivery** — success recorded (counts toward courier fee); **address-not-found → return-to-origin** (admin actions; RT/RW hand-off only if Polda confirms).
5. **Reporting** — Ops **Export dispatch** for reconciliation with NCS; partner/customer **monitor via Next Portal** (Phase 3).
- **Targets:** SLA ≤ 5 days; success ≥ 95% (address quality is the dominant risk).

## Appendix B — CSV recipient schema (Hub Client import)

| Column | Required | Notes |
| --- | --- | --- |
| `hub_client` | yes | Hub Client code/name (e.g. Polda Bali) |
| `nama` | yes | Recipient name, per KTP |
| `alamat` | yes | Full address, per KTP |
| `no_ref` | no | Client reference / tilang number |

Resi/AWB is **not** in the import — generated by the partner (NCS) system. Dash enriches with zone, rider, schedule, route.

## Appendix C — Decisions & open items

**Decided (13 Aug NCS meeting + internal):** CSV/form upload, not API (align IT-NCS↔IT-Dash later) · SI model (H-1 → H0) · Dash owns routing/allocation · riders use NCS app · monitoring on **Next Portal** (not Dash Link) · 3 maintained pickup points · success bar 95% · address-not-found → return-to-origin · WIB in-UI (WITA converted operationally).

**Open (needs confirmation):**
- **RT/RW hand-off** as a permitted alternative to return-to-origin — pending Polda confirmation.
- **Input window time** — how many hours the H-1 → H0 window actually allows for large batches (affects schedule defaults).
- **Working days** per polres/polda (Mon–Sun variable) — drives per-rule active-days defaults.
- **Fee/billing logic** from success rate — out of scope here; reporting exposes the inputs.
- **Future NCS API** — additive; must not change the Ops flow above.

## Appendix D — Prototype reference

The Mithril prototype (rev. 14 Aug 2026), built on the existing Shipment-Workflow base. Implements:
- **Create:** type chosen from a **grouped launch menu** (Direct / Hub / Docking); Hub Client form with **breadcrumb chip + Ganti tipe**, order *type → Hub Client/origin → Penerima → Jadwal*, recipient rows + Import-CSV method, **schedule-derived read-only dispatch time**, **single-screen + summary sidebar** (no separate review page), confirm-dialog create that lands a real shipment in the list.
- **Consistent type UI:** both the 4W wizard and the Hub Client form show the type as a **breadcrumb chip + Ganti tipe** (the old 4W card grid is gone).
- **Detail:** all non-4W shipments (Hub Client *and* parcel clients like SwipeRX/Zalora) render the **standard detail** (Details / Parties / Route / Items-with-deliveries). It **splits by cargo kind** — document (e-tilang) hides koli/weight/volume and shows `Terjadwal`; parcel shows the full set + real service (`Express Now` etc.). Includes a `RETURN ORIGIN` item state.
- **Config-driven copy:** the Hub Client create sidebar's operational notes come from per-Hub-Client config (SLA, success target, return policy, rider-app, monitoring), rendered as clean key/value lines; no hardcoded partner copy.
- **Jadwal Dispatch:** create/edit dialog has a **Catatan** input, auto **Zona rider** display, **multi-client dropdown-checklist**, **conflict guard**, **Edit (update-in-place)**, **Duplicate** (to another hub), delete-with-confirm, row → detail drawer, board **empty state**, and a **Riwayat perubahan (audit log)** in the detail (actor name + email + timestamp per create/edit/delete/toggle). Run history deep-links to Export Dispatch (no separate detailed run-export).
- **Export Dispatch:** grouped columns (Identitas / Client & alokasi / Waktu / Hasil) with required join keys locked on; period + status + hub filters; `Waybill / AWB` and `PO / Item` naming; "blank where N/A" note.
- **UX:** all modals dismiss via X / Batal / click-outside / Esc; create layers close via X / Batal / Esc; final-verification confirm lists every recipient; date picker blocks past dates; copy uses "contoh:" not "mis."; item counts are list-authoritative (no header/list mismatch).
- **Consistency pass (rev 4):** type UI identical across 4W & Hub Client (breadcrumb + Ganti); generic menu copy (Export-Import not "Exim", no Polda/Polres); field & summary label **Client** (not Partner/client); operational notes are compact config-driven key/values (no messy wrap, no hardcoded partner copy); **Panduan** button removed for parity; **confirm dialog lists every recipient (name + address) for final verification**; optional shipment-level **Catatan** at create → shown in detail; **Export dispatch grouped & reconciliation-first** (identity keys locked, client-dependent columns hinted); NCS/Hub Client dispatch rows seeded in the Dispatches board.
- **Dispatch:** Export dispatch (column picker); Jadwal Dispatch (submenu, board with **row → detail drawer** + **delete** + toggle, create rule).
- Sample data: client shown as **NCS** (sender = the originating Polda/Polres), varied Bali recipients across the 3 Hub Clients.

Not built (specified only): Master · Hub Client registration screen; Next Portal monitoring (Phase 3); self-service upload + API (Phase 4).

## Appendix E — Known gaps & edge cases (senior review)

Surfaced in the 14 Aug design review; each is a concern to design for before hardening.

1. **Resi-matching gap (highest).** Resi/AWB is generated NCS-side *after* Dash creates the shipment, so Dash's shipment ↔ NCS resi ↔ POD link is **manual via export** in Phase 0–3. Reconciliation and the 95% success metric depend on it. → Interim: a shared `batch_ref` + recipient key on export; permanent fix in **T4.2.1**.
2. **Address quality = the success-rate lever.** KTP addresses are free-text and incomplete addresses drive the sub-95% failures. → Pre-validation/geocoding-confidence flag at import (soft-warn, don't block); track flagged-vs-failed correlation.
3. **Multi-day SLA & re-dispatch.** SLA is ≤ 5 days, so an undelivered letter carries **day 1 → day 5** with re-attempts; a single-day dispatch model isn't enough. → Aging counter + re-dispatch of `RETURN_ORIGIN`/undelivered items into a later schedule run.
4. **Idempotent uploads.** Same sheet uploaded twice (H-1 re-send, correction) must **dedupe**, not double-create. → Key on (batch_ref, hub, date) + (nama, alamat).
5. **Cutoff / input window.** "How many hours does H-1→H0 allow?" is open; late uploads must roll to the next day deterministically. → **T4.1.2**; confirm the window with Ops (Appendix C open item).
6. **Timezone correctness.** Schedules fire in WIB while Bali runs WITA (+1). A 07:00 WIB rule = 08:00 WITA locally — mismatch risk in ops comms. → Show both, or store zone per hub; Phase-0 documents WIB-only.
7. **Rider capacity vs volume.** 1,300 letters ÷ (14+5 riders) ≈ ~70/rider/day — near capacity. → Over-allocation warning at create/dispatch when items/rider exceeds a threshold.
8. **Return-to-origin vs RT/RW.** Only return-to-origin is modeled; RT/RW hand-off is **unconfirmed with Polda** and changes what "success" means for fee. → Blocked pending Polda; don't build RT/RW as a success state until confirmed.
9. **PII handling.** Nama + alamat per KTP is personal data. → Access control on the recipient list/export, retention policy, and no PII in URLs (per privacy standard).
10. **Three-way count reconciliation.** Polda sheet count vs Dash created vs NCS delivered can diverge. → Export must expose all three keys so a daily reconciliation is one join.
