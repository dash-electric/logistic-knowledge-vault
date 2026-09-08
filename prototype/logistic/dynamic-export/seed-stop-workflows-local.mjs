// Seed Patimban (client 566) stop-workflows into local logistic-db WITHOUT a
// staging call. Rows come from the summary the user pasted (exact metadata,
// real IDs preserved). Milestones/fields are reconstructed only for the two
// EXPORT pickup workflows whose keys we already hold in the Patimban export
// definition — the Depo pickup matches the summary counts exactly (5/7); the
// Customer pickup is best-effort (6 of 7 milestones known). The remaining four
// workflows get their rows but no milestones (their structure lives only on
// staging — use clone-stop-workflows.mjs with a token for a full clone).

import postgres from 'postgres';

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5445/logistic-db';

const CLIENT = { id: 566, name: 'AGL Patimban' };

// exim is inferred from the (EKSPOR)/(IMPOR) name tags; the RETURN_CONTAINER
// "…di Pelabuhan" leg belongs to the export cycle. Verified against the
// one-default-per-(client,stop_type,intent,exim) index: no collisions.
const WORKFLOWS = [
  {
    id: '9f7c24bf-fa3f-44a5-aa16-b21b0b501313',
    name: 'Drop Off (EKSPOR)',
    stopType: 'DROP_OFF', intent: 'UNLOAD', exim: 'EXPORT', isDefault: false,
    createdAt: '2026-08-28T11:22:03.564Z', updatedAt: '2026-08-31T08:43:11.466Z',
    milestones: [],
  },
  {
    id: 'a7ecefb8-6f01-4329-98f8-6e53ac0eab28',
    name: 'Pickup Customer Muat (EKSPOR)',
    stopType: 'PICKUP', intent: 'GENERIC', exim: 'EXPORT', isDefault: false,
    createdAt: '2026-08-28T11:06:06.786Z', updatedAt: '2026-09-03T10:44:59.601Z',
    // Reconstructed from the export def (stopIndex 1). 6 of the 7 real
    // milestones; muatKontainerKosong is confirmation-only here (its field key
    // is unknown from the def).
    milestones: [
      { key: 'antriGateInCostumer', name: 'Antri Gate In Customer', fields: [img('fotoSaatSampaiDiCustomer', 'Foto saat sampai di customer')] },
      { key: 'gateInCustomer', name: 'Gate In Customer', fields: [img('fotoDiGateSecurity', 'Foto di gate security')] },
      { key: 'selesaiBongkar', name: 'Selesai Bongkar', fields: [img('fotoBuntutSetelahBongkar', 'Foto buntut setelah bongkar')] },
      { key: 'muatKontainerKosong', name: 'Muat Kontainer Kosong', fields: [] },
      { key: 'suratJalan', name: 'Surat Jalan', fields: [img('fotoSuratJalanDepan', 'Foto surat jalan depan')] },
      { key: 'gateOutCustomer', name: 'Gate Out Customer', fields: [img('fotoGateOut', 'Foto gate out')] },
    ],
  },
  {
    id: '596b8da0-2dcc-48d2-ae8a-80c48a4d024f',
    name: 'Pickup Kontainer Kosong di Depo (EKSPOR)',
    stopType: 'PICKUP', intent: 'GENERIC', exim: 'EXPORT', isDefault: false,
    createdAt: '2026-08-19T05:57:58.610Z', updatedAt: '2026-08-31T08:42:51.469Z',
    // EXACT reconstruction from the export def (stopIndex 0): 5 milestones,
    // 7 fields — matches the summary's milestoneCount/fieldCount.
    milestones: [
      { key: 'antriGateInDepo', name: 'Antri Gate In Depo', fields: [img('fotoSaatSampaiDiDepo', 'Foto saat sampai di depo')] },
      { key: 'gateInDepo', name: 'Gate In Depo', fields: [img('fotoSaatMasukDepo', 'Foto saat masuk depo')] },
      { key: 'muatKontainerKosong', name: 'Muat Kontainer Kosong', fields: [img('fotoKontainerKosong', 'Foto kontainer kosong'), txt('tulisNomorKontainer', 'Nomor kontainer')] },
      { key: 'fotoEirSegelSeal', name: 'Foto EIR & Segel/Seal', fields: [img('fotoEirBesertaSegelSeal', 'Foto EIR beserta segel/seal'), txt('tulisNomorSegelSeal', 'Nomor segel/seal')] },
      { key: 'gateOutDepo', name: 'Gate Out Depo', fields: [img('fotoSaatKeluarDepo', 'Foto saat keluar depo')] },
    ],
  },
  {
    id: 'a4353de3-62af-4185-be7b-af78c5d1ff01',
    name: 'Drop Off Kontainer Kosong di Pelabuhan',
    stopType: 'DROP_OFF', intent: 'RETURN_CONTAINER', exim: 'EXPORT', isDefault: true,
    createdAt: '2026-08-18T07:08:33.501Z', updatedAt: '2026-08-31T08:42:42.448Z',
    milestones: [],
  },
  {
    id: 'b6f66e29-9bef-45be-acf6-fd2431bc1b10',
    name: 'Drop Off & Pickup Empty (IMPOR)',
    stopType: 'DROP_OFF', intent: 'UNLOAD', exim: 'IMPORT', isDefault: true,
    createdAt: '2026-08-18T07:07:16.725Z', updatedAt: '2026-08-31T08:42:22.452Z',
    milestones: [],
  },
  {
    id: '8d817c0f-af5b-4d37-882f-d6b044717e6d',
    name: 'Pickup Muat Kontainer di Terminal (IMPOR)',
    stopType: 'PICKUP', intent: 'GENERIC', exim: 'IMPORT', isDefault: true,
    createdAt: '2026-08-18T07:04:43.135Z', updatedAt: '2026-08-31T08:42:10.141Z',
    milestones: [],
  },
];

function img(key, label) {
  return { key, label, type: 'IMAGE', required: true, config: { imageCount: 1 } };
}
function txt(key, label) {
  return { key, label, type: 'TEXT', required: true, config: null };
}

const main = async () => {
  const sql = postgres(DB_URL, { max: 1 });
  try {
    for (const w of WORKFLOWS) {
      await sql.begin(async (tx) => {
        await tx`
          INSERT INTO stop_workflows
            (id, client_id, client, name, stop_type, intent, exim, is_default, status, created_at, updated_at)
          VALUES (
            ${w.id}, ${CLIENT.id}, ${sql.json(CLIENT)}, ${w.name},
            ${w.stopType}, ${w.intent}, ${w.exim}, ${w.isDefault}, 'ACTIVE',
            ${w.createdAt}, ${w.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            client_id = EXCLUDED.client_id, client = EXCLUDED.client,
            name = EXCLUDED.name, stop_type = EXCLUDED.stop_type,
            intent = EXCLUDED.intent, exim = EXCLUDED.exim,
            is_default = EXCLUDED.is_default, status = 'ACTIVE',
            updated_at = EXCLUDED.updated_at
        `;
        await tx`DELETE FROM workflow_milestones WHERE workflow_id = ${w.id}`;
        let mseq = 1;
        for (const m of w.milestones) {
          const [row] = await tx`
            INSERT INTO workflow_milestones (workflow_id, sequence, key, name)
            VALUES (${w.id}, ${mseq++}, ${m.key}, ${m.name})
            RETURNING id
          `;
          let fseq = 1;
          for (const f of m.fields) {
            await tx`
              INSERT INTO workflow_fields
                (milestone_id, sequence, key, label, type, required, config)
              VALUES (${row.id}, ${fseq++}, ${f.key}, ${f.label}, ${f.type}, ${f.required}, ${sql.json(f.config)})
            `;
          }
        }
      });
      const mc = w.milestones.length;
      const fc = w.milestones.reduce((n, m) => n + m.fields.length, 0);
      console.log(`  ✓ ${w.name}  [${w.stopType}/${w.intent}/${w.exim}]  ${mc} milestones, ${fc} fields${mc === 0 ? '  (row only — needs staging for detail)' : ''}`);
    }
    const [{ count }] = await sql`SELECT count(*)::int FROM stop_workflows WHERE client_id = 566`;
    console.log(`\n✔ Done. client-566 workflows in local: ${count}`);
  } finally {
    await sql.end();
  }
};

main().catch((e) => { console.error('\n✖ Seed failed:', e.message); process.exit(1); });
