-- ============================================================================
-- Seed: client -> export-template ownership  (dynamic shipment export)
-- Table:   client_export_templates   (created by migration 0091_dynamic_export_templates)
-- Run manually on STAGING and PRODUCTION after the 0091 migration is applied.
-- ============================================================================
--
-- WHAT THIS DOES
--   The export templates themselves (default, compact, patimban-export,
--   patimban-import) are CODE-registered in ExportTemplateRegistry — they need
--   NO rows anywhere. This table only records which CLIENT *owns* a template.
--
--   * No row for a template  -> it is GLOBAL (default & compact stay global; any
--                               client can pick them in Custom export).
--   * A row (client_id, key) -> that template is OWNED by that one client.
--
-- OWNERSHIP MODEL
--   template_key is UNIQUE -> each template belongs to at most ONE client.
--   A client may own SEVERAL templates (Patimban owns both export + import).
--   Default-export resolution: a client that owns exactly ONE template gets it
--   automatically; a client that owns >1 (Patimban) falls back to `default`, and
--   ops pick the direction (export vs import) explicitly in Custom export.
--
-- COLUMNS (id / created_at / updated_at are defaulted — do not set them)
--   client_id     integer  NOT NULL   -- core-service client master id (no FK)
--   template_key  text     NOT NULL   -- registry key, validated in-app; here raw
--   created_by    text     NOT NULL
--   updated_by    text     NOT NULL
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STAGING  (Patimban / AGL client_id = 449)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO client_export_templates (client_id, template_key, created_by, updated_by)
VALUES
  (449, 'patimban-export', 'system-seed', 'system-seed'),
  (449, 'patimban-import', 'system-seed', 'system-seed')
ON CONFLICT (template_key) DO UPDATE
  SET client_id  = EXCLUDED.client_id,
      updated_by = EXCLUDED.updated_by,
      updated_at = now();


-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTION  (client_id differs from staging — look it up first, then substitute)
-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Find the real Patimban/AGL client id on prod:
--
--      SELECT DISTINCT (client->>'id')::int AS client_id, client->>'name' AS name
--      FROM shipments
--      WHERE client->>'name' ILIKE '%patimban%'
--         OR client->>'name' ILIKE '%agl%'
--      ORDER BY client_id;
--
-- 2) Replace <PROD_CLIENT_ID> below with that integer and run:
--
-- INSERT INTO client_export_templates (client_id, template_key, created_by, updated_by)
-- VALUES
--   (<PROD_CLIENT_ID>, 'patimban-export', 'system-seed', 'system-seed'),
--   (<PROD_CLIENT_ID>, 'patimban-import', 'system-seed', 'system-seed')
-- ON CONFLICT (template_key) DO UPDATE
--   SET client_id  = EXCLUDED.client_id,
--       updated_by = EXCLUDED.updated_by,
--       updated_at = now();


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY  (both environments)
-- ─────────────────────────────────────────────────────────────────────────────
--   SELECT client_id, template_key, created_by, created_at
--   FROM client_export_templates
--   ORDER BY client_id, template_key;
--
-- Expected: two rows for the Patimban client -> patimban-export, patimban-import.
-- default / compact intentionally have NO rows (global).


-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (if a mapping was seeded wrong)
-- ─────────────────────────────────────────────────────────────────────────────
--   DELETE FROM client_export_templates
--   WHERE template_key IN ('patimban-export', 'patimban-import');


-- ============================================================================
-- DEPENDENCY (not seeded here): the Patimban export CSV's milestone-timestamp
-- and stop columns come from the stop-workflow graph. Those stop_workflows must
-- exist for the Patimban client in each environment (already present on staging;
-- on prod they are configured by ops through the Workflow UI, not via this file).
-- ============================================================================
