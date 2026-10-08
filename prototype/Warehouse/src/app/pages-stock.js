// ── Dashboard › Stock & Warehouse management › Storage ──
const inHub = (row) => db.ui.hubId === 'all' || row.hubId === Number(db.ui.hubId);
const hubSelect = () =>
  select({ model: 'ui.hubId', value: db.ui.hubId, size: 'md', cls: 'w-44', label: 'Filter hub', options: [{ value: 'all', label: 'Semua hub' }, ...db.hubs.map((h) => ({ value: h.id, label: h.name }))] });
const clientSelect = (model, value, placeholder) =>
  select({ model, value, size: 'sm', cls: 'w-40', label: 'Filter client', placeholder: placeholder || 'Semua client', options: db.clients.map((c) => ({ value: c.id, label: c.name })), onChange: 'rerender' });
const headerActions = (extra, opt) => `${opt && opt.noHub ? '' : hubSelect()}${btn({ label: 'Refresh', icon: 'r:RiRefreshLine', tone: 'neutral', style: 'stroke', act: 'refresh' })}${extra || ''}`;
const levelTag = (st) => tag(STORAGE_LEVEL_LABEL[st.category], st.category === 'BIN' ? 'stroke' : 'gray');
const typeBadge = (t) => badge(STORAGE_TYPE_LABEL[t] || t, t === 'STORAGE' ? 'success' : t === 'QUARANTINE' ? 'warning' : 'information', { dot: false });
/** Sel tabel storage: kode + path + level (bila bukan bin) + tipe (bila bukan Storage). */
const storageCell = (id) => {
  const st = storage(id);
  if (!st) return dash;
  const t = lineage(st).type;
  return `<div><p class="${codeCls}">${esc(st.code)}${st.category !== 'BIN' ? ` <span class="ml-1 align-middle">${levelTag(st)}</span>` : ''}</p><p class="${cx(metaCls, t === 'QUARANTINE' ? 'text-(--state-warning-dark)' : '')}">${esc(storagePath(st))}${t !== 'STORAGE' ? ` · ${STORAGE_TYPE_LABEL[t]}` : ''}</p></div>`;
};
const MOVE_META = { INBOUND: ['Inbound', 'success'], OUTBOUND: ['Outbound', 'feature'], TRANSFER_IN: ['Transfer in', 'verified'], TRANSFER_OUT: ['Transfer out', 'stable'] };

function statTile(label, value, sub) {
  return `<div class="flex flex-col gap-1 rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-4"><span class="label-eyebrow">${esc(label)}</span><span class="text-[24px] font-extrabold tracking-tight tabular-nums text-text-strong-950 leading-none">${value}</span>${sub ? `<span class="${metaCls}">${sub}</span>` : ''}</div>`;
}

function pageStock() {
  const q = (view.search.stock || '').toLowerCase();
  const cf = view.draft.stockClient ? Number(view.draft.stockClient) : null;
  const scope = db.stocks.filter(inHub).filter((s) => (cf ? s.clientId === cf : true)).filter((s) => s.onHand > 0 || s.reserved > 0);
  const rows = scope
    .filter((s) => !q || [s.sku, skuName(s.clientId, s.sku), s.lot, (storage(s.storageId) || {}).code, storageLabel(s.storageId)].join(' ').toLowerCase().includes(q))
    .sort((a, b) => a.hubId - b.hubId || a.clientId - b.clientId || a.sku.localeCompare(b.sku) || fefoSort(a, b));
  const onHand = sum(scope.map((r) => r.onHand));
  const reserved = sum(scope.map((r) => r.reserved));
  const skus = new Set(scope.map((r) => r.clientId + ':' + r.sku)).size;
  const used = new Set(scope.filter((r) => r.onHand > 0).map((r) => r.storageId));
  const quarantined = sum(scope.filter((r) => lineage(storage(r.storageId)).type !== 'STORAGE').map((r) => r.onHand));
  if (db.ui.demo.grId && !db.ui.demo.stockSeen) { db.ui.demo.stockSeen = true; save(); }
  const cols = [
    { key: 'sku', title: 'SKU / item', render: (s) => `<div><p class="${codeCls}">${esc(s.sku)}</p><p class="${metaCls}">${esc(skuName(s.clientId, s.sku))}</p></div>` },
    { key: 'client', title: 'Client', render: (s) => `<span class="${nameCls}">${esc(client(s.clientId).name)}</span>` },
    { key: 'hub', title: 'Hub', render: (s) => `<span class="${nameCls}">${esc(hub(s.hubId).name)}</span>` },
    { key: 'storage', title: 'Storage', render: (s) => storageCell(s.storageId) },
    { key: 'lot', title: 'Lot / expiry', render: (s) => { const d = daysUntil(s.expiry); return `<div><p class="${numCls}">${esc(s.lot)}</p><p class="${cx(metaCls, d != null && d < 0 ? 'text-(--state-error-base)' : d != null && d <= 45 ? 'text-(--state-warning-dark)' : '')}">${s.expiry ? fmtDate(s.expiry) + (d != null && d <= 45 ? ` · ${d < 0 ? 'expired' : d + ' hari lagi'}` : '') : 'Tanpa expiry'}</p></div>`; } },
    { key: 'onHand', title: 'On hand', align: 'right', render: (s) => `<span class="${numCls}">${fmtQty(s.onHand)}</span>` },
    { key: 'reserved', title: 'Reserved', align: 'right', render: (s) => (s.reserved ? `<span class="font-mono text-[12px] tabular-nums text-(--state-away-dark)">${fmtQty(s.reserved)}</span>` : `<span class="font-mono text-[12px] tabular-nums text-text-soft-400">0</span>`) },
    { key: 'available', title: 'Available', align: 'right', render: (s) => (allocatable(s) || s.onHand - s.reserved <= 0 ? `<span class="font-mono text-[12px] font-semibold tabular-nums text-text-strong-950">${fmtQty(s.onHand - s.reserved)}</span>` : `<span class="font-mono text-[12px] tabular-nums text-text-soft-400" title="Bukan storage tipe Storage — tidak ikut alokasi">0 · ditahan</span>`) },
    { key: 'uom', title: 'UoM', render: (s) => `<span class="${metaCls}">${esc(skuUom(s.clientId, s.sku))}</span>` },
  ];
  const mv = db.movements.filter(inHub).filter((m) => (cf ? m.clientId === cf : true)).slice(0, 12);
  const mvCols = [
    { key: 'at', title: 'Waktu', render: (m) => `<span class="${dateCls}">${fmtDateTime(m.at)}</span>` },
    { key: 'type', title: 'Tipe', render: (m) => { const t = MOVE_META[m.type] || [m.type, 'neutral']; return badge(t[0], t[1]); } },
    { key: 'ref', title: 'Dokumen', render: (m) => `<button type="button" data-act="openRef" data-code="${esc(m.refCode)}" class="${codeCls} text-accent hover:underline underline-offset-4">${esc(m.refCode)}</button>` },
    { key: 'sku', title: 'SKU', render: (m) => `<span class="${codeCls}">${esc(m.sku)}</span>` },
    { key: 'lot', title: 'Lot', render: (m) => `<span class="${numCls}">${esc(m.lot)}</span>` },
    { key: 'storage', title: 'Storage', render: (m) => (m.storageId ? storageCell(m.storageId) : `<span class="${codeCls}">${esc(m.storageCode)}</span>`) },
    { key: 'qty', title: 'Qty', align: 'right', render: (m) => `<span class="font-mono text-[12px] font-semibold tabular-nums ${m.qtyDelta > 0 ? 'text-(--state-success-dark)' : 'text-text-strong-950'}">${m.qtyDelta > 0 ? '+' : ''}${fmtQty(m.qtyDelta)}</span>` },
    { key: 'by', title: 'Oleh', render: (m) => `<span class="${metaCls}">${esc(m.by)}</span>` },
  ];
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Dashboard', title: 'Stock', desc: 'Stok client yang disimpan di hub per storage × lot — storage bisa di level mana pun (location, section, atau bin). <span class="font-medium text-text-strong-950">Reserved</span> naik saat picking order dibuat (FEFO), <span class="font-medium text-text-strong-950">on hand</span> baru turun saat shipping di-submit.', actions: headerActions() })}
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
      ${statTile('SKUs in stock', skus)}${statTile('Storages in use', used.size, 'location, section & bin')}${statTile('Units on hand', fmtQty(onHand), quarantined ? `${fmtQty(quarantined)} di karantina/staging` : '')}${statTile('Units reserved', fmtQty(reserved), 'menunggu shipping')}${statTile('Units available', fmtQty(sum(scope.filter(allocatable).map((s) => s.onHand - s.reserved))), 'siap dialokasikan FEFO')}
    </div>
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p class="${metaCls} max-w-xl">Alokasi outbound hanya dari storage di bawah lokasi bertipe <span class="font-semibold text-text-strong-950">Storage</span> (Karantina & Staging dilewati), urut expiry terdekat; expiry sama → bin dulu.</p>
        <div class="flex items-center gap-2">${clientSelect('draft.stockClient', view.draft.stockClient)}${searchField({ model: 'search.stock', value: view.search.stock, placeholder: 'Cari SKU, lot, atau storage…', cls: 'w-64' })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, emptyTitle: 'Belum ada stok', emptyDesc: 'Stok lahir dari goods receipt.' })}${tableFooter(rows.length)}</div>`)}
    ${section('Riwayat pergerakan stok', table({ columns: mvCols, rows: mv, emptyTitle: 'Belum ada pergerakan' }), { desc: 'Ledger append-only — setiap perubahan qty menunjuk dokumen penyebabnya (GR / GI).' })}
  </div>`;
}

function pageStorage() {
  const rows = db.storages.filter(inHub).sort(storageTreeSort);
  const depth = (s) => s.path.split('.').length - 1;
  const directQty = (s) => sum(db.stocks.filter((x) => x.storageId === s.id).map((x) => x.onHand));
  const subtreeQty = (s) => sum(db.stocks.filter((x) => { const t = storage(x.storageId); return t && t.hubId === s.hubId && (t.path === s.path || t.path.startsWith(s.path + '.')); }).map((x) => x.onHand));
  const hubHeader = (h) => `<div class="flex items-center gap-2 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2"><span class="text-icon-sub-600">${ic('l:warehouse', 'size-4')}</span><span class="text-[13px] font-semibold tracking-tight">${esc(h.name)}</span><span class="font-mono text-[11px] text-text-sub-600">${esc(h.code)}</span></div>`;
  const node = (s) => {
    const d = depth(s);
    const t = lineage(s).type;
    const own = directQty(s);
    const all = subtreeQty(s);
    return `<div class="grid grid-cols-[minmax(0,1.6fr)_90px_110px_70px_110px_110px_80px] items-center gap-3 border-b border-stroke-soft-200 px-4 py-2 last:border-b-0 hover:bg-bg-weak-50">
      <div class="flex min-w-0 items-center gap-2" style="padding-left:${d * 22}px">${d ? `<span class="text-icon-soft-400">${ic('r:RiArrowRightSLine', 'size-3.5')}</span>` : `<span class="text-icon-sub-600">${ic('l:map-pin', 'size-4')}</span>`}<div class="min-w-0"><p class="${codeCls}">${esc(s.code)}</p><p class="${metaCls} truncate">${esc(s.name)}</p></div></div>
      <div>${levelTag(s)}</div>
      <div>${typeBadge(t)}</div>
      <span class="${numCls} text-text-sub-600">${esc(s.path)}</span>
      <span class="text-right ${own ? numCls : 'font-mono text-[12px] text-text-soft-400'}">${fmtQty(own)}</span>
      <span class="text-right font-mono text-[12px] tabular-nums text-text-sub-600">${fmtQty(all)}</span>
      <div>${badge(s.status === 'ACTIVE' ? 'Active' : 'Inactive', s.status === 'ACTIVE' ? 'success' : 'faded')}</div>
    </div>`;
  };
  const hubs = db.hubs.filter((h) => rows.some((s) => s.hubId === h.id));
  const head = `<div class="grid grid-cols-[minmax(0,1.6fr)_90px_110px_70px_110px_110px_80px] gap-3 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2 text-[11px] font-medium text-text-soft-400"><span>Storage</span><span>Level</span><span>Type</span><span>Path</span><span class="text-right">On hand (di node)</span><span class="text-right">Total subtree</span><span>Status</span></div>`;
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Warehouse management', title: 'Storage', desc: 'Hirarki penyimpanan per hub: Location → Section → Bin (ltree path). Tipe ada di Location dan diwarisi ke bawah. Stok bisa menempel di level mana pun; hanya tipe <span class="font-medium text-text-strong-950">Storage</span> yang ikut alokasi outbound.', actions: headerActions(btn({ label: 'Tambah storage', icon: 'r:RiAddLine', act: 'openCreateStorage' })) })}
    ${card(`<div class="overflow-x-auto"><div class="min-w-[860px]">${head}${hubs.map((h) => hubHeader(h) + rows.filter((s) => s.hubId === h.id).map(node).join('')).join('')}</div></div>`, 'overflow-hidden')}
    <p class="${metaCls}">${rows.length} storage · ${new Set(rows.map((r) => r.hubId)).size} hub</p>
  </div>`;
}

function modalCreateStorage() {
  const d = view.draft;
  const hubId = Number(d.stHub || (db.ui.hubId === 'all' ? 3 : db.ui.hubId));
  const cat = d.stCat || 'BIN';
  const parentCat = cat === 'SECTION' ? 'LOCATION' : cat === 'BIN' ? 'SECTION' : null;
  const parents = parentCat ? db.storages.filter((s) => s.hubId === hubId && s.category === parentCat).sort(storageTreeSort) : [];
  return formModal({
    icon: 'r:RiStackLine', title: 'Tambah storage', desc: 'Kode unik per hub. Section di bawah Location, Bin di bawah Section.',
    body: `<div class="flex flex-col gap-4">
      ${d.stError ? alertBox('error', 'Gagal menyimpan', esc(d.stError)) : ''}
      <div class="grid grid-cols-2 gap-3">${field('Hub', select({ model: 'draft.stHub', value: hubId, options: db.hubs.map((h) => ({ value: h.id, label: h.name })), onChange: 'rerender' }))}${field('Level', select({ model: 'draft.stCat', value: cat, options: [{ value: 'LOCATION', label: 'Location' }, { value: 'SECTION', label: 'Section' }, { value: 'BIN', label: 'Bin' }], onChange: 'rerender' }))}</div>
      ${parentCat ? field(parentCat === 'LOCATION' ? 'Location induk' : 'Section induk', select({ model: 'draft.stParent', value: d.stParent, placeholder: 'Pilih induk', options: parents.map((p) => ({ value: p.id, label: storageOptionLabel(p) })) }), null, { required: true }) : field('Type', select({ model: 'draft.stType', value: d.stType || 'STORAGE', options: Object.entries(STORAGE_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l })) }), 'Section & bin di bawahnya mewarisi tipe ini.')}
      <div class="grid grid-cols-2 gap-3">${field('Code', input({ model: 'draft.stCode', value: d.stCode, placeholder: cat === 'BIN' ? 'BIN-A4' : cat === 'SECTION' ? 'SEC-D' : 'LOC-05', mono: true }), null, { required: true })}${field('Nama', input({ model: 'draft.stName', value: d.stName, placeholder: cat === 'BIN' ? 'Slot A4' : cat === 'SECTION' ? 'Rak D' : 'Zona C' }), null, { required: true })}</div>
    </div>`,
    footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: 'Simpan storage', icon: 'r:RiCheckLine', act: 'submitCreateStorage' })}`,
  });
}
