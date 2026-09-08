// Clone Patimban (client 566) stop-workflows from STAGING into the local
// logistic-db — full detail (milestones + fields), IDs and keys preserved so
// the export (matches submissions by milestoneKey) and the 4W create form
// (renders fields by key) line up exactly with staging.
//
// Usage:
//   STAGING_TOKEN='<bearer>' node sim/clone-stop-workflows.mjs
//
// Optional env:
//   STAGING_BASE_URL   (default https://stg-api.dashelectric.co)
//   DATABASE_URL       (default the local logistic-db from .env)
//   DRY_RUN=true       fetch + print, do not write

import postgres from 'postgres';

const IDS = [
  '9f7c24bf-fa3f-44a5-aa16-b21b0b501313', // Drop Off (EKSPOR)
  'a7ecefb8-6f01-4329-98f8-6e53ac0eab28', // Pickup Customer Muat (EKSPOR)
  '596b8da0-2dcc-48d2-ae8a-80c48a4d024f', // Pickup Kontainer Kosong di Depo (EKSPOR)
  'a4353de3-62af-4185-be7b-af78c5d1ff01', // Drop Off Kontainer Kosong di Pelabuhan
  'b6f66e29-9bef-45be-acf6-fd2431bc1b10', // Drop Off & Pickup Empty (IMPOR)
  '8d817c0f-af5b-4d37-882f-d6b044717e6d', // Pickup Muat Kontainer di Terminal (IMPOR)
];

const BASE = process.env.STAGING_BASE_URL || 'https://stg-api.dashelectric.co';
const TOKEN = process.env.STAGING_TOKEN;
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5445/logistic-db';
const DRY = process.env.DRY_RUN === 'true';

if (!TOKEN) {
  console.error('✖ STAGING_TOKEN is required (a valid staging bearer token).');
  process.exit(1);
}

const fetchDetail = async (id) => {
  const res = await fetch(`${BASE}/v1/stop-workflows/${id}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'dash-client-type': 'web',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET ${id} → ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data ?? json;
};

const main = async () => {
  console.log(`↓ Fetching ${IDS.length} workflow(s) from ${BASE} …`);
  const details = [];
  for (const id of IDS) {
    const d = await fetchDetail(id);
    console.log(
      `  · ${d.name}  [${d.stopType}/${d.intent}/${d.exim ?? 'GENERAL'}]  ` +
        `${d.milestones?.length ?? 0} milestones` +
        `, ${d.milestones?.reduce((n, m) => n + (m.fields?.length ?? 0), 0) ?? 0} fields`
    );
    details.push(d);
  }

  if (DRY) {
    console.log('\nDRY_RUN — not writing. Sample detail[0]:');
    console.log(JSON.stringify(details[0], null, 2));
    return;
  }

  const sql = postgres(DB_URL, { max: 1 });
  try {
    for (const d of details) {
      await sql.begin(async (tx) => {
        // Replace the workflow row (id preserved) …
        await tx`
          INSERT INTO stop_workflows
            (id, client_id, client, name, stop_type, intent, exim, is_default, status, created_at, updated_at)
          VALUES (
            ${d.id}, ${d.clientID}, ${sql.json(d.client ?? null)}, ${d.name},
            ${d.stopType}, ${d.intent ?? 'GENERIC'}, ${d.exim ?? 'GENERAL'},
            ${!!d.isDefault}, ${d.status ?? 'ACTIVE'},
            ${d.createdAt ?? sql`now()`}, ${d.updatedAt ?? sql`now()`}
          )
          ON CONFLICT (id) DO UPDATE SET
            client_id = EXCLUDED.client_id, client = EXCLUDED.client,
            name = EXCLUDED.name, stop_type = EXCLUDED.stop_type,
            intent = EXCLUDED.intent, exim = EXCLUDED.exim,
            is_default = EXCLUDED.is_default, status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
        `;
        // … then rebuild its milestones + fields (cascade clears old fields).
        await tx`DELETE FROM workflow_milestones WHERE workflow_id = ${d.id}`;
        for (const m of d.milestones ?? []) {
          const [row] = await tx`
            INSERT INTO workflow_milestones (id, workflow_id, sequence, key, name)
            VALUES (${m.id}, ${d.id}, ${m.sequence}, ${m.key}, ${m.name})
            RETURNING id
          `;
          for (const f of m.fields ?? []) {
            await tx`
              INSERT INTO workflow_fields
                (id, milestone_id, sequence, key, label, type, required, config)
              VALUES (
                ${f.id}, ${row.id}, ${f.sequence}, ${f.key}, ${f.label},
                ${f.type}, ${f.required ?? true}, ${sql.json(f.config ?? null)}
              )
            `;
          }
        }
      });
      console.log(`  ✓ cloned ${d.name}`);
    }

    const [{ count }] = await sql`
      SELECT count(*)::int FROM stop_workflows WHERE client_id = 566
    `;
    console.log(`\n✔ Done. stop_workflows for client 566 in local: ${count}`);
  } finally {
    await sql.end();
  }
};

main().catch((e) => {
  console.error('\n✖ Clone failed:', e.message);
  process.exit(1);
});
