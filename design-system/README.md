# Dash Logistic · design system

The full Dash Logistic component library (`logistic-kit`, 136 components) plus its docs gallery, flattened into **one package** — no workspaces, no build step for the library. Ported from the `dash-logistic-design-system` monorepo; themed per [../docs/brand/gsm.md](../docs/brand/gsm.md).

## Layout

```
kit/     the component library (raw .tsx + token layer in kit/styles/tokens.css)
src/     the docs gallery app (side navigation, search, dark mode, registry-driven demos)
public/  gallery assets (flags, brand, empty-state art)
```

The gallery imports the published specifier `@dash-electric/logistic-kit`; a Vite alias (and matching tsconfig `paths`) maps it onto `./kit`, so demo code reads exactly like real consumer code.

## Run the docs

```sh
npm install
npm run dev        # http://localhost:5180
```

`npm run build` produces the static gallery; `npm run typecheck` covers kit + docs.

Live map demos (DashMap, rider map, zones) need `VITE_GOOGLE_MAPS_API_KEY` in `.env.local` (gitignored). Without it they render the no-key fallback.

## Use the components

```tsx
import "@dash-electric/design-system/styles";
import { Button, DataTable, DeliveryTracker } from "@dash-electric/design-system";
```

Package exports: `.` → `kit/index.tsx`, `./styles` → the token layer, `./lib/utils`, and `./*` for per-file imports.

## Adding a component

One file in `kit/`, export it from `kit/index.tsx`, register a demo in `src/registry*.tsx` — the side navigation and search pick it up from the registry automatically.
