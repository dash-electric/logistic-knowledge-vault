"use client"

import * as React from "react"
import { RiAddLine, RiSubtractLine, RiFocus3Line } from "@remixicon/react"
import { cn } from "./lib/utils"
import { useDashMap } from "./dash-map"

/**
 * MapControls — floating zoom + recenter cluster for <DashMap>. Render as a
 * child of <DashMap>. Self-wires to the map via context for zoom; recenter is
 * delegated to the consumer (it owns the points to fit).
 *
 * 44×44 touch targets, hairline-ringed surface (works on the light GSM canvas).
 */
export type MapControlsProps = {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  /** Called when the user taps recenter/fit — consumer re-fits to its points. */
  onRecenter?: () => void
  className?: string
}

const POS: Record<NonNullable<MapControlsProps["position"]>, string> = {
  "top-right": "top-3 right-3",
  "top-left": "top-3 left-3",
  "bottom-right": "bottom-3 right-3",
  "bottom-left": "bottom-3 left-3",
}

export function MapControls({ position = "top-right", onRecenter, className }: MapControlsProps) {
  const { map } = useDashMap()
  const zoomBy = (delta: number) => {
    if (!map) return
    map.setZoom((map.getZoom() ?? 11) + delta)
  }
  const btn =
    "flex size-11 items-center justify-center bg-bg-white-0 text-icon-strong-950 transition-colors hover:bg-bg-weak-50 active:bg-bg-soft-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-24) [&_svg]:size-5"

  return (
    <div className={cn("absolute z-10 flex flex-col gap-2", POS[position], className)}>
      <div className="flex flex-col overflow-hidden rounded-sm shadow-xs">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1)} className={cn(btn, "border-b border-stroke-soft-200")}>
          <RiAddLine />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-1)} className={btn}>
          <RiSubtractLine />
        </button>
      </div>
      {onRecenter ? (
        <button type="button" aria-label="Recenter map" onClick={onRecenter} className={cn(btn, "rounded-sm shadow-xs")}>
          <RiFocus3Line />
        </button>
      ) : null}
    </div>
  )
}
