// ── Outbound request intake: wizard manual (4 langkah) + upload CSV (pola modal import Shipments/Addresses) ──
const SOURCE_TAG = { MANUAL: ['Manual', 'gray', 'r:RiEditLine'], CSV: ['CSV', 'stroke', 'r:RiUpload2Line'], CLIENT_API: ['Client API', 'accent', 'r:RiCodeSSlashLine'] };
const uploadOf = (o) => (o.uploadId ? db.uploads.find((u) => u.id === o.uploadId) : null);
const sourceCell = (o) => { const u = uploadOf(o); return `<div class="flex flex-col items-start gap-1">${sourceTag(o)}${u ? `<span class="font-mono text-[10px] text-text-soft-400">${esc(u.code)}</span>` : ''}</div>`; };
const hubOptions = (exceptId) => db.hubs.filter((h) => h.id !== Number(exceptId)).map((h) => ({ value: h.id, label: `${h.name} (${h.code})` }));
const clientOptions = () => db.clients.map((c) => ({ value: c.id, label: c.name }));
const skuOptions = (clientId) => db.skus.filter((k) => k.clientId === Number(clientId)).map((k) => ({ value: k.sku, label: `${k.sku} · ${k.name}` }));
function downloadText(fileName, text) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) { /* pratinjau tanpa izin download: abaikan */ }
}
const sumTile = (label, value, tone) => {
  const T = { success: 'bg-(--state-success-lighter) text-(--state-success-dark)', information: 'bg-(--state-information-lighter) text-(--state-information-dark)', error: 'bg-(--state-error-lighter) text-(--state-error-dark)', warning: 'bg-(--state-warning-lighter) text-(--state-warning-dark)', neutral: 'bg-bg-weak-50 text-text-strong-950' };
  return `<div class="rounded-xl px-4 py-3 ${T[tone]}"><p class="text-[10px] font-bold uppercase tracking-[0.18em]">${esc(label)}</p><p class="mt-1.5 text-[24px] font-extrabold leading-none tracking-tight tabular-nums">${value}</p></div>`;
};
const outboundTransferTag = (o) => (o.type === 'TRANSFER' ? tag(`Transfer → ${hub(o.destHubId) ? hub(o.destHubId).name : '—'}`, 'stroke', 'xs', 'r:RiArrowLeftRightLine') : '');

/* ───────────── Modal: Create outbound request — wizard Order → Penerima & tujuan → Produk → Review ───────────── */
const OO_STEPS = ['Order', 'Penerima & tujuan', 'Produk', 'Review'];
function mfDefaults() {
  const d = view.draft;
  if (d.mfInit) return;
  const hubId = db.ui.hubId !== 'all' ? Number(db.ui.hubId) : 3;
  Object.assign(d, { mfInit: true, mfStep: 1, mfType: 'REGULAR', mfHub: hubId, mfDestHub: '', mfClient: '', mfExt: '', mfDate: isoDate(nowMs() + DAY), mfService: 'SAME_DAY', mfName: '', mfPhone: '', mfAddr: '', mfLat: '', mfLng: '', mfDestNotes: '', mfNotes: '', mfLines: [{ sku: '', qty: '' }], mfErrors: null });
}
const mfFilledLines = () => view.draft.mfLines.filter((l) => l.sku || String(l.qty).trim() !== '');
function mfPayload() {
  const d = view.draft;
  return {
    type: d.mfType, hubId: Number(d.mfHub), destHubId: d.mfType === 'TRANSFER' ? Number(d.mfDestHub) : null, clientId: Number(d.mfClient), externalId: d.mfExt,
    recipient: { name: d.mfName, phone: d.mfPhone },
    destination: { address: d.mfAddr, lat: d.mfLat, lng: d.mfLng, notes: d.mfDestNotes },
    expectedDate: d.mfDate, serviceType: d.mfService, notes: d.mfNotes,
    lines: mfFilledLines().map((l) => ({ sku: l.sku, qty: l.qty })),
  };
}
/** Lanjut hanya menjaga isian wajib langkah itu; format & aturan bisnis tetap divalidasi "server" saat Create. */
function mfLocalCheck(step) {
  const d = view.draft;
  const out = [];
  const add = (field, message, line) => out.push({ field, message, line, step });
  if (step === 1) {
    if (!d.mfHub) add('hub', 'Hub wajib dipilih.');
    if (!d.mfClient) add('client', 'Client wajib dipilih.');
    if (d.mfType === 'TRANSFER') {
      if (!d.mfDestHub) add('dest_hub', 'Hub tujuan wajib dipilih.');
      else if (Number(d.mfDestHub) === Number(d.mfHub)) add('dest_hub', 'Hub tujuan harus beda dari hub asal.');
    }
    if (!d.mfDate) add('expected_delivery_date', 'Expected delivery wajib diisi.');
  }
  if (step === 2) {
    if (!String(d.mfName).trim()) add('recipient_name', 'Nama penerima wajib diisi.');
    if (!String(d.mfPhone).trim()) add('recipient_phone', 'Telepon wajib diisi.');
    if (!String(d.mfAddr).trim()) add('destination_address', 'Alamat tujuan wajib diisi.');
    const lat = toNum(d.mfLat);
    const lng = toNum(d.mfLng);
    if (lat === null) add('latitude', 'Latitude wajib diisi.'); else if (Number.isNaN(lat) || lat < -90 || lat > 90) add('latitude', 'Latitude harus angka -90…90.');
    if (lng === null) add('longitude', 'Longitude wajib diisi.'); else if (Number.isNaN(lng) || lng < -180 || lng > 180) add('longitude', 'Longitude harus angka -180…180.');
  }
  if (step === 3) {
    const filled = mfFilledLines();
    if (!filled.length) add('lines', 'Minimal satu produk.');
    d.mfLines.forEach((l, i) => {
      if (!l.sku && String(l.qty).trim() === '') return;
      if (!l.sku) add('sku', `Baris ${i + 1}: SKU wajib dipilih.`, i);
      if (!(Number(l.qty) > 0)) add('qty', `Baris ${i + 1}: qty harus > 0.`, i);
    });
  }
  return out;
}
function modalCreateOutbound() {
  mfDefaults();
  const d = view.draft;
  const step = d.mfStep;
  const cid = Number(d.mfClient) || null;
  const hid = Number(d.mfHub);
  const transfer = d.mfType === 'TRANSFER';
  const errs = d.mfErrors || [];
  const errOf = (f, line) => { const e = errs.find((x) => x.field === f && (line == null || x.line == null || x.line === line)); return e ? e.message.replace(/^Baris (produk )?\d+: /, '') : null; };
  const errSteps = new Set(errs.map((e) => e.step));
  const c = cid ? client(cid) : null;
  const destHub = transfer && d.mfDestHub ? hub(d.mfDestHub) : null;
  let body = '';
  if (step === 1) {
    body = `<div class="flex flex-col gap-4">
      ${field('Tipe', segmented({ label: 'Tipe outbound', act: 'mfType', value: d.mfType, options: Object.entries(OO_TYPE_META).map(([k, m]) => ({ value: k, label: m.label, icon: m.icon })) }), transfer ? 'Kirim stok ke hub lain. Saat shipping di-submit, <span class="font-medium text-text-strong-950">PO transfer terbit otomatis</span> di hub tujuan.' : 'Pengiriman ke penerima client.', { required: true })}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field(transfer ? 'Hub asal' : 'Hub', select({ model: 'draft.mfHub', value: hid, options: hubOptions(), onChange: 'mfHubChange', invalid: !!errOf('hub'), label: transfer ? 'Hub asal' : 'Hub' }), null, { required: true, error: errOf('hub') })}
        ${field('Client', select({ model: 'draft.mfClient', value: d.mfClient, placeholder: 'Pilih client', options: clientOptions(), onChange: 'mfClientChange', invalid: !!errOf('client'), label: 'Client' }), null, { required: true, error: errOf('client') })}
      </div>
      ${transfer ? field('Hub tujuan', select({ model: 'draft.mfDestHub', value: d.mfDestHub, placeholder: 'Pilih hub tujuan', options: hubOptions(hid), onChange: 'mfRerenderClear', invalid: !!errOf('dest_hub'), label: 'Hub tujuan' }), 'Stok dikirim dari hub asal ke hub ini; hub tujuan menerimanya lewat goods receipt PO transfer.', { required: true, error: errOf('dest_hub') }) : ''}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field('Ref client / external ID', input({ model: 'draft.mfExt', value: d.mfExt, placeholder: 'mis. SRX-ORD-40201', mono: true, invalid: !!errOf('external_id'), label: 'Ref client' }), 'Kosong = pakai request ID. Ref yang sama tidak dibuat dua kali.', { optional: true, error: errOf('external_id') })}
        ${field('Expected delivery', input({ type: 'date', model: 'draft.mfDate', value: d.mfDate, invalid: !!errOf('expected_delivery_date'), label: 'Expected delivery' }), null, { required: true, error: errOf('expected_delivery_date') })}
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">${field('Service', select({ model: 'draft.mfService', value: d.mfService, options: SERVICE_TYPES.map((x) => ({ value: x, label: x })), label: 'Service' }))}${field('Method', select({ model: 'draft.mfMethod', value: 'DELIVERY', options: [{ value: 'DELIVERY', label: 'Delivery' }], disabled: true, label: 'Method' }), 'Take away belum didukung di v2.')}</div>
      ${field('Catatan order', textarea({ model: 'draft.mfNotes', value: d.mfNotes, rows: 2, placeholder: 'mis. kirim sebelum jam 10', label: 'Catatan order' }), null, { optional: true })}
    </div>`;
  } else if (step === 2) {
    body = `<div class="flex flex-col gap-3">
      ${transfer ? `<p class="${metaCls}">Transfer ke <span class="font-medium text-text-strong-950">${esc(destHub ? destHub.name : '—')}</span>. Isi penerima &amp; alamat hub tujuan secara manual.</p>` : `<p class="${metaCls}">Diketik manual — data penerima tidak diambil dari alamat tersimpan.</p>`}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${field('Nama penerima', input({ model: 'draft.mfName', value: d.mfName, icon: 'r:RiUserLine', placeholder: transfer ? 'mis. Gudang Dash Hub Blok M (PIC)' : 'mis. Apotek Sehat Kemang', invalid: !!errOf('recipient_name'), label: 'Nama penerima' }), null, { required: true, error: errOf('recipient_name') })}
        ${field('Telepon', input({ model: 'draft.mfPhone', value: d.mfPhone, placeholder: '08… / +628…', icon: 'r:RiPhoneLine', inputmode: 'tel', invalid: !!errOf('recipient_phone'), label: 'Telepon penerima' }), 'Nomor HP Indonesia.', { required: true, error: errOf('recipient_phone') })}
      </div>
      ${field('Alamat tujuan', textarea({ model: 'draft.mfAddr', value: d.mfAddr, rows: 2, placeholder: 'Jalan, nomor, kelurahan, kecamatan, kota, kode pos', invalid: !!errOf('destination_address'), label: 'Alamat tujuan' }), null, { required: true, error: errOf('destination_address') })}
      <div class="grid grid-cols-2 gap-3">
        ${field('Latitude', input({ model: 'draft.mfLat', value: d.mfLat, placeholder: '-6.2607', inputmode: 'decimal', mono: true, invalid: !!errOf('latitude'), label: 'Latitude' }), null, { required: true, error: errOf('latitude') })}
        ${field('Longitude', input({ model: 'draft.mfLng', value: d.mfLng, placeholder: '106.8137', inputmode: 'decimal', mono: true, invalid: !!errOf('longitude'), label: 'Longitude' }), null, { required: true, error: errOf('longitude') })}
      </div>
      ${field('Catatan tujuan', input({ model: 'draft.mfDestNotes', value: d.mfDestNotes, placeholder: 'mis. bongkar di pintu belakang', label: 'Catatan tujuan' }), null, { optional: true })}
    </div>`;
  } else if (step === 3) {
    const used = new Set(d.mfLines.map((l) => l.sku).filter(Boolean));
    const opts = cid ? skuOptions(cid) : [];
    const lineRow = (l, i) => {
      const avail = l.sku ? availableFor(hid, cid, l.sku) : null;
      const short = l.sku && Number(l.qty) > 0 && Number(l.qty) > avail;
      const k = l.sku ? skuOf(cid, l.sku) : null;
      const lineErr = errs.find((x) => x.line === i && (x.field === 'sku' || x.field === 'qty'));
      return `<div class="flex flex-col gap-1"><div class="grid grid-cols-[minmax(0,1fr)_110px_150px_32px] items-center gap-2">
        ${select({ model: `draft.mfLines.${i}.sku`, value: l.sku, placeholder: cid ? 'Pilih SKU' : 'Pilih client dulu', options: opts.map((o) => ({ ...o, disabled: o.value !== l.sku && used.has(o.value) })), onChange: 'rerender', disabled: !cid, invalid: !!lineErr, label: `SKU baris ${i + 1}` })}
        ${input({ type: 'number', model: `draft.mfLines.${i}.qty`, value: l.qty, min: 0, step: 'any', placeholder: '0', rerender: 'debounce', suffix: k ? k.uom : '', invalid: !!lineErr, label: `Qty baris ${i + 1}` })}
        <span class="text-[12px] tabular-nums ${short ? 'font-medium text-(--state-warning-dark)' : 'text-text-sub-600'}">${avail == null ? '—' : `${short ? ic('r:RiAlertLine', 'size-3.5 inline -mt-0.5 mr-1') : ''}tersedia ${fmtQty(avail)}`}</span>
        ${btn({ size: 'icon-xs', tone: 'neutral', style: 'ghost', icon: 'r:RiDeleteBinLine', title: 'Hapus baris', act: 'mfDelLine', data: { 'data-i': i }, disabled: d.mfLines.length === 1 })}
      </div>${lineErr ? `<p role="alert" class="text-[11px] text-(--state-error-base)">Baris ${i + 1}: ${esc(lineErr.message.replace(/^Baris (produk )?\d+: /, ''))}</p>` : ''}</div>`;
    };
    const shortages = cid ? stockShortages(hid, cid, d.mfLines) : [];
    body = `<div class="flex flex-col gap-2">
      <div class="flex items-center justify-between"><p class="label-eyebrow">Produk · ${esc(c ? c.name : '—')} · ${esc(hub(hid).name)}</p>${btn({ label: 'Tambah baris', icon: 'r:RiAddLine', size: 'xs', tone: 'neutral', style: 'stroke', act: 'mfAddLine', disabled: !cid || d.mfLines.length >= opts.length })}</div>
      <div class="grid grid-cols-[minmax(0,1fr)_110px_150px_32px] gap-2 px-0.5 text-[11px] font-medium text-text-soft-400"><span>SKU</span><span>Qty</span><span>Stok available di hub</span><span></span></div>
      ${d.mfLines.map(lineRow).join('')}
      ${errOf('lines') ? `<p role="alert" class="text-xs text-(--state-error-base)">${esc(errOf('lines'))}</p>` : ''}
      ${shortages.length ? alertBox('warning', 'Stok belum cukup (tidak memblokir)', `Order tetap bisa dibuat (Open), tapi Create picking order akan gagal sampai stok tersedia: ${shortages.map((x) => `<span class="font-mono">${esc(x.sku)}</span> butuh ${fmtQty(x.requested)}, tersedia ${fmtQty(x.available)}`).join(' · ')}.`) : `<p class="${metaCls}">SKU diambil dari katalog client. Qty dicek terhadap stok available (FEFO, tipe Storage) di hub sebagai peringatan, bukan reserve.</p>`}
    </div>`;
  } else {
    const p = mfPayload();
    const shortages = stockShortages(hid, cid, p.lines);
    body = `<div class="flex flex-col gap-4">
      <div><p class="label-eyebrow">Order</p>${kvGrid([
        ['Tipe', `${tag(OO_TYPE_META[d.mfType].label, d.mfType === 'TRANSFER' ? 'stroke' : 'gray', 'xs', OO_TYPE_META[d.mfType].icon)}`],
        [transfer ? 'Hub asal' : 'Hub', esc(hub(hid).name)],
        ...(transfer ? [['Hub tujuan', destHub ? esc(destHub.name) : null]] : []),
        ['Client', c ? esc(c.name) : null],
        ['Ref client', d.mfExt.trim() ? `<span class="font-mono">${esc(d.mfExt.trim())}</span>` : '<span class="text-text-sub-600">Otomatis (request ID)</span>'],
        ['Expected delivery', d.mfDate ? fmtDate(d.mfDate) : null],
        ['Service', `<span class="font-mono">${esc(d.mfService)}</span>`],
        ['Catatan', d.mfNotes.trim() ? esc(d.mfNotes.trim()) : null],
      ])}</div>
      <div><p class="label-eyebrow">Penerima &amp; tujuan</p>${kvGrid([
        ['Penerima', `${esc(d.mfName.trim())} <span class="font-mono text-text-sub-600">· ${esc(d.mfPhone.trim())}</span>`],
        ['Alamat', esc(d.mfAddr.trim())],
        ['Koordinat', `<span class="font-mono">${esc(String(d.mfLat).trim())}, ${esc(String(d.mfLng).trim())}</span>`],
        ['Catatan tujuan', d.mfDestNotes.trim() ? esc(d.mfDestNotes.trim()) : null],
      ])}</div>
      <div><p class="label-eyebrow mb-2">Produk</p>${table({ columns: [
        { key: 'sku', title: 'SKU', render: (l) => `<span class="${codeCls}">${esc(l.sku)}</span>` },
        { key: 'name', title: 'Nama', render: (l) => `<span class="${nameCls}">${esc(skuName(cid, l.sku))}</span>` },
        { key: 'qty', title: 'Qty', align: 'right', render: (l) => `<span class="${numCls}">${fmtQty(Number(l.qty))}</span> <span class="${metaCls}">${esc(skuUom(cid, l.sku))}</span>` },
        { key: 'av', title: 'Available', align: 'right', render: (l) => { const a = availableFor(hid, cid, l.sku); return `<span class="font-mono text-[12px] tabular-nums ${Number(l.qty) > a ? 'text-(--state-warning-dark)' : 'text-text-sub-600'}">${fmtQty(a)}</span>`; } },
      ], rows: p.lines })}</div>
      ${shortages.length ? alertBox('warning', 'Stok belum cukup', `Order tetap dibuat Open; Create picking order akan gagal sampai ada goods receipt. ${shortages.map((x) => `<span class="font-mono">${esc(x.sku)}</span> butuh ${fmtQty(x.requested)}, tersedia ${fmtQty(x.available)}`).join(' · ')}`) : ''}
      <p class="${metaCls}">Create mengirim data ke server: format telepon, koordinat, tanggal, dan katalog SKU divalidasi di sana — bila ditolak, form kembali ke langkah yang punya error.</p>
    </div>`;
  }
  return formModal({
    width: 'max-w-3xl', icon: 'r:RiAddLine', title: 'Create outbound request',
    desc: 'Input manual oleh ops atas nama client. Order lahir Open tanpa reserve; stok baru di-reserve saat Create picking order.',
    body: `<div class="flex flex-col gap-5">${stepIndicator(OO_STEPS, step, { errorSteps: errSteps, gotoAct: 'mfGoto' })}${wizardErrors(errs, OO_STEPS, step)}${body}</div>`,
    footer: wizardFooter({ step, total: OO_STEPS.length, cancelAct: 'closeModal', backAct: 'mfBack', nextAct: 'mfNext', submitAct: 'submitCreateOutbound', submitLabel: 'Create outbound request' }),
  });
}

/* ───────────── Modal: Upload CSV (pick → preview → import) — selalu tipe Regular ───────────── */
function csvDefaults() {
  const d = view.draft;
  if (d.csvInit) return;
  const hubId = db.ui.hubId !== 'all' ? Number(db.ui.hubId) : 3;
  Object.assign(d, { csvInit: true, csvHub: hubId, csvClient: 12, csvText: '', csvFileName: '', csvSize: 0, csvStage: 'pick', csvPreview: null });
}
function modalUploadCsv() {
  csvDefaults();
  const d = view.draft;
  const c = client(Number(d.csvClient));
  if (d.csvStage === 'preview' && d.csvPreview) return csvPreviewModal(d, c);
  const recent = db.uploads.slice(0, 4);
  const drop = d.csvText
    ? `<div class="flex items-center justify-center gap-3 text-sm">${ic('r:RiFileTextLine', 'size-5 text-accent')}<div class="text-left"><p class="font-medium text-text-strong-950">${esc(d.csvFileName)}</p><p class="${metaCls}">${(d.csvSize / 1024).toFixed(1)} KB · ${Math.max(0, parseCsv(d.csvText).length - 1)} baris data</p></div>${btn({ label: 'Hapus', size: 'xs', tone: 'neutral', style: 'ghost', act: 'csvClear' })}</div>`
    : `<label class="block cursor-pointer text-sm text-text-sub-600">${ic('r:RiFileUploadLine', 'mx-auto mb-2 size-6 text-icon-soft-400')}<span class="block">Drag & drop CSV di sini, atau <span class="font-semibold text-accent">browse</span></span><span class="mt-1 block ${metaCls}">.csv saja · maks ${fmtQty(CSV_MAX_ROWS)} baris</span><input type="file" accept=".csv,text/csv" data-file="csv" class="hidden"/></label>`;
  return formModal({
    width: 'max-w-3xl', icon: 'r:RiUpload2Line', title: 'Upload outbound request (CSV)',
    desc: 'Satu baris = satu SKU. Baris dengan external_id yang sama digabung menjadi satu order. Import all-or-nothing untuk error. CSV membuat outbound tipe Regular.',
    body: `<div class="flex flex-col gap-5">
      <div class="grid grid-cols-2 gap-3">${field('Hub', select({ model: 'draft.csvHub', value: Number(d.csvHub), options: hubOptions(), onChange: 'csvReset' }), null, { required: true })}${field('Client', select({ model: 'draft.csvClient', value: Number(d.csvClient), options: clientOptions(), onChange: 'csvReset' }), 'Semua order di file ini milik client ini.', { required: true })}</div>
      <div>
        <div class="mb-1.5 flex items-center justify-between"><span class="text-sm font-medium text-text-strong-950">File CSV <span class="text-(--state-error-base)">*</span></span><button type="button" data-act="csvTemplate" class="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">${ic('r:RiDownload2Line', 'size-3.5')}Download template</button></div>
        <div data-dropzone="csv" class="rounded-xl border-2 border-dashed border-stroke-soft-200 bg-bg-weak-50 px-4 py-7 text-center transition-colors hover:border-stroke-strong-950">${drop}</div>
        <div class="mt-2 flex flex-wrap items-center gap-2"><span class="${metaCls}">Coba tanpa file:</span>${btn({ label: 'Contoh CSV valid', size: 'xs', tone: 'neutral', style: 'stroke', act: 'csvSample', data: { 'data-key': 'valid' } })}${btn({ label: 'Contoh CSV dengan error', size: 'xs', tone: 'neutral', style: 'stroke', act: 'csvSample', data: { 'data-key': 'error' } })}</div>
        <p class="mt-2 text-[11px] leading-relaxed text-text-sub-600">Kolom: <span class="font-mono">${CSV_COLUMNS.join(', ')}</span>. Wajib: <span class="font-mono">${CSV_REQUIRED.join(', ')}</span>. Tanggal format YYYY-MM-DD. external_id yang sudah ada dilewati (tidak dobel). Kolom tak dikenal diabaikan.</p>
      </div>
      ${recent.length ? `<div><p class="label-eyebrow mb-2">${ic('r:RiHistoryLine', 'size-3.5 inline -mt-0.5 mr-1')}Upload terakhir</p><div class="overflow-hidden rounded-xl border border-stroke-soft-200">${recent.map((u) => `<div class="flex items-center justify-between gap-3 border-b border-stroke-soft-200 px-3 py-2 last:border-b-0 text-[12px]"><div class="min-w-0"><p class="font-mono font-semibold text-text-strong-950">${esc(u.code)} <span class="font-sans font-normal text-text-sub-600">· ${esc(u.fileName)}</span></p><p class="${metaCls}">${esc(client(u.clientId).name)} · ${esc(hub(u.hubId).name)} · ${esc(u.createdBy)} · ${fmtDateTime(u.createdAt)}</p></div><span class="shrink-0 tabular-nums text-text-sub-600">${u.created} dibuat${u.skipped ? ` · ${u.skipped} dilewati` : ''}</span></div>`).join('')}</div></div>` : ''}
    </div>`,
    footer: `${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${d.csvText ? '' : `<span class="${metaCls}">Pilih file atau contoh dulu</span>`}${btn({ label: 'Preview', icon: 'r:RiEyeLine', act: 'csvPreview', disabled: !d.csvText })}`,
  });
}
function csvPreviewModal(d, c) {
  const pv = d.csvPreview;
  const s = pv.summary;
  const ORD_BADGE = { NEW: ['Baru', 'success'], EXISTS: ['Sudah ada', 'information'], ERROR: ['Error', 'error'] };
  const ordCols = [
    { key: 'ext', title: 'External ID', render: (o) => `<span class="${codeCls}">${esc(o.externalId)}</span>` },
    { key: 'rcp', title: 'Penerima', render: (o) => `<div><p class="${nameCls}">${esc(o.recipient || '—')}</p><p class="${metaCls} max-w-[220px] truncate">${esc(o.address || '')}</p></div>` },
    { key: 'rows', title: 'Baris CSV', render: (o) => `<span class="font-mono text-[11px] text-text-sub-600">${o.rows.join(', ')}</span>` },
    { key: 'lines', title: 'Lines / qty', align: 'right', render: (o) => `<span class="text-[13px] tabular-nums text-text-sub-600">${o.lineCount} / ${fmtQty(o.qty)}</span>` },
    { key: 'st', title: 'Status', render: (o) => `${badge(o.status === 'ERROR' ? `${o.errorCount} error` : ORD_BADGE[o.status][0], ORD_BADGE[o.status][1])}${o.existingCode ? `<p class="mt-0.5 font-mono text-[10px] text-text-soft-400">${esc(o.existingCode)}</p>` : ''}` },
  ];
  const errTable = pv.errors.length ? `<div class="overflow-hidden rounded-xl border border-stroke-soft-200">
      <div class="flex items-center justify-between border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-2"><p class="text-[12px] text-text-sub-600">${pv.errors.length} error memblokir import</p><button type="button" data-act="csvErrors" class="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">${ic('r:RiDownload2Line', 'size-3.5')}Download error CSV</button></div>
      <div class="max-h-[220px] overflow-auto"><table class="w-full text-left text-[12px]"><thead class="sticky top-0 bg-bg-weak-50 text-[11px] font-medium text-text-soft-400"><tr><th class="px-3 py-2">Row</th><th class="px-3 py-2">Field</th><th class="px-3 py-2">Value</th><th class="px-3 py-2">Reason</th></tr></thead><tbody>${pv.errors.map((e) => `<tr class="border-t border-stroke-soft-200"><td class="px-3 py-1.5 tabular-nums text-text-sub-600">${e.row}</td><td class="px-3 py-1.5 font-mono text-[11px]">${esc(e.field)}</td><td class="px-3 py-1.5 font-mono text-[11px] text-text-sub-600">${e.value ? esc(e.value) : '<span class="italic text-text-soft-400">kosong</span>'}</td><td class="px-3 py-1.5 text-(--state-error-dark)">${esc(e.message)}</td></tr>`).join('')}</tbody></table></div>
    </div>` : '';
  const canImport = !s.errors && s.toCreate > 0;
  return formModal({
    width: 'max-w-4xl', icon: 'r:RiUpload2Line', title: 'Preview upload CSV',
    desc: `${d.csvFileName} · ${c.name} · ${hub(Number(d.csvHub)).name} · ${s.rows} baris di-parse menjadi ${s.orders} order`,
    body: `<div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">${sumTile('Order baru', s.toCreate, 'success')}${sumTile('Sudah ada · dilewati', s.existing, 'information')}${sumTile('Error', s.errors, s.errors ? 'error' : 'neutral')}${sumTile('Peringatan stok', s.warnings, s.warnings ? 'warning' : 'neutral')}</div>
      ${pv.ignoredColumns.length ? alertBox('warning', 'Kolom tidak dikenal diabaikan', `<span class="font-mono">${pv.ignoredColumns.map(esc).join(', ')}</span>`) : ''}
      ${errTable}
      ${s.errors ? alertBox('warning', 'Import all-or-nothing', 'Perbaiki semua error di file lalu upload ulang. Tidak ada order yang dibuat selama masih ada error.') : ''}
      ${!s.errors && !s.toCreate ? alertBox('information', 'Tidak ada order baru', 'Semua external_id di file ini sudah ada — tidak ada yang dibuat ulang.') : ''}
      ${pv.warnings.length ? alertBox('information', 'Stok belum cukup (tidak memblokir)', `Order tetap dibuat Open; Create picking order akan gagal sampai stok tersedia. ${pv.warnings.map((w) => `<span class="font-mono">${esc(w.sku)}</span> total ${fmtQty(w.requested)}, tersedia ${fmtQty(w.available)}`).join(' · ')}`) : ''}
      <div class="overflow-hidden rounded-xl border border-stroke-soft-200"><div class="max-h-[260px] overflow-auto px-2 pb-2">${table({ columns: ordCols, rows: pv.orders })}</div></div>
    </div>`,
    footer: `${btn({ label: 'Ganti file', icon: 'r:RiArrowLeftLine', tone: 'neutral', style: 'stroke', act: 'csvBack' })}<span class="flex-1"></span>${btn({ label: 'Batal', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: canImport ? `Import ${s.toCreate} order` : 'Import', icon: 'r:RiCheckLine', act: 'csvCommit', disabled: !canImport })}`,
  });
}
