"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useDashMap } from "./dash-map"
import type { LatLng } from "./lib/route-colors"

/**
 * MapOverlay — render arbitrary React (JSX) at a geographic position on a
 * <DashMap>. This is what lets markers, popovers, and labels be brand-styled
 * components instead of imperative SVG strings.
 *
 * Uses Google Maps OverlayView: a div is attached to the overlayMouseTarget
 * pane (so it's interactive) and repositioned on every draw. The children are
 * portaled into that div, anchored bottom-center by default (pin tip on point).
 */

export type MapOverlayProps = {
  position: LatLng
  /** Anchor of the content relative to the point. Default bottom-center (pin). */
  anchor?: "center" | "bottom"
  /** Stacking within the overlay pane. Higher = on top (e.g. selected marker). */
  zIndex?: number
  children: React.ReactNode
}

export function MapOverlay({ position, anchor = "bottom", zIndex, children }: MapOverlayProps) {
  const { map, maps } = useDashMap()
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const overlayRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!map || !maps) return
    const div = document.createElement("div")
    div.style.position = "absolute"
    div.style.willChange = "transform"

    class DashOverlay extends maps.OverlayView {
      onAdd() {
        this.getPanes().overlayMouseTarget.appendChild(div)
      }
      draw() {
        const proj = this.getProjection()
        if (!proj) return
        const p = proj.fromLatLngToDivPixel(new maps.LatLng(position.lat, position.lng))
        if (!p) return
        // bottom-center: tip sits on the point; center: middle on the point.
        div.style.left = `${p.x}px`
        div.style.top = `${p.y}px`
        div.style.transform =
          anchor === "bottom" ? "translate(-50%, -100%)" : "translate(-50%, -50%)"
      }
      onRemove() {
        if (div.parentNode) div.parentNode.removeChild(div)
      }
    }

    const overlay = new DashOverlay()
    overlay.setMap(map)
    overlayRef.current = overlay
    setContainer(div)

    return () => {
      overlay.setMap(null)
      overlayRef.current = null
      setContainer(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, maps])

  // Reposition when the point or anchor changes without recreating the overlay.
  React.useEffect(() => {
    if (overlayRef.current) overlayRef.current.draw?.()
  }, [position.lat, position.lng, anchor])

  React.useEffect(() => {
    if (container && typeof zIndex === "number") container.style.zIndex = String(zIndex)
  }, [container, zIndex])

  if (!container) return null
  return createPortal(children, container)
}
