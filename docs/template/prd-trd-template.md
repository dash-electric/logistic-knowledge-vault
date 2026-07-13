---
title: <Feature Name>
module: <module-folder-name>
doctype: prd-trd
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
product_owner:           # owns Part 1 (PRD)
engineer:                # owns Part 2 (TRD)
created: YYYY-MM-DD
links:
  context: ./<slug>-context-v1.md
  mockup: ./<slug>-mockup-v1.html
  presentation: ./<slug>-product-presentation-v1.html
---

# <Feature Name> — PRD/TRD v1

---

# Part 1 — Product Requirements (PRD)

## Problem

What problem are we solving, for whom, and how do we know it's real? Link evidence (support tickets, ops reports, data) rather than asserting.

## Context

Why now? What changed? How does this fit current priorities? (Module background belongs in the context doc — link it, don't repeat it.)

## Users & jobs

Who touches this feature and what are they trying to get done? Be specific about roles (e.g. dispatcher, driver, ops admin), not "users".

## Scope

### In scope
-

### Out of scope
-

Explicit non-goals prevent scope creep during AI-assisted drafting. Be aggressive here.

## Requirements

Numbered, testable statements. Each one should be verifiable in the post-ship review.

1.
2.

## Edge cases & failure states

What happens when things go wrong? Empty states, permission boundaries, partial failures, offline behavior.

## Success criteria

How will the post-ship review judge this? Observable outcomes, not vanity metrics.

---

# Part 2 — Technical Requirements (TRD)

## Summary

One paragraph: the technical approach in plain language. A reviewer should grasp the shape of the change before reading further.

## Architecture

Which service(s)/module(s) own this, what crosses boundaries, and through which interfaces. Note anything that violates current layering and why.

## API contracts

Endpoints, DTOs, events. Define request/response shapes precisely — these are what gets implemented against, and they must match the API collection (`dash-api-collections`). New/changed endpoints get a collection `.yml` update in the same work.

```
<method> <path>
```

## Data model

New/changed entities, migrations, indexes. Note backward compatibility for in-flight data. **Update `docs/modules/erd/erd.mermaid` in the same change.**

## Cross-module impacts

Which other modules consume or are consumed by this change? List the interfaces touched.

## Failure modes & observability

Error handling strategy, retries/idempotency where relevant, what gets logged/metered, and what alert would tell us this is broken in production.

## Security & permissions

AuthZ rules, data exposure, input validation boundaries.

## Rollout

Migration order, feature flags, backfill, rollback plan. What's the smallest safely deployable increment?

## Testing strategy

What must be covered before merge: unit boundaries, integration paths, contract tests.

## Key decisions & deferred choices

Non-obvious choices made here (and why), plus choices intentionally left to the implementing engineer/agent with the constraints they must respect.

## Open questions

Anything unresolved at handoff.

## Changelog

- YYYY-MM-DD — created
