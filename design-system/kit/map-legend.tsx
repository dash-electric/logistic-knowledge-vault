"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * MapLegend — color↔label key for the routes on a <DashMap>. Presentational
 * (no map dependency); pairs each batch/route color with its rider/label.
 * Rows can be interactive (toggle a route's visibility) via `onToggle`.
 */
export type MapLegendEntry = {
  id: string
  label: string
  color: string
  /** Dimmed when hidden on the map. */
  hidden?: boolean
  meta?: React.ReactNode
}

export type MapLegendProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onToggle"> & {
  entries: MapLegendEntry[]
  onToggle?: (id: string) => void
}

export const MapLegend = React.forwardRef<HTMLDivElement, MapLegendProps>(
  ({ entries, onToggle, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="map-legend"
      className={cn(
        "inline-flex flex-col gap-0.5 rounded-sm border border-stroke-soft-200 bg-bg-white-0 p-1.5 shadow-xs",
        className,
      )}
      {...props}
    >
      {entries.map((e) => {
        const Row = onToggle ? "button" : "div"
        return (
          <Row
            key={e.id}
            {...(onToggle
              ? { type: "button" as const, onClick: () => onToggle(e.id), "aria-pressed": !e.hidden }
              : {})}
            className={cn(
              "flex items-center gap-2 rounded-sm px-2 py-1 text-left text-xs",
              onToggle && "cursor-pointer hover:bg-bg-weak-50",
              e.hidden && "opacity-40",
            )}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden />
            <span className="flex-1 truncate text-text-strong-950">{e.label}</span>
            {e.meta ? <span className="shrink-0 tabular-nums text-text-sub-600">{e.meta}</span> : null}
          </Row>
        )
      })}
    </div>
  ),
)
MapLegend.displayName = "MapLegend"
