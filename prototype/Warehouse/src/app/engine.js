// ── Domain: status, label, tone + engine mutasi (in-memory, persist localStorage) ──
// Kunci di-bump setiap bentuk data berubah: state lama tidak pernah dibaca ulang (demo tidak bisa rusak).
const STORE_KEY = 'dash-wms-mockup-v4';
const DB_VERSION = 4;
const OLD_STORE_KEYS = ['dash-wms-mockup-v1', 'dash-wms-mockup-v2', 'dash-wms-mockup-v3'];

/* Outbound request (header order client) */
const OR_LABEL = { OPEN: 'Open', PREPARING: 'Preparing', READY_TO_PICKUP: 'Ready to pick up', SHIPPED: 'Shipped', IN_DELIVERY: 'In delivery', DELIVERED: 'Delivered', FAILED: 'Failed', CANCELLED: 'Cancelled' };
const OR_TONE = { OPEN: 'information', PREPARING: 'away', READY_TO_PICKUP: 'verified', SHIPPED: 'feature', IN_DELIVERY: 'away', DELIVERED: 'success', FAILED: 'error', CANCELLED: 'neutral' };
const OO_TYPE_META = { REGULAR: { label: 'Regular', icon: 'r:RiTruckLine' }, TRANSFER: { label: 'Transfer', icon: 'r:RiArrowLeftRightLine' } };
/* Goods issue — fase picking & shipping memakai record yang sama */
const GI_LABEL = { NOT_PICKED: 'Not picked', PARTIALLY_PICKED: 'Partially picked', ALL_PICKED: 'All picked', READY_TO_PICKUP: 'Ready to pick up', SHIPPED: 'Shipped', IN_DELIVERY: 'In delivery', DELIVERED: 'Delivered', FAILED: 'Failed', CANCELLED: 'Cancelled' };
const GI_TONE = { NOT_PICKED: 'information', PARTIALLY_PICKED: 'away', ALL_PICKED: 'stable', READY_TO_PICKUP: 'verified', SHIPPED: 'feature', IN_DELIVERY: 'away', DELIVERED: 'success', FAILED: 'error', CANCELLED: 'neutral' };
const PICKING_STATUSES = ['NOT_PICKED', 'PARTIALLY_PICKED', 'ALL_PICKED'];
const SHIPPING_STATUSES = ['READY_TO_PICKUP', 'SHIPPED', 'IN_DELIVERY', 'DELIVERED', 'FAILED'];
/* Shipment (modul shipment existing, status v2) — ShipmentBadges.tsx */
const SH_LABEL = { CREATED: 'Created', AT_HUB: 'At hub', PARTIALLY_DISPATCHED: 'Partially dispatched', DISPATCHED: 'Dispatched', IN_DELIVERY: 'In delivery', IN_DISPUTE: 'In dispute', COMPLETED: 'Completed', RETURNED: 'Returned', CANCELLED: 'Cancelled', FAILED: 'Failed' };
const SH_TONE = { CREATED: 'information', AT_HUB: 'verified', PARTIALLY_DISPATCHED: 'stable', DISPATCHED: 'feature', IN_DELIVERY: 'away', IN_DISPUTE: 'highlighted', COMPLETED: 'success', RETURNED: 'error', CANCELLED: 'neutral', FAILED: 'error' };
const ITEM_LABEL = { CREATED: 'Created', HUB_SCANNED: 'Hub scanned', DISPATCHED: 'Dispatched', HANDOVER_SCANNED: 'Handover scanned', IN_DELIVERY: 'In delivery', COMPLETED: 'Completed', FAILED: 'Failed', CANCELLED: 'Cancelled' };
const ITEM_TONE = { CREATED: 'information', HUB_SCANNED: 'verified', DISPATCHED: 'feature', HANDOVER_SCANNED: 'stable', IN_DELIVERY: 'away', COMPLETED: 'success', FAILED: 'error', CANCELLED: 'neutral' };
/* Purchase order + inbound (receipt status) + goods receipt */
const PO_LABEL = { DRAFT: 'Draft', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled' };
const PO_TONE = { DRAFT: 'neutral', CONFIRMED: 'success', CANCELLED: 'faded' };
const PO_TYPES = ['REGULAR', 'TRANSFER', 'RETURN'];
const PO_TYPE_META = { REGULAR: { label: 'Regular', icon: 'r:RiStore2Line' }, TRANSFER: { label: 'Transfer', icon: 'r:RiArrowLeftRightLine' }, RETURN: { label: 'Return', icon: 'r:RiArrowGoBackLine' } };
const IR_LABEL = { SCHEDULED: 'Scheduled', PARTIAL_RECEIPT: 'Partial receipt', FINISHED: 'Finished' };
const IR_TONE = { SCHEDULED: 'information', PARTIAL_RECEIPT: 'away', FINISHED: 'success' };
const VENDOR_LABEL = { ACTIVE: 'Active', INACTIVE: 'Inactive' };
const VENDOR_TONE = { ACTIVE: 'success', INACTIVE: 'faded' };
const STORAGE_TYPE_LABEL = { STORAGE: 'Storage', QUARANTINE: 'Quarantine', STAGING: 'Staging' };
const STORAGE_LEVEL_LABEL = { LOCATION: 'Location', SECTION: 'Section', BIN: 'Bin' };
const LEVEL_RANK = { BIN: 0, SECTION: 1, LOCATION: 2 };
const UOMS = ['pcs', 'carton', 'box', 'pack', 'sack', 'bag', 'kg', 'liter', 'roll', 'pallet'];

const orBadge = (s) => badge(OR_LABEL[s] || s, OR_TONE[s]);
const giBadge = (s) => badge(GI_LABEL[s] || s, GI_TONE[s]);
const shBadge = (s) => badge(SH_LABEL[s] || s, SH_TONE[s]);
const itemBadge = (s) => badge(ITEM_LABEL[s] || s, ITEM_TONE[s], { dot: false });
const poBadge = (s) => badge(PO_LABEL[s] || s, PO_TONE[s]);
const irBadge = (s) => badge(IR_LABEL[s] || s, IR_TONE[s]);
const vendorBadge = (s) => badge(VENDOR_LABEL[s] || s, VENDOR_TONE[s]);
const poTypeTag = (t) => { const m = PO_TYPE_META[t || 'REGULAR']; return tag(m.label, t === 'REGULAR' || !t ? 'gray' : 'stroke', 'xs', m.icon); };

let db = null;
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* storage penuh/terblokir: tetap jalan in-memory */ } };

/* ── lookup ── */
const hub = (id) => db.hubs.find((h) => h.id === Number(id));
const client = (id) => db.clients.find((c) => c.id === Number(id));
const skuOf = (clientId, sku) => db.skus.find((s) => s.clientId === Number(clientId) && s.sku === sku);
const skuName = (clientId, sku) => (skuOf(clientId, sku) || { name: sku }).name;
const skuUom = (clientId, sku) => (skuOf(clientId, sku) || { uom: '—' }).uom;
const storage = (id) => db.storages.find((s) => s.id === id);
const outbound = (id) => db.outbounds.find((o) => o.id === id);
const gi = (id) => db.gis.find((g) => g.id === id);
const giOfOutbound = (o) => (o && o.giId ? gi(o.giId) : null);
const shipment = (id) => db.shipments.find((s) => s.id === id);
const po = (id) => db.pos.find((p) => p.id === id);
const gr = (id) => db.grs.find((g) => g.id === id);
const vendor = (id) => db.vendors.find((v) => v.id === id);
const actor = () => db.ui.actor;

function nextSeq(key) {
  db.seq[key] = (db.seq[key] || 0) + 1;
  return db.seq[key];
}
const docCode = (prefix) => `${prefix}${yymmdd()}${String(nextSeq(prefix)).padStart(5, '0')}`;
/** Error validasi bergaya server (422): pesan ringkas + daftar per field. */
const validationError = (errs) => new AppError(errs.length > 1 ? `${errs.length} isian perlu diperbaiki` : errs[0].message, errs);

/* ── storage lineage: stok boleh menempel di level mana pun (Location, Section, atau Bin) ── */
function lineage(st) {
  const parts = st.path.split('.');
  const byPath = (p) => db.storages.find((s) => s.hubId === st.hubId && s.path === p);
  const location = byPath(parts[0]);
  const section = parts.length >= 2 ? byPath(parts.slice(0, 2).join('.')) : null;
  return { location, section, type: location ? location.type : null };
}
const storagePath = (st) => {
  const l = lineage(st);
  const names = [l.location && l.location.name, l.section && l.section.name, st.category === 'BIN' ? st.name : null].filter(Boolean);
  return names.filter((x, i) => names.indexOf(x) === i).join(' / ');
};
const storageLabel = (id) => { const st = storage(id); return st ? storagePath(st) : '—'; };
/** "LOC-02 · Zona B (Location)", "BIN-Q1 · Karantina / Area retur / Slot Q1 (Quarantine)". */
const storageOptionLabel = (st) => {
  const t = lineage(st).type;
  const tags = [st.category !== 'BIN' ? STORAGE_LEVEL_LABEL[st.category] : null, t !== 'STORAGE' ? STORAGE_TYPE_LABEL[t] : null].filter(Boolean);
  return `${st.code} · ${storagePath(st)}${tags.length ? ` (${tags.join(', ')})` : ''}`;
};
const storageTreeSort = (a, b) => a.hubId - b.hubId || a.path.localeCompare(b.path, undefined, { numeric: true });
const activeStoragesOf = (hubId) => db.storages.filter((s) => s.hubId === Number(hubId) && s.status === 'ACTIVE').sort(storageTreeSort);
const binsOf = (hubId, types) =>
  db.storages.filter((s) => s.hubId === Number(hubId) && s.category === 'BIN' && s.status === 'ACTIVE' && (!types || types.includes(lineage(s).type))).sort(storageTreeSort);

/* ── stock ── */
const stockRows = (hubId, clientId, sku) =>
  db.stocks.filter((s) => (hubId == null || s.hubId === Number(hubId)) && (clientId == null || s.clientId === Number(clientId)) && (!sku || s.sku === sku));
// Hanya storage ACTIVE di bawah lokasi bertipe STORAGE yang ikut alokasi (karantina & staging dilewati).
const allocatable = (s) => {
  const st = storage(s.storageId);
  return !!st && st.status === 'ACTIVE' && lineage(st).type === 'STORAGE' && s.onHand - s.reserved > 0;
};
const availableFor = (hubId, clientId, sku) => sum(stockRows(hubId, clientId, sku).filter(allocatable).map((s) => s.onHand - s.reserved));
// FEFO: expiry terdekat dulu (tanpa expiry paling akhir); expiry sama → bin dulu, lalu section, lalu location.
const fefoSort = (a, b) => {
  const ea = a.expiry || '9999-12-31';
  const eb = b.expiry || '9999-12-31';
  if (ea !== eb) return ea < eb ? -1 : 1;
  const sa = storage(a.storageId);
  const sb = storage(b.storageId);
  const ra = sa ? LEVEL_RANK[sa.category] : 9;
  const rb = sb ? LEVEL_RANK[sb.category] : 9;
  if (ra !== rb) return ra - rb;
  const p = (sa ? sa.path : '').localeCompare(sb ? sb.path : '', undefined, { numeric: true });
  return p || a.lot.localeCompare(b.lot);
};
function addMovement(m) {
  db.movements.unshift({ id: uid('mv'), at: nowIso(), by: actor(), ...m });
}

/* ══ Master: vendor (global, dipakai PO tipe Regular) ══ */
const PHONE_RE = /^(\+62|62|0)8[0-9]{7,12}$/;
const PHONE_ANY_RE = /^(\+62|62|0)[0-9]{7,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normPhone = (v) => String(v || '').replace(/[\s\-().]/g, '');
const VENDOR_FIELDS = ['name', 'phone', 'email', 'address', 'picName', 'picPhone', 'npwp'];
function validateVendor(p, selfId) {
  const errs = [];
  const add = (field, message) => errs.push({ field, message });
  const name = String(p.name || '').trim();
  if (!name) add('name', 'Nama vendor wajib diisi.');
  else if (name.length > 120) add('name', 'Nama vendor maksimal 120 karakter.');
  else {
    const dup = db.vendors.find((v) => v.id !== selfId && v.name.trim().toLowerCase() === name.toLowerCase());
    if (dup) add('name', `Nama vendor sudah dipakai ${dup.code} (VENDOR_NAME_TAKEN).`);
  }
  if (String(p.phone || '').trim() && !PHONE_ANY_RE.test(normPhone(p.phone))) add('phone', 'Telepon harus nomor Indonesia (021… / 08… / +62…).');
  if (String(p.email || '').trim() && !EMAIL_RE.test(String(p.email).trim())) add('email', 'Format email tidak valid.');
  if (String(p.address || '').trim().length > 500) add('address', 'Alamat maksimal 500 karakter.');
  if (String(p.picName || '').trim().length > 120) add('picName', 'Nama PIC maksimal 120 karakter.');
  if (String(p.picPhone || '').trim() && !PHONE_ANY_RE.test(normPhone(p.picPhone))) add('picPhone', 'Telepon PIC harus nomor Indonesia (08… / +62…).');
  const npwp = String(p.npwp || '').replace(/[.\-\s]/g, '');
  if (npwp && !/^\d{15}(\d)?$/.test(npwp)) add('npwp', 'NPWP harus 15 atau 16 digit angka.');
  return errs;
}
const vendorPayload = (p) => ({
  name: String(p.name || '').trim(), phone: normPhone(p.phone), email: String(p.email || '').trim(), address: String(p.address || '').trim(),
  picName: String(p.picName || '').trim(), picPhone: normPhone(p.picPhone), npwp: String(p.npwp || '').replace(/[.\-\s]/g, ''),
});
function createVendor(p) {
  const errs = validateVendor(p, null);
  if (errs.length) throw validationError(errs);
  const v = { id: uid('ven'), code: docCode('VEN'), ...vendorPayload(p), status: 'ACTIVE', createdAt: nowIso(), createdBy: actor(), updatedAt: nowIso() };
  db.vendors.unshift(v);
  return v;
}
function updateVendor(id, p) {
  const v = vendor(id);
  if (!v) throw new AppError('Vendor tidak ditemukan.');
  const errs = validateVendor(p, id);
  if (errs.length) throw validationError(errs);
  Object.assign(v, vendorPayload(p), { updatedAt: nowIso() });
  return v;
}
function setVendorStatus(id, status) {
  const v = vendor(id);
  if (!v) throw new AppError('Vendor tidak ditemukan.');
  v.status = status;
  v.updatedAt = nowIso();
  return v;
}
const poCountOfVendor = (id) => db.pos.filter((x) => x.vendorId === id).length;

/* ══ Master: SKU katalog per client (POST /skus) ══ */
function createSku(p) {
  const errs = [];
  const add = (field, message) => errs.push({ field, message });
  const c = client(p.clientId);
  const code = String(p.sku || '').trim().toUpperCase();
  if (!c) add('client', 'Client wajib dipilih.');
  if (!code) add('sku', 'SKU wajib diisi.');
  else if (!/^[A-Z0-9][A-Z0-9._-]{1,47}$/.test(code)) add('sku', 'SKU hanya huruf, angka, titik, strip (2–48 karakter).');
  else if (c && skuOf(c.id, code)) add('sku', `SKU ${code} sudah ada di katalog ${c.name}.`);
  if (!String(p.name || '').trim()) add('name', 'Nama item wajib diisi.');
  if (!UOMS.includes(p.uom)) add('uom', 'UoM wajib dipilih.');
  const nums = { lengthCm: toNum(p.lengthCm), widthCm: toNum(p.widthCm), heightCm: toNum(p.heightCm), weightKg: toNum(p.weightKg) };
  if (Object.values(nums).some((n) => n !== null && !(n > 0))) add('dims', 'Dimensi & berat harus angka > 0.');
  if (errs.length) throw validationError(errs);
  const k = { clientId: c.id, sku: code, name: String(p.name).trim(), uom: p.uom, ...nums, expiry: !!p.expiry, createdAt: nowIso(), createdBy: actor() };
  db.skus.push(k);
  return k;
}

/* ══ Outbound request intake: form manual, upload CSV, client API (next phase) ══
   Tiga pintu masuk memakai validasi yang sama (validateOutbound) dan idempotency yang sama
   (client + external ID). Order lahir OPEN tanpa reserve; reserve terjadi saat Create picking order. */
const OR_SOURCE_LABEL = { MANUAL: 'Manual', CSV: 'CSV upload', CLIENT_API: 'Client API' };
const SERVICE_TYPES = ['SAME_DAY', 'NEXT_DAY'];
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const todayIso = () => isoDate(nowMs());
/** Field validator → langkah wizard pemiliknya (Order · Penerima & tujuan · Produk · Review). */
const OUTBOUND_FIELD_STEP = { type: 1, hub: 1, dest_hub: 1, client: 1, external_id: 1, expected_delivery_date: 1, service_type: 1, notes: 1, recipient_name: 2, recipient_phone: 2, destination_address: 2, latitude: 2, longitude: 2, destination_notes: 2, lines: 3, sku: 3, qty: 3 };

function validateOutbound(p) {
  const errs = [];
  const add = (field, message, line) => errs.push({ field, message, line });
  const type = p.type || 'REGULAR';
  const c = client(Number(p.clientId));
  const h = hub(Number(p.hubId));
  if (!OO_TYPE_META[type]) add('type', 'Tipe harus REGULAR atau TRANSFER.');
  if (!h) add('hub', 'Hub wajib dipilih.');
  else if (!db.storages.some((s) => s.hubId === h.id)) add('hub', `${h.name} belum punya storage tree (HUB_NOT_ENABLED).`);
  if (type === 'TRANSFER') {
    const dh = hub(Number(p.destHubId));
    if (!dh) add('dest_hub', 'Hub tujuan wajib dipilih untuk outbound transfer.');
    else if (h && dh.id === h.id) add('dest_hub', 'Hub tujuan harus beda dari hub asal.');
    else if (!db.storages.some((s) => s.hubId === dh.id)) add('dest_hub', `${dh.name} belum punya storage tree — PO transfer tidak bisa diterima.`);
  }
  if (!c) add('client', 'Client wajib dipilih.');
  const ext = String(p.externalId || '').trim();
  if (ext.length > 64) add('external_id', 'External ID maksimal 64 karakter.');
  const r = p.recipient || {};
  const d = p.destination || {};
  if (!String(r.name || '').trim()) add('recipient_name', 'Nama penerima wajib diisi.');
  else if (String(r.name).trim().length > 120) add('recipient_name', 'Nama penerima maksimal 120 karakter.');
  if (!PHONE_RE.test(normPhone(r.phone))) add('recipient_phone', 'Telepon harus nomor HP Indonesia (08… atau +628…).');
  if (!String(d.address || '').trim()) add('destination_address', 'Alamat tujuan wajib diisi.');
  const lat = toNum(d.lat);
  const lng = toNum(d.lng);
  if (lat === null || Number.isNaN(lat) || lat < -11.5 || lat > 6.5) add('latitude', 'Latitude harus angka di wilayah Indonesia (-11,5 s/d 6,5).');
  if (lng === null || Number.isNaN(lng) || lng < 94.5 || lng > 141.5) add('longitude', 'Longitude harus angka di wilayah Indonesia (94,5 s/d 141,5).');
  if (!p.expectedDate) add('expected_delivery_date', 'Expected delivery wajib diisi.');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(p.expectedDate) || Number.isNaN(Date.parse(p.expectedDate))) add('expected_delivery_date', 'Format tanggal harus YYYY-MM-DD.');
  else if (p.expectedDate < todayIso()) add('expected_delivery_date', 'Expected delivery tidak boleh di masa lalu.');
  if (p.serviceType && !SERVICE_TYPES.includes(p.serviceType)) add('service_type', `Service type harus ${SERVICE_TYPES.join(' atau ')}.`);
  const lines = p.lines || [];
  if (!lines.length) add('lines', 'Minimal 1 baris produk.');
  const seen = new Set();
  lines.forEach((l, i) => {
    const pre = lines.length > 1 ? `Baris produk ${i + 1}: ` : '';
    if (!l.sku) add('sku', `${pre}SKU wajib dipilih.`, i);
    else if (c && !skuOf(c.id, l.sku)) add('sku', `${pre}SKU ${l.sku} tidak ada di katalog ${c.name} (SKU_NOT_IN_CATALOG).`, i);
    else if (seen.has(l.sku)) add('sku', `${pre}SKU ${l.sku} muncul dua kali dalam satu order.`, i);
    if (l.sku) seen.add(l.sku);
    if (!(Number(l.qty) > 0)) add('qty', `${pre}Qty harus lebih dari 0.`, i);
  });
  return errs.map((e) => ({ ...e, step: OUTBOUND_FIELD_STEP[e.field] || 1 }));
}
// Peringatan non-blocking: order tetap lahir OPEN, picking yang akan gagal bila stok kurang.
const stockShortages = (hubId, clientId, lines) => {
  const need = {};
  (lines || []).forEach((l) => { if (l.sku && Number(l.qty) > 0) need[l.sku] = (need[l.sku] || 0) + Number(l.qty); });
  return Object.entries(need).map(([sku, requested]) => ({ sku, requested, available: availableFor(Number(hubId), Number(clientId), sku) })).filter((x) => x.requested > x.available);
};

function createOutbound(p, source, meta) {
  const m = meta || {};
  const c = client(Number(p.clientId));
  const ext = String(p.externalId || '').trim();
  if (c && ext) {
    const existing = db.outbounds.find((o) => o.clientId === c.id && o.externalId === ext);
    if (existing) return { status: 'EXISTS', order: existing };
  }
  if (source !== 'MANUAL' && !ext) throw new AppError('External ID wajib untuk order dari CSV / API (kunci idempotency).', [{ field: 'external_id', message: 'External ID wajib.', step: 1 }]);
  // CSV & API hanya membuat order REGULAR.
  const type = source === 'MANUAL' && p.type === 'TRANSFER' ? 'TRANSFER' : 'REGULAR';
  const errs = validateOutbound({ ...p, type });
  if (errs.length) throw validationError(errs);
  const code = docCode('OO');
  const o = {
    id: uid('ob'),
    code,
    type,
    destHubId: type === 'TRANSFER' ? Number(p.destHubId) : null,
    transferPoId: null,
    externalId: ext || code,
    externalIdAuto: !ext,
    source,
    uploadId: m.uploadId || null,
    clientId: c.id,
    hubId: Number(p.hubId),
    method: 'DELIVERY',
    serviceType: p.serviceType || 'SAME_DAY',
    orderDate: nowIso(),
    expectedDelivery: new Date(`${p.expectedDate}T10:00:00+07:00`).toISOString(),
    recipient: { name: String(p.recipient.name).trim(), phone: normPhone(p.recipient.phone) },
    destination: { address: String(p.destination.address).trim(), lat: toNum(p.destination.lat), lng: toNum(p.destination.lng), notes: String(p.destination.notes || '').trim() },
    notes: String(p.notes || '').trim(),
    lines: p.lines.map((l) => ({ sku: l.sku, qty: Number(l.qty) })),
    status: 'OPEN',
    giId: null,
    createdAt: nowIso(),
    createdBy: source === 'CLIENT_API' ? `client:${c.code}` : actor(),
    cancelledAt: null,
    cancelReason: null,
    events: [],
  };
  const first = source === 'CLIENT_API'
    ? { title: 'Order diterima dari client API', note: `POST /v1/integration/outbound-orders · externalId ${esc(o.externalId)}`, actor: 'CLIENT' }
    : source === 'CSV'
      ? { title: 'Order dibuat dari upload CSV', note: `${esc(m.uploadCode)} · ${esc(m.fileName)} · baris ${m.rows.join(', ')}`, actor: actor() }
      : { title: 'Order dibuat manual', note: `Form Create outbound request${type === 'TRANSFER' ? ` · transfer ${esc(hub(o.hubId).code)} → ${esc(hub(o.destHubId).code)}` : ''}${o.externalIdAuto ? ' · tanpa ref client (external ID = request ID)' : ` · ref client ${esc(o.externalId)}`}`, actor: actor() };
  o.events.push({ at: nowIso(), status: 'OPEN', ...first });
  db.outbounds.unshift(o);
  return { status: 'CREATED', order: o };
}
// Fase berikutnya: endpoint client memakai API key yang sama; tetap lewat createOutbound.
function createOutboundFromApi(p) {
  const exp = p.expectedDelivery ? isoDate(Date.parse(p.expectedDelivery)) : isoDate(nowMs() + 2 * DAY);
  return createOutbound({ ...p, expectedDate: p.expectedDate || exp }, 'CLIENT_API');
}

/* ── CSV: template, parse, preview (dry-run), commit — pola sama dengan import Shipments. Selalu REGULAR. ── */
const CSV_COLUMNS = ['external_id', 'recipient_name', 'recipient_phone', 'destination_address', 'latitude', 'longitude', 'destination_notes', 'expected_delivery_date', 'service_type', 'sku', 'qty', 'notes'];
const CSV_REQUIRED = ['external_id', 'recipient_name', 'recipient_phone', 'destination_address', 'latitude', 'longitude', 'expected_delivery_date', 'sku', 'qty'];
const CSV_HEADER_FIELDS = ['recipient_name', 'recipient_phone', 'destination_address', 'latitude', 'longitude', 'destination_notes', 'expected_delivery_date', 'service_type', 'notes'];
const CSV_MAX_ROWS = 1000;
// safe = untuk file yang diunduh dari data user (error CSV): sel diawali = + - @ diberi prefix ' (cegah formula injection).
const csvCell = (v, safe) => { const raw = String(v == null ? '' : v); const s = safe && /^[=+\-@]/.test(raw) ? `'${raw}` : raw; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (rows, safe) => rows.map((r) => r.map((c) => csvCell(c, safe)).join(',')).join('\n') + '\n';
function parseCsv(text) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  const src = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (q) {
      if (ch === '"') { if (src[i + 1] === '"') { f += '"'; i += 1; } else q = false; } else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (ch !== '\r') f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
}
const extPrefix = (c) => (c.code === 'FOR' ? 'FORE-SO' : c.code === 'SRX' ? 'SRX-ORD' : `${c.code}-SO`);
function csvTemplate(clientId) {
  const c = client(Number(clientId)) || db.clients[0];
  const skus = db.skus.filter((k) => k.clientId === c.id);
  const d = (DESTS[c.id] || [])[0] || { name: 'Nama penerima', phone: '+6281200000000', address: 'Alamat lengkap', lat: -6.25, lng: 106.81 };
  const day = isoDate(nowMs() + 2 * DAY);
  return toCsv([
    CSV_COLUMNS,
    [`${extPrefix(c)}-0001`, d.name, d.phone, d.address, d.lat, d.lng, 'Titip ke kasir', day, 'SAME_DAY', skus[0].sku, 10, 'Contoh: satu baris = satu SKU'],
    [`${extPrefix(c)}-0001`, d.name, d.phone, d.address, d.lat, d.lng, 'Titip ke kasir', day, 'SAME_DAY', (skus[1] || skus[0]).sku, 5, 'Contoh: satu baris = satu SKU'],
  ]);
}
function csvSample(clientId, kind) {
  const c = client(Number(clientId));
  const skus = db.skus.filter((k) => k.clientId === c.id).map((k) => k.sku);
  const ds = DESTS[c.id];
  const day = isoDate(nowMs() + DAY);
  const n = () => 70000 + Math.floor(Math.random() * 9000);
  const pre = extPrefix(c);
  const row = (ext, d, sku, qty, over) => { const r = { ext, name: d.name, phone: d.phone, addr: d.address, lat: d.lat, lng: d.lng, dn: '', day, svc: 'SAME_DAY', sku, qty, notes: '', ...(over || {}) }; return [r.ext, r.name, r.phone, r.addr, r.lat, r.lng, r.dn, r.day, r.svc, r.sku, r.qty, r.notes]; };
  const a = `${pre}-${n()}`;
  const b = `${pre}-${n()}`;
  const e3 = `${pre}-${n()}`;
  const old = db.outbounds.find((o) => o.clientId === c.id && !o.externalIdAuto && o.source !== 'MANUAL');
  const rows = [CSV_COLUMNS,
    row(a, ds[0], skus[0], 4), row(a, ds[0], skus[1] || skus[0], 2),
    row(b, ds[1 % ds.length], skus[0], 3),
  ];
  if (old) rows.push(row(old.externalId, ds[0], skus[0], 5));
  if (kind === 'error') {
    rows.push(row(e3, ds[ds.length - 1], `${skus[0]}-XL`, 4));
    rows.push(row(e3, ds[ds.length - 1], skus[0], 0, { lat: 'abc' }));
    rows.push(row(b, ds[0], skus[1] || skus[0], 3));
    rows.push(row(`${pre}-${n()}`, ds[0], skus[0], 2, { phone: '12345', day: isoDate(nowMs() - 2 * DAY) }));
  } else {
    rows.push(row(e3, ds[ds.length - 1], skus[skus.length - 1], 2, { dn: 'Bongkar di pintu belakang' }));
  }
  return toCsv(rows);
}
function previewOutboundCsv(inp) {
  const res = { fileError: null, ignoredColumns: [], orders: [], errors: [], warnings: [], summary: { rows: 0, orders: 0, toCreate: 0, existing: 0, errors: 0, warnings: 0 } };
  const c = client(Number(inp.clientId));
  const h = hub(Number(inp.hubId));
  if (!c || !h) { res.fileError = 'Pilih hub dan client dulu.'; return res; }
  const rows = parseCsv(inp.text);
  if (!rows.length) { res.fileError = 'File kosong.'; return res; }
  const header = rows[0].map((x) => String(x).trim().toLowerCase());
  const missing = CSV_REQUIRED.filter((k) => !header.includes(k));
  if (missing.length) { res.fileError = `Kolom wajib tidak ditemukan: ${missing.join(', ')}. Pakai template terbaru.`; return res; }
  res.ignoredColumns = header.filter((k) => k && !CSV_COLUMNS.includes(k));
  const body = rows.slice(1);
  if (body.length > CSV_MAX_ROWS) { res.fileError = `Maksimal ${CSV_MAX_ROWS} baris per file (file ini ${body.length}). Pecah jadi beberapa file.`; return res; }
  res.summary.rows = body.length;
  const err = (row, field, value, message) => res.errors.push({ row, field, value: value == null ? '' : String(value), message });
  const groups = new Map();
  body.forEach((r, i) => {
    const rec = { rowNo: i + 2 };
    CSV_COLUMNS.forEach((k) => { const at = header.indexOf(k); rec[k] = at >= 0 ? String(r[at] ?? '').trim() : ''; });
    if (!rec.external_id) { err(rec.rowNo, 'external_id', '', 'Wajib diisi — baris dengan external_id sama digabung jadi satu order.'); return; }
    if (!groups.has(rec.external_id)) groups.set(rec.external_id, []);
    groups.get(rec.external_id).push(rec);
  });
  groups.forEach((recs, ext) => {
    const first = recs[0];
    const before = res.errors.length;
    const ord = { externalId: ext, rows: recs.map((r) => r.rowNo), recipient: first.recipient_name, address: first.destination_address, lineCount: recs.length, qty: sum(recs.map((r) => Number(r.qty) || 0)), status: 'NEW', existingCode: null, payload: null, errorCount: 0 };
    recs.slice(1).forEach((r) => {
      const diff = CSV_HEADER_FIELDS.filter((k) => r[k] !== first[k]);
      if (diff.length) err(r.rowNo, diff.join(', '), diff.map((k) => r[k]).join(' | '), `Data order beda dengan baris ${first.rowNo} (external_id sama harus punya penerima, alamat, dan tanggal yang sama).`);
    });
    const existing = db.outbounds.find((o) => o.clientId === c.id && o.externalId === ext);
    if (existing) { ord.status = 'EXISTS'; ord.existingCode = existing.code; }
    else {
      const p = {
        type: 'REGULAR', hubId: h.id, clientId: c.id, externalId: ext,
        recipient: { name: first.recipient_name, phone: first.recipient_phone },
        destination: { address: first.destination_address, lat: first.latitude, lng: first.longitude, notes: first.destination_notes },
        expectedDate: first.expected_delivery_date, serviceType: first.service_type || 'SAME_DAY', notes: first.notes,
        lines: recs.map((r) => ({ sku: r.sku, qty: r.qty })),
      };
      validateOutbound(p).forEach((e) => {
        const rec = e.line != null ? recs[e.line] : first;
        const value = { hub: h.name, client: c.name, lines: '' }[e.field] ?? rec[e.field];
        err(rec.rowNo, e.field, value, e.message.replace(/^Baris produk \d+: /, ''));
      });
      ord.payload = p;
    }
    ord.errorCount = res.errors.length - before;
    if (ord.errorCount) ord.status = 'ERROR';
    res.orders.push(ord);
  });
  res.errors.sort((x, y) => x.row - y.row);
  res.warnings = stockShortages(h.id, c.id, res.orders.filter((o) => o.status === 'NEW').flatMap((o) => o.payload.lines));
  res.summary = { rows: body.length, orders: res.orders.length, toCreate: res.orders.filter((o) => o.status === 'NEW').length, existing: res.orders.filter((o) => o.status === 'EXISTS').length, errors: res.errors.length, warnings: res.warnings.length };
  return res;
}
// Commit memvalidasi ulang file yang sama (seperti import:commit Shipments) — all-or-nothing untuk error.
function commitOutboundCsv(inp) {
  const pv = previewOutboundCsv(inp);
  if (pv.fileError) throw new AppError(pv.fileError);
  if (pv.summary.errors) throw new AppError(`File masih punya ${pv.summary.errors} error. Perbaiki lalu upload ulang.`);
  const fresh = pv.orders.filter((o) => o.status === 'NEW');
  if (!fresh.length) throw new AppError('Tidak ada order baru — semua external_id di file ini sudah ada.');
  const up = { id: uid('up'), code: docCode('OOU'), hubId: Number(inp.hubId), clientId: Number(inp.clientId), fileName: inp.fileName || 'upload.csv', totalRows: pv.summary.rows, created: 0, skipped: pv.summary.existing, orderIds: [], createdBy: actor(), createdAt: nowIso() };
  db.uploads.unshift(up);
  fresh.forEach((o) => {
    const r = createOutbound(o.payload, 'CSV', { uploadId: up.id, uploadCode: up.code, fileName: up.fileName, rows: o.rows });
    up.created += 1;
    up.orderIds.push(r.order.id);
  });
  return up;
}
const orEvent = (o, status, title, note, who) => {
  if (status) o.status = status;
  o.events.push({ at: nowIso(), status: o.status, title, note, actor: who || actor() });
};

/* ── create picking order: FEFO reserve lintas level storage, all-or-nothing ── */
function createPickingOrder(orderId) {
  const o = outbound(orderId);
  if (!o || o.status !== 'OPEN') throw new AppError('Picking order hanya bisa dibuat untuk outbound request berstatus Open.');
  const plan = [];
  const shortfalls = [];
  o.lines.forEach((line) => {
    let remaining = line.qty;
    const candidates = stockRows(o.hubId, o.clientId, line.sku).filter(allocatable).sort(fefoSort);
    candidates.forEach((s) => {
      if (remaining <= 0) return;
      const take = Math.min(s.onHand - s.reserved, remaining);
      if (take > 0) { plan.push({ stock: s, qty: take, line }); remaining -= take; }
    });
    if (remaining > 0) shortfalls.push({ sku: line.sku, requested: line.qty, available: line.qty - remaining, shortfall: remaining });
  });
  if (shortfalls.length) {
    throw new AppError('Stok available tidak cukup — tidak ada yang di-reserve (INSUFFICIENT_STOCK).', shortfalls);
  }
  const g = {
    id: uid('gi'),
    code: docCode('GI'),
    outboundId: o.id,
    clientId: o.clientId,
    hubId: o.hubId,
    status: 'NOT_PICKED',
    pickerName: null,
    lines: plan.map((a) => {
      a.stock.reserved += a.qty;
      return { id: uid('gil'), sku: a.stock.sku, name: skuName(o.clientId, a.stock.sku), uom: skuUom(o.clientId, a.stock.sku), stockId: a.stock.id, storageId: a.stock.storageId, lot: a.stock.lot, expiry: a.stock.expiry, qtyReserved: a.qty, qtyPicked: 0 };
    }),
    suratJalan: null,
    createdAt: nowIso(),
    createdBy: actor(),
    readyAt: null,
    shippedAt: null,
    shipmentId: null,
    waybill: null,
  };
  db.gis.unshift(g);
  o.giId = g.id;
  orEvent(o, 'PREPARING', 'Picking order dibuat', `${g.code} · stok di-reserve FEFO (${g.lines.length} alokasi storage/lot)`);
  return g;
}
const recomputePicking = (g) => {
  if (!PICKING_STATUSES.includes(g.status)) return;
  const picked = sum(g.lines.map((l) => l.qtyPicked));
  const all = g.lines.every((l) => l.qtyPicked >= l.qtyReserved);
  g.status = all ? 'ALL_PICKED' : picked > 0 ? 'PARTIALLY_PICKED' : 'NOT_PICKED';
};
function assignPicker(giId, name) {
  const g = gi(giId);
  if (!g || !PICKING_STATUSES.includes(g.status)) throw new AppError('Picker hanya bisa diubah selama fase picking.');
  g.pickerName = name || null;
}
function setPicked(giId, lineId, qty) {
  const g = gi(giId);
  if (!g || !PICKING_STATUSES.includes(g.status)) throw new AppError('Qty picked hanya bisa diubah selama fase picking.');
  const l = g.lines.find((x) => x.id === lineId);
  if (!l) throw new AppError('Baris picking tidak ditemukan.');
  const n = Number(qty);
  if (!Number.isFinite(n) || n < 0 || n > l.qtyReserved) {
    l.qtyPicked = Math.max(0, Math.min(Number.isFinite(n) ? n : 0, l.qtyReserved));
    recomputePicking(g);
    throw new AppError(`Qty picked harus 0–${fmtQty(l.qtyReserved)} (QTY_PICKED_OUT_OF_RANGE).`);
  }
  l.qtyPicked = n;
  recomputePicking(g);
}
function pickAll(giId) {
  const g = gi(giId);
  if (!g || !PICKING_STATUSES.includes(g.status)) throw new AppError('Pick hanya bisa selama fase picking.');
  g.lines.forEach((l) => { l.qtyPicked = l.qtyReserved; });
  recomputePicking(g);
}
function releaseReserve(g) {
  g.lines.forEach((l) => {
    const s = db.stocks.find((x) => x.id === l.stockId);
    if (s) s.reserved = Math.max(0, s.reserved - l.qtyReserved);
  });
}
function deletePicking(giId) {
  const g = gi(giId);
  if (!g || (!PICKING_STATUSES.includes(g.status) && g.status !== 'READY_TO_PICKUP')) throw new AppError('Picking yang sudah di-ship tidak bisa dihapus.');
  releaseReserve(g);
  g.status = 'CANCELLED';
  const o = outbound(g.outboundId);
  o.giId = null;
  orEvent(o, 'OPEN', 'Picking order dihapus', `${g.code} · reserve dilepas, order kembali Open`);
}
function readyToPickup(giId) {
  const g = gi(giId);
  if (!g || !PICKING_STATUSES.includes(g.status)) throw new AppError('Ready to pick up hanya dari fase picking.');
  if (!g.pickerName) throw new AppError('Pilih picker dulu sebelum Ready to pick up (PICKER_REQUIRED).');
  if (g.status !== 'ALL_PICKED') throw new AppError('Semua item harus ter-pick sesuai alokasi — status All picked (PICKING_INCOMPLETE).');
  const h = hub(g.hubId);
  const ym = yymm();
  g.status = 'READY_TO_PICKUP';
  g.readyAt = nowIso();
  g.readyBy = actor();
  g.suratJalan = `SJ/${h.code}/${ym}/${String(nextSeq(`SJ:${h.id}:${ym}`)).padStart(4, '0')}`;
  const o = outbound(g.outboundId);
  orEvent(o, 'READY_TO_PICKUP', 'Picking selesai · Ready to pick up', `${g.code} · surat jalan ${g.suratJalan} · picker ${esc(g.pickerName)}`);
}

/* ══════════════════════════════════════════════════════════════════════════
   Modular tanpa event: WMS memanggil INTERFACE, bukan module Shipments.
   - WMS mendefinisikan port FulfillmentGateway (apa yang WMS butuh dari pengirim).
   - Adapter (module warehouse-shipment-adapter) mengimplementasikannya dengan repository Shipments,
     di transaksi yang sama dengan potong stok → submit shipping sukses = AWB pasti ada.
   - Arah balik: Shipments memanggil hook status (interface generik milik Shipments); adapter
     meneruskan ke port WMS WarehouseFulfillmentPort.applyUpdates().
   ══════════════════════════════════════════════════════════════════════════ */
function logCall(call, from, to, data) {
  db.bus.unshift({ id: uid('call'), call, from, to, at: nowIso(), data });
}
const busOf = (giId) => db.bus.filter((e) => e.data.goodsIssueId === giId).slice().reverse();

/* 1 ── WMS module: submit shipping. Hanya kenal port FulfillmentGateway. Satu transaksi:
       potong stok → ledger → AWB → (TRANSFER) PO transfer di hub tujuan. */
function submitShipping(giId) {
  const g = gi(giId);
  if (!g || g.status !== 'READY_TO_PICKUP') throw new AppError('Hanya shipping berstatus Ready to pick up yang bisa di-submit (INVALID_STATUS_TRANSITION).');
  const o = outbound(g.outboundId);
  const c = client(g.clientId);
  const h = hub(g.hubId);
  g.lines.forEach((l) => {
    const s = db.stocks.find((x) => x.id === l.stockId);
    s.onHand -= l.qtyPicked;
    s.reserved = Math.max(0, s.reserved - l.qtyReserved);
    addMovement({ hubId: g.hubId, clientId: g.clientId, sku: l.sku, lot: l.lot, type: o.type === 'TRANSFER' ? 'TRANSFER_OUT' : 'OUTBOUND', refType: 'GOODS_ISSUE', refCode: g.code, storageId: l.storageId, storageCode: storage(l.storageId).code, qtyDelta: -l.qtyPicked });
  });
  const ref = fulfillmentGateway.createShipment({
    outboundOrderId: o.id, goodsIssueId: g.id, outboundCode: o.code, externalId: o.externalId, suratJalanNo: g.suratJalan,
    client: { id: c.id, name: c.name }, hub: { id: h.id, name: h.name, code: h.code }, serviceType: o.serviceType,
    recipient: o.recipient, destination: o.destination,
    lines: o.lines.map((line) => { const k = skuOf(c.id, line.sku) || {}; return { sku: line.sku, itemName: k.name || line.sku, uomName: k.uom || 'pcs', qty: line.qty, weightKg: k.weightKg || null }; }),
  });
  g.status = 'SHIPPED';
  g.shippedAt = nowIso();
  g.shipmentId = ref.shipmentId;
  g.waybill = ref.waybill;
  orEvent(o, 'SHIPPED', 'Shipping di-submit', `${g.code} · stok dipotong · AWB ${ref.waybill} dibuat lewat FulfillmentGateway (satu transaksi)`);
  const transferPo = o.type === 'TRANSFER' ? createTransferPO(o, g) : null;
  return { shipment: shipment(g.shipmentId), transferPo };
}
/* PO transfer lahir otomatis di hub tujuan: Confirmed, receipt Scheduled, baris = qty yang dikirim. */
function createTransferPO(o, g) {
  const dest = hub(o.destHubId);
  const src = hub(o.hubId);
  const qtyBySku = {};
  g.lines.forEach((l) => { qtyBySku[l.sku] = (qtyBySku[l.sku] || 0) + l.qtyPicked; });
  const x = {
    id: uid('po'), code: docCode('PO'), type: 'TRANSFER', clientId: o.clientId, hubId: dest.id, vendorId: null, returnedFrom: null, sourceHubId: src.id, transferOutboundId: o.id,
    supplier: src.name, estArrival: new Date(nowMs() + (o.serviceType === 'NEXT_DAY' ? DAY : 6 * HOUR)).toISOString(),
    status: 'CONFIRMED', grStatus: 'SCHEDULED', lines: Object.entries(qtyBySku).map(([sku, qty]) => ({ sku, qty, received: 0 })),
    notes: `Transfer dari ${src.name} · ${o.code} · surat jalan ${g.suratJalan}`, createdAt: nowIso(), createdBy: 'SYSTEM', confirmedAt: nowIso(), confirmedBy: 'SYSTEM', cancelledAt: null, cancelReason: null,
  };
  db.pos.unshift(x);
  o.transferPoId = x.id;
  orEvent(o, null, `PO transfer ${x.code} terbit di ${dest.name}`, `Status Confirmed · receipt Scheduled · ${x.lines.length} SKU / ${fmtQty(sum(x.lines.map((l) => l.qty)))} unit menunggu goods receipt di ${esc(dest.code)}`, 'SYSTEM');
  return x;
}

/* 2 ── warehouse-shipment-adapter: implementasi port WMS memakai repository Shipments */
const fulfillmentGateway = {
  createShipment(d) {
    const c = client(d.client.id);
    const h = hub(d.hub.id);
    const waybill = `DL${c.code}${yymmdd()}${String(Math.floor(Math.random() * 90) + 10)}${randAlnum(4)}`;
    const items = d.lines.map((line, i) => ({ id: uid('it'), code: `${waybill}-${pad2(i + 1)}`, name: line.itemName, sku: line.sku, invoice: d.externalId, qty: ['kg', 'liter'].includes(line.uomName) ? 1 : Math.ceil(line.qty), koli: ['kg', 'liter'].includes(line.uomName) ? 1 : Math.ceil(line.qty), weight: Math.round(line.qty * (line.weightKg || 0) * 1000) / 1000, status: 'HUB_SCANNED' }));
    const sh = {
      id: uid('sh'), waybill, bookingId: d.externalId, source: 'WMS', uploadCode: null, clientId: c.id, hubId: h.id, type: 'DOCKING', serviceType: d.serviceType,
      status: 'AT_HUB', receiver: { name: d.recipient.name, phone: d.recipient.phone, address: d.destination.address },
      sender: { name: c.name, phone: '+62 21 5091 2000' }, origin: { name: h.name, address: h.address, lat: h.lat, lng: h.lng },
      destination: { address: d.destination.address, lat: d.destination.lat, lng: d.destination.lng },
      items, timeline: [], dispatchedAt: null, riderCode: null, createdAt: nowIso(),
      wms: { outboundId: d.outboundOrderId, giId: d.goodsIssueId, suratJalan: d.suratJalanNo, outboundCode: d.outboundCode },
    };
    sh.timeline.push({ at: nowIso(), status: 'CREATED', fromStatus: null, title: null, note: `Dibuat dari warehouse (FulfillmentGateway) · ${d.suratJalanNo}`, by: 'System' });
    sh.timeline.push({ at: nowIso(), status: 'AT_HUB', fromStatus: 'CREATED', title: null, note: 'Item hub-scanned (scan method WAREHOUSE_ISSUE), siap masuk dispatch', by: 'System' });
    db.shipments.unshift(sh);
    logCall('FulfillmentGateway.commit()', 'warehouse', 'shipment adapter', { goodsIssueId: d.goodsIssueId, result: `AWB ${waybill} · At hub` });
    return { shipmentId: sh.id, waybill };
  },
};
// Hook status milik Shipments (generik): dipanggil di funnel perubahan status. Adapter yang mendaftar.
const FULFILLMENT_STATUS = { DISPATCHED: 'DISPATCHED', IN_DELIVERY: 'IN_DELIVERY', COMPLETED: 'DELIVERED', FAILED: 'FAILED', RETURNED: 'RETURNED', CANCELLED: 'CANCELLED' };
function shipmentStatusHook(sh, extra) {
  if (!sh.wms || !FULFILLMENT_STATUS[sh.status]) return;
  warehouseFulfillmentPort.applyUpdates([{ shipmentId: sh.id, waybill: sh.waybill, status: FULFILLMENT_STATUS[sh.status], ...(extra || {}) }]);
}

/* 3 ── WMS port masuk: update status pengiriman (WMS hanya kenal "fulfillment", bukan shipment) */
const warehouseFulfillmentPort = {
  applyUpdates(updates) {
    updates.forEach((d) => {
      const g = db.gis.find((x) => x.shipmentId === d.shipmentId);
      if (!g) return;
      const o = outbound(g.outboundId);
      logCall('WarehouseFulfillmentPort.applyUpdates()', 'shipment adapter', 'warehouse', { goodsIssueId: g.id, result: d.status });
      if (d.status === 'DISPATCHED') orEvent(o, null, 'Dispatch committed', `Shipment ${d.waybill} masuk dispatch${d.riderCode ? ' · rider ' + d.riderCode : ''}`, 'SYSTEM');
      else if (d.status === 'IN_DELIVERY') { g.status = 'IN_DELIVERY'; orEvent(o, 'IN_DELIVERY', 'Out for delivery', `Shipment ${d.waybill}${d.riderCode ? ' · rider ' + d.riderCode : ''}`, 'SYSTEM'); }
      else if (d.status === 'DELIVERED') { g.status = 'DELIVERED'; orEvent(o, 'DELIVERED', 'Delivered (POD)', `POD ${d.waybill} diterima penerima`, 'SYSTEM'); }
      else { g.status = 'FAILED'; orEvent(o, 'FAILED', 'Pengiriman gagal', `Shipment ${d.waybill} ${d.status.toLowerCase()} — barang retur diterima lewat PO Return (karantina)`, 'SYSTEM'); }
    });
  },
};

/* ── cancel outbound ── */
const OR_CANCELLABLE = ['OPEN', 'PREPARING', 'READY_TO_PICKUP'];
function cancelOutbound(orderId, reason) {
  const o = outbound(orderId);
  if (!o || !OR_CANCELLABLE.includes(o.status)) throw new AppError('Cancel hanya bisa sebelum shipping di-submit (barang belum jadi shipment).');
  if (!String(reason || '').trim()) throw new AppError('Alasan cancel wajib diisi.');
  const g = giOfOutbound(o);
  if (g) { releaseReserve(g); g.status = 'CANCELLED'; }
  o.cancelledAt = nowIso();
  o.cancelReason = String(reason).trim();
  orEvent(o, 'CANCELLED', 'Order dibatalkan', `${esc(o.cancelReason)}${g ? ` · reserve ${g.code} dilepas` : ''}`);
}

/* ── shipment lanjut di flow logistic (simulasi presenter: Dispatched → In delivery → Delivered / Failed) ── */
const SH_STEPS = {
  DISPATCH: { label: 'Dispatch (rider assigned)', short: 'Dispatched', icon: 'r:RiRouteLine' },
  IN_DELIVERY: { label: 'In delivery (rider berangkat)', short: 'In delivery', icon: 'r:RiTruckLine' },
  COMPLETE: { label: 'Delivered + POD', short: 'Delivered', icon: 'r:RiCheckboxCircleLine' },
  FAIL: { label: 'Delivery gagal (Failed)', short: 'Failed', icon: 'r:RiErrorWarningLine' },
};
function nextShipmentSteps(sh) {
  if (sh.status === 'AT_HUB') return ['DISPATCH'];
  if (sh.status === 'DISPATCHED') return ['IN_DELIVERY', 'FAIL'];
  if (sh.status === 'IN_DELIVERY') return ['COMPLETE', 'FAIL'];
  return [];
}
function advanceShipment(id, step) {
  const sh = shipment(id);
  if (!sh || !nextShipmentSteps(sh).includes(step)) throw new AppError('Langkah simulasi tidak valid untuk status shipment ini.');
  const from = sh.status;
  const push = (status, text, by) => sh.timeline.push({ at: nowIso(), status, fromStatus: from, title: null, note: text, by: by || 'System' });
  if (step === 'DISPATCH') {
    sh.status = 'DISPATCHED'; sh.dispatchedAt = nowIso(); sh.riderCode = sh.riderCode || 'RDR-0042';
    sh.items.forEach((i) => { i.status = 'DISPATCHED'; });
    push('DISPATCHED', `Dispatch committed — rider ${sh.riderCode}`);
  } else if (step === 'IN_DELIVERY') {
    sh.items.forEach((i) => { i.status = 'IN_DELIVERY'; });
    sh.timeline.push({ at: nowIso(), status: 'DISPATCHED', fromStatus: null, title: 'Rider handover scan', note: `${sh.items.length} item diserahkan ke ${sh.riderCode}`, by: 'Rider' });
    sh.status = 'IN_DELIVERY';
    push('IN_DELIVERY', 'delivery-service IN_DELIVERY');
  } else if (step === 'COMPLETE') {
    sh.status = 'COMPLETED'; sh.items.forEach((i) => { i.status = 'COMPLETED'; });
    push('COMPLETED', 'delivery-service COMPLETED · POD diterima');
  } else if (step === 'FAIL') {
    sh.status = 'FAILED'; sh.items.forEach((i) => { i.status = 'FAILED'; });
    push('FAILED', 'delivery-service FAILED · penerima tidak di tempat');
  }
  // Funnel status Shipments memanggil hook terdaftar (interface). Shipments tidak tahu WMS.
  shipmentStatusHook(sh, { riderCode: sh.riderCode });
}

/* ══ Supply & inbound: PO (Regular / Return; Transfer otomatis) → inbound request → goods receipt ══ */
const PO_FIELD_STEP = { type: 1, client: 1, hub: 1, vendor: 1, returned_from: 1, est_arrival: 1, notes: 1, lines: 2, sku: 2, qty: 2 };
function poSourceOf(x) {
  if (x.type === 'TRANSFER') { const h = hub(x.sourceHubId); return { label: 'Hub asal', value: h ? h.name : x.supplier, sub: h ? h.code : null }; }
  if (x.type === 'RETURN') return { label: 'Diterima dari', value: x.returnedFrom || x.supplier, sub: null };
  const v = vendor(x.vendorId);
  return { label: 'Vendor', value: v ? v.name : x.supplier, sub: v ? v.code : null };
}
function validatePO(p) {
  const errs = [];
  const add = (field, message, line) => errs.push({ field, message, line });
  const type = p.type || 'REGULAR';
  const c = client(Number(p.clientId));
  if (type === 'TRANSFER') add('type', 'PO transfer terbit otomatis dari outbound transfer di hub asal — tidak bisa dibuat manual.');
  else if (!PO_TYPE_META[type]) add('type', 'Tipe PO harus REGULAR atau RETURN.');
  if (!c) add('client', 'Client wajib dipilih.');
  const h = hub(Number(p.hubId));
  if (!h) add('hub', 'Hub tujuan wajib dipilih.');
  else if (!db.storages.some((s) => s.hubId === h.id && s.status === 'ACTIVE')) add('hub', `${h.name} belum punya storage aktif.`);
  if (type === 'REGULAR') {
    const v = vendor(p.vendorId);
    if (!v) add('vendor', 'Vendor wajib dipilih.');
    else if (v.status !== 'ACTIVE') add('vendor', `Vendor ${v.name} nonaktif — pilih vendor aktif (VENDOR_INACTIVE).`);
  }
  if (type === 'RETURN') {
    const rf = String(p.returnedFrom || '').trim();
    if (!rf) add('returned_from', 'Diterima dari wajib diisi untuk PO Return.');
    else if (rf.length > 120) add('returned_from', 'Diterima dari maksimal 120 karakter.');
  }
  if (p.estArrival && Number.isNaN(Date.parse(p.estArrival))) add('est_arrival', 'Est. arrival tidak valid.');
  const lines = (p.lines || []).filter((l) => l.sku || String(l.qty == null ? '' : l.qty).trim() !== '');
  if (!lines.length) add('lines', 'Minimal satu baris SKU.');
  const seen = new Set();
  lines.forEach((l, i) => {
    const pre = `Baris ${i + 1}: `;
    if (!l.sku) add('sku', `${pre}SKU wajib dipilih.`, i);
    else if (c && !skuOf(c.id, l.sku)) add('sku', `${pre}SKU ${l.sku} tidak ada di katalog ${c.name} (SKU_NOT_IN_CATALOG).`, i);
    else if (seen.has(l.sku)) add('sku', `${pre}SKU ${l.sku} dobel — gabungkan qty-nya.`, i);
    if (l.sku) seen.add(l.sku);
    if (!(Number(l.qty) > 0)) add('qty', `${pre}Qty harus lebih dari 0.`, i);
  });
  return errs.map((e) => ({ ...e, step: PO_FIELD_STEP[e.field] || 1 }));
}
function createPO(p) {
  const errs = validatePO(p);
  if (errs.length) throw validationError(errs);
  const type = p.type || 'REGULAR';
  const v = type === 'REGULAR' ? vendor(p.vendorId) : null;
  const lines = p.lines.filter((l) => l.sku && Number(l.qty) > 0);
  const x = {
    id: uid('po'), code: docCode('PO'), type, clientId: Number(p.clientId), hubId: Number(p.hubId), vendorId: v ? v.id : null, returnedFrom: type === 'RETURN' ? String(p.returnedFrom).trim() : null, sourceHubId: null, transferOutboundId: null,
    supplier: v ? v.name : String(p.returnedFrom || '').trim(), estArrival: p.estArrival || new Date(nowMs() + 3 * DAY).toISOString(),
    status: 'DRAFT', grStatus: null, lines: lines.map((l) => ({ sku: l.sku, qty: Number(l.qty), received: 0 })), notes: String(p.notes || '').trim(), createdAt: nowIso(), createdBy: actor(), confirmedAt: null, confirmedBy: null, cancelledAt: null, cancelReason: null,
  };
  db.pos.unshift(x);
  return x;
}
function confirmPO(id) {
  const x = po(id);
  if (!x || x.status !== 'DRAFT') throw new AppError('Hanya PO Draft yang bisa di-confirm.');
  if (x.type === 'REGULAR' && vendor(x.vendorId) && vendor(x.vendorId).status !== 'ACTIVE') throw new AppError(`Vendor ${vendor(x.vendorId).name} sudah nonaktif — aktifkan dulu di menu Vendor.`);
  x.status = 'CONFIRMED'; x.grStatus = 'SCHEDULED'; x.confirmedAt = nowIso(); x.confirmedBy = actor();
}
const poCancelBlock = (x) => {
  if (!x) return 'PO tidak ditemukan.';
  if (x.type === 'TRANSFER') return 'PO transfer tidak bisa dibatalkan — barangnya sudah dikirim dari hub asal.';
  if (x.status === 'CANCELLED') return 'PO sudah dibatalkan.';
  if (x.status === 'CONFIRMED' && grsOf(x.id).length) return 'PO sudah punya goods receipt (PO_HAS_RECEIPTS).';
  return null;
};
const grsOf = (poId) => db.grs.filter((g) => g.poId === poId);
function cancelPO(id, reason) {
  const x = po(id);
  const block = poCancelBlock(x);
  if (block) throw new AppError(block);
  x.status = 'CANCELLED'; x.grStatus = null; x.cancelledAt = nowIso(); x.cancelReason = String(reason || '').trim() || 'Dibatalkan ops';
}
const poRemaining = (x, sku) => { const l = x.lines.find((y) => y.sku === sku); return l ? Math.max(0, l.qty - l.received) : 0; };
/* Goods receipt v2: create + post sekaligus. Storage tujuan boleh level mana pun (location/section/bin) di hub PO. */
const GR_FIELD_STEP = { lines: 2, qty: 2, storage: 2, sku: 2, arrival: 3, delivery_note: 3 };
function submitGR(p) {
  const x = po(p.poId);
  if (!x || x.status !== 'CONFIRMED' || x.grStatus === 'FINISHED') throw new AppError('Pilih inbound request yang masih menunggu barang.');
  const errs = [];
  const add = (field, message) => errs.push({ field, message, step: GR_FIELD_STEP[field] || 2 });
  const lines = (p.lines || []).filter((l) => Number(l.qty) > 0);
  if (!lines.length) add('lines', 'Isi qty diterima minimal satu baris.');
  const bySku = {};
  lines.forEach((l) => { bySku[l.sku] = (bySku[l.sku] || 0) + Number(l.qty); });
  Object.entries(bySku).forEach(([sku, q]) => { if (q > poRemaining(x, sku)) add('qty', `${sku}: total ${fmtQty(q)} melebihi sisa PO ${fmtQty(poRemaining(x, sku))} (OVER_RECEIPT).`); });
  lines.forEach((l) => {
    const st = storage(l.storageId);
    if (!st) add('storage', `${l.sku}: storage tujuan wajib dipilih.`);
    else if (st.hubId !== x.hubId) add('storage', `${l.sku}: storage ${st.code} bukan di hub PO (BIN_NOT_IN_HUB).`);
    else if (st.status !== 'ACTIVE') add('storage', `${l.sku}: storage ${st.code} nonaktif (STORAGE_INACTIVE).`);
  });
  if (p.dateArrival && Number.isNaN(Date.parse(p.dateArrival))) add('arrival', 'Date arrival tidak valid.');
  if (errs.length) throw validationError(errs);
  const g = { id: uid('gr'), code: docCode('GR'), poId: x.id, clientId: x.clientId, hubId: x.hubId, status: 'POSTED', dateArrival: p.dateArrival || nowIso(), deliveryNote: String(p.deliveryNote || '').trim(), deliveryNoteDoc: p.deliveryNoteDoc || null, notes: String(p.notes || '').trim(), closesBackorder: !!p.closeBackorder, lines: [], createdAt: nowIso(), createdBy: actor() };
  lines.forEach((l) => {
    const lot = docCode('LOT');
    const st = storage(l.storageId);
    const q = Number(l.qty);
    db.stocks.push({ id: uid('stk'), hubId: x.hubId, storageId: st.id, clientId: x.clientId, sku: l.sku, lot, expiry: l.expiry || null, onHand: q, reserved: 0, receivedAt: nowIso() });
    g.lines.push({ sku: l.sku, name: skuName(x.clientId, l.sku), uom: skuUom(x.clientId, l.sku), qty: q, expiry: l.expiry || null, storageId: st.id, lot });
    x.lines.find((pl) => pl.sku === l.sku).received += q;
    addMovement({ hubId: x.hubId, clientId: x.clientId, sku: l.sku, lot, type: x.type === 'TRANSFER' ? 'TRANSFER_IN' : 'INBOUND', refType: 'GOODS_RECEIPT', refCode: g.code, storageId: st.id, storageCode: st.code, qtyDelta: q });
  });
  const done = x.lines.every((l) => l.received >= l.qty);
  x.grStatus = done || p.closeBackorder ? 'FINISHED' : 'PARTIAL_RECEIPT';
  db.grs.unshift(g);
  if (x.type === 'TRANSFER' && x.transferOutboundId && outbound(x.transferOutboundId)) {
    orEvent(outbound(x.transferOutboundId), null, `Diterima di ${hub(x.hubId).name}`, `${g.code} · ${fmtQty(sum(g.lines.map((l) => l.qty)))} unit · PO transfer ${x.code} ${IR_LABEL[x.grStatus].toLowerCase()}`);
  }
  return g;
}

/* ── storage master ── */
function createStorage(p) {
  const h = hub(p.hubId);
  if (!h) throw new AppError('Pilih hub.');
  const code = String(p.code || '').trim().toUpperCase();
  if (!code || !String(p.name || '').trim()) throw new AppError('Code dan nama wajib diisi.');
  if (db.storages.some((s) => s.hubId === h.id && s.code === code)) throw new AppError(`Code ${code} sudah dipakai di ${h.name}.`);
  let path;
  if (p.category === 'LOCATION') {
    path = String(Math.max(0, ...db.storages.filter((s) => s.hubId === h.id && s.category === 'LOCATION').map((s) => Number(s.path))) + 1);
  } else {
    const parent = storage(p.parentId);
    const need = p.category === 'SECTION' ? 'LOCATION' : 'SECTION';
    if (!parent || parent.category !== need || parent.hubId !== h.id) throw new AppError(`${STORAGE_LEVEL_LABEL[p.category]} harus berada di bawah ${STORAGE_LEVEL_LABEL[need]} di hub yang sama.`);
    const siblings = db.storages.filter((s) => s.hubId === h.id && s.path.startsWith(parent.path + '.') && s.path.split('.').length === parent.path.split('.').length + 1);
    path = `${parent.path}.${siblings.length + 1}`;
  }
  const s = { id: uid('st'), hubId: h.id, code, name: String(p.name).trim(), category: p.category, type: p.category === 'LOCATION' ? p.type || 'STORAGE' : null, path, status: 'ACTIVE', createdAt: nowIso() };
  db.storages.push(s);
  return s;
}
