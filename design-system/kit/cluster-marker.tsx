"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * ClusterMarker — collapses overlapping stops into a single count bubble when
 * zoomed out (65 stops in a hub plan overlap badly otherwise). Tap to zoom in
 * / expand. Ink-neutral so it reads as an aggregate, not a route. Place with
 * <MapOverlay anchor="center">.
 */
export type ClusterMarkerProps = React.HTMLAttributes<HTMLButtonElement> & {
  count: number
  /** Optional accent ring (e.g. the dominant route color in the cluster). */
  color?: string
  size?: "sm" | "md" | "lg"
}

const SIZE = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-11 text-base" } as const

export const ClusterMarker = React.forwardRef<HTMLButtonElement, ClusterMarkerProps>(
  ({ count, color, size = "md", className, style, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="cluster-marker"
      aria-label={`${count} stops, zoom in to expand`}
      className={cn(
        "grid place-items-center rounded-full bg-bg-strong-950 font-semibold tabular-nums text-text-white-0",
        "ring-2 ring-white shadow-[0_1px_4px_rgba(23,23,23,0.35)] cursor-pointer",
        "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-24)",
        SIZE[size],
        className,
      )}
      style={color ? { boxShadow: `0 0 0 3px ${color}, 0 1px 4px rgba(23,23,23,0.35)`, ...style } : style}
      {...props}
    >
      {count > 99 ? "99+" : count}
    </button>
  ),
)
ClusterMarker.displayName = "ClusterMarker"
