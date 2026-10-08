// ── Supply management › Vendor (master global; dipilih di PO tipe Regular) ──
const VENDOR_TABS = ['ALL', 'ACTIVE', 'INACTIVE'];
const vendorDraftOf = (v) => ({ name: v ? v.name : '', phone: v ? v.phone : '', email: v ? v.email : '', address: v ? v.address : '', picName: v ? v.picName : '', picPhone: v ? v.picPhone : '', npwp: v ? v.npwp : '' });
const fmtNpwp = (n) => (n && n.length === 15 ? `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}.${n.slice(8, 9)}-${n.slice(9, 12)}.${n.slice(12)}` : n || '');

function pageVendor() {
  const all = db.vendors;
  const tab = view.tab.ven || 'ALL';
  const q = (view.search.ven || '').toLowerCase();
  const rows = all
    .filter((v) => tab === 'ALL' || v.status === tab)
    .filter((v) => !q || [v.code, v.name, v.picName, v.phone, v.email, v.npwp].join(' ').toLowerCase().includes(q));
  const cols = [
    { key: 'code', title: 'Kode', render: (v) => `<span class="${codeCls}">${esc(v.code)}</span>${db.ui.demo.vendorId === v.id ? ` <span class="ml-1">${tag('baru', 'accent')}</span>` : ''}` },
    { key: 'name', title: 'Nama vendor', render: (v) => `<div><p class="${nameCls} font-medium">${esc(v.name)}</p><p class="${metaCls} max-w-[280px] truncate">${esc(v.address || '—')}</p></div>` },
    { key: 'pic', title: 'PIC', render: (v) => (v.picName ? `<div><p class="${nameCls}">${esc(v.picName)}</p><p class="${metaCls} font-mono">${esc(v.picPhone || '—')}</p></div>` : dash) },
    { key: 'contact', title: 'Telepon / email', render: (v) => (v.phone || v.email ? `<div><p class="font-mono text-[12px] text-text-strong-950">${esc(v.phone || '—')}</p><p class="${metaCls}">${esc(v.email || '—')}</p></div>` : dash) },
    { key: 'npwp', title: 'NPWP', render: (v) => (v.npwp ? `<span class="font-mono text-[12px] text-text-sub-600">${esc(fmtNpwp(v.npwp))}</span>` : dash) },
    { key: 'po', title: 'PO', align: 'right', render: (v) => `<span class="${numCls}">${poCountOfVendor(v.id)}</span>` },
    { key: 'status', title: 'Status', render: (v) => vendorBadge(v.status) },
    { key: 'actions', title: '', align: 'right', render: (v) => rowMenu('ven:' + v.id) },
  ];
  return `<div class="space-y-5 p-6">
    ${pageHeader({ eyebrow: 'Warehouse · Supply management', title: 'Vendor', desc: 'Master vendor untuk PO tipe Regular. Berlaku untuk semua hub; vendor nonaktif tidak bisa dipilih di PO baru (PO lama tetap).', actions: headerActions(btn({ label: 'Tambah vendor', icon: 'r:RiAddLine', act: 'openVendorForm' }), { noHub: true }) })}
    ${card(`<div class="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-1 pb-3 lg:flex-row lg:items-end lg:justify-between lg:pb-0">
        ${tabsLine(VENDOR_TABS.map((k) => ({ key: k, label: k === 'ALL' ? 'All' : VENDOR_LABEL[k], count: k === 'ALL' ? all.length : all.filter((v) => v.status === k).length })), tab, 'tabVen')}
        <div class="flex flex-1 items-center justify-end gap-2 lg:py-2">${searchField({ model: 'search.ven', value: view.search.ven, placeholder: 'Cari kode, nama, PIC, telepon…', cls: 'max-w-xs flex-1' })}</div>
      </div>
      <div class="p-4">${table({ columns: cols, rows, rowAct: (v) => ['openVendorForm', v.id], emptyTitle: 'Belum ada vendor', emptyDesc: 'Tambah vendor untuk dipilih di purchase order.' })}${tableFooter(rows.length)}</div>`)}
  </div>`;
}
function menuVendor(v) {
  return [
    menuItem({ label: 'Edit vendor', icon: 'r:RiEditLine', act: 'openVendorForm', data: { 'data-id': v.id } }),
    menuItem({ label: 'Lihat PO vendor ini', icon: 'r:RiFileList3Line', act: 'vendorPos', data: { 'data-id': v.id } }),
    v.status === 'ACTIVE'
      ? menuItem({ label: 'Nonaktifkan', icon: 'r:RiForbid2Line', act: 'vendorDeactivate', data: { 'data-id': v.id }, destructive: true })
      : menuItem({ label: 'Aktifkan', icon: 'r:RiCheckboxCircleLine', act: 'vendorActivate', data: { 'data-id': v.id } }),
  ].join('');
}

function modalVendorForm(m) {
  const v = m.id ? vendor(m.id) : null;
  const d = view.draft.ven || (view.draft.ven = vendorDraftOf(v));
  const errs = view.draft.venErrors || [];
  const errOf = (f) => { const e = errs.find((x) => x.field === f); return e ? e.message : null; };
  const formErrs = errs.filter((x) => !VENDOR_FIELDS.includes(x.field));
  const f = (key, label, o) => field(label, input({ model: `draft.ven.${key}`, value: d[key], placeholder: o.placeholder, icon: o.icon, inputmode: o.inputmode, mono: o.mono, invalid: !!errOf(key), label }), o.hint || null, { required: o.required, optional: !o.required, error: errOf(key) });
  return formModal({
    width: 'max-w-xl', icon: 'r:RiStore2Line', title: v ? 'Edit vendor' : 'Tambah vendor', desc: v ? `${v.code} · ${v.name}` : 'Master vendor global — dipilih di PO tipe Regular. Kode VEN… dibuat otomatis.',
    headerExtra: v ? vendorBadge(v.status) : '',
    body: `<div class="flex flex-col gap-3">
      ${errs.length ? alertBox('error', `${errs.length} isian perlu diperbaiki`, formErrs.length ? `<ul class="list-disc pl-4">${formErrs.map((e) => `<li>${esc(e.message)}</li>`).join('')}</ul>` : 'Cek pesan di bawah tiap field.') : ''}
      ${f('name', 'Nama vendor', { required: true, placeholder: 'mis. PT Medika Prima Distribusi' })}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">${f('phone', 'Telepon', { icon: 'r:RiPhoneLine', inputmode: 'tel', placeholder: '021… / 08…' })}${f('email', 'Email', { icon: 'r:RiMailLine', inputmode: 'email', placeholder: 'sales@vendor.co.id' })}</div>
      ${field('Alamat', textarea({ model: 'draft.ven.address', value: d.address, rows: 2, invalid: !!errOf('address'), label: 'Alamat', placeholder: 'Alamat kantor / gudang vendor' }), null, { optional: true, error: errOf('address') })}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">${f('picName', 'Nama PIC', { icon: 'r:RiUserLine' })}${f('picPhone', 'Telepon PIC', { icon: 'r:RiPhoneLine', inputmode: 'tel', placeholder: '08…' })}</div>
      ${f('npwp', 'NPWP', { inputmode: 'numeric', placeholder: '15 / 16 digit', mono: true, hint: 'Titik & strip boleh — disimpan sebagai angka saja.' })}
    </div>`,
    footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: v ? 'Simpan' : 'Tambah vendor', icon: 'r:RiCheckLine', act: 'submitVendorForm', data: { 'data-id': v ? v.id : '' } })}`,
  });
}
