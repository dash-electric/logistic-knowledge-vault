-- Seed AGL Patimban (client_id 566) DIRECT_4W shipments — one EXPORT, one
-- IMPORT — with route + stops + workflow submissions + additional_notes, so the
-- `patimban` export template has real data to assemble. Idempotent: re-running
-- deletes the seeded waybills first. Run against the LOCAL db only.
--
--   psql -h localhost -p 5445 -U postgres -d logistic-db -f sim/seed-patimban.sql

BEGIN;

-- Clean up prior seed (cascade removes route_stops/links/submissions via FKs).
DELETE FROM shipments WHERE waybill IN ('DASH-PTB-EXP-001', 'DASH-PTB-IMP-001');
DELETE FROM routes WHERE code IN ('RTE-PTB-EXP-1', 'RTE-PTB-IMP-1');

-- ============================ EXPORT ============================
DO $$
DECLARE v_ship uuid; v_route uuid; v_s1 uuid; v_s2 uuid; v_s3 uuid;
BEGIN
  INSERT INTO shipments (waybill, client_id, client, booking_id, service_type,
    type, exim, container_type, sender_name, receiver_name, receiver_phone,
    destination_address, destination_lat, destination_long, destination_h3_index,
    total_weight, status, additional_notes, created_at)
  VALUES ('DASH-PTB-EXP-001', 566,
    '{"id":566,"code":"AGL","name":"AGL Patimban"}'::jsonb,
    'AGL-TRK-ER-2026-100002', 'EXIM', 'DIRECT_4W', 'EXPORT', 'FCL 40ft',
    'AGL Patimban', 'AGL Patimban', '08988971946',
    'Container Yard (CY), Pelabuhan Patimban', -6.2470, 107.9080, '8a2a1072b59ffff',
    1000, 'COMPLETED',
    '{"fo_number":{"label":"FO Number","value":"6100514211"},
      "bl_number":{"label":"BL Number","value":"-"},
      "container_number":{"label":"Container Number","value":"8389951"},
      "seal_number":{"label":"Seal Number","value":"72817281"},
      "agl_route_code":{"label":"AGL Route Code","value":"AGLI-FR-031"},
      "agl_order_code":{"label":"AGL Order Code","value":"ESX-1"},
      "booking_order_si":{"label":"Booking Order/SI","value":"D1O0023422"},
      "notes":{"label":"Notes","value":"-"}}'::jsonb,
    '2026-09-01 21:25:00+07')
  RETURNING id INTO v_ship;

  INSERT INTO routes (code, planned_date, rider_id, rider, vehicle)
  VALUES ('RTE-PTB-EXP-1', '2026-09-01', 'rider-suhendro',
    '{"id":"rider-suhendro","code":"RID-EXP","name":"Suhendro","phoneNumber":"08988971946"}'::jsonb,
    '{"plateNumber":"B 9410 PEJ","unitType":"Tronton"}'::jsonb)
  RETURNING id INTO v_route;

  INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
  VALUES (v_route, 1, 'PICKUP', 'Lokasi depo sesuai assignment', -6.1400, 106.9400, 'Depo Empty') RETURNING id INTO v_s1;
  INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
  VALUES (v_route, 2, 'PICKUP', 'BYD Subang, Jawa Barat', -6.5500, 107.7500, 'Customer BYD Subang') RETURNING id INTO v_s2;
  INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
  VALUES (v_route, 3, 'DROP_OFF', 'Container Yard (CY), Pelabuhan Patimban', -6.2470, 107.9080, 'AGL Patimban CY') RETURNING id INTO v_s3;

  INSERT INTO route_stop_shipments (route_id, route_stop_id, shipment_id, status) VALUES
    (v_route, v_s1, v_ship, 'ACTIVE'), (v_route, v_s2, v_ship, 'ACTIVE'), (v_route, v_s3, v_ship, 'ACTIVE');

  INSERT INTO workflow_submissions (route_stop_id, workflow_id, milestone_key, milestone_sequence, values, submitted_by, submitted_at) VALUES
    -- Stop 1 Depo (ambil kontainer kosong)
    (v_s1, gen_random_uuid(), 'foto-kontainer', 1, '{"photo":"https://dashelectric.co/evi/exp-depo-container.jpg"}', 'seed', '2026-09-01 23:30:00+07'),
    (v_s1, gen_random_uuid(), 'gate-out',       2, '{"photo":"https://dashelectric.co/evi/exp-depo-gateout.jpg"}',  'seed', '2026-09-01 23:55:00+07'),
    -- Stop 2 Customer (loading)
    (v_s2, gen_random_uuid(), 'gate-in',     1, '{"photo":"https://dashelectric.co/evi/exp-cust-gatein.jpg"}',  'seed', '2026-09-02 03:55:00+07'),
    (v_s2, gen_random_uuid(), 'selesai',     2, '{"photo":"https://dashelectric.co/evi/exp-cust-loaded.jpg"}',  'seed', '2026-09-02 04:30:00+07'),
    (v_s2, gen_random_uuid(), 'surat-jalan', 3, '{"photo":"https://dashelectric.co/evi/exp-cust-sj.jpg"}',      'seed', '2026-09-02 04:45:00+07'),
    (v_s2, gen_random_uuid(), 'gate-out',    4, '{"photo":"https://dashelectric.co/evi/exp-cust-gateout.jpg"}', 'seed', '2026-09-02 04:55:00+07'),
    -- Stop 3 Pelabuhan CY (drop full container)
    (v_s3, gen_random_uuid(), 'antri-gate-pass', 1, '{}',                                                             'seed', '2026-09-02 05:55:00+07'),
    (v_s3, gen_random_uuid(), 'gate-in',         2, '{"photo":"https://dashelectric.co/evi/exp-port-gatein.jpg"}',    'seed', '2026-09-02 07:00:00+07'),
    (v_s3, gen_random_uuid(), 'drop-container',  3, '{"photo":"https://dashelectric.co/evi/exp-port-drop.jpg"}',      'seed', '2026-09-02 07:30:00+07'),
    (v_s3, gen_random_uuid(), 'gate-out',        4, '{"photo":"https://dashelectric.co/evi/exp-port-gateout.jpg"}',   'seed', '2026-09-02 07:55:00+07');
END $$;

-- ============================ IMPORT ============================
DO $$
DECLARE v_ship uuid; v_route uuid; v_s1 uuid; v_s2 uuid; v_s3 uuid;
BEGIN
  INSERT INTO shipments (waybill, client_id, client, booking_id, service_type,
    type, exim, container_type, sender_name, receiver_name, receiver_phone,
    destination_address, destination_lat, destination_long, destination_h3_index,
    total_weight, status, additional_notes, created_at)
  VALUES ('DASH-PTB-IMP-001', 566,
    '{"id":566,"code":"AGL","name":"AGL Patimban"}'::jsonb,
    'AGL-TRK-IMR-2-2026-100015', 'EXIM', 'DIRECT_4W', 'IMPORT', 'FCL 40ft',
    'AGL Patimban', 'AGL Patimban', '082315012837',
    'Container Yard (CY), Pelabuhan Patimban', -6.2470, 107.9080, '8a2a1072b59ffff',
    1000, 'COMPLETED',
    '{"fo_number":{"label":"FO Number","value":"-"},
      "bl_number":{"label":"BL Number","value":"MEDUXV370762"},
      "container_number":{"label":"Container Number","value":"9212788"},
      "seal_number":{"label":"Seal Number","value":"63376277"},
      "agl_route_code":{"label":"AGL Route Code","value":"-"},
      "agl_order_code":{"label":"AGL Order Code","value":"-"},
      "booking_order_si":{"label":"Booking Order/SI","value":"-"},
      "notes":{"label":"Notes","value":"Impor reguler"}}'::jsonb,
    '2026-09-01 21:25:00+07')
  RETURNING id INTO v_ship;

  INSERT INTO routes (code, planned_date, rider_id, rider, vehicle)
  VALUES ('RTE-PTB-IMP-1', '2026-09-01', 'rider-deni',
    '{"id":"rider-deni","code":"RID-IMP","name":"Deni","phoneNumber":"082315012837"}'::jsonb,
    '{"plateNumber":"B 9348 UIZ","unitType":"Tronton"}'::jsonb)
  RETURNING id INTO v_route;

  INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
  VALUES (v_route, 1, 'PICKUP', 'Terminal Peti Kemas Patimban, Subang', -6.2470, 107.9080, 'Pelabuhan Patimban') RETURNING id INTO v_s1;
  INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
  VALUES (v_route, 2, 'DROP_OFF', 'Lokasi customer (end user)', -6.5710, 107.7600, 'Customer End User') RETURNING id INTO v_s2;
  INSERT INTO route_stops (route_id, sequence, type, address, latitude, longitude, contact_name)
  VALUES (v_route, 3, 'DROP_OFF', 'Container Yard (CY), Pelabuhan Patimban', -6.2470, 107.9080, 'AGL Patimban CY') RETURNING id INTO v_s3;

  INSERT INTO route_stop_shipments (route_id, route_stop_id, shipment_id, status) VALUES
    (v_route, v_s1, v_ship, 'ACTIVE'), (v_route, v_s2, v_ship, 'ACTIVE'), (v_route, v_s3, v_ship, 'ACTIVE');

  INSERT INTO workflow_submissions (route_stop_id, workflow_id, milestone_key, milestone_sequence, values, submitted_by, submitted_at) VALUES
    -- Stop 1 Pelabuhan (ambil FCL import)
    (v_s1, gen_random_uuid(), 'antri-gate-pass', 1, '{}',                                                          'seed', '2026-09-01 23:55:00+07'),
    (v_s1, gen_random_uuid(), 'gate-in',         2, '{"photo":"https://dashelectric.co/evi/imp-port-gatein.jpg"}', 'seed', '2026-09-02 03:55:00+07'),
    (v_s1, gen_random_uuid(), 'foto-kontainer',  3, '{"photo":"https://dashelectric.co/evi/imp-port-container.jpg"}','seed','2026-09-02 04:10:00+07'),
    (v_s1, gen_random_uuid(), 'gate-out',        4, '{"photo":"https://dashelectric.co/evi/imp-port-gateout.jpg"}','seed', '2026-09-02 04:55:00+07'),
    -- Stop 2 Customer (bongkar)
    (v_s2, gen_random_uuid(), 'gate-in',     1, '{"photo":"https://dashelectric.co/evi/imp-cust-gatein.jpg"}',  'seed', '2026-09-02 05:55:00+07'),
    (v_s2, gen_random_uuid(), 'selesai',     2, '{"photo":"https://dashelectric.co/evi/imp-cust-unloaded.jpg"}','seed', '2026-09-02 06:40:00+07'),
    (v_s2, gen_random_uuid(), 'surat-jalan', 3, '{"photo":"https://dashelectric.co/evi/imp-cust-sj.jpg"}',      'seed', '2026-09-02 06:55:00+07'),
    (v_s2, gen_random_uuid(), 'gate-out',    4, '{"photo":"https://dashelectric.co/evi/imp-cust-gateout.jpg"}', 'seed', '2026-09-02 07:10:00+07'),
    -- Stop 3 CY (drop kontainer kosong)
    (v_s3, gen_random_uuid(), 'antri-gate-pass', 1, '{}',                                                           'seed', '2026-09-02 07:55:00+07'),
    (v_s3, gen_random_uuid(), 'gate-in',         2, '{"photo":"https://dashelectric.co/evi/imp-cy-gatein.jpg"}',    'seed', '2026-09-02 08:30:00+07'),
    (v_s3, gen_random_uuid(), 'drop-container',  3, '{"photo":"https://dashelectric.co/evi/imp-cy-drop.jpg"}',      'seed', '2026-09-02 08:45:00+07'),
    (v_s3, gen_random_uuid(), 'gate-out',        4, '{"photo":"https://dashelectric.co/evi/imp-cy-gateout.jpg"}',   'seed', '2026-09-02 09:10:00+07');
END $$;

COMMIT;

SELECT waybill, exim, status FROM shipments WHERE client_id = 566 AND waybill LIKE 'DASH-PTB-%';
