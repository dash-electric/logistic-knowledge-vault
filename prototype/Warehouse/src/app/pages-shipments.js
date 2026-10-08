// ── Hub ops › Shipments (replika halaman existing) + panel detail + simulasi flow logistic ──
const SH_TABS = ['ALL', 'CREATED', 'AT_HUB', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'IN_DELIVERY', 'IN_DISPUTE', 'COMPLETED', 'RETURNED', 'CANCELLED', 'FAILED'];
function pageShipments() {
  const all = db.shipments.filter(inHub);
  const tab = view.tab.sh || 'ALL';
  const q = (view.search.sh || '').toLowerCase();
  const rows = all.filter((s) => tab === 'ALL' || s.status === tab).filter((s) => !q || [s.waybill, s.bookingId, s.receiver.name, s.wms ? s.wms.outboundCode : ''].join(' ').toLowerCase().includes(q));
  const cols = [
    { key: 'waybill', title: 'Waybill', render: (s) => `<span class="${codeCls} text-accent">${esc(s.waybill)}</span>` },
    { key: 'booking', title: 'Booking ID', render: (s) => `<span class="${codeCls}">${esc(s.bookingId)}</span>` },
    { key: 'batch', title: 'Batch Code', render: (s) => (s.source === 'WMS' ? tag('WMS · ' + gi(s.wms.giId).code, 'accent', 'xs', 'r:RiLinksLine') : s.uploadCode ? `<span class="font-mono text-[12px] font-semibold text-text-sub-600 whitespace-nowrap">${esc(s.uploadCode)}</span>` : dash) },
    { key: 'client', title: 'Client', render: (s) => `<div><p class="${nameCls}">${esc(client(s.clientId).name)}</p></div>` },
    { key: 'receiver', title: 'Receiver', render: (s) => `<div><p class="${nameCls}">${esc(s.receiver.name)}</p><p class="${metaCls} truncate max-w-[260px]">${esc(s.receiver.address)}</p></div>` },
    { key: 'status', title: 'Status', render: (s) => shBadge(s.status) },
    { key: 'type', title: 'Type', render: (s) => `<span class="${metaCls}">${esc(s.type)}</span>` },
    { key: 'items', title: 'Items', align: 'right', render: (s) => `<span class="text-[13px] tabular-nums text-text-sub-600">${s.items.length}</span>` },
    { key: 'created', title: 'Created', render: (s) => `<span class="${dateCls}">${fmtIsoDay(s.createdAt)}</span>` },
    { key: 'actions', title: '', align: 'right', render: (s) => rowMenu('sh:' + s.id) },
  ];
  return `<div class="space-y-5 p-6">
    <div class="flex flex-col gap-3 border-b border-stroke-soft-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-[28px] font-extrabold tracking-tight text-text-strong-950 leading-none">Shipments</h1>
        <p class="mt-2 max-w-2xl text-sm text-text-sub-600 leading-relaxed">Bulk-imported AWBs from client CSV. Preview → commit creates the shipments + items that downstream scan &amp; dispatch stages will act on. <span class="font-medium text-text-strong-950">Baru:</span> AWB juga lahir dari Warehouse saat shipping di-submit (Batch code <span class="font-mono">WMS</span>).</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        ${btn({ label: 'Refresh', icon: 'r:RiRefreshLine', tone: 'neutral', style: 'stroke', act: 'refresh' })}${btn({ label: 'Export CSV', icon: 'r:RiDownload2Line', tone: 'neutral', style: 'stroke', act: 'outOfScope' })}${btn({ label: 'Import', icon: 'r:RiUpload2Line', tone: 'neutral', style: 'stroke', act: 'outOfScope' })}${btn({ label: 'Buat Shipment', icon: 'r:RiAddLine', act: 'outOfScope' })}
      </div>
    </div>
    ${card(`<div class="border-b border-stroke-soft-200 px-4 pt-1">${tabsLine(tabsWithCounts(SH_TABS, all, (s) => s.status, SH_LABEL), tab, 'tabSh')}</div>
      <div class="flex flex-wrap items-center justify-between gap-2 px-4 pt-3"><p class="${metaCls}">Klik baris untuk panel detail. AWB dari Warehouse ditandai <span class="font-mono">WMS</span> di Batch Code; status bisa disimulasikan dari panel.</p><div class="flex items-center gap-2">${searchField({ model: 'search.sh', value: view.search.sh, placeholder: 'Search waybill, booking ID, outbound…', cls: 'w-72' })}${btn({ label: 'Filter', icon: 'r:RiFilter3Line', tone: 'neutral', style: 'ghost', size: 'sm', act: 'outOfScope' })}</div></div>
      <div class="p-4">${table({ columns: cols, rows, rowAct: (s) => ['openShipment', s.id] })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuShipment(s) {
  return [
    menuItem({ label: 'View details', icon: 'r:RiEyeLine', act: 'openShipment', data: { 'data-id': s.id } }),
    ...nextShipmentSteps(s).map((step) => menuItem({ label: SH_STEPS[step].label, icon: SH_STEPS[step].icon, act: 'advanceShipment', data: { 'data-id': s.id, 'data-step': step }, sim: true })),
    s.wms ? menuItem({ label: 'Buka outbound request', icon: 'r:RiFileList3Line', nav: '#/warehouse/outbound-request/' + s.wms.outboundId }) : '',
  ].join('');
}

/* Panel detail — mengikuti ShipmentDetailPanel (drawer kanan) */
function drawerShipment(id) {
  const s = shipment(id);
  if (!s) return '';
  const c = client(s.clientId);
  const h = hub(s.hubId);
  const scanned = s.items.filter((i) => !['CREATED', 'CANCELLED'].includes(i.status)).length;
  const timelineRows = [...s.timeline].reverse().map((t) => ({ at: t.at, badge: t.title ? '' : shBadge(t.status), title: t.title, from: t.fromStatus ? SH_LABEL[t.fromStatus] : null, by: t.by, note: esc(t.note), icon: t.title ? 'r:RiBarcodeLine' : 'r:RiTimeLine' }));
  const g = s.wms ? gi(s.wms.giId) : null;
  const o = s.wms ? outbound(s.wms.outboundId) : null;
  const steps = nextShipmentSteps(s);
  const header = `<div class="flex items-center gap-2">${shBadge(s.status)}<span class="font-mono text-[11px] font-semibold tracking-wide text-text-sub-600">${esc(s.serviceType)}</span>${s.source === 'WMS' ? tag('dari WMS', 'accent', 'xs', 'r:RiLinksLine') : ''}</div>
    <p class="mt-2 font-mono text-[15px] font-bold tracking-tight text-text-strong-950">${esc(s.waybill)}</p>
    <p class="mt-0.5 font-mono text-[11px] text-text-sub-600">Booking ID · ${esc(s.bookingId)}</p>`;
  const body = `<div class="flex flex-col gap-6">
    ${s.wms ? `<div class="rounded-xl border border-stroke-soft-200 bg-bg-weak-50 p-3">
        <p class="label-eyebrow">Sumber · Warehouse</p>
        <div class="mt-2 grid grid-cols-3 gap-2 text-[12px]">
          <button type="button" data-nav="#/warehouse/outbound-request/${o.id}" class="text-left"><span class="block ${metaCls}">Outbound request</span><span class="${codeCls} text-accent">${esc(o.code)}</span></button>
          <button type="button" data-nav="#/warehouse/shipping/${g.id}" class="text-left"><span class="block ${metaCls}">Goods issue</span><span class="${codeCls} text-accent">${esc(g.code)}</span></button>
          <div><span class="block ${metaCls}">Surat jalan</span><span class="${codeCls}">${esc(s.wms.suratJalan)}</span></div>
        </div>
        <p class="mt-2 ${metaCls}">Dibuat lewat FulfillmentGateway (adapter). Modul Shipments tidak tahu WMS.${o.type === 'TRANSFER' ? ` Transfer → ${esc(hub(o.destHubId).name)}.` : ''}</p>
      </div>` : ''}
    <div><h3 class="text-[15px] font-bold tracking-tight">Details</h3><div class="mt-1">
      ${kv('Client', esc(c.name))}${kv('Service', esc(s.serviceType))}${kv('Items', String(s.items.length), `${scanned} / ${s.items.length} scanned`)}${kv('Total koli', String(sum(s.items.map((i) => i.koli))))}${kv('Total weight', `${fmtQty(Math.round(sum(s.items.map((i) => i.weight)) * 10) / 10)} kg`)}${kv('Hub', esc(h.name))}${kv('Upload shipment', s.uploadCode ? esc(s.uploadCode) : null)}${kv('Created', fmtDateTime(s.createdAt))}${kv('Dispatched', s.dispatchedAt ? fmtDateTime(s.dispatchedAt) : null)}${s.riderCode ? kv('Rider', esc(s.riderCode)) : ''}
    </div></div>
    <div><h3 class="text-[15px] font-bold tracking-tight">Parties</h3><div class="mt-3 grid grid-cols-2 gap-3">
      <div class="rounded-lg border border-stroke-soft-200 p-3"><p class="label-eyebrow">Sender</p><p class="mt-1 text-[13px] font-semibold">${esc(s.sender.name)}</p><p class="${metaCls}">${esc(s.sender.phone)}</p></div>
      <div class="rounded-lg border border-stroke-soft-200 p-3"><p class="label-eyebrow">Receiver</p><p class="mt-1 text-[13px] font-semibold">${esc(s.receiver.name)}</p><p class="${metaCls}">${esc(s.receiver.phone)}</p></div>
    </div></div>
    <div><h3 class="text-[15px] font-bold tracking-tight">Route</h3><div class="mt-3 flex flex-col gap-2">
      <div class="flex gap-3 rounded-lg border border-stroke-soft-200 p-3"><span class="mt-0.5 text-accent">${ic('r:RiMapPinLine', 'size-4')}</span><div><p class="label-eyebrow">Origin</p>${s.origin ? `<p class="mt-1 text-[13px] font-semibold">${esc(s.origin.name)}</p><p class="${metaCls}">${esc(s.origin.address)}</p>` : `<p class="mt-1 ${metaCls}">Diisi saat inbound scan di hub</p>`}</div></div>
      <div class="flex gap-3 rounded-lg border border-stroke-soft-200 p-3"><span class="mt-0.5 text-text-strong-950">${ic('r:RiMapPinLine', 'size-4')}</span><div><p class="label-eyebrow">Destination</p><p class="mt-1 text-[13px] font-semibold">${esc(s.receiver.name)}</p><p class="${metaCls}">${esc(s.destination.address)}</p></div></div>
    </div></div>
    <div><h3 class="text-[15px] font-bold tracking-tight">Timeline</h3><p class="${metaCls} mb-3">Newest first · status changes and driver milestones.</p>${timeline(timelineRows)}</div>
    <div><h3 class="text-[15px] font-bold tracking-tight">Items (${s.items.length})</h3><div class="mt-3 flex flex-col gap-2">${s.items.map((i) => `<div class="rounded-lg border border-stroke-soft-200 p-3"><div class="flex items-center justify-between gap-2"><span class="font-mono text-[12px] font-semibold">${esc(i.code)}</span>${itemBadge(i.status)}</div><p class="mt-1 font-mono text-[11px] text-text-sub-600">${esc(i.name)}${i.sku ? ' · ' + esc(i.sku) : ''}</p><p class="${metaCls}">Invoice ${esc(i.invoice)}</p><p class="mt-1 font-mono text-[11px] tabular-nums text-text-sub-600">Qty ${i.qty} · Koli ${i.koli} · ${fmtQty(i.weight)} kg</p></div>`).join('')}</div></div>
  </div>`;
  const footer = steps.length
    ? `<div class="flex flex-col gap-2"><p class="label-eyebrow">Simulasi flow logistic ${tag('presenter', 'gray')}</p><div class="flex flex-wrap gap-2">${steps.map((st) => btn({ label: SH_STEPS[st].label, icon: SH_STEPS[st].icon, size: 'sm', tone: st === 'FAIL' ? 'destructive' : 'primary', style: st === 'FAIL' ? 'stroke' : 'filled', act: 'advanceShipment', data: { 'data-id': s.id, 'data-step': st } })).join('')}</div><p class="${metaCls}">Di produksi langkah ini datang dari modul dispatch, rider app, dan delivery-service — bukan tombol.${s.wms ? ` Status ikut mengalir balik ke Shipping & Outbound request <span class="font-mono">${esc(o.code)}</span> (sekarang ${OR_LABEL[o.status]}).` : ''}</p></div>`
    : `<p class="${metaCls}">${s.status === 'CREATED' ? 'Menunggu inbound scan di hub (di luar mockup) — belum ada langkah simulasi.' : `Shipment sudah terminal (${SH_LABEL[s.status]}).${s.wms ? ` Outbound ${esc(o.code)}: ${OR_LABEL[o.status]}.` : ''}`}</p>`;
  return drawerShell({ header, body, footer });
}

/* Halaman lain di sidebar (di luar scope mockup) */
function pagePlaceholder(title) {
  return `<div class="space-y-5 p-6">${pageHeader({ title, desc: 'Halaman existing — tidak termasuk mockup ini.' })}${card(`<div class="flex flex-col items-center gap-3 py-16 text-center"><span class="inline-flex size-12 items-center justify-center rounded-full bg-bg-weak-50 text-icon-soft-400">${ic('r:RiInformationLine', 'size-5')}</span><p class="text-base font-medium tracking-tight">Di luar scope mockup</p><p class="max-w-md text-sm text-text-sub-600">Fokus mockup: menu <span class="font-semibold text-text-strong-950">Warehouse</span> (mirip WMS eFishery) dan sinkronisasinya ke <span class="font-semibold text-text-strong-950">Shipments</span>.</p>${btn({ label: 'Ke Outbound request', icon: 'r:RiArrowRightLine', nav: '#/warehouse/outbound-request' })}</div>`)}</div>`;
}
function notFoundPage(what, back) {
  return `<div class="space-y-5 p-6">${detailHeader({ backLabel: what, backHref: back, title: 'Tidak ditemukan' })}<p class="${metaCls}">Data mungkin sudah di-reset.</p></div>`;
}
