// ── Panel Demo: skrip langkah demi langkah yang membaca state (bukan checklist statis) ──
// Setiap langkah punya tombol "Go there"; artefak demo (vendor, PO, order, …) dicatat di db.ui.demo saat dibuat lewat UI.
const OR_ORDER = ['OPEN', 'PREPARING', 'READY_TO_PICKUP', 'SHIPPED', 'IN_DELIVERY', 'DELIVERED'];
const DEMO_ACTS = [
  { key: 1, title: 'Inbound', sub: 'Vendor → PO + SKU baru → confirm → goods receipt ke location + PDF' },
  { key: 2, title: 'Outbound', sub: 'Order (validasi) → picking FEFO → ready → ship → AWB → delivered' },
  { key: 3, title: 'Transfer', sub: 'Kemang → Blok M: ship → PO transfer terbit → diterima' },
  { key: 4, title: 'Return', sub: 'PO Return → confirm → goods receipt ke karantina' },
];
const gcode = (s) => `<span class="rounded bg-bg-weak-50 px-1 font-mono text-[10.5px] text-text-strong-950">${esc(s)}</span>`;
const gstrong = (s) => `<span class="font-semibold text-text-strong-950">${esc(s)}</span>`;
const orIdx = (o) => (o ? OR_ORDER.indexOf(o.status) : -1);
/** Halaman berikutnya untuk sebuah outbound sesuai statusnya. */
const outboundNextHref = (o) => {
  if (!o) return '#/warehouse/outbound-request';
  const g = giOfOutbound(o);
  if (o.status === 'PREPARING' && g) return '#/warehouse/picking/' + g.id;
  if ((o.status === 'READY_TO_PICKUP' || o.status === 'SHIPPED') && g) return '#/warehouse/shipping/' + g.id;
  return '#/warehouse/outbound-request/' + o.id;
};

function demoSteps() {
  const dm = db.ui.demo;
  const v = dm.vendorId ? vendor(dm.vendorId) : null;
  const p = dm.poId ? po(dm.poId) : null;
  const o = dm.outboundId ? outbound(dm.outboundId) : null;
  const sh = o ? shipmentOf(o) : null;
  const t = dm.transferId ? outbound(dm.transferId) : null;
  const tp = t && t.transferPoId ? po(t.transferPoId) : null;
  const r = dm.returnPoId ? po(dm.returnPoId) : null;
  const ors = dm.skuKey && dm.skuKey.startsWith('21:') ? dm.skuKey.slice(3) : null;
  const orsStock = ors ? availableFor(3, 21, ors) : 0;
  const nav = (label, href) => ({ label, nav: href });
  const go = (label, key) => ({ label, act: 'demoGo', key });
  return [
    // Act 1 — inbound
    { act: 1, title: 'Tambah vendor baru', done: !!v,
      hint: v ? `${gcode(v.code)} · ${esc(v.name)}` : `Supply management → Vendor → ${gstrong('Tambah vendor')}: nama ${gcode('PT Medika Prima Distribusi')}, telepon, NPWP 15/16 digit. Kode ${gcode('VEN…')} otomatis; nama dobel ditolak.`,
      go: go('Buka Vendor', 'vendor') },
    { act: 1, title: 'Create PO Regular + SKU baru di tempat', done: !!p,
      hint: p ? `${gcode(p.code)} · ${esc(poSourceOf(p).value)} · ${p.lines.length} SKU` : `Wizard 3 langkah. ${gstrong('Regular')} · client ${gstrong('SwipeRX')} · hub ${gstrong('Kemang')} · vendor: ketik "Medika". Barang: ${gcode('SRX-MASK-50')} × 100, lalu ${gstrong('+ SKU baru…')} → ${gcode('SRX-ORS-200')} "Oralit sachet 200 ml", box, 1.2 kg → ${gstrong('Simpan SKU & pakai')}, qty 40 → Review → Simpan draft.`,
      go: go('Create PO', 'po') },
    { act: 1, title: 'Confirm PO → inbound request', done: !!(p && p.status === 'CONFIRMED'),
      hint: p && p.status === 'CONFIRMED' ? `Inbound request ${gcode(p.code)} · ${esc(IR_LABEL[p.grStatus])}` : 'Detail PO → Confirm. PO muncul di Inbound request (Scheduled) dan badge sidebar bertambah.',
      go: p ? nav('Buka PO', '#/warehouse/purchase-order/' + p.id) : nav('Purchase order', '#/warehouse/purchase-order') },
    { act: 1, title: 'Goods receipt ke Location + PDF surat jalan', done: !!(dm.grId && gr(dm.grId)),
      hint: dm.grId && gr(dm.grId) ? `${gcode(gr(dm.grId).code)} posted · ${gr(dm.grId).lines.length} lot baru` : `Put-away: ${gcode('SRX-MASK-50')} → ${gstrong('LOC-02 · Zona B (Location)')}, ${gcode('SRX-ORS-200')} → BIN-A3 (split bila perlu). Penerimaan: upload PDF (atau ${gstrong('Pakai PDF contoh')}) → Buka PDF → Review → Submit.`,
      go: p && p.status === 'CONFIRMED' ? nav('Buat goods receipt', '#/warehouse/goods-receipt/new?po=' + p.id) : nav('Goods receipt', '#/warehouse/goods-receipt/new') },
    { act: 1, title: 'Cek Stock: lot baru + ledger INBOUND', done: !!dm.stockSeen,
      hint: 'Storages in use naik; lot di LOC-02 tampil dengan tag Location; ledger menunjuk GR.',
      go: nav('Buka Stock', '#/warehouse/stock') },
    // Act 2 — outbound regular
    { act: 2, title: 'Create outbound Regular — lihat validasi server', done: !!o,
      hint: o ? `${gcode(o.code)} · ${esc(o.recipient.name)}${dm.bounced ? ' · bounce validasi sudah ditunjukkan' : ''}` : `Wizard 4 langkah. Order: client ${gstrong('SwipeRX')}, hub Kemang. Penerima: ${gcode('Apotek Sehat Kemang')}, telepon sengaja ${gcode('12345')}, lat ${gcode('-6.2601')} long ${gcode('106.8129')}. Produk: ${gcode('SRX-PCM-500')} × 60${ors && orsStock ? ` + ${gcode(ors)} × 10` : ''} → Create → server menolak telepon, form ${gstrong('kembali ke langkah Penerima')}. Ganti ${gcode('0812 3456 7890')} → Create.`,
      go: go('Create outbound', 'oo') },
    { act: 2, title: 'Create picking order — FEFO', done: orIdx(o) >= 1,
      hint: `Lot expiry terdekat dulu; expiry sama → ${gstrong('BIN-A1')} (bin) sebelum ${gstrong('LOC-02')} (location). Lot karantina BIN-Q1 (expiry paling dekat) dilewati.`,
      go: nav('Buka order', outboundNextHref(o)) },
    { act: 2, title: 'Assign picker → Pick semua → Ready to pick up', done: orIdx(o) >= 2,
      hint: `Surat jalan ${gcode(`SJ/KMG/${yymm()}/…`)} terbit; print picking list tersedia.`,
      go: nav('Buka picking', outboundNextHref(o)) },
    { act: 2, title: 'Submit shipping → AWB di Shipments', done: orIdx(o) >= 3,
      hint: sh ? `AWB ${gcode(sh.waybill)} · ${esc(SH_LABEL[sh.status])}` : 'Satu langkah: stok dipotong + AWB lahir (At hub). Print surat jalan.',
      go: nav('Buka shipping', outboundNextHref(o)) },
    { act: 2, title: 'Shipments: Dispatch → In delivery → Delivered', done: !!(o && o.status === 'DELIVERED'),
      hint: 'Panel detail shipment → tombol simulasi presenter. Status outbound ikut berubah lewat interface (Shipping & Outbound request).',
      go: sh ? { label: 'Buka shipment', act: 'openShipment', id: sh.id } : nav('Shipments', '#/shipments') },
    // Act 3 — transfer
    { act: 3, title: 'Create outbound Transfer Kemang → Blok M', done: !!t,
      hint: t ? `${gcode(t.code)} · ${esc(hub(t.hubId).code)} → ${esc(hub(t.destHubId).code)}` : `Tipe ${gstrong('Transfer')} · hub asal Kemang · hub tujuan ${gstrong('Blok M')} · client FORE. Penerima diketik manual: ${gcode('Gudang Dash Hub Blok M')}, ${gcode('081299900011')}, lat ${gcode('-6.2441')} long ${gcode('106.7991')}. Produk ${gcode('FORE-CUP-12OZ')} × 20.`,
      go: go('Create transfer', 'tr') },
    { act: 3, title: 'Picking → Ready → Submit shipping', done: orIdx(t) >= 3,
      hint: 'Sama seperti Regular. Saat submit shipping, AWB lahir dan PO transfer terbit di hub tujuan.',
      go: nav('Lanjutkan', outboundNextHref(t)) },
    { act: 3, title: 'PO Transfer terbit di Blok M', done: !!(tp && (dm.trPoSeen || dm.transferGrId)),
      hint: tp ? `${gcode(tp.code)} · Confirmed · ${esc(IR_LABEL[tp.grStatus])} · hub asal Kemang` : 'Muncul otomatis (Confirmed, receipt Scheduled) + event di timeline outbound.',
      go: tp ? nav('Buka PO transfer', '#/warehouse/purchase-order/' + tp.id) : nav('Purchase order', '#/warehouse/purchase-order') },
    { act: 3, title: 'Goods receipt PO transfer di Blok M', done: !!dm.transferGrId,
      hint: 'Put-away ke storage Blok M (mis. LOC-02 · Lantai transit). Timeline outbound transfer mencatat "Diterima di Dash Hub Blok M".',
      go: tp && tp.grStatus !== 'FINISHED' ? nav('Terima barang', '#/warehouse/goods-receipt/new?po=' + tp.id) : nav('Goods receipt', '#/warehouse/goods-receipt') },
    // Act 4 — return
    { act: 4, title: 'Create PO Return', done: !!r,
      hint: r ? `${gcode(r.code)} · diterima dari ${esc(r.returnedFrom)}` : `Tipe ${gstrong('Return')} · client FORE · hub Kemang · diterima dari ${gcode('Fore Coffee Kemang Raya (retur)')} · ${gcode('FORE-BEAN-1KG')} × 5. (Transfer tidak bisa dipilih — terbit otomatis.)`,
      go: go('Create PO Return', 'ret') },
    { act: 4, title: 'Confirm → goods receipt ke Karantina', done: !!dm.returnGrId,
      hint: `Storage default ${gstrong('LOC-03 · Karantina (Location, Quarantine)')} — stok karantina tidak ikut alokasi FEFO (Available "ditahan" di Stock).`,
      go: r && r.status === 'DRAFT' ? nav('Buka PO', '#/warehouse/purchase-order/' + r.id) : r ? nav('Terima barang', '#/warehouse/goods-receipt/new?po=' + r.id) : nav('Purchase order', '#/warehouse/purchase-order') },
  ];
}
function renderGuide() {
  const steps = demoSteps();
  const doneAll = steps.filter((s) => s.done).length;
  if (!db.ui.guideOpen) {
    return `<button type="button" data-act="guideToggle" class="fixed bottom-5 right-5 z-40 inline-flex h-10 items-center gap-2 rounded-full bg-bg-strong-950 px-4 text-sm font-medium text-text-white-0 shadow-custom-shadows-large hover:bg-bg-strong-950/90">${ic('r:RiPresentationLine', 'size-4')}Demo script · ${doneAll}/${steps.length}</button>`;
  }
  const act = db.ui.guideAct || 1;
  const actSteps = steps.filter((s) => s.act === act);
  const firstOpen = actSteps.findIndex((s) => !s.done);
  const flow = actSteps.map((s, i) => {
    const state = s.done ? 'done' : i === firstOpen ? 'current' : 'pending';
    const g = s.go;
    const goBtn = g && !s.done ? `<div class="mt-1.5">${btn({ label: g.label, size: 'xs', tone: state === 'current' ? 'primary' : 'neutral', style: state === 'current' ? 'filled' : 'stroke', icon: 'r:RiArrowRightLine', nav: g.nav, act: g.act, data: { 'data-key': g.key, 'data-id': g.id } })}</div>` : '';
    return { title: s.title, desc: s.hint, state, extra: goBtn };
  });
  const actDone = (k) => steps.filter((s) => s.act === k && s.done).length;
  const actTotal = (k) => steps.filter((s) => s.act === k).length;
  const next = DEMO_ACTS.find((a) => a.key === act + 1);
  const meta = DEMO_ACTS.find((a) => a.key === act);
  const bonus = act === 2 ? (() => {
    const sf = db.ui.refs.shortfallId ? outbound(db.ui.refs.shortfallId) : null;
    const rd = db.outbounds.find((x) => x.status === 'READY_TO_PICKUP' && x.id !== db.ui.demo.outboundId && x.id !== db.ui.demo.transferId);
    const item = (label, sub, attrsHtml) => `<button type="button" ${attrsHtml} class="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-bg-weak-50"><span><span class="font-semibold">${esc(label)}</span> · ${sub}</span>${ic('r:RiArrowRightSLine', 'size-4 shrink-0 text-icon-soft-400')}</button>`;
    return `<div class="mt-3 border-t border-stroke-soft-200 pt-3"><p class="label-eyebrow mb-1.5">Bonus edge case</p>
      ${sf && sf.status === 'OPEN' ? item('Stok tidak cukup', `${esc(sf.externalId)} → Create picking (422, tanpa reserve)`, `data-nav="#/warehouse/outbound-request/${sf.id}"`) : ''}
      ${item('Upload CSV dengan error', 'preview per baris, all-or-nothing', 'data-act="demoGo" data-key="csv"')}
      ${rd ? item('Cancel sebelum shipping', `${esc(rd.externalId)} · reserve dilepas`, `data-nav="#/warehouse/outbound-request/${rd.id}"`) : ''}
    </div>`;
  })() : '';
  const full = !!db.ui.guideFull;
  const doneBox = firstOpen < 0
    ? (next
      ? `<div class="mt-2 flex items-center justify-between gap-2 rounded-xl bg-(--state-success-lighter) px-3 py-2"><span class="text-[12px] font-medium text-(--state-success-dark)">Act ${act} selesai</span>${btn({ label: `Lanjut Act ${next.key} · ${next.title}`, size: 'xs', icon: 'r:RiArrowRightLine', act: 'guideAct', data: { 'data-key': next.key } })}</div>`
      : `<div class="mt-2 rounded-xl bg-(--state-success-lighter) px-3 py-2 text-[12px] font-medium text-(--state-success-dark)">Semua act selesai — alur end-to-end terbukti.</div>`)
    : '';
  const cur = firstOpen >= 0 ? actSteps[firstOpen] : null;
  const dots = `<div class="flex items-center gap-1">${actSteps.map((x, i) => `<span class="h-1.5 flex-1 rounded-full ${x.done ? 'bg-(--state-success-base)' : i === firstOpen ? 'bg-(--theme-accent-base)' : 'bg-bg-soft-200'}"></span>`).join('')}</div>`;
  const miniBody = cur
    ? `<div class="flex flex-col gap-1.5"><div class="flex items-center justify-between"><p class="label-eyebrow">Langkah ${firstOpen + 1}/${actSteps.length} · Act ${act}</p></div>${dots}<p class="mt-1 text-[13px] font-semibold tracking-tight text-text-strong-950">${esc(cur.title)}</p><p class="text-[11.5px] leading-relaxed text-text-sub-600">${cur.hint}</p>${flow[firstOpen].extra}</div>`
    : `${dots}${doneBox}`;
  return `<div class="${cx('fixed bottom-5 right-5 z-40 flex max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-large', full ? 'w-[380px]' : 'w-[340px]', ANIM.guide ? 'mk-anim-in' : '')}" data-panel="demo" data-mode="${full ? 'full' : 'mini'}">
    <div class="flex items-center justify-between gap-2 border-b border-stroke-soft-200 px-4 py-2.5">
      <div class="min-w-0"><p class="label-eyebrow"><span class="text-accent font-bold mr-2">●</span>Demo · ${doneAll}/${steps.length} langkah</p>${full ? '<p class="mt-1 text-[15px] font-bold tracking-tight">Demo script</p>' : ''}</div>
      <div class="flex items-center gap-0.5">${btn({ size: 'icon-xs', tone: 'neutral', style: 'ghost', icon: full ? 'r:RiArrowDownSLine' : 'r:RiFileList3Line', title: full ? 'Ringkas: langkah aktif saja' : 'Lihat semua langkah', act: 'guideSize' })}${btn({ size: 'icon-xs', tone: 'neutral', style: 'ghost', icon: 'r:RiCloseLine', title: 'Kecilkan panel demo', act: 'guideToggle' })}</div>
    </div>
    <div class="grid grid-cols-4 gap-1 border-b border-stroke-soft-200 px-2 py-1.5">${DEMO_ACTS.map((a) => {
      const on = a.key === act;
      const fin = actDone(a.key) === actTotal(a.key);
      return `<button type="button" data-act="guideAct" data-key="${a.key}" title="${esc(a.sub)}" class="${cx('flex flex-col items-start rounded-lg px-2 py-1 text-left transition-colors', on ? 'bg-bg-strong-950 text-text-white-0' : 'hover:bg-bg-weak-50 text-text-sub-600')}"><span class="whitespace-nowrap text-[11.5px] font-semibold leading-tight">${a.key} · ${esc(a.title)}</span><span class="text-[10px] tabular-nums ${on ? 'opacity-80' : fin ? 'text-(--state-success-dark)' : ''}">${fin ? '✓ ' : ''}${actDone(a.key)}/${actTotal(a.key)}</span></button>`;
    }).join('')}</div>
    <div class="${cx('overflow-y-auto px-4 py-3', full ? 'max-h-[48vh]' : 'max-h-[34vh]')}" id="guide-body">
      ${full ? `<p class="mb-3 ${metaCls}">${esc(meta.sub)}</p>${flowSteps(flow)}${doneBox}${bonus}` : miniBody}
    </div>
    <div class="flex items-center justify-between gap-2 border-t border-stroke-soft-200 bg-bg-weak-50 px-4 py-2">${full ? `<span class="${metaCls}">State tersimpan di browser ini</span>` : `<button type="button" data-act="guideSize" class="text-[12px] font-semibold text-accent hover:underline">Lihat semua langkah${act === 2 ? ' + bonus' : ''}</button>`}${btn({ label: 'Reset demo data', icon: 'r:RiRestartLine', size: 'xs', tone: 'neutral', style: 'stroke', act: 'resetDemoAsk' })}</div>
  </div>`;
}
