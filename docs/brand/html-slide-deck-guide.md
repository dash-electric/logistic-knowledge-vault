# Dash Logistic · HTML Slide Deck Guide

**Sources:** `gsm.md` (rules) + `gsm.html` (working implementation) · June 2026
**Purpose:** Step-by-step guide for building a new presentation deck as a single self-contained HTML file in the Dash Logistic visual system. Follow this and the result will match `gsm.html`, `xdock-tech-presentation.html`, and the pitch deck without opening any of them.

---

## 1. Architecture at a Glance

A deck is **one HTML file, zero dependencies** (fonts load from Google Fonts; everything else is inline).

| Layer | Mechanism |
|---|---|
| Paging | CSS scroll-snap: `body { scroll-snap-type: y mandatory }`, each slide `height: 100vh` |
| Slide | `<section class="slide">` with three zones: header → content → footer |
| Theming | CSS custom properties in `:root` — never hardcode colors |
| Logo | One inline `<svg><symbol>` sprite, referenced via `<use href="#dash-logo">` |
| Navigation | ~60 lines of vanilla JS: arrows / space / PageUp-Down / Home / End / click-to-advance / `P` to print |
| Responsive | Desktop = snap deck · ≤720px = free-flow document · `@media print` = one slide per page |

Every slide is composed from the same building blocks (section 7). **Compose, don't invent.**

---

## 2. Document Skeleton

Start every new deck from this. It is complete and runnable — open it in a browser and you have a working two-slide deck.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deck Title · Dash</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
/* ===== 1. Tokens ===== */
:root {
  --primary: #5E2AAC;                    /* Dash Purple — the only chromatic color */
  --primary-soft: rgba(94, 42, 172, 0.08);
  --primary-medium: rgba(94, 42, 172, 0.16);
  --primary-strong: rgba(94, 42, 172, 0.28);
  --black: #171717;                      /* Ink — body text, wordmark, inverse surfaces */
  --white: #FFFFFF;
  --neutral: #5C5C5C;                    /* secondary text, labels, footers */
  --rule: rgba(23,23,23,0.10);           /* hairlines between rows/cards */
  --rule-strong: rgba(23,23,23,0.22);    /* section breaks, outer borders */
  --tint: rgba(23,23,23,0.04);           /* inline-code bg, field fills */
  --tint-strong: rgba(23,23,23,0.07);    /* hover/pressed states */
  --mono: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
}

/* ===== 2. Base ===== */
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  color: var(--black);
  background: var(--white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "ss01", "cv11", "cv02";
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}

::selection { background: var(--primary); color: var(--white); }

/* ===== 3. Slide shell ===== */
.slide {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100vh;
  width: 100vw;
  padding: clamp(24px, 3.5vh, 44px) clamp(40px, 7vw, 96px);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--neutral);
  font-weight: 600;
  flex-shrink: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}
.slide-header .left { display: flex; gap: 24px; align-items: baseline; }
.slide-header .right { color: var(--black); font-weight: 700; }

.slide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(8px, 1.6vh, 18px) 0;
  min-height: 0;
  overflow: hidden;
}

.slide-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--neutral);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding-top: 10px;
  border-top: 1px solid var(--rule);
}

/* ===== 4. Brand mark ===== */
.logo-mark {
  display: inline-block;
  width: 1em; height: 1em;
  vertical-align: -0.14em;
  color: var(--primary);
  flex-shrink: 0;
}
.logo-mark svg { display: block; width: 100%; height: 100%; }
.brand-mark {
  display: inline-flex; align-items: center; gap: 0.42em;
  font-weight: 800; letter-spacing: -0.01em; color: var(--black);
}

/* ===== 5. Typography primitives ===== */
.section-tag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--neutral);
  font-weight: 600;
  margin-bottom: 10px;
}
.section-tag .num { color: var(--primary); font-weight: 700; margin-right: 12px; }

h1, h2, h3, h4 { font-weight: 700; letter-spacing: -0.025em; line-height: 1.05; }

.huge   { font-size: clamp(56px, 11vw, 168px); font-weight: 800; letter-spacing: -0.045em; line-height: 0.95; }
.large  { font-size: clamp(28px, 3.8vw, 48px); font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; }
.medium { font-size: clamp(20px, 2.4vw, 32px); font-weight: 600; letter-spacing: -0.025em; line-height: 1.1; }
.lede   {
  font-size: clamp(13px, 1.05vw, 16px); font-weight: 400; letter-spacing: -0.005em;
  line-height: 1.4; color: var(--neutral); max-width: 64ch;
}
.lede.dark { color: var(--black); }
.label  {
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--neutral); font-weight: 600;
}
code, .mono { font-family: var(--mono); }

/* ===== 6. Nav help overlay ===== */
.nav-help {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 16px;
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--neutral); font-weight: 600;
  pointer-events: none; opacity: 0.7; z-index: 10;
  background: rgba(255,255,255,0.9);
  padding: 8px 16px; border: 1px solid var(--rule);
  backdrop-filter: blur(8px);
}
.nav-help kbd {
  display: inline-block; padding: 2px 6px;
  border: 1px solid var(--rule-strong); border-radius: 2px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 10px; font-weight: 700;
  background: var(--white); margin: 0 4px; color: var(--black);
}

/* ===== 7. Responsive ===== */
@media (max-width: 720px) {
  html { scroll-behavior: auto; }
  body { scroll-snap-type: none; overflow-y: auto; height: auto; }
  .slide {
    scroll-snap-align: none; height: auto; min-height: auto; width: 100%;
    padding: 28px 20px 32px; overflow: visible;
    border-bottom: 1px solid var(--rule);
  }
  .slide-content { justify-content: flex-start; padding: 20px 0; }
  .slide-header, .slide-footer { font-size: 9px; letter-spacing: 0.16em; }
  .slide-header .left { gap: 14px; flex-wrap: wrap; }
  .nav-help { display: none; }
}

@media print {
  body { scroll-snap-type: none; height: auto; }
  .slide { page-break-after: always; min-height: 100vh; height: 100vh; }
  .nav-help { display: none; }
}
</style>
</head>
<body>

<!-- Logo sprite: defined once, hidden, reused everywhere via <use> -->
<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">
  <symbol id="dash-logo" viewBox="0 0 44 43">
    <!-- Copy the full <path> from gsm.html line ~1405 -->
  </symbol>
</svg>

<!-- =================== 01 · COVER =================== -->
<section class="slide slide-cover">
  <header class="slide-header">
    <div class="left">
      <span class="brand-mark"><svg class="logo-mark" aria-hidden="true"><use href="#dash-logo"/></svg>DASH</span>
      <span>Deck context</span>
    </div>
    <div class="right">LOGISTIC · v1.0</div>
  </header>

  <div class="slide-content">
    <div class="cover-eyebrow">Eyebrow line · June 2026</div>
    <div class="cover-title">
      <h1>Deck<br><span class="slash">/</span> Title<br><strong>Here.</strong></h1>
    </div>
    <div class="cover-meta">
      <p>One-paragraph summary of what this deck covers and who it is for.</p>
      <div class="meta-block">
        <strong>Logistic · Dash</strong>
        v1.0 · June 2026
      </div>
    </div>
  </div>

  <footer class="slide-footer">
    <span>Confidential · Internal use</span>
    <span>01 / 02</span>
  </footer>
</section>

<!-- =================== 02 · CONTENT =================== -->
<section class="slide">
  <header class="slide-header">
    <div class="left"><span class="brand-mark"><svg class="logo-mark" aria-hidden="true"><use href="#dash-logo"/></svg>DASH</span><span>Deck context</span></div>
    <div class="right">Section name</div>
  </header>

  <div class="slide-content">
    <span class="section-tag"><span class="num">01</span>Section name</span>
    <h2 class="large">Headline in sentence case.<br>Two lines max.</h2>
    <p class="lede" style="margin-top: 12px;">Supporting lede, max 64ch, in Neutral.</p>
    <!-- slide body: one of the layout patterns from section 6 -->
  </div>

  <footer class="slide-footer">
    <span>One useful sentence — never empty</span>
    <span>02 / 02</span>
  </footer>
</section>

<div class="nav-help">
  <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
  <span><kbd>P</kbd> Print to PDF</span>
</div>

<script>
const slides = Array.from(document.querySelectorAll('.slide'));
let current = 0;

function getCurrentIndex() {
  return Math.round(window.scrollY / window.innerHeight);
}

function goToSlide(idx) {
  if (idx < 0 || idx >= slides.length) return;
  slides[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  current = idx;
}

document.addEventListener('keydown', (e) => {
  current = getCurrentIndex();
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'ArrowRight') {
    e.preventDefault(); goToSlide(current + 1);
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
    e.preventDefault(); goToSlide(current - 1);
  } else if (e.key === 'Home') {
    e.preventDefault(); goToSlide(0);
  } else if (e.key === 'End') {
    e.preventDefault(); goToSlide(slides.length - 1);
  } else if (e.key === 'p' || e.key === 'P') {
    window.print();
  }
});

const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

document.querySelectorAll('.slide').forEach((slide, idx) => {
  slide.addEventListener('click', (e) => {
    if (isMobile()) return;
    if (e.target.closest('a, button, kbd')) return;
    if (window.getSelection().toString()) return;
    goToSlide(idx + 1);
  });
});

let helpHidden = false;
function hideHelp() {
  if (helpHidden) return;
  const help = document.querySelector('.nav-help');
  if (help) {
    help.style.transition = 'opacity 0.6s';
    help.style.opacity = '0';
    setTimeout(() => help.remove(), 600);
  }
  helpHidden = true;
}
document.addEventListener('keydown', hideHelp, { once: true });
document.addEventListener('scroll', () => {
  if (window.scrollY > window.innerHeight * 0.5) hideHelp();
});
</script>
</body>
</html>
```

**Notes on the skeleton**

- The logo `<path>` is long — copy it verbatim from `gsm.html` (the `<symbol id="dash-logo">` block right after `<body>`). Never redraw or recolor it.
- Safe-area padding `clamp(24px, 3.5vh, 44px) clamp(40px, 7vw, 96px)` is the standard. `gsm.html` compresses vertical to `clamp(16px, 2.4vh, 28px)` because its slides are dense reference tables — that is the floor, never go tighter.
- Slide-specific CSS (cover styles, grids) is added per-deck in the same `<style>` block, grouped with `/* ===== Section (slide N) ===== */` comments.

---

## 3. Slide Anatomy — Three Zones, Always in Order

Every slide is a `100vh` flex column:

```
┌──────────────────────────────────────────────┐
│ HEADER   brand-mark + context | slide title  │ ← auto height, 10px caps,
│ ─────────────────────────────────────────────│   hairline rule BELOW
│                                              │
│ CONTENT  section-tag                         │ ← flex: 1, vertically
│          headline (.large / .medium)         │   centered, min-height: 0
│          lede                                │
│          [layout pattern]                    │
│                                              │
│ ─────────────────────────────────────────────│
│ FOOTER   useful sentence      |      NN / NN │ ← auto height, hairline ABOVE,
└──────────────────────────────────────────────┘   tabular page numbers
```

Conventions:

- **Header left:** brand mark + deck context (e.g. "Logistic GSM"). **Header right:** this slide's topic, in Ink at weight 700.
- **Footer left:** one useful sentence — a source, principle, or one-liner. Never empty. **Footer right:** `NN / TOTAL` with tabular numerals.
- **Content** opens with a `section-tag` (numbered eyebrow), then the headline, then optionally a `.lede`, then the slide body. The cover slide is the only one without a section tag.
- Section numbers in eyebrows start at `01` on the first content slide (cover doesn't count).

---

## 4. Design Tokens — The Only Colors That Exist

One brand color, two anchors, four greys. **Color is information, not decoration.**

| Token | Value | Use |
|---|---|---|
| `--primary` | `#5E2AAC` | Logo, eyebrow numerals, live-state dots, do-markers, `::selection`. **Never** text-block fills or backgrounds. |
| `--black` (Ink) | `#171717` | Body text, wordmark, high-emphasis numerals, terminal/inverse surfaces. |
| `--white` | `#FFFFFF` | Page background, card surface, text on inverse. |
| `--neutral` | `#5C5C5C` | Secondary text, labels, footers, captions. |
| `--rule` | `rgba(23,23,23,0.10)` | Hairlines between rows/cards/blocks. |
| `--rule-strong` | `rgba(23,23,23,0.22)` | Section breaks, outer borders. |
| `--tint` | `rgba(23,23,23,0.04)` | Inline-code background, subtle fills. |
| `--tint-strong` | `rgba(23,23,23,0.07)` | Hover/pressed states. |

Contrast is pre-verified: Ink/White 14.4:1 (AAA), Primary/White 8.6:1 (AAA), Neutral/White 6.7:1 (AA). **Never set Neutral text on Tint.** Operational colors (zone bag colors in field-app mockups) are data, not brand — they don't join this palette.

---

## 5. Typography

- **Display & text:** Plus Jakarta Sans, weights 200–800.
- **Code & evidence:** JetBrains Mono, weights 400–600.
- Body inherits `font-feature-settings: "ss01", "cv11", "cv02"`.

| Class | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| `.huge` | `clamp(56px, 11vw, 168px)` | 800 | `-0.045em` | Display headlines, single statements |
| `.large` | `clamp(28px, 3.8vw, 48px)` | 700 | `-0.035em` | Section heads |
| `.medium` | `clamp(20px, 2.4vw, 32px)` | 600 | `-0.025em` | Subheads, denser slides |
| `.lede` | `clamp(13px, 1.05vw, 16px)` | 400 | `-0.005em` | Intro paragraph under headline |
| `.label` | `11px` | 600 caps | `+0.2em` | Labels, UI chrome |
| `code` / `.mono` | inherit | — | `0` | Identifiers, literals |

Rules:

- **Tighter tracking as text gets larger; wide positive tracking only on small caps labels.**
- Numerals are always tabular where they align: `font-variant-numeric: tabular-nums` on stats, dates, IDs, page numbers.
- All sizes use `clamp()` — never fixed pixel display sizes.
- Sentence case everywhere except labels and the DASH wordmark.

---

## 6. Layout Patterns — Three Grid Recipes

Every slide body is one of these. Pick by content shape: `repeat(2, 1fr)` for comparisons, `repeat(3, 1fr)` for triads, wider counts only for end-to-end flows.

### Recipe A — Editorial split (columns divided by hairlines)

The workhorse. A strong rule on top, hairlines between rows, a vertical hairline between columns made with `nth-child` borders and asymmetric padding:

```css
.principles {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  border-top: 1px solid var(--rule-strong);   /* strong rule opens the block */
}
.principle {
  padding: 18px 32px 18px 0;
  border-bottom: 1px solid var(--rule);        /* hairline between rows */
}
.principle:nth-child(odd)  { border-right: 1px solid var(--rule); }  /* column rule */
.principle:nth-child(even) { padding-left: 32px; padding-right: 0; } /* mirror the gutter */
```

### Recipe B — Hairline cell grid (the 1px-gap trick)

For swatch/card matrices. The container's background shows through 1px gaps, drawing all interior hairlines at once:

```css
.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 1fr;
  gap: 1px;
  background: var(--rule);                /* becomes the hairlines */
  border: 1px solid var(--rule-strong);   /* outer frame */
}
.swatch { background: var(--white); }     /* cells paint over the gap color */
```

### Recipe C — Two-column spec panel (display left, rules right)

For "show the thing, then state the rules" slides — demo area on the left, a scrollable stack of `rule-item` blocks on the right:

```css
.logo-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  border-top: 1px solid var(--rule-strong);
  min-height: 0;                /* lets children scroll instead of overflowing */
}
.logo-display { padding: 24px 32px 24px 0; border-right: 1px solid var(--rule); }
.logo-rules   { padding: 24px 0 24px 32px; overflow-y: auto; min-height: 0; }
```

**Shared rules for all three:** `gap: 0` (recipes A and C) — spacing comes from padding, separation from hairlines. Everything anchors to a rule; nothing floats centered in space. No orphan paragraphs.

---

## 7. Component Library

Compose every slide from these. Markup + CSS for each, verbatim from `gsm.html`.

### 7.1 Section tag (numbered eyebrow)

```html
<span class="section-tag"><span class="num">01</span>The problem</span>
```

Already in the skeleton. The numeral is Primary — one of the few places Primary appears.

### 7.2 Brand mark (header)

```html
<span class="brand-mark"><svg class="logo-mark" aria-hidden="true"><use href="#dash-logo"/></svg>DASH</span>
```

Symbol always Primary (White on inverse surfaces), wordmark 800-weight Ink. At header sizes drop the "Logistic" sub-brand; below 16px the symbol stands alone.

### 7.3 Flow step (sequential process blocks)

```html
<div class="flow-step"><div class="num">03</div><div class="name">Hub intake</div></div>
<div class="flow-step terminal"><div class="num">08</div><div class="name">Reconciled</div></div>
```

```css
.flow-step { border: 1px solid var(--rule-strong); padding: 10px 12px; background: var(--white); }
.flow-step.terminal { background: var(--black); color: var(--white); }
.flow-step .num {
  font-size: 9px; font-variant-numeric: tabular-nums;
  letter-spacing: 0.16em; color: var(--neutral); font-weight: 600;
}
.flow-step.terminal .num { color: rgba(255,255,255,0.6); }
.flow-step .name { font-size: 12px; font-weight: 700; letter-spacing: -0.015em; margin-top: 8px; }
```

The terminal step inverts to black to mark closure. **One black surface per slide, max.**

### 7.4 Status dots (phase/state rows)

```html
<div class="status"><span class="dot live"></span>In design</div>
<div class="status"><span class="dot next"></span>Committed next</div>
<div class="status"><span class="dot future"></span>On the horizon</div>
```

```css
.status { display: flex; align-items: center; gap: 8px;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  font-weight: 600; color: var(--neutral); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.live   { background: var(--primary); }                       /* filled = live */
.dot.next   { background: var(--neutral); }                       /* grey = next */
.dot.future { background: transparent; border: 1px solid var(--neutral); }  /* outline = future */
```

### 7.5 Pull quote

```html
<div class="pull-quote">As seamless as possible.</div>
```

```css
.pull-quote {
  font-weight: 300; letter-spacing: -0.025em; line-height: 1.1;
  color: var(--black); max-width: 24ch;
}
.pull-quote::before { content: '\201C'; }   /* typographic curls, never straight quotes */
.pull-quote::after  { content: '\201D'; }
```

Weight 300, max 24ch. A strong quote gets its own slide.

### 7.6 Number fact

```html
<dl class="num-fact"><dt>Items</dt><dd>50&ndash;500+</dd></dl>
```

```css
.num-fact dt { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--neutral); font-weight: 600; }
.num-fact dd { font-size: 22px; font-weight: 700; letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums; }
```

Tabular figure + 10px caps label. En-dash (`&ndash;`) for ranges. Numbers earn their size — scale `dd` up when the number is the point.

### 7.7 Inline code

```html
<code>ScanEvent: pickup</code>
```

```css
code {
  font-family: var(--mono); font-size: 11px;
  background: var(--tint); padding: 1px 5px;
  border: 1px solid var(--rule); color: var(--black);
}
```

Always literal content (`items.create`, `Job.destination_type`) — no paraphrasing inside the box.

### 7.8 Surface card

```html
<div class="surface-card">
  <div class="card-eyebrow">Surface 02</div>
  <div class="card-title">Facility app</div>
  <div class="card-meta">Tablet · Bay-mounted</div>
</div>
```

```css
.surface-card { border: 1px solid var(--rule-strong); padding: 12px 14px;
  display: flex; flex-direction: column; }
.card-eyebrow, .card-meta { font-size: 9px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--neutral); font-weight: 600; }
.card-eyebrow { margin-bottom: 8px; }
.card-title { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; }
.card-meta { margin-top: 4px; letter-spacing: 0.16em; }
```

### 7.9 Do / Don't pair

Do-marker is a filled Primary square; don't-marker is a slashed outline:

```css
.do-marker::before, .dont-marker::before {
  content: ''; width: 14px; height: 14px;
  border: 1px solid currentColor; display: inline-block;
}
.do-marker   { color: var(--primary); }
.do-marker::before { background: var(--primary); border-color: var(--primary); }
.dont-marker { color: var(--neutral); }
.dont-marker::before {
  background: var(--white);
  background-image: linear-gradient(135deg, transparent 45%,
    var(--neutral) 45%, var(--neutral) 55%, transparent 55%);
}
```

---

## 8. Iconography

- **Stroke 1, always `currentColor`, never filled** (tiny white insets for relief are the only exception).
- Each icon sits centered in a **1px-bordered square frame** (44×44 spec; 38×38 at grid density); the glyph occupies ~24px of it. Stroke does not scale with display size.
- Build them as small inline `<svg>`s with primitive shapes:

```html
<div class="icon-frame">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor"/>
    <path d="M12 7 V12 L15 14" stroke="currentColor" fill="none"/>
  </svg>
</div>
```

```css
.icon-frame { width: 38px; height: 38px; border: 1px solid var(--black);
  display: flex; align-items: center; justify-content: center; }
.icon-frame svg { width: 19px; height: auto; }
```

- **Standard set** (copy from `gsm.html` slide 8 rather than redrawing): Van, Bike, Hub, Bag, ETA, Delivered, Exception, Scan, Manifest, Rider, Zone, Batch.
- Use sparingly: icons label types; labels do the rest. Never decorate.

---

## 9. Responsive & Print Behavior

Three modes, already wired in the skeleton:

1. **Desktop (>1024px):** full snap deck. Click anywhere advances (guarded against link/button clicks and text selection).
2. **Tablet (721–1024px):** still a deck; reduce dense grid columns per-deck, e.g.:
   ```css
   @media (max-width: 1024px) and (min-width: 721px) {
     .color-grid { grid-template-columns: repeat(3, 1fr); }
     .comp-grid  { grid-template-columns: repeat(2, 1fr); }
   }
   ```
3. **Mobile (≤720px):** stops being a deck, becomes a document. Snap off, slides auto-height with a hairline between them, and every multi-column grid collapses. When you add a new grid class, **add it to the mobile collapse list** and reset its column borders/padding:
   ```css
   @media (max-width: 720px) {
     .my-new-grid { grid-template-columns: 1fr !important; }
     .my-new-cell { border-right: none !important; padding-left: 0 !important; }
   }
   ```
   Grids that read as a system (color swatches, icons) may keep 2–3 columns instead of collapsing to 1.
4. **Print (`P` key):** snap off, `page-break-after: always` per slide → clean PDF export. Set Chrome's print dialog to landscape, no margins, background graphics on.

---

## 10. Voice & Copy on Slides

- **Sentence case** everywhere except labels and the wordmark.
- Headlines: **two sentences max**, display lines capped at 24–28ch (use `<br>` to break deliberately).
- Working verbs — *scan, sort, batch, reconcile* — not "perform reconciliation activities."
- Numbers: `50–500` with en-dash; `1st-mile` with hyphen; acronyms all-caps, no periods (POD, SLA, ETA, B2B, 4W, 2W).
- Operator's word, not engineer's: "bag" not "container," "hub" not "facility node."
- Quotes: typographic curls (“ ”), never straight. Em-dash: no spaces in headlines—like this; spaces in body — like this.
- Footers carry one useful sentence each. Treat them as the deck's running commentary.

---

## 11. Build Workflow & Checklist

### Building a new deck

1. Copy the skeleton (section 2) into a new `.html` file; paste the real logo `<path>` from `gsm.html`.
2. Write the slide list first — title + one-line intent per slide. A deck slide count of 10–14 is typical.
3. Build the cover, then a contents/TOC slide if the deck exceeds ~8 slides.
4. For each content slide: pick a layout recipe (section 6), compose from components (section 7), add slide-specific CSS under a `/* ===== Name (slide N) ===== */` comment.
5. Number everything: eyebrow `01…`, footer `NN / TOTAL`. Update totals when slides are added.
6. Add tablet column reductions and mobile collapse rules for every new grid class.
7. End with a colophon slide (version, maintainer, source, next review) for living documents.
8. Test: keyboard nav end-to-end, one pass at ≤720px width, and `P` → print preview.

### Per-slide checklist (from `gsm.md`)

- [ ] Header and footer present, hairlines in place, footer sentence written
- [ ] Numbered section tag above the headline; numeral in Primary
- [ ] Headline ≤2 sentences, sentence case, lines ≤28ch
- [ ] Everything sits on the grid / a hairline — no centered free-floats
- [ ] Primary used only as punctuation (numerals, dots, markers) — no purple washes or text blocks
- [ ] At most one black (inverse) surface, and only for a terminal/closing state
- [ ] All figures tabular; ranges use en-dash
- [ ] Icons (if any) stroke-1, framed, labeled
- [ ] New grids added to the mobile collapse rules
- [ ] No gradients, no glow, no shadows, no stock imagery

### Do / Don't (the fast version)

| Do | Don't |
|---|---|
| Keep Primary as an accent: logo, eyebrow numerals, live dots, do-markers, selection | Wash surfaces in Primary — no purple backgrounds, body text, or buttons |
| Align every block to a 1px hairline at 10% black | Float content centered in space; orphan paragraphs |
| Use tabular numerals on every figure | Mix proportional and tabular figures |
| Invert to black only for terminal states, once per slide | Use black surfaces as a styling flourish |
| Compose slides from the component library | Invent new components per slide |

---

*Maintainer: Dash Design · Derived from `gsm.md` + `gsm.html` v1.0 · Amend the GSM first, then update this guide.*
