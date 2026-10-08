// Build mockup self-contained: compile Tailwind v4 memakai token & tema react-logistic-web
// (src/index.css → design-system/styles/tokens.css), lalu inline CSS + ikon + JS ke satu HTML.
//   cd react-logistic-web && node ../logistic-knowledge-vault/prototype/Warehouse/src/build.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const WEB = process.env.WEB || '/Users/yogiermanto/Developments/Dash/react-logistic-web';
const OUT = path.join(SRC, '..', 'Logistic-Mithril_Warehouse-WMS.html');
const req = createRequire(WEB + '/package.json');
const postcss = req('postcss');
const tailwind = req('@tailwindcss/postcss');

// Urutan file app penting (scope bersama di dalam satu IIFE).
const APP_ORDER = ['util.js', 'ui.js', 'engine.js', 'seed.js', 'pages-stock.js', 'pages-sku.js', 'pages-vendor.js', 'pages-outbound.js', 'pages-outbound-intake.js', 'pages-inbound.js', 'pages-shipments.js', 'pages-print.js', 'guide.js', 'main.js'];
const present = readdirSync(path.join(SRC, 'app'));
const missing = APP_ORDER.filter((f) => !present.includes(f));
if (missing.length) throw new Error('missing app files: ' + missing.join(', '));
const stray = present.filter((f) => f.endsWith('.js') && !APP_ORDER.includes(f));
if (stray.length) console.warn('not in APP_ORDER (ignored):', stray.join(', '));
const appFiles = APP_ORDER;
const appJs = appFiles.map((f) => `/* ---- ${f} ---- */\n` + readFileSync(path.join(SRC, 'app', f), 'utf8')).join('\n');

const entry = `@import "${WEB}/src/index.css";\n@source "${SRC}/app";\n@source "${SRC}/shell.html";\n`;
const result = await postcss([tailwind({ base: SRC, optimize: { minify: true } })]).process(entry, { from: path.join(SRC, 'tw.css') });
// Google Fonts @import dari index.css dipindah ke <link> (satu-satunya resource eksternal yang diizinkan vault).
const css = result.css.replace(/@import\s+url\([^)]*fonts\.googleapis[^)]*\);?/g, '');

const icons = readFileSync(path.join(SRC, 'icons.json'), 'utf8');
let html = readFileSync(path.join(SRC, 'shell.html'), 'utf8');
html = html.replace('/*__CSS__*/', () => css).replace('/*__ICONS__*/', () => icons).replace('/*__APP__*/', () => appJs);
writeFileSync(OUT, html);
console.log('built', OUT, (html.length / 1024).toFixed(0) + ' KB', 'css', (css.length / 1024).toFixed(0) + ' KB', 'files', appFiles.join(','));
