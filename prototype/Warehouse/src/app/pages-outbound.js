// ── Outbound management: Outbound request, Goods issue › Picking & Shipping ──
const OR_TABS = ['ALL', 'OPEN', 'PREPARING', 'READY_TO_PICKUP', 'SHIPPED', 'IN_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'];
const tabsWithCounts = (keys, rows, statusOf, labels) =>
  keys.map((k) => ({ key: k, label: k === 'ALL' ? 'All' : labels[k], count: k === 'ALL' ? rows.length : rows.filter((r) => statusOf(r) === k).length }));
const waybillLink = (sh) => (sh ? `<button type="button" data-act="openShipment" data-id="${sh.id}" class="${codeCls} text-accent hover:underline underline-offset-4">${esc(sh.waybill)}</button>` : dash);
const sourceTag = (o) => { const [l, v, i] = SOURCE_TAG[o.source] || SOURCE_TAG.MANUAL; return tag(l, v, 'xs', i); };
const typeCell = (o) => (o.type === 'TRANSFER' ? outboundTransferTag(o) : tag('Regular', 'gray', 'xs', OO_TYPE_META.REGULAR.icon));
const lineQty = (o) => `<span class="text-[13px] tabular-nums text-text-sub-600">${o.lines.length} / ${fmtQty(sum(o.lines.map((l) => l.qty)))}</span>`;
const recipientCell = (o) => `<div><p class="${nameCls}">${esc(o.recipient.name)}</p><p class="${metaCls} truncate max-w-[240px]">${esc(o.destination.address)}</p></div>`;
const orderRefCell = (o) => `<div><p class="${codeCls}">${esc(o.code)}</p><p class="${metaCls} font-mono">${esc(o.externalId)}</p></div>`;
const shipmentOf = (o) => { const g = giOfOutbound(o); return g && g.shipmentId ? shipment(g.shipmentId) : null; };
const pickerOptions = () => STAFF.map((s) => ({ value: s, label: s }));
const docLink = (href, code) => `<button type="button" data-nav="${esc(href)}" class="${codeCls} text-accent hover:underline underline-offset-4">${esc(code)}</button>`;
const typeFilter = (model, value, types, meta) => select({ model, value, size: 'sm', cls: 'w-36', label: 'Filter tipe', placeholder: 'Semua tipe', options: types.map((t) => ({ value: t, label: meta[t].label })), onChange: 'rerender' });

/* ───────────────────────── Outbound request: list ───────────────────────── */
function pageOutboundList() {
  const all = db.outbounds.filter(inHub);
  const tab = view.tab.or || 'ALL';
  const q = (view.search.or || '').toLowerCase();
  const src = view.search.orSource || '';
  const typ = view.search.orType || '';
  const rows = all
    .filter((o) => tab === 'ALL' || o.status === tab)
    .filter((o) => !src || o.source === src)
    .filter((o) => !typ || o.type === typ)
    .filter((o) => !q || [o.code, o.externalId, o.recipient.name, client(o.clientId).name, (shipmentOf(o) || {}).waybill, (uploadOf(o) || {}).code].join(' ').toLowerCase().includes(q));
  const sel = view.sel.or || [];
  const selectable = rows.filter((o) => o.status === 'OPEN');
  const cols = [
    { key: 'ref', title: 'Request ID / External ID', render: (o) => orderRefCell(o) },
    { key: 'type', title: 'Tipe', render: typeCell },
    { key: 'source', title: 'Source', render: sourceCell },
    { key: 'client', title: 'Client', render: (o) => `<span class="${nameCls}">${esc(client(o.clientId).name)}</span>` },
    { key: 'recipient', title: 'Recipient', render: recipientCell },
    { key: 'lines', title: 'Lines / qty', align: 'right', render: lineQty },
    { key: 'expected', title: 'Expected', render: (o) => `<span class="${dateCls}">${fmtDate(o.expectedDelivery)}</span>` },
    { key: 'hub', title: 'Hub', render: (o) => `<span class="${nameCls}">${esc(hub(o.hubId).name)}</span>` },
    { key: 'status', title: 'Status', render: (o) => orBadge(o.status) },
    { key: 'shipment', title: 'Shipment', render: (o) => { const sh = shipmentOf(o); return sh ? `<div class="flex items-center gap-1.5">${waybillLink(sh)}${shBadge(sh.status)}</div>` : dash; } },
    { key: 'created', title: 'Created', render: (o) => `<span class="${dateCls}">${fmtDateTime(o.createdAt)}</span>` },
    { key: 'actions', title: '', align: 'right', render: (o) => rowMenu('or:' + o.id) },
  ];
  const selection = {
    all: selectable.length > 0 && selectable.every((o) => sel.includes(o.id)), allAct: 'selAll', selectableCount: selectable.length,
    rowAct: 'selRow', key: (o) => o.id, isSelected: (o) => sel.includes(o.id), isSelectable: (o) => o.status === 'OPEN',
  };
  view.selScope = { name: 'or', ids: selectable.map((o) => o.id) };
  const nSel = sel.filter((id) => selectable.some((o) => o.id === id)).length;
  return `<div class="space-y-5 p-6">
    ${pageHeader({
      eyebrow: 'Warehouse · Outbound management', title: 'Outbound request',
      desc: 'Order keluar dari client. Masuk lewat form manual atau upload CSV (client API menyusul dengan API key yang sama). Ops lalu membuat picking order → stok di-reserve FEFO. Saat shipping di-submit, AWB lahir otomatis di menu Shipments; untuk tipe Transfer, PO transfer terbit di hub tujuan.',
      actions: headerActions(`${btn({ label: 'Upload CSV', icon: 'r:RiUpload2Line', tone: 'neutral', style: 'stroke', act: 'openUploadCsv' })}${btn({ label: 'Create outbound request', icon: 'r:RiAddLine', act: 'openCreateOutbound' })}`),
    })}
    ${card(`<div class="border-b border-stroke-soft-200 px-4 pt-1">${tabsLine(tabsWithCounts(OR_TABS, all, (o) => o.status, OR_LABEL), tab, 'tabOr')}</div>
      <div class="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        ${nSel ? `<div class="flex items-center gap-3 rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-1.5"><span class="text-[13px] text-text-sub-600"><span class="font-semibold text-text-strong-950 tabular-nums">${nSel}</span> order Open dipilih</span>${btn({ label: 'Batal pilih', size: 'xs', tone: 'neutral', style: 'ghost', act: 'clearSelOr' })}${btn({ label: `Create picking order (${nSel})`, icon: 'r:RiFileList3Line', size: 'xs', act: 'bulkCreatePicking' })}</div>` : `<p class="${metaCls}">Centang order <span class="font-medium text-text-strong-950">Open</span> untuk bulk create picking order.</p>`}
        <div class="flex flex-wrap items-center justify-end gap-2">${typeFilter('search.orType', typ, ['REGULAR', 'TRANSFER'], OO_TYPE_META)}${select({ model: 'search.orSource', value: src, size: 'sm', cls: 'w-36', label: 'Filter sumber', placeholder: 'Semua sumber', options: Object.keys(SOURCE_TAG).map((k) => ({ value: k, label: OR_SOURCE_LABEL[k] })), onChange: 'rerender' })}${searchField({ model: 'search.or', value: view.search.or, placeholder: 'Request ID, external ID, upload, AWB…', cls: 'w-72' })}${btn({ label: 'Simulasi API', icon: 'r:RiCodeSSlashLine', size: 'xs', tone: 'neutral', style: 'ghost', act: 'openApiOrder', title: 'Client API — next phase', after: `<span class="ml-1">${tag('Next phase', 'gray')}</span>` })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, selection, rowNav: (o) => '#/warehouse/outbound-request/' + o.id, emptyTitle: 'Belum ada outbound request', emptyDesc: 'Buat manual atau upload CSV.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuOutbound(o) {
  const g = giOfOutbound(o);
  return [
    menuItem({ label: 'View details', icon: 'r:RiEyeLine', nav: '#/warehouse/outbound-request/' + o.id }),
    o.status === 'OPEN' ? menuItem({ label: 'Create picking order', icon: 'r:RiFileList3Line', act: 'createPicking', data: { 'data-id': o.id } }) : '',
    g && PICKING_STATUSES.includes(g.status) ? menuItem({ label: 'Buka picking', icon: 'r:RiBox3Line', nav: '#/warehouse/picking/' + g.id }) : '',
    g && SHIPPING_STATUSES.includes(g.status) ? menuItem({ label: 'Buka shipping', icon: 'r:RiTruckLine', nav: '#/warehouse/shipping/' + g.id }) : '',
    o.transferPoId ? menuItem({ label: 'Lihat PO transfer', icon: 'r:RiArrowLeftRightLine', nav: '#/warehouse/purchase-order/' + o.transferPoId }) : '',
    OR_CANCELLABLE.includes(o.status) ? menuItem({ label: 'Cancel order', icon: 'r:RiCloseCircleLine', act: 'openCancel', data: { 'data-id': o.id }, destructive: true }) : '',
  ].join('');
}

/* ───────────────────────── Outbound request: detail ───────────────────────── */
const OR_FLOW = [
  ['OPEN', 'Open', 'Order masuk (manual, CSV, atau API)'],
  ['PREPARING', 'Preparing', 'Picking order dibuat, stok di-reserve FEFO'],
  ['READY_TO_PICKUP', 'Ready to pick up', 'Picking selesai, surat jalan terbit'],
  ['SHIPPED', 'Shipped · AWB di Shipments', 'Stok dipotong, AWB lahir (At hub)'],
  ['IN_DELIVERY', 'In delivery', 'Mengikuti status shipment'],
  ['DELIVERED', 'Delivered', 'Shipment completed + POD'],
];
function orFlowSteps(o) {
  const idx = OR_FLOW.findIndex(([k]) => k === o.status);
  const terminalBad = o.status === 'CANCELLED' || o.status === 'FAILED';
  const lastIdx = terminalBad ? Math.max(0, OR_FLOW.findIndex(([k]) => k === (o.status === 'FAILED' ? 'IN_DELIVERY' : o.giId ? 'PREPARING' : 'OPEN'))) : idx;
  const steps = OR_FLOW.map(([k, title, desc]) => ({ title, desc: k === 'SHIPPED' && o.type === 'TRANSFER' ? 'Stok dipotong, AWB lahir + PO transfer terbit di hub tujuan' : desc }))
    .map((s, i) => ({ ...s, state: terminalBad ? (i < lastIdx ? 'done' : i === lastIdx ? 'failed' : 'pending') : i < idx || (i === idx && o.status === 'DELIVERED') ? 'done' : i === idx ? 'current' : 'pending' }));
  if (o.type === 'TRANSFER') {
    const tp = o.transferPoId ? po(o.transferPoId) : null;
    steps.push({ title: `Diterima di ${hub(o.destHubId).name}`, desc: tp ? `${tp.code} · receipt ${IR_LABEL[tp.grStatus] || '—'}` : 'Goods receipt PO transfer di hub tujuan', state: tp && tp.grStatus === 'FINISHED' ? 'done' : tp ? 'current' : 'pending' });
  }
  return steps;
}
function pageOutboundDetail(id) {
  const o = outbound(id);
  if (!o) return notFoundPage('Outbound request', '#/warehouse/outbound-request');
  const g = giOfOutbound(o);
  const sh = shipmentOf(o);
  const c = client(o.clientId);
  const h = hub(o.hubId);
  const tp = o.transferPoId ? po(o.transferPoId) : null;
  const reservedOf = (sku) => (g ? sum(g.lines.filter((l) => l.sku === sku).map((l) => l.qtyReserved)) : 0);
  const pickedOf = (sku) => (g ? sum(g.lines.filter((l) => l.sku === sku).map((l) => l.qtyPicked)) : 0);
  const prodCols = [
    { key: 'sku', title: 'SKU', render: (l) => `<span class="${codeCls}">${esc(l.sku)}</span>` },
    { key: 'name', title: 'Product name', render: (l) => `<span class="${nameCls}">${esc(skuName(o.clientId, l.sku))}</span>` },
    { key: 'qty', title: 'Qty order', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qty)}</span>` },
    { key: 'res', title: 'Qty reserved', align: 'right', render: (l) => `<span class="${numCls}">${g && g.status !== 'CANCELLED' ? fmtQty(reservedOf(l.sku)) : '0'}</span>` },
    { key: 'pick', title: 'Qty picked', align: 'right', render: (l) => `<span class="${numCls}">${g && g.status !== 'CANCELLED' ? fmtQty(pickedOf(l.sku)) : '0'}</span>` },
    { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(skuUom(o.clientId, l.sku))}</span>` },
    { key: 'avail', title: 'Available di hub', align: 'right', render: (l) => { const a = availableFor(o.hubId, o.clientId, l.sku); return `<span class="font-mono text-[12px] tabular-nums ${o.status === 'OPEN' && a < l.qty ? 'font-semibold text-(--state-warning-dark)' : 'text-text-sub-600'}">${fmtQty(a)}</span>`; } },
  ];
  const actions = [
    o.status === 'OPEN' ? btn({ label: 'Create picking order', icon: 'r:RiFileList3Line', act: 'createPicking', data: { 'data-id': o.id } }) : '',
    g && PICKING_STATUSES.includes(g.status) ? btn({ label: 'Buka picking', icon: 'r:RiBox3Line', tone: 'neutral', style: 'stroke', nav: '#/warehouse/picking/' + g.id }) : '',
    g && SHIPPING_STATUSES.includes(g.status) ? btn({ label: 'Buka shipping', icon: 'r:RiTruckLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/shipping/' + g.id }) : '',
    sh ? btn({ label: 'Lihat di Shipments', icon: 'r:RiExternalLinkLine', tone: 'neutral', style: 'stroke', act: 'openShipment', data: { 'data-id': sh.id } }) : '',
    tp ? btn({ label: 'Lihat PO transfer', icon: 'r:RiArrowLeftRightLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/purchase-order/' + tp.id }) : '',
    OR_CANCELLABLE.includes(o.status) ? btn({ label: 'Cancel order', tone: 'destructive', style: 'stroke', act: 'openCancel', data: { 'data-id': o.id } }) : '',
  ].join('');
  const events = [...o.events].reverse().map((e) => ({ at: e.at, title: e.title, note: e.note, by: e.actor, badge: orBadge(e.status), icon: e.actor === 'CLIENT' ? 'r:RiCodeSSlashLine' : /upload CSV/.test(e.title) ? 'r:RiUpload2Line' : /manual/.test(e.title) ? 'r:RiEditLine' : /PO transfer|Diterima di/.test(e.title) ? 'r:RiArrowLeftRightLine' : 'r:RiTimeLine' }));
  const shortages = o.status === 'OPEN' ? stockShortages(o.hubId, o.clientId, o.lines) : [];
  return `<div class="space-y-5 p-6">
    ${detailHeader({ backLabel: 'Outbound request', backHref: '#/warehouse/outbound-request', meta: `Dibuat ${fmtDateTime(o.createdAt)} · via <span class="font-semibold text-text-sub-600">${OR_SOURCE_LABEL[o.source]}</span>${uploadOf(o) ? ` <span class="font-mono">${esc(uploadOf(o).code)}</span>` : ''} · oleh <span class="font-semibold text-text-sub-600">${esc(o.createdBy)}</span>`, title: o.code, badges: `${orBadge(o.status)}${sourceTag(o)}${outboundTransferTag(o)}`, actions })}
    ${o.status === 'CANCELLED' ? alertBox('warning', 'Order dibatalkan', `${esc(o.cancelReason)} · ${fmtDateTime(o.cancelledAt)}`) : ''}
    ${shortages.length ? alertBox('warning', 'Stok belum cukup untuk picking', `Create picking order akan ditolak utuh (INSUFFICIENT_STOCK): ${shortages.map((x) => `<span class="font-mono">${esc(x.sku)}</span> butuh ${fmtQty(x.requested)}, tersedia ${fmtQty(x.available)}`).join(' · ')}. Terima barang dulu lewat goods receipt.`) : ''}
    ${tp ? alertBox('information', `PO transfer ${tp.code} terbit di ${hub(tp.hubId).name}`, `Confirmed · receipt <span class="font-medium text-text-strong-950">${IR_LABEL[tp.grStatus] || '—'}</span>. ${tp.grStatus === 'FINISHED' ? 'Barang sudah diterima di hub tujuan.' : 'Hub tujuan menerima barang lewat goods receipt.'} ${docLink('#/warehouse/purchase-order/' + tp.id, 'Buka PO →')}`) : ''}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-5 xl:col-span-2">
        ${section('Detail order', kvGrid([
          ['Request ID', `<span class="${codeCls}">${esc(o.code)}</span>`],
          ['External ID (client)', `<span class="${codeCls}">${esc(o.externalId)}</span>${o.externalIdAuto ? ` <span class="${metaCls}">(otomatis)</span>` : ''}`],
          ['Tipe', typeCell(o)],
          ['Sumber', `${sourceTag(o)}${uploadOf(o) ? ` <span class="${metaCls}"><span class="font-mono">${esc(uploadOf(o).code)}</span> · ${esc(uploadOf(o).fileName)}</span>` : ''}`],
          ['Picking order', g ? `${docLink(`#/warehouse/${PICKING_STATUSES.includes(g.status) || g.status === 'CANCELLED' ? 'picking' : 'shipping'}/${g.id}`, g.code)}${g.status === 'CANCELLED' ? ' <span class="' + metaCls + '">(dihapus)</span>' : ''}` : null],
          ['Nomor surat jalan', g && g.suratJalan ? `<span class="${codeCls}">${esc(g.suratJalan)}</span>` : null],
          ['Order date', fmtDateTime(o.orderDate)],
          ['Expected delivery', fmtDate(o.expectedDelivery)],
          ['Method', o.method === 'DELIVERY' ? 'Delivery' : 'Take away'],
          ['Service', `<span class="${codeCls}">${esc(o.serviceType)}</span>`],
          ['Catatan order', o.notes ? esc(o.notes) : null],
          ['Shipment (AWB)', sh ? `<span class="inline-flex items-center gap-1.5">${waybillLink(sh)}${shBadge(sh.status)}</span>` : '<span class="text-[12px] text-text-soft-400">Lahir saat shipping di-submit</span>'],
          ...(o.type === 'TRANSFER' ? [['Hub tujuan', esc(hub(o.destHubId).name)], ['PO transfer (hub tujuan)', tp ? `<span class="inline-flex items-center gap-1.5">${docLink('#/warehouse/purchase-order/' + tp.id, tp.code)}${irBadge(tp.grStatus)}</span>` : '<span class="text-[12px] text-text-soft-400">Terbit saat shipping di-submit</span>']] : []),
        ]))}
        ${section('Products', table({ columns: prodCols, rows: o.lines }), { desc: 'Qty reserved & picked diambil dari goods issue lines (alokasi per storage/lot), bukan dari qty order.' })}
        ${section('Timeline', timeline(events), { desc: 'Terbaru di atas. Status pengiriman masuk lewat interface dari Shipments.' })}
      </div>
      <div class="flex flex-col gap-5">
        ${section('Alur end-to-end', flowSteps(orFlowSteps(o)))}
        ${section('Origin', kv('Client', esc(c.name)) + kv(o.type === 'TRANSFER' ? 'Hub asal' : 'Hub', esc(h.name), esc(h.address)))}
        ${section('Destination', kv('Penerima', esc(o.recipient.name)) + kv('Telepon', `<span class="font-mono">${esc(o.recipient.phone)}</span>`) + kv('Alamat', esc(o.destination.address)) + kv('Koordinat', `<span class="${numCls}">${o.destination.lat}, ${o.destination.lng}</span>`) + (o.destination.notes ? kv('Catatan', esc(o.destination.notes)) : ''))}
      </div>
    </div>
  </div>`;
}

/* ───────────────────────── Picking ───────────────────────── */
const PK_TABS = ['ALL', 'NOT_PICKED', 'PARTIALLY_PICKED', 'ALL_PICKED'];
function pagePickingList() {
  const all = db.gis.filter(inHub).filter((g) => PICKING_STATUSES.includes(g.status));
  const tab = view.tab.pk || 'ALL';
  const q = (view.search.pk || '').toLowerCase();
  const rows = all.filter((g) => tab === 'ALL' || g.status === tab).filter((g) => {
    const o = outbound(g.outboundId);
    return !q || [g.code, o.code, o.externalId, o.recipient.name, g.pickerName].join(' ').toLowerCase().includes(q);
  });
  const cols = [
    { key: 'code', title: 'Picking order', render: (g) => `<span class="${codeCls}">${esc(g.code)}</span>` },
    { key: 'order', title: 'Request / External ID', render: (g) => orderRefCell(outbound(g.outboundId)) },
    { key: 'type', title: 'Tipe', render: (g) => typeCell(outbound(g.outboundId)) },
    { key: 'client', title: 'Client', render: (g) => `<span class="${nameCls}">${esc(client(g.clientId).name)}</span>` },
    { key: 'recipient', title: 'Customer', render: (g) => `<span class="${nameCls}">${esc(outbound(g.outboundId).recipient.name)}</span>` },
    { key: 'picker', title: 'Picker', render: (g) => (g.pickerName ? `<span class="${nameCls}">${esc(g.pickerName)}</span>` : `<span class="text-[12px] text-text-soft-400">Belum di-assign</span>`) },
    { key: 'progress', title: 'Picked', align: 'right', render: (g) => `<span class="font-mono text-[12px] tabular-nums text-text-sub-600">${fmtQty(sum(g.lines.map((l) => l.qtyPicked)))} / ${fmtQty(sum(g.lines.map((l) => l.qtyReserved)))}</span>` },
    { key: 'status', title: 'Status', render: (g) => giBadge(g.status) },
    { key: 'hub', title: 'Hub', render: (g) => `<span class="${nameCls}">${esc(hub(g.hubId).name)}</span>` },
    { key: 'created', title: 'Created', render: (g) => `<span class="${dateCls}">${fmtDateTime(g.createdAt)}</span>` },
    { key: 'actions', title: '', align: 'right', render: (g) => rowMenu('pk:' + g.id) },
  ];
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Outbound management · Goods issue', title: 'Picking', desc: 'Goods issue fase picking. Sistem sudah memilih storage & lot secara FEFO saat picking order dibuat; picker mengonfirmasi qty yang diambil, lalu <span class="font-medium text-text-strong-950">Ready to pick up</span> menerbitkan surat jalan dan memindahkan dokumen ke Shipping.', actions: headerActions() })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-1 pb-3 lg:flex-row lg:items-end lg:justify-between lg:pb-0">
        ${tabsLine(tabsWithCounts(PK_TABS, all, (g) => g.status, GI_LABEL), tab, 'tabPk')}
        <div class="flex flex-1 items-center justify-end gap-2 lg:py-2">${searchField({ model: 'search.pk', value: view.search.pk, placeholder: 'Search picking, order, picker…', cls: 'max-w-xs flex-1' })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, rowNav: (g) => '#/warehouse/picking/' + g.id, emptyTitle: 'Tidak ada picking', emptyDesc: 'Buat picking order dari Outbound request berstatus Open.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuPicking(g) {
  return [
    menuItem({ label: 'View details', icon: 'r:RiEyeLine', nav: '#/warehouse/picking/' + g.id }),
    menuItem({ label: 'Buka outbound request', icon: 'r:RiFileList3Line', nav: '#/warehouse/outbound-request/' + g.outboundId }),
    menuItem({ label: 'Print picking list', icon: 'r:RiPrinterLine', act: 'openPrint', data: { 'data-kind': 'picking', 'data-id': g.id } }),
    menuItem({ label: 'Delete picking (lepas reserve)', icon: 'r:RiDeleteBinLine', act: 'deletePicking', data: { 'data-id': g.id }, destructive: true }),
  ].join('');
}
function pagePickingDetail(id) {
  const g = gi(id);
  if (!g) return notFoundPage('Picking', '#/warehouse/picking');
  if (!PICKING_STATUSES.includes(g.status) && g.status !== 'CANCELLED') return pageShippingDetail(id);
  const o = outbound(g.outboundId);
  const editable = PICKING_STATUSES.includes(g.status);
  const ordered = o.lines.map((l) => ({ ...l, name: skuName(o.clientId, l.sku), uom: skuUom(o.clientId, l.sku) }));
  const pickCols = [
    { key: 'sku', title: 'SKU', render: (l) => `<div><p class="${codeCls}">${esc(l.sku)}</p><p class="${metaCls}">${esc(l.name)}</p></div>` },
    { key: 'storage', title: 'Storage', render: (l) => storageCell(l.storageId) },
    { key: 'lot', title: 'Batch / lot', render: (l) => { const d = daysUntil(l.expiry); return `<div><p class="${numCls}">${esc(l.lot)}</p><p class="${cx(metaCls, d != null && d < 0 ? 'text-(--state-error-base)' : '')}">${l.expiry ? 'Exp ' + fmtDate(l.expiry) + (d != null && d < 0 ? ' · expired' : '') : 'Tanpa expiry'}</p></div>`; } },
    { key: 'res', title: 'Qty reserved', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qtyReserved)}</span>` },
    { key: 'picked', title: 'Qty picked', align: 'right', render: (l) => (editable ? `<div class="ml-auto w-24">${input({ type: 'number', size: 'sm', min: 0, max: l.qtyReserved, value: l.qtyPicked, model: 'pick.' + l.id, fk: 'pick.' + l.id, inputCls: 'text-right', label: `Qty picked ${l.sku} ${l.lot}` })}</div>` : `<span class="${numCls}">${fmtQty(l.qtyPicked)}</span>`) },
    { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(l.uom)}</span>` },
  ];
  const reasons = [!g.pickerName ? 'pilih picker' : null, g.status !== 'ALL_PICKED' ? 'pick semua baris sesuai alokasi' : null].filter(Boolean);
  const canReady = editable && !reasons.length;
  return `<div class="space-y-5 p-6">
    ${detailHeader({ backLabel: 'Picking', backHref: '#/warehouse/picking', meta: `Dibuat ${fmtDateTime(g.createdAt)} · oleh <span class="font-semibold text-text-sub-600">${esc(g.createdBy)}</span>`, title: g.code, badges: `${giBadge(g.status)}${outboundTransferTag(o)}`,
      actions: `${btn({ label: 'Print picking list', icon: 'r:RiPrinterLine', tone: 'neutral', style: 'stroke', act: 'openPrint', data: { 'data-kind': 'picking', 'data-id': g.id } })}` + (editable ? `${btn({ label: 'Delete', icon: 'r:RiDeleteBinLine', tone: 'destructive', style: 'ghost', act: 'deletePicking', data: { 'data-id': g.id } })}${btn({ label: 'Ready to pick up', icon: 'r:RiCheckLine', act: 'readyToPickup', data: { 'data-id': g.id }, disabled: !canReady })}` : '') })}
    ${g.status === 'CANCELLED' ? alertBox('warning', 'Picking dihapus', 'Reserve stok sudah dilepas; outbound request kembali Open.') : ''}
    ${editable && !canReady ? `<p class="-mt-2 text-right text-[12px] text-text-sub-600">${ic('r:RiInformationLine', 'size-3.5 inline -mt-0.5 mr-1')}Ready to pick up aktif setelah: ${reasons.join(' + ')}.</p>` : ''}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-5 xl:col-span-2">
        ${section('Picked item', table({ columns: pickCols, rows: g.lines }), { desc: 'Alokasi FEFO: lot dengan expiry terdekat diambil duluan; expiry sama → bin dulu, baru section/location. Storage tipe Karantina & Staging tidak pernah dialokasikan.', right: editable ? btn({ label: 'Pick semua sesuai alokasi', icon: 'r:RiCheckboxMultipleLine', size: 'sm', tone: 'neutral', style: 'stroke', act: 'pickAll', data: { 'data-id': g.id } }) : '' })}
        ${section('Ordered item', table({ columns: [
          { key: 'sku', title: 'SKU', render: (l) => `<span class="${codeCls}">${esc(l.sku)}</span>` },
          { key: 'name', title: 'Product name', render: (l) => `<span class="${nameCls}">${esc(l.name)}</span>` },
          { key: 'qty', title: 'Qty order', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qty)}</span>` },
          { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(l.uom)}</span>` },
        ], rows: ordered }))}
        ${alertBox('information', 'Kapan stok berubah?', 'Reserved sudah naik sejak picking order dibuat. On hand baru berkurang saat shipping di-submit. Setelah itu tidak ada rollback stok dari sisi Shipments.')}
      </div>
      <div class="flex flex-col gap-5">
        ${section('Picker', `<div class="flex flex-col gap-3">${field('Picker', select({ model: 'draft.picker_' + g.id, value: g.pickerName || '', placeholder: 'Pilih picker', options: pickerOptions(), onChange: 'assignPicker', disabled: !editable, label: 'Picker' }), 'Wajib sebelum Ready to pick up.')}</div>`)}
        ${section('Info', kv('Request ID', docLink('#/warehouse/outbound-request/' + o.id, o.code)) + kv('External ID', `<span class="${codeCls}">${esc(o.externalId)}</span>`) + kv('Tipe', typeCell(o)) + kv('Client', esc(client(g.clientId).name)) + kv('Hub', esc(hub(g.hubId).name)) + kv('Customer', esc(o.recipient.name)) + kv('Expected delivery', fmtDate(o.expectedDelivery)))}
      </div>
    </div>
  </div>`;
}

/* ───────────────────────── Shipping ───────────────────────── */
const SP_TABS = ['ALL', 'READY_TO_PICKUP', 'SHIPPED', 'IN_DELIVERY', 'DELIVERED', 'FAILED'];
function pageShippingList() {
  const all = db.gis.filter(inHub).filter((g) => SHIPPING_STATUSES.includes(g.status));
  const tab = view.tab.sp || 'ALL';
  const q = (view.search.sp || '').toLowerCase();
  const rows = all.filter((g) => tab === 'ALL' || g.status === tab).filter((g) => {
    const o = outbound(g.outboundId);
    const sh = g.shipmentId ? shipment(g.shipmentId) : null;
    return !q || [g.code, o.code, o.externalId, g.suratJalan, sh && sh.waybill].join(' ').toLowerCase().includes(q);
  });
  const sel = view.sel.sp || [];
  const selectable = rows.filter((g) => g.status === 'READY_TO_PICKUP');
  view.selScope = { name: 'sp', ids: selectable.map((g) => g.id) };
  const nSel = sel.filter((id) => selectable.some((g) => g.id === id)).length;
  const cols = [
    { key: 'order', title: 'Request / External ID', render: (g) => orderRefCell(outbound(g.outboundId)) },
    { key: 'type', title: 'Tipe', render: (g) => typeCell(outbound(g.outboundId)) },
    { key: 'code', title: 'Picking order', render: (g) => `<span class="${codeCls}">${esc(g.code)}</span>` },
    { key: 'client', title: 'Client', render: (g) => `<span class="${nameCls}">${esc(client(g.clientId).name)}</span>` },
    { key: 'expected', title: 'Expected', render: (g) => `<span class="${dateCls}">${fmtDate(outbound(g.outboundId).expectedDelivery)}</span>` },
    { key: 'sj', title: 'Surat jalan', render: (g) => `<span class="${codeCls}">${esc(g.suratJalan)}</span>` },
    { key: 'status', title: 'Status', render: (g) => giBadge(g.status) },
    { key: 'awb', title: 'Shipment (AWB)', render: (g) => { const sh = g.shipmentId && shipment(g.shipmentId); return sh ? `<div class="flex items-center gap-1.5">${waybillLink(sh)}${shBadge(sh.status)}</div>` : `<span class="text-[12px] text-text-soft-400">Lahir saat submit</span>`; } },
    { key: 'hub', title: 'Hub', render: (g) => `<span class="${nameCls}">${esc(hub(g.hubId).name)}</span>` },
    { key: 'actions', title: '', align: 'right', render: (g) => rowMenu('sp:' + g.id) },
  ];
  const selection = {
    all: selectable.length > 0 && selectable.every((g) => sel.includes(g.id)), allAct: 'selAll', selectableCount: selectable.length,
    rowAct: 'selRow', key: (g) => g.id, isSelected: (g) => sel.includes(g.id), isSelectable: (g) => g.status === 'READY_TO_PICKUP',
  };
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Outbound management · Goods issue', title: 'Shipping',
      desc: '<span class="font-medium text-text-strong-950">Submit shipping</span> = serah terima ke logistic. WMS memotong stok dan memanggil interface FulfillmentGateway di transaksi yang sama, sehingga AWB langsung ada di menu Shipments (item sudah hub-scanned). Untuk outbound Transfer, PO transfer ikut terbit di hub tujuan. Status pengiriman kembali ke WMS lewat interface dari Shipments.',
      actions: headerActions(btn({ label: nSel ? `Submit shipping (${nSel})` : 'Submit shipping', icon: 'r:RiSendPlaneLine', act: 'bulkSubmitShipping', disabled: !nSel })) })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-1 pb-3 lg:flex-row lg:items-end lg:justify-between lg:pb-0">
        ${tabsLine(tabsWithCounts(SP_TABS, all, (g) => g.status, GI_LABEL), tab, 'tabSp')}
        <div class="flex flex-1 items-center justify-end gap-3 lg:py-2">${searchField({ model: 'search.sp', value: view.search.sp, placeholder: 'Search order, SJ, AWB…', cls: 'max-w-xs flex-1' })}</div>
      </div>
      ${nSel ? '' : `<p class="mx-4 mt-3 ${metaCls}">Centang baris <span class="font-medium text-text-strong-950">Ready to pick up</span> untuk bulk submit shipping.</p>`}
      <div class="p-4">${table({ columns: cols, rows, selection, rowNav: (g) => '#/warehouse/shipping/' + g.id, emptyTitle: 'Tidak ada shipping', emptyDesc: 'Picking yang sudah Ready to pick up akan muncul di sini.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuShipping(g) {
  const sh = g.shipmentId && shipment(g.shipmentId);
  const o = outbound(g.outboundId);
  return [
    menuItem({ label: 'View details', icon: 'r:RiEyeLine', nav: '#/warehouse/shipping/' + g.id }),
    g.status === 'READY_TO_PICKUP' ? menuItem({ label: 'Submit shipping', icon: 'r:RiSendPlaneLine', act: 'submitShipping', data: { 'data-id': g.id } }) : '',
    sh ? menuItem({ label: 'Lihat di Shipments', icon: 'r:RiExternalLinkLine', act: 'openShipment', data: { 'data-id': sh.id } }) : '',
    o.transferPoId ? menuItem({ label: 'Lihat PO transfer', icon: 'r:RiArrowLeftRightLine', nav: '#/warehouse/purchase-order/' + o.transferPoId }) : '',
    menuItem({ label: 'Print surat jalan', icon: 'r:RiPrinterLine', act: 'openPrint', data: { 'data-kind': 'sj', 'data-id': g.id } }),
    menuItem({ label: 'Print picking list', icon: 'r:RiPrinterLine', act: 'openPrint', data: { 'data-kind': 'picking', 'data-id': g.id } }),
  ].join('');
}
function eventLog(g) {
  const evs = busOf(g.id);
  if (!evs.length) return '';
  return `<div><p class="label-eyebrow mb-2">Log integrasi</p><ul class="flex flex-col gap-2">${evs.map((e) => `<li class="flex items-start gap-2">
      <span class="mt-1.5 size-1.5 shrink-0 rounded-full ${e.from === 'warehouse' ? 'bg-accent' : 'bg-(--state-information-base)'}"></span>
      <div class="min-w-0"><p class="font-mono text-[11px] font-semibold text-text-strong-950">${esc(e.call)}</p>
      <p class="${metaCls}">${esc(e.from)} → ${esc(e.to)} · ${esc(e.data.result)} · ${fmtDateTime(e.at)}</p></div></li>`).join('')}</ul></div>`;
}
function syncCard(g) {
  const o = outbound(g.outboundId);
  const sh = g.shipmentId && shipment(g.shipmentId);
  const c = client(g.clientId);
  const h = hub(g.hubId);
  if (sh) {
    return section('Integrasi Shipments', `<div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3 rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3 py-2.5"><div><p class="label-eyebrow">Waybill</p><p class="mt-1 font-mono text-[15px] font-bold tracking-tight text-accent">${esc(sh.waybill)}</p></div>${shBadge(sh.status)}</div>
        <div>${kv('Booking ID', `<span class="${codeCls}">${esc(sh.bookingId)}</span>`, '= external ID client')}${kv('Type', 'DOCKING · origin hub')}${kv('Items', `${sh.items.length} item`, sh.items.map((i) => esc(i.code.slice(-2)) + ' ' + ITEM_LABEL[i.status]).join(' · '))}${kv('Dibuat', fmtDateTime(sh.createdAt))}${sh.riderCode ? kv('Rider', esc(sh.riderCode)) : ''}</div>
        ${eventLog(g)}
        ${btn({ label: 'Buka di Shipments', icon: 'r:RiExternalLinkLine', tone: 'neutral', style: 'stroke', act: 'openShipment', data: { 'data-id': sh.id }, cls: 'w-full' })}
      </div>`, { right: tag('via interface', 'accent', 'xs', 'r:RiLinksLine') });
  }
  const li = (html) => `<li class="flex gap-2">${ic('r:RiArrowRightSLine', 'size-4 shrink-0 text-icon-soft-400')}<span>${html}</span></li>`;
  const preview = `<ul class="flex flex-col gap-1.5 text-[12px] text-text-sub-600">
      ${li(`WMS memotong stok on hand ${fmtQty(sum(g.lines.map((l) => l.qtyPicked)))} unit (ledger ${o.type === 'TRANSFER' ? 'TRANSFER_OUT' : 'OUTBOUND'} ${esc(g.code)})`)}
      ${li(`WMS memanggil interface <span class="font-mono text-text-strong-950">FulfillmentGateway</span> di transaksi yang sama — sukses berarti AWB pasti ada`)}
      ${li(`Adapter membuat 1 shipment <span class="font-semibold text-text-strong-950">DOCKING</span> · ${esc(c.name)} · bookingId <span class="font-mono text-text-strong-950">${esc(o.externalId)}</span>, origin ${esc(h.name)}`)}
      ${li(`${o.lines.length} item (1 per SKU line) langsung <span class="font-semibold text-text-strong-950">Hub scanned</span>, shipment <span class="font-semibold text-text-strong-950">At hub</span>`)}
      ${o.type === 'TRANSFER' ? li(`<span class="font-semibold text-text-strong-950">PO transfer</span> terbit di ${esc(hub(o.destHubId).name)} — Confirmed, receipt Scheduled, baris = qty yang dikirim`) : ''}
    </ul>`;
  return section('Integrasi Shipments', `<div class="flex flex-col gap-3">
      <p class="text-[12px] text-text-sub-600">Submit shipping akan:</p>
      ${preview}
      ${btn({ label: 'Submit shipping', icon: 'r:RiSendPlaneLine', act: 'submitShipping', data: { 'data-id': g.id }, cls: 'w-full' })}
    </div>`, { right: tag('belum', 'gray', 'xs') });
}
function pageShippingDetail(id) {
  const g = gi(id);
  if (!g) return notFoundPage('Shipping', '#/warehouse/shipping');
  if (PICKING_STATUSES.includes(g.status)) return pagePickingDetail(id);
  const o = outbound(g.outboundId);
  const sh = g.shipmentId && shipment(g.shipmentId);
  const tp = o.transferPoId ? po(o.transferPoId) : null;
  const actions = [
    btn({ label: 'Print surat jalan', icon: 'r:RiPrinterLine', tone: 'neutral', style: 'stroke', act: 'openPrint', data: { 'data-kind': 'sj', 'data-id': g.id } }),
    g.status === 'READY_TO_PICKUP' ? btn({ label: 'Submit shipping', icon: 'r:RiSendPlaneLine', act: 'submitShipping', data: { 'data-id': g.id } }) : '',
    sh ? btn({ label: 'Lihat di Shipments', icon: 'r:RiExternalLinkLine', tone: 'neutral', style: 'stroke', act: 'openShipment', data: { 'data-id': sh.id } }) : '',
    tp ? btn({ label: 'Lihat PO transfer', icon: 'r:RiArrowLeftRightLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/purchase-order/' + tp.id }) : '',
  ].join('');
  const pickCols = [
    { key: 'sku', title: 'SKU', render: (l) => `<div><p class="${codeCls}">${esc(l.sku)}</p><p class="${metaCls}">${esc(l.name)}</p></div>` },
    { key: 'storage', title: 'Storage', render: (l) => storageCell(l.storageId) },
    { key: 'lot', title: 'Batch / lot', render: (l) => `<span class="${numCls}">${esc(l.lot)}</span>` },
    { key: 'qty', title: 'Qty picked', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(l.qtyPicked)}</span>` },
    { key: 'uom', title: 'UoM', render: (l) => `<span class="${metaCls}">${esc(l.uom)}</span>` },
  ];
  return `<div class="space-y-5 p-6">
    ${detailHeader({ backLabel: 'Shipping', backHref: '#/warehouse/shipping', meta: `Ready ${fmtDateTime(g.readyAt)} · picker <span class="font-semibold text-text-sub-600">${esc(g.pickerName || '—')}</span>${g.shippedAt ? ` · shipped ${fmtDateTime(g.shippedAt)}` : ''}`, title: o.code, badges: `${giBadge(g.status)}${outboundTransferTag(o)}${sh ? tag('AWB ' + sh.waybill, 'accent', 'xs', 'r:RiLinksLine') : ''}`, actions })}
    ${g.status === 'CANCELLED' ? alertBox('warning', 'Goods issue dibatalkan', 'Reserve sudah dilepas.') : ''}
    ${tp ? alertBox('success', `PO transfer ${tp.code} terbit di ${hub(tp.hubId).name}`, `Confirmed · receipt ${IR_LABEL[tp.grStatus] || '—'} · ${tp.lines.map((l) => `<span class="font-mono">${esc(l.sku)}</span> × ${fmtQty(l.qty)}`).join(' · ')}. ${tp.grStatus === 'FINISHED' ? 'Sudah diterima.' : docLink('#/warehouse/goods-receipt/new?po=' + tp.id, 'Terima di hub tujuan →')}`) : ''}
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="flex flex-col gap-5 xl:col-span-2">
        ${section('Detail order', kvGrid([
          ['External ID', `<span class="${codeCls}">${esc(o.externalId)}</span>`], ['Picking order', `<span class="${codeCls}">${esc(g.code)}</span>`],
          ['Nomor surat jalan', `<span class="${codeCls}">${esc(g.suratJalan || '—')}</span>`], ['Status', giBadge(g.status)],
          ['Tipe', typeCell(o)], ['Order date', fmtDateTime(o.orderDate)], ['Expected delivery', fmtDate(o.expectedDelivery)],
          ['Method', o.method === 'DELIVERY' ? 'Delivery' : 'Take away'], ['Picker', esc(g.pickerName || '—')],
        ]))}
        ${section('Picked item', table({ columns: pickCols, rows: g.lines }))}
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
          ${section('Origin', kv('Client', esc(client(g.clientId).name)) + kv('Hub', esc(hub(g.hubId).name), esc(hub(g.hubId).address)))}
          ${section('Destination', kv('Customer', esc(o.recipient.name)) + kv('Telepon', `<span class="font-mono">${esc(o.recipient.phone)}</span>`) + kv('Alamat', esc(o.destination.address)))}
        </div>
      </div>
      <div class="flex flex-col gap-5">${g.status === 'CANCELLED' ? '' : syncCard(g)}${section('Alur end-to-end', flowSteps(orFlowSteps(o)))}</div>
    </div>
  </div>`;
}

/* ───────────────────────── Modal: order dari client API (next phase) ───────────────────────── */
function apiDraftDefaults() {
  const d = view.draft;
  if (d.apiInit) return;
  d.apiInit = true;
  d.apiClient = 12;
  d.apiHub = 3;
  d.apiExt = 'FORE-SO-' + (88200 + Math.floor(Math.random() * 700));
  const dest = DESTS[12][1];
  Object.assign(d, { apiName: dest.name, apiPhone: dest.phone, apiAddr: dest.address, apiLat: dest.lat, apiLng: dest.lng, apiSku1: 'FORE-CUP-12OZ', apiQty1: 12, apiSku2: 'FORE-BEAN-1KG', apiQty2: 6 });
}
function apiPayload() {
  const d = view.draft;
  const lines = [[d.apiSku1, d.apiQty1], [d.apiSku2, d.apiQty2]].filter(([s, q]) => s && Number(q) > 0).map(([sku, qty]) => ({ sku, qty: Number(qty) }));
  return {
    externalId: d.apiExt, hubID: Number(d.apiHub), serviceType: 'SAME_DAY', method: 'DELIVERY',
    recipient: { name: d.apiName, phone: d.apiPhone },
    destination: { address: d.apiAddr, latitude: Number(d.apiLat), longitude: Number(d.apiLng) },
    lines,
  };
}
function modalApiOrder() {
  apiDraftDefaults();
  const d = view.draft;
  const cid = Number(d.apiClient);
  const skus = db.skus.filter((s) => s.clientId === cid).map((s) => ({ value: s.sku, label: `${s.sku} · ${s.name} (${fmtQty(availableFor(d.apiHub, cid, s.sku))} avail)` }));
  const resp = d.apiResp;
  return formModal({
    width: 'max-w-3xl', icon: 'r:RiCodeSSlashLine', title: 'Order masuk dari client API', desc: 'Simulasi sistem client memanggil endpoint fase 2. Auth memakai API key / token integrasi yang sama dengan create shipment yang sudah ada. Selalu tipe Regular.',
    headerExtra: tag('Next phase', 'gray', 'sm'),
    body: `<div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">${field('Client (dari credential)', select({ model: 'draft.apiClient', value: cid, options: clientOptions(), onChange: 'apiClientChange' }))}${field('Hub stok', select({ model: 'draft.apiHub', value: d.apiHub, options: hubOptions(), onChange: 'rerender' }))}</div>
        ${field('externalId (idempotency key)', input({ model: 'draft.apiExt', value: d.apiExt, rerender: 'debounce', mono: true }), 'Kirim ulang externalId yang sama → response EXISTS.')}
        <div class="grid grid-cols-2 gap-3">${field('Penerima', input({ model: 'draft.apiName', value: d.apiName, rerender: 'debounce' }))}${field('Telepon', input({ model: 'draft.apiPhone', value: d.apiPhone, rerender: 'debounce' }))}</div>
        ${field('Alamat tujuan', input({ model: 'draft.apiAddr', value: d.apiAddr, rerender: 'debounce' }))}
        <div class="grid grid-cols-[minmax(0,1fr)_88px] gap-2 items-end">${field('Line 1 · SKU', select({ model: 'draft.apiSku1', value: d.apiSku1, options: skus, placeholder: '—', onChange: 'rerender' }))}${field('Qty', input({ type: 'number', model: 'draft.apiQty1', value: d.apiQty1, rerender: 'debounce' }))}</div>
        <div class="grid grid-cols-[minmax(0,1fr)_88px] gap-2 items-end">${field('Line 2 · SKU', select({ model: 'draft.apiSku2', value: d.apiSku2, options: skus, placeholder: '— (kosong)', onChange: 'rerender' }))}${field('Qty', input({ type: 'number', model: 'draft.apiQty2', value: d.apiQty2, rerender: 'debounce' }))}</div>
      </div>
      <div class="flex flex-col gap-2 min-w-0">
        <p class="label-eyebrow">Request</p>
        <pre class="max-h-[300px] overflow-auto rounded-xl border border-stroke-soft-200 bg-bg-weak-50 p-3 font-mono text-[11px] leading-relaxed text-text-strong-950">POST /v1/integration/outbound-orders
x-api-key: dash_live_${esc(client(cid).code)}••••••••  <span class="text-text-soft-400"># key existing</span>
Content-Type: application/json

${esc(JSON.stringify(apiPayload(), null, 2))}</pre>
        ${resp ? `<p class="label-eyebrow mt-1">Response · <span class="${resp.http === 200 ? 'text-(--state-success-dark)' : 'text-(--state-error-base)'}">HTTP ${resp.http}</span></p><pre class="max-h-[200px] overflow-auto rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 font-mono text-[11px] leading-relaxed text-text-strong-950">${esc(JSON.stringify(resp.body, null, 2))}</pre>` : `<p class="${metaCls}">Order lahir berstatus <span class="font-semibold text-text-strong-950">Open</span> — belum ada reserve. Ops lalu membuat picking order dari menu Outbound request.</p>`}
      </div>
    </div>`,
    footer: `${btn({ label: resp && resp.http === 200 ? 'Tutup' : 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${resp && resp.orderId ? btn({ label: 'Lihat order', icon: 'r:RiArrowRightLine', tone: 'neutral', style: 'stroke', act: 'gotoApiOrder' }) : ''}${btn({ label: 'Kirim request', icon: 'r:RiSendPlaneLine', act: 'sendApiOrder' })}`,
  });
}

/* ───────────────────────── Modal: cancel + shortfall ───────────────────────── */
function modalCancel(id) {
  const o = outbound(id);
  const err = view.draft.cancelError;
  return formModal({
    icon: 'r:RiCloseCircleLine', iconTone: 'danger', title: 'Cancel outbound request', desc: `${o.code} · ${o.externalId}`,
    body: `<div class="flex flex-col gap-3">${o.giId ? alertBox('information', null, 'Reserve stok dari picking order akan dilepas.') : ''}${field('Alasan', textarea({ model: 'draft.cancelReason', value: view.draft.cancelReason || '', placeholder: 'mis. client membatalkan order', invalid: !!err, label: 'Alasan cancel' }), null, { required: true, error: err })}</div>`,
    footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: 'Cancel order', tone: 'destructive', act: 'confirmCancel', data: { 'data-id': o.id } })}`,
  });
}
function modalShortfall(o, rows) {
  return formModal({
    icon: 'r:RiErrorWarningLine', iconTone: 'danger', title: 'Stok tidak cukup', desc: `${o.code} · picking order tidak dibuat, tidak ada yang di-reserve (all-or-nothing).`,
    body: table({ columns: [
      { key: 'sku', title: 'SKU', render: (r) => `<span class="${codeCls}">${esc(r.sku)}</span>` },
      { key: 'req', title: 'Requested', align: 'right', render: (r) => `<span class="${numCls}">${fmtQty(r.requested)}</span>` },
      { key: 'av', title: 'Available', align: 'right', render: (r) => `<span class="${numCls}">${fmtQty(r.available)}</span>` },
      { key: 'sf', title: 'Shortfall', align: 'right', render: (r) => `<span class="font-mono text-[12px] font-semibold tabular-nums text-(--state-error-base)">${fmtQty(r.shortfall)}</span>` },
    ], rows }) + `<p class="mt-3 ${metaCls}">422 INSUFFICIENT_STOCK. Jalan keluar: terima barang lewat Goods receipt dulu, atau minta client kirim ulang dengan qty sesuai stok. Stok di Karantina tidak dihitung.</p>`,
    footer: `${btn({ label: 'Tutup', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: 'Buka inbound request', icon: 'r:RiInboxArchiveLine', tone: 'neutral', style: 'stroke', nav: '#/warehouse/inbound-request' })}`,
  });
}
