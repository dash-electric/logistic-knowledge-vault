---
title: <Module Name> — Context
module: <module-folder-name>
doctype: context
version: 1
status: draft            # draft | in-review | approved | shipped | superseded
owner:                   # who keeps this doc true
created: YYYY-MM-DD
links:
  prd-trd:               # path to the module's latest prd-trd, once it exists
---

# <Module Name> — Context v1

> Purpose: the shared understanding of how this module works **today**. This is the doc an agent or new teammate reads before touching anything in the module. Keep it current — update it whenever a feature ships.

## Overview

Two or three paragraphs: what this module is for, who depends on it, and where it sits in the product.

## Actors & roles

Who interacts with this module? Be specific (driver, provider host, provider portal admin, customer, internal service), and note how each authenticates/is identified.

## Current behavior & flows

The main flows as they exist today, step by step. Diagrams welcome (mermaid in fenced blocks).

## Data owned by this module

Entities this module owns (must match `docs/modules/erd/erd.mermaid`), plus data it reads from other modules.

## APIs & integrations

- Endpoints this module exposes (reference the API collection paths).
- External services / other modules it calls.

## Known constraints & gotchas

Technical debt, rate limits, legal/compliance constraints, historical decisions that still bind us — the things that surprise people.

## Glossary

| Term | Meaning |
|---|---|
|  |  |

## Open questions

Things about the current system we are not sure of. Resolve and fold into the sections above.

## Changelog

- YYYY-MM-DD — created
