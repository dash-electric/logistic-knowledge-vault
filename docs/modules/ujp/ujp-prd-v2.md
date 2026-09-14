---
title: UJP Native in react-logistic-web — Product Requirements
module: ujp
doctype: prd
version: 2.1
status: reviewed
supersedes: ./ujp-prd-trd-v1.md
product_owner: muhamad.zulfikar@dashelectric.co
engineer: yogi.ermanto@dashelectric.co
created: 2026-09-11
updated: 2026-09-12
reviews:
  eng: 2026-09-10 (plan-eng-review, CLEAR, 17 decisions)
  design: 2026-09-11 (plan-design-review, 4/10 → 9/10, 14 decisions)
links:
  trd: ./ujp-trd-v2.md
  context: ./ujp-context-v1.md
  hld: ./ujp-hld-v1.html
  mockup: ./ujp-mockup-v1.html
  prototype: ./ujp-prototype-v1.html
  simulation: ./ujp-flow-simulation-v1.html
  presentation:
---

# UJP Native in react-logistic-web — PRD v2

> Port the **UJP** (*Usulan Jasa Pengangkutan*, the per-trip running-cost request that authorizes a driver's *uang jalan*) from the Supabase app `logisticdash` into the logistics console. **Approving a UJP creates the DIRECT_4W shipment in the same transaction.** This version replaces v1 after the engineering and design reviews. The technical design, architecture diagrams and API contract are in [ujp-trd-v2.md](./ujp-trd-v2.md) (mermaid, renders on GitHub) and [ujp-hld-v1.html](./ujp-hld-v1.html); background in [ujp-context-v1.md](./ujp-context-v1.md); the UI is demonstrated in [ujp-flow-simulation-v1.html](./ujp-flow-simulation-v1.html) and [ujp-prototype-v1.html](./ujp-prototype-v1.html).

---

## Problem

Ops creates UJPs in a separate Supabase app, then hand-carries the approved result into the console as a CSV import for the 4W shipment wizard. The round-trip is slow and lossy (client and coordinates are dropped, dates re-parsed), the money math and reference numbering run in the browser, the list silently caps at 1,000 rows, and approval forwards to a Google Sheet, Basecamp and the old two-wheel dispatch API. There is no single place to see a request's cost, approval trail and the shipment it became.

## Context

The console is the system of record for shipments, routes and dispatch. In this stack the shipment *is* the dispatch and the route *is* the schedule, so most of the old app's side-effect scaffolding has nothing left to do. The 4W creation path already exists, is transactional and idempotent, and already accepts an (unpersisted) "imported from UJP" flag and a "dari UJP" vehicle block.

## Users and jobs

| User | Job | Sees |
|---|---|---|
| Ops requester | Propose one trip and its cost; know when it is approved | Queue of their requests with age; a 5-step wizard with a live total; the panel with "Menunggu persetujuan finance" |
| Finance approver (allowlisted) | Authorize the cash and, by the same click, the trip | Money first, then the shipment that approval will create, full bank details, Setujui & buat shipment / Tolak |
| Other ops user | Look up a request | Same panel, account number masked, total hidden, no actions |
| Driver (via driver app) | Run the route | The DIRECT_4W route created on approve; nothing UJP-specific |

## Scope

### In scope (Phase 1, one release train)
- **Create** a UJP: Info → Rute → Biaya → Driver → Review, with a server-computed live estimate.
- **Queue list** with status tabs and counts, age chips, URL-backed filters, server-side search and pagination.
- **Detail / approval panel** with approve, reject (reason code required), cancel (requester only), audit history, masking for non-parties.
- **Approve creates the DIRECT_4W shipment** (shipment, route, stops, links) in the decision transaction, and links it back (`shipments.ujp_id`).
- **Masters reused, not rebuilt:** clients (core service), drivers (driver service), lanes read-only from `addresses`, reasons (`type = UJP_REJECTION`). One new master: `ujp_vehicles` (SQL-seeded).
- Deprecation banner on the existing CSV UJP import in the 4W wizard.

### Out of scope (with the reason)
- Google Sheet mirror: the native list/detail replaces it; revisit only if finance asks after a month.
- Basecamp / Spend-Control forward: separate integration with its own credentials.
- Schedule auto-create: the route created on approve is the schedule.
- Combine (second linked UJP): multi-drop stops cover the common case.
- Revert of a decision: a live shipment exists after approve; reversal is shipment cancellation with reason codes.
- Edit after submit: cancel and "Buat ulang dari UJP ini" keep the audit trail honest.
- Ring / PER_RING tariff: billing-side; no tariff tables in this service.
- Route-plan master and per-lane cost presets: lanes come from `addresses`; presets are a follow-up once cost typos are observed.
- Subcon vendor master, vehicle admin UI, JWT role for approvers, historical import from `logisticdash`, CSV-import removal, dark theme: recorded follow-ups.

## Requirements

### Create
1. A signed-in console user can submit a UJP; it persists as `SUBMITTED` with a history row and a **server-assigned** reference `UJP-YYYYMMDD-NNNN` (daily counter, gap-free, unique).
2. The wizard has five steps with **forward-only dependencies**: Info (client, tanggal kirim, tim ops, layanan, tipe pengiriman, shift, jam) → Rute (lanes → stops, km) → Biaya (payee, vehicle, e-money, cost lines) → Driver (rider, rekening, cargo) → Review.
3. **Rute:** lanes are searched from `addresses` for the chosen client; multi-drop allows several lanes sharing one origin; selected lanes become one pickup and N drops with default workflows; `distance_km_calculated` = lane distance (single) or sum of lane distances labelled "estimasi" (multi); `km_yang_diajukan` is prefilled from it, editable, required. Manual stop edits show a banner and a "Reset dari lane" action. Empty search offers "Tambah di Alamat" and "Isi manual".
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
17. A rejected request shows the reason and note prominently; the requester gets **"Buat ulang dari UJP ini"** which opens the wizard prefilled (new reference on submit).
18. **Masking:** anyone who is neither an allowlisted approver nor the requester sees the account number as `•••• 1234` with a lock icon and tooltip, and the nominal as "Disembunyikan". Approver and requester see the full number with "Salin".

### Cross-cutting
19. Indonesian copy set is fixed in one constants file (see §UI contract).
20. Responsive: below `sm` the step indicator becomes "Langkah n/5 · {name}" with a progress rule, the footer stacks with the estimate strip full-width above the buttons (44 px targets), the Biaya grid is one column, the map is shorter, the panel is full-width with a sticky footer.
21. Accessibility: DOM order equals visual order; Enter never advances or submits; first empty required field is focused on step entry; every input is labelled; the estimate total is an `aria-live="polite"` region; stale/error states carry text, not only color; panel has `aria-labelledby`; step indicator exposes `aria-current="step"`; axe assertions in tests.
22. Light theme only, house palette; Flazz rendered in the emerald data tone, Transfer in the accent tone.

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
| No lane matches the client | Empty state with "Tambah di Alamat" and "Isi manual" |
| Multi-drop lane sum over-counts the real chain | Labelled "estimasi"; km editable and required |
| Reference counter at 23:59 WIB | Day computed inside the transaction on the server |
| Client-sent totals in the payload | Ignored; server recomputes |

## Success criteria

- Ops creates UJPs in the console with **zero CSV round-trips** for onboarded 4W clients.
- A fixture of 30 real UJPs reconciles **to the rupiah** with the old app's totals.
- Approve → shipment visible in the shipments list and the driver app, end to end, for one live client without manual database edits.
- Finance's default view (all statuses, by date, searched by driver) answers in < 500 ms at 10k rows.

## UI contract

- **Anchor:** a persistent estimate strip in the wizard footer (eyebrow "Estimasi total", mono amount, Flazz/Transfer chips, stale chip), shown from Rute onward and hidden on Biaya and Review where the breakdown/tiles carry the total.
- **Components:** `FormModal size="2xl"` + `StepIndicator` (+ compact prop) · `SegmentedControl` · `SearchSelect` · `Tag` · `Switch` · `DatePicker` · `MoneyInput` / `KmInput` (new, co-located) · shared `Direct4WStopsStep` / `Direct4WRiderStep` · `RouteStopsMap` · `Hint` · `InformationBanner` · `Badge` · `Button` (primary / outline-danger / ghost / white, loading) · `SideBarModal position="right" width="md"` · `Modal width="sm" iconTone="danger"` · `TableData` + `Paginator` + hairline tabs · `EmptyState` · `Skeleton` · sonner toaster · eyebrow labels · `font-mono tabular-nums` for ids and rupiah.
- **Copy set (constants file):** Buat Pengajuan UJP · Uang jalan 4W: info, rute, biaya, driver, lalu review. · Info · Rute · Biaya · Driver · Review · Kembali · Batal · Lanjut · Ajukan UJP · Estimasi total · Flazz · Transfer · Estimasi belum diperbarui · Estimasi gagal · Coba lagi · Dihitung server · Payee & kendaraan · Biaya operasional (uang jalan) · Rincian estimasi · Tidak dipakai untuk subcon · Override BBM · dari kendaraan · diubah manual · Jarak lane (estimasi) · KM diajukan · Jumlah jarak lane, bukan rute berantai · Stops diubah manual; lane tidak lagi mengisi otomatis · Reset dari lane · Lane tidak ditemukan untuk {client} · Tambah di Alamat · Isi manual · Lane harus dari origin yang sama · Logistic · UJP · Pengajuan UJP · Buat UJP · Menunggu · Disetujui · Ditolak · Dibatalkan · Semua · Belum ada pengajuan UJP · Tidak ada UJP untuk “{q}” · Hapus filter · Gagal memuat · Menunggu persetujuan · Menunggu persetujuan finance · Dibuat saat disetujui · Belum dibuat · Lihat shipment {waybill} · Rincian biaya · Rekening driver · Rekening subcon · Salin · Disembunyikan · Hanya requester & approver dapat melihat · Stops · Riwayat · Setujui & buat shipment · Tolak · Tolak UJP · Batalkan pengajuan · Buat ulang dari UJP ini · Ubah · UJP-{ref} diajukan · UJP-{ref} disetujui · Shipment {waybill} dibuat · UJP-{ref} ditolak · Pengajuan dibatalkan · Nomor rekening disalin · Sudah diputuskan oleh {name} · UJP tidak ditemukan · Alasan belum dikonfigurasi.

## Change request CR-1 (2026-09-15)

From the stakeholder walkthrough of the flow simulation. Requirements added (all Phase 1):

23. **Saved routes.** In Rute, ops picks a saved route for the client or builds one manually (ordered stops with roles Pool/Pickup/Drop/Return, leg km prefilled from the map, editable) and may save it under a name for reuse. The Addresses lane picker is removed.
24. **Km margin** is 10% by default (`km × 1.10`), configurable, and shown in the breakdown as "KM + margin 10%". Each UJP keeps the margin it was computed with.
25. **E-money** offers Tidak ada / Flazz / QRIS / Flazz + QRIS. Fuel goes to QRIS when available, otherwise to Flazz, otherwise to Transfer; toll and tap-parking go to Flazz when available, otherwise Transfer; manual lines always Transfer. When QRIS is used a third tile "Uang jalan QRIS" appears.
26. **Fuel price** comes from a dated master per fuel type (Solar, Dexlite, Pertalite, EV kWh) valid on the delivery date; the vehicle master carries the fuel type; the wizard shows the price locked "dari master", editable.
27. **Subcon** approvals do not create a shipment; the panel shows "Tidak dibuat: subcon". The vendor is picked from a subcon vendor master that fills bank details; the driver step is optional for subcon.
28. **Client UJP config** page (`/ujp/config`, editable by approvers): per client, "Leg pool ditagih" (charged) and "Biaya reverse". When not charged, the first and last (pool) legs are excluded from km and fuel pricing and the shipment is created with the inner stops only; when charged, all legs count and all stops ship. The wizard shows the client's rule read-only in Rute.
29. **Reverse trip** switch on Info (pre-ticked when the route has a Return leg); when on, the client's reverse charge is added as a Transfer line "Biaya reverse (client)".

Copy additions: Rute tersimpan · Buat rute manual · Simpan sebagai rute tersimpan · Pool / Pickup / Drop / Kembali ke pool · Leg pool ditagih · Leg pool tidak ditagih: leg pertama & terakhir tidak dihitung · KM semua leg · KM ditagih · Uang jalan QRIS · Perjalanan reverse · Biaya reverse (client) · Konfigurasi UJP client · Vendor subcon · Tidak dibuat: subcon.

## Changelog

- 2026-09-15 — v2.1: change request CR-1 added (requirements 23–29).

- 2026-09-12 — split into PRD (this file) and [TRD v2](./ujp-trd-v2.md); content unchanged.
- 2026-09-11 — v2 after engineering review (2026-09-10) and design review (2026-09-11). Changes from v1: scope narrowed to a vertical slice (D1); shipment link moved from Phase 3 into Phase 1 and made transactional on approve (D2/D3); formula ownership moved server-only, `/estimate` mandatory (D5, reverses v1 D1); `ujp_*` master replication replaced by existing masters plus one vehicle table (D7, D16); daily-counter numbering (D4); allowlist gate and masking (D6, D15); full UI contract added (DD1–DD14).
- 2026-09-01 — v1 created (superseded).
