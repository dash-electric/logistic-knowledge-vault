---
title: UJP Parity — logisticdash vs Port Baru (Bahasa Indonesia)
module: ujp
doctype: reference
version: 1.3
status: draft
updated: 2026-09-21
language: id
links:
  - ./ujp-trd-v3.md
  - ./ujp-prd-v3.md
sumber:
  - logisticdash (Supabase / TanStack Router)
  - nest-logistic-service + react-logistic-web (assessment §1–§19)
checker_artifact: https://claude.ai/code/artifact/3f639e9b-7b2b-4c38-b4c4-704f096cbcd7
tariff_checker: ./ujp-tariff-parity-id.md
---

# UJP: apa yang ada di logisticdash vs yang sudah kita port

Perbandingan fitur per fitur, alur end-to-end, dan gap. Status: **Ada** (setara/lebih),
**Sebagian** (beda nilai/cakupan), **Belum** (belum dibangun), **Skip** (sengaja ditunda).

Ringkasan: 38 fitur dibandingkan — Ada 27, Sebagian 3, Belum 4, Sengaja skip 4 (v1.2 setelah CR-4b, CR-5, dan master admin: tipe tarif, ring, auto-suggest, workflow per stop, master kendaraan & vendor naik ke Ada).

## 1. Tabel parity fitur

| Fitur | logisticdash | Port kita | Status | Catatan |
|---|---|---|---|---|
| Buat UJP (form) | Satu form panjang + dialog ringkasan | Wizard 5 langkah, server-authoritative | Ada | Beda bentuk |
| Reference ID `UJP-YYYYMMDD-####` | generateUjpReferenceId (klien) | `ujp_daily_counters` atomic (WIB, dalam tx) | Ada | Kita anti-duplikat |
| Perhitungan uang jalan | Di browser | Di server (`UjpCostService`), `/estimate`+create | Ada | Kita otoritatif server |
| Margin KM | `km / 0.95` (≈5,26%) | `km×(1+UJP_KM_MARGIN_PCT/100)`, default 10% | Sebagian | **Nilai beda — lihat Catatan** |
| BBM/energi (liter×harga) | liter=(km/0.95)/baseline | Sama + margin env; EV baseline=1/konsumsi | Ada | |
| Override BBM | `bbm_fix_override`/route lock | `bbmFixOverride` | Ada | |
| Toll/parkir/bongkar/makan/lain | Field terpisah | Sama | Ada | |
| E-money bucket | Biner (no→Transfer, else Flazz); 2 kolom | Tiga bucket Flazz/QRIS/Transfer | Ada | **QRIS net-new** |
| Subcon 100% transfer | payee_type=subcon | Sama; approve subcon = tanpa shipment | Ada | |
| Reverse / PP | PP ×2 KM + ring Reverse + harga_reverse | Biaya reverse (cost, CR-1) + harga_reverse (revenue, CR-4b); tidak ×2 KM | Sebagian | **Semantik ×2 KM beda — lihat Catatan** |
| Rute / route plan | Tak ada `ujp_routes`; schedules + extra_drops + delivery_legs | Modul `route_plans` + legs server + places Addresses + DRAFT write-back; stop = Pickup/Drop off · intent · leg pool (kosakata workflow, CR-6) | Ada | CR-2 + CR-6 |
| Places dari Addresses | Mapbox picker + master routes | `GET /v1/addresses/places` | Ada | CR-2 |
| Approve → jadi apa | Update status + schedule + push Basecamp + Dispatch API | Buat shipment DIRECT_4W dalam 1 tx | Ada | Beda target; kita shipment nyata |
| Gate approve | Role owner/manager/finance | `UJP_APPROVER_EMAILS` + tak bisa approve sendiri | Ada | Self-approve block net-new |
| Deteksi anomali approval queue | Konflik unit/driver/project + double-UJP | Belum | **Belum** [P2] | Belum tercatat |
| Reject + alasan | decision_note + logs | `ReasonType.UJP_REJECTION`; Lainnya wajib catatan | Ada | |
| Cancel | status=dibatalkan | Sama (requester-only, FOR UPDATE) | Ada | |
| Edit setelah submit | Ada, total diketik manual | Ada; server hitung ulang + version + diff | Ada | CR-3, lebih aman |
| Revert (batalkan approve) | Owner; reset + hapus schedule | Belum | **Belum** [P2] | §9 deferred |
| Combine (gabung UJP) | `combine_of_request_id` | Belum | **Belum** [P2] | §9 |
| Schedules auto-create | Saat create & approve | Belum (model beda) | Skip [P2] | §9 |
| Master kendaraan | vehicles CRUD | `/ujp/masters`: CRUD kendaraan + harga BBM/energi bertanggal (approver; plat unik, aturan ICE/EV) | Ada | TODO-22 selesai |
| Master harga BBM/energi (dated) | `vehicle_cost_configs` per kendaraan | `ujp_energy_prices` GLOBAL per fuel | Ada | **Granularitas beda** |
| Master vendor subcon | `subcon_vendors` CRUD | CRUD di `/ujp/masters` (approver), nonaktifkan/aktifkan | Ada | TODO-22 selesai |
| Config per client (leg pool ditagih) | `origin_is_depot` per-request | `ujp_client_configs` per client | Ada | CR-1, net-new |
| Tipe tarif | PER_RING, PER_TRIP_FLAT, FIXED, DISTANCE_TIER | Keempatnya (CR-4b; tier pakai KM diajukan, inklusif, MISSING_TIER kalau kosong) | Ada | CR-4b |
| Ring + rate (per-body, porsi driver/helper) | rate + per-body + driver/helper share | Sama: override per tipe unit (single/multi) + porsi driver/helper sebagai komisi (driver payee) | Ada | CR-4b; helper share dicatat, belum dipakai (UJP tanpa helper) |
| Asuransi | ditambah ke revenue | Sama | Ada | |
| Ring auto-suggest | Peta kata kunci kota + batch fixer | Port `ring-match.ts` (keyword kota, ambigu → kosong); tanpa batch fixer | Ada | CR-4b; batch fixer = bagian laporan |
| Margin / Laporan Margin | Engine allocation, report besar | Margin per-UJP di panel approver; dashboard belum | Sebagian | **CR-4b — dashboard belum diport** [P1] |
| Masking harga & rekening | TIDAK ADA (rekening penuh) | Field-tier: harga approver-only, rekening ****last4 | Ada | **NET-NEW** |
| Workflow per stop (route plan → shipment) | Tidak ada | CR-5: pin workflow per stop di Route Planner → UJP & wizard 4W; pin usang → default + tanda; badge drift bila master berubah | Ada | NET-NEW (CR-5 + CR-5b) |
| Google Sheet mirror | Sheets v4 | Belum | Skip [P2] | §9 |
| Basecamp spend-control | POST saat approve | Belum | Skip [P2] | §9 |
| Dispatch API push | Buat delivery saat approve | Belum (shipment lokal) | Skip | Beda arsitektur |
| Data historis / import | Kolom legacy + Sheet | Belum diputuskan | **Belum** [P3] | TODO-23 (finance) |
| Uang jalan otoritatif + contract test | Total bisa diketik manual saat edit | Server-only + zod contract test | Ada | **NET-NEW** |
| Stale/negative-margin guard | Tidak ada | `expectedVersion`→409 UJP_STALE; margin negatif konfirmasi | Ada | **NET-NEW** |

## 2. Alur end-to-end

**logisticdash:** buat (form panjang → dialog ringkasan) → simpan `travel_requests`=submitted + auto-schedule + mirror Sheet → biaya di browser (`km/0.95`, e-money biner) → approval queue (owner/manager/finance, deteksi anomali) → approve → push Basecamp + Dispatch API (subcon dilewati) → revenue & margin terpisah di Laporan Margin. Koreksi: edit (total manual), combine, revert (owner), cancel.

**Port kita:** buat (wizard 5 langkah) → uang jalan dihitung server (`/estimate`, create hitung ulang) → rute dari Route Planner (lane Addresses, legs server) → biaya `km×(1+margin%)`, 3 bucket + reverse charge → approve (allowlist, tak bisa approve sendiri) → buat shipment DIRECT_4W dalam 1 tx (subcon tanpa shipment) → revenue & margin di-snapshot dari tarif client (approver-only, konfirmasi kalau negatif). Koreksi: edit (server hitung ulang + versi + diff), cancel, reject. Revert/combine belum.

## 3. Daftar GAP (kita Belum/Sebagian)

- **[P1] Laporan Margin (dashboard)** — kita cuma margin per-UJP; dashboard lintas-UJP belum diport (CR-4b).
- **[P1] Margin KM angka beda** — logisticdash 5,26% vs kita default 10% (set env kalau ingin sama).
- **[P2] Deteksi anomali approval queue** — belum ada, belum tercatat.
- **[P2] Revert, Combine, Schedules auto-create, Sheet mirror, Basecamp** — sengaja ditunda (§9).
- **[P3] Batch ring fixer** (laporan), **vendor CRUD UI**, **import data historis** (TODO-23), **semantik reverse** (×2 KM), **surcharge multidrop / hari-shift / tagih per rit di laporan** (CR-4c, TODO-36).

## 4. Yang kita punya, logisticdash tidak

Bucket QRIS · satu kosakata stop = enum workflow (CR-6) · workflow per stop di route plan (pin → shipment, fallback bertanda) · uang jalan otoritatif server · field-tier masking (harga/rekening) · self-approve diblokir + allowlist · Route Planner sebagai modul (legs terukur + DRAFT write-back) · stale-decision guard · negative-margin confirm · contract test (zod vs koleksi).

## 5. Catatan penting

- **Angka margin KM beda.** logisticdash `km/0.95` (≈5,26%); kita `km×(1+UJP_KM_MARGIN_PCT/100)` default 10%. Keputusan angka, bukan bug — set env kalau ingin paritas.
- **Semantik reverse beda.** logisticdash menggandakan KM (PP ×2) + ring Reverse; kita hanya menambah baris biaya reverse. Konfirmasi mana yang benar untuk bisnis.
- **Harga BBM global vs per-kendaraan.** logisticdash per kendaraan (dated); kita global per jenis fuel (dated).

> Checker interaktif: lihat `checker_artifact` di frontmatter.
