# Dash Electric — Logistic Knowledge Vault

Canonical home for product development knowledge: module context, combined PRD/TRDs, mockups, product presentations, and the ERD. If it's not here, it's not the spec.

## Layout

```
docs/
  brand/                # visual system: GSM + HTML slide deck guide
  modules/<module>/     # context, prd-trd, mockup, presentation — versioned per module
  modules/erd/          # canonical data model (erd.mermaid)
  template/             # start every new doc from these
```

## How this works

1. **Each product module gets one folder** under `docs/modules/` holding four doc types: `context` (how it works today), `prd-trd` (what we're building and how), `mockup` (HTML, open in a browser), and `product-presentation` (HTML slides).
2. **Docs are versioned by filename** (`auth-prd-trd-v2.md`); the highest version wins, old versions stay as history.
3. **Status lives in frontmatter** (`draft → in-review → approved → shipped`). Only humans approve.
4. **API collections** live in `dash-api-collections/` (OpenCollection format) and are the ground truth for existing endpoint contracts.
5. **Claude Code reads this vault directly** — point it at a module folder when drafting specs or implementing. `CLAUDE.md` tells agents how to navigate and what rules to follow.

## Conventions

- Files: `<slug>-<doctype>-v<N>.<ext>`, module folder is full kebab-case, slug is the short prefix (`authentication/` → `auth-`).
- Never delete template sections — mark them `N/A` with a reason.
- Schema changes always update `docs/modules/erd/erd.mermaid` in the same change.
- Every HTML artifact (mockup, presentation) follows the brand system in `docs/brand/` — GSM rules + slide deck guide.
# logistic-knowledge-vault
