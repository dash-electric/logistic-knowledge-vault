"use client"

import * as React from "react"
import { cellToBoundary, cellToLatLng } from "h3-js"
import { ZonePolygon } from "./zone-polygon"
import { MapOverlay } from "./map-overlay"
import type { LatLng } from "./lib/route-colors"

/**
 * HexZone — a delivery zone defined as a set of H3 cells, drawn on a <DashMap>.
 * Each cell's boundary becomes a ring of one polygon, filled in the zone's color
 * (use routeColor(i) so every zone reads distinct). `active` deepens the fill,
 * `conflict` flips to error red. Optional `label` floats at the zone centroid.
 *
 * H3 is the source of truth (zones are authored as cell-index sets); this just
 * renders them. For a per-cell editor (toggle individual hexes), render each
 * cell as its own HexZone/ZonePolygon and handle onClick per cell.
 */
export type HexZoneProps = {
  /** H3 cell indexes that make up the zone. */
  cells: string[]
  /** Zone color — pass routeColor(index) for distinct zones. Default Dash Purple. */
  color?: string
  active?: boolean
  conflict?: boolean
  onClick?: () => void
  label?: React.ReactNode
}

export function HexZone({ cells, color = "#5E2AAC", active, conflict, onClick, label }: HexZoneProps) {
  const key = cells.join(",")
  const rings = React.useMemo<LatLng[][]>(
    () => cells.map((c) => cellToBoundary(c).map(([lat, lng]) => ({ lat, lng }))),
    [key], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const center = React.useMemo<LatLng | null>(() => {
    if (!cells.length) return null
    let lat = 0
    let lng = 0
    for (const c of cells) {
      const [a, b] = cellToLatLng(c)
      lat += a
      lng += b
    }
    return { lat: lat / cells.length, lng: lng / cells.length }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ZonePolygon paths={rings} color={color} active={active} conflict={conflict} onClick={onClick} />
      {label && center ? (
        <MapOverlay position={center} anchor="center" zIndex={60}>
          <span className="pointer-events-none whitespace-nowrap rounded-sm bg-bg-white-0/90 px-1.5 py-0.5 text-[11px] font-medium text-text-strong-950 shadow-xs">
            {label}
          </span>
        </MapOverlay>
      ) : null}
    </>
  )
}
