---
title: Logistic Maps — Android Compose component spec & shared tokens
doctype: reference
status: draft
version: 1
owner: aldi.iskandar@dashelectric.co
links:
  react-source: ../../../../dash-logistic-design-system/packages/logistic-kit/src
related:
  - dispatch (operations)
  - rider app (kotlin-hub-mobile, Jetpack Compose)
---

# Logistic Maps — Android Compose spec

The map + dispatch + rider components are built in React in
`@dash-electric/logistic-kit` (web: operations console + any React rider
surface). The native rider/hub app is **Jetpack Compose** (`kotlin-hub-mobile`),
which cannot consume React. This doc is the parity contract: same tokens, same
anatomy, same states, so web and native render the **same** map.

**Engine:** Google Maps both sides. Web = Google Maps JS SDK behind `DashMap`.
Compose = `com.google.maps.android:maps-compose` (`GoogleMap`, `Marker`/
`MarkerComposable`, `Polyline`). The kit's component name is `DashMap`; on
Compose the wrapper is `DashMap()` too — same name, native engine.

---

## 1. Shared tokens (must match the React kit exactly)

### Route / batch colors
Single source of truth: `lib/route-colors.ts` `ROUTE_COLORS`. **Index 0 is INK** —
a single route/stop (the common case) renders black by default; chromatic color
appears only when there's more than one route to tell apart (indices 1+). Those
chromatic entries are operational data, **exempt from the GSM one-accent rule**.
Cycle by index; wrap at 14. Mirror verbatim:

| # | Hex | # | Hex |
|---|-----|---|-----|
| 0 | `#171717` (ink — default) | 7 | `#EA580C` |
| 1 | `#2563EB` | 8 | `#65A30D` |
| 2 | `#16A34A` | 9 | `#DB2777` |
| 3 | `#DC2626` | 10 | `#475569` |
| 4 | `#F59E0B` | 11 | `#A16207` |
| 5 | `#9333EA` | 12 | `#7C3AED` |
| 6 | `#0891B2` | 13 | `#0D9488` |

```kotlin
val RouteColors = listOf(
  0xFF171717, 0xFF2563EB, 0xFF16A34A, 0xFFDC2626, 0xFFF59E0B, 0xFF9333EA, 0xFF0891B2,
  0xFFEA580C, 0xFF65A30D, 0xFFDB2777, 0xFF475569, 0xFFA16207, 0xFF7C3AED, 0xFF0D9488,
).map(::Color)
fun routeColor(i: Int) = RouteColors[((i % 14) + 14) % 14]  // index 0 = ink (single-route default)
```

### Brand + surface tokens (from GSM)
| Token | Hex | Use |
|---|---|---|
| Primary / hub | `#5E2AAC` | HubMarker fill, selection, live dots |
| Ink | `#171717` | text, cluster bubble, scrim base |
| Neutral | `#5C5C5C` | secondary text |
| White | `#FFFFFF` | surfaces, marker ring/number |
| Rule | `#171717` @ 10% | hairlines |
| Error | `#FB3748` | failed stop / over-capacity |
| Warning | `#FA7319` | ≥80% capacity, "now" label |
| Success | `#1FC16B` | done stop, route progress |

### Geometry tokens
- Corner radius: **2px** everywhere (GSM sharp). `RoundedCornerShape(2.dp)`. Full circle only for markers/dots/avatars.
- Elevation: hairline ring `inset 0 0 0 1px rule` for inline; gentle lift only for floating sheets. No glow.
- Map style: the GSM grayscale style (`lib/gsm-map-style.ts`). Port the JSON to `res/raw/gsm_map_style.json` and apply via `MapProperties(mapStyleOptions = ...)`.
- Default frame: center Jakarta `-6.1754, 106.8272`, zoom 11.

---

## 2. Component anatomy (React → Compose)

| React component | Compose equivalent | Anatomy / states |
|---|---|---|
| `DashMap` | `GoogleMap(...)` wrapper `DashMap()` | GSM style, `disableDefaultUI`, greedy gestures; key-missing → fallback surface, never a blank gray box. |
| `MapOverlay` | `MarkerComposable` / `Marker` anchor | Position JSX/composable at lat/lng. Anchor: stop = center (0.5,0.5), hub = bottom (0.5,1.0). |
| `StopMarker` | `MarkerComposable` | Circle, route color, white ring + number. States: planned/active=number, done=check, failed=✕ on error red. Selected = scale 1.25 + ring. sm 24dp / md 28dp. Pickup = up-arrow ink badge top-right. |
| `HubMarker` | `MarkerComposable` | Purple teardrop + building glyph; bottom-anchored. |
| `DriverMarker` | `MarkerComposable` | Navigation arrow rotated to `heading`; ping pulse when moving. |
| `ClusterMarker` | maps-compose `Clustering` + custom item | Ink bubble with count; optional route-color ring; tap to zoom. |
| `MarkerPopover` | `MarkerInfoWindow` (custom) | Hairline card + downward tail; replaces default info window. |
| `RoutePolyline` | `Polyline(points, color, ...)` | planned=dashed (`PatternItem`), active=solid weight 4, done=thin+0.5 alpha. Selected=+2 weight, zIndex top; dimmed=0.25 alpha. Decode encoded paths with `PolyUtil.decode`. |
| `StopSequenceList` | `ReorderableLazyColumn` + expandable rows | Each row = drag handle + sequence + address + expand chevron; opening reveals its `ItemRow`s. Drag handle and expand chevron are **separate** controls. **Locked** stops (completed) show a lock glyph, no handle, can't move or be passed; global `disabled` = read-only. Reorder marks the route dirty → show "recalculate". |
| `HexZone` / `ZonePolygon` | `Polygon` per zone from H3 cells | Zones are **H3 cell sets** (`h3-android` / `cellToBoundary`). One color per zone (routeColor); `active` fill 0.4, inactive 0.1, `conflict` red. Centroid label via `MarkerComposable`. |
| `ActiveZoneChip` / `ConflictBanner` | `Surface` chip / error `Card` | Active-zone selection chip; overlap warning with resolve action. |

> Address autocomplete, barcode scanning, signature capture, proof viewing, and SLA
> timers are intentionally **project-specific** (not shared kit components). Build them
> per app; on web reuse the kit's `loadGoogleMaps` + `createSessionToken` helpers.
| `RiderMapView` | composable screen | Fit-to-bounds of stops+hub+driver; one route + stops + driver. |
| `RouteProgress` | `LinearProgressIndicator` + row | "N / M stops" + success bar + ETA chip. |
| `NextStopCard` | `Card`/`Surface` | Seq badge, address, distance+ETA chips, big Arrived + Navigate + Call (≥48dp). Navigate → `Intent` to Maps. |
| `RiderStopManifest` | `LazyColumn` in `BottomSheetScaffold` | State-aware seq badge, address, "Now" on current; done/failed dim. |
| `ProofOfDeliveryCapture` | photo grid + `OutlinedTextField` + Button | Camera intent (`ACTION_IMAGE_CAPTURE`), note, confirm gated on ≥1 photo. Signature = later. |
| Logistics chips | `Row { Icon + Text }` | ETA/distance/duration/weight/volume; tabular figures. |
| `RiderBatchCard` / `TripCard` / `StopListItem` / `ItemRow` / `CapacityMeter` / `DispatchStatsBar` | ops-console (web) | Native mirrors only if the hub app shows dispatch; rider app needs the rider set above. |

---

## 3. Interaction parity rules
- **Three-level disclosure**: a rider has **multiple batches** (trips). Rider row → expand → batch cards; each **batch** opens/closes; each **stop** opens to its items. Independent open state at every level (don't collapse all batches when one toggles). Native: nested `AnimatedVisibility`.
- **Touch targets ≥ 48dp** (Material) — markers extend hit area beyond the visual circle.
- **Tabular figures** on every metric (`FontFeature` / monospaced digits) so lists don't jitter.
- **Selection sync**: tapping a stop on the map and in the manifest highlights both (shared selected id).
- **Reduced motion**: respect the system setting — drop the driver ping + marker pulse.
- **Reorder (ops)**: Compose `ReorderableLazyColumn` (or drag handle) mirrors `StopSequenceList`; show "recalculate" once order is dirty.
- **Color is never the only signal**: pair route color with the rider name/number; pair stop state color with the check/✕ glyph.

## 4. Open questions
- Does `kotlin-hub-mobile` show the **ops dispatch** panel, or only the **rider** route+manifest? (Drives how much of §2 native needs.)
- Clustering threshold for native (web clusters at overlap; pick a zoom/px rule both share).

## Changelog
- v1 (draft): initial parity spec extracted from the React `logistic-kit` map components.
