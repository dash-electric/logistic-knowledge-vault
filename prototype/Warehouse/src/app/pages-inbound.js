// ── Supply management › Purchase order, Inbound management › Inbound request & Goods receipt ──
const poQty = (x) => `<span class="text-[13px] tabular-nums text-text-sub-600">${x.lines.length} / ${fmtQty(sum(x.lines.map((l) => l.qty)))}</span>`;
const receivedCell = (x) => {
  const exp = sum(x.lines.map((l) => l.qty));
  const rec = sum(x.lines.map((l) => l.received));
  const pct = exp ? Math.round((rec / exp) * 100) : 0;
  return `<div class="flex min-w-[120px] flex-col gap-1"><span class="font-mono text-[12px] tabular-nums text-text-strong-950">${fmtQty(rec)} / ${fmtQty(exp)}</span><span class="h-1 w-full overflow-hidden rounded-full bg-bg-soft-200"><span class="block h-full rounded-full bg-bg-strong-950" style="width:${pct}%"></span></span></div>`;
};
/** Vendor (nama + kode) · "Hub asal: X" + link outbound · "Diterima dari: X". */
const poSourceCell = (x) => {
  const s = poSourceOf(x);
  if (x.type === 'REGULAR') return `<div><p class="${nameCls}">${esc(s.value)}</p>${s.sub ? `<p class="${metaCls} font-mono">${esc(s.sub)}</p>` : ''}</div>`;
  const o = x.transferOutboundId ? outbound(x.transferOutboundId) : null;
  return `<div><p class="${nameCls}">${esc(s.label)}: ${esc(s.value)}</p>${o ? `<button type="button" data-nav="#/warehouse/outbound-request/${o.id}" class="font-mono text-[11px] text-accent hover:underline">${esc(o.code)}</button>` : ''}</div>`;
};
const poSourceKvs = (x) => {
  const s = poSourceOf(x);
  const v = x.type === 'REGULAR' ? vendor(x.vendorId) : null;
  const o = x.transferOutboundId ? outbound(x.transferOutboundId) : null;
  return kv('Tipe PO', poTypeTag(x.type)) + kv(s.label, esc(s.value), s.sub ? `<span class="font-mono">${esc(s.sub)}</span>${v && v.status !== 'ACTIVE' ? ' · nonaktif' : ''}` : null) + (v && v.picName ? kv('PIC vendor', esc(v.picName), v.picPhone ? `<span class="font-mono">${esc(v.picPhone)}</span>` : null) : '') + (x.type === 'TRANSFER' ? kv('Outbound transfer', o ? docLink('#/warehouse/outbound-request/' + o.id, o.code) : null) : '');
};

/* ───────────── Purchase order ───────────── */
const markTransferPoSeen = (x) => {
  const t = db.ui.demo.transferId ? outbound(db.ui.demo.transferId) : null;
  if (t && t.transferPoId === x.id && !db.ui.demo.trPoSeen) { db.ui.demo.trPoSeen = true; save(); }
};
const PO_TABS = ['ALL', 'DRAFT', 'CONFIRMED', 'CANCELLED'];
function pagePoList() {
  const all = db.pos.filter(inHub);
  const tab = view.tab.po || 'ALL';
  const q = (view.search.po || '').toLowerCase();
  const typ = view.search.poType || '';
  const rows = all.filter((x) => tab === 'ALL' || x.status === tab).filter((x) => !typ || x.type === typ).filter((x) => !q || [x.code, x.supplier, poSourceOf(x).value, poSourceOf(x).sub, client(x.clientId).name].join(' ').toLowerCase().includes(q));
  const cols = [
    { key: 'code', title: 'PO number', render: (x) => `<span class="${codeCls}">${esc(x.code)}</span>` },
    { key: 'type', title: 'Tipe', render: (x) => poTypeTag(x.type) },
    { key: 'client', title: 'Client', render: (x) => `<span class="${nameCls}">${esc(client(x.clientId).name)}</span>` },
    { key: 'source', title: 'Sumber', render: poSourceCell },
    { key: 'hub', title: 'Hub tujuan', render: (x) => `<span class="${nameCls}">${esc(hub(x.hubId).name)}</span>` },
    { key: 'eta', title: 'Est. arrival', render: (x) => `<span class="${dateCls}">${fmtDateTime(x.estArrival)}</span>` },
    { key: 'lines', title: 'Lines / qty', align: 'right', render: poQty },
    { key: 'gr', title: 'Receiving', render: (x) => (x.grStatus ? irBadge(x.grStatus) : dash) },
    { key: 'status', title: 'Status', render: (x) => poBadge(x.status) },
    { key: 'by', title: 'Created by', render: (x) => `<span class="${metaCls}">${esc(x.createdBy)}</span>` },
    { key: 'actions', title: '', align: 'right', render: (x) => rowMenu('po:' + x.id) },
  ];
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Supply management', title: 'Purchase order', desc: 'Rencana barang masuk ke hub: <span class="font-medium text-text-strong-950">Regular</span> dari vendor, <span class="font-medium text-text-strong-950">Return</span> dari penerima yang mengembalikan barang, dan <span class="font-medium text-text-strong-950">Transfer</span> yang terbit otomatis dari outbound transfer hub lain. Confirm menerbitkan inbound request.', actions: headerActions(btn({ label: 'Create PO', icon: 'r:RiAddLine', act: 'openCreatePo' })) })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-1 pb-3 lg:flex-row lg:items-end lg:justify-between lg:pb-0">
        ${tabsLine(tabsWithCounts(PO_TABS, all, (x) => x.status, PO_LABEL), tab, 'tabPo')}
        <div class="flex flex-1 items-center justify-end gap-2 lg:py-2">${typeFilter('search.poType', typ, PO_TYPES, PO_TYPE_META)}${searchField({ model: 'search.po', value: view.search.po, placeholder: 'Search PO, vendor, sumber, client…', cls: 'max-w-xs flex-1' })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, rowNav: (x) => '#/warehouse/purchase-order/' + x.id, emptyTitle: 'Tidak ada PO', emptyDesc: 'Ubah filter atau buat PO baru.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuPo(x) {
  return [
    menuItem({ label: 'View details', icon: 'r:RiEyeLine', nav: '#/warehouse/purchase-order/' + x.id }),
    x.status === 'DRAFT' ? menuItem({ label: 'Confirm PO', icon: 'r:RiCheckLine', act: 'confirmPo', data: { 'data-id': x.id } }) : '',
    x.status === 'CONFIRMED' && x.grStatus !== 'FINISHED' ? menuItem({ label: 'Buat goods receipt', icon: 'r:RiInboxArchiveLine', nav: '#/warehouse/goods-receipt/new?po=' + x.id }) : '',
    x.status !== 'CANCELLED' ? menuItem({ label: 'Print PO', icon: 'r:RiPrinterLine', act: 'openPrint', data: { 'data-kind': 'po', 'data-id': x.id } }) : '',
    !poCancelBlock(x) ? menuItem({ label: 'Cancel PO', icon: 'r:RiCloseCircleLine', act: 'openCancelPo', data: { 'data-id': x.id }, destructive: true }) : '',
  ].join('');
}
function poFlow(x) {
  if (x.type === 'TRANSFER') {
    return [
      { title: 'Terbit otomatis · Confirmed', desc: 'Dari submit shipping outbound transfer di hub asal', state: 'done' },
      { title: 'Barang dalam perjalanan', desc: 'Mengikuti shipment AWB', state: x.grStatus === 'SCHEDULED' ? 'current' : 'done' },
      { title: 'Goods receipt di hub tujuan', desc: 'Put-away ke storage, lot terbit, stok naik', state: x.grStatus === 'PARTIAL_RECEIPT' ? 'current' : x.grStatus === 'FINISHED' ? 'done' : 'pending' },
      { title: 'Finished', desc: 'Semua qty diterima / sisa ditutup', state: x.grStatus === 'FINISHED' ? 'done' : 'pending' },
    ];
  }
  return [
    { title: 'Draft', desc: 'PO dibuat ops', state: x.status === 'DRAFT' ? 'current' : x.status === 'CANCELLED' ? 'failed' : 'done' },
    { title: 'Confirmed · inbound request', desc: 'Menunggu barang datang', state: x.status === 'CONFIRMED' ? (x.grStatus === 'SCHEDULED' ? 'current' : 'done') : 'pending' },
    { title: 'Goods receipt', desc: 'Put-away ke storage, lot terbit, stok naik', state: x.grStatus === 'PARTIAL_RECEIPT' ? 'current' : x.grStatus === 'FINISHED' ? 'done' : 'pending' },
    { title: 'Finished', desc: 'Semua qty diterima / sisa ditutup', state: x.grStatus === 'FINISHED' ? 'done' : 'pending' },
  ];
}
function pagePoDetail(id) {
  const x = po(id);
  if (!x) return notFoundPage('Purchase order', '#/warehouse/purchase-order');
  markTransferPoSeen(x);
  const cols = [
    { key: 'sku', title: 'SKU', render: (l) => `<span class="${codeCls}">${esc(l.sku)}</span>` },
    { key: 'name', title: 'Product name', render: (l) => `<span class="${nameCls}">${esc(skuName(x.clientId, l.sku))}</span>` },
    { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(skuUom(x.clientId, l.sku))}</span>` },
    { key: 'qty', title: 'Qty', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qty)}</span>` },
    { key: 'rec', title: 'Received', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.received)}</span>` },
    { key: 'rem', title: 'Remaining', align: 'right', render: (l) => `<span class="font-mono text-[12px] font-semibold tabular-nums ${l.qty - l.received > 0 ? 'text-text-strong-950' : 'text-text-soft-400'}">${fmtQty(Math.max(0, l.qty - l.received))}</span>` },
  ];
  const actions = [
    x.status !== 'CANCELLED' ? btn({ label: 'Print PO', icon: 'r:RiPrinterLine', tone: 'neutral', style: 'stroke', act: 'openPrint', data: { 'data-kind': 'po', 'data-id': x.id } }) : '',
    !poCancelBlock(x) ? btn({ label: 'Cancel PO', tone: 'destructive', style: 'stroke', act: 'openCancelPo', data: { 'data-id': x.id } }) : '',
    x.status === 'DRAFT' ? btn({ label: 'Confirm', icon: 'r:RiCheckLine', act: 'confirmPo', data: { 'data-id': x.id } }) : '',
    x.status === 'CONFIRMED' ? btn({ label: 'Lihat inbound request', icon: 'r:RiInboxArchiveLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/inbound-request/' + x.id }) : '',
    x.status === 'CONFIRMED' && x.grStatus !== 'FINISHED' ? btn({ label: 'Buat goods receipt', icon: 'r:RiAddLine', nav: '#/warehouse/goods-receipt/new?po=' + x.id }) : '',
  ].join('');
  return `<div class="space-y-5 p-6">
    ${detailHeader({ backLabel: 'Purchase order', backHref: '#/warehouse/purchase-order', meta: `Dibuat ${fmtDateTime(x.createdAt)} · oleh <span class="font-semibold text-text-sub-600">${esc(x.createdBy)}</span>${x.confirmedAt ? ` · confirmed ${fmtDateTime(x.confirmedAt)}` : ''}`, title: x.code, badges: `${poBadge(x.status)}${x.grStatus ? irBadge(x.grStatus) : ''}${poTypeTag(x.type)}`, actions })}
    ${x.status === 'CANCELLED' ? alertBox('warning', 'PO dibatalkan', `${esc(x.cancelReason || '—')} · ${fmtDateTime(x.cancelledAt)}`) : ''}
    ${x.status === 'DRAFT' ? alertBox('information', 'Draft — belum terlihat di gudang', 'Confirm untuk menerbitkan inbound request (receipt Scheduled).') : ''}
    ${x.type === 'TRANSFER' && x.transferOutboundId ? alertBox('information', `Terbit otomatis dari ${outbound(x.transferOutboundId).code}`, `Shipping di ${esc(hub(x.sourceHubId).name)} sudah di-submit. Terima barangnya di ${esc(hub(x.hubId).name)} lewat goods receipt.`) : ''}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-5 xl:col-span-2">
        ${section('Detail purchase', table({ columns: cols, rows: x.lines }))}
        ${section('Goods receipt', grsOf(x.id).length ? grTable(grsOf(x.id)) : `<p class="${metaCls}">Belum ada goods receipt.</p>`)}
      </div>
      <div class="flex flex-col gap-5">
        ${section('Info', kv('Client', esc(client(x.clientId).name)) + poSourceKvs(x) + kv('Hub tujuan', esc(hub(x.hubId).name), esc(hub(x.hubId).address)) + kv('Est. arrival', fmtDateTime(x.estArrival)) + (x.notes ? kv('Catatan', esc(x.notes)) : ''))}
        ${section('Alur inbound', flowSteps(poFlow(x)))}
      </div>
    </div>
  </div>`;
}
function modalCancelPo(id) {
  const x = po(id);
  return formModal({
    icon: 'r:RiCloseCircleLine', iconTone: 'danger', title: 'Cancel purchase order?', desc: `${x.code} · ${PO_TYPE_META[x.type].label} · ${poSourceOf(x).value}`,
    body: `<div class="flex flex-col gap-3"><p class="text-sm text-text-sub-600">${x.status === 'CONFIRMED' ? 'Inbound request ikut hilang dari antrian goods receipt.' : 'PO draft tidak akan bisa di-confirm lagi.'}</p>${field('Alasan', textarea({ model: 'draft.poCancelReason', value: view.draft.poCancelReason || '', rows: 2, placeholder: 'mis. vendor tidak bisa kirim', label: 'Alasan cancel PO' }), null, { optional: true })}</div>`,
    footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: 'Cancel PO', tone: 'destructive', act: 'cancelPoConfirm', data: { 'data-id': x.id } })}`,
  });
}

/* ───────────── Modal: Create PO — wizard Info PO → Barang → Review ───────────── */
const PO_STEPS = ['Info PO', 'Barang', 'Review'];
const NEW_SKU = '__new__';
function poDefaults() {
  const d = view.draft;
  if (d.poInit) return;
  Object.assign(d, { poInit: true, poStep: 1, poType: 'REGULAR', poClient: '', poHub: db.ui.hubId === 'all' ? 3 : Number(db.ui.hubId), poVendor: '', poVendorOpen: false, poVendorQ: '', poReturnedFrom: '', poEta: dayIso(3), poNotes: '', poLines: [{ sku: '', qty: '' }], poErrors: null, poSku: null, poSkuLine: null });
}
const poFilledLines = () => view.draft.poLines.filter((l) => l.sku || String(l.qty).trim() !== '');
function poLocalCheck(step) {
  const d = view.draft;
  const out = [];
  const add = (field, message, line) => out.push({ field, message, line, step });
  if (step === 1) {
    if (!d.poClient) add('client', 'Client wajib dipilih.');
    if (!d.poHub) add('hub', 'Hub tujuan wajib dipilih.');
    if (d.poType === 'REGULAR' && !d.poVendor) add('vendor', 'Vendor wajib dipilih.');
    if (d.poType === 'RETURN' && !String(d.poReturnedFrom).trim()) add('returned_from', 'Diterima dari wajib diisi.');
  }
  if (step === 2) {
    if (d.poSku) add('lines', 'Simpan atau tutup panel SKU baru dulu.');
    if (!poFilledLines().length) add('lines', 'Minimal satu baris SKU.');
    d.poLines.forEach((l, i) => {
      if (!l.sku && String(l.qty).trim() === '') return;
      if (!l.sku) add('sku', `Baris ${i + 1}: SKU wajib dipilih.`, i);
      if (!(Number(l.qty) > 0)) add('qty', `Baris ${i + 1}: qty harus > 0.`, i);
    });
  }
  return out;
}
function vendorPicker(d, invalid) {
  const v = d.poVendor ? vendor(d.poVendor) : null;
  const q = String(d.poVendorQ || '').toLowerCase();
  const actives = db.vendors.filter((x) => x.status === 'ACTIVE');
  const hits = actives.filter((x) => !q || [x.name, x.code, x.picName].join(' ').toLowerCase().includes(q));
  const inactive = db.vendors.length - actives.length;
  const trigger = `<button type="button" data-act="poVendorToggle" aria-expanded="${!!d.poVendorOpen}" aria-label="Pilih vendor" class="${cx(INPUT_ROOT, invalid ? INPUT_BAD : INPUT_OK, INPUT_SIZE.md, 'justify-between text-left')}">${v ? `<span class="min-w-0 truncate text-text-strong-950">${esc(v.name)} <span class="font-mono text-[11px] text-text-sub-600">· ${esc(v.code)}</span></span>` : '<span class="text-text-soft-400">Cari & pilih vendor aktif…</span>'}<span class="text-icon-soft-400">${ic(d.poVendorOpen ? 'r:RiCloseLine' : 'r:RiSearchLine', 'size-4')}</span></button>`;
  if (!d.poVendorOpen) return trigger;
  return `${trigger}<div class="mt-1.5 overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-medium">
    <div class="border-b border-stroke-soft-200 p-2">${input({ model: 'draft.poVendorQ', value: d.poVendorQ, placeholder: 'Ketik nama / kode / PIC…', icon: 'r:RiSearchLine', size: 'sm', rerender: 'debounce', label: 'Cari vendor' })}</div>
    <div class="max-h-[200px] overflow-y-auto p-1">${hits.length ? hits.map((x) => `<button type="button" data-act="poPickVendor" data-id="${x.id}" class="${cx(MENU_ITEM, 'justify-between', d.poVendor === x.id ? 'bg-bg-weak-50' : '')}"><span class="min-w-0"><span class="block truncate font-medium">${esc(x.name)}</span><span class="block font-mono text-[11px] text-text-sub-600">${esc(x.code)}${x.picName ? ` · ${esc(x.picName)}` : ''}</span></span>${d.poVendor === x.id ? ic('r:RiCheckLine', 'size-4 text-accent') : ''}</button>`).join('') : `<p class="px-2 py-3 text-center ${metaCls}">Tidak ada vendor aktif yang cocok.</p>`}</div>
    <div class="flex items-center justify-between border-t border-stroke-soft-200 bg-bg-weak-50 px-3 py-1.5"><span class="${metaCls}">${hits.length} vendor aktif${inactive ? ` · ${inactive} nonaktif disembunyikan` : ''}</span><button type="button" data-act="poVendorManage" class="text-[11px] font-semibold text-accent hover:underline">Kelola vendor</button></div>
  </div>`;
}
function modalCreatePo() {
  poDefaults();
  const d = view.draft;
  const step = d.poStep;
  const cid = Number(d.poClient) || null;
  const c = cid ? client(cid) : null;
  const errs = d.poErrors || [];
  const errOf = (f) => { const e = errs.find((x) => x.field === f && x.line == null); return e ? e.message : null; };
  const errSteps = new Set(errs.map((e) => e.step));
  let body = '';
  if (step === 1) {
    body = `<div class="flex flex-col gap-4">
      ${field('Tipe PO', segmented({ label: 'Tipe PO', act: 'poType', value: d.poType, options: PO_TYPES.map((t) => ({ value: t, label: PO_TYPE_META[t].label, icon: PO_TYPE_META[t].icon, disabled: t === 'TRANSFER', title: t === 'TRANSFER' ? 'Terbit otomatis dari outbound transfer' : undefined })) }), `${d.poType === 'RETURN' ? 'Barang kembali dari penerima (retur) — biasanya diterima ke Karantina. ' : 'Pembelian dari vendor. '}<span class="text-text-soft-400">Transfer tidak bisa dipilih: PO transfer terbit otomatis dari outbound transfer di hub asal.</span>`, { required: true, error: errOf('type') })}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field('Client', select({ model: 'draft.poClient', value: d.poClient, placeholder: 'Pilih client', options: clientOptions(), onChange: 'poClientChange', invalid: !!errOf('client'), label: 'Client PO' }), null, { required: true, error: errOf('client') })}
        ${field('Hub tujuan', select({ model: 'draft.poHub', value: d.poHub, options: hubOptions(), onChange: 'rerender', invalid: !!errOf('hub'), label: 'Hub tujuan PO' }), null, { required: true, error: errOf('hub') })}
      </div>
      ${d.poType === 'REGULAR'
        ? field('Vendor', vendorPicker(d, !!errOf('vendor')), 'Hanya vendor aktif. Belum ada? Tambah di menu Vendor.', { required: true, error: errOf('vendor') })
        : field('Diterima dari', input({ model: 'draft.poReturnedFrom', value: d.poReturnedFrom, placeholder: 'mis. Fore Coffee Kemang (retur)', icon: 'r:RiArrowGoBackLine', invalid: !!errOf('returned_from'), label: 'Diterima dari' }), 'Siapa yang mengembalikan barang.', { required: true, error: errOf('returned_from') })}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field('Est. arrival', input({ type: 'date', model: 'draft.poEta', value: d.poEta, invalid: !!errOf('est_arrival'), label: 'Est. arrival' }), null, { optional: true, error: errOf('est_arrival') })}
        ${field('Catatan', input({ model: 'draft.poNotes', value: d.poNotes, placeholder: 'opsional', label: 'Catatan PO' }), null, { optional: true })}
      </div>
    </div>`;
  } else if (step === 2) {
    const opts = cid ? skuOptions(cid) : [];
    const used = new Set(d.poLines.map((l) => l.sku).filter(Boolean));
    const row = (l, i) => {
      const lineErr = errs.find((x) => x.line === i);
      const k = l.sku ? skuOf(cid, l.sku) : null;
      return `<div class="flex flex-col gap-1"><div class="grid grid-cols-[minmax(0,1fr)_120px_32px] items-center gap-2">
        ${select({ model: `draft.poLines.${i}.sku`, value: l.sku, placeholder: cid ? 'Pilih SKU' : 'Pilih client dulu', options: [...opts.map((o) => ({ ...o, disabled: o.value !== l.sku && used.has(o.value) })), { value: NEW_SKU, label: '+ SKU baru…' }], onChange: 'poLineSku', data: { 'data-i': i }, disabled: !cid, invalid: !!lineErr, label: `SKU baris ${i + 1}` })}
        ${input({ type: 'number', model: `draft.poLines.${i}.qty`, value: l.qty, placeholder: 'Qty', min: 1, step: 'any', suffix: k ? k.uom : '', invalid: !!lineErr, label: `Qty baris ${i + 1}` })}
        ${btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiDeleteBinLine', title: 'Hapus baris', act: 'poDelLine', data: { 'data-i': i }, disabled: d.poLines.length === 1 })}
      </div>${lineErr ? `<p role="alert" class="text-[11px] text-(--state-error-base)">${esc(lineErr.message)}</p>` : ''}${d.poSku && d.poSkuLine === i ? skuInlinePanel(d, c) : ''}</div>`;
    };
    body = `<div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2"><p class="label-eyebrow">Barang · ${esc(c ? c.name : '—')} → ${esc(hub(d.poHub).name)}</p><div class="flex items-center gap-1.5">${btn({ label: 'SKU baru', icon: 'r:RiBarcodeLine', size: 'xs', tone: 'neutral', style: 'stroke', act: 'poNewSku', disabled: !cid || !!d.poSku })}${btn({ label: 'Tambah baris', icon: 'r:RiAddLine', size: 'xs', tone: 'neutral', style: 'stroke', act: 'poAddLine', disabled: !cid })}</div></div>
      <div class="grid grid-cols-[minmax(0,1fr)_120px_32px] gap-2 px-0.5 text-[11px] font-medium text-text-soft-400"><span>SKU</span><span>Qty</span><span></span></div>
      ${d.poLines.map(row).join('')}
      ${errOf('lines') ? `<p role="alert" class="text-xs text-(--state-error-base)">${esc(errOf('lines'))}</p>` : ''}
      <p class="${metaCls}">SKU belum ada di katalog ${esc(c ? c.name : 'client')}? Pilih <span class="font-medium text-text-strong-950">+ SKU baru…</span> di select baris (atau tombol SKU baru) — langsung masuk katalog dan terpilih di baris.</p>
    </div>`;
  } else {
    const lines = poFilledLines();
    const v = d.poVendor ? vendor(d.poVendor) : null;
    body = `<div class="flex flex-col gap-4">
      ${kvGrid([
        ['Tipe PO', poTypeTag(d.poType)], ['Client', c ? esc(c.name) : null], ['Hub tujuan', esc(hub(d.poHub).name)],
        d.poType === 'REGULAR' ? ['Vendor', v ? `${esc(v.name)} <span class="font-mono text-text-sub-600">· ${esc(v.code)}</span>` : null] : ['Diterima dari', esc(String(d.poReturnedFrom).trim())],
        ['Est. arrival', d.poEta ? fmtDate(d.poEta) : null], ['Catatan', String(d.poNotes).trim() ? esc(d.poNotes.trim()) : null],
        ['Total', `${lines.length} SKU · ${fmtQty(sum(lines.map((l) => Number(l.qty) || 0)))} unit`],
      ])}
      ${table({ columns: [
        { key: 'sku', title: 'SKU', render: (l) => `<span class="${codeCls}">${esc(l.sku)}</span>${db.ui.demo.skuKey === `${cid}:${l.sku}` ? ` <span class="ml-1">${tag('SKU baru', 'accent')}</span>` : ''}` },
        { key: 'name', title: 'Nama item', render: (l) => `<span class="${nameCls}">${esc(skuName(cid, l.sku))}</span>` },
        { key: 'qty', title: 'Qty', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(Number(l.qty))}</span> <span class="${metaCls}">${esc(skuUom(cid, l.sku))}</span>` },
      ], rows: lines })}
      <p class="${metaCls}">PO lahir sebagai <span class="font-medium text-text-strong-950">Draft</span>. Confirm di halaman detail menerbitkan inbound request.</p>
    </div>`;
  }
  return formModal({
    width: 'max-w-2xl', icon: 'l:shopping-cart', title: 'Create purchase order', desc: 'PO lahir sebagai Draft; Confirm menerbitkan inbound request.',
    body: `<div class="flex flex-col gap-5">${stepIndicator(PO_STEPS, step, { errorSteps: errSteps, gotoAct: 'poGoto' })}${wizardErrors(errs, PO_STEPS, step)}${body}</div>`,
    footer: wizardFooter({ step, total: PO_STEPS.length, cancelAct: 'closeModal', backAct: 'poBack', nextAct: 'poNext', submitAct: 'submitCreatePo', submitLabel: 'Simpan draft' }),
  });
}
function skuInlinePanel(d, c) {
  return `<div class="mt-1 flex flex-col gap-3 rounded-lg border border-stroke-soft-200 bg-bg-weak-50 p-3" data-panel="inline-sku">
    <div class="flex items-start justify-between gap-2"><div><p class="text-sm font-medium text-text-strong-950">SKU baru · ${esc(c ? c.name : '')}</p><p class="${metaCls}">Langsung masuk katalog client (tetap ada walau PO batal disimpan), lalu terpilih di baris ini.</p></div>${btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiCloseLine', title: 'Tutup SKU baru', act: 'poSkuCancel' })}</div>
    ${d.poSku.errors && d.poSku.errors.length ? alertBox('error', null, d.poSku.errors.map((e) => esc(e.message)).join(' ')) : ''}
    ${skuFields('poSku', d.poSku)}
    <div class="flex items-center justify-end gap-2">${btn({ label: 'Batal', size: 'sm', tone: 'neutral', style: 'stroke', act: 'poSkuCancel' })}${btn({ label: 'Simpan SKU & pakai', icon: 'r:RiCheckLine', size: 'sm', act: 'poSkuSave' })}</div>
  </div>`;
}

/* ───────────── Inbound request (= PO confirmed, dilihat dari sisi gudang) ───────────── */
const IR_TABS = ['ALL', 'SCHEDULED', 'PARTIAL_RECEIPT', 'FINISHED'];
function pageInboundList() {
  const all = db.pos.filter(inHub).filter((x) => x.status === 'CONFIRMED');
  const tab = view.tab.ir || 'ALL';
  const q = (view.search.ir || '').toLowerCase();
  const typ = view.search.irType || '';
  const rows = all.filter((x) => tab === 'ALL' || x.grStatus === tab).filter((x) => !typ || x.type === typ).filter((x) => !q || [x.code, x.supplier, poSourceOf(x).value, client(x.clientId).name].join(' ').toLowerCase().includes(q)).sort((a, b) => (a.confirmedAt < b.confirmedAt ? 1 : -1));
  const cols = [
    { key: 'code', title: 'PO number', render: (x) => `<span class="${codeCls}">${esc(x.code)}</span>` },
    { key: 'type', title: 'Tipe', render: (x) => poTypeTag(x.type) },
    { key: 'client', title: 'Client', render: (x) => `<span class="${nameCls}">${esc(client(x.clientId).name)}</span>` },
    { key: 'source', title: 'Sumber', render: poSourceCell },
    { key: 'created', title: 'Date confirmed', render: (x) => `<span class="${dateCls}">${fmtDateTime(x.confirmedAt)}</span>` },
    { key: 'eta', title: 'Est. arrival', render: (x) => `<span class="${dateCls}">${fmtDateTime(x.estArrival)}</span>` },
    { key: 'hub', title: 'Hub', render: (x) => `<span class="${nameCls}">${esc(hub(x.hubId).name)}</span>` },
    { key: 'recv', title: 'Received', render: receivedCell },
    { key: 'status', title: 'Status', render: (x) => irBadge(x.grStatus) },
    { key: 'actions', title: '', align: 'right', render: (x) => rowMenu('ir:' + x.id) },
  ];
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Inbound management', title: 'Inbound request', desc: 'Barang yang dijadwalkan masuk hub: PO yang sudah confirmed, termasuk PO transfer dari hub lain dan PO return. Progress penerimaan dihitung dari goods receipt yang di-submit.', actions: headerActions(btn({ label: 'New goods receipt', icon: 'r:RiAddLine', nav: '#/warehouse/goods-receipt/new' })) })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-1 pb-3 lg:flex-row lg:items-end lg:justify-between lg:pb-0">
        ${tabsLine(tabsWithCounts(IR_TABS, all, (x) => x.grStatus, IR_LABEL), tab, 'tabIr')}
        <div class="flex flex-1 items-center justify-end gap-2 lg:py-2">${typeFilter('search.irType', typ, PO_TYPES, PO_TYPE_META)}${searchField({ model: 'search.ir', value: view.search.ir, placeholder: 'Search PO, sumber, client…', cls: 'max-w-xs flex-1' })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, rowNav: (x) => '#/warehouse/inbound-request/' + x.id, emptyTitle: 'Tidak ada inbound request', emptyDesc: 'Confirm PO dulu di Purchase order.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuIr(x) {
  return [
    menuItem({ label: 'View details', icon: 'r:RiEyeLine', nav: '#/warehouse/inbound-request/' + x.id }),
    x.grStatus !== 'FINISHED' ? menuItem({ label: 'Buat goods receipt', icon: 'r:RiInboxArchiveLine', nav: '#/warehouse/goods-receipt/new?po=' + x.id }) : '',
    menuItem({ label: 'Buka purchase order', icon: 'r:RiFileList3Line', nav: '#/warehouse/purchase-order/' + x.id }),
  ].join('');
}
function pageInboundDetail(id) {
  const x = po(id);
  if (!x) return notFoundPage('Inbound request', '#/warehouse/inbound-request');
  if (x.status !== 'CONFIRMED') return pagePoDetail(id);
  markTransferPoSeen(x);
  const cols = [
    { key: 'sku', title: 'SKU', render: (l) => `<span class="${codeCls}">${esc(l.sku)}</span>` },
    { key: 'name', title: 'Product name', render: (l) => `<span class="${nameCls}">${esc(skuName(x.clientId, l.sku))}</span>` },
    { key: 'exp', title: 'Expected qty', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qty)}</span>` },
    { key: 'rec', title: 'Received qty', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.received)}</span>` },
    { key: 'rem', title: 'Remaining', align: 'right', render: (l) => `<span class="font-mono text-[12px] font-semibold tabular-nums">${fmtQty(Math.max(0, l.qty - l.received))}</span>` },
    { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(skuUom(x.clientId, l.sku))}</span>` },
  ];
  return `<div class="space-y-5 p-6">
    ${detailHeader({ backLabel: 'Inbound request', backHref: '#/warehouse/inbound-request', meta: `Confirmed ${fmtDateTime(x.confirmedAt)} · ${esc(poSourceOf(x).label)} ${esc(poSourceOf(x).value)}`, title: x.code, badges: `${irBadge(x.grStatus)}${poTypeTag(x.type)}`, actions: `${btn({ label: 'Buka PO', icon: 'r:RiFileList3Line', tone: 'neutral', style: 'stroke', nav: '#/warehouse/purchase-order/' + x.id })}${x.grStatus !== 'FINISHED' ? btn({ label: 'Buat goods receipt', icon: 'r:RiAddLine', nav: '#/warehouse/goods-receipt/new?po=' + x.id }) : ''}` })}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-5 xl:col-span-2">
        ${section('Inbound lines', table({ columns: cols, rows: x.lines }), { desc: 'Received = akumulasi goods receipt yang sudah posted.' })}
        ${section('Goods receipt', grsOf(x.id).length ? grTable(grsOf(x.id)) : `<p class="${metaCls}">Belum ada goods receipt untuk inbound ini.</p>`)}
      </div>
      <div class="flex flex-col gap-5">${section('Info', kv('Client', esc(client(x.clientId).name)) + poSourceKvs(x) + kv('Hub', esc(hub(x.hubId).name)) + kv('Est. arrival', fmtDateTime(x.estArrival)) + kv('Progress', receivedCell(x)) + (x.notes ? kv('Catatan', esc(x.notes)) : ''))}</div>
    </div>
  </div>`;
}

/* ───────────── Goods receipt ───────────── */
function grTable(rows) {
  return table({
    rows, rowNav: (g) => '#/warehouse/goods-receipt/' + g.id, emptyTitle: 'Belum ada goods receipt', emptyDesc: 'Buat dari inbound request yang menunggu barang.',
    columns: [
      { key: 'code', title: 'GR ID', render: (g) => `<span class="${codeCls}">${esc(g.code)}</span>` },
      { key: 'po', title: 'PO number', render: (g) => `<span class="${codeCls}">${esc(po(g.poId).code)}</span>` },
      { key: 'type', title: 'Tipe', render: (g) => poTypeTag(po(g.poId).type) },
      { key: 'client', title: 'Client', render: (g) => `<span class="${nameCls}">${esc(client(g.clientId).name)}</span>` },
      { key: 'hub', title: 'Hub', render: (g) => `<span class="${nameCls}">${esc(hub(g.hubId).name)}</span>` },
      { key: 'arr', title: 'Date arrival', render: (g) => `<span class="${dateCls}">${fmtDateTime(g.dateArrival)}</span>` },
      { key: 'qty', title: 'Lines / qty', align: 'right', render: (g) => `<span class="text-[13px] tabular-nums text-text-sub-600">${g.lines.length} / ${fmtQty(sum(g.lines.map((l) => l.qty)))}</span>` },
      { key: 'doc', title: 'Surat jalan', render: (g) => (g.deliveryNoteDoc ? tag('PDF', 'gray', 'xs', 'r:RiFilePdf2Line') : dash) },
      { key: 'status', title: 'Status', render: () => badge('Posted', 'success') },
      { key: 'by', title: 'Created by', render: (g) => `<span class="${metaCls}">${esc(g.createdBy)}</span>` },
    ],
  });
}
function pageGrList() {
  const rows = db.grs.filter(inHub).filter((g) => { const q = (view.search.gr || '').toLowerCase(); return !q || [g.code, po(g.poId).code, client(g.clientId).name, g.deliveryNote].join(' ').toLowerCase().includes(q); });
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Inbound management', title: 'Goods receipt', desc: 'Penerimaan barang terhadap inbound request. Submit langsung <span class="font-medium text-text-strong-950">posted</span>: lot terbit otomatis, stok on hand naik di storage tujuan (location, section, atau bin), ledger INBOUND tercatat.', actions: headerActions(btn({ label: 'New goods receipt', icon: 'r:RiAddLine', nav: '#/warehouse/goods-receipt/new' })) })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p class="${metaCls}">${rows.length} goods receipt · semua berstatus Posted</p>
        <div class="flex flex-1 items-center justify-end gap-2">${searchField({ model: 'search.gr', value: view.search.gr, placeholder: 'Search GR, PO, client, SJ supplier…', cls: 'max-w-xs flex-1' })}</div>
      </div>
      <div class="p-4">${grTable(rows)}${tableFooter(rows.length)}</div>`)}
  </div>`;
}

/* GR wizard: Inbound request → Put-away → Penerimaan → Review */
const GR_STEPS = ['Inbound request', 'Put-away', 'Penerimaan', 'Review'];
const PDF_BLOBS = new Map();
const localNow = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
function grDefaultStorages(x) {
  const all = activeStoragesOf(x.hubId);
  if (x.type === 'RETURN') { const q = all.filter((s) => lineage(s).type === 'QUARANTINE'); if (q.length) return q; }
  const bins = all.filter((s) => s.category === 'BIN' && lineage(s).type === 'STORAGE');
  return bins.length ? bins : all.filter((s) => lineage(s).type === 'STORAGE').concat(all).slice(0, 1);
}
function grDraftFor(poId) {
  const d = view.draft;
  if (d.grPo === poId && d.grLines) return;
  const x = po(poId);
  const defaults = grDefaultStorages(x);
  Object.assign(d, { grPo: poId, grStep: 2, grArrival: localNow(), grDn: '', grDoc: null, grUpload: null, grNotes: '', grClose: false, grErrors: null });
  d.grLines = x.lines.filter((l) => l.qty - l.received > 0).map((l, i) => {
    const k = skuOf(x.clientId, l.sku) || {};
    return { key: uid('grl'), sku: l.sku, qty: l.qty - l.received, expiry: k.expiry ? dayIso(365) : '', storageId: (defaults[i % Math.max(1, defaults.length)] || {}).id || '' };
  });
}
function grLocalCheck(step) {
  const d = view.draft;
  const x = po(d.grPo);
  const out = [];
  const add = (field, message) => out.push({ field, message, step });
  if (step === 2) {
    const filled = d.grLines.filter((l) => Number(l.qty) > 0);
    if (!filled.length) add('lines', 'Isi qty diterima minimal satu baris.');
    d.grLines.forEach((l) => { if (String(l.qty).trim() !== '' && !(Number(l.qty) >= 0)) add('qty', `${l.sku}: qty harus angka ≥ 0.`); });
    filled.forEach((l) => { if (!l.storageId) add('storage', `${l.sku}: storage tujuan wajib dipilih.`); });
    const totals = {};
    filled.forEach((l) => { totals[l.sku] = (totals[l.sku] || 0) + Number(l.qty); });
    Object.entries(totals).forEach(([sku, q]) => { if (q > poRemaining(x, sku)) add('qty', `${sku}: total ${fmtQty(q)} melebihi sisa PO ${fmtQty(poRemaining(x, sku))}.`); });
  }
  if (step === 3) {
    if (d.grUpload && !d.grUpload.error) add('delivery_note', 'Tunggu upload PDF selesai.');
    if (d.grUpload && d.grUpload.error) add('delivery_note', 'Hapus file yang gagal diunggah atau pilih PDF lain.');
  }
  return out;
}
function grRemainingAfter(x, lines) {
  return x.lines.filter((l) => l.qty - l.received > 0).map((l) => ({ sku: l.sku, uom: skuUom(x.clientId, l.sku), left: Math.max(0, l.qty - l.received - sum(lines.filter((f) => f.sku === l.sku).map((f) => Number(f.qty) || 0))) })).filter((r) => r.left > 0);
}
function grDocField(d) {
  if (d.grDoc) {
    return `<div class="flex flex-col gap-1.5"><div class="flex items-center gap-3 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-3 py-2.5">
        <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--state-error-lighter) text-(--state-error-dark)">${ic('r:RiFilePdf2Line', 'size-5')}</span>
        <div class="min-w-0 flex-1"><p class="truncate text-[13px] font-medium text-text-strong-950">${esc(d.grDoc.name)}</p><p class="${metaCls}">${fmtBytes(d.grDoc.size)} · ${badge('Tersimpan', 'success', { cls: 'align-middle' })}</p></div>
        ${btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiDeleteBinLine', title: 'Hapus file', act: 'grDocRemove' })}
      </div>
      <div class="flex items-center gap-2"><button type="button" data-act="openPdf" data-url="${esc(d.grDoc.url)}" data-name="${esc(d.grDoc.name)}" class="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline">${ic('r:RiExternalLinkLine', 'size-3.5')}Buka PDF</button><span class="truncate font-mono text-[10px] text-text-soft-400" title="${esc(d.grDoc.url)}">${esc(d.grDoc.url)}</span></div></div>`;
  }
  if (d.grUpload) {
    const u = d.grUpload;
    return `<div class="flex items-center gap-3 rounded-lg border ${u.error ? 'border-(--state-error-base)' : 'border-stroke-soft-200'} bg-bg-white-0 px-3 py-2.5">
      <span class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${u.error ? 'bg-(--state-error-lighter) text-(--state-error-dark)' : 'bg-bg-weak-50 text-icon-sub-600'}">${ic(u.error ? 'r:RiErrorWarningLine' : 'r:RiLoader4Line', u.error ? 'size-5' : 'size-5 animate-spin')}</span>
      <div class="min-w-0 flex-1"><p class="truncate text-[13px] font-medium text-text-strong-950">${esc(u.name)}</p>${u.error ? `<p role="alert" class="text-[12px] text-(--state-error-base)">${esc(u.error)}</p>` : `<div class="mt-1 flex items-center gap-2"><span class="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-soft-200"><span class="block h-full rounded-full bg-(--theme-accent-base) transition-[width]" style="width:${u.progress}%"></span></span><span class="text-[11px] tabular-nums text-text-sub-600">Mengunggah… ${u.progress}%</span></div>`}</div>
      ${btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiCloseLine', title: u.error ? 'Hapus' : 'Batalkan upload', act: 'grDocRemove' })}
    </div>`;
  }
  return `<div class="flex flex-col gap-2"><label data-dropzone="pdf" class="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-stroke-soft-200 bg-bg-weak-50 px-4 py-5 text-center text-sm text-text-sub-600 transition-colors hover:border-stroke-strong-950">${ic('r:RiFileUploadLine', 'size-6 text-icon-soft-400')}<span>Pilih PDF surat jalan atau seret ke sini</span><span class="${metaCls}">PDF, maksimal 10 MB · langsung tersimpan begitu dipilih</span><span class="mt-1 inline-flex h-7 items-center rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2.5 text-xs font-medium text-text-strong-950">Pilih file</span><input type="file" accept="application/pdf,.pdf" data-file="pdf" class="hidden"/></label>
    <div class="flex items-center gap-2"><span class="${metaCls}">Tidak ada file saat demo?</span>${btn({ label: 'Pakai PDF contoh', icon: 'r:RiFilePdf2Line', size: 'xs', tone: 'neutral', style: 'stroke', act: 'grSamplePdf' })}</div></div>`;
}
function pageGrNew() {
  const poId = route.query.po && po(route.query.po) ? route.query.po : null;
  const x = poId ? po(poId) : null;
  const header = (meta, badges, actions) => detailHeader({ backLabel: 'Goods receipt', backHref: '#/warehouse/goods-receipt', meta, title: 'New goods receipt', badges, actions });
  if (!x) {
    const open = db.pos.filter(inHub).filter((p) => p.status === 'CONFIRMED' && p.grStatus !== 'FINISHED').sort((a, b) => (a.confirmedAt < b.confirmedAt ? 1 : -1));
    return `<div class="space-y-5 p-6">
      ${header('Pilih inbound request, isi qty per storage, lalu data penerimaan.')}
      ${stepIndicator(GR_STEPS, 1)}
      ${section('Pilih inbound request', open.length ? table({
        rows: open, rowNav: (p) => '#/warehouse/goods-receipt/new?po=' + p.id,
        columns: [
          { key: 'code', title: 'PO number', render: (p) => `<span class="${codeCls}">${esc(p.code)}</span>` },
          { key: 'type', title: 'Tipe', render: (p) => poTypeTag(p.type) },
          { key: 'client', title: 'Client', render: (p) => `<span class="${nameCls}">${esc(client(p.clientId).name)}</span>` },
          { key: 'source', title: 'Sumber', render: poSourceCell },
          { key: 'hub', title: 'Hub', render: (p) => `<span class="${nameCls}">${esc(hub(p.hubId).name)}</span>` },
          { key: 'eta', title: 'Est. arrival', render: (p) => `<span class="${dateCls}">${fmtDateTime(p.estArrival)}</span>` },
          { key: 'recv', title: 'Received', render: receivedCell },
          { key: 'status', title: 'Status', render: (p) => irBadge(p.grStatus) },
          { key: 'go', title: '', align: 'right', render: () => `<span class="inline-flex items-center gap-1 text-[12px] font-semibold text-accent">Pilih ${ic('r:RiArrowRightSLine', 'size-4')}</span>` },
        ],
      }) : `<div class="flex flex-col items-center gap-2 py-8 text-center"><p class="text-sm font-medium">Tidak ada inbound request yang menunggu barang</p><p class="${metaCls}">Confirm PO dulu di Purchase order${db.ui.hubId !== 'all' ? ', atau ganti filter hub ke Semua hub' : ''}.</p>${btn({ label: 'Ke Purchase order', icon: 'r:RiArrowRightLine', size: 'sm', tone: 'neutral', style: 'stroke', nav: '#/warehouse/purchase-order' })}</div>`, { desc: 'Goods receipt selalu mengacu ke inbound request (PO confirmed).' })}
    </div>`;
  }
  if (x.status !== 'CONFIRMED' || x.grStatus === 'FINISHED') {
    return `<div class="space-y-5 p-6">${header(x.code)}${alertBox('warning', 'Tidak bisa menerima barang', `${esc(x.code)} berstatus ${x.status === 'CONFIRMED' ? 'Finished' : PO_LABEL[x.status]} — tidak ada sisa qty yang menunggu.`)}${btn({ label: 'Pilih inbound request lain', icon: 'r:RiArrowLeftLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/goods-receipt/new' })}</div>`;
  }
  grDraftFor(poId);
  const d = view.draft;
  const step = d.grStep;
  const errs = d.grErrors || [];
  const errSteps = new Set(errs.map((e) => e.step));
  const storages = activeStoragesOf(x.hubId);
  const opts = storages.map((s) => ({ value: s.id, label: storageOptionLabel(s) }));
  const grid = 'grid grid-cols-[minmax(0,1fr)_90px_140px_minmax(0,1.4fr)_64px] items-center gap-2';
  const filled = d.grLines.filter((l) => Number(l.qty) > 0);
  let main = '';
  if (step === 2) {
    const totals = {};
    d.grLines.forEach((l) => { totals[l.sku] = (totals[l.sku] || 0) + (Number(l.qty) || 0); });
    main = section('Put-away', `<div class="flex flex-col gap-2">
      <div class="${grid} px-[9px] text-[11px] font-medium text-text-soft-400"><span>SKU</span><span class="text-right">Qty diterima</span><span>Expired date</span><span>Storage tujuan</span><span></span></div>
      ${d.grLines.length ? '' : `<p class="${metaCls}">Semua qty PO sudah diterima.</p>`}
      ${d.grLines.map((l, i) => {
        const k = skuOf(x.clientId, l.sku) || {};
        const sameSku = d.grLines.filter((y) => y.sku === l.sku).length;
        const st = l.storageId ? storage(l.storageId) : null;
        const t = st ? lineage(st).type : null;
        return `<div class="${grid} rounded-lg border ${t && t !== 'STORAGE' ? 'border-(--state-warning-base)' : 'border-stroke-soft-200'} px-2 py-2">
          <div class="min-w-0"><p class="${codeCls}">${esc(l.sku)}</p><p class="${metaCls} truncate">${esc(k.name || l.sku)} · sisa ${fmtQty(poRemaining(x, l.sku))} ${esc(k.uom || '')}</p></div>
          ${input({ type: 'number', size: 'sm', model: `draft.grLines.${i}.qty`, value: l.qty, min: 0, step: 'any', inputCls: 'text-right', rerender: 'debounce', label: `Qty diterima ${l.sku}` })}
          ${input({ type: 'date', size: 'sm', model: `draft.grLines.${i}.expiry`, value: l.expiry, label: `Expired date ${l.sku}` })}
          ${select({ size: 'sm', model: `draft.grLines.${i}.storageId`, value: l.storageId, placeholder: opts.length ? 'Pilih storage' : 'Belum ada storage aktif', options: opts, onChange: 'rerender', label: `Storage tujuan ${l.sku}` })}
          <div class="flex items-center justify-end gap-0.5">${btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiFileCopyLine', title: 'Split ke storage / expiry lain', act: 'grSplit', data: { 'data-i': i } })}${sameSku > 1 ? btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiDeleteBinLine', title: 'Hapus baris split', act: 'grDelLine', data: { 'data-i': i } }) : ''}</div>
        </div>`;
      }).join('')}
      <div class="flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-text-sub-600">${Object.entries(totals).map(([sku, q]) => { const over = q > poRemaining(x, sku); return `<span class="${over ? 'font-semibold text-(--state-error-base)' : ''}"><span class="font-mono">${esc(sku)}</span> total ${fmtQty(q)} / sisa ${fmtQty(poRemaining(x, sku))}</span>`; }).join('')}</div>
      <p class="${metaCls}">Storage tujuan boleh level mana pun — <span class="font-medium text-text-strong-950">Location, Section, atau Bin</span>. Satu SKU bisa dipecah ke beberapa storage/expiry (tombol split). Barang rusak/retur → pilih storage Karantina; tidak ikut alokasi outbound.</p>
    </div>`, { desc: `${x.code} · ${esc(poSourceOf(x).label)} ${esc(poSourceOf(x).value)}` });
  } else if (step === 3) {
    main = section('Penerimaan', `<div class="flex flex-col gap-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">${field('Date arrival', input({ type: 'datetime-local', model: 'draft.grArrival', value: d.grArrival, label: 'Date arrival' }))}${field('No. surat jalan supplier', input({ model: 'draft.grDn', value: d.grDn, placeholder: 'mis. SJ-MPD-0915', mono: true, label: 'No. surat jalan supplier' }), null, { optional: true })}</div>
      ${field('Surat jalan supplier (PDF)', grDocField(d), 'Scan surat jalan bertanda tangan. Di aplikasi file langsung diunggah ke bucket (GCS) begitu dipilih.', { optional: true, error: (errs.find((e) => e.field === 'delivery_note') || {}).message })}
      ${field('Catatan', textarea({ model: 'draft.grNotes', value: d.grNotes, rows: 2, placeholder: 'mis. 2 karton penyok, diterima dengan catatan', label: 'Catatan goods receipt' }), null, { optional: true })}
      <label class="flex items-start gap-2 text-[12px] text-text-sub-600">${checkbox({ checked: d.grClose, act: 'grToggleClose', label: 'Tutup sisa PO' })}<span>Tutup sisa PO (cancel backorder) — inbound jadi Finished walau qty kurang</span></label>
    </div>`, { desc: 'Data kedatangan dari supplier / pengirim.' });
  } else {
    const remain = grRemainingAfter(x, filled);
    main = section('Review', `<div class="flex flex-col gap-4">
      ${kvGrid([
        ['Inbound request', `<span class="font-mono">${esc(x.code)}</span> ${poTypeTag(x.type)}`], [poSourceOf(x).label, esc(poSourceOf(x).value)],
        ['Date arrival', d.grArrival ? fmtDateTime(new Date(d.grArrival).toISOString()) : null], ['No. surat jalan supplier', String(d.grDn).trim() ? `<span class="font-mono">${esc(d.grDn.trim())}</span>` : null],
        ['Surat jalan supplier (PDF)', d.grDoc ? `<button type="button" data-act="openPdf" data-url="${esc(d.grDoc.url)}" data-name="${esc(d.grDoc.name)}" class="text-accent hover:underline">${esc(d.grDoc.name)}</button>` : null], ['Catatan', String(d.grNotes).trim() ? esc(d.grNotes.trim()) : null],
      ])}
      <div class="flex flex-col divide-y divide-stroke-soft-200 rounded-lg border border-stroke-soft-200">${filled.map((l) => { const st = storage(l.storageId); return `<div class="flex items-center justify-between gap-3 px-3 py-2"><div class="min-w-0"><p class="${codeCls}">${esc(l.sku)}</p><p class="${metaCls} truncate">${st ? esc(storageOptionLabel(st)) : '—'}${l.expiry ? ` · exp ${fmtDate(l.expiry)}` : ''}</p></div><span class="text-[13px] tabular-nums text-text-strong-950">${fmtQty(Number(l.qty))} ${esc(skuUom(x.clientId, l.sku))}</span></div>`; }).join('') || `<p class="px-3 py-2 ${metaCls}">Belum ada qty diterima.</p>`}</div>
      ${remain.length ? alertBox(d.grClose ? 'warning' : 'information', d.grClose ? 'Sisa PO ditutup' : 'Sisa PO tetap open', `${remain.map((r) => `<span class="font-mono">${esc(r.sku)}</span> sisa ${fmtQty(r.left)} ${esc(r.uom)}`).join(' · ')}${d.grClose ? ' — inbound request jadi Finished.' : ' — bisa diterima di goods receipt berikutnya (status Partial receipt).'}`) : alertBox('success', 'Semua qty PO diterima', 'Inbound request jadi Finished setelah submit.')}
      <p class="${metaCls}">Submit langsung <span class="font-medium text-text-strong-950">posted</span>: lot baru terbit per baris, stok on hand naik di storage tujuan, ledger ${x.type === 'TRANSFER' ? 'TRANSFER_IN' : 'INBOUND'} tercatat.</p>
    </div>`, { desc: `${x.code} · ${esc(poSourceOf(x).value)}` });
  }
  const uploading = d.grUpload && !d.grUpload.error;
  return `<div class="space-y-5 p-6">
    ${header('Pilih inbound request, isi qty per storage, lalu data penerimaan.', `${tag(x.code, 'gray', 'sm')}${poTypeTag(x.type)}`, btn({ label: 'Ganti inbound', tone: 'neutral', style: 'stroke', nav: '#/warehouse/goods-receipt/new' }))}
    ${stepIndicator(GR_STEPS, step, { errorSteps: errSteps, gotoAct: 'grGoto' })}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-4 xl:col-span-2">
        ${wizardErrors(errs, GR_STEPS, step)}
        ${main}
        ${card(`<div class="px-4 py-3">${wizardFooter({ step, total: GR_STEPS.length, backAct: 'grBack', nextAct: 'grNext', submitAct: 'submitGr', submitLabel: 'Submit goods receipt', backAlways: true, nextDisabled: step === 3 && uploading, note: step === 3 && uploading ? 'Tunggu upload PDF selesai' : '' })}</div>`)}
      </div>
      <div class="flex flex-col gap-5">
        ${section('Info', kv('Client', esc(client(x.clientId).name)) + poSourceKvs(x) + kv('Hub', esc(hub(x.hubId).name)) + kv('Est. arrival', fmtDateTime(x.estArrival)) + kv('Progress', receivedCell(x)))}
      </div>
    </div>
  </div>`;
}
function pageGrDetail(id) {
  const g = gr(id);
  if (!g) return notFoundPage('Goods receipt', '#/warehouse/goods-receipt');
  const x = po(g.poId);
  const o = x.transferOutboundId ? outbound(x.transferOutboundId) : null;
  const cols = [
    { key: 'sku', title: 'SKU', render: (l) => `<div><p class="${codeCls}">${esc(l.sku)}</p><p class="${metaCls}">${esc(l.name)}</p></div>` },
    { key: 'qty', title: 'Received qty', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qty)}</span>` },
    { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(l.uom)}</span>` },
    { key: 'exp', title: 'Expired date', render: (l) => `<span class="${dateCls}">${l.expiry ? fmtDate(l.expiry) : '—'}</span>` },
    { key: 'storage', title: 'Storage tujuan', render: (l) => storageCell(l.storageId) },
    { key: 'lot', title: 'Lot', render: (l) => `<span class="${numCls}">${esc(l.lot)}</span>` },
  ];
  const doc = g.deliveryNoteDoc;
  return `<div class="space-y-5 p-6">
    ${detailHeader({ backLabel: 'Goods receipt', backHref: '#/warehouse/goods-receipt', meta: `Dibuat ${fmtDateTime(g.createdAt)} · oleh <span class="font-semibold text-text-sub-600">${esc(g.createdBy)}</span>`, title: g.code, badges: `${badge('Posted', 'success')}${poTypeTag(x.type)}`, actions: `${btn({ label: 'Print goods receipt', icon: 'r:RiPrinterLine', tone: 'neutral', style: 'stroke', act: 'openPrint', data: { 'data-kind': 'gr', 'data-id': g.id } })}${btn({ label: 'Lihat stock', icon: 'r:RiStackLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/stock' })}` })}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-5 xl:col-span-2">
        ${section('Receipt information', table({ columns: cols, rows: g.lines }), { desc: 'Lot di-generate otomatis dan dipakai FEFO saat outbound (kecuali storage Karantina/Staging).' })}
        ${g.notes ? alertBox('information', 'Catatan penerimaan', esc(g.notes)) : ''}
      </div>
      <div class="flex flex-col gap-5">
        ${section('Shipping information', kv('PO number', docLink('#/warehouse/purchase-order/' + x.id, x.code)) + poSourceKvs(x) + kv('Client', esc(client(g.clientId).name)) + kv('Hub', esc(hub(g.hubId).name)) + kv('Date arrival', fmtDateTime(g.dateArrival)) + kv('Surat jalan supplier', g.deliveryNote ? `<span class="font-mono">${esc(g.deliveryNote)}</span>` : null) + kv('Tutup sisa PO', g.closesBackorder ? 'Ya' : 'Tidak') + kv('Receiving PO', irBadge(x.grStatus)))}
        ${section('Surat jalan supplier (PDF)', doc ? `<div class="flex flex-col gap-2"><div class="flex items-center gap-3"><span class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--state-error-lighter) text-(--state-error-dark)">${ic('r:RiFilePdf2Line', 'size-5')}</span><div class="min-w-0"><p class="truncate text-[13px] font-medium">${esc(doc.name)}</p><p class="${metaCls}">${fmtBytes(doc.size)}</p></div></div><button type="button" data-act="openPdf" data-url="${esc(doc.url)}" data-name="${esc(doc.name)}" class="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline">${ic('r:RiExternalLinkLine', 'size-3.5')}Buka PDF</button><p class="break-all font-mono text-[10px] text-text-soft-400">${esc(doc.url)}</p></div>` : `<p class="${metaCls}">Tidak ada file surat jalan.</p>`)}
        ${o ? section('Outbound transfer', kv('Outbound', docLink('#/warehouse/outbound-request/' + o.id, o.code)) + kv('Hub asal', esc(hub(o.hubId).name)) + kv('Status', orBadge(o.status))) : ''}
      </div>
    </div>
  </div>`;
}

/* ── PDF demo: upload disimulasikan (progress), file dibuka dari blob URL; tanpa file → PDF contoh ── */
function samplePdfText(title, sub) {
  const clean = (s) => String(s).replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, '');
  const content = `BT /F1 20 Tf 56 770 Td (${clean(title)}) Tj ET\nBT /F1 11 Tf 56 744 Td (${clean(sub)}) Tj ET\nBT /F1 10 Tf 56 720 Td (Dokumen contoh - mockup Dash Logistic WMS) Tj ET`;
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((n) => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}
function samplePdfFile(name, sub) {
  const blob = new Blob([samplePdfText('Surat jalan supplier', sub || name)], { type: 'application/pdf' });
  try { return new File([blob], name, { type: 'application/pdf' }); } catch (e) { blob.name = name; return blob; }
}
function startPdfUpload(file) {
  const d = view.draft;
  if (!file) return;
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!isPdf) { d.grUpload = { token: null, name: file.name || 'file', size: file.size || 0, progress: 0, error: 'File harus PDF.' }; d.grDoc = null; render(); return; }
  if (file.size > 10 * 1024 * 1024) { d.grUpload = { token: null, name: file.name, size: file.size, progress: 0, error: 'Maksimal 10 MB.' }; d.grDoc = null; render(); return; }
  const token = uid('upl');
  let blobUrl = null;
  try { blobUrl = URL.createObjectURL(file); } catch (e) { blobUrl = null; }
  d.grDoc = null;
  d.grUpload = { token, name: file.name, size: file.size, progress: 0, error: null };
  render();
  const tick = () => {
    const u = view.draft.grUpload;
    if (!u || u.token !== token) return;
    u.progress = Math.min(100, u.progress + 20);
    if (u.progress >= 100) {
      const url = `https://storage.googleapis.com/logistic-bucket-main/logistic/${randHex(8)}-${slugFile(file.name)}`;
      if (blobUrl) PDF_BLOBS.set(url, blobUrl);
      view.draft.grDoc = { url, name: file.name, size: file.size };
      view.draft.grUpload = null;
      view.draft.grErrors = (view.draft.grErrors || []).filter((e) => e.field !== 'delivery_note');
      render();
      toast('PDF tersimpan', 'success', `${esc(file.name)} · ${fmtBytes(file.size)}`);
      return;
    }
    render();
    setTimeout(tick, 160);
  };
  setTimeout(tick, 160);
}
function openPdf(url, name) {
  let blobUrl = PDF_BLOBS.get(url);
  if (!blobUrl) {
    // File seed / hasil reload: blob tidak ada di sesi ini → tampilkan PDF contoh dengan nama yang sama.
    try { blobUrl = URL.createObjectURL(samplePdfFile(name || 'surat-jalan.pdf', `${name || ''} (salinan demo)`)); PDF_BLOBS.set(url, blobUrl); } catch (e) { blobUrl = null; }
  }
  const w = blobUrl ? window.open(blobUrl, '_blank') : null;
  if (!w) toast('Browser memblokir tab baru', 'warning', 'Izinkan pop-up untuk halaman ini lalu klik Buka PDF lagi.');
}
