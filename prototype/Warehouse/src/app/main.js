// ── App shell: router, sidebar bertingkat, overlay (modal/drawer/menu), toast, event delegation ──
const view = { tab: {}, search: {}, sel: {}, draft: {}, modal: null, pendingModal: null, menu: null, collapsed: false, navOpen: {}, selScope: null };
let route = { path: '', parts: [], query: {} };
let lastPath = null;
// Animasi masuk hanya saat overlay baru muncul — re-render (ketik, progress upload) tidak memicu kedip.
const ANIM = { modal: true, drawer: true, guide: true };
const lastKeys = { modal: '', drawer: '', guide: '' };

const NAV = [
  { label: 'Analytics', items: [{ id: 'docking-dashboard', title: 'Docking Dashboard', icon: 'l:layout-dashboard' }] },
  { label: 'Hub ops', items: [
    { id: 'shipments', title: 'Shipments', icon: 'l:boxes', href: '#/shipments' },
    { id: 'ujp', title: 'UJP', icon: 'l:wallet' }, { id: 'packages', title: 'Packages', icon: 'l:package' }, { id: 'inbound', title: 'Inbound', icon: 'l:inbox' },
    { id: 'dispatches', title: 'Dispatches', icon: 'l:send' }, { id: 'dispatch-schedules', title: 'Jadwal Dispatch', icon: 'l:alarm-clock' },
    { id: 'delivery', title: 'Delivery', icon: 'l:truck' }, { id: 'cod-orders', title: 'COD Reconciliation', icon: 'l:hand-coins' }, { id: 'invoices', title: 'Invoices', icon: 'l:receipt-text' },
  ] },
  { label: 'Warehouse ops', items: [
    { id: 'warehouse', title: 'Warehouse', icon: 'l:warehouse', children: [
      { id: 'wh-dash', title: 'Dashboard', icon: 'l:gauge', children: [{ id: 'stock', title: 'Stock', icon: 'l:layers', href: '#/warehouse/stock' }] },
      { id: 'wh-wm', title: 'Warehouse management', icon: 'l:layout-grid', children: [
        { id: 'storage', title: 'Storage', icon: 'l:grid-3x3', href: '#/warehouse/storage' },
        { id: 'sku', title: 'SKU', icon: 'l:barcode', href: '#/warehouse/sku' },
      ] },
      { id: 'wh-ob', title: 'Outbound management', icon: 'l:arrow-up-from-line', children: [
        { id: 'outbound-request', title: 'Outbound request', icon: 'l:clipboard-list', href: '#/warehouse/outbound-request', count: () => db.outbounds.filter(inHub).filter((o) => o.status === 'OPEN').length },
        { id: 'wh-gi', title: 'Goods issue', icon: 'l:package-minus', children: [
          { id: 'picking', title: 'Picking', icon: 'l:shopping-basket', href: '#/warehouse/picking', count: () => db.gis.filter(inHub).filter((g) => PICKING_STATUSES.includes(g.status)).length },
          { id: 'shipping', title: 'Shipping', icon: 'l:forklift', href: '#/warehouse/shipping', count: () => db.gis.filter(inHub).filter((g) => g.status === 'READY_TO_PICKUP').length },
        ] },
      ] },
      { id: 'wh-sm', title: 'Supply management', icon: 'l:factory', children: [
        { id: 'purchase-order', title: 'Purchase order', icon: 'l:shopping-cart', href: '#/warehouse/purchase-order', count: () => db.pos.filter(inHub).filter((x) => x.status === 'DRAFT').length },
        { id: 'vendor', title: 'Vendor', icon: 'l:store', href: '#/warehouse/vendor' },
      ] },
      { id: 'wh-ib', title: 'Inbound management', icon: 'l:arrow-down-to-line', children: [
        { id: 'inbound-request', title: 'Inbound request', icon: 'l:package-plus', href: '#/warehouse/inbound-request', count: () => db.pos.filter(inHub).filter((x) => x.status === 'CONFIRMED' && x.grStatus !== 'FINISHED').length },
        { id: 'goods-receipt', title: 'Goods receipt', icon: 'l:package-check', href: '#/warehouse/goods-receipt' },
      ] },
    ] },
  ] },
  { label: 'Scheduled Instant', items: [{ id: 'scheduled-instant', title: 'Schedule', icon: 'l:calendar-clock' }] },
  { label: 'Master', items: [
    { id: 'providers', title: 'Clients', icon: 'l:users' }, { id: 'hubs', title: 'Hubs', icon: 'l:building-2' }, { id: 'zones', title: 'Zones', icon: 'l:shapes' },
    { id: 'workflows', title: 'Workflows', icon: 'l:list-checks' }, { id: 'addresses', title: 'Addresses', icon: 'l:map-pin' }, { id: 'route-planner', title: 'Route Planner', icon: 'l:route' }, { id: 'export-templates', title: 'Export Templates', icon: 'l:file-output' },
  ] },
];
const SIDEBAR_ITEM = 'relative flex h-9 w-full items-center gap-3 px-5 text-sm font-medium tracking-tight text-text-sub-600 transition-colors hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--theme-accent-base) data-[active=true]:font-semibold data-[active=true]:text-text-strong-950 [&_svg]:size-[17px] [&_svg]:shrink-0 [&_svg]:text-current before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-[3px] data-[active=true]:before:bg-(--theme-accent-base)';
const INDENT = ['', 'pl-[49px]', 'pl-[61px]', 'pl-[73px]'];
const NESTED = 'h-8 gap-2 pr-3 text-[13px] [&_svg]:size-[15px]';
const hrefPath = (href) => href.replace(/^#/, '').split('?')[0];
const isActiveHref = (href) => { const p = hrefPath(href); return route.path === p || route.path.startsWith(p + '/'); };
const containsActive = (node) => (node.href ? isActiveHref(node.href) : (node.children || []).some(containsActive));
// Semua grup terbuka kecuali root yang tidak berisi route aktif; navigasi membuka cabang aktif (openActiveBranch).
const isOpen = (node, depth) => (view.navOpen[node.id] != null ? view.navOpen[node.id] : depth > 0 || containsActive(node) || node.id === 'warehouse');
function findNav(id) {
  const walk = (items, depth) => { for (const i of items) { if (i.id === id) return [i, depth]; if (i.children) { const f = walk(i.children, depth + 1); if (f) return f; } } return null; };
  return walk(NAV.flatMap((g) => g.items), 0);
}
function openActiveBranch() {
  const walk = (items) => items.forEach((i) => { if (i.children && containsActive(i)) { view.navOpen[i.id] = true; walk(i.children); } });
  walk(NAV.flatMap((g) => g.items));
}

function navNode(node, depth) {
  const indent = cx(INDENT[Math.min(depth, 3)], depth ? NESTED : '');
  if (node.children) {
    const open = isOpen(node, depth);
    const childActive = containsActive(node);
    return `<button type="button" data-act="navToggle" data-key="${node.id}" aria-expanded="${open}" title="${esc(node.title)}" data-active="${view.collapsed && childActive}" class="${cx(SIDEBAR_ITEM, indent, childActive ? 'text-text-strong-950' : '', view.collapsed ? 'justify-center px-0' : '')}">${ic(node.icon)}${view.collapsed ? '' : `<span class="flex-1 truncate text-left">${esc(node.title)}</span><span class="text-icon-soft-400 transition-transform ${open ? 'rotate-0' : '-rotate-90'}">${ic('l:chevron-down', '!size-3.5')}</span>`}</button>${open && !view.collapsed ? node.children.map((c) => navNode(c, depth + 1)).join('') : ''}`;
  }
  const active = node.href ? isActiveHref(node.href) : route.path === '/x/' + node.id;
  const n = node.count ? node.count() : 0;
  return `<a href="${node.href || '#/x/' + node.id}" data-active="${active}" title="${esc(node.title)}" ${active ? 'aria-current="page"' : ''} class="${cx(SIDEBAR_ITEM, indent, view.collapsed ? 'justify-center px-0' : '')}">${ic(node.icon)}${view.collapsed ? '' : `<span class="flex-1 truncate">${esc(node.title)}</span>${n ? `<span data-badge="${node.id}" class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${active ? 'bg-bg-strong-950 text-text-white-0' : 'bg-bg-weak-50 text-text-sub-600'}">${n}</span>` : ''}`}</a>`;
}
function renderSidebar() {
  return `<aside data-state="${view.collapsed ? 'collapsed' : 'expanded'}" class="h-full shrink-0 border-stroke-soft-200 bg-bg-white-0 transition-[width] duration-200 flex flex-col border-r ${view.collapsed ? 'w-16' : ''}" style="${view.collapsed ? '' : 'width:15rem'}">
    <div class="flex h-16 items-center gap-2.5 border-b border-stroke-soft-200 px-5 ${view.collapsed ? 'h-auto flex-col gap-2 px-0 py-3' : ''}">
      ${dashMark(20)}
      ${view.collapsed ? '' : `<div class="overflow-hidden"><p class="whitespace-nowrap text-[17px] font-extrabold tracking-tight text-text-strong-950 leading-none">Dash Electric</p><p class="mt-1 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.3em] text-text-sub-600 leading-none">Mithril</p></div>`}
      <button type="button" data-act="sidebarToggle" title="${view.collapsed ? 'Expand' : 'Collapse'} sidebar" aria-label="${view.collapsed ? 'Expand' : 'Collapse'} sidebar" class="inline-flex size-8 items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 ${view.collapsed ? '' : 'ml-auto'}">${ic('l:panel-left-close', 'size-[18px]')}</button>
    </div>
    <nav class="flex-1 overflow-y-auto divide-y divide-stroke-soft-200" id="sidebar-body">${NAV.map((g) => `<div class="flex flex-col gap-0.5 py-3">${view.collapsed ? '' : `<div class="px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-text-sub-600">${esc(g.label)}</div>`}${g.items.map((i) => navNode(i, 0)).join('')}</div>`).join('')}</nav>
    <div class="flex items-center gap-2 border-t border-stroke-soft-200 ${view.collapsed ? 'h-auto flex-col px-0 py-3' : 'h-auto px-3 py-3'}">
      <div class="${view.collapsed ? 'flex flex-col items-center gap-2' : 'flex w-full items-center gap-3 px-2 py-1.5 rounded-lg'}">
        <div class="relative shrink-0"><span class="flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-static-white">OD</span><span class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-(--state-success-base) border-2 border-bg-white-0" aria-hidden="true"></span></div>
        ${view.collapsed ? '' : `<div class="flex-1 min-w-0"><p class="text-[13px] font-semibold tracking-tight text-text-strong-950 truncate leading-tight">Ops Demo</p><p class="text-[11px] text-text-sub-600 truncate leading-tight">${esc(db.ui.actor)}</p></div>`}
      </div>
    </div>
  </aside>`;
}
function renderTopbar() {
  return `<header class="bg-bg-white-0 border-b border-stroke-soft-200 px-6 py-3"><div class="flex items-center justify-between gap-3">
    <span class="label-eyebrow tabular"><span class="text-accent font-bold mr-3">·</span>Dash · Logistic</span>
    <div class="flex items-center gap-2">${tag('Mockup · data simulasi', 'gray', 'sm', 'r:RiSparklingLine')}${btn({ label: db.ui.guideOpen ? 'Sembunyikan demo' : 'Demo script', icon: 'r:RiPresentationLine', size: 'xs', tone: 'neutral', style: 'ghost', act: 'guideToggle' })}${btn({ label: 'Reset demo data', icon: 'r:RiRestartLine', size: 'xs', tone: 'neutral', style: 'ghost', act: 'resetDemoAsk' })}</div>
  </div></header>`;
}

/* ── overlays ── */
const ICON_TONE = { primary: 'bg-(--theme-accent-alpha-10) text-accent', success: 'bg-(--state-success-lighter) text-(--state-success-dark)', warning: 'bg-(--state-warning-lighter) text-(--state-warning-dark)', danger: 'bg-(--state-error-lighter) text-(--state-error-dark)', info: 'bg-(--state-information-lighter) text-(--state-information-dark)', neutral: 'bg-bg-weak-50 text-text-sub-600' };
function formModal(o) {
  return `<div class="fixed inset-0 z-50 bg-[#171717]/45 backdrop-blur-sm" data-overlay="modal"></div>
  <div role="dialog" aria-modal="true" aria-label="${esc(o.title)}" class="${cx('fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-large', ANIM.modal ? 'mk-anim-in' : '', o.width || 'max-w-lg')}">
    <div class="flex items-start gap-3 border-b border-stroke-soft-200 px-5 py-4">
      <span class="${cx('inline-flex size-10 shrink-0 items-center justify-center rounded-full', ICON_TONE[o.iconTone || 'primary'])}">${ic(o.icon || 'r:RiInformationLine', 'size-5')}</span>
      <div class="min-w-0 flex-1"><h2 class="text-base font-medium tracking-tight text-text-strong-950">${esc(o.title)}</h2>${o.desc ? `<p class="mt-0.5 text-sm text-text-sub-600">${esc(o.desc)}</p>` : ''}</div>
      ${o.headerExtra ? `<div class="shrink-0 self-center">${o.headerExtra}</div>` : ''}
      <button type="button" data-act="closeModal" aria-label="Close" class="shrink-0 self-start inline-flex size-7 items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950">${ic('r:RiCloseLine', 'size-4')}</button>
    </div>
    <div class="flex-1 overflow-y-auto px-5 py-4" id="modal-body">${o.body}</div>
    ${o.footer ? `<div class="flex items-center justify-end gap-2 border-t border-stroke-soft-200 bg-bg-weak-50 px-5 py-4">${o.footer}</div>` : ''}
  </div>`;
}
function drawerShell(o) {
  return `<div class="fixed inset-0 z-50 bg-[#171717]/45 backdrop-blur-sm" data-overlay="drawer"></div>
  <div role="dialog" aria-modal="true" class="fixed inset-y-0 right-0 z-50 flex h-full w-[480px] max-w-[100vw] flex-col border-l border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-large ${ANIM.drawer ? 'mk-slide-in' : ''}">
    <div class="relative border-b border-stroke-soft-200 px-5 py-4 pr-12">${o.header}<button type="button" data-act="closeDrawer" aria-label="Close" class="absolute top-3 right-3 size-7 inline-flex items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950">${ic('r:RiCloseLine', 'size-4')}</button></div>
    <div class="flex-1 overflow-y-auto px-5 py-5" id="drawer-body">${o.body}</div>
    <div class="border-t border-stroke-soft-200 bg-bg-weak-50 px-5 py-4">${o.footer || ''}</div>
  </div>`;
}
function modalConfirm(m) {
  return formModal({ icon: m.icon || 'r:RiErrorWarningLine', iconTone: m.tone || 'danger', title: m.title, desc: m.desc, body: `<p class="text-sm text-text-sub-600">${m.body}</p>`, footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: m.confirmLabel, icon: m.confirmIcon, tone: m.danger ? 'destructive' : 'primary', act: m.act, data: { 'data-id': m.id } })}` });
}
function renderModal() {
  const m = view.modal;
  if (!m) return '';
  if (m.type === 'api') return modalApiOrder();
  if (m.type === 'cancel') return outbound(m.id) ? modalCancel(m.id) : '';
  if (m.type === 'shortfall') return outbound(m.id) ? modalShortfall(outbound(m.id), m.rows) : '';
  if (m.type === 'createPo') return modalCreatePo();
  if (m.type === 'cancelPo') return po(m.id) ? modalCancelPo(m.id) : '';
  if (m.type === 'createStorage') return modalCreateStorage();
  if (m.type === 'createOutbound') return modalCreateOutbound();
  if (m.type === 'print') return modalPrint(m);
  if (m.type === 'uploadCsv') return modalUploadCsv();
  if (m.type === 'vendorForm') return modalVendorForm(m);
  if (m.type === 'skuForm') return modalSkuForm();
  if (m.type === 'confirm') return modalConfirm(m);
  return '';
}
function renderMenu() {
  const m = view.menu;
  if (!m) return '';
  const [kind, id] = m.key.split(':');
  const ent = { or: outbound, pk: gi, sp: gi, po, ir: po, sh: shipment, ven: vendor }[kind];
  const rec = ent ? ent(id) : null;
  if (!rec) return '';
  const items = kind === 'or' ? menuOutbound(rec) : kind === 'pk' ? menuPicking(rec) : kind === 'sp' ? menuShipping(rec) : kind === 'po' ? menuPo(rec) : kind === 'ir' ? menuIr(rec) : kind === 'sh' ? menuShipment(rec) : kind === 'ven' ? menuVendor(rec) : '';
  const w = 240;
  const left = Math.max(8, Math.min(m.x - w, window.innerWidth - w - 8));
  const estH = 46 + (items.match(/<button/g) || []).length * 34;
  const top = m.y + estH > window.innerHeight - 8 ? Math.max(8, m.top - estH - 6) : m.y + 6;
  return `<div class="fixed inset-0 z-[55]" data-overlay="menu"></div><div role="menu" class="fixed ${MENU_SURFACE}" style="top:${top}px;left:${left}px;width:${w}px">${items}</div>`;
}
function toast(title, tone, desc) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const t = ALERT_ICON[tone] ? tone : 'success';
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'pointer-events-none flex items-start gap-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 shadow-custom-shadows-large mk-anim-in';
  el.innerHTML = `<span class="mt-0.5 ${ALERT_ICON[t][1]}">${ic(ALERT_ICON[t][0], 'size-4')}</span><div class="min-w-0 flex-1"><p class="text-sm font-medium tracking-tight text-text-strong-950">${esc(title)}</p>${desc ? `<p class="mt-0.5 text-[12px] leading-relaxed text-text-sub-600">${desc}</p>` : ''}</div>`;
  host.appendChild(el);
  while (host.children.length > 3) host.removeChild(host.firstChild);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, t === 'error' ? 6500 : 4500);
}

/* ── router + render ── */
const HOME = '#/warehouse/stock';
function parseRoute() {
  const raw = (location.hash || '').replace(/^#/, '') || HOME.slice(1);
  const [path, qs] = raw.split('?');
  const query = {};
  (qs || '').split('&').filter(Boolean).forEach((kvp) => { const [k, v] = kvp.split('='); try { query[decodeURIComponent(k)] = decodeURIComponent(v || ''); } catch (e) { /* query rusak */ } });
  route = { path, parts: path.split('/').filter(Boolean), query };
}
function renderPage() {
  const [a, b, c] = route.parts;
  if (a === 'shipments') return pageShipments();
  if (a === 'x') { const item = NAV.flatMap((g) => g.items).find((i) => i.id === b); return pagePlaceholder(item ? item.title : 'Halaman'); }
  if (a !== 'warehouse') return pageStock();
  switch (b) {
    case 'stock': return pageStock();
    case 'storage': return pageStorage();
    case 'sku': return pageSku();
    case 'vendor': return pageVendor();
    case 'outbound-request': return c ? pageOutboundDetail(c) : pageOutboundList();
    case 'picking': return c ? pagePickingDetail(c) : pagePickingList();
    case 'shipping': return c ? pageShippingDetail(c) : pageShippingList();
    case 'purchase-order': return c ? pagePoDetail(c) : pagePoList();
    case 'inbound-request': return c ? pageInboundDetail(c) : pageInboundList();
    case 'goods-receipt': return c === 'new' ? pageGrNew() : c ? pageGrDetail(c) : pageGrList();
    default: return pageStock();
  }
}
const SCROLLERS = ['main', 'modal-body', 'drawer-body', 'sidebar-body', 'guide-body'];
const safe = (fn, label) => {
  try { return fn(); } catch (e) {
    try { console.warn('[mockup] render gagal:', label, e); } catch (x) { /* noop */ }
    return `<div class="p-6">${alertBox('error', 'Bagian ini gagal dirender', `${esc(e && e.message)} — klik Reset demo data bila berulang.`)}</div>`;
  }
};
function render() {
  const app = document.getElementById('app');
  const ae = document.activeElement;
  const fk = ae && ae.getAttribute ? ae.getAttribute('data-fk') : null;
  let caret = null;
  try { caret = ae && typeof ae.selectionStart === 'number' ? ae.selectionStart : null; } catch (e) { caret = null; }
  const scroll = {};
  SCROLLERS.forEach((id) => { const el = document.getElementById(id); if (el) scroll[id] = el.scrollTop; });
  const samePage = lastPath === route.path + '?' + (route.query.po || '');
  lastPath = route.path + '?' + (route.query.po || '');
  const keys = { modal: view.modal ? `${view.modal.type}:${view.modal.id || ''}:${view.modal.kind || ''}` : '', drawer: route.parts[0] === 'shipments' ? route.query.detail || '' : '', guide: db.ui.guideOpen ? 'open' : 'closed' };
  Object.keys(keys).forEach((k) => { ANIM[k] = keys[k] !== lastKeys[k]; lastKeys[k] = keys[k]; });
  const drawer = keys.drawer ? safe(() => drawerShipment(route.query.detail), 'drawer') : '';
  app.innerHTML = `<div class="flex h-screen w-full bg-bg-weak-50 overflow-hidden">${safe(renderSidebar, 'sidebar')}<div class="flex h-full min-w-0 flex-1 flex-col overflow-hidden">${renderTopbar()}<main class="flex-1 overflow-auto ${db.ui.guideOpen ? (db.ui.guideFull ? 'pb-[62vh]' : 'pb-[300px]') : 'pb-24'}" id="main">${safe(renderPage, 'page')}</main></div></div>${drawer}${safe(renderModal, 'modal')}${safe(renderMenu, 'menu')}${safe(renderGuide, 'guide')}`;
  SCROLLERS.forEach((id) => { const el = document.getElementById(id); if (el && scroll[id] != null && (samePage || id !== 'main')) el.scrollTop = scroll[id]; });
  if (!samePage) { const act = app.querySelector('#sidebar-body a[data-active="true"]'); if (act) act.scrollIntoView({ block: 'nearest' }); }
  if (fk) {
    const el = app.querySelector(`[data-fk="${CSS.escape(fk)}"]`);
    if (el) { el.focus(); if (caret != null) { try { el.setSelectionRange(caret, caret); } catch (e) { /* number/date input */ } } }
  }
}
const commit = (fn) => { try { const r = fn(); save(); render(); return r; } catch (e) { if (e instanceof AppError) { save(); render(); } throw e; } };
const go = (href) => { view.menu = null; view.modal = null; if (location.hash === href) render(); else location.hash = href; };
/** Pindah halaman lalu buka modal (modal tidak tertutup oleh hashchange). */
const goModal = (href, modal) => { view.menu = null; if (location.hash === href) { view.modal = modal; render(); } else { view.pendingModal = modal; location.hash = href; } };
const scrollTopOf = (id) => { const b = document.getElementById(id); if (b) b.scrollTop = 0; };
const minStep = (errs) => Math.min(...errs.map((e) => e.step || 1));

/* ── model binding ── */
function setModel(path, value) {
  const [root, ...rest] = path.split('.');
  const target = root === 'ui' ? db.ui : root === 'search' ? view.search : root === 'draft' ? view.draft : null;
  if (!target) return;
  let obj = target;
  rest.slice(0, -1).forEach((k) => { if (obj[k] == null) obj[k] = /^\d+$/.test(k) ? [] : {}; obj = obj[k]; });
  obj[rest[rest.length - 1]] = value;
}
let debounceT = null;
document.addEventListener('input', (ev) => {
  const el = ev.target.closest && ev.target.closest('[data-model]');
  if (!el || el.tagName === 'SELECT') return;
  const model = el.getAttribute('data-model');
  if (model.startsWith('pick.')) return;
  setModel(model, el.value);
  if (el.getAttribute('data-rerender') === 'debounce') { clearTimeout(debounceT); debounceT = setTimeout(render, 220); }
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest && ev.target.closest('[data-model]');
  if (!el) return;
  const model = el.getAttribute('data-model');
  if (model.startsWith('pick.')) {
    const g = gi(route.parts[2]);
    if (!g) return;
    try { commit(() => setPicked(g.id, model.slice(5), el.value)); } catch (e) { if (!(e instanceof AppError)) throw e; toast(e.message, 'error'); }
    return;
  }
  setModel(model, el.value);
  const after = el.getAttribute('data-act-change');
  if (model === 'ui.hubId') { view.sel = {}; save(); render(); return; }
  if (after && ACTIONS[after]) runAction(after, el, ev);
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    if (view.menu) view.menu = null;
    else if (view.modal) view.modal = null;
    else if (route.query.detail) { go('#/shipments'); return; }
    else return;
    render();
  }
});
function runAction(act, el, ev) {
  try { ACTIONS[act](el, ev); } catch (e) {
    if (e instanceof AppError) { toast(e.message, 'error'); render(); return; }
    try { console.warn('[mockup] aksi gagal:', act, e); } catch (x) { /* noop */ }
    toast('Aksi gagal', 'error', esc(e && e.message));
  }
}
document.addEventListener('click', (ev) => {
  const overlay = ev.target.closest('[data-overlay]');
  if (overlay) {
    const kind = overlay.getAttribute('data-overlay');
    if (kind === 'menu') view.menu = null;
    else if (kind === 'modal') view.modal = null;
    else if (kind === 'drawer') { go('#/shipments'); return; }
    render();
    return;
  }
  const el = ev.target.closest('[data-act],[data-nav],[data-menu]');
  if (!el) return;
  if (el.tagName === 'TR' && ev.target.closest('[data-stop]')) return;
  if (el.hasAttribute('disabled')) return;
  if (el.hasAttribute('data-menu')) {
    const r = el.getBoundingClientRect();
    view.menu = { key: el.getAttribute('data-menu'), x: r.right, y: r.bottom, top: r.top };
    render();
    return;
  }
  const act = el.getAttribute('data-act');
  if (act && ACTIONS[act]) { if (el.type !== 'checkbox') ev.preventDefault(); view.menu = null; runAction(act, el, ev); return; }
  const nav = el.getAttribute('data-nav');
  if (nav) { ev.preventDefault(); go(nav); }
});
/* file: CSV (outbound) & PDF (surat jalan GR) — input file + drag & drop ke dropzone */
function readCsvFile(f) {
  if (!f) return;
  if (!/\.csv$/i.test(f.name)) { toast('File harus .csv', 'error'); return; }
  const r = new FileReader();
  r.onload = () => { Object.assign(view.draft, { csvText: String(r.result || ''), csvFileName: f.name, csvSize: f.size, csvStage: 'pick', csvPreview: null }); render(); };
  r.readAsText(f);
}
document.addEventListener('change', (ev) => {
  const el = ev.target.closest && ev.target.closest('input[type=file][data-file]');
  if (!el || !el.files || !el.files[0]) return;
  if (el.getAttribute('data-file') === 'pdf') startPdfUpload(el.files[0]);
  else readCsvFile(el.files[0]);
});
document.addEventListener('dragover', (ev) => { if (ev.target.closest && ev.target.closest('[data-dropzone]')) ev.preventDefault(); });
document.addEventListener('drop', (ev) => {
  const z = ev.target.closest && ev.target.closest('[data-dropzone]');
  if (!z) return;
  ev.preventDefault();
  const f = ev.dataTransfer && ev.dataTransfer.files[0];
  if (z.getAttribute('data-dropzone') === 'pdf') startPdfUpload(f); else readCsvFile(f);
});
window.addEventListener('hashchange', () => { parseRoute(); openActiveBranch(); view.menu = null; view.modal = view.pendingModal || null; view.pendingModal = null; render(); });

/* ── actions ── */
const idOf = (el) => el.getAttribute('data-id');
const keyOf = (el) => el.getAttribute('data-key');
const guard = (fn) => { try { return fn(); } catch (e) { if (e instanceof AppError) { toast(e.message, 'error'); return null; } throw e; } };
const dropDraft = (prefix) => Object.keys(view.draft).filter((k) => k.startsWith(prefix)).forEach((k) => delete view.draft[k]);
const demo = () => db.ui.demo;
const ACTIONS = {
  noop: () => {},
  rerender: () => render(),
  refresh: () => { render(); toast('Data dimuat ulang', 'information'); },
  outOfScope: () => toast('Di luar scope mockup', 'information', 'Fitur Shipments existing tidak diubah oleh mockup ini.'),
  resetDemoAsk: () => { view.modal = { type: 'confirm', icon: 'r:RiRestartLine', tone: 'warning', title: 'Reset demo data?', desc: 'Kembali ke data awal demo', body: 'Semua perubahan di browser ini (vendor, PO, order, goods receipt, shipment, progres demo script) dihapus dan diganti data seed awal. Tidak bisa di-undo.', confirmLabel: 'Reset demo data', confirmIcon: 'r:RiRestartLine', danger: true, act: 'resetDemoConfirm' }; render(); },
  resetDemoConfirm: () => {
    seedAll();
    PDF_BLOBS.clear();
    Object.assign(view, { tab: {}, search: {}, sel: {}, draft: {}, modal: null, pendingModal: null, menu: null, navOpen: {} });
    toast('Demo di-reset ke data awal', 'information', 'Mulai dari Act 1 di panel Demo script.');
    go(HOME);
  },
  sidebarToggle: () => { view.collapsed = !view.collapsed; render(); },
  navToggle: (el) => {
    const k = keyOf(el);
    const found = findNav(k);
    if (view.collapsed) { view.collapsed = false; view.navOpen[k] = true; render(); return; }
    view.navOpen[k] = !(found && isOpen(found[0], found[1]));
    render();
  },
  guideToggle: () => { db.ui.guideOpen = !db.ui.guideOpen; save(); render(); },
  guideSize: () => { db.ui.guideFull = !db.ui.guideFull; save(); render(); },
  guideAct: (el) => { db.ui.guideAct = Number(keyOf(el)) || 1; save(); render(); scrollTopOf('guide-body'); },
  demoGo: (el) => {
    const k = keyOf(el);
    if (k === 'vendor') { view.draft.ven = vendorDraftOf(null); view.draft.venErrors = null; goModal('#/warehouse/vendor', { type: 'vendorForm', id: null }); }
    else if (k === 'po' || k === 'ret') { dropDraft('po'); poDefaults(); if (k === 'ret') view.draft.poType = 'RETURN'; goModal('#/warehouse/purchase-order', { type: 'createPo' }); }
    else if (k === 'oo' || k === 'tr') { dropDraft('mf'); mfDefaults(); if (k === 'tr') { view.draft.mfType = 'TRANSFER'; view.draft.mfHub = 3; } goModal('#/warehouse/outbound-request', { type: 'createOutbound' }); }
    else if (k === 'csv') { dropDraft('csv'); goModal('#/warehouse/outbound-request', { type: 'uploadCsv' }); }
  },
  closeModal: () => { view.modal = null; render(); },
  closeDrawer: () => go('#/shipments'),
  openPrint: (el) => { view.modal = { type: 'print', kind: el.getAttribute('data-kind'), id: idOf(el) }; render(); },
  printNow: () => {
    const area = document.getElementById('print-area');
    const root = document.getElementById('print-root');
    if (!area || !root) return;
    root.innerHTML = area.innerHTML;
    try { window.print(); } catch (e) { toast('Browser tidak mengizinkan dialog print di pratinjau ini', 'warning'); }
  },
  printDownload: () => { ACTIONS.printNow(); toast('Pilih "Save as PDF" di dialog print', 'information', 'Di aplikasi: file PDF A4 di-generate langsung (@react-pdf/renderer).'); },
  openRef: (el) => {
    const c = el.getAttribute('data-code');
    const g = db.gis.find((x) => x.code === c);
    const r = db.grs.find((x) => x.code === c);
    if (g) go((PICKING_STATUSES.includes(g.status) ? '#/warehouse/picking/' : '#/warehouse/shipping/') + g.id);
    else if (r) go('#/warehouse/goods-receipt/' + r.id);
    else toast('Dokumen tidak ditemukan', 'warning');
  },
  openPdf: (el) => openPdf(el.getAttribute('data-url'), el.getAttribute('data-name')),
  // tabs & selection
  tabOr: (el) => { view.tab.or = keyOf(el); view.sel.or = []; render(); },
  tabPk: (el) => { view.tab.pk = keyOf(el); render(); },
  tabSp: (el) => { view.tab.sp = keyOf(el); view.sel.sp = []; render(); },
  tabPo: (el) => { view.tab.po = keyOf(el); render(); },
  tabIr: (el) => { view.tab.ir = keyOf(el); render(); },
  tabSh: (el) => { view.tab.sh = keyOf(el); render(); },
  tabVen: (el) => { view.tab.ven = keyOf(el); render(); },
  selAll: (el) => { const s = view.selScope; if (!s) return; view.sel[s.name] = el.checked ? [...s.ids] : []; render(); },
  selRow: (el) => { const s = view.selScope; if (!s) return; const cur = new Set(view.sel[s.name] || []); if (el.checked) cur.add(idOf(el)); else cur.delete(idOf(el)); view.sel[s.name] = [...cur]; render(); },
  clearSelOr: () => { view.sel.or = []; render(); },

  // ── outbound request: wizard manual ──
  openCreateOutbound: () => { dropDraft('mf'); view.modal = { type: 'createOutbound' }; render(); },
  mfType: (el) => { const d = view.draft; d.mfType = keyOf(el); if (d.mfType !== 'TRANSFER') d.mfDestHub = ''; d.mfErrors = (d.mfErrors || []).filter((e) => e.field !== 'dest_hub'); render(); },
  mfHubChange: () => { const d = view.draft; if (Number(d.mfDestHub) === Number(d.mfHub)) d.mfDestHub = ''; render(); },
  mfClientChange: () => { Object.assign(view.draft, { mfLines: [{ sku: '', qty: '' }] }); view.draft.mfErrors = (view.draft.mfErrors || []).filter((e) => e.field !== 'client'); render(); },
  mfRerenderClear: () => { view.draft.mfErrors = (view.draft.mfErrors || []).filter((e) => e.field !== 'dest_hub'); render(); },
  mfAddLine: () => { view.draft.mfLines.push({ sku: '', qty: '' }); render(); },
  mfDelLine: (el) => { view.draft.mfLines.splice(Number(el.getAttribute('data-i')), 1); view.draft.mfErrors = null; render(); },
  mfNext: () => {
    const d = view.draft;
    const errs = mfLocalCheck(d.mfStep);
    d.mfErrors = errs.length ? errs : null;
    if (!errs.length) d.mfStep = Math.min(OO_STEPS.length, d.mfStep + 1);
    render();
    scrollTopOf('modal-body');
  },
  mfBack: () => { const d = view.draft; d.mfErrors = null; d.mfStep = Math.max(1, d.mfStep - 1); render(); scrollTopOf('modal-body'); },
  mfGoto: (el) => { const d = view.draft; const n = Number(keyOf(el)); if (n < d.mfStep) { d.mfStep = n; render(); scrollTopOf('modal-body'); } },
  submitCreateOutbound: () => {
    const d = view.draft;
    const pre = [...mfLocalCheck(1), ...mfLocalCheck(2), ...mfLocalCheck(3)];
    if (pre.length) { d.mfErrors = pre; d.mfStep = minStep(pre); render(); scrollTopOf('modal-body'); return; }
    let res;
    try {
      res = commit(() => createOutbound(mfPayload(), 'MANUAL'));
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      // Respons 422 bergaya server: kembali ke langkah paling awal yang punya error.
      d.mfErrors = (e.details && e.details.length ? e.details : [{ field: '', message: e.message, step: 4 }]).map((x) => ({ ...x, step: x.step || 1 }));
      d.mfStep = minStep(d.mfErrors);
      demo().bounced = true;
      save();
      render();
      scrollTopOf('modal-body');
      toast('Server menolak — 422 VALIDATION', 'error', `${d.mfErrors.length} isian perlu diperbaiki · kembali ke langkah ${OO_STEPS[d.mfStep - 1]}`);
      return;
    }
    view.modal = null;
    if (res.status === 'EXISTS') toast('Ref client sudah ada', 'information', `${res.order.code} · tidak dibuat dua kali (EXISTS)`);
    else {
      if (res.order.type === 'TRANSFER') demo().transferId = res.order.id; else demo().outboundId = res.order.id;
      save();
      toast('Outbound request dibuat', 'success', `${res.order.code} · status Open${res.order.type === 'TRANSFER' ? ` · transfer → ${esc(hub(res.order.destHubId).name)}` : ''}`);
    }
    dropDraft('mf');
    go('#/warehouse/outbound-request/' + res.order.id);
  },
  // ── outbound request: upload CSV ──
  openUploadCsv: () => { dropDraft('csv'); view.modal = { type: 'uploadCsv' }; render(); },
  csvReset: () => { Object.assign(view.draft, { csvStage: 'pick', csvPreview: null }); render(); },
  csvClear: () => { Object.assign(view.draft, { csvText: '', csvFileName: '', csvSize: 0, csvStage: 'pick', csvPreview: null }); render(); },
  csvSample: (el) => {
    const d = view.draft;
    const kind = keyOf(el);
    const text = csvSample(Number(d.csvClient), kind);
    Object.assign(d, { csvText: text, csvFileName: `contoh-${kind}-${client(Number(d.csvClient)).code.toLowerCase()}.csv`, csvSize: text.length, csvStage: 'pick', csvPreview: null });
    render();
  },
  csvTemplate: () => { const c = client(Number(view.draft.csvClient)); downloadText(`template-outbound-request-${c.code.toLowerCase()}.csv`, csvTemplate(c.id)); toast('Template di-download', 'information', 'Kolom sama persis dengan yang divalidasi server.'); },
  csvPreview: () => {
    const d = view.draft;
    const pv = previewOutboundCsv({ hubId: d.csvHub, clientId: d.csvClient, text: d.csvText });
    if (pv.fileError) { toast('File tidak bisa dibaca', 'error', esc(pv.fileError)); return; }
    Object.assign(d, { csvPreview: pv, csvStage: 'preview' });
    render();
  },
  csvBack: () => { view.draft.csvStage = 'pick'; render(); },
  csvErrors: () => { const d = view.draft; downloadText(`errors-${d.csvFileName || 'upload.csv'}`, toCsv([['row', 'field', 'value', 'reason'], ...d.csvPreview.errors.map((e) => [e.row, e.field, e.value, e.message])], true)); toast('Error CSV di-download', 'information'); },
  csvCommit: () => {
    const d = view.draft;
    try {
      const up = commit(() => commitOutboundCsv({ hubId: d.csvHub, clientId: d.csvClient, text: d.csvText, fileName: d.csvFileName }));
      view.modal = null;
      Object.assign(view.tab, { or: 'ALL' });
      Object.assign(view.search, { orSource: '', orType: '', or: up.code });
      toast(`${up.created} outbound request dibuat`, 'success', `${up.code} · ${esc(up.fileName)}${up.skipped ? ` · ${up.skipped} dilewati (sudah ada)` : ''}`);
      go('#/warehouse/outbound-request');
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      toast(e.message, 'error');
      ACTIONS.csvPreview();
    }
  },
  // ── client API (next phase) ──
  openApiOrder: () => { ['apiInit', 'apiResp'].forEach((k) => delete view.draft[k]); view.modal = { type: 'api' }; render(); },
  apiClientChange: () => {
    const d = view.draft;
    const cid = Number(d.apiClient);
    const ds = DESTS[cid] || DESTS[12];
    const dest = ds[Math.floor(Math.random() * ds.length)];
    const skus = db.skus.filter((s) => s.clientId === cid);
    Object.assign(d, { apiHub: 3, apiExt: `${extPrefix(client(cid))}-${55000 + Math.floor(Math.random() * 900)}`, apiName: dest.name, apiPhone: dest.phone, apiAddr: dest.address, apiLat: dest.lat, apiLng: dest.lng, apiSku1: skus[0].sku, apiQty1: 5, apiSku2: skus[1] ? skus[1].sku : '', apiQty2: skus[1] ? 5 : '', apiResp: null });
    render();
  },
  sendApiOrder: () => {
    const d = view.draft;
    const p = apiPayload();
    try {
      const res = commit(() => createOutboundFromApi({ clientId: Number(d.apiClient), hubId: p.hubID, externalId: p.externalId, recipient: p.recipient, destination: { address: p.destination.address, lat: p.destination.latitude, lng: p.destination.longitude }, lines: p.lines, serviceType: p.serviceType }));
      d.apiResp = { http: 200, orderId: res.order.id, body: { status: 'Success', data: { result: res.status, id: res.order.id, code: res.order.code, externalID: res.order.externalId, status: res.order.status, hubID: res.order.hubId } } };
      if (res.status === 'CREATED') toast('Outbound request masuk', 'success', `${res.order.code} · ${esc(res.order.externalId)} · status Open`); else toast('Idempotent replay — EXISTS', 'information', 'externalId sudah pernah dikirim; order lama dikembalikan.');
      render();
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      const sku = /SKU/.test(e.message) || (e.details || []).some((x) => x.field === 'sku');
      d.apiResp = { http: 422, body: { status: 'Failed', error: e.message, code: sku ? 'SKU_NOT_IN_CATALOG' : 'VALIDATION', errors: (e.details || []).map((x) => ({ field: x.field, message: x.message, lineIndex: x.line == null ? null : x.line })) } };
      render();
    }
  },
  gotoApiOrder: () => { const id = view.draft.apiResp && view.draft.apiResp.orderId; view.modal = null; if (id) go('#/warehouse/outbound-request/' + id); else render(); },
  // ── outbound ops ──
  createPicking: (el) => {
    const id = idOf(el);
    try {
      const g = commit(() => createPickingOrder(id));
      toast('Picking order dibuat · FEFO', 'success', `${g.code} · ${g.lines.map((l) => `${esc(storage(l.storageId).code)} ${fmtQty(l.qtyReserved)}`).join(' · ')}`);
      go('#/warehouse/picking/' + g.id);
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      if (e.details) { view.modal = { type: 'shortfall', id, rows: e.details }; render(); } else toast(e.message, 'error');
    }
  },
  bulkCreatePicking: () => {
    const ids = (view.sel.or || []).filter((id) => outbound(id) && outbound(id).status === 'OPEN');
    let ok = 0;
    let firstFail = null;
    let fails = 0;
    ids.forEach((id) => { try { createPickingOrder(id); ok += 1; } catch (e) { if (!(e instanceof AppError)) throw e; fails += 1; if (!firstFail) firstFail = { id, rows: e.details, msg: e.message }; } });
    view.sel.or = [];
    save();
    if (ok) toast(`${ok} picking order dibuat`, 'success', `Lanjut assign picker di menu Picking.${fails ? ` ${fails} order gagal (stok kurang).` : ''}`);
    view.modal = firstFail && firstFail.rows ? { type: 'shortfall', id: firstFail.id, rows: firstFail.rows } : null;
    if (firstFail && !firstFail.rows) toast(firstFail.msg, 'error');
    render();
  },
  openCancel: (el) => { view.draft.cancelReason = ''; view.draft.cancelError = null; view.modal = { type: 'cancel', id: idOf(el) }; render(); },
  confirmCancel: (el) => {
    if (!String(view.draft.cancelReason || '').trim()) { view.draft.cancelError = 'Alasan wajib diisi.'; render(); return; }
    guard(() => { commit(() => cancelOutbound(idOf(el), view.draft.cancelReason)); view.modal = null; render(); toast('Outbound request dibatalkan', 'information', 'Reserve stok (bila ada) dilepas.'); });
  },
  // ── picking ──
  assignPicker: (el) => { const g = gi(route.parts[2]); if (!g) return; guard(() => { commit(() => assignPicker(g.id, el.value)); toast(el.value ? `Picker: ${el.value}` : 'Picker dikosongkan', 'information'); }); },
  pickAll: (el) => guard(() => { commit(() => pickAll(idOf(el))); toast('Semua baris ter-pick', 'success', 'Status All picked — siap Ready to pick up.'); }),
  deletePicking: (el) => { const g = gi(idOf(el)); if (!g) return; view.modal = { type: 'confirm', title: 'Delete picking order?', desc: g.code, body: 'Reserve stok dilepas dan outbound request kembali Open.', confirmLabel: 'Delete', danger: true, act: 'deletePickingConfirm', id: g.id }; render(); },
  deletePickingConfirm: (el) => { const g = gi(idOf(el)); guard(() => { commit(() => deletePicking(g.id)); view.modal = null; toast('Picking dihapus', 'information', 'Reserve dilepas.'); go('#/warehouse/outbound-request/' + g.outboundId); }); },
  readyToPickup: (el) => { guard(() => { commit(() => readyToPickup(idOf(el))); const g = gi(idOf(el)); toast('Ready to pick up', 'success', `Surat jalan ${esc(g.suratJalan)} terbit — dokumen pindah ke Shipping.`); go('#/warehouse/shipping/' + g.id); }); },
  // ── shipping ──
  submitShipping: (el) => {
    try {
      const res = commit(() => submitShipping(idOf(el)));
      toast('Shipping di-submit', 'success', `Stok dipotong · AWB ${esc(res.shipment.waybill)} lahir di Shipments (At hub)`);
      if (res.transferPo) toast(`PO transfer ${res.transferPo.code} terbit`, 'success', `di ${esc(hub(res.transferPo.hubId).name)} · Confirmed · receipt Scheduled`);
    } catch (e) { if (!(e instanceof AppError)) throw e; toast(e.message, 'error'); }
  },
  bulkSubmitShipping: () => {
    const ids = (view.sel.sp || []).filter((id) => gi(id) && gi(id).status === 'READY_TO_PICKUP');
    let ok = 0;
    let fail = 0;
    let transfers = 0;
    ids.forEach((id) => { try { const r = submitShipping(id); ok += 1; if (r.transferPo) transfers += 1; } catch (e) { if (!(e instanceof AppError)) throw e; fail += 1; } });
    view.sel.sp = [];
    save();
    render();
    toast(`${ok} shipping di-submit${fail ? `, ${fail} gagal` : ''}`, fail ? 'warning' : 'success', ok ? `AWB baru muncul di menu Shipments.${transfers ? ` ${transfers} PO transfer terbit di hub tujuan.` : ''}` : '');
  },
  openShipment: (el) => go('#/shipments?detail=' + idOf(el)),
  advanceShipment: (el) => {
    const step = el.getAttribute('data-step');
    guard(() => {
      commit(() => advanceShipment(idOf(el), step));
      const sh = shipment(idOf(el));
      const o = sh.wms ? outbound(sh.wms.outboundId) : null;
      toast(`${sh.waybill} → ${SH_LABEL[sh.status]}`, step === 'FAIL' ? 'warning' : 'success', o ? `Outbound ${esc(o.code)} ikut: ${OR_LABEL[o.status]}` : 'Shipment non-WMS.');
    });
  },
  // ── purchase order: wizard ──
  openCreatePo: () => { dropDraft('po'); view.modal = { type: 'createPo' }; render(); },
  poType: (el) => { const d = view.draft; const t = keyOf(el); if (t === 'TRANSFER') return; d.poType = t; d.poErrors = (d.poErrors || []).filter((e) => !['vendor', 'returned_from', 'type'].includes(e.field)); render(); },
  poClientChange: () => { Object.assign(view.draft, { poLines: [{ sku: '', qty: '' }], poSku: null, poSkuLine: null }); view.draft.poErrors = (view.draft.poErrors || []).filter((e) => e.field !== 'client'); render(); },
  poVendorToggle: () => {
    const d = view.draft;
    d.poVendorOpen = !d.poVendorOpen;
    render();
    if (d.poVendorOpen) { const s = document.querySelector('[data-fk="draft.poVendorQ"]'); if (s) s.focus(); }
  },
  poPickVendor: (el) => { const d = view.draft; Object.assign(d, { poVendor: idOf(el), poVendorOpen: false, poVendorQ: '' }); d.poErrors = (d.poErrors || []).filter((e) => e.field !== 'vendor'); render(); },
  poVendorManage: () => { view.modal = null; go('#/warehouse/vendor'); toast('Draft PO disimpan sementara', 'information', 'Buka Create PO lagi setelah menambah vendor.'); },
  poLineSku: (el) => {
    const d = view.draft;
    const i = Number(el.getAttribute('data-i'));
    if (el.value === NEW_SKU) {
      d.poLines[i].sku = '';
      d.poSku = skuDraftEmpty();
      d.poSkuLine = i;
      render();
      const f = document.querySelector('[data-fk="draft.poSku.code"]'); if (f) f.focus();
      return;
    }
    d.poErrors = (d.poErrors || []).filter((e) => e.line !== i);
    render();
  },
  poNewSku: () => {
    const d = view.draft;
    let i = d.poLines.findIndex((l) => !l.sku);
    if (i < 0) { d.poLines.push({ sku: '', qty: '' }); i = d.poLines.length - 1; }
    d.poSku = skuDraftEmpty();
    d.poSkuLine = i;
    render();
    const f = document.querySelector('[data-fk="draft.poSku.code"]'); if (f) f.focus();
  },
  poSkuCancel: () => { Object.assign(view.draft, { poSku: null, poSkuLine: null }); view.draft.poErrors = null; render(); },
  poSkuSave: () => {
    const d = view.draft;
    const cid = Number(d.poClient);
    try {
      const k = commit(() => createSku(skuPayload(cid, d.poSku)));
      const i = d.poSkuLine != null && d.poLines[d.poSkuLine] ? d.poSkuLine : d.poLines.length;
      if (!d.poLines[i]) d.poLines.push({ sku: '', qty: '' });
      d.poLines[i].sku = k.sku;
      Object.assign(d, { poSku: null, poSkuLine: null, poErrors: null });
      demo().skuKey = `${cid}:${k.sku}`;
      save();
      render();
      toast('SKU dibuat & dipakai', 'success', `${esc(k.sku)} · ${esc(k.name)} masuk katalog ${esc(client(cid).name)}`);
      const q = document.querySelector(`[data-fk="draft.poLines.${i}.qty"]`); if (q) q.focus();
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      d.poSku.errors = e.details || [{ field: '', message: e.message }];
      render();
    }
  },
  poAddLine: () => { view.draft.poLines.push({ sku: '', qty: '' }); render(); },
  poDelLine: (el) => {
    const d = view.draft;
    const i = Number(el.getAttribute('data-i'));
    d.poLines.splice(i, 1);
    if (d.poSkuLine === i) Object.assign(d, { poSku: null, poSkuLine: null });
    else if (d.poSkuLine != null && d.poSkuLine > i) d.poSkuLine -= 1;
    d.poErrors = null;
    render();
  },
  poNext: () => {
    const d = view.draft;
    const errs = poLocalCheck(d.poStep);
    d.poErrors = errs.length ? errs : null;
    if (!errs.length) { d.poStep = Math.min(PO_STEPS.length, d.poStep + 1); d.poVendorOpen = false; }
    render();
    scrollTopOf('modal-body');
  },
  poBack: () => { const d = view.draft; d.poErrors = null; d.poStep = Math.max(1, d.poStep - 1); render(); scrollTopOf('modal-body'); },
  poGoto: (el) => { const d = view.draft; const n = Number(keyOf(el)); if (n < d.poStep) { d.poStep = n; render(); } },
  submitCreatePo: () => {
    const d = view.draft;
    const pre = [...poLocalCheck(1), ...poLocalCheck(2)];
    if (pre.length) { d.poErrors = pre; d.poStep = minStep(pre); render(); return; }
    let x;
    try {
      x = commit(() => createPO({ type: d.poType, clientId: Number(d.poClient), hubId: Number(d.poHub), vendorId: d.poVendor, returnedFrom: d.poReturnedFrom, estArrival: d.poEta ? new Date(`${d.poEta}T10:00:00`).toISOString() : null, notes: d.poNotes, lines: poFilledLines() }));
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      d.poErrors = (e.details && e.details.length ? e.details : [{ field: '', message: e.message, step: 1 }]).map((y) => ({ ...y, step: y.step || 1 }));
      d.poStep = minStep(d.poErrors);
      render();
      toast('Server menolak — 422 VALIDATION', 'error', `${d.poErrors.length} isian perlu diperbaiki`);
      return;
    }
    if (x.type === 'RETURN') demo().returnPoId = x.id; else demo().poId = x.id;
    save();
    dropDraft('po');
    view.modal = null;
    toast('PO draft dibuat', 'success', `${x.code} · ${PO_TYPE_META[x.type].label} · ${esc(poSourceOf(x).value)}`);
    go('#/warehouse/purchase-order/' + x.id);
  },
  confirmPo: (el) => guard(() => { commit(() => confirmPO(idOf(el))); toast('PO confirmed', 'success', 'Inbound request terbit · status Scheduled'); }),
  openCancelPo: (el) => { view.draft.poCancelReason = ''; view.modal = { type: 'cancelPo', id: idOf(el) }; render(); },
  cancelPoConfirm: (el) => guard(() => { commit(() => cancelPO(idOf(el), view.draft.poCancelReason)); view.modal = null; render(); toast('PO dibatalkan', 'information'); }),
  // ── SKU ──
  skuToggleExpiry: (el) => { const k = idOf(el); if (view.draft[k]) view.draft[k].expiry = el.checked; render(); },
  openSkuForm: () => { view.draft.skuForm = skuDraftEmpty(); view.draft.skuFormClient = view.draft.skuClient || db.clients[0].id; view.modal = { type: 'skuForm' }; render(); },
  submitSkuForm: () => {
    const d = view.draft;
    const cid = Number(d.skuFormClient);
    try {
      const k = commit(() => createSku(skuPayload(cid, d.skuForm)));
      view.modal = null;
      render();
      toast('SKU dibuat', 'success', `${esc(k.sku)} · ${esc(k.name)} · ${esc(client(cid).name)}`);
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      d.skuForm.errors = e.details || [{ field: '', message: e.message }];
      render();
    }
  },
  // ── vendor ──
  openVendorForm: (el) => { const id = idOf(el) || null; view.draft.ven = vendorDraftOf(id ? vendor(id) : null); view.draft.venErrors = null; view.modal = { type: 'vendorForm', id }; render(); },
  submitVendorForm: (el) => {
    const id = idOf(el) || null;
    const d = view.draft;
    try {
      const v = commit(() => (id ? updateVendor(id, d.ven) : createVendor(d.ven)));
      view.modal = null;
      if (!id) { demo().vendorId = v.id; save(); }
      render();
      toast(id ? 'Vendor disimpan' : 'Vendor ditambahkan', 'success', `${esc(v.code)} · ${esc(v.name)}`);
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      d.venErrors = e.details || [{ field: '', message: e.message }];
      render();
      scrollTopOf('modal-body');
    }
  },
  vendorDeactivate: (el) => { const v = vendor(idOf(el)); if (!v) return; view.modal = { type: 'confirm', icon: 'r:RiForbid2Line', title: 'Nonaktifkan vendor?', desc: `${v.code} · ${v.name}`, body: 'Vendor nonaktif tidak bisa dipilih di PO baru. PO yang sudah ada tetap berjalan.', confirmLabel: 'Nonaktifkan', danger: true, act: 'vendorDeactivateConfirm', id: v.id }; render(); },
  vendorDeactivateConfirm: (el) => guard(() => { const v = commit(() => setVendorStatus(idOf(el), 'INACTIVE')); view.modal = null; render(); toast('Vendor dinonaktifkan', 'information', `${esc(v.name)} tidak muncul di pilihan vendor PO.`); }),
  vendorActivate: (el) => guard(() => { const v = commit(() => setVendorStatus(idOf(el), 'ACTIVE')); toast('Vendor diaktifkan', 'success', `${esc(v.name)} bisa dipilih di PO.`); }),
  vendorPos: (el) => { const v = vendor(idOf(el)); if (!v) return; view.tab.po = 'ALL'; view.search.poType = ''; view.search.po = v.name; go('#/warehouse/purchase-order'); },
  // ── goods receipt: wizard ──
  grSplit: (el) => {
    const d = view.draft;
    const i = Number(el.getAttribute('data-i'));
    const l = d.grLines[i];
    const x = po(d.grPo);
    const pool = activeStoragesOf(x.hubId).filter((s) => lineage(s).type === (lineage(storage(l.storageId) || {}).type ? lineage(storage(l.storageId)).type : 'STORAGE'));
    const list = pool.length ? pool : activeStoragesOf(x.hubId);
    const next = list[(list.findIndex((b) => b.id === l.storageId) + 1) % list.length];
    const total = Number(l.qty) || 0;
    const half = Math.floor(total / 2);
    d.grLines.splice(i + 1, 0, { key: uid('grl'), sku: l.sku, qty: total - half, expiry: l.expiry, storageId: next ? next.id : '' });
    l.qty = half;
    render();
  },
  grDelLine: (el) => { view.draft.grLines.splice(Number(el.getAttribute('data-i')), 1); render(); },
  grToggleClose: (el) => { view.draft.grClose = el.checked; render(); },
  grNext: () => {
    const d = view.draft;
    const errs = grLocalCheck(d.grStep);
    d.grErrors = errs.length ? errs : null;
    if (!errs.length) d.grStep = Math.min(GR_STEPS.length, d.grStep + 1);
    render();
    scrollTopOf('main');
  },
  grBack: () => { const d = view.draft; d.grErrors = null; if (d.grStep <= 2) { go('#/warehouse/goods-receipt/new'); return; } d.grStep -= 1; render(); },
  grGoto: (el) => { const d = view.draft; const n = Number(keyOf(el)); if (n === 1) { go('#/warehouse/goods-receipt/new'); return; } if (n < d.grStep) { d.grStep = n; d.grErrors = null; render(); } },
  grSamplePdf: () => { const d = view.draft; const dn = String(d.grDn || '').trim() || `SJ-SUP-${randAlnum(4)}`; startPdfUpload(samplePdfFile(`surat-jalan-${dn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, `${dn} · ${po(d.grPo) ? po(d.grPo).code : ''}`)); },
  grDocRemove: () => { Object.assign(view.draft, { grDoc: null, grUpload: null }); view.draft.grErrors = (view.draft.grErrors || []).filter((e) => e.field !== 'delivery_note'); render(); },
  submitGr: () => {
    const d = view.draft;
    const pre = [...grLocalCheck(2), ...grLocalCheck(3)];
    if (pre.length) { d.grErrors = pre; d.grStep = minStep(pre); render(); return; }
    const x = po(d.grPo);
    let g;
    try {
      g = commit(() => submitGR({ poId: d.grPo, dateArrival: d.grArrival ? new Date(d.grArrival).toISOString() : nowIso(), deliveryNote: d.grDn, deliveryNoteDoc: d.grDoc, notes: d.grNotes, closeBackorder: d.grClose, lines: d.grLines.map((l) => ({ sku: l.sku, qty: Number(l.qty), expiry: l.expiry || null, storageId: l.storageId })) }));
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      d.grErrors = (e.details && e.details.length ? e.details : [{ field: '', message: e.message, step: 2 }]).map((y) => ({ ...y, step: y.step || 2 }));
      d.grStep = minStep(d.grErrors);
      render();
      toast('Server menolak goods receipt', 'error', esc(e.message));
      return;
    }
    const dm = demo();
    const t = dm.transferId ? outbound(dm.transferId) : null;
    if (x.id === dm.poId) dm.grId = g.id;
    if (t && t.transferPoId === x.id) dm.transferGrId = g.id;
    if (x.id === dm.returnPoId) dm.returnGrId = g.id;
    save();
    dropDraft('gr');
    toast('Goods receipt posted', 'success', `${g.code} · ${g.lines.length} lot baru · stok on hand naik${x.type === 'RETURN' ? ' (karantina)' : ''}`);
    go('#/warehouse/goods-receipt/' + g.id);
  },
  // ── storage ──
  openCreateStorage: () => { ['stHub', 'stCat', 'stParent', 'stType', 'stCode', 'stName', 'stError'].forEach((k) => delete view.draft[k]); view.modal = { type: 'createStorage' }; render(); },
  submitCreateStorage: () => {
    const d = view.draft;
    const hubId = Number(d.stHub || (db.ui.hubId === 'all' ? 3 : db.ui.hubId));
    try {
      const s = commit(() => createStorage({ hubId, category: d.stCat || 'BIN', parentId: d.stParent, code: d.stCode, name: d.stName, type: d.stType }));
      view.modal = null;
      render();
      toast('Storage dibuat', 'success', `${esc(storageOptionLabel(s))}`);
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      d.stError = e.message;
      render();
    }
  },
};

/* ── boot ── */
loadDb();
if (!location.hash) location.replace(HOME);
parseRoute();
openActiveBranch();
render();
