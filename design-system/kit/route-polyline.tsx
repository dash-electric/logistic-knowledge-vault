"use client"

import * as React from "react"
import { useDashMap } from "./dash-map"
import type { LatLng } from "./lib/route-colors"

/**
 * RoutePolyline — draws a single batch/route path on a <DashMap>. Imperative
 * (a google.maps.Polyline), so it renders no DOM. Accepts either decoded points
 * or a Google/Mapbox-encoded polyline string (decoded via geometry.encoding).
 *
 * State styling:
 *   planned   → dashed, medium weight (not yet committed)
 *   active    → solid, full weight (dispatched / in-progress)
 *   done      → solid, thin + faded
 * `selected` raises weight + z so the focused rider's route reads on top;
 * `dimmed` drops opacity when another route is selected.
 */
export type RouteState = "planned" | "active" | "done"

export type RoutePolylineProps = {
  /** Decoded points, or an encoded polyline string. */
  path: LatLng[] | string
  color: string
  state?: RouteState
  selected?: boolean
  dimmed?: boolean
  onClick?: () => void
}

export function RoutePolyline({ path, color, state = "active", selected, dimmed, onClick }: RoutePolylineProps) {
  const { map, maps } = useDashMap()
  const lineRef = React.useRef<any>(null)
  const clickRef = React.useRef(onClick)
  clickRef.current = onClick

  React.useEffect(() => {
    if (!map || !maps) return

    const decoded: LatLng[] =
      typeof path === "string"
        ? (maps.geometry?.encoding?.decodePath(path) ?? []).map((p: any) => ({ lat: p.lat(), lng: p.lng() }))
        : path

    const baseWeight = state === "done" ? 2 : 4
    const weight = selected ? baseWeight + 2 : baseWeight
    const opacity = dimmed ? 0.25 : state === "done" ? 0.5 : 1

    const dashed = state === "planned"
    const options: any = {
      path: decoded,
      strokeColor: color,
      strokeOpacity: dashed ? 0 : opacity,
      strokeWeight: weight,
      zIndex: selected ? 1000 : state === "active" ? 100 : 10,
      map,
    }
    if (dashed) {
      options.icons = [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: opacity, strokeWeight: weight, scale: 2 },
          offset: "0",
          repeat: "12px",
        },
      ]
    }

    const line = new maps.Polyline(options)
    if (onClick) line.addListener("click", () => clickRef.current?.())
    lineRef.current = line

    return () => {
      line.setMap(null)
      lineRef.current = null
    }
  }, [map, maps, typeof path === "string" ? path : JSON.stringify(path), color, state, selected, dimmed])

  return null
}
