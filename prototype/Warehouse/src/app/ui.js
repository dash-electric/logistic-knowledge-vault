// ── UI primitives — class string disalin dari src/design-system (kit 2026-07) ──

/* Button (button.tsx) */
const BTN_BASE = 'inline-flex items-center justify-center font-medium transition-[background-color,color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--theme-accent-alpha-10) focus-visible:ring-offset-2 focus-visible:ring-offset-bg-white-0 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:border-transparent disabled:shadow-none select-none [&_svg]:shrink-0 whitespace-nowrap';
const BTN_SIZE = {
  xs: 'h-7 px-2.5 py-1 text-sm rounded-lg gap-0.5 [&_svg]:size-4',
  sm: 'h-8 px-2.5 py-1.5 text-sm rounded-lg gap-0.5 [&_svg]:size-4',
  md: 'h-9 px-3 py-2 text-sm rounded-lg gap-1 [&_svg]:size-5',
  'icon-xs': 'size-7 rounded-lg [&_svg]:size-4',
  'icon-sm': 'size-8 rounded-lg [&_svg]:size-4',
};
const BTN_STYLE = { filled: 'border-transparent', stroke: 'border bg-transparent', lighter: 'border-transparent', ghost: 'border-transparent bg-transparent' };
const BTN_TONE = {
  'primary:filled': 'bg-bg-strong-950 text-text-white-0 hover:bg-bg-strong-950/90 active:bg-bg-strong-950/80',
  'primary:stroke': 'bg-bg-white-0 border-accent text-accent hover:bg-(--theme-accent-alpha-10) active:bg-(--theme-accent-alpha-16)',
  'primary:lighter': 'bg-(--theme-accent-alpha-10) text-accent hover:bg-(--theme-accent-alpha-16) active:bg-(--theme-accent-alpha-24)',
  'primary:ghost': 'text-accent hover:bg-(--theme-accent-alpha-10) active:bg-(--theme-accent-alpha-16)',
  'neutral:filled': 'bg-bg-surface-800 text-text-white-0 hover:bg-bg-strong-950 active:bg-bg-strong-950/90',
  'neutral:stroke': 'bg-bg-white-0 border-stroke-soft-200 text-text-sub-600 shadow-xs hover:bg-bg-weak-50 hover:text-text-strong-950 active:bg-bg-weak-50',
  'neutral:lighter': 'bg-bg-weak-50 text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950 active:bg-bg-soft-200',
  'neutral:ghost': 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 active:bg-bg-soft-200',
  'destructive:filled': 'bg-destructive text-static-white hover:bg-(--dash-red-700) active:bg-(--dash-red-800)',
  'destructive:stroke': 'bg-bg-white-0 border-destructive text-destructive hover:bg-(--dash-red-alpha-10) active:bg-(--dash-red-alpha-16)',
  'destructive:ghost': 'text-destructive hover:bg-(--dash-red-alpha-10) active:bg-(--dash-red-alpha-16)',
};

/**
 * btn({ label, icon, tone, style, size, act, data, nav, disabled, title, cls })
 * icon mengikuti pola app: `<i class="ri-… mr-1.5 text-[14px]">` → svg 14px + mr-1.5.
 */
function btn(o) {
  const tone = o.tone || 'primary';
  const style = o.style || 'filled';
  const size = o.size || 'md';
  const iconOnly = size.startsWith('icon');
  const icon = o.icon ? ic(o.icon, iconOnly ? 'size-4' : cx('!size-[14px]', o.label ? 'mr-1.5' : '')) : '';
  const a = attrs({
    type: 'button',
    'data-act': o.act,
    'data-nav': o.nav,
    'data-menu': o.menu,
    disabled: o.disabled,
    title: o.title,
    'aria-label': iconOnly ? o.title : undefined,
    ...(o.data || {}),
  });
  return `<button ${a} class="${cx(BTN_BASE, BTN_SIZE[size], BTN_STYLE[style], BTN_TONE[tone + ':' + style], tone === 'neutral' ? 'focus-visible:ring-(--dash-slate-alpha-16)' : '', o.cls)}">${icon}${o.label ? esc(o.label) : ''}${o.after || ''}</button>`;
}

/* Badge (badge.tsx) — appearance lighter, type default|dot */
const BADGE_LIGHTER = {
  error: 'bg-(--state-error-light) text-(--state-error-dark)',
  warning: 'bg-(--state-warning-light) text-(--state-warning-dark)',
  away: 'bg-(--state-away-light) text-(--state-away-dark)',
  success: 'bg-(--state-success-light) text-(--state-success-dark)',
  information: 'bg-(--state-information-light) text-(--state-information-dark)',
  feature: 'bg-(--state-feature-light) text-(--state-feature-dark)',
  verified: 'bg-(--state-verified-light) text-(--state-verified-dark)',
  highlighted: 'bg-(--state-highlighted-light) text-(--state-highlighted-dark)',
  stable: 'bg-(--state-stable-light) text-(--state-stable-dark)',
  faded: 'bg-(--state-faded-light) text-(--state-faded-dark)',
  neutral: 'bg-bg-weak-50 text-text-strong-950',
};
const BADGE_DOT = {
  error: 'bg-(--state-error-dark)', warning: 'bg-(--state-warning-dark)', away: 'bg-(--state-away-dark)', success: 'bg-(--state-success-dark)',
  information: 'bg-(--state-information-dark)', feature: 'bg-(--state-feature-dark)', verified: 'bg-(--state-verified-dark)', highlighted: 'bg-(--state-highlighted-dark)',
  stable: 'bg-(--state-stable-dark)', faded: 'bg-(--state-faded-dark)', neutral: 'bg-text-strong-950',
};
function badge(label, status, opt) {
  const o = opt || {};
  const s = status || 'neutral';
  const dot = o.dot !== false;
  return `<span class="${cx('inline-flex items-center justify-center gap-0.5 font-medium rounded-full', dot ? 'py-0.5 pl-2 pr-2' : 'py-0.5 px-2', 'text-[11px] leading-3 tracking-[0.22px]', BADGE_LIGHTER[s], o.cls)}">${dot ? `<span aria-hidden class="${cx('size-1.5 shrink-0 rounded-full', BADGE_DOT[s])}"></span>` : ''}${esc(label)}</span>`;
}

/* Tag (tag.tsx) */
const TAG_SIZE = { xs: 'h-5 px-1.5 text-[10px] rounded-sm', sm: 'h-6 px-2 py-1 text-xs leading-4 rounded-md' };
const TAG_VARIANT = {
  stroke: 'border bg-bg-white-0 border-stroke-soft-200 text-text-sub-600',
  gray: 'border border-transparent bg-bg-weak-50 text-text-sub-600',
  primary: 'bg-bg-strong-950 text-text-white-0',
  accent: 'border border-transparent bg-(--theme-accent-alpha-10) text-accent',
};
const tag = (label, variant, size, icon) =>
  `<span class="${cx('inline-flex items-center gap-0.5 font-medium whitespace-nowrap', TAG_SIZE[size || 'xs'], TAG_VARIANT[variant || 'gray'])}">${icon ? ic(icon, 'size-3 -ml-0.5') : ''}<span>${esc(label)}</span></span>`;

/* shared.ts (warehouse tabs) */
const codeCls = 'font-mono text-[12px] font-semibold text-text-strong-950 tabular-nums';
const nameCls = 'text-[13px] text-text-strong-950 tracking-tight';
const metaCls = 'text-[11px] text-text-sub-600';
const numCls = 'font-mono text-[12px] text-text-strong-950 tabular-nums';
const dateCls = 'text-[12px] tabular-nums text-text-sub-600';
const dash = '<span class="text-text-soft-400">—</span>';

/* Card (card.tsx) */
const card = (inner, cls) => `<div data-slot="card" class="${cx('flex flex-col bg-bg-white-0 text-text-strong-950 border border-stroke-soft-200 rounded-2xl', cls)}">${inner}</div>`;
/** Kartu seksi untuk halaman detail: judul + isi. */
const section = (title, inner, opt) => {
  const o = opt || {};
  return card(
    `<div class="flex items-center justify-between gap-3 border-b border-stroke-soft-200 px-4 py-3">
       <div class="min-w-0"><h3 class="text-[15px] font-bold tracking-tight text-text-strong-950">${esc(title)}</h3>${o.desc ? `<p class="mt-0.5 ${metaCls}">${o.desc}</p>` : ''}</div>
       ${o.right || ''}
     </div>
     <div class="${o.flush ? '' : 'px-4 py-3'}">${inner}</div>`,
    o.cls,
  );
};
/** Baris label/value (gaya ShipmentDetailPanel › Details). */
const kv = (label, value, sub) =>
  `<div class="flex items-start justify-between gap-4 border-b border-stroke-soft-200 py-2.5 last:border-0">
     <span class="text-[13px] text-text-sub-600">${esc(label)}</span>
     <span class="text-right text-[13px] font-medium text-text-strong-950">${value == null || value === '' ? dash : value}${sub ? `<span class="mt-0.5 block text-[11px] font-normal text-text-sub-600">${sub}</span>` : ''}</span>
   </div>`;
const kvGrid = (pairs) =>
  `<dl class="grid grid-cols-1 gap-x-6 sm:grid-cols-2">${pairs
    .map(([l, v]) => `<div class="border-b border-stroke-soft-200 py-2.5"><dt class="label-eyebrow">${esc(l)}</dt><dd class="mt-1 text-[13px] font-medium text-text-strong-950">${v == null || v === '' ? dash : v}</dd></div>`)
    .join('')}</dl>`;

/* Tabs line (tabs.tsx) + TabsCount */
function tabsLine(items, active, act) {
  return `<div role="tablist" class="inline-flex items-center gap-1 h-auto min-h-10 w-auto flex-wrap border-0">${items
    .map((t) => {
      const on = t.key === active;
      return `<button type="button" role="tab" data-state="${on ? 'active' : 'inactive'}" data-act="${act}" data-key="${esc(t.key)}"
        class="group inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-base h-10 -mb-px border-b-2 border-transparent px-3 text-text-sub-600 hover:text-text-strong-950 data-[state=active]:border-stroke-strong-950 data-[state=active]:text-text-strong-950">${esc(t.label)}${
          t.count != null ? `<span class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums bg-bg-weak-50 text-text-sub-600 group-data-[state=active]:bg-bg-strong-950 group-data-[state=active]:text-text-white-0">${t.count}</span>` : ''
        }</button>`;
    })
    .join('')}</div>`;
}

/* Input / Select / Search (input.tsx, search-field.tsx) */
const INPUT_ROOT = 'flex items-center w-full border bg-bg-white-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2';
const INPUT_OK = 'border-stroke-soft-200 focus-within:border-stroke-strong-950';
const INPUT_BAD = 'border-(--state-error-base) focus-within:border-(--state-error-base)';
const INPUT_SIZE = { sm: 'h-8 rounded-lg pl-2 pr-1.5 py-1.5 text-xs gap-1.5', md: 'h-9 rounded-lg pl-2.5 pr-2 py-2 text-sm gap-2' };
const INPUT_EL = 'flex-1 min-w-0 bg-transparent outline-none text-text-strong-950 placeholder:text-text-soft-400 disabled:cursor-not-allowed';
function input(o) {
  return `<div class="${cx(INPUT_ROOT, o.invalid ? INPUT_BAD : INPUT_OK, INPUT_SIZE[o.size || 'md'], o.disabled ? 'bg-bg-weak-50' : '', o.cls)}">${o.icon ? `<span class="inline-flex items-center justify-center text-icon-soft-400 shrink-0">${ic(o.icon, 'size-4')}</span>` : ''}<input ${attrs({
    type: o.type || 'text', value: o.value, placeholder: o.placeholder, 'data-model': o.model, 'data-fk': o.fk || o.model, 'data-rerender': o.rerender, min: o.min, max: o.max, step: o.step, disabled: o.disabled, name: o.name, 'aria-label': o.label, 'aria-invalid': o.invalid ? 'true' : undefined, inputmode: o.inputmode, autocomplete: 'off',
  })} class="${cx(INPUT_EL, o.mono ? 'font-mono' : '', o.inputCls)}"/>${o.suffix ? `<span class="text-sm text-text-soft-400 shrink-0">${esc(o.suffix)}</span>` : ''}</div>`;
}
function select(o) {
  const opts = (o.options || [])
    .map((x) => `<option value="${esc(x.value)}" ${String(x.value) === String(o.value) ? 'selected' : ''} ${x.disabled ? 'disabled' : ''}>${esc(x.label)}</option>`)
    .join('');
  return `<div class="${cx(INPUT_ROOT, o.invalid ? INPUT_BAD : INPUT_OK, INPUT_SIZE[o.size || 'md'], 'relative pr-1', o.disabled ? 'bg-bg-weak-50' : '', o.cls)}"><select ${attrs({ 'data-model': o.model, 'data-fk': o.fk || o.model, 'data-act-change': o.onChange, disabled: o.disabled, 'aria-label': o.label, 'aria-invalid': o.invalid ? 'true' : undefined, ...(o.data || {}) })} class="${INPUT_EL} appearance-none cursor-pointer pr-6">${o.placeholder ? `<option value="">${esc(o.placeholder)}</option>` : ''}${opts}</select><span class="pointer-events-none absolute right-2 text-icon-soft-400">${ic('r:RiArrowDownSLine', 'size-4')}</span></div>`;
}
const searchField = (o) => input({ ...o, size: 'sm', icon: 'r:RiSearchLine', rerender: 'debounce' });
const textarea = (o) =>
  `<textarea ${attrs({ 'data-model': o.model, 'data-fk': o.model, placeholder: o.placeholder, rows: o.rows || 3, 'aria-label': o.label })} class="${cx('flex w-full rounded-lg border bg-bg-white-0 px-3 py-2 text-sm text-text-strong-950 placeholder:text-text-soft-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', o.invalid ? 'border-(--state-error-base)' : 'border-stroke-soft-200 focus-visible:border-stroke-strong-950', o.mono ? 'font-mono text-[12px]' : '', o.cls)}">${esc(o.value || '')}</textarea>`;
const field = (label, control, hint, opt) =>
  `<div class="${cx('flex min-w-0 flex-col gap-1.5', opt && opt.cls)}"><label class="flex items-center gap-1 text-sm font-medium text-text-strong-950">${esc(label)}${opt && opt.required ? '<span aria-hidden class="text-(--state-error-base)">*</span>' : ''}${opt && opt.optional ? '<span class="text-text-soft-400 text-xs font-normal">(optional)</span>' : ''}</label>${control}${opt && opt.error ? `<p role="alert" class="text-xs leading-relaxed text-(--state-error-base)">${esc(opt.error)}</p>` : ''}${hint ? `<p class="text-xs text-text-sub-600 leading-relaxed">${hint}</p>` : ''}</div>`;

/* Segmented choice (button-group.tsx) — dipakai untuk Tipe outbound / Tipe PO */
function segmented(o) {
  return `<div role="radiogroup" ${attrs({ 'aria-label': o.label })} class="inline-flex w-fit flex-wrap items-center gap-0.5 self-start rounded-lg border border-stroke-soft-200 bg-bg-weak-50 p-0.5">${o.options
    .map((x) => {
      const on = String(x.value) === String(o.value);
      return `<button type="button" role="radio" aria-checked="${on}" ${attrs({ 'data-act': o.act, 'data-key': x.value, disabled: x.disabled, title: x.title })} class="${cx('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:size-[14px]', on ? 'bg-bg-white-0 text-text-strong-950 shadow-xs' : 'text-text-sub-600 hover:text-text-strong-950')}">${x.icon ? ic(x.icon) : ''}${esc(x.label)}</button>`;
    })
    .join('')}</div>`;
}

/* StepIndicator (design-system/step-indicator.tsx, horizontal) — wizard WMS */
function stepIndicator(steps, current, opt) {
  const o = opt || {};
  const bad = o.errorSteps || new Set();
  return `<ol data-slot="step-indicator" class="flex flex-row flex-wrap items-center gap-2">${steps
    .map((s, i) => {
      const n = i + 1;
      const status = n < current ? 'completed' : n === current ? 'current' : 'upcoming';
      const dot = status === 'completed' ? 'bg-(--state-success-base) text-static-white' : status === 'current' ? 'bg-(--theme-accent-base) text-static-white' : 'bg-bg-white-0 text-text-sub-600 border border-stroke-soft-200';
      const lbl = status === 'current' ? 'text-text-strong-950 font-medium' : status === 'completed' ? 'text-text-sub-600' : 'text-text-soft-400';
      const marker = `<span aria-hidden class="relative inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${dot}">${status === 'completed' ? ic('r:RiCheckLine', 'size-3') : n}${bad.has(n) ? '<span class="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-bg-white-0 bg-(--state-error-base)"></span>' : ''}</span>`;
      const inner = `${marker}<span class="text-sm ${lbl}">${esc(s)}</span>`;
      const body = status === 'completed' && o.gotoAct
        ? `<button type="button" data-act="${o.gotoAct}" data-key="${n}" class="inline-flex items-center gap-2 rounded-md hover:underline underline-offset-4" title="Kembali ke langkah ini">${inner}</button>`
        : `<span class="inline-flex items-center gap-2" ${status === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`;
      return `<li data-slot="step" data-status="${status}" class="flex items-center gap-2">${body}${i < steps.length - 1 ? `<span class="text-icon-soft-400">${ic('r:RiArrowRightSLine', 'size-5')}</span>` : ''}</li>`;
    })
    .join('')}</ol>`;
}
/** WizardFooter: Batal · Kembali · Lanjut — atau aksi submit di langkah terakhir. */
function wizardFooter(o) {
  const last = o.step >= o.total;
  return `<div class="flex w-full items-center justify-between gap-2"><div>${o.cancelAct ? btn({ label: 'Batal', tone: 'neutral', style: 'ghost', act: o.cancelAct }) : ''}</div><div class="flex items-center gap-2">${o.note ? `<span class="${metaCls} mr-1">${o.note}</span>` : ''}${o.step > 1 || o.backAlways ? btn({ label: 'Kembali', icon: 'r:RiArrowLeftLine', tone: 'neutral', style: 'stroke', act: o.backAct }) : ''}${
    last ? btn({ label: o.submitLabel, icon: o.submitIcon || 'r:RiCheckLine', act: o.submitAct, disabled: o.nextDisabled }) : btn({ label: 'Lanjut', act: o.nextAct, disabled: o.nextDisabled, after: ic('r:RiArrowRightLine', '!size-[14px] ml-1.5') })
  }</div></div>`;
}
/** Ringkasan error wizard: pesan dari langkah lain diberi label langkah asalnya. */
function wizardErrors(errs, steps, current) {
  if (!errs || !errs.length) return '';
  return alertBox('error', `${errs.length} isian perlu diperbaiki`, `<ul class="mt-1 list-disc pl-4">${errs.map((e) => `<li>${e.step && e.step !== current ? `<span class="text-text-sub-600">${esc(steps[e.step - 1])} · </span>` : ''}${esc(e.message)}</li>`).join('')}</ul>`);
}
const checkbox = (o) =>
  `<input type="checkbox" ${attrs({ checked: o.checked, disabled: o.disabled, 'data-act': o.act, 'data-id': o.id, 'aria-label': o.label })} class="size-4 shrink-0 cursor-pointer rounded-[4px] accent-(--theme-accent-base) disabled:cursor-not-allowed disabled:opacity-40"/>`;
const toggle = (on, act, label) =>
  `<button type="button" data-act="${act}" data-state="${on ? 'checked' : 'unchecked'}" role="switch" aria-checked="${on}" class="inline-flex items-center gap-2 whitespace-nowrap text-[12px] text-text-sub-600">
     <span class="peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors h-4 w-7 ${on ? 'bg-accent' : 'bg-stroke-soft-200'}"><span class="pointer-events-none block size-3 rounded-full bg-bg-white-0 shadow-xs transition-transform ${on ? 'translate-x-3.5' : 'translate-x-0.5'}"></span></span>${esc(label)}
   </button>`;

/* Alert (alert.tsx, appearance stroke) */
const ALERT_ICON = { information: ['r:RiInformationLine', 'text-(--state-information-base)'], warning: ['r:RiAlertLine', 'text-(--state-warning-base)'], error: ['r:RiErrorWarningLine', 'text-(--state-error-base)'], success: ['r:RiCheckboxCircleLine', 'text-(--state-success-base)'], feature: ['r:RiSparklingLine', 'text-(--state-feature-base)'] };
const alertBox = (status, title, body, cls) =>
  `<div role="status" class="${cx('flex items-start gap-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-3.5 py-3 text-text-strong-950', cls)}"><span class="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center ${ALERT_ICON[status][1]}">${ic(ALERT_ICON[status][0], 'size-[15px]')}</span><div class="min-w-0 flex-1">${title ? `<div class="text-sm leading-5 font-medium">${title}</div>` : ''}${body ? `<div class="text-[13px] leading-5 text-text-sub-600">${body}</div>` : ''}</div></div>`;

/* TableData (table-data.tsx + table.tsx), size sm */
function table(o) {
  const cols = o.columns;
  const rows = o.rows || [];
  if (!rows.length) {
    return `<div data-slot="table-data" class="rounded-lg border border-stroke-soft-200 bg-bg-white-0"><div class="flex flex-col items-center text-center gap-3 py-10 p-12"><span class="inline-flex size-12 items-center justify-center rounded-full bg-bg-weak-50 text-icon-soft-400">${ic('r:RiSearchLine', 'size-5')}</span><p class="text-base font-medium tracking-tight text-text-strong-950">${esc(o.emptyTitle || 'No data')}</p><p class="text-sm text-text-sub-600 max-w-sm leading-relaxed">${esc(o.emptyDesc || 'Belum ada data untuk filter ini.')}</p></div></div>`;
  }
  const sel = o.selection;
  const stickyTh = 'sticky right-0 z-10 border-l border-stroke-soft-200 bg-bg-weak-50';
  const stickyTd = 'sticky right-0 z-[2] border-l border-stroke-soft-200 bg-bg-white-0 group-hover:bg-bg-weak-50';
  const align = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : '');
  const head = `${sel ? `<th class="h-9 px-3 py-2 text-left align-middle text-xs font-medium text-text-soft-400 w-px">${checkbox({ checked: sel.all, act: sel.allAct, label: 'Select all rows', disabled: sel.selectableCount === 0 })}</th>` : ''}${cols
    .map((c) => `<th class="${cx('h-9 px-3 py-2 text-left align-middle font-medium text-text-soft-400 text-[11px] whitespace-nowrap', align(c.align), c.key === 'actions' ? stickyTh : '')}" ${c.width ? `style="width:${c.width}"` : ''}>${esc(c.title)}</th>`)
    .join('')}`;
  const body = rows
    .map((r, i) => {
      const selected = sel && sel.isSelected(r);
      const clickable = o.rowNav ? `data-nav="${esc(o.rowNav(r))}"` : o.rowAct ? `data-act="${o.rowAct(r)[0]}" data-id="${esc(o.rowAct(r)[1])}"` : '';
      return `<tr ${clickable} data-state="${selected ? 'selected' : ''}" class="${cx('border-b border-stroke-soft-200 transition-colors hover:bg-bg-weak-50 data-[state=selected]:bg-bg-weak-50 group align-middle', o.rowNav || o.rowAct ? 'cursor-pointer' : '')}">${
        sel ? `<td class="px-3 py-2 align-middle" data-stop>${checkbox({ checked: selected, disabled: !sel.isSelectable(r), act: sel.rowAct, id: sel.key(r), label: 'Select row' })}</td>` : ''
      }${cols
        .map((c) => `<td class="${cx('px-3 py-2 align-middle text-xs tracking-tight text-text-strong-950 whitespace-nowrap', align(c.align), c.key === 'actions' ? stickyTd : '', c.wrap ? 'whitespace-normal' : '')}" ${c.key === 'actions' ? 'data-stop' : ''}>${c.render(r, i)}</td>`)
        .join('')}</tr>`;
    })
    .join('');
  return `<div data-slot="table-data" class="overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-white-0"><div class="relative w-full overflow-auto overflow-x-auto"><table class="w-full caption-bottom text-sm"><thead class="bg-bg-weak-50 [&_tr]:border-b [&_tr]:border-stroke-soft-200"><tr>${head}</tr></thead><tbody class="[&_tr:last-child]:border-0">${body}</tbody></table></div></div>`;
}
const tableFooter = (n) =>
  `<div class="mt-4 flex items-center justify-between"><div class="text-sm tabular-nums text-text-sub-600">Showing <span class="font-medium text-text-strong-950">${n ? 1 : 0}</span> - <span class="font-medium text-text-strong-950">${n}</span> of <span class="font-medium text-text-strong-950">${n}</span></div><div class="flex items-center gap-2"><span class="text-sm text-text-sub-600">Show:</span><span class="inline-flex h-8 items-center gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2.5 text-sm tabular-nums">20 ${ic('r:RiArrowDownSLine', 'size-4 text-icon-soft-400')}</span><span class="text-sm text-text-sub-600">/ page</span></div></div>`;

/** Kotak "⋮" aksi baris → dropdown menu (dropdown-menu.tsx). */
const rowMenu = (key) => btn({ size: 'icon-sm', tone: 'neutral', style: 'ghost', icon: 'r:RiMore2Fill', title: 'Actions', menu: key });
const MENU_SURFACE = 'z-[60] min-w-[12rem] overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-2 shadow-custom-shadows-medium mk-anim-in';
const MENU_ITEM = 'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-text-strong-950 outline-none hover:bg-bg-weak-50 [&_svg]:size-4 [&_svg]:text-icon-sub-600 disabled:pointer-events-none disabled:opacity-40';
const menuItem = (o) =>
  `<button type="button" ${attrs({ 'data-act': o.act, 'data-nav': o.nav, disabled: o.disabled, ...(o.data || {}) })} class="${cx(MENU_ITEM, o.destructive ? 'text-destructive [&_svg]:text-destructive' : '')}">${o.icon ? ic(o.icon) : ''}<span class="flex-1">${esc(o.label)}</span>${o.sim ? tag('sim', 'gray') : ''}</button>`;

/* Page header (shipments/index.tsx + warehouse/index.tsx) */
function pageHeader(o) {
  return `<div class="flex flex-col gap-3 border-b border-stroke-soft-200 pb-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
    <div class="min-w-0 flex-1">
      ${o.eyebrow ? `<p class="label-eyebrow mb-2"><span class="text-accent font-bold mr-3">${esc(o.num || '06')}</span>${esc(o.eyebrow)}</p>` : ''}
      <h1 class="text-[28px] font-extrabold tracking-tight text-text-strong-950 leading-none">${esc(o.title)}</h1>
      ${o.desc ? `<p class="mt-2 max-w-2xl text-sm text-text-sub-600 leading-relaxed">${o.desc}</p>` : ''}
    </div>
    <div class="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:shrink-0">${o.actions || ''}</div>
  </div>`;
}
/* Detail header (dispatches/detail/index.tsx) */
function detailHeader(o) {
  return `<div class="flex flex-col gap-3 border-b border-stroke-soft-200 pb-5">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" data-nav="${esc(o.backHref)}" class="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-text-sub-600 transition-colors hover:text-accent">${ic('r:RiArrowLeftLine', 'size-[14px]')}${esc(o.backLabel)}</button>
      ${o.meta ? `<span class="truncate text-[11px] text-text-soft-400">${o.meta}</span>` : ''}
    </div>
    <div class="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5"><h1 class="font-mono text-[22px] font-extrabold tracking-tight text-text-strong-950 leading-none">${esc(o.title)}</h1>${o.badges || ''}</div>
      <div class="flex flex-wrap items-center gap-2">${o.actions || ''}</div>
    </div>
  </div>`;
}

/** Stepper alur (dot + garis), dipakai di detail & panduan. states: done|current|pending|failed */
function flowSteps(steps) {
  return `<ol class="flex flex-col">${steps
    .map((s, i) => {
      const dotCls = s.state === 'done' ? 'bg-bg-strong-950 border-bg-strong-950 text-text-white-0' : s.state === 'current' ? 'border-accent text-accent bg-bg-white-0 mk-pulse' : s.state === 'failed' ? 'bg-(--state-error-base) border-(--state-error-base) text-static-white' : 'border-stroke-soft-200 text-text-soft-400 bg-bg-white-0';
      const line = i < steps.length - 1 ? `<span class="absolute left-[9px] top-5 bottom-0 w-px ${s.state === 'done' ? 'bg-bg-strong-950' : 'bg-stroke-soft-200'}"></span>` : '';
      return `<li class="relative flex gap-3 pb-3 last:pb-0">${line}<span class="relative z-[1] mt-0.5 inline-flex size-[19px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums ${dotCls}">${s.state === 'done' ? ic('r:RiCheckLine', 'size-3') : s.state === 'failed' ? ic('r:RiCloseLine', 'size-3') : i + 1}</span><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-1.5"><span class="text-[13px] font-semibold tracking-tight ${s.state === 'pending' ? 'text-text-sub-600' : 'text-text-strong-950'}">${esc(s.title)}</span>${s.badge || ''}</div>${s.desc ? `<p class="mt-0.5 text-[11px] leading-relaxed text-text-sub-600">${s.desc}</p>` : ''}${s.extra || ''}</div></li>`;
    })
    .join('')}</ol>`;
}

/** Timeline event (gaya ShipmentDetailPanel › Timeline, terbaru di atas). */
function timeline(events) {
  if (!events.length) return `<p class="${metaCls}">Belum ada aktivitas.</p>`;
  return `<ol class="flex flex-col gap-3">${events
    .map((e) => `<li class="flex gap-3"><span class="mt-1 inline-flex size-4 shrink-0 items-center justify-center text-icon-soft-400">${ic(e.icon || 'r:RiTimeLine', 'size-3.5')}</span><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-1.5">${e.badge || ''}${e.title ? `<span class="text-[13px] font-semibold tracking-tight text-text-strong-950">${esc(e.title)}</span>` : ''}${e.from ? `<span class="${metaCls}">from ${esc(e.from)}</span>` : ''}${e.tag || ''}</div>${e.by ? `<p class="${metaCls}">${esc(e.by)}</p>` : ''}${e.note ? `<p class="mt-0.5 text-[12px] leading-relaxed text-text-sub-600">${e.note}</p>` : ''}</div><span class="shrink-0 text-[11px] tabular-nums text-text-sub-600">${fmtDateTime(e.at)}</span></li>`)
    .join('')}</ol>`;
}
