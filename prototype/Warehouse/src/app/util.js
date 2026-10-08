// ── Util ────────────────────────────────────────────────────────────────
const ICONS = window.__ICONS__ || {};

/** SVG ikon inline. name: 'l:warehouse' (lucide) atau 'r:RiRefreshLine' (remix). */
function ic(name, cls) {
  const icon = ICONS[name];
  if (!icon) return '';
  const c = cls || 'size-4';
  if (icon.kind === 'lucide') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="${c}" aria-hidden="true">${icon.inner}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="${c}" aria-hidden="true">${icon.inner}</svg>`;
}

const MARK_PATH = 'M6.19961 0.396841C6.09256 0.615126 6.00498 0.837397 6.00498 0.890899C6.00498 0.944329 5.96177 1.05242 5.90897 1.131C5.85618 1.20966 5.76932 1.38822 5.71594 1.52777C5.66256 1.66733 5.55385 1.92831 5.47433 2.10774C5.39473 2.28717 5.23939 2.64602 5.129 2.90519C5.01869 3.16436 4.81535 3.6374 4.67715 3.95638C4.53887 4.27536 4.20568 5.05831 3.93668 5.69627C3.66761 6.33424 3.41837 6.88723 3.38272 6.92508C3.34706 6.96299 3.31794 7.03773 3.31794 7.09124C3.31794 7.14474 3.22331 7.39101 3.10762 7.63858C2.99193 7.88608 2.70987 8.52904 2.48067 9.06732C2.25154 9.6056 1.95081 10.307 1.81239 10.626C1.67397 10.945 1.50207 11.3527 1.4304 11.5322C1.3065 11.8423 0.775483 13.072 0.632125 13.3808C0.595088 13.4606 0.515929 13.6482 0.456306 13.7977L0.347807 14.0695H3.38533H6.42285L6.57129 13.7252C6.71095 13.4013 6.9644 12.8592 7.78293 11.1334C7.97204 10.7347 8.49558 9.62554 8.94628 8.6686C9.39705 7.71165 9.93656 6.56985 10.1451 6.13125C10.7699 4.81784 11.1612 3.98059 11.1612 3.95725C11.1612 3.93775 11.8122 2.56903 12.5064 1.12905C12.641 0.849939 12.7847 0.531901 12.8258 0.422215C12.8669 0.312601 12.9341 0.222852 12.975 0.222852C13.0249 0.222852 13.0543 1.72387 13.0641 4.77196C13.0722 7.274 13.0857 9.41893 13.0942 9.53855C13.1026 9.65816 13.1123 10.7265 13.1158 11.9128L13.122 14.0695H16.531C19.015 14.0695 19.9539 14.0921 19.9914 14.1526C20.0197 14.1983 19.9741 14.3696 19.8901 14.5332C19.7189 14.8665 19.1112 16.1495 18.743 16.955C18.6098 17.2461 18.354 17.7844 18.1745 18.1512C17.9949 18.5179 17.696 19.1442 17.5102 19.5429C17.3243 19.9417 17.0083 20.6104 16.8077 21.0291C16.6071 21.4478 16.2481 22.1981 16.0098 22.6965C15.7715 23.1949 15.396 23.9779 15.1754 24.4364C14.9547 24.8949 14.5841 25.6833 14.352 26.1883C14.1198 26.6933 13.8967 27.1663 13.8562 27.2395C13.7235 27.4791 13.2529 28.4559 13.1841 28.6346L13.1168 28.8093L14.4448 28.7564C15.1751 28.7274 15.9035 28.6914 16.0632 28.6765C17.0551 28.5837 17.3689 28.541 17.9878 28.4144C18.3672 28.3368 18.792 28.2566 18.9318 28.2362C19.5154 28.151 21.5201 27.4647 22.4904 27.0178C25.1091 25.8118 27.2859 23.8905 29.029 21.2466C29.2354 20.9336 29.7488 19.9785 29.9842 19.4696C30.4577 18.4461 30.6241 18.0673 30.6241 18.0128C30.6241 17.9834 30.7028 17.7611 30.7991 17.5187C31.1652 16.5967 31.7056 14.4822 31.8937 13.2358C32.0326 12.3156 32.036 10.5188 31.9003 9.74951C31.6326 8.23094 31.2204 7.10552 30.4554 5.80502C30.0822 5.17068 29.8441 4.88012 29.0268 4.06179C28.4374 3.4716 27.8287 2.93905 27.5013 2.72707C26.84 2.29869 25.6612 1.65761 25.0685 1.40395C24.2099 1.03654 22.5821 0.503845 21.6189 0.275121L20.6385 0.0423374L13.5164 0.0211687L6.39431 0L6.19961 0.396841ZM6.30571 14.6676C6.18654 14.9169 5.97041 15.398 5.82539 15.7369C5.68043 16.0758 5.53213 16.4077 5.4959 16.4742C5.45966 16.5408 5.24564 17.0139 5.02036 17.5254C4.79508 18.037 4.51854 18.6513 4.40583 18.8905C4.29312 19.1297 4.08251 19.6028 3.93785 19.9417C3.79318 20.2806 3.61278 20.6884 3.53704 20.8479C3.36754 21.2048 2.90311 22.2399 2.26839 23.6752C2.00397 24.2733 1.72539 24.8931 1.64935 25.0526C1.57332 25.2121 1.36482 25.6688 1.18602 26.0676C1.00715 26.4663 0.67599 27.2003 0.450133 27.6987C0.224203 28.1971 0.0218758 28.6457 0.000524726 28.6955C-0.03034 28.7677 1.29096 28.7861 6.46926 28.7861H12.9768V21.5003V14.2145H9.74963H6.52242L6.30571 14.6676Z';
const dashMark = (h) => `<svg viewBox="0 0 32 28.8093" style="height:${h || 20}px;width:auto" aria-label="Dash mark" role="img"><path d="${MARK_PATH}" fill="#010101"/></svg>`;

const esc = (v) =>
  String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// cx ≈ cn() (clsx + tailwind-merge versi mini): grup ukuran/spasi yang bentrok → kelas terakhir menang
const CX_GROUPS = [/^-?w-/, /^h-/, /^max-w-/, /^min-w-/, /^size-/, /^gap-/, /^justify-/, /^px-/, /^pl-/, /^pr-/, /^py-/, /^rounded(-(none|sm|md|lg|xl|2xl|full|\[[^\]]+\]))?$/];
const cx = (...xs) => {
  const toks = xs.filter(Boolean).join(' ').split(/\s+/).filter(Boolean);
  const keyOf = (t) => { const i = t.lastIndexOf(':'); const v = i >= 0 ? t.slice(0, i + 1) : ''; let b = i >= 0 ? t.slice(i + 1) : t; const imp = b[0] === '!' ? '!' : ''; b = b.replace(/^!/, ''); const g = CX_GROUPS.findIndex((re) => re.test(b)); return g < 0 ? null : v + imp + g; };
  const last = new Map();
  toks.forEach((t, i) => { const k = keyOf(t); if (k) last.set(k, i); });
  return toks.filter((t, i) => { const k = keyOf(t); return !k || last.get(k) === i; }).join(' ');
};
const attrs = (o) =>
  Object.entries(o || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(' ');

// Jam simulasi — saat seed, CLOCK dipaksa ke waktu lampau supaya data terlihat realistis.
let CLOCK = null;
const nowMs = () => (CLOCK != null ? CLOCK : Date.now());
const nowIso = () => new Date(nowMs()).toISOString();
const withClock = (ms, fn) => {
  const prev = CLOCK;
  CLOCK = ms;
  try { return fn(); } finally { CLOCK = prev; }
};
const DAY = 86400000;
const HOUR = 3600000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtIsoDay = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');
const fmtQty = (n) => (Number.isInteger(n) ? String(n) : Number(n).toFixed(2));
const yymmdd = (ms) => {
  const d = new Date(ms != null ? ms : nowMs());
  return String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate());
};
const yymm = (ms) => {
  const d = new Date(ms != null ? ms : nowMs());
  return String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1);
};
const isExpired = (dateStr) => !!dateStr && new Date(dateStr).getTime() < Date.now();
const daysUntil = (dateStr) => (dateStr ? Math.round((new Date(dateStr).getTime() - Date.now()) / DAY) : null);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const clone = (o) => JSON.parse(JSON.stringify(o));

let UID = 0;
const uid = (p) => `${p || 'id'}_${(++UID).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randAlnum = (n) => Array.from({ length: n }, () => ALNUM[Math.floor(Math.random() * ALNUM.length)]).join('');
const randHex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const slugFile = (name) => String(name || 'dokumen.pdf').toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) + '.pdf';
const dayIso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
const toNum = (v) => { const t = String(v == null ? '' : v).trim().replace(',', '.'); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : NaN; };

class AppError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details || null;
  }
}
