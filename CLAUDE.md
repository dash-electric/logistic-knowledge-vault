# Dash Electric — Logistic Knowledge Vault

This repo is the single source of truth for product development at Dash Electric Logistic. It holds product context, combined PRD/TRDs, HTML mockups, product presentations, and the canonical ERD — organized per module. If it's not in the vault, it's not the spec. If code and spec disagree, flag it — never silently follow either.

## Structure

```
docs/
  brand/                  # visual system — read before producing any HTML artifact
    gsm.md                # Graphic Standard Manual (rules summary; gsm.html is the visual reference)
    gsm.html              # GSM as a browsable deck — source of the logo SVG sprite
    html-slide-deck-guide.md   # step-by-step guide for building presentation decks
  modules/                # one folder per product module, e.g. for a module named
    <module-name>/        # "authentication" with slug "auth":
      <slug>-context-v1.md                    # domain context for the module
      <slug>-prd-trd-v1.md                    # combined product + technical requirements
      <slug>-mockup-v1.html                   # self-contained HTML mockup
      <slug>-product-presentation-v1.html     # self-contained HTML slide deck
    erd/
      erd.mermaid         # canonical entity-relationship diagram (shared, not versioned per module)
  template/               # authoring templates — always start new docs from these
```

## Document types

| Doctype | Format | Purpose |
|---|---|---|
| `context` | md | How the module works **today**: actors, flows, glossary, integrations, known constraints. Read it before drafting any PRD/TRD for the module. |
| `prd-trd` | md | One doc, two halves: PRD (problem, users, scope, requirements, success criteria) then TRD (architecture, API contracts, data model, rollout, testing). |
| `mockup` | html | Self-contained HTML/CSS mockup, openable directly in a browser. Styled per `docs/brand/gsm.md`. |
| `product-presentation` | html | Self-contained HTML slide deck for stakeholder walkthroughs. Built per `docs/brand/html-slide-deck-guide.md`. |

## Naming & versioning

- Module folders use the full kebab-case name (`authentication`); files use the module's short slug (`auth`).
- File pattern: `<slug>-<doctype>-v<N>.<ext>` — e.g. `auth-prd-trd-v2.md`.
- The highest version number is the authoritative one. Older versions stay in the folder as history with `status: superseded`.
- Bump to a new version file when materially revising a doc that is already `approved` or `shipped`. While a doc is `draft`/`in-review`, edit it in place and note changes in its `## Changelog`.
- Never delete template sections — write `N/A — <reason>` instead.

## Status lifecycle

Markdown docs carry frontmatter; HTML docs carry the same fields in a comment block at the top.

`status: draft → in-review → approved → shipped` (terminal: `superseded`). **Only humans move a doc to `approved`.** Agents may create drafts and propose edits.

## Workflows

- **New module:** create `docs/modules/<module-name>/`, copy all four templates from `docs/template/`, rename with the module slug at `v1`, fill the context doc first.
- **New feature in an existing module:** read the module's `context` doc and latest `prd-trd` first, then draft the new version (or new doc) from the template.
- **Implementing from the vault:** read the module's latest `prd-trd` *and* its `context` doc before writing code. If detail is missing, ask — do not invent requirements.
- **After shipping:** update the module's `context` doc so it reflects the new current behavior, and set the `prd-trd` status to `shipped`.

## ERD

`docs/modules/erd/erd.mermaid` is the canonical data model (mermaid `erDiagram`). Any PRD/TRD that adds or changes entities must update it in the same change. Keep entity and field names matching the actual database schema.

## Brand system

`docs/brand/` governs how every HTML artifact looks. Non-negotiables when producing mockups or presentations:

- **Read `docs/brand/gsm.md` first.** One accent color (Dash Purple `#5E2AAC`) used like punctuation — logo, eyebrow numerals, live dots, selection. Never purple backgrounds, buttons, or text blocks. Ink `#171717`, White, Neutral `#5C5C5C`, hairline rules at 10%/22% black. No gradients, glow, shadows, or stock imagery.
- **Typography:** Plus Jakarta Sans (display/text) + JetBrains Mono (code/evidence), loaded from Google Fonts — the only permitted external resource. Tabular numerals on every figure.
- **Presentations:** follow `docs/brand/html-slide-deck-guide.md` step by step — the `product-presentation` template already contains its skeleton and the official logo sprite. Compose slides from the guide's component library (§7); don't invent components. Run its per-slide checklist (§11) before marking a deck `in-review`.
- **Logo:** copy the `<symbol id="dash-logo">` sprite from `gsm.html` (already embedded in both HTML templates). Never redraw, recolor, or outline it.
- **Voice on artifacts:** sentence case everywhere except labels and the DASH wordmark; operator's vocabulary ("bag", "hub"); acronyms all-caps no periods (POD, SLA, ETA).

## API collections

API definitions live outside this repo in OpenCollection format (YAML, one file per request, with response examples):

- Root: `/Users/aldi/Desktop/dash/dash-api-collections/collections/Development/`
- Environments: `Development/environments/` (`local`, `staging`, `production`, `sandbox`) — variables follow the `baseUrl<Service>` pattern; tokens (`driverToken`, `providerTokenHost`, `providerTokenPortal`, `customerToken`, `secretKey`) are secrets and never committed with values.
- Services covered: Aggregator, Allocation, Core, Delivery, Driver, Express, Fleet, GMaps API, Logistic, Prediction, Tracking, Trip, Webhook.

Rules:
1. API contracts written in a TRD must match the collection — treat the collection's request/response examples as ground truth for existing endpoints.
2. When a TRD introduces or changes an endpoint, add/update the corresponding `.yml` request file (with at least one success and one failure example) as part of the same work.
3. Default auth is bearer token, configured at the collection level.

## Rules for agents

1. Start every new document from `docs/template/` — never from scratch.
2. Fill every section; mark genuinely inapplicable ones `N/A — <reason>`.
3. Link related docs with relative paths in frontmatter (`links:`), e.g. a `prd-trd` links to its `context` doc and mockup.
4. Keep mockups and presentations self-contained in one HTML file: inline CSS/JS, no dependencies except the Google Fonts loads specified by the brand system.
5. Cross-module impacts must be named explicitly in the TRD half — list the other modules and the interfaces touched.
6. Anything unresolved at handoff goes in `## Open questions`, not in your head.
