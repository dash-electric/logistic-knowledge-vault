// ── Seed: master + histori yang di-replay lewat engine supaya stok, reserve, dan link konsisten ──
// Cerita demo: 2 hub Jakarta Selatan (Kemang KMG, Blok M BLM), 2 client (FORE, SwipeRX), vendor aktif + 1 nonaktif,
// stok di bin DAN langsung di location/section, lot karantina, PO menunggu barang, dan outbound di semua status.
const STAFF = ['Budi Santoso', 'Dewi Lestari', 'Fajar Nugroho', 'Rina Wulandari'];
const DESTS = {
  12: [
    { name: 'Fore Coffee Kemang Raya', phone: '+6281211100021', address: 'Jl. Kemang Raya No. 8, Bangka, Mampang Prapatan, Jakarta Selatan 12730', lat: -6.2611, lng: 106.8133 },
    { name: 'Fore Coffee Senopati', phone: '+6281211100022', address: 'Jl. Senopati No. 74, Selong, Kebayoran Baru, Jakarta Selatan 12110', lat: -6.2297, lng: 106.8091 },
    { name: 'Fore Coffee Panglima Polim', phone: '+6281211100023', address: 'Jl. Panglima Polim Raya No. 21, Melawai, Kebayoran Baru, Jakarta Selatan 12160', lat: -6.2462, lng: 106.7985 },
    { name: 'Fore Coffee Cipete', phone: '+6281211100024', address: 'Jl. Cipete Raya No. 12, Cipete Selatan, Cilandak, Jakarta Selatan 12410', lat: -6.2732, lng: 106.8016 },
    { name: 'Fore Coffee Gandaria', phone: '+6281211100025', address: 'Jl. Gandaria Tengah III No. 5, Kramat Pela, Kebayoran Baru, Jakarta Selatan 12130', lat: -6.2441, lng: 106.7853 },
  ],
  21: [
    { name: 'Apotek Kenanga Mampang', phone: '+6281311100031', address: 'Jl. Mampang Prapatan Raya No. 101, Tegal Parang, Jakarta Selatan 12790', lat: -6.2482, lng: 106.8238 },
    { name: 'Apotek Melawai Sehat', phone: '+6281311100032', address: 'Jl. Melawai IX No. 3, Melawai, Kebayoran Baru, Jakarta Selatan 12160', lat: -6.244, lng: 106.8001 },
    { name: 'Apotek Bangka Farma', phone: '+6281311100033', address: 'Jl. Bangka Raya No. 47, Pela Mampang, Jakarta Selatan 12720', lat: -6.2547, lng: 106.8172 },
    { name: 'Apotek Cilandak Prima', phone: '+6281311100034', address: 'Jl. Cilandak KKO No. 9, Ragunan, Pasar Minggu, Jakarta Selatan 12550', lat: -6.2925, lng: 106.8174 },
  ],
};

function freshDb() {
  return {
    v: DB_VERSION,
    seededAt: Date.now(),
    seq: {},
    hubs: [
      { id: 3, code: 'KMG', name: 'Dash Hub Kemang', address: 'Jl. Kemang Raya No. 45, Bangka, Mampang Prapatan, Jakarta Selatan 12730', lat: -6.2607, lng: 106.8137 },
      { id: 7, code: 'BLM', name: 'Dash Hub Blok M', address: 'Jl. Melawai Raya No. 12, Kebayoran Baru, Jakarta Selatan 12160', lat: -6.2441, lng: 106.7991 },
    ],
    clients: [
      { id: 12, code: 'FOR', name: 'FORE', revenue: 'B2B' },
      { id: 21, code: 'SRX', name: 'SwipeRX', revenue: 'B2B' },
    ],
    skus: [
      { clientId: 12, sku: 'FORE-CUP-12OZ', name: 'Paper cup 12oz', uom: 'carton', lengthCm: 50, widthCm: 40, heightCm: 35, weightKg: 4.5, expiry: false },
      { clientId: 12, sku: 'FORE-LID-12OZ', name: 'Cup lid 12oz', uom: 'carton', lengthCm: 45, widthCm: 35, heightCm: 30, weightKg: 3.2, expiry: false },
      { clientId: 12, sku: 'FORE-SLEEVE', name: 'Cup sleeve kraft', uom: 'carton', lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 2, expiry: false },
      { clientId: 12, sku: 'FORE-BEAN-1KG', name: 'Coffee beans house blend 1kg', uom: 'pack', lengthCm: 30, widthCm: 20, heightCm: 10, weightKg: 1, expiry: true },
      { clientId: 12, sku: 'FORE-SYRUP-1L', name: 'Aren syrup 1L (isi 12)', uom: 'box', lengthCm: 40, widthCm: 30, heightCm: 25, weightKg: 12, expiry: true },
      { clientId: 21, sku: 'SRX-PCM-500', name: 'Paracetamol 500 mg (box 10 strip)', uom: 'box', lengthCm: 12, widthCm: 8, heightCm: 6, weightKg: 0.15, expiry: true },
      { clientId: 21, sku: 'SRX-AMX-500', name: 'Amoxicillin 500 mg (box 10 strip)', uom: 'box', lengthCm: 12, widthCm: 8, heightCm: 6, weightKg: 0.18, expiry: true },
      { clientId: 21, sku: 'SRX-VITC-1000', name: 'Vitamin C 1000 mg (botol 30 tab)', uom: 'pcs', lengthCm: 6, widthCm: 6, heightCm: 12, weightKg: 0.2, expiry: true },
      { clientId: 21, sku: 'SRX-MASK-50', name: 'Masker medis 3-ply (isi 50)', uom: 'box', lengthCm: 18, widthCm: 10, heightCm: 9, weightKg: 0.4, expiry: false },
      { clientId: 21, sku: 'SRX-HS-500', name: 'Hand sanitizer 500 ml (isi 24)', uom: 'carton', lengthCm: 40, widthCm: 28, heightCm: 22, weightKg: 13, expiry: true },
    ].map((k) => ({ ...k, createdAt: new Date(Date.now() - 70 * DAY).toISOString(), createdBy: 'rina.wulandari@dashelectric.co' })),
    vendors: [],
    storages: [],
    stocks: [],
    movements: [],
    pos: [],
    grs: [],
    outbounds: [],
    gis: [],
    shipments: [],
    bus: [],
    uploads: [],
    ui: { actor: 'ops.demo@dashelectric.co', hubId: 'all', guideOpen: true, guideAct: 1, demo: {}, refs: {} },
  };
}

function seedStorages() {
  const tree = {
    3: [
      { code: 'LOC-01', name: 'Zona A', type: 'STORAGE', sections: [
        { code: 'SEC-A', name: 'Rak A', bins: [['BIN-A1', 'Slot A1'], ['BIN-A2', 'Slot A2'], ['BIN-A3', 'Slot A3']] },
        { code: 'SEC-B', name: 'Rak B', bins: [['BIN-B1', 'Slot B1'], ['BIN-B2', 'Slot B2']] },
      ] },
      // Lantai palet: stok menempel langsung di location / section (tanpa bin).
      { code: 'LOC-02', name: 'Zona B', type: 'STORAGE', sections: [{ code: 'SEC-C', name: 'Rak palet C', bins: [] }] },
      { code: 'LOC-03', name: 'Karantina', type: 'QUARANTINE', sections: [{ code: 'SEC-Q', name: 'Area retur', bins: [['BIN-Q1', 'Slot Q1']] }] },
      { code: 'LOC-04', name: 'Staging outbound', type: 'STAGING', sections: [{ code: 'SEC-S', name: 'Dock', bins: [['BIN-S1', 'Dock 1']] }] },
    ],
    7: [
      { code: 'LOC-01', name: 'Zona A', type: 'STORAGE', sections: [{ code: 'SEC-A', name: 'Rak A', bins: [['BIN-A1', 'Slot A1'], ['BIN-A2', 'Slot A2']] }] },
      { code: 'LOC-02', name: 'Lantai transit', type: 'STORAGE', sections: [] },
      { code: 'LOC-03', name: 'Karantina', type: 'QUARANTINE', sections: [] },
    ],
  };
  Object.entries(tree).forEach(([hubId, locs]) => {
    locs.forEach((l) => {
      const loc = createStorage({ hubId, category: 'LOCATION', code: l.code, name: l.name, type: l.type });
      l.sections.forEach((s) => {
        const sec = createStorage({ hubId, category: 'SECTION', parentId: loc.id, code: s.code, name: s.name });
        s.bins.forEach(([code, name]) => createStorage({ hubId, category: 'BIN', parentId: sec.id, code, name }));
      });
    });
  });
}
const stId = (hubId, code) => db.storages.find((s) => s.hubId === hubId && s.code === code).id;
const fakeDocUrl = (name) => `https://storage.googleapis.com/logistic-bucket-main/logistic/${randHex(8)}-${slugFile(name)}`;

function seedAll() {
  db = freshDb();
  const T = db.seededAt;
  const at = (daysAgo, fn) => withClock(T - daysAgo * DAY, fn);
  const as = (who, fn) => { const p = db.ui.actor; db.ui.actor = who; try { return fn(); } finally { db.ui.actor = p; } };
  const RINA = 'rina.wulandari@dashelectric.co';
  const DEWI = 'dewi.lestari@dashelectric.co';

  at(60, seedStorages);

  // ── Vendor master (global) ──
  const ven = (daysAgo, p) => at(daysAgo, () => as(RINA, () => createVendor(p)));
  const vKemasan = ven(58, { name: 'PT Kemasan Prima Nusantara', phone: '021-5550101', email: 'sales@kemasanprima.co.id', address: 'Kawasan Industri Pulogadung Blok C No. 7, Jakarta Timur 13920', picName: 'Andi Wijaya', picPhone: '0813-1111-2222', npwp: '01.234.567.8-901.234' });
  const vRoast = ven(57, { name: 'PT Roastery Nusantara', phone: '021-29001234', email: 'order@roasterynusantara.id', address: 'Jl. Raya Bogor Km 27, Ciracas, Jakarta Timur 13740', picName: 'Sari Pratiwi', picPhone: '0812-7778-8899', npwp: '' });
  const vFarma = ven(55, { name: 'PT Farmasi Sehat Sentosa', phone: '021-7651234', email: 'cs@farmasisehat.co.id', address: 'Jl. TB Simatupang Kav. 9, Cilandak, Jakarta Selatan 12430', picName: 'dr. Hendra Gunawan', picPhone: '0813-9876-5432', npwp: '0987654321098765' });
  const vPlastik = ven(50, { name: 'CV Plastik Lama Jaya', phone: '021-8881234', email: '', address: 'Jl. Daan Mogot Km 14, Cengkareng, Jakarta Barat 11730', picName: 'Joko Susilo', picPhone: '', npwp: '' });

  // ── Inbound history: PO → confirm → GR (membentuk stok awal) ──
  const mkPO = (daysAgo, p) => at(daysAgo, () => as(RINA, () => createPO({ ...p, estArrival: new Date(T - (daysAgo - (p.etaIn || 2)) * DAY).toISOString() })));
  const conf = (daysAgo, id) => at(daysAgo, () => as(RINA, () => confirmPO(id)));
  const receive = (daysAgo, poId, lines, opt) => at(daysAgo, () => as(DEWI, () => {
    const dn = 'SJ-SUP-' + randAlnum(5);
    const name = `surat-jalan-${dn.toLowerCase()}.pdf`;
    return submitGR({ poId, dateArrival: nowIso(), deliveryNote: dn, deliveryNoteDoc: { url: fakeDocUrl(name), name, size: 150000 + Math.floor(Math.random() * 90000) }, lines, closeBackorder: !!(opt && opt.close), notes: (opt && opt.notes) || '' });
  }));
  const L = (sku, qty, storageCode, expiryDays, hubId) => ({ sku, qty, storageId: stId(hubId || 3, storageCode), expiry: expiryDays != null ? dayIso(expiryDays) : null });

  const po1 = mkPO(45, { type: 'REGULAR', clientId: 12, hubId: 3, vendorId: vKemasan.id, lines: [{ sku: 'FORE-CUP-12OZ', qty: 200 }, { sku: 'FORE-LID-12OZ', qty: 150 }, { sku: 'FORE-SLEEVE', qty: 100 }] });
  conf(44, po1.id);
  receive(42, po1.id, [L('FORE-CUP-12OZ', 120, 'BIN-A1'), L('FORE-CUP-12OZ', 80, 'LOC-02'), L('FORE-LID-12OZ', 150, 'BIN-A2'), L('FORE-SLEEVE', 100, 'SEC-C')]);

  const po2 = mkPO(35, { type: 'REGULAR', clientId: 12, hubId: 3, vendorId: vRoast.id, lines: [{ sku: 'FORE-BEAN-1KG', qty: 120 }] });
  conf(34, po2.id);
  receive(32, po2.id, [L('FORE-BEAN-1KG', 60, 'BIN-A3', 40)]);
  receive(12, po2.id, [L('FORE-BEAN-1KG', 60, 'BIN-B2', 150)]);

  const po3 = mkPO(26, { type: 'REGULAR', clientId: 12, hubId: 3, vendorId: vRoast.id, lines: [{ sku: 'FORE-SYRUP-1L', qty: 80 }], notes: 'Kirim bertahap — sisa menyusul.' });
  conf(25, po3.id);
  receive(24, po3.id, [L('FORE-SYRUP-1L', 48, 'BIN-B1', 35)]);

  // SwipeRX: lot dengan expiry sama di BIN-A1 (bin) dan LOC-02 (location) → FEFO ambil bin dulu.
  const po4 = mkPO(22, { type: 'REGULAR', clientId: 21, hubId: 3, vendorId: vFarma.id, lines: [{ sku: 'SRX-PCM-500', qty: 200 }, { sku: 'SRX-AMX-500', qty: 100 }, { sku: 'SRX-MASK-50', qty: 80 }, { sku: 'SRX-HS-500', qty: 40 }] });
  conf(21, po4.id);
  receive(19, po4.id, [L('SRX-PCM-500', 30, 'BIN-A1', 40), L('SRX-PCM-500', 50, 'LOC-02', 40), L('SRX-PCM-500', 100, 'BIN-B1', 200), L('SRX-AMX-500', 100, 'BIN-A2', 120), L('SRX-MASK-50', 80, 'BIN-A3'), L('SRX-HS-500', 40, 'SEC-C', 300)], { close: true, notes: 'PCM kurang 20 box dari vendor — sisa ditutup.' });

  // Retur dari apotek → karantina (expiry paling dekat, tapi tidak ikut alokasi FEFO).
  const poR = mkPO(13, { type: 'RETURN', clientId: 21, hubId: 3, returnedFrom: 'Apotek Cilandak Prima (retur kemasan penyok)', lines: [{ sku: 'SRX-PCM-500', qty: 20 }] });
  conf(12.9, poR.id);
  receive(12, poR.id, [L('SRX-PCM-500', 20, 'BIN-Q1', 10)], { notes: 'Kemasan penyok — tahan di karantina.' });

  const po6 = mkPO(16, { type: 'REGULAR', clientId: 21, hubId: 7, vendorId: vFarma.id, lines: [{ sku: 'SRX-PCM-500', qty: 60 }, { sku: 'SRX-MASK-50', qty: 40 }] });
  conf(15.5, po6.id);
  receive(15, po6.id, [L('SRX-PCM-500', 60, 'BIN-A1', 90, 7), L('SRX-MASK-50', 40, 'LOC-02', null, 7)]);

  const po9 = mkPO(10, { type: 'REGULAR', clientId: 12, hubId: 7, vendorId: vPlastik.id, lines: [{ sku: 'FORE-CUP-12OZ', qty: 50 }] });
  at(9, () => as(RINA, () => cancelPO(po9.id, 'Harga vendor naik — dialihkan ke vendor lain')));
  at(6, () => as(RINA, () => setVendorStatus(vPlastik.id, 'INACTIVE')));

  // Menunggu barang: PO confirmed, receipt Scheduled (alternatif demo goods receipt).
  const po7 = mkPO(3, { type: 'REGULAR', clientId: 21, hubId: 3, vendorId: vFarma.id, etaIn: 3.2, lines: [{ sku: 'SRX-VITC-1000', qty: 50 }, { sku: 'SRX-AMX-500', qty: 40 }], notes: 'Simpan Vitamin C di Rak B.' });
  conf(2.5, po7.id);
  // Draft: siap di-confirm.
  const po8 = mkPO(0.3, { type: 'REGULAR', clientId: 12, hubId: 3, vendorId: vKemasan.id, etaIn: 4, lines: [{ sku: 'FORE-LID-12OZ', qty: 100 }, { sku: 'FORE-CUP-12OZ', qty: 100 }] });

  // ── Outbound history ──
  const mk = (source, daysAgo, clientId, hubId, ext, dest, lines, extra) =>
    at(daysAgo, () => createOutbound({ type: 'REGULAR', clientId, hubId, externalId: ext, recipient: { name: dest.name, phone: dest.phone }, destination: { address: dest.address, lat: dest.lat, lng: dest.lng, notes: dest.notes || '' }, expectedDate: isoDate(nowMs() + DAY), serviceType: 'SAME_DAY', lines, ...(extra || {}) }, source, extra && extra.up ? { uploadId: extra.up.id, uploadCode: extra.up.code, fileName: extra.up.fileName, rows: extra.rows } : null).order);
  const manual = (...a) => mk('MANUAL', ...a);
  const upload = (daysAgo, clientId, hubId, fileName, totalRows) => at(daysAgo, () => { const u = { id: uid('up'), code: docCode('OOU'), hubId, clientId, fileName, totalRows, created: 0, skipped: 0, orderIds: [], createdBy: actor(), createdAt: nowIso() }; db.uploads.unshift(u); return u; });
  const viaCsv = (u, rows, daysAgo, clientId, hubId, ext, dest, lines) => { const o = mk('CSV', daysAgo, clientId, hubId, ext, dest, lines, { up: u, rows }); u.created += 1; u.orderIds.push(o.id); return o; };
  const pickingFlow = (daysAgo, o, picker, upto) => {
    const g = at(daysAgo, () => createPickingOrder(o.id));
    if (upto === 'created') return g;
    at(daysAgo - 0.03, () => { assignPicker(g.id, picker); pickAll(g.id); });
    if (upto === 'picked') return g;
    at(daysAgo - 0.05, () => readyToPickup(g.id));
    return g;
  };
  const ship = (daysAgo, g) => at(daysAgo, () => submitShipping(g.id).shipment);
  const adv = (daysAgo, sh, step) => at(daysAgo, () => advanceShipment(sh.id, step));
  const D = DESTS;

  // Transfer historis KMG → BLM: shipped, delivered, PO transfer diterima penuh di Blok M.
  const hBlm = hub(7);
  const t1 = at(8, () => createOutbound({ type: 'TRANSFER', destHubId: 7, clientId: 12, hubId: 3, externalId: '', recipient: { name: 'Gudang Dash Hub Blok M (PIC Yusuf)', phone: '+6281299900011' }, destination: { address: hBlm.address, lat: hBlm.lat, lng: hBlm.lng, notes: 'Bongkar di dock belakang' }, expectedDate: isoDate(nowMs() + DAY), serviceType: 'SAME_DAY', lines: [{ sku: 'FORE-CUP-12OZ', qty: 30 }] }, 'MANUAL').order);
  const gt1 = pickingFlow(7.9, t1, 'Fajar Nugroho');
  const st1 = ship(7.8, gt1); adv(7.7, st1, 'DISPATCH'); adv(7.6, st1, 'IN_DELIVERY'); adv(7.4, st1, 'COMPLETE');
  receive(7.3, t1.transferPoId, [L('FORE-CUP-12OZ', 30, 'BIN-A2', null, 7)]);

  const o1 = manual(6, 21, 3, 'SRX-ORD-40112', D[21][0], [{ sku: 'SRX-AMX-500', qty: 10 }, { sku: 'SRX-MASK-50', qty: 5 }]);
  const g1 = pickingFlow(5.9, o1, 'Budi Santoso');
  const s1 = ship(5.8, g1); adv(5.7, s1, 'DISPATCH'); adv(5.6, s1, 'IN_DELIVERY'); adv(5.4, s1, 'COMPLETE');

  const oF = manual(4, 21, 3, 'SRX-ORD-40127', D[21][2], [{ sku: 'SRX-MASK-50', qty: 3 }]);
  const gF = pickingFlow(3.9, oF, 'Dewi Lestari');
  const sF = ship(3.8, gF); adv(3.7, sF, 'DISPATCH'); adv(3.6, sF, 'IN_DELIVERY'); adv(3.5, sF, 'FAIL');

  const o9 = manual(3, 12, 3, 'FORE-SO-88102', D[12][1], [{ sku: 'FORE-LID-12OZ', qty: 5 }]);
  at(2.9, () => cancelOutbound(o9.id, 'Client membatalkan order (outlet tutup renovasi)'));

  const o2 = manual(2, 21, 7, 'SRX-ORD-40150', D[21][1], [{ sku: 'SRX-PCM-500', qty: 10 }]);
  const g2 = pickingFlow(1.9, o2, 'Fajar Nugroho');
  const s2 = ship(1.8, g2); adv(1.6, s2, 'DISPATCH'); adv(1.5, s2, 'IN_DELIVERY');

  const upA = upload(1.21, 12, 3, 'fore-so-harian-0610.csv', 2);
  const o3 = viaCsv(upA, [2, 3], 1.2, 12, 3, 'FORE-SO-88140', D[12][0], [{ sku: 'FORE-BEAN-1KG', qty: 10 }, { sku: 'FORE-CUP-12OZ', qty: 10 }]);
  const g3 = pickingFlow(1.1, o3, 'Budi Santoso');
  ship(1.0, g3);

  const o3b = manual(0.9, 12, 3, 'FORE-SO-88151', D[12][2], [{ sku: 'FORE-SLEEVE', qty: 10 }]);
  const g3b = pickingFlow(0.85, o3b, 'Rina Wulandari');
  const s3b = ship(0.8, g3b); adv(0.6, s3b, 'DISPATCH');

  const o4 = manual(0.7, 12, 3, 'FORE-SO-88160', D[12][3], [{ sku: 'FORE-LID-12OZ', qty: 12 }]);
  pickingFlow(0.65, o4, 'Dewi Lestari');

  const o5 = manual(0.4, 21, 3, 'SRX-ORD-40171', D[21][2], [{ sku: 'SRX-AMX-500', qty: 6 }, { sku: 'SRX-MASK-50', qty: 4 }]);
  const g5 = pickingFlow(0.35, o5, null, 'created');
  at(0.3, () => { assignPicker(g5.id, 'Rina Wulandari'); setPicked(g5.id, g5.lines[0].id, g5.lines[0].qtyReserved); });

  const upB = upload(0.26, 12, 3, 'fore-so-harian-0710.csv', 3);
  const o6 = viaCsv(upB, [2], 0.25, 12, 3, 'FORE-SO-88177', D[12][4], [{ sku: 'FORE-CUP-12OZ', qty: 15 }]);
  pickingFlow(0.2, o6, null, 'created');
  viaCsv(upB, [3, 4], 0.25, 12, 3, 'FORE-SO-88178', D[12][1], [{ sku: 'FORE-CUP-12OZ', qty: 15 }, { sku: 'FORE-LID-12OZ', qty: 15 }]);

  const o8 = manual(0.05, 12, 3, 'FORE-SO-88190', D[12][0], [{ sku: 'FORE-SYRUP-1L', qty: 120 }], { notes: 'Stok sirup belum cukup — contoh shortfall.' });

  // ── Shipment non-WMS (CSV/H2H) supaya halaman Shipments tetap realistis ──
  const regular = [
    [12, 'FORE-INV-88112', 'CREATED', D[12][1], 2, 0.6, 'UPL2610070001'],
    [21, 'SRX-INV-77021', 'AT_HUB', D[21][3], 1, 0.8, 'UPL2610070002'],
    [21, 'SRX-TRIP-3301', 'DISPATCHED', D[21][0], 1, 1.4, null],
    [12, 'FORE-INV-88097', 'IN_DELIVERY', D[12][2], 2, 2.2, 'UPL2610050004'],
    [12, 'FORE-INV-88050', 'FAILED', D[12][3], 1, 3.6, 'UPL2610040003'],
    [21, 'SRX-INV-76990', 'COMPLETED', D[21][1], 1, 6.1, 'UPL2610010001'],
  ];
  regular.forEach(([cid, booking, status, d, n, daysAgo, upl]) => at(daysAgo, () => {
    const c = client(cid);
    const h = hub(cid === 21 && status === 'COMPLETED' ? 7 : 3);
    const wb = `DL${c.code}${yymmdd()}${String(Math.floor(Math.random() * 90) + 10)}${randAlnum(4)}`;
    const itemStatus = { CREATED: 'CREATED', AT_HUB: 'HUB_SCANNED', DISPATCHED: 'DISPATCHED', IN_DELIVERY: 'IN_DELIVERY', FAILED: 'FAILED', COMPLETED: 'COMPLETED' }[status];
    const sh = {
      id: uid('sh'), waybill: wb, bookingId: booking, source: upl ? 'CSV' : 'API', uploadCode: upl, clientId: cid, hubId: h.id, type: 'DOCKING', serviceType: 'SAME_DAY', status,
      receiver: { name: d.name, phone: d.phone, address: d.address }, sender: { name: c.name, phone: '+62 21 5091 2000' }, origin: status === 'CREATED' ? null : { name: h.name, address: h.address, lat: h.lat, lng: h.lng },
      destination: { address: d.address, lat: d.lat, lng: d.lng },
      items: Array.from({ length: n }, (_, i) => ({ id: uid('it'), code: `${wb}-${pad2(i + 1)}`, name: `PO-${booking}-${i + 1}`, sku: null, invoice: booking, qty: 1, koli: 2, weight: 4.2, status: itemStatus })),
      timeline: [{ at: nowIso(), status: 'CREATED', fromStatus: null, title: null, note: upl ? `CSV import ${upl}` : 'H2H create', by: 'client:' + c.code }],
      dispatchedAt: ['DISPATCHED', 'IN_DELIVERY', 'FAILED', 'COMPLETED'].includes(status) ? nowIso() : null, riderCode: ['DISPATCHED', 'IN_DELIVERY', 'FAILED', 'COMPLETED'].includes(status) ? 'RDR-0017' : null, createdAt: nowIso(), wms: null,
    };
    if (status !== 'CREATED') sh.timeline.push({ at: new Date(nowMs() + 2 * HOUR).toISOString(), status: status === 'AT_HUB' ? 'AT_HUB' : status, fromStatus: 'CREATED', title: null, note: status === 'AT_HUB' ? 'Inbound scan di hub' : 'Status dari delivery-service', by: 'System' });
    db.shipments.push(sh);
  }));
  db.shipments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  db.movements.sort((a, b) => (a.at < b.at ? 1 : -1));

  db.ui.refs = { scheduledPoId: po7.id, draftPoId: po8.id, shortfallId: o8.id, readyId: o4.id };
  save();
}

function loadDb() {
  try { OLD_STORE_KEYS.forEach((k) => localStorage.removeItem(k)); } catch (e) { /* storage terblokir */ }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const ok = parsed && parsed.v === DB_VERSION && ['vendors', 'outbounds', 'pos', 'storages', 'stocks', 'skus', 'hubs', 'clients'].every((k) => Array.isArray(parsed[k])) && parsed.ui && parsed.ui.demo;
      if (ok) { db = parsed; return; }
    }
  } catch (e) { /* data rusak → reseed */ }
  seedAll();
}
