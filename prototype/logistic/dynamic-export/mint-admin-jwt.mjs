#!/usr/bin/env node
/**
 * mint-admin-jwt.mjs — mint a local ADMIN (WEB) JWT for testing the export
 * endpoints against a LOCAL nest-logistic-service.
 *
 * The AuthGuard verifies `Bearer <jwt>` with the symmetric `JWT_SECRET` from
 * `.env` and checks `payload.identity.type` against the route's @AuthTypes.
 * BaseAuthType.ADMIN === 'WEB', so that is the type we sign.
 *
 * USAGE
 *   node sim/mint-admin-jwt.mjs                 # reads JWT_SECRET from .env
 *   JWT_SECRET=xxx node sim/mint-admin-jwt.mjs  # or pass it explicitly
 *   TTL_HOURS=24 node sim/mint-admin-jwt.mjs
 *
 * Prints ONLY the token to stdout, so you can capture it:
 *   TOKEN="$(node sim/mint-admin-jwt.mjs)"
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(repoRoot, '.env');
  if (!fs.existsSync(envPath)) return undefined;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === name && !line.trim().startsWith('#')) {
      return m[2].replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
}

const secret = readEnv('JWT_SECRET');
if (!secret) {
  console.error('JWT_SECRET not found (checked env + .env). Set it and retry.');
  process.exit(1);
}

const ttlHours = Number(process.env.TTL_HOURS || 12);
const identity = {
  id: 1,
  email: 'local-admin@dashelectric.co',
  name: 'Local Admin',
  type: 'WEB', // BaseAuthType.ADMIN
  // NOTE: no `provider_id` — an ADMIN is not a provider user. The export uses
  // `auth.provider_id ?? query.clientId`, and `0 ?? 566 === 0`, so setting
  // provider_id:0 would wrongly force clientId=0. Omit it → query.clientId wins.
  roles: [],
  providerOutletIds: [],
  providerPitstopIds: [],
};

const token = jwt.sign({ identity }, secret, {
  algorithm: 'HS256',
  expiresIn: `${ttlHours}h`,
});

process.stdout.write(token + '\n');
