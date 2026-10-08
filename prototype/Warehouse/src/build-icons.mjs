// Ekstrak SVG ikon dari node_modules react-logistic-web → icons.json (inline di mockup, tanpa CDN).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const WEB = process.env.WEB || '/Users/yogiermanto/Developments/Dash/react-logistic-web';
const req = createRequire(WEB + '/package.json');

// Ikon sidebar (lucide, sama dengan Sidebar.tsx)
const LUCIDE = ['layout-dashboard','boxes','wallet','package','inbox','send','alarm-clock','truck','hand-coins','receipt-text','warehouse','calendar-clock','users','building-2','shapes','list-checks','map-pin','route','file-output','panel-left-close','log-out','chevron-down','chevron-right','gauge','archive','arrow-up-from-line','arrow-down-to-line','clipboard-list','package-check','scan-barcode','shopping-cart','file-input','layers','layout-grid','grid-3x3','barcode','package-minus','shopping-basket','forklift','factory','store','package-plus'];
// Ikon halaman (remix, sama dengan ri-* di app)
const REMIX = ['RiRefreshLine','RiAddLine','RiDownload2Line','RiUpload2Line','RiMore2Fill','RiEyeLine','RiCloseLine','RiSearchLine','RiFilter3Line','RiArrowLeftLine','RiCheckLine','RiPrinterLine','RiTruckLine','RiErrorWarningLine','RiCheckboxCircleLine','RiCloseCircleLine','RiFileList3Line','RiCodeSSlashLine','RiRestartLine','RiMapPinLine','RiUserLine','RiInformationLine','RiLinksLine','RiExternalLinkLine','RiLoopLeftLine','RiTimeLine','RiBox3Line','RiInboxArchiveLine','RiPlayLine','RiLightbulbLine','RiSparklingLine','RiDeleteBinLine','RiEditLine','RiArrowRightLine','RiArrowRightSLine','RiCheckboxMultipleLine','RiShipLine','RiSendPlaneLine','RiStackLine','RiBarcodeLine','RiCloseLargeLine','RiQuestionLine','RiFileCopyLine','RiUserAddLine','RiHandCoinLine','RiCalendarLine','RiArrowDownSLine','RiAlertLine','RiShieldCheckLine','RiFlashlightLine','RiRouteLine','RiImageLine','RiFileTextLine','RiHistoryLine','RiPhoneLine','RiFileUploadLine','RiStore2Line','RiArrowLeftRightLine','RiArrowGoBackLine','RiMailLine','RiFilePdf2Line','RiForbid2Line','RiPresentationLine','RiLoader4Line','RiArrowLeftSLine','RiMapPin2Line'];

const out = {};
for (const name of LUCIDE) {
  const file = WEB + '/node_modules/lucide-react/dist/esm/icons/' + name + '.mjs';
  const mod = await import(pathToFileURL(file).href);
  const inner = mod.__iconNode
    .map(([tag, attrs]) => '<' + tag + ' ' + Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ') + '/>')
    .join('');
  out['l:' + name] = { kind: 'lucide', inner };
}
const React = req('react');
const remix = await import(pathToFileURL(req.resolve('@remixicon/react')).href.replace(/index\.js$/, 'index.mjs'));
const collect = (el, acc) => {
  if (!el || typeof el !== 'object') return acc;
  if (Array.isArray(el)) { el.forEach((c) => collect(c, acc)); return acc; }
  if (el.type === 'path') acc.push(el.props.d);
  collect(el.props && el.props.children, acc);
  return acc;
};
for (const name of REMIX) {
  const Comp = remix[name];
  if (!Comp) { console.warn('missing remix icon', name); continue; }
  const paths = collect(Comp({}), []);
  out['r:' + name] = { kind: 'remix', inner: paths.map((d) => `<path d="${d}"/>`).join('') };
}
writeFileSync(new URL('./icons.json', import.meta.url), JSON.stringify(out));
console.log('icons:', Object.keys(out).length);
