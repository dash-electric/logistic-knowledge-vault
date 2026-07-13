# Dash Logistic · Graphic Standard Manual (Summary)

**Source:** `gsm.html` · v1.0 · May 2026 · Internal living document
**Purpose:** Visual system rules extracted from the Logistic pitch deck. Use this as the checklist when shipping any new slide, screen, or doc.

---

## 1. Design Principles — Four Rules

| # | Rule | What it means | Not this |
|---|---|---|---|
| 01 | **Editorial restraint** | Newspaper page, not dashboard. Hairline rules separate ideas; whitespace carries weight. | Glossy, gradients, glow. |
| 02 | **Evidence over decoration** | Numbers earn their size. Quotes get their own slide. Process gets a diagram. | Stock photos, generic illustrations. |
| 03 | **One accent, used like punctuation** | Ink, white, four greys, one Primary purple. Accent shows only at brand moments. | Brand-color washes, tint accents, purple text blocks. |
| 04 | **Grid-anchored** | Every element on a column. Header/footer consistent across every slide. | Centered free-floats, composition gymnastics. |

---

## 2. Logo & Wordmark

- **Symbol:** stylized D, always in Primary `#5E2AAC` (or White on Ink).
- **Wordmark:** Plus Jakarta Sans, weight `800`, tracking `-0.025em`, in Ink.
- **Lockup:** symbol left of wordmark at `0.92×` cap-height; gap `0.32em`.
- **Sub-brand:** "Logistic" after `DASH`, separated by a 1px rule; `0.32em` size, weight `600`, tracking `0.18em`, all caps, in Neutral.
- **Clear space:** half cap-height of `D` on every side; header reserves `16px` below.
- **Minimums:** symbol/wordmark `10px / 800` in headers. Drop sub-brand below `16px`. Below that, symbol stands alone.
- **Don't:** recolor symbol, outline it, or separate symbol from wordmark in the same composition.

---

## 3. Color System

One brand color, two anchors, four greys. Color is information, not decoration.

| Token | Hex | RGB | Use |
|---|---|---|---|
| **Primary · Dash Purple** | `#5E2AAC` | rgb(94,42,172) | Logo, eyebrow numerals, live-state dots, selection. |
| **Ink · Black** | `#171717` | rgb(23,23,23) | Body text, wordmark, high-emphasis numerals, terminal backgrounds. |
| **White** | `#FFFFFF` | rgb(255,255,255) | Page background, card surface, text on inverse. |
| **Neutral** | `#5C5C5C` | rgb(92,92,92) | Secondary text, labels, footers, captions. |
| Rule | `rgba(23,23,23,0.10)` | 10% black | Hairlines between rows/cards/blocks. |
| Rule strong | `rgba(23,23,23,0.22)` | 22% black | Section breaks, outer borders. |
| Tint | `rgba(23,23,23,0.04)` | 4% black | Inline code background, subtle field fills. |
| Tint strong | `rgba(23,23,23,0.07)` | 7% black | Hover/pressed states, faint zone marks. |

**Rules**
- Contrast: Ink/White 14.4:1 (AAA); Primary/White 8.6:1 (AAA); Neutral/White 6.7:1 (AA). Never set Neutral on Tint.
- Primary is the *only* chromatic color. Field-app zone colors are **operational data**, not brand.
- Primary lives on: logo, eyebrow numerals, live dots, do-markers, selection. **Never** as fill on text blocks or large backgrounds.

---

## 4. Typography

- **Display & text:** Plus Jakarta Sans (weights 200–800).
- **Code & evidence:** JetBrains Mono (weights 400–600).
- **Fallback:** `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`.

**Scale**

| Class | Weight | Letter-spacing | Notes |
|---|---|---|---|
| `.huge` | 800 | `-0.045em` | Display headlines |
| `.large` | 700 | `-0.035em` | Section heads |
| `.medium` | 600 | `-0.025em` | Subheads |
| `.lede` | 400 | `-0.005em` | Intro paragraph |
| `.body` | 400 | normal | Body copy |
| `.label` | 600 caps | `+0.18 to 0.22em` | Labels, UI chrome |
| `.mono` | — | `0` | Code, identifiers |

**Rules**
- Tighter spacing as text gets larger.
- Display leans on weights `200` and `800`. Body sits at `400`. Labels/buttons at `600 / 700`.
- Numerals always tabular: `font-variant-numeric: tabular-nums` on stats, dates, IDs, page numbers.
- OpenType: body inherits `font-feature-settings: "ss01", "cv11", "cv02"`.

---

## 5. Grid & Layout

- **Canvas:** 16:9, `100vw × 100vh`. Scroll-snap forces one slide per viewport.
- **Safe area:** `padding: clamp(24px, 3.5vh, 44px) clamp(40px, 7vw, 96px);` — never edit raw pixels.
- **Three zones (always in order):**
  - Header (auto height) — 10px caps, hairline rule beneath.
  - Content (`flex: 1`, vertically centered).
  - Footer (auto height) — 10px caps, hairline rule above.
- **Common grids:** `repeat(2, 1fr)` for comparisons, `repeat(3, 1fr)` for triads, `repeat(8, 1fr)` only for end-to-end flow.

---

## 6. Iconography

- **Stroke:** always `1`, always `currentColor`. Never filled (except tiny white insets for relief).
- **Frame:** inside a `44×44` 1px square. Icon centered, never breathes outside the frame.
- **Sizing:** glyph occupies ~24px of the 44px frame. Stroke does not scale with display size.
- **Use sparingly:** icons label types (van, bike, hub). Labels do the rest. Never decorate.

**Standard icon set:** Van, Bike, Hub, Bag, ETA, Delivered, Exception, Scan, Manifest, Rider, Zone, Batch.

---

## 7. Components (12 building blocks)

Compose every slide from these — don't invent new ones.

1. **Section tag** — numbered eyebrow (`01 · The problem`) above each headline.
2. **Brand mark** — symbol + 800-weight DASH wordmark, in the header.
3. **Header / footer rule** — 10px caps, 0.18–0.20em tracking, hairlines above & below.
4. **Flow step** — sequential block in the 8-step flow; terminal step inverts to black.
5. **Status dots** — filled (live), grey (next), outlined (future).
6. **Pull quote** — 300-weight, max 24ch, light serif curls.
7. **Number fact** — tabular figure + 10px caps label; en-dash for ranges.
8. **Inline code** — mono on Tint with a Rule border. Literal only.
9. **Surface card** — bordered card (1px Rule Strong) for surfaces/products/platform tiles.

---

## 8. Voice & Copy

**Sentence-level**
- **Case:** sentence case for everything except labels and the wordmark.
- **Length:** two-sentence max for headlines; cap display lines at 24–28ch.
- **Verbs:** working verbs — *scan, sort, batch, reconcile*. Not "perform reconciliation activities."
- **Numbers:** earn their size. `50–500` uses en-dash. `1st-mile` uses hyphen.
- **Acronyms:** all-caps, no periods — POD, SLA, ETA, B2B, 4W, 2W.
- **Jargon:** operator's word, not engineer's — "bag" not "container," "hub" not "facility node."

**Document-level**
- **Eyebrow:** every section opens with a numbered tag (`01 · The problem`), tracking `0.22em`, weight 600.
- **Labels:** UI labels UPPERCASE, tracking `0.18–0.22em`.
- **Footers:** one useful sentence (source/principle/one-liner) plus page count. Never empty.
- **Quotes:** typographic curls (" "), never straight. Single quotes inside doubles.
- **Em-dash:** no spaces in headlines—like this. Spaces in body — like this.
- **Code voice:** inline code is always literal (`items.create`, `Job.destination_type`).

---

## 9. Do / Don't

| Do | Don't |
|---|---|
| Keep Primary as an accent (logo, eyebrow nums, live dots, do-marker, selection). | Wash surfaces in Primary — no purple backgrounds, body text, or buttons. |
| Align everything to the rule — every block on a 1px hairline at 10% black. | Float content centered in space. No orphan paragraphs. |
| Use tabular numerals on every figure. | Mix proportional and tabular figures. |
| Invert backgrounds for terminal states — one black surface per slide max. | Use black surfaces as a styling flourish. |

---

## 10. Maintenance

- **Source artifact:** `presentation-20260429/finalized.html` (Logistic pitch deck) — deck is the source, this doc is the index.
- **Maintainer:** Dash Design · aldiiskandar2210@gmail.com
- **Version:** v1.0 · 4 May 2026
- **Next review:** Q3 2026, after Phase 2 (multi-stop milk-run) ships.
- **How to amend:** edit the deck first, then re-extract.
