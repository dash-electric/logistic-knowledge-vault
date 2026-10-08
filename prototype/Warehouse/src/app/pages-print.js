// ── Dokumen print (preview-before-print, pola EvidencePrintModal/LabelPreviewModal di web) ──
// Picking list (GI), Surat jalan (GI ≥ Ready to pick up), Goods receipt (GR), Purchase order (PO).
const PRINT_KINDS = { picking: 'Picking list', sj: 'Surat jalan', gr: 'Goods receipt', po: 'Purchase order' };

// QR tiruan deterministik (mockup tanpa library). Di web: paket `qrcode` yang sudah terpasang.
function fakeQr(text, size) {
  const n = 25;
  let h = 2166136261;
  const bits = [];
  for (let i = 0; i < n * n; i += 1) { h ^= (text.charCodeAt(i % text.length) + i) & 255; h = Math.imul(h, 16777619) >>> 0; bits.push(h & 1); }
  const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const ring = (x, y) => { const fx = x >= n - 7 ? x - (n - 7) : x; const fy = y >= n - 7 ? y - (n - 7) : y; return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); };
  let rects = '';
  for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) { const on = finder(x, y) ? ring(x, y) : bits[y * n + x]; if (on) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }
  return `<svg viewBox="0 0 ${n} ${n}" width="${size}" height="${size}" shape-rendering="crispEdges" fill="#171717">${rects}</svg>`;
}

const P = {
  th: 'border-b border-[#171717] px-1.5 py-1 text-left text-[9px] font-bold uppercase tracking-[0.12em]',
  td: 'border-b border-black/10 px-1.5 py-1.5 align-top text-[10.5px]',
  label: 'text-[8.5px] font-bold uppercase tracking-[0.16em] text-[#5C5C5C]',
  val: 'mt-0.5 text-[11px] font-semibold text-[#171717]',
  mono: 'font-mono',
};
const pkv = (label, value) => `<div><p class="${P.label}">${esc(label)}</p><p class="${P.val}">${value || '—'}</p></div>`;
const pBlock = (title, inner) => `<div class="rounded-md border border-black/15 p-2.5"><p class="${P.label} mb-1.5">${esc(title)}</p>${inner}</div>`;
const pTable = (cols, rows) => `<table class="w-full border-collapse"><thead><tr>${cols.map((c) => `<th class="${P.th} ${c.right ? 'text-right' : ''}" style="${c.w ? `width:${c.w}` : ''}">${esc(c.t)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${P.td} ${c.right ? 'text-right tabular-nums' : ''} ${c.mono ? P.mono : ''}">${c.r(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const pSign = (labels) => `<div class="mt-8 grid gap-6" style="grid-template-columns:repeat(${labels.length},minmax(0,1fr))">${labels.map((l) => `<div class="text-center"><p class="${P.label}">${esc(l)}</p><div class="mx-auto mt-14 w-4/5 border-b border-[#171717]"></div><p class="mt-1 text-[9px] text-[#5C5C5C]">Nama, tanda tangan, tanggal</p></div>`).join('')}</div>`;
function pHeader(title, code, meta, qrText) {
  return `<div class="flex items-start justify-between gap-6 border-b-2 border-[#171717] pb-3">
    <div class="flex items-center gap-2.5">${dashMark(26)}<div><p class="text-[15px] font-extrabold leading-none tracking-tight">Dash Electric</p><p class="mt-1 text-[7.5px] font-semibold uppercase tracking-[0.3em] text-[#5C5C5C]">Logistic · Warehouse</p></div></div>
    <div class="flex items-start gap-3 text-right"><div><p class="text-[18px] font-extrabold uppercase tracking-tight">${esc(title)}</p><p class="mt-0.5 font-mono text-[12px] font-bold">${esc(code)}</p><p class="mt-1 text-[9.5px] text-[#5C5C5C]">${meta}</p></div>${qrText ? `<div class="shrink-0">${fakeQr(qrText, 64)}</div>` : ''}</div>
  </div>`;
}
const pFooter = (doc) => `<div class="mt-6 flex items-center justify-between border-t border-black/10 pt-2 text-[8.5px] text-[#5C5C5C]"><span>${esc(doc)} · dicetak ${fmtDateTime(nowIso())} oleh ${esc(db.ui.actor)}</span><span>Halaman 1/1</span></div>`;
const hubAddr = (h) => `${esc(h.name)}<br><span class="font-normal text-[#5C5C5C]">${esc(h.address)}</span>`;

function printPickingList(g) {
  const o = outbound(g.outboundId);
  const c = client(g.clientId);
  const h = hub(g.hubId);
  const lines = [...g.lines].sort((a, b) => storage(a.storageId).path.localeCompare(storage(b.storageId).path, undefined, { numeric: true }));
  return `${pHeader('Picking list', g.code, `Dibuat ${fmtDateTime(g.createdAt)} · ${esc(h.name)}`, g.code)}
    <div class="mt-4 grid grid-cols-4 gap-3">${pkv('Outbound request', `<span class="font-mono">${esc(o.code)}</span>${o.type === 'TRANSFER' ? ` · Transfer → ${esc(hub(o.destHubId).code)}` : ''}`)}${pkv('Ref client', `<span class="font-mono">${esc(o.externalId)}</span>`)}${pkv('Client', esc(c.name))}${pkv('Expected delivery', fmtDate(o.expectedDelivery))}</div>
    <div class="mt-2 grid grid-cols-4 gap-3">${pkv('Picker', g.pickerName ? esc(g.pickerName) : '<span class="text-[#5C5C5C]">………………………</span>')}${pkv('Status', esc(GI_LABEL[g.status] || g.status))}${pkv('Total baris', String(lines.length))}${pkv('Total qty', fmtQty(sum(lines.map((l) => l.qtyReserved))))}</div>
    <p class="mt-4 text-[9.5px] text-[#5C5C5C]">Urut berdasarkan storage (location → section → bin). Ambil lot sesuai daftar (FEFO) — jangan ganti lot tanpa persetujuan admin gudang.</p>
    <div class="mt-2">${pTable([
      { t: 'No', w: '24px', r: (l) => String(lines.indexOf(l) + 1) },
      { t: 'Storage', w: '170px', r: (l) => { const st = storage(l.storageId); return `<span class="font-mono font-bold">${esc(st.code)}</span>${st.category !== 'BIN' ? ` <span class="text-[8.5px] uppercase">(${STORAGE_LEVEL_LABEL[st.category]})</span>` : ''}<br><span class="text-[9px] text-[#5C5C5C]">${esc(storageLabel(l.storageId))}</span>`; } },
      { t: 'SKU / barang', r: (l) => `<span class="font-mono font-bold">${esc(l.sku)}</span><br>${esc(l.name)}` },
      { t: 'Lot', mono: true, r: (l) => esc(l.lot) },
      { t: 'Expiry', r: (l) => (l.expiry ? fmtDate(l.expiry) + (daysUntil(l.expiry) < 0 ? ' (expired)' : '') : '—') },
      { t: 'Qty ambil', right: true, r: (l) => `<span class="font-bold">${fmtQty(l.qtyReserved)}</span> ${esc(l.uom)}` },
      { t: 'Qty diambil', right: true, w: '70px', r: (l) => (l.qtyPicked ? fmtQty(l.qtyPicked) : '<span class="inline-block h-4 w-12 border border-black/30"></span>') },
      { t: '✓', w: '22px', r: () => '<span class="inline-block size-3.5 border border-black/40"></span>' },
    ], lines)}</div>
    ${pSign(['Picker', 'Checker / admin gudang'])}${pFooter(`Picking list ${g.code}`)}`;
}

function printSuratJalan(g) {
  const o = outbound(g.outboundId);
  const c = client(g.clientId);
  const h = hub(g.hubId);
  const sh = g.shipmentId ? shipment(g.shipmentId) : null;
  const rows = o.lines.map((l) => { const k = skuOf(c.id, l.sku) || { name: l.sku, uom: 'pcs' }; return { ...l, name: k.name, uom: k.uom, koli: ['kg', 'liter'].includes(k.uom) ? 1 : Math.ceil(l.qty), weight: Math.round(l.qty * (k.weightKg || 0) * 10) / 10 }; });
  return `${pHeader('Surat jalan', g.suratJalan, `Tanggal ${fmtDate(g.readyAt || nowIso())} · ${esc(h.name)}`, g.suratJalan)}
    <div class="mt-4 grid grid-cols-2 gap-3">
      ${pBlock('Pengirim', `<p class="${P.val}">${esc(c.name)}</p><p class="text-[10px] text-[#5C5C5C]">d/a ${esc(h.name)} — ${esc(h.address)}</p>`)}
      ${pBlock(o.type === 'TRANSFER' ? `Penerima · transfer ke ${hub(o.destHubId).name}` : 'Penerima', `<p class="${P.val}">${esc(o.recipient.name)} · ${esc(o.recipient.phone)}</p><p class="text-[10px] text-[#5C5C5C]">${esc(o.destination.address)}${o.destination.notes ? `<br>Catatan: ${esc(o.destination.notes)}` : ''}</p>`)}
    </div>
    <div class="mt-3 grid grid-cols-5 gap-3">${pkv('Outbound request', `<span class="font-mono">${esc(o.code)}</span>`)}${pkv('Ref client', `<span class="font-mono">${esc(o.externalId)}</span>`)}${pkv('Picking order', `<span class="font-mono">${esc(g.code)}</span>`)}${pkv('AWB', sh ? `<span class="font-mono">${esc(sh.waybill)}</span>` : '<span class="text-[#5C5C5C] font-normal">terbit saat submit shipping</span>')}${pkv('Service', esc(o.serviceType))}</div>
    <div class="mt-4">${pTable([
      { t: 'No', w: '24px', r: (l) => String(rows.indexOf(l) + 1) },
      { t: 'SKU', w: '120px', mono: true, r: (l) => `<span class="font-bold">${esc(l.sku)}</span>` },
      { t: 'Nama barang', r: (l) => esc(l.name) },
      { t: 'Qty', right: true, r: (l) => fmtQty(l.qty) },
      { t: 'UoM', r: (l) => esc(l.uom) },
      { t: 'Koli', right: true, r: (l) => fmtQty(l.koli) },
      { t: 'Berat (kg)', right: true, r: (l) => fmtQty(l.weight) },
    ], rows)}
    <div class="flex justify-end gap-6 border-b border-[#171717] px-1.5 py-1.5 text-[10.5px] font-bold"><span>Total qty ${fmtQty(sum(rows.map((r) => r.qty)))}</span><span>Total koli ${fmtQty(sum(rows.map((r) => r.koli)))}</span><span>Total berat ${fmtQty(Math.round(sum(rows.map((r) => r.weight)) * 10) / 10)} kg</span></div></div>
    ${o.notes ? `<p class="mt-3 text-[10px]"><span class="${P.label}">Catatan order</span> ${esc(o.notes)}</p>` : ''}
    <p class="mt-3 text-[9.5px] text-[#5C5C5C]">Barang diterima dalam keadaan baik dan jumlah sesuai, kecuali dicatat di surat jalan ini.</p>
    ${pSign(['Dikeluarkan gudang', 'Kurir / rider', 'Penerima'])}${pFooter(`Surat jalan ${g.suratJalan}`)}`;
}

function printGoodsReceipt(r) {
  const x = po(r.poId);
  const c = client(x.clientId);
  const h = hub(x.hubId);
  return `${pHeader('Goods receipt', r.code, `Diterima ${fmtDateTime(r.dateArrival || r.createdAt)} · ${esc(h.name)}`, r.code)}
    <div class="mt-4 grid grid-cols-4 gap-3">${pkv('Purchase order', `<span class="font-mono">${esc(x.code)}</span> · ${esc(PO_TYPE_META[x.type].label)}`)}${pkv('Client', esc(c.name))}${pkv(poSourceOf(x).label, esc(poSourceOf(x).value))}${pkv('Surat jalan supplier', r.deliveryNote ? `<span class="font-mono">${esc(r.deliveryNote)}</span>` : '—')}</div>
    ${r.deliveryNoteDoc || r.notes ? `<div class="mt-2 grid grid-cols-2 gap-3">${pkv('Lampiran surat jalan (PDF)', r.deliveryNoteDoc ? esc(r.deliveryNoteDoc.name) : '—')}${pkv('Catatan', r.notes ? esc(r.notes) : '—')}</div>` : ''}
    <div class="mt-4">${pTable([
      { t: 'No', w: '24px', r: (l) => String(r.lines.indexOf(l) + 1) },
      { t: 'SKU / barang', r: (l) => `<span class="font-mono font-bold">${esc(l.sku)}</span><br>${esc(skuName(c.id, l.sku))}` },
      { t: 'Qty diterima', right: true, r: (l) => `<span class="font-bold">${fmtQty(l.qty)}</span> ${esc(skuUom(c.id, l.sku))}` },
      { t: 'Expiry', r: (l) => (l.expiry ? fmtDate(l.expiry) : '—') },
      { t: 'Storage tujuan', r: (l) => { const st = storage(l.storageId); const t = lineage(st).type; return `<span class="font-mono font-bold">${esc(st.code)}</span>${st.category !== 'BIN' ? ` <span class="text-[8.5px] uppercase">(${STORAGE_LEVEL_LABEL[st.category]})</span>` : ''}<br><span class="text-[9px] text-[#5C5C5C]">${esc(storageLabel(l.storageId))}${t !== 'STORAGE' ? ' · ' + STORAGE_TYPE_LABEL[t] : ''}</span>`; } },
      { t: 'Lot', mono: true, r: (l) => esc(l.lot) },
    ], r.lines)}</div>
    ${pSign(['Diterima oleh (gudang)', x.type === 'TRANSFER' ? 'Pengantar (kurir transfer)' : x.type === 'RETURN' ? 'Pengantar retur' : 'Pengantar / supplier'])}${pFooter(`Goods receipt ${r.code}`)}`;
}

function printPurchaseOrder(x) {
  const c = client(x.clientId);
  const h = hub(x.hubId);
  const src = poSourceOf(x);
  const v = x.type === 'REGULAR' ? vendor(x.vendorId) : null;
  const sh = x.type === 'TRANSFER' ? hub(x.sourceHubId) : null;
  const o = x.transferOutboundId ? outbound(x.transferOutboundId) : null;
  const srcBlock = v
    ? `<p class="${P.val}">${esc(v.name)} <span class="font-mono font-normal text-[#5C5C5C]">${esc(v.code)}</span></p><p class="text-[10px] text-[#5C5C5C]">${esc(v.address || '—')}${v.phone ? `<br>Telp ${esc(v.phone)}` : ''}${v.picName ? ` · PIC ${esc(v.picName)}` : ''}${v.npwp ? `<br>NPWP ${esc(fmtNpwp(v.npwp))}` : ''}</p>`
    : sh
      ? `<p class="${P.val}">${esc(sh.name)} <span class="font-mono font-normal text-[#5C5C5C]">${esc(sh.code)}</span></p><p class="text-[10px] text-[#5C5C5C]">${esc(sh.address)}${o ? `<br>Outbound ${esc(o.code)}` : ''}</p>`
      : `<p class="${P.val}">${esc(src.value)}</p><p class="text-[10px] text-[#5C5C5C]">Barang retur</p>`;
  return `${pHeader('Purchase order', x.code, `Dibuat ${fmtDateTime(x.createdAt)} · ${esc(PO_LABEL[x.status] || x.status)} · ${esc(PO_TYPE_META[x.type].label)}`, x.code)}
    <div class="mt-4 grid grid-cols-3 gap-3">
      ${pBlock('Client (pemilik barang)', `<p class="${P.val}">${esc(c.name)}</p>`)}
      ${pBlock(src.label, srcBlock)}
      ${pBlock('Kirim ke', `<p class="${P.val}">${hubAddr(h)}</p>`)}
    </div>
    <div class="mt-3 grid grid-cols-4 gap-3">${pkv('Tipe PO', esc(PO_TYPE_META[x.type].label))}${pkv('Estimasi tiba', fmtDateTime(x.estArrival))}${pkv('Status penerimaan', x.grStatus ? esc(IR_LABEL[x.grStatus] || x.grStatus) : '—')}${pkv('Total qty', fmtQty(sum(x.lines.map((l) => l.qty))))}</div>
    <div class="mt-4">${pTable([
      { t: 'No', w: '24px', r: (l) => String(x.lines.indexOf(l) + 1) },
      { t: 'SKU', w: '130px', mono: true, r: (l) => `<span class="font-bold">${esc(l.sku)}</span>` },
      { t: 'Nama barang', r: (l) => esc(skuName(c.id, l.sku)) },
      { t: 'Qty', right: true, r: (l) => fmtQty(l.qty) },
      { t: 'UoM', r: (l) => esc(skuUom(c.id, l.sku)) },
    ], x.lines)}</div>
    ${x.notes ? `<p class="mt-3 text-[10px]"><span class="${P.label}">Catatan</span> ${esc(x.notes)}</p>` : ''}
    <p class="mt-3 text-[9.5px] text-[#5C5C5C]">${x.type === 'REGULAR' ? 'Mohon sertakan nomor PO di surat jalan pengiriman. ' : ''}Barang diterima sesuai qty aktual saat goods receipt.</p>
    ${pSign(['Dibuat oleh', x.type === 'REGULAR' ? 'Disetujui client' : x.type === 'TRANSFER' ? 'Hub asal' : 'Pengirim retur'])}${pFooter(`Purchase order ${x.code}`)}`;
}

function printPaper(kind, id) {
  if (kind === 'picking') return printPickingList(gi(id));
  if (kind === 'sj') return printSuratJalan(gi(id));
  if (kind === 'gr') return printGoodsReceipt(db.grs.find((r) => r.id === id));
  if (kind === 'po') return printPurchaseOrder(po(id));
  return '';
}
function modalPrint(m) {
  const title = `${PRINT_KINDS[m.kind]} — preview`;
  return formModal({
    width: 'max-w-5xl', icon: 'r:RiPrinterLine', title,
    desc: 'Cek dokumen sebelum dicetak. Cetak membuka dialog print browser; di aplikasi, file dibuat sebagai PDF A4 (@react-pdf/renderer).',
    body: `<div class="-mx-5 -my-4 bg-bg-weak-50 px-5 py-5"><div id="print-area" class="mx-auto bg-white p-[36px] text-[#171717] shadow-custom-shadows-large" style="width:794px;min-height:1000px">${printPaper(m.kind, m.id)}</div></div>`,
    footer: `${btn({ label: 'Tutup', tone: 'neutral', style: 'stroke', act: 'closeModal' })}${btn({ label: 'Download PDF', icon: 'r:RiDownload2Line', tone: 'neutral', style: 'stroke', act: 'printDownload' })}${btn({ label: 'Cetak', icon: 'r:RiPrinterLine', act: 'printNow' })}`,
  });
}
