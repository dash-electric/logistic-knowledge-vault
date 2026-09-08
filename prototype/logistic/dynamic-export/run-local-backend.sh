#!/usr/bin/env bash
#
# run-local-backend.sh — bring up the local backend stack for testing dynamic
# export: Postgres (docker) + migrations, then mint an ADMIN token and print
# the next steps. Start the API itself in a separate terminal (it's long-lived).
#
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1) Postgres via docker compose…"
docker compose up -d

echo "2) Waiting for Postgres to accept connections…"
for i in $(seq 1 30); do
  if docker compose exec -T "$(docker compose config --services | head -1)" \
      pg_isready -U postgres >/dev/null 2>&1; then
    echo "   ready."
    break
  fi
  sleep 1
done

echo "3) Running migrations (drizzle-kit migrate)…"
pnpm run db:migrate

echo "4) Minting a 12h ADMIN token…"
TOKEN="$(node sim/mint-admin-jwt.mjs)"

cat <<EOF

──────────────────────────────────────────────────────────────────────────
ADMIN TOKEN (12h) — copy this:

$TOKEN

NEXT:
  5) Start the API in another terminal:   pnpm start:dev
     (listens on APP_PORT from .env, default 8088)

  6) Test it, pick one:
     • Terminal sim:
         BASE_URL=http://localhost:8088 TOKEN='$TOKEN' CLIENT_ID=566 ./sim/dynamic-export-sim.sh
     • Browser sim:
         ( cd sim && python3 -m http.server 8080 )  # then open :8080/dynamic-export-sim.html
     • Real ops UI (react-logistic-web): see docs/dynamic-export/run-local.md
──────────────────────────────────────────────────────────────────────────
EOF
