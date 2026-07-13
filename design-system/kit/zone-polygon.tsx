"use client"

import * as React from "react"
import { useDashMap } from "./dash-map"
import type { LatLng } from "./lib/route-colors"

/**
 * ZonePolygon — a coverage area / geofence drawn on a <DashMap> (imperative
 * google.maps.Polygon, renders no DOM). Default fill is Dash Purple at low
 * opacity so zones read as brand "areas" over the GSM grey canvas; `active`
 * deepens the fill, `conflict` flips to error red for overlaps.
 *
 * `paths` accepts a single ring (LatLng[]) or multiple rings (LatLng[][]) for
 * holes / multi-part zones.
 */
export type ZonePolygonProps = {
  paths: LatLng[] | LatLng[][]
  /** Stroke + fill base color. Defaults to Dash Purple. */
  color?: string
  active?: boolean
  /** Render as an overlap/conflict (error red, dashed). */
  conflict?: boolean
  onClick?: () => void
}

export function ZonePolygon({ paths, color = "#5E2AAC", active, conflict, onClick }: ZonePolygonProps) {
  const { map, maps } = useDashMap()
  const ref = React.useRef<any>(null)
  const clickRef = React.useRef(onClick)
  clickRef.current = onClick

  React.useEffect(() => {
    if (!map || !maps) return
    const stroke = conflict ? "#FB3748" : color
    const poly = new maps.Polygon({
      paths,
      strokeColor: stroke,
      strokeOpacity: 1,
      strokeWeight: active ? 2 : 1.5,
      fillColor: conflict ? "#FB3748" : color,
      fillOpacity: conflict ? 0.18 : active ? 0.4 : 0.1,
      zIndex: active ? 50 : conflict ? 40 : 10,
      clickable: Boolean(onClick),
      map,
    })
    if (onClick) poly.addListener("click", () => clickRef.current?.())
    ref.current = poly
    return () => {
      poly.setMap(null)
      ref.current = null
    }
  }, [map, maps, JSON.stringify(paths), color, active, conflict])

  return null
}
