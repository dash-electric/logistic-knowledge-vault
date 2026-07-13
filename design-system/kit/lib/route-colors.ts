/**
 * Route / batch color tokens — the categorical palette for per-rider routes on
 * the GSM map canvas. Single source of truth shared by StopMarker, RoutePolyline,
 * MapLegend, and the dispatch panel chips, so a batch's color matches everywhere.
 *
 * GSM-first: index 0 is INK. A single route/stop (the common case) is therefore
 * black by default — color only appears once there's more than one route to tell
 * apart, where indices 1+ supply the distinct operational hues (ported from
 * react-logistic-web BATCH_COLORS). These chromatic entries are OPERATIONAL data,
 * exempt from the one-accent rule. Mirror this order in the Android Compose token
 * table so web and native render identical batch colors.
 *
 * 14 entries (ink + 13 hues): covers a typical hub-day plan before wrapping;
 * beyond that the index cycles (dispatchers read batches in per-rider groups).
 */
export const ROUTE_COLORS = [
  "#171717", // ink — default / single route
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#f59e0b", // amber
  "#9333ea", // purple
  "#0891b2", // cyan
  "#ea580c", // orange
  "#65a30d", // lime
  "#db2777", // pink
  "#475569", // slate
  "#a16207", // brown
  "#7c3aed", // violet
  "#0d9488", // teal
] as const

/** Stable, wrap-safe color for a batch/route index. */
export function routeColor(index: number): string {
  const n = ROUTE_COLORS.length
  return ROUTE_COLORS[((index % n) + n) % n]
}

/**
 * Defensive coordinate guard. Drizzle numerics can serialize as strings, and
 * (0, 0) is the canonical "missing coordinate" sentinel we never render.
 */
export function isValidCoord(lat: unknown, lng: unknown): boolean {
  const nLat = typeof lat === "number" ? lat : Number(lat)
  const nLng = typeof lng === "number" ? lng : Number(lng)
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180 &&
    !(nLat === 0 && nLng === 0)
  )
}

export type LatLng = { lat: number; lng: number }
