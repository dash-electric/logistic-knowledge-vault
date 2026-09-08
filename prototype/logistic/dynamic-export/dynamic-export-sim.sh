#!/usr/bin/env bash
#
# dynamic-export-sim.sh — end-to-end simulation of per-client dynamic shipment
# export, driving the REAL endpoints on a locally running nest-logistic-service.
#
# It proves the mechanism without any seed data: the exported CSV's HEADER ROW
# and filename change when a client is mapped to a different template, even when
# zero shipments match (header-only export). Seed some client shipments first if
# you also want to see data rows.
#
# WHAT IT DOES
#   1. GET  /v1/export-templates                     list registered layouts
#   2. GET  /v1/shipments/export?clientId=<id>       baseline -> DEFAULT (19 cols)
#   3. PUT  /v1/client-export-templates/<id>         map client -> 'compact'
#   4. GET  /v1/client-export-templates              show the mapping
#   5. GET  /v1/shipments/export?clientId=<id>       -> COMPACT (8 cols)  <- SWITCH
#   6. PUT  /v1/client-export-templates/<id>         invalid key -> 400
#   7. DELETE /v1/client-export-templates/<id>       clear mapping
#   8. GET  /v1/shipments/export?clientId=<id>       -> back to DEFAULT
#
# PREREQUISITES
#   - The service running locally (e.g. `pnpm start:dev`) against a local DB
#     that has run migrations up to 0090_client_export_templates.
#   - An ADMIN (or INTERNAL_SERVICE) bearer token — the config + export
#     endpoints are ADMIN-guarded.
#
# USAGE
#   BASE_URL=http://localhost:3000 \
#   TOKEN='<admin-bearer-token>' \
#   CLIENT_ID=566 \
#   ./sim/dynamic-export-sim.sh
#
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CLIENT_ID="${CLIENT_ID:-566}"
TOKEN="${TOKEN:-}"

AUTH=(-H "Authorization: Bearer ${TOKEN}")
JSON=(-H "Content-Type: application/json")

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
ok() { printf '  \033[32m✓ %s\033[0m\n' "$*"; }
err() { printf '  \033[31m✗ %s\033[0m\n' "$*"; }

if [[ -z "${TOKEN}" ]]; then
  err "Set TOKEN to an ADMIN bearer token. See USAGE at the top of this file."
  exit 1
fi

# --- preflight: is the server up? -------------------------------------------
if ! curl -fsS -o /dev/null "${AUTH[@]}" "${BASE_URL}/v1/export-templates"; then
  err "Cannot reach ${BASE_URL}/v1/export-templates (server down, or token rejected)."
  exit 1
fi

# Print the export's header row (first CSV line, BOM stripped) + filename.
show_export() {
  local label="$1"
  local hdr body dispo first
  hdr="$(mktemp)"
  body="$(curl -sS -D "${hdr}" "${AUTH[@]}" \
    "${BASE_URL}/v1/shipments/export?clientId=${CLIENT_ID}")"
  dispo="$(grep -i '^content-disposition:' "${hdr}" | tr -d '\r' | sed 's/.*filename=//; s/"//g')"
  first="$(printf '%s' "${body}" | sed -n '1p' | sed 's/^\xEF\xBB\xBF//')"
  rm -f "${hdr}"
  info "${label}"
  info "  filename : ${dispo:-<none>}"
  info "  headers  : ${first}"
}

bold "Dynamic Shipment Export — simulation against ${BASE_URL} (client ${CLIENT_ID})"

# 1. list registered layouts
bold "1) Registered export templates"
curl -sS "${AUTH[@]}" "${BASE_URL}/v1/export-templates" | sed 's/^/  /'

# 2. baseline export (no mapping -> default)
bold "2) Baseline export (no mapping → default layout)"
show_export "DEFAULT export:"

# 3. map client -> compact
bold "3) Map client ${CLIENT_ID} → 'compact'"
curl -sS -X PUT "${AUTH[@]}" "${JSON[@]}" \
  -d '{"templateKey":"compact"}' \
  "${BASE_URL}/v1/client-export-templates/${CLIENT_ID}" | sed 's/^/  /'
ok "mapping upserted"

# 4. show the mapping
bold "4) Current client → template mappings"
curl -sS "${AUTH[@]}" "${BASE_URL}/v1/client-export-templates" | sed 's/^/  /'

# 5. export again -> compact (THE SWITCH)
bold "5) Export again → COMPACT layout (the dynamic switch)"
show_export "COMPACT export:"

# 6. negative: invalid template key -> 400
bold "6) Negative: mapping to an unknown template key → 400"
code="$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "${AUTH[@]}" "${JSON[@]}" \
  -d '{"templateKey":"does-not-exist"}' \
  "${BASE_URL}/v1/client-export-templates/${CLIENT_ID}")"
if [[ "${code}" == "400" ]]; then ok "rejected with HTTP 400 (TEMPLATE_KEY_INVALID)"; else err "expected 400, got ${code}"; fi

# 7. clear the mapping
bold "7) Delete the mapping"
curl -sS -X DELETE "${AUTH[@]}" "${BASE_URL}/v1/client-export-templates/${CLIENT_ID}" | sed 's/^/  /'
ok "mapping deleted"

# 8. export -> back to default
bold "8) Export → back to DEFAULT (mapping removed)"
show_export "DEFAULT export:"

bold "Done. Compare the 'headers' lines in steps 2, 5 and 8 — that is the per-client switch."
