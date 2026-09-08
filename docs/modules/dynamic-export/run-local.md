# Run the whole dynamic-export feature locally

End to end: **local Postgres → local nest-logistic-service → react-logistic-web
Settings ▸ Export Templates**, all on your machine. Auth is a JWT signed with
the local `JWT_SECRET`, so no Google login is needed — we mint an ADMIN token.

## 1. Backend + DB (one command)

```bash
cd nest-logistic-service
./sim/run-local-backend.sh      # docker Postgres + migrations + prints an ADMIN token
pnpm start:dev                  # in a second terminal — API on :8088 (APP_PORT)
```

`run-local-backend.sh` prints a 12-hour **ADMIN token** — copy it. (Re-mint any
time with `node sim/mint-admin-jwt.mjs`.)

Sanity check the API + token:

```bash
curl -s http://localhost:8088/v1/export-templates \
  -H "Authorization: Bearer <TOKEN>" | jq
# → { "status": "Success", "data": { "templates": [ {"key":"default"}, {"key":"compact"} ] } }
```

## 2. Frontend (react-logistic-web) against the local API

Point the app at the local backend and start it:

```bash
cd react-logistic-web
echo 'REACT_APP_API_URL=http://localhost:8088' > .env.local   # or edit the existing one
DISABLE_ESLINT_PLUGIN=true npm start                          # CRA/craco on :3000
```

> **`DISABLE_ESLINT_PLUGIN=true` is required** — this repo has a dual npm+pnpm
> install that trips an eslint-plugin conflict and makes webpack fail to
> compile (a blank page at :3000) otherwise.

Open http://localhost:3000. Because the pages are auth-gated, inject the minted
token so the app is "logged in" — paste this in the browser devtools **Console**
(on localhost the storage keys are unprefixed). The `profile` must carry `uid`
and `email` — that is exactly what `AuthContext` checks:

```js
localStorage.setItem('token', 'PASTE_ADMIN_TOKEN_HERE');
localStorage.setItem('profile', JSON.stringify({
  uid: 'local-1',
  email: 'local-admin@dashelectric.co',
  displayName: 'Local Admin',
  photoURL: null,
}));
location.reload();
```

Then go to **http://localhost:3000/export-templates** (also in the sidebar as
**Export Templates**).

## 3. See it work

1. The page lists the registered templates (`default`, `compact`) and current
   mappings (empty at first).
2. Click **+ Add mapping**, pick a client (e.g. 566 / AGL Patimban) and the
   `compact` template, Save.
3. Go to **Shipments**, filter to that client, click **Export** — the CSV now
   uses the compact layout (8 columns) instead of default (19). Change or clear
   the mapping and export again to see it switch back.

> Only `default` and `compact` are registered. The real Patimban EXIM milestone
> template (`patimban`) is blocked on the G0 feasibility gate — see
> `PRD-DYNAMIC-SHIPMENT-EXPORT`.

## Troubleshooting

- **401 Unauthorized** — token missing/expired, or the FE isn't pointed at
  `:8088`. Re-mint and re-inject; confirm `REACT_APP_API_URL`.
- **Redirected to /signin** — the injected `token`/`profile` weren't set (or a
  prefix applies because you're not on `localhost`). Re-run the console snippet.
- **DB / migration errors** — ensure docker is running; `pnpm run db:migrate`
  must reach `0090_client_export_templates`.
