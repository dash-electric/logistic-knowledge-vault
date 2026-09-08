# Dynamic Shipment Export — local simulation

Two simulators drive the **real endpoints** on a locally running service to
demonstrate per-client dynamic export end to end:

- **`sim/dynamic-export-sim.html`** — a clickable browser UI (open the file, set
  Base URL + admin token, click through or hit "Run full auto flow"). Shows the
  registered templates, the client→template mapping, and each export's header
  row / column count / filename changing live. Triggers a real CSV download.
- **`sim/dynamic-export-sim.sh`** — the same flow as a terminal script (curl).

See `PRD-DYNAMIC-SHIPMENT-EXPORT` (workspace root) for the full design.

## The browser simulator

1. Migrate + start the server (see Prerequisites below).
2. Open `sim/dynamic-export-sim.html` in a browser. Serving it avoids any
   `file://` quirks:
   ```bash
   ( cd sim && python3 -m http.server 8080 )
   # then open http://localhost:8080/dynamic-export-sim.html
   ```
3. Enter your Base URL (default `http://localhost:3000`), an **ADMIN** bearer
   token, and a Client ID (default `566`). Click **Test connection**.
4. Click **▶ Run full auto flow**, or step through manually. Watch the export's
   column count flip between 19 (`default`) and 8 (`compact`) — that is the
   per-client switch. The CORS config exposes `Content-Disposition`, so the
   download filename is visible too.

## What it shows

The exported CSV's **header row + filename change** when a client is mapped to a
different template — the core of the feature. This works with **zero seed data**
(a header-only export still switches layouts); seed some client shipments if you
also want data rows.

Registered layouts today:

| key       | shape                | columns |
|-----------|----------------------|---------|
| `default` | one row per item     | 19 (mirrors the import template) |
| `compact` | one row per shipment | 8 (No, Booking ID, Waybill, Client, Direction, Service Type, Status, Destination Address) |

> The real Patimban EXIM milestone template (`patimban`) is **not** registered
> yet — it is blocked on the G0 feasibility gate (confirm live
> `workflow_submissions` for client 566 + ops sign-off). Until then the sim uses
> `compact` to prove the mechanism.

## Prerequisites

1. Local DB migrated through `0090_client_export_templates`:
   ```bash
   pnpm run db:migrate
   ```
2. Service running:
   ```bash
   pnpm start:dev
   ```
3. An **ADMIN** (or `INTERNAL_SERVICE`) bearer token — the config and export
   endpoints are ADMIN-guarded.

## Run

```bash
BASE_URL=http://localhost:3000 \
TOKEN='<admin-bearer-token>' \
CLIENT_ID=566 \
./sim/dynamic-export-sim.sh
```

Compare the `headers:` lines in steps 2 (default), 5 (compact), and 8 (default
again) — that difference is the per-client switch.

## Endpoints exercised

- `GET /v1/export-templates`
- `GET /v1/shipments/export?clientId=<id>`
- `GET|PUT|DELETE /v1/client-export-templates/<id>`
