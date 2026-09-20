---
title: Tarif Parity — logisticdash vs Port Baru setelah CR-4b (Bahasa Indonesia)
module: ujp
doctype: reference
version: 1.0
status: draft
updated: 2026-09-20
language: id
links:
  - ./ujp-trd-v3.md
  - ./ujp-parity-logisticdash-id.md
sumber:
  - logisticdash src/lib/tariff.ts, allocation.ts, ring-match.ts, TariffTab.tsx
  - nest-logistic-service modul tariff + ujp (assessment §18, §20); react-logistic-web /ujp/tariffs
checker_artifact: https://claude.ai/code/artifact/ecd683e9-975b-4a7d-b843-34fdafc8a53e
---

# Tarif & margin: apa yang logisticdash hitung vs yang kita hitung sekarang

Ringkasan: 40 fitur tarif dibandingkan — **Ada 27, Sebagian 5, Belum 8**. Semua aturan harga **per satu trip** sudah setara sejak CR-4b; yang tersisa adalah aturan **lintas-UJP / bulanan** (CR-4c, TODO-36).

## 1. Tabel parity fitur tarif

| Kelompok | Fitur | logisticdash | Port kita | Status |
|---|---|---|---|---|
| Tipe tarif | PER_TRIP_FLAT (single/multi) | rate_flat(_multi) | Sama; multi 0 → single + MULTI_RATE_FALLBACK | Ada |
| Tipe tarif | FIXED | rate_fixed; di laporan diprorata per hari aktif | rate_fixed apa adanya per UJP | Ada |
| Tipe tarif | PER_RING (config-scoped) | tarif_ring.tarif_id | tariff_rings.tariff_config_id | Ada |
| Tipe tarif | DISTANCE_TIER | distance_tiers dari km_yang_diajukan | Sama, dari kmYangDiajukan | Ada |
| Tier | Batas inklusif, di atas → tier tertinggi | kosong → 0 | + TIER_ABOVE_MAX; kosong → MISSING_TIER | Ada |
| Tier | Validasi tier saat simpan | tidak ada | maxKm > 0, unik, urut; duplikat → 400 | Ada (net-new) |
| Per body | Rate khusus per tipe unit FLAT (single/multi) | rates_flat_per_body(_multi) | Sama; kunci unit_type UJP, tak peka huruf; 0 → dasar + BODY_RATE_DEFAULT | Ada |
| Per body | Rate khusus per tipe unit RING | rates_per_body(_multi) | Sama | Ada |
| Per body | Daftar body type baku (11 nama) | ALL_BODY_TYPE | teks bebas unit_type | Sebagian [P3] |
| Per body | Body type subcon | subcon_body_type | unit_type di langkah Biaya | Ada |
| Porsi | Porsi driver (single/multi) | driver_share(_multi) → cost | komisi = cost margin, payee driver | Ada |
| Porsi | Porsi helper | dipotong bila ada helperId | dicatat, tidak dipakai (UJP tanpa helper) | Sebagian [P3] |
| Porsi | no_driver_fee | flag client | belum | Belum [P3] |
| Komponen | Asuransi | + revenue | Sama | Ada |
| Komponen | Harga reverse (revenue) | harga_reverse bila PP | hargaReverse bila is_reverse | Ada |
| Komponen | Surcharge multidrop | free_points (3) + extra_rate | Sama; titik = DROP_OFF | Ada |
| Jendela | Periode berlaku | berlaku_mulai/sampai | Sama | Ada |
| Jendela | Hari operasi | [MON..SUN] | Sama (hari dari string tanggal) | Ada |
| Jendela | Shift operasi | [Dawn..Night] | Sama; UJP tanpa shift hanya cocok config tanpa batasan | Ada |
| Jendela | Cek tumpang-tindih saat simpan | isOverlapWithDays (UI) | belum; paling baru menang | Belum [P2] |
| Lain | Tagih per rit / cap unit-hari | cap harian di laporan | disimpan + ditampilkan; tak berlaku per UJP | Sebagian [P2] |
| Lain | Catatan / keterangan ring | ada | Sama | Ada |
| Lain | Urutan ring | urutan | Sama | Ada |
| Lain | Pin tarif/ring di rute | routes.tariff_config_id/ring_id + cek kedaluwarsa | route_plans.default_ring_id pre-fill; tarif diresolve per tanggal | Sebagian [P3] |
| Ring | Auto-suggest dari tujuan | ring-match.ts keyword kota | Port setara BE + FE | Ada |
| Ring | Fallback satu-satunya ring | auto pakai kalau 1 ring | belum (MISSING_RING) | Belum [P3] |
| Ring | Batch fixer ring kosong | MissingRingPanel | belum (laporan) | Belum [P3] |
| Resolusi | Paling baru berlaku_mulai menang | ya | Sama | Ada |
| Resolusi | Revenue tidak difabrikasi | revenue 0 + warning | MISSING_TARIFF/RING/TIER → null | Ada (net-new) |
| Resolusi | Snapshot tarif beku di UJP | tidak ada | ujp.tariff (rate, sumber, tier, surcharge, reverse, komisi, catatan) | Ada (net-new) |
| Margin | Margin per UJP = revenue − uang jalan − komisi | agregat di laporan | dibekukan saat approve; negatif → konfirmasi | Ada |
| Margin | Prorata FIXED per hari aktif bulan | ya | belum | Belum [P1] |
| Margin | Laporan Margin bulanan | laporan-margin.tsx | belum | Belum [P1] |
| Margin | Additional Revenue | client_additional_configs | belum | Belum [P2] |
| Margin | Revenue bulanan (PROFORMA/TERTAGIH/LUNAS) | revenue_bulanan | belum | Belum [P2] |
| Akses | Harga hanya approver | tidak dimasking | field-tier masking | Ada (net-new) |
| UI | Editor konfigurasi tarif | TariffTab | /ujp/tariffs, semua field + editor tier, label Indonesia | Ada |
| UI | Editor ring | daftar ring + per body + porsi | Sama | Ada |
| UI | Hapus konfigurasi / ring | hapus | nonaktifkan config; ring hanya ubah | Sebagian [P3] |
| UI | Rincian harga di panel approver | di laporan | RevenueBlock: rate + sumber, tier, asuransi, surcharge, reverse, komisi, catatan | Ada (net-new) |

## 2. Alur harga saat approve (port kita)

```
tarif    = aktif(client, tglKirim) ∧ hariOperasi ∋ hari(tglKirim) ∧ shiftOperasi ∋ shift(UJP)
rate     = PER_RING/FLAT : bodyMulti > baseMulti > bodySingle > baseSingle   (multi = DROP_OFF > 1)
           FIXED         : rateFixed
           DISTANCE_TIER : tier pertama km ≤ maxKm, else tertinggi (+TIER_ABOVE_MAX)
revenue  = rate + asuransi + max(0, titik − titikGratis) × ratePerTitik + (reverse ? hargaReverse : 0)
komisi   = payee DRIVER ? porsiDriver (multi > 0 ? multi : single) : 0
margin   = revenue − uangJalan − komisi          → snapshot beku di ujp.tariff
```

## 3. Edge case yang diuji (48)

Rate ladder (7), DISTANCE_TIER (8), surcharge (5), reverse & asuransi (4), komisi & margin (6), jendela hari/shift (5), ring auto-suggest (7), persistensi & kontrak (6). Hasil: BE unit 1932/185 hijau, integrasi DB nyata 11/11, FE 440/45, tsc + lint bersih.

## 4. Gap tersisa

- **[P1]** Prorata FIXED bulanan; Laporan Margin bulanan (CR-4c, TODO-36).
- **[P2]** Additional Revenue; revenue bulanan; cek tumpang-tindih konfigurasi saat simpan; tagih per rit di laporan.
- **[P3]** Daftar body type baku; porsi helper aktif saat UJP punya helper; no_driver_fee; fallback satu-satunya ring; batch fixer ring; pin tarif di rute; hapus ring.

## 5. Catatan

- **Porsi helper dicatat, belum dipakai** — UJP belum punya field helper.
- **Semantik reverse** — logisticdash ×2 KM + ring Reverse; kita baris biaya + harga reverse. Perlu konfirmasi bisnis.
- **Body type = teks tipe unit** — ejaan beda → rate dasar + catatan BODY_RATE_DEFAULT, tidak diam-diam.
