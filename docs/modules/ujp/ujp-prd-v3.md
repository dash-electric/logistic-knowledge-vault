---
title: UJP Native in react-logistic-web — Product Requirements
module: ujp
doctype: prd
version: 3.4
status: draft
supersedes: ./ujp-prd-v2.md
product_owner: muhamad.zulfikar@dashelectric.co
engineer: muhamad.zulfikar@dashelectric.co
created: 2026-09-11
updated: 2026-09-21
reviews:
  eng: 2026-09-10 (plan-eng-review, CLEAR, 17 decisions)
  design: 2026-09-11 (plan-design-review, 4/10 → 9/10, 14 decisions)
  cr1: 2026-09-15 (plan-eng-review on the stakeholder simulation review, 9 decisions)
  cr2: 2026-09-17 (plan-eng-review, Route Planner as a Routes-module extension, CLEAR, 19 decisions + outside voice)
  cr3: 2026-09-17 (requirement from stakeholder; decisions CR3-D1–D7 in assessment §17)
  cr4: 2026-09-18 (plan-eng-review, tariff master + margin, CLEAR, decisions CR4-D1–D10 + outside voice in assessment §18)
links:
  trd: ./ujp-trd-v3.md
  context: ./ujp-context-v1.md
  hld: ./ujp-hld-v1.html
  mockup: ./ujp-mockup-v1.html
  prototype: ./ujp-prototype-v3.html
  simulation: ./ujp-flow-simulation-v3.html
  presentation:
---

# UJP Native in react-logistic-web — PRD v3

> Port the **UJP** (*Usulan Jasa Pengangkutan*, the per-trip running-cost request that authorizes a driver's *uang jalan*) from the Supabase app `logisticdash` into the logistics console. **Approving a UJP creates the DIRECT_4W shipment in the same transaction.** v3 adds **CR-2**: route building leaves the UJP wizard and becomes a **Route Planner** master page owned by the Routes module, fed by the Addresses lane book and by server-measured distances. **CR-3** then lets the requester **change a request that has not been decided yet** — while it is *Menunggu persetujuan* or *Ditolak* — instead of cancelling it and raising a new number. **CR-4** adds the **revenue side**: a per-client **tariff master** (flat / fixed / per-ring, with insurance, dated) so approving a UJP snapshots its **revenue and margin**, shown to the approver alone. The technical design, architecture diagrams and API contract are in [ujp-trd-v3.md](./ujp-trd-v3.md) (mermaid, renders on GitHub) and [ujp-hld-v1.html](./ujp-hld-v1.html); background in [ujp-context-v1.md](./ujp-context-v1.md); the UI is demonstrated in [ujp-flow-simulation-v3.html](./ujp-flow-simulation-v3.html) and [ujp-prototype-v3.html](./ujp-prototype-v3.html).

---

## Problem

Ops creates UJPs in a separate Supabase app, then hand-carries the approved result into the console as a CSV import for the 4W shipment wizard. The round-trip is slow and lossy (client and coordinates are dropped, dates re-parsed), the money math and reference numbering run in the browser, the list silently caps at 1,000 rows, and approval forwards to a Google Sheet, Basecamp and the old two-wheel dispatch API. There is no single place to see a request's cost, approval trail and the shipment it became.

**CR-2 problem.** The route is the one part of a UJP that repeats trip after trip, yet CR-1 put its builder inside the wizard: the same chain of stops is retyped per request, its leg distances are measured in the browser with a second mapping provider, and the 4W shipment wizard — which needs the identical stops — shares none of it. Ops has no place to curate the routes it actually runs, and the Addresses lane book (which already stores those places, their coordinates and their measured distances) is not the source.

## Context

The console is the system of record for shipments, routes and dispatch. In this stack the shipment *is* the dispatch and the route *is* the schedule, so most of the old app's side-effect scaffolding has nothing left to do. The 4W creation path already exists, is transactional and idempotent, and already accepts an (unpersisted) "imported from UJP" flag and a "dari UJP" vehicle block.

For CR-2 three things already exist and are reused rather than rebuilt: the **Addresses** page holds lanes (origin + destination + measured distance, per client, DRAFT or CONFIRMED) — a route is a chain of lanes and a place is a distinct lane endpoint; the server already **measures road distance** and caches it per coordinate pair; and the **Routes module** already owns the executed route, of which a plan is simply the template. CR-2 is therefore mostly deletion: the in-wizard builder and the browser-side distance call go away.

## Users and jobs

| User | Job | Sees |
|---|---|---|
| Ops requester | Propose one trip and its cost; fix it while it waits or after a rejection; know when it is approved | Queue of their requests with age; a 5-step wizard with a live total; the panel with "Menunggu persetujuan finance"; **Ubah** / **Ubah & ajukan ulang** on their own undecided request (CR-3) |
| Ops route curator | Keep the routes a client actually runs, once, so every request and shipment starts from them | Route Planner page per client: list, drawer builder, stops picked from the lane book, per-leg km with its source, aktif/nonaktif |
| Finance approver (allowlisted) | Authorize the cash and, by the same click, the trip — and never authorize a version they did not read | Money first, then the shipment that approval will create, full bank details, Setujui & buat shipment / Tolak; "Diperbarui · lihat perubahan" when the requester edited it after submission (CR-3) |
| Other ops user | Look up a request | Same panel, account number masked, total hidden, no actions |
| Shipment creator (4W wizard) | Create a 4W shipment on a route that already exists | "Isi dari rute" on the stops step, prefilled per the client's pool rule |
| Driver (via driver app) | Run the route | The DIRECT_4W route created on approve; nothing UJP-specific |

## Scope

### In scope (Phase 1, one release train)
- **Create** a UJP: Info → Rute → Biaya → Driver → Review, with a server-computed live estimate.
- **Queue list** with status tabs and counts, age chips, URL-backed filters, server-side search and pagination.
- **Detail / approval panel** with approve, reject (reason code required), cancel (requester only), audit history, masking for non-parties.
- **Edit while undecided** (CR-3): the requester changes their own UJP while it is SUBMITTED, or fixes and resubmits it after a rejection — same reference, same row, every change audited, and the approver's decision is protected against deciding a version they did not see.
- **Approve creates the DIRECT_4W shipment** (shipment, route, stops, links) in the decision transaction, and links it back (`shipments.ujp_id`).
- **Route Planner** master page (CR-2): per-client route plans, created and edited in a drawer, stops picked from the Addresses lane book with a manual fallback, per-leg km measured by the server, deactivation that only hides.
- The **UJP wizard's Rute step** and the **4W shipment wizard's stops step** both consume route plans; neither builds a route of its own.
- **Masters reused, not rebuilt:** clients (core service), drivers (driver service), lanes from `addresses` (now read *and* DRAFT write-back from the planner only), reasons (`type = UJP_REJECTION`). New masters: `ujp_vehicles`, `ujp_energy_prices`, `ujp_subcon_vendors`, `ujp_client_configs` (all SQL-seeded or admin-edited).
- Deprecation banner on the existing CSV UJP import in the 4W wizard.

### Out of scope (with the reason)
- Google Sheet mirror: the native list/detail replaces it; revisit only if finance asks after a month.
- Basecamp / Spend-Control forward: separate integration with its own credentials.
- Schedule auto-create: the route created on approve is the schedule.
- Combine (second linked UJP): multi-drop stops cover the common case.
- Revert of a decision: a live shipment exists after approve; reversal is shipment cancellation with reason codes.
- ~~Edit after submit: cancel and "Buat ulang dari UJP ini" keep the audit trail honest.~~ **Superseded by CR-3** (requirements 43–49): editing while SUBMITTED or REJECTED is now in scope and the audit trail is kept by versioning the request and recording the change list, not by forcing a new number. What stays out:
  - **Edit after APPROVED (or CANCELLED)**: a live shipment and an authorized cash amount already exist; the correction path stays shipment cancellation with a reason code, not a silent rewrite of what finance approved.
  - **Approver edits**: an approver who disagrees rejects with a reason and the requester fixes it. Letting the person who authorizes the money also change it removes the second pair of eyes.
- ~~Ring / PER_RING tariff: billing-side; no tariff tables in this service.~~ **Superseded by CR-4** (requirements 50–55): a client-scoped tariff master (flat / fixed / per-ring + insurance, dated) now lives in this service so approving a UJP snapshots its revenue and margin. The accounting *detail* stays out — see the CR-4b list at the end of §CR-4.
- **Route-plan versioning and an approval workflow for plans**: plans are editable in place and the UJP keeps its snapshot; versioning waits until reviewers actually ask "what changed" (CR2-D17).
- **Blocking deactivation of a plan that a live UJP used**: the UJP reads its snapshot, so a 409 would buy nothing and would point the Routes module at UJP (CR2-D16).
- **Bulk confirmation of the DRAFT lanes the planner writes**: they appear on the Addresses page and are confirmed there (TODO-30).
- **Places for consumer-destination clients** whose lanes never reach `addresses`: those plans use manual stops only until a source exists (TODO-32).
- Per-lane cost presets: a follow-up once cost typos are observed (TODO-25 — the stop's `addressId` pointer is what makes it possible).
- Vehicle admin UI, JWT role for approvers and for planner edit rights, historical import from `logisticdash`, CSV-import removal, dark theme: recorded follow-ups.

## Requirements

### Create
1. A signed-in console user can submit a UJP; it persists as `SUBMITTED` with a history row and a **server-assigned** reference `UJP-YYYYMMDD-NNNN` (daily counter, gap-free, unique).
2. The wizard has five steps with **forward-only dependencies**: Info (client, tanggal kirim, layanan, tipe pengiriman, shift) → Rute (route plan → stops, km) → Biaya (payee, vehicle, e-money, cost lines) → Driver (rider, rekening — prefilled from the driver master, editable) → Review.
3. *(Superseded by CR-1 req 23 and then by CR-2 reqs 30–35 — kept for history.)* **Rute:** lanes are searched from `addresses` for the chosen client; multi-drop allows several lanes sharing one origin; selected lanes become one pickup and N drops with default workflows; `distance_km_calculated` = lane distance (single) or sum of lane distances labelled "estimasi" (multi); `km_yang_diajukan` is prefilled from it, editable, required. Manual stop edits show a banner and a "Reset dari lane" action. Empty search offers "Tambah di Alamat" and "Isi manual".
4. **Biaya:** picking a plate fills baseline and energy price from `ujp_vehicles`, locked until edited (then tagged "diubah manual"); "Override BBM" is a switch that reveals a fixed-BBM field. Money inputs use a `MoneyInput` (Rp adornment, id-ID separators, integer rupiah, empty → 0 on blur); km uses `KmInput` (1 decimal). Biaya lain-lain > 0 requires a justification.
5. **Subcon payee:** the vehicle-cost and cost-line block is disabled in place with the text "Tidak dipakai untuk subcon"; `nominal_transfer` becomes the single required money field; typed values are preserved when toggling back; plate and unit stay required.
6. **Live estimate** comes only from `POST /v1/ujp/estimate` (debounced 300 ms, previous request aborted, out-of-order responses discarded). While pending the amount dims; when inputs changed after the last answer it shows "Estimasi belum diperbarui"; on failure "Estimasi gagal" with "Coba lagi" and Lanjut/Ajukan disabled. The Review step re-checks once and gates Ajukan on a fresh answer.
7. **Driver:** rider search is limited to active DRIVER talent; a unique exact match auto-selects; bank fields prefill from the driver record (or are typed for subcon, titled "Rekening subcon").
8. **Review:** hairline sections with an "Ubah" link per step, exactly one Flazz/Transfer tile row, total at display size, a "Kelengkapan" text line.
9. Submit closes the modal, shows a toast with the reference and "Lihat", switches the queue to Menunggu and opens the panel on the new row. Double-submit is impossible (button disabled while pending).

### Queue
10. Tabs Menunggu · Disetujui · Ditolak · Dibatalkan · Semua with counts, default Menunggu; columns Ref (mono) · Client · Tgl kirim · Rute · Driver · Total (tabular) · Status · Umur; Umur chip amber > 2 days, red > 5. Filters (status, client, date range, search, page) round-trip through the URL.
11. Search covers reference, client, driver, plate, origin and destination, server-side.
12. Empty: "Belum ada pengajuan UJP" + Buat UJP; filtered-empty: "Tidak ada UJP untuk “{q}”" + Hapus filter; error: "Gagal memuat" + Coba lagi.

### Detail and decision
13. Panel order: header (mono reference + status badge; client · tanggal · diajukan oleh · umur) → Flazz/Transfer tiles + total → **"Dibuat saat disetujui"** one-line shipment preview (Direct 4W · n stops · origin → destination · Driver · plate) with "Belum dibuat", becoming a waybill link after approve → rincian biaya → rekening → stops → riwayat.
14. Footer: primary **"Setujui & buat shipment"** and outline-danger **"Tolak"** for an allowlisted approver who is not the requester; ghost **"Batalkan pengajuan"** for the requester while SUBMITTED; nothing for others.
15. **Reject** requires a reason from `GET /v1/reasons?type=UJP_REJECTION` (BIAYA_TIDAK_WAJAR, RUTE_TIDAK_SESUAI, DRIVER_TIDAK_SESUAI, DATA_TIDAK_LENGKAP, LAINNYA with mandatory note) plus an optional note; the primary is disabled until a reason is chosen.
16. **Approve** shows a loading state ("Menyetujui…", panel not closable), then a toast "UJP-… disetujui · Shipment {waybill} dibuat" with "Lihat shipment"; the panel re-fetches. A 409 (already decided) shows "Sudah diputuskan oleh {name}" and re-fetches.
17. A rejected request shows the reason and note prominently; ~~the requester gets **"Buat ulang dari UJP ini"** which opens the wizard prefilled (new reference on submit)~~ — *(the redo action is superseded by CR-3 req 43: the requester gets **"Ubah & ajukan ulang"**, which edits the same request under the same reference. The prominent rejection reason stays, and is now also shown inside the wizard's first step.)*
18. **Masking:** anyone who is neither an allowlisted approver nor the requester sees the account number as `•••• 1234` with a lock icon and tooltip, and the nominal as "Disembunyikan". Approver and requester see the full number with "Salin".

### Cross-cutting
19. Indonesian copy set is fixed in one constants file (see §UI contract).
20. Responsive: below `sm` the step indicator becomes "Langkah n/5 · {name}" with a progress rule, the footer stacks with the estimate strip full-width above the buttons (44 px targets), the Biaya grid is one column, the map is shorter, the panel is full-width with a sticky footer. The Route Planner list collapses to stacked cards and the drawer goes full-width.
21. Accessibility: DOM order equals visual order; Enter never advances or submits; first empty required field is focused on step entry; every input is labelled; the estimate total is an `aria-live="polite"` region; stale/error states carry text, not only color; panel has `aria-labelledby`; step indicator exposes `aria-current="step"`; axe assertions in tests. Route-plan leg source and drift are text badges, never colour alone.
22. Light theme only, house palette; Flazz rendered in the emerald data tone, Transfer in the accent tone.

## Change request CR-1 (2026-09-15)

From the stakeholder walkthrough of the flow simulation. Requirements added (all Phase 1):

23. *(Superseded by CR-2 reqs 30–35.)* **Saved routes.** In Rute, ops picks a saved route for the client or builds one manually (ordered stops with roles Pool/Pickup/Drop/Return, leg km prefilled from the map, editable) and may save it under a name for reuse. The Addresses lane picker is removed.
24. **Km margin** is 10% by default (`km × 1.10`), configurable, and shown in the breakdown as "KM + margin 10%". Each UJP keeps the margin it was computed with.
25. **E-money** offers Tidak ada / Flazz / QRIS / Flazz + QRIS. Fuel goes to QRIS when available, otherwise to Flazz, otherwise to Transfer; toll and tap-parking go to Flazz when available, otherwise Transfer; manual lines always Transfer. When QRIS is used a third tile "Uang jalan QRIS" appears.
26. **Fuel price** comes from a dated master per fuel type (Solar, Dexlite, Pertalite, EV kWh) valid on the delivery date; the vehicle master carries the fuel type; the wizard shows the price locked "dari master", editable.
27. **Subcon** approvals do not create a shipment; the panel shows "Tidak dibuat: subcon". The vendor is picked from a subcon vendor master that fills bank details; the driver step is optional for subcon.
28. **Client UJP config** page (`/ujp/config`, editable by approvers): per client, "Leg pool ditagih" (charged) and "Biaya reverse". When not charged, the first and last (pool) legs are excluded from km and fuel pricing and the shipment is created with the inner stops only; when charged, all legs count and all stops ship. The wizard shows the client's rule read-only in Rute.
29. **Reverse trip** switch on Info (pre-ticked when the route has a Return leg); when on, the client's reverse charge is added as a Transfer line "Biaya reverse (client)".

## Change request CR-2 (2026-09-17) — Route Planner

Route building becomes its own master, owned by the Routes module, fed by the Addresses lane book. **Supersedes requirement 23** (and, with it, what was left of requirement 3): there is no route builder inside the UJP wizard and no "simpan sebagai rute" on submit.

### Route Planner master
30. **Route Planner page** at `/route-planner` (Master nav group). It lists the route plans of the selected client — name, jumlah stop, KM semua leg, KM ditagih, status Aktif/Nonaktif, diperbarui oleh · kapan — with client filter, search and an active/inactive filter that all round-trip through the URL. **Buat rute** and the row's **Ubah** both open the same drawer. Empty: "Belum ada rute untuk client ini" + Buat rute; filtered-empty: "Tidak ada rute untuk “{q}”" + Hapus filter; error: "Gagal memuat" + Coba lagi.
31. **A plan is an ordered chain of stops.** Each stop has a role — Pool (positioning) · Pickup · Drop · Kembali ke pool — and a position in the chain; rows can be reordered, re-roled and removed, and the legs between them recompute on every change. A plan is only saveable with at least one Pickup and at least one Drop, and its name is unique per client (case-insensitive) — a clash shows an inline "Nama rute sudah dipakai".
32. **Stops are chosen from the Addresses lane book.** The stop picker lists *tempat* — the distinct endpoints of the client's lanes — showing the place name, its address, how many lanes use it and whether it is DRAFT or CONFIRMED. The same name at a different location stays a separate entry. "Semua client" widens the search when the place is shared. Picking a place fills the stop's name, address and coordinates and keeps a pointer to the lane endpoint it came from.
33. **Manual fallback writes DRAFT lanes back.** A place not in the book is typed with the address autocomplete ("Isi manual"). On save, every consecutive pair that involves a manual stop is written back to Addresses as a **DRAFT** lane with its measured distance, and the stop is linked to it — so the second plan that needs the same place finds it in the picker. An existing lane is never overwritten; the stop simply links to it.
34. **Lane write-back never blocks the save.** The plan is saved first. If some lanes could not be written, the plan is still created and the toast reads "Rute tersimpan · {n} alamat belum masuk Addresses" with **Coba lagi**; those stops stay unlinked until a retry succeeds. Ops sees which stops are affected in the drawer.
35. **Per-leg km comes from the server and shows its source.** Each leg displays a distance and a source badge — **Lane** (taken from the lane book), **Terukur** (measured on the road network) or **Estimasi** (straight-line fallback when measuring is unavailable). Every leg is editable; an edited leg is tagged "diubah manual" and keeps its original source for audit. Totals **KM semua leg** and **KM ditagih** are shown together with a read-only banner of the client's pool rule ("Leg pool ditagih" / "Leg pool tidak ditagih: leg pertama & terakhir tidak dihitung"). If the distance service fails the drawer shows "Estimasi tidak tersedia" and km is entered by hand — saving is still possible.
36. **A plan keeps a snapshot, not a live reference.** The stop's name, address and coordinates are stored on the plan. When the lane behind a stop later changes, the planner marks that row **"Alamat berubah"** with a one-click **Perbarui dari Addresses**; nothing changes until ops clicks it.
37. **Deactivation only hides.** A plan is never deleted. Setting it to Nonaktif removes it from both wizards' pickers and leaves every UJP, shipment and route that used it untouched; the list can filter to inactive plans and reactivate one.
38. **Any signed-in console user may create, edit, deactivate and reactivate a plan**; each write records the actor's email and the list shows "diperbarui oleh". A dedicated planner role is a follow-up (TODO-21).

### The two consumers
39. **UJP wizard step Rute is a picker.** Ops selects one of the client's active plans, or clicks **Buat rute baru** to open the Route Planner drawer in place — saving it selects the new plan without leaving the wizard. The stops, legs and totals come from the plan, and **KM diajukan** defaults to the plan's charged or all-leg total per the client's rule (req 28) and stays editable. The in-wizard manual builder and the "Simpan sebagai rute tersimpan" checkbox are gone.
40. **The UJP always keeps its own snapshot of the route it was submitted with.** Editing or deactivating the plan afterwards never changes a submitted, approved or rejected request.
41. **4W create-shipment wizard gains "Isi dari rute".** On the stops step, picking one of the client's active plans prefills the stops. The client's pool rule decides what is prefilled: when pool legs are charged, all stops are used; when they are not, the Pool and Kembali-ke-pool stops are dropped — and shown greyed with the reason, so the difference is visible rather than silent. Manual stop entry is unchanged and remains the default path.
42. **UJP detail flags plan changes.** The panel shows **"Rute nonaktif"** when the plan behind the request has since been deactivated, and **"Rute diperbarui setelah pengajuan"** when it was edited after submission. Both are informational: the request still displays its snapshot, approve still uses the snapshot, and ~~**"Buat ulang dari UJP ini"**~~ *(superseded by CR-3 req 43 — read as **"Ubah"** / **"Ubah & ajukan ulang"**)* works from an inactive plan (it reopens the wizard on the snapshot and asks ops to pick a current plan before saving).

Copy additions: Route Planner · Rute · Buat rute · Buat rute baru · Ubah rute · Nama rute · Nama rute sudah dipakai · Tempat · Cari tempat · Semua client · Isi manual · Tambah di Alamat · Urutkan · Hapus stop · Lane · Terukur · Estimasi · diubah manual · Alamat berubah · Perbarui dari Addresses · Estimasi tidak tersedia · Rute tersimpan · Rute tersimpan · {n} alamat belum masuk Addresses · Coba lagi · Aktif · Nonaktif · Nonaktifkan rute · Aktifkan kembali · Belum ada rute untuk client ini · Tidak ada rute untuk “{q}” · diperbarui oleh · Isi dari rute · Stop tidak dipakai: leg pool tidak ditagih · Rute nonaktif · Rute diperbarui setelah pengajuan.

## Change request CR-3 (2026-09-17) — Mengubah pengajuan

A request that nobody has decided yet is a draft in everything but name: today a typo in the km, a wrong plate or the fix for a rejection all cost a cancellation and a new number, which breaks the thread finance is following. CR-3 makes the request itself editable while it is undecided. **Supersedes the out-of-scope line "Edit after submit"** and the redo action in requirement 17 (and its echo in requirement 42). Decisions CR3-D1…D7 in `ASSESSMENT-UJP-PORT-4W.md` §17.

### Who edits, and when

43. **The requester edits their own request while it is Menunggu persetujuan or Ditolak.** The panel footer shows **Ubah** when the request is SUBMITTED and **Ubah & ajukan ulang** when it is REJECTED — both in place of "Buat ulang dari UJP ini", which is gone. Nobody else sees either button: an approver who disagrees rejects with a reason, and other ops users still get a read-only panel. An APPROVED or CANCELLED request is not editable and the attempt is refused with **"UJP sudah diputuskan"** — for those the correction path is shipment cancellation, as before.
44. **Edit opens the same wizard, prefilled, on the same request.** Five steps, same validation, same live server estimate, title **"Ubah UJP-{ref}"**; the primary button reads **"Simpan perubahan"** while SUBMITTED and **"Ajukan ulang"** while REJECTED. The **reference number never changes** — it is the same row, the same thread in the queue. When the request was rejected, the rejection reason and note stay visible on step 1 of the wizard, so the fix is guided by what was wrong rather than remembered. The requester may change any group: header, route, biaya, driver/payee, cargo.

### What an edit means

45. **Saving while Menunggu keeps it Menunggu; saving a rejected one puts it back in the queue.** A rejected request that is resubmitted returns to **Menunggu persetujuan** and **the rejection is cleared from the panel** — reason, note and who decided it stop being the request's current state and become history. It reappears in the Menunggu tab and its counts, and its age chip continues from the original submission (the request is not new; only its content is).
46. **The route plan may be switched or rebuilt during an edit.** The Rute step is the same picker as requirement 39, including **Buat rute baru**; the request's snapshot is replaced by the plan chosen at save time, and the "Rute diperbarui setelah pengajuan" flag (requirement 42) is measured against the moment of the last edit, not the original submission — otherwise every edited request would show it forever.
47. **Money is never carried over from the browser.** An edit recomputes the total server-side from the submitted inputs exactly as a new request does, so an edited request can never show a total that its inputs do not produce.

### What the approver and the audit see

48. **The approver can tell that it changed, and decides only on what they read.** A request edited after submission shows **"Diperbarui · lihat perubahan"** in the panel, which opens the change list in the history. If the requester edits while the approver has the panel open, the decision is refused with **"UJP diperbarui oleh requester, muat ulang"**, the panel refetches and shows the newer version with its changes — no approval or rejection ever lands on a version the approver did not see. Nothing is lost: the approver re-reads and decides again.
49. **Every edit is in the audit trail, field by field.** Each save writes a history row — *Diubah* while SUBMITTED, *Diajukan ulang* for a resubmit — with who, when, and the list of what changed as **dari → ke** per field across header, payee, vehicle, biaya, rute and driver. The original rejection row stays exactly where it was. **Money values inside the change list are masked for non-parties** on the same rule as requirement 18: someone who is neither the requester nor an allowlisted approver sees that a cost field changed, not the amounts it moved between.

Copy additions: Ubah · Ubah & ajukan ulang · Ubah UJP-{ref} · Simpan perubahan · Ajukan ulang · Perubahan disimpan · UJP-{ref} diajukan ulang · Diperbarui · lihat perubahan · Perubahan · dari → ke · Diubah · Diajukan ulang · UJP sudah diputuskan · UJP diperbarui oleh requester, muat ulang · Alasan penolakan sebelumnya. Removed with CR-3: Buat ulang dari UJP ini.

## Change request CR-4 (2026-09-18) — Tarif & margin

Stakeholder question: *does the UJP compute a fixed price / per-ring tiering?* Today it does not — the UJP is **cost-only** (the *uang jalan* a driver is authorized), and price lives in a separate billing table that our port never brought over, so finance cannot see a trip's margin. CR-4 adds the **revenue side**: a per-client **tariff master** and, at approve, a snapshotted **revenue** and **margin = revenue − cost**. This is the revenue counterpart to CR-1's cost-side `ujp_client_configs` — two client-scoped configs, different concerns, no merge. **Supersedes the out-of-scope line "Ring / PER_RING tariff".** Decisions CR4-D1…D10 in `ASSESSMENT-UJP-PORT-4W.md` §18; the accounting *detail* is deferred (CR-4b, listed at the end of this section).

### Tariff master
50. **A client has a dated tariff config that an approver sets on a Tariff config page** (`/ujp/tariffs`). Each config has a **tipe** — **Flat per trip** (`rate_flat`, plus a multi-drop `rate_flat_multi`), **Fixed** (`rate_fixed`), or **Per ring** — an **insurance** amount (`asuransi`, added to every resolved revenue), and an effective window (`berlaku_mulai` / `berlaku_sampai`). A **Per ring** config also carries a **ring master**: named rings, each with a per-trip rate and a multi-drop rate. Resolution picks the config **effective on the delivery date**. The page is approver-gated; the tariff is the revenue counterpart to the cost-side client config (requirement 28) and is never merged with it.

### Tagging and the revenue snapshot
51. **The UJP tags its tariff and ring at create; approve snapshots revenue and margin.** The wizard stores `tariffConfigId` (and, for Per-ring clients, `ringId`) when the request is created or edited. **Approve** resolves the tariff effective on the delivery date, picks the rate (multi-drop when the route has more than one Drop, else single), adds `asuransi`, and computes **`revenue`** and **`margin = revenue − cost`** from one approve-time basis — the same cost the margin is measured against, never a create-time versus approve-time mix. `revenue`, `margin`, the `revenueStatus` and the tariff snapshot are stored on the UJP. `/estimate` stays **cost-only** — the live wizard total never shows a price. On the approver's panel the revenue and margin appear as a **preview** (resolved live on the current tariff) while the request is *Menunggu*, and as the **snapshot** once it is approved.

### Who sees the price
52. **Revenue, margin and the tariff are for the approver alone (field-tier masking).** The old single "party" mask (requirement 18) splits into field tiers: the **cost tier** (rincian biaya, rekening) stays visible to the requester *and* the approver as before; the new **price tier** (revenue, margin, tariff) is visible to an **allowlisted approver only** — not even the requester. A requester or other user sees the cost with the price fields locked ("Harga & margin hanya untuk approver"). The Tariff config page is approver-gated for the same reason.

### Choosing the ring
53. **For Per-ring clients the wizard suggests a ring, editable and approver-confirmed.** On the Rute step of a Per-ring client, a **ring picker** appears with a best-effort **auto-suggested** ring (matched from the destination stop; the ring order breaks ties) already selected and badged *disarankan*. The picker is editable, a route plan's **default ring** pre-fills it when a plan is chosen, and the ring is only ever human-confirmed — the suggestion is low-confidence on lane-based destinations. The queue **flags a Per-ring UJP that has no ring** with a badge, so it is not approved blind.

### Margin that is negative, or not yet knowable
54. **A negative margin is a warning the approver must confirm, not a block.** When approve resolves a **known** revenue and the margin is below zero, the approver sees a **"Margin negatif"** confirmation and must explicitly accept it before the UJP is approved; the sign is stored. The confirm fires **only** when the revenue is actually known (requirement 55) — a low or negative margin computed on an unreliable revenue is never presented as a decision.

55. **Revenue is never fabricated.** Every resolution carries a **`revenueStatus`**: `OK`, `MISSING_TARIFF` (the client has no active tariff → "Tarif belum diatur"), `UNSUPPORTED_MODE` (the tariff needs a mode we deferred, e.g. per-body/tier → "Revenue belum bisa dihitung"), or `MISSING_RING` (a Per-ring trip with no ring → a ring prompt). Only `OK` yields a revenue and a margin and can trigger the requirement-54 confirm; in every other state `revenue` and `margin` are **null**, the margin is hidden, and **approval is still allowed**. When a multi-drop trip falls back to the single rate because the multi rate is unset, the panel shows a **`MULTI_RATE_FALLBACK`** note — the fallback is surfaced, never silent.

Copy additions: Tarif · Tarif client · Konfigurasi tarif · Tipe tarif · Flat per trip · Fixed · Per ring · Ring · Ring tarif · Asuransi · Berlaku mulai · Berlaku sampai · Rate per trip · Rate multi-drop · Tambah ring · Ring disarankan · Ring belum dipilih · Pendapatan · Margin · Margin negatif · Pendapatan & margin · Harga & margin hanya untuk approver · Revenue belum bisa dihitung · Tarif belum diatur · Tarif butuh mode yang belum didukung · Rate multi belum diatur — pakai rate single.

**Not in scope (CR-4b, deferred with a reason):** per-body-type rates, `distance_tiers`, driver/helper cost shares, multidrop free-points/extra-rate, a standalone **Laporan Margin** dashboard, and `harga_reverse` on the revenue side. Each surfaces as `UNSUPPORTED_MODE` (a tariff needing a deferred mode) rather than a fabricated number, and is picked up when a real client's tariff needs body/tier pricing or finance needs a cross-UJP margin report.

## Edge cases and failure states

| Case | Behaviour |
|---|---|
| Two approvers click within a second | Row lock; second gets 409 "sudah diputuskan", panel re-fetches |
| Approver double-clicks | Idempotent: APPROVED with `shipment_id` returns the same result |
| Client deactivated or rider gone between submit and approve | Pre-transaction re-fetch fails → 400 with an Indonesian message; UJP stays SUBMITTED |
| Shipment write fails inside the transaction | Full rollback; UJP stays SUBMITTED; toast with message; retry works |
| Shipment with the same booking id already exists | Linked (EXISTS), never duplicated |
| Approver not allowlisted, or is the requester, or token lacks email | 403; buttons hidden client-side as a courtesy only |
| Approver allowlist empty | Fail closed: nobody can approve; startup warning |
| Delivery date before today (WIB) | Blocked at create; at approve only a warning |
| Estimate responses arrive out of order | Sequence check; an older total never overwrites a newer one |
| Estimate API down | Last good total with a stale marker; Ajukan blocked at the Review re-check |
| Reference counter at 23:59 WIB | Day computed inside the transaction on the server |
| Client-sent totals in the payload | Ignored; server recomputes |
| **No route plan for the client** | Rute step shows "Belum ada rute untuk client ini" + **Buat rute baru** (drawer); the wizard cannot proceed without a plan |
| **No place matches in the lane book** | Picker offers "Isi manual" and "Tambah di Alamat"; the manual stop writes a DRAFT lane on save (req 33) |
| **Distance service unavailable while building** | Legs fall back to a flagged straight-line estimate, badge "Estimasi"; km editable; saving allowed |
| **Lane distance stored as zero** | Treated as no lane; the leg is measured instead |
| **Lane write-back partially fails** | Plan still saved; warning toast + **Coba lagi**; affected stops stay unlinked |
| **Duplicate plan name for the client** | Inline "Nama rute sudah dipakai"; save blocked until renamed (case-insensitive) |
| **Plan deactivated while a UJP is SUBMITTED** | Nothing blocks; the panel shows "Rute nonaktif" and approve uses the snapshot |
| **Plan edited after a UJP used it** | Panel shows "Rute diperbarui setelah pengajuan"; the snapshot is authoritative |
| **Lane behind a stop edited in Addresses** | Plan row badges "Alamat berubah" with **Perbarui dari Addresses**; no silent change |
| **Client has no UJP config row** | Pool legs treated as not charged (the conservative default); the 4W prefill greys the pool stops |
| **4W prefill from a plan, then manual edits** | Manual editing stays available on every prefilled stop; the manual path is unchanged |
| **Requester edits while the approver is deciding** | The decision is refused with "UJP diperbarui oleh requester, muat ulang"; the panel refetches, shows "Diperbarui · lihat perubahan" and the approver decides again |
| **Approver decides while the requester is saving an edit** | The edit is refused with "UJP sudah diputuskan"; the wizard closes and the panel refetches on the decided request — nothing half-saved |
| **Someone who is not the requester opens an editable request** | No Ubah button; a direct attempt is refused (403). Approvers reject with a reason instead |
| **Edit attempted on an APPROVED or CANCELLED request** | Refused with "UJP sudah diputuskan"; the panel refetches |
| **Rejected request resubmitted** | Back to Menunggu, rejection cleared from the panel and kept in history; same reference, same age baseline |
| **Edit changes nothing** | Saving is still allowed; the history row records the edit with an empty change list rather than pretending it did not happen |
| **Non-party opens the change list** | Field names are visible, money values are masked exactly as the totals are (req 18) |
| **Route plan deactivated between submit and edit** | The wizard opens on the snapshot with "Rute nonaktif" and asks for a current plan before saving |
| **Client has no active tariff** (CR-4) | `revenueStatus = MISSING_TARIFF`; revenue and margin null; panel shows "Tarif belum diatur"; approval still allowed |
| **Tariff needs a deferred mode** (per-body / tier) | `revenueStatus = UNSUPPORTED_MODE`; revenue null; panel shows "Revenue belum bisa dihitung"; approval still allowed |
| **Per-ring UJP with no ring** | `revenueStatus = MISSING_RING`; revenue null; queue badge + a ring prompt; the wizard suggests one, the approver confirms |
| **Multi-drop trip but only a single rate is set** | Falls back to the single rate and shows a `MULTI_RATE_FALLBACK` note; the number is never invented |
| **Margin below zero on a known revenue** | "Margin negatif" confirm required before approve; the sign is stored; not a hard block |
| **Requester or other opens an approved UJP** (CR-4) | Cost visible (requester) or masked (other) as before; revenue, margin and tariff hidden with a lock for both — price is approver-only |
| **Delivery date on a tariff's effective boundary** | The config whose `berlaku_mulai ≤ date ≤ berlaku_sampai` is used — the boundary day resolves to the right rate |
| **Non-approver opens the Tariff config page** | Approver-gated: rates hidden, no edit; a "hanya approver" notice |

## Success criteria

- Ops creates UJPs in the console with **zero CSV round-trips** for onboarded 4W clients.
- A fixture of 30 real UJPs reconciles **to the rupiah** with the old app's totals.
- Approve → shipment visible in the shipments list and the driver app, end to end, for one live client without manual database edits.
- Finance's default view (all statuses, by date, searched by driver) answers in < 500 ms at 10k rows.
- **A client's repeat routes are built once**: after the first week of use, the majority of that client's UJPs select an existing plan rather than creating one, and no UJP is submitted with a hand-typed chain of stops.
- **Route km stops being retyped**: the share of legs left at their server value (source Lane or Terukur, not "diubah manual") is visible in the planner and is the baseline for trusting the estimate.
- **The lane book grows instead of drifting**: every manual stop a planner enters ends up as a DRAFT lane in Addresses, so the second plan through the same place picks it rather than retyping it.
- **The 4W wizard and UJP agree**: for the same plan and the same client config, the stops the 4W wizard prefills are exactly the stops approve would create.
- **A correction keeps its number**: after CR-3, a rejected request that gets fixed is resubmitted under the same reference — the count of cancelled-then-recreated requests goes to zero, and finance follows one thread per trip instead of two.
- **No decision lands on an unread version**: every approval and rejection is recorded against the version the approver had on screen; a stale attempt is refused rather than silently applied.
- **An edited request is readable at a glance**: for any edited request, the approver can see what changed without comparing two screens — the change list answers it in the panel.
- **Finance sees margin without a second app** (CR-4): once a client's tariff is set, the approver reads revenue and margin on the same panel where they authorize the cash — the round-trip to a separate billing sheet goes to zero for priced clients.
- **A margin figure always reconciles to a rate** (CR-4): every non-null revenue traces to one tariff config effective on the delivery date and one rate (with the ring named for Per-ring clients); a fixture of priced UJPs reconciles to the rupiah, and no margin is ever shown without a `revenueStatus = OK`.
- **The price never leaks** (CR-4): revenue, margin and tariff are absent from every requester and non-party response and from the change list — a non-approver cannot recover a price from any surface.

## UI contract

- **Anchor:** a persistent estimate strip in the wizard footer (eyebrow "Estimasi total", mono amount, Flazz/Transfer chips, stale chip), shown from Rute onward and hidden on Biaya and Review where the breakdown/tiles carry the total. In the Route Planner drawer the equivalent anchor is the totals strip (KM semua leg · KM ditagih · client rule).
- **Components:** `FormModal size="2xl"` + `StepIndicator` (+ compact prop) · `SegmentedControl` · `SearchSelect` · `Tag` · `Switch` · `DatePicker` · `MoneyInput` / `KmInput` (new, co-located) · shared `Direct4WStopsStep` / `Direct4WRiderStep` · `RouteStopsMap` · `Hint` · `InformationBanner` · `Badge` · `Button` (primary / outline-danger / ghost / white, loading) · `SideBarModal position="right" width="md"` (panel) and `width="lg"` (route-plan drawer) · `Modal width="sm" iconTone="danger"` (deactivate confirm) · `TableData` + `Paginator` + hairline tabs · `EmptyState` · `Skeleton` · sonner toaster · eyebrow labels · `font-mono tabular-nums` for ids, km and rupiah · `AddressEndpointFields` + `AddressAutocomplete` reused for the manual stop.
- **Copy set (constants file):** Buat Pengajuan UJP · Uang jalan 4W: info, rute, biaya, driver, lalu review. · Info · Rute · Biaya · Driver · Review · Kembali · Batal · Lanjut · Ajukan UJP · Estimasi total · Flazz · Transfer · Estimasi belum diperbarui · Estimasi gagal · Coba lagi · Dihitung server · Payee & kendaraan · Biaya operasional (uang jalan) · Rincian estimasi · Tidak dipakai untuk subcon · Override BBM · dari kendaraan · diubah manual · KM diajukan · Logistic · UJP · Pengajuan UJP · Buat UJP · Menunggu · Disetujui · Ditolak · Dibatalkan · Semua · Belum ada pengajuan UJP · Tidak ada UJP untuk “{q}” · Hapus filter · Gagal memuat · Menunggu persetujuan · Menunggu persetujuan finance · Dibuat saat disetujui · Belum dibuat · Lihat shipment {waybill} · Rincian biaya · Rekening driver · Rekening subcon · Salin · Disembunyikan · Hanya requester & approver dapat melihat · Stops · Riwayat · Setujui & buat shipment · Tolak · Tolak UJP · Batalkan pengajuan · Buat ulang dari UJP ini · Ubah · UJP-{ref} diajukan · UJP-{ref} disetujui · Shipment {waybill} dibuat · UJP-{ref} ditolak · Pengajuan dibatalkan · Nomor rekening disalin · Sudah diputuskan oleh {name} · UJP tidak ditemukan · Alasan belum dikonfigurasi.
- **CR-1 additions:** Pool / Pickup / Drop / Kembali ke pool · Leg pool ditagih · Leg pool tidak ditagih: leg pertama & terakhir tidak dihitung · KM semua leg · KM ditagih · Uang jalan QRIS · Perjalanan reverse · Biaya reverse (client) · Konfigurasi UJP client · Vendor subcon · Tidak dibuat: subcon.
- **CR-3 additions:** the edit copy listed under §CR-3 (Ubah · Ubah & ajukan ulang · Ubah UJP-{ref} · Simpan perubahan · Ajukan ulang · Perubahan disimpan · UJP-{ref} diajukan ulang · Diperbarui · lihat perubahan · Perubahan · Diubah · Diajukan ulang · UJP sudah diputuskan · UJP diperbarui oleh requester, muat ulang · Alasan penolakan sebelumnya). Components: the existing `FormModal` wizard in edit mode (no new shell), `InformationBanner` for the rejection reason on step 1 and for the stale-decision refusal, `Badge` for "Diperbarui", and the history list rendering the per-field change rows in `font-mono tabular-nums` for money and km. Removed with CR-3: Buat ulang dari UJP ini.
- **CR-2 additions:** the Route Planner copy listed under §CR-2. Removed with CR-2: Rute tersimpan (as a wizard label) · Buat rute manual · Simpan sebagai rute tersimpan · Jarak lane (estimasi) · Jumlah jarak lane, bukan rute berantai · Stops diubah manual; lane tidak lagi mengisi otomatis · Reset dari lane · Lane harus dari origin yang sama · Lane tidak ditemukan untuk {client}.
- **CR-4 additions:** the tariff / margin copy listed under §CR-4. New page **Tarif client** (`/ujp/tariffs`, approver-gated) built from the existing `TableData` + a `SideBarModal` drawer for the tariff editor (tipe `SegmentedControl`, `MoneyInput` for rates + `asuransi`, `DatePicker` for the effective window, a repeatable ring editor). In the wizard the Rute step gains a **ring `SearchSelect`** for Per-ring clients (auto-suggested option badged with a `Tag`). The approver panel gains a **"Pendapatan & margin"** section rendered only for approvers, with `revenueStatus` shown as an `InformationBanner` (belum bisa dihitung / MULTI_RATE_FALLBACK) and a **"Margin negatif"** `Modal width="sm" iconTone="danger"` confirm on approve; the queue gains a "Ring belum dipilih" `Badge`. Price fields use `font-mono tabular-nums`; margin negatif rendered in the error data tone, positive margin in the emerald data tone. The field-tier mask replaces the single "party" boolean: cost tier (requester + approver) and price tier (approver only).

## Changelog

- 2026-09-21 — v3.6: **CR-8 — leg pool: ditagih atau tidak diputuskan per stop, dan stop pool selalu ikut ke shipment.** The pool is simply the first and the last stop of a route. On those two stops the planner shows one toggle, "Ditagih ke client", already set to the client's rule; ops flips it for a one-off trip (either way) and the approver sees a "Beda dari aturan client" badge. Middle stops are always billed and carry no switch; the separate "Leg pool" switch is gone (CR-8b). Billing and the route are now separate questions: the driver always gets the pool stops (so the time to and at the pool is recorded), only the km may be excluded from the bill. Decisions CR8-D1…D6 in `ASSESSMENT-UJP-PORT-4W.md` §24.
- 2026-09-21 — v3.5: **CR-7 — biaya tambahan di tengah jalan.** A trip that has started can incur costs nobody planned (tilang, sparepart, tol tak terduga). Ops raises a **Biaya tambahan** on the approved UJP — any ops, not only the requester — with a nominal and a justification; finance approves or rejects it like a UJP, and the panel shows the running "Total setelah biaya tambahan". The approved UJP itself is never edited: what was paid first stays visible, each extra is its own line with its own decision. Allowed only while the shipment is not completed, one pending at a time, no driver notification for now. Decisions CR7-D1…D5 in `ASSESSMENT-UJP-PORT-4W.md` §23.
- 2026-09-21 — v3.4.1: **dead inputs removed, rekening prefilled.** The Driver step's "Detail pengiriman (opsional)" block (pengirim, penerima, barang, bobot) is gone: nothing read it — the shipment takes sender/receiver from the stops, and it was never shown on the detail panel. Picking a driver now **prefills the rekening from the driver master** (the mitra's registered `driver_bank`; hint "Diisi dari data driver, bisa diubah"); an already-filled block is never overwritten, and a driver without a registered rekening gets "isi manual". **"Tim ops" and "Jam mulai / Jam selesai" removed from the Info step.** The time window was a schedule field in logisticdash and nothing here read it (shift stays, it drives the tariff window). The ops team goes because the request already records who raised it from the signed-in account (`requester_email`), and a per-location breakdown belongs to the route's pool, not a hand-picked label. No master, no filter. Wizard, API body and detail header drop the field.
- 2026-09-21 — v3.4: **CR-6 — one stop vocabulary.** The planner's four roles (Pool / Pickup / Drop / Kembali ke pool) give way to the workflow vocabulary: every stop is a **Pickup or Drop off**, a drop carries an **intent** (Umum · Bongkar · Retur kontainer), and "leg pool" is a switch — the empty positioning/return leg the client is not charged for unless its config says so. A return to the pool is a plain drop (Umum); a container return is chosen explicitly. The old role stays on stored routes as a derived field, so nothing already saved changes meaning, except that a pool drop no longer implies a container return. Staging: the UJP approver allowlist and km margin are now supplied from the `staging` environment (approver = muhamad.zulfikar@dashelectric.co). Decisions CR6-D1…D6 in `ASSESSMENT-UJP-PORT-4W.md` §22.
- 2026-09-20 — v3.3: **CR-5 built** (route plan carries a per-stop workflow; the 4W wizard's "Isi dari rute" brings it along; a stale pin falls back to the client default with a visible "workflow diganti ke default" instead of blocking the approval; manual picks keep the hard stop). **CR-5b**: the planner shows a drift badge when a pinned workflow was renamed, retired or deleted (per-exim pins stay deferred). **Tariff gaps closed**: two active tariffs may not overlap in date + day + shift (409 with a clear message), a per-ring client with a single active ring prices without a ring pick (noted), rings can be deactivated. **Masters admin** (TODO-22): approvers manage trucks, dated fuel/energy prices and subcon vendors from `/ujp/masters`; a master edit never rewrites a submitted UJP. Decisions/notes in `ASSESSMENT-UJP-PORT-4W.md` §21.
- 2026-09-20 — v3.2: change request CR-4b — **full tariff parity** with logisticdash's price model. The tariff master gains the **Tier jarak (KM)** tipe (`DISTANCE_TIER`: a ladder of `maxKm → rate` priced on the UJP's KM diajukan), **rate khusus per tipe unit** (per-body overrides on flat and ring, single and multi), **porsi driver/helper** (komisi — a cost in the margin, applied for a driver payee only; helper share recorded), a **surcharge multidrop** (drops above the free points × extra rate), a **revenue-side harga reverse**, **hari/shift operasi** windows (the tariff only applies on those days/shifts) and `tagih per rit` + `catatan` (stored, shown; the daily cap belongs to the report). `margin = revenue − cost − komisi`; the approver sees the breakdown (rate applied + its source, tier, asuransi, surcharge, reverse, komisi) and several advisory notes at once (`MULTI_RATE_FALLBACK`, `BODY_RATE_DEFAULT`, `TIER_ABOVE_MAX`); `revenueStatus` gains `MISSING_TIER`. The ring auto-suggest becomes the source's **city-keyword matcher** (ambiguous → empty, never a guess). Still deferred to CR-4c: monthly FIXED prorate, additional revenue, the Laporan Margin dashboard, daily cap. Decisions CR4b-D1…D13 in `ASSESSMENT-UJP-PORT-4W.md` §20. ERD updated in the same change.
- 2026-09-18 — v3.1: change request CR-4 — the revenue side (requirements 50–55). A per-client, dated **tariff master** (tipe Flat per trip / Fixed / Per ring + `asuransi`) with a config-scoped **ring master**, set by approvers on a new `/ujp/tariffs` page. The UJP **tags** its tariff and ring at create and **snapshots revenue + margin** (`margin = revenue − cost`, one approve-time basis) at approve; `/estimate` stays cost-only. Revenue, margin and the tariff are **approver-only** — the single "party" mask splits into a cost tier (requester + approver) and a price tier (approver only). Per-ring clients get a wizard **ring auto-suggest** (editable, plan-default-prefilled, approver-confirmed) and a queue badge for a missing ring. A **negative margin** is a confirm, not a block, and fires only on a known revenue. Revenue is **never fabricated**: `revenueStatus` ∈ OK / MISSING_TARIFF / UNSUPPORTED_MODE / MISSING_RING, with a MULTI_RATE_FALLBACK note surfaced. Supersedes the out-of-scope line "Ring / PER_RING tariff"; the accounting detail is deferred (CR-4b). Decisions CR4-D1…D10 in `ASSESSMENT-UJP-PORT-4W.md` §18. ERD updated in the same change; UI in [ujp-prototype-v3.html](./ujp-prototype-v3.html) / [ujp-flow-simulation-v3.html](./ujp-flow-simulation-v3.html).
- 2026-09-17 — v3.0.1: change request CR-3 — the requester may change a UJP while it is Menunggu persetujuan or Ditolak (requirements 43–49). Supersedes the out-of-scope line "Edit after submit", the redo action in requirement 17 and its echo in requirement 42: **"Buat ulang dari UJP ini" is replaced by "Ubah" / "Ubah & ajukan ulang"** on the same reference. Resubmitting a rejected request clears the rejection from the panel and keeps it in history; every edit is audited as a per-field change list with money masked for non-parties; the approver sees "Diperbarui · lihat perubahan" and cannot decide a version they did not read. Editing after APPROVED, and approver-side edits, stay out of scope. Decisions CR3-D1…D7 in `ASSESSMENT-UJP-PORT-4W.md` §17.
- 2026-09-17 — v3.0: change request CR-2 — Route Planner as a Routes-module extension (requirements 30–42). Supersedes requirement 23 (in-wizard builder, "simpan sebagai rute") and what remained of requirement 3 (lane picker in the wizard). Stops now come from the Addresses lane book with a DRAFT write-back fallback, leg km is server-measured with a visible source, and the 4W shipment wizard consumes the same plans. Supersedes [PRD v2](./ujp-prd-v2.md).
- 2026-09-15 — v2.1: change request CR-1 added (requirements 23–29).
- 2026-09-12 — split into PRD (this file) and [TRD v2](./ujp-trd-v2.md); content unchanged.
- 2026-09-11 — v2 after engineering review (2026-09-10) and design review (2026-09-11). Changes from v1: scope narrowed to a vertical slice (D1); shipment link moved from Phase 3 into Phase 1 and made transactional on approve (D2/D3); formula ownership moved server-only, `/estimate` mandatory (D5, reverses v1 D1); `ujp_*` master replication replaced by existing masters plus one vehicle table (D7, D16); daily-counter numbering (D4); allowlist gate and masking (D6, D15); full UI contract added (DD1–DD14).
- 2026-09-01 — v1 created (superseded).
