#!/usr/bin/env node
/**
 * Seed the local DB with the `patimban` data template + a client-566 mapping +
 * N (default 25) realistic DIRECT_4W EXPORT shipments (Depo → Customer) using
 * the REAL milestone keys, so the Patimban export has data to render.
 *
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5445/logistic-db \
 *   COUNT=25 node sim/seed-patimban-bulk.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5445/logistic-db';
const COUNT = Number(process.env.COUNT || 25);
const sql = postgres(DB, { onnotice: () => {} });

const DRIVERS = ['Daerman Kristian', 'Suhendro', 'Deni', 'Andi', 'Pepen', 'Joko', 'Rudi', 'Bambang'];
const PLATES = ['B 9152 PEK', 'B 9410 PEJ', 'B 9348 UIZ', 'B 9021 PXA', 'B 9227 TXW'];
const url = (s) => `https://storage.googleapis.com/logistic-bucket-main/seed/${s}.jpg`;

// Depo (stop 0) + Customer (stop 1) milestones with real keys + values.
const depoMilestones = (i, base) => ([
  ['antriGateInDepo', 1, base + 20, { fotoSaatSampaiDiDepo: [url(`d${i}-antri`)] }],
  ['gateInDepo', 2, base + 70, { fotoSaatMasukDepo: [url(`d${i}-gatein`)] }],
  ['muatKontainerKosong', 3, base + 75, { fotoKontainerKosong: [url(`d${i}-kontainer`)], tulisNomorKontainer: [`ONEU ${5800000 + i}`] }],
  ['fotoEirSegelSeal', 4, base + 80, { fotoEirBesertaSegelSeal: [url(`d${i}-eir`)], tulisNomorSegelSeal: [`ID407${70 + i}AB`] }],
  ['gateOutDepo', 5, base + 85, { fotoSaatKeluarDepo: [url(`d${i}-gateout`)] }],
]);
const custMilestones = (i, base) => ([
  ['antriGateInCostumer', 1, base + 175, { fotoSaatSampaiDiCustomer: [url(`c${i}-antri`)] }],
  ['gateInCustomer', 2, base + 590, { fotoDiGateSecurity: [url(`c${i}-gatein`)] }],
  ['selesaiBongkar', 3, base + 592, { fotoBuntutSetelahBongkar: [url(`c${i}-bongkar`)] }],
  ['muatKontainerKosong', 4, base + 595, { fotoKontainerKosongYangTelahDiMuat: [url(`c${i}-muat`)] }],
  ['suratJalan', 5, base + 610, { fotoSuratJalanDepan: [url(`c${i}-sj`)] }],
  ['gateOutCustomer', 6, base + 613, { fotoGateOut: [url(`c${i}-gateout`)] }],
]);

const iso = (dayOffset, minutes) => {
  const d = new Date(Date.UTC(2026, 8, 6, 0, 0, 0)); // 2026-09-06
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString();
};

async function main() {
  const definition = JSON.parse(fs.readFileSync('/tmp/patimban-def.json', 'utf8'));

  // 1. template + mapping
  await sql`
    INSERT INTO export_templates (key, name, definition, created_by, updated_by)
    VALUES ('patimban', 'AGL Patimban EXIM', ${sql.json(definition)}, 'seed', 'seed')
    ON CONFLICT (key) DO UPDATE SET definition = EXCLUDED.definition, updated_by = 'seed', updated_at = now()`;
  await sql`
    INSERT INTO client_export_templates (client_id, template_key, created_by, updated_by)
    VALUES (566, 'patimban', 'seed', 'seed')
    ON CONFLICT (client_id) DO UPDATE SET template_key = 'patimban', updated_by = 'seed', updated_at = now()`;

  // 2. clean prior bulk seed
  await sql`DELETE FROM shipments WHERE waybill LIKE 'DLAGL-SEED-%'`;
  await sql`DELETE FROM routes WHERE code LIKE 'RTE-SEED-%'`;

  const client = { id: 566, code: 'AGL', name: 'AGL Patimban' };
  const notes = (i) => ({
    fo_number: { label: 'FO Number', value: `610051${4200 + i}` },
    bl_number: { label: 'BL Number', value: '-' },
    agl_route_code: { label: 'AGL Route Code', value: `AGLI-FR-0${30 + i}` },
    agl_order_code: { label: 'AGL Order Code', value: `ESX-${i}` },
    booking_order_si: { label: 'Booking Order/SI', value: `D1O00234${i}` },
    notes: { label: 'Notes', value: '-' },
  });

  for (let i = 1; i <= COUNT; i++) {
    const dayOffset = i % 6; // spread across a few days
    const base = 410; // ~06:50 UTC start
    const [ship] = await sql`
      INSERT INTO shipments (waybill, client_id, client, booking_id, service_type, type, exim,
        container_type, sender_name, receiver_name, receiver_phone, destination_address,
        destination_lat, destination_long, destination_h3_index, total_weight, status,
        additional_notes, created_at)
      VALUES (${'DLAGL-SEED-' + String(i).padStart(3, '0')}, 566, ${sql.json(client)},
        ${'AGL-TRK-ESX' + i + '-2026-1000' + (60 + i)}, 'Dedicated On-Call', 'DIRECT_4W', 'EXPORT',
        'FCL_40FT', 'BSA Logistic', 'Indah Kiat Karawang', '', 'H8FJ+PW9, Kutanegara, Ciampel, Karawang',
        -6.429108, 107.33317, '888c10c9a5fffff', 0, 'COMPLETED',
        ${sql.json(notes(i))}, ${iso(dayOffset, 0)})
      RETURNING id`;

    const [route] = await sql`
      INSERT INTO routes (code, planned_date, rider_id, rider, vehicle)
      VALUES (${'RTE-SEED-' + String(i).padStart(3, '0')}, '2026-09-06', ${'rider-' + i},
        ${sql.json({ id: 'rider-' + i, code: 'RID-' + i, name: DRIVERS[i % DRIVERS.length], phoneNumber: '0812' + (1000 + i) })},
        ${sql.json({ plateNumber: PLATES[i % PLATES.length], unitType: 'TRAILER' })})
      RETURNING id`;

    const [depo] = await sql`
      INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
      VALUES (${route.id}, 1, 'PICKUP', 'Depo Cakung, Jakarta Timur', -6.158146, 106.940276, 'Depo Cakung')
      RETURNING id`;
    const [cust] = await sql`
      INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
      VALUES (${route.id}, 2, 'DROP_OFF', 'H8FJ+PW9, Kutanegara, Ciampel, Karawang', -6.429108, 107.33317, 'Indah Kiat Karawang')
      RETURNING id`;

    await sql`INSERT INTO route_stop_shipments (route_id, route_stop_id, shipment_id, status) VALUES
      (${route.id}, ${depo.id}, ${ship.id}, 'ACTIVE'), (${route.id}, ${cust.id}, ${ship.id}, 'ACTIVE')`;

    for (const [key, seq, min, values] of depoMilestones(i, base)) {
      await sql`INSERT INTO workflow_submissions (route_stop_id, workflow_id, milestone_key, milestone_sequence, values, submitted_by, submitted_at)
        VALUES (${depo.id}, gen_random_uuid(), ${key}, ${seq}, ${sql.json(values)}, 'seed', ${iso(dayOffset, min)})`;
    }
    for (const [key, seq, min, values] of custMilestones(i, base)) {
      await sql`INSERT INTO workflow_submissions (route_stop_id, workflow_id, milestone_key, milestone_sequence, values, submitted_by, submitted_at)
        VALUES (${cust.id}, gen_random_uuid(), ${key}, ${seq}, ${sql.json(values)}, 'seed', ${iso(dayOffset, min)})`;
    }
  }

  const [{ count }] = await sql`SELECT count(*)::int FROM shipments WHERE waybill LIKE 'DLAGL-SEED-%'`;
  console.log(`Seeded ${count} Patimban shipments + template + mapping (client 566 -> patimban).`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
