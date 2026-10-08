// ── Warehouse management › SKU (katalog per client) + field SKU bersama (modal & panel inline PO) ──
const skuDraftEmpty = (code) => ({ code: code || '', name: '', uom: 'pcs', l: '', w: '', h: '', kg: '', expiry: false, errors: null });
const skuErrOf = (d, field) => { const e = (d.errors || []).find((x) => x.field === field); return e ? e.message : null; };
const skuDims = (k) => (k.lengthCm && k.widthCm && k.heightCm ? `${fmtQty(k.lengthCm)} × ${fmtQty(k.widthCm)} × ${fmtQty(k.heightCm)} cm` : null);
const skuCbm = (k) => (k.lengthCm && k.widthCm && k.heightCm ? (k.lengthCm * k.widthCm * k.heightCm) / 1e6 : null);

/** SKU · nama · UoM, lalu dimensi + berat — seluruh field master SKU. key = 'skuForm' | 'poSku'. */
function skuFields(key, d) {
  const m = (f) => `draft.${key}.${f}`;
  return `<div class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_120px]">
      ${field('SKU', input({ model: m('code'), value: d.code, placeholder: 'SRX-ORS-200', mono: true, invalid: !!skuErrOf(d, 'sku'), label: 'Kode SKU' }), null, { required: true, error: skuErrOf(d, 'sku') })}
      ${field('Nama item', input({ model: m('name'), value: d.name, placeholder: 'Oralit sachet 200 ml (box isi 50)', invalid: !!skuErrOf(d, 'name'), label: 'Nama item' }), null, { required: true, error: skuErrOf(d, 'name') })}
      ${field('UoM', select({ model: m('uom'), value: d.uom, options: UOMS.map((u) => ({ value: u, label: u })), label: 'UoM' }), null, { required: true })}
    </div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      ${[['l', 'Panjang (cm)'], ['w', 'Lebar (cm)'], ['h', 'Tinggi (cm)'], ['kg', 'Berat / unit (kg)']].map(([k, label]) => field(label, input({ model: m(k), value: d[k], inputmode: 'decimal', invalid: !!skuErrOf(d, 'dims'), label }), null, { optional: true })).join('')}
    </div>
    ${skuErrOf(d, 'dims') ? `<p role="alert" class="text-xs text-(--state-error-base)">${esc(skuErrOf(d, 'dims'))}</p>` : ''}
    <label class="flex items-center gap-2 text-[12px] text-text-sub-600">${checkbox({ checked: d.expiry, act: 'skuToggleExpiry', id: key, label: 'Lacak expiry' })}<span>Lacak expiry date (FEFO) — goods receipt mengisi expired date per lot</span></label>`;
}
const skuPayload = (clientId, d) => ({ clientId, sku: d.code, name: d.name, uom: d.uom, lengthCm: d.l, widthCm: d.w, heightCm: d.h, weightKg: d.kg, expiry: d.expiry });

function pageSku() {
  const q = (view.search.sku || '').toLowerCase();
  const cf = view.draft.skuClient ? Number(view.draft.skuClient) : null;
  const rows = db.skus
    .filter((k) => (cf ? k.clientId === cf : true))
    .filter((k) => !q || [k.sku, k.name].join(' ').toLowerCase().includes(q))
    .slice()
    .sort((a, b) => a.clientId - b.clientId || a.sku.localeCompare(b.sku));
  const onHandAll = (k) => sum(db.stocks.filter((s) => s.clientId === k.clientId && s.sku === k.sku).map((s) => s.onHand));
  const cols = [
    { key: 'sku', title: 'SKU', render: (k) => `<span class="${codeCls}">${esc(k.sku)}</span>${db.ui.demo.skuKey === `${k.clientId}:${k.sku}` ? ` <span class="ml-1">${tag('baru', 'accent')}</span>` : ''}` },
    { key: 'name', title: 'Nama item', render: (k) => `<span class="${nameCls}">${esc(k.name)}</span>` },
    { key: 'client', title: 'Client', render: (k) => `<span class="${nameCls}">${esc(client(k.clientId).name)}</span>` },
    { key: 'uom', title: 'UoM', render: (k) => `<span class="${metaCls}">${esc(k.uom)}</span>` },
    { key: 'dims', title: 'Dimensi', render: (k) => (skuDims(k) ? `<span class="text-[12px] tabular-nums text-text-sub-600">${skuDims(k)}</span>` : dash) },
    { key: 'cbm', title: 'CBM / unit', align: 'right', render: (k) => (skuCbm(k) ? `<span class="${numCls}">${skuCbm(k).toFixed(4)}</span>` : dash) },
    { key: 'kg', title: 'Berat / unit', align: 'right', render: (k) => (k.weightKg ? `<span class="${numCls}">${fmtQty(k.weightKg)} kg</span>` : dash) },
    { key: 'exp', title: 'Expiry', render: (k) => (k.expiry ? tag('FEFO', 'accent') : `<span class="${metaCls}">—</span>`) },
    { key: 'stock', title: 'On hand (semua hub)', align: 'right', render: (k) => `<span class="${numCls}">${fmtQty(onHandAll(k))}</span>` },
    { key: 'created', title: 'Created', render: (k) => `<span class="${dateCls}">${fmtDate(k.createdAt)}</span>` },
  ];
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Warehouse management', title: 'SKU', desc: 'Katalog SKU per client. Outbound request, PO dan goods receipt hanya menerima SKU yang ada di katalog client-nya. SKU baru juga bisa dibuat langsung dari langkah Barang di Create PO.', actions: headerActions(btn({ label: 'Tambah SKU', icon: 'r:RiAddLine', act: 'openSkuForm' }), { noHub: true }) })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p class="${metaCls}">${db.skus.length} SKU · ${db.clients.length} client</p>
        <div class="flex items-center gap-2">${clientSelect('draft.skuClient', view.draft.skuClient)}${searchField({ model: 'search.sku', value: view.search.sku, placeholder: 'Cari SKU atau nama item…', cls: 'w-64' })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, emptyTitle: 'Belum ada SKU', emptyDesc: 'Tambah SKU untuk client ini.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}

function modalSkuForm() {
  const d = view.draft.skuForm || (view.draft.skuForm = skuDraftEmpty());
  const cid = Number(view.draft.skuFormClient || view.draft.skuClient || db.clients[0].id);
  return formModal({
    width: 'max-w-2xl', icon: 'r:RiBarcodeLine', title: 'Tambah SKU', desc: 'Katalog SKU per client — dipakai outbound request, PO dan goods receipt.',
    body: `<div class="flex flex-col gap-3">
      ${d.errors && d.errors.length ? alertBox('error', 'Gagal menyimpan', `<ul class="list-disc pl-4">${d.errors.map((e) => `<li>${esc(e.message)}</li>`).join('')}</ul>`) : ''}
      ${field('Client', select({ model: 'draft.skuFormClient', value: cid, options: clientOptions(), label: 'Client SKU' }), null, { required: true })}
      ${skuFields('skuForm', d)}
    </div>`,
    footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: 'Tambah SKU', icon: 'r:RiCheckLine', act: 'submitSkuForm' })}`,
  });
}
