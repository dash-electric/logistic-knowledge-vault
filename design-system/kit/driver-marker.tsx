"use client"

import * as React from "react"
import { RiNavigationFill } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * DriverMarker — live rider/vehicle position. A heading-rotated navigation
 * arrow in a ringed disc; optional pulse for "moving". Place with
 * <MapOverlay anchor="center">. Used by tracking surfaces and the rider app.
 */
export type DriverMarkerProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Compass heading in degrees (0 = north). Rotates the arrow. */
  heading?: number
  color?: string
  active?: boolean
  size?: "sm" | "md"
}

const SIZE = { sm: "size-7", md: "size-9" } as const

export const DriverMarker = React.forwardRef<HTMLDivElement, DriverMarkerProps>(
  ({ heading = 0, color = "var(--dash-purple-500)", active = true, size = "md", className, style, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="driver-marker"
      aria-label="Driver position"
      className={cn("relative grid place-items-center rounded-full ring-2 ring-white shadow-[0_1px_4px_rgba(23,23,23,0.4)]", SIZE[size], className)}
      style={{ backgroundColor: color, ...style }}
      {...props}
    >
      {active ? (
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ backgroundColor: color }} />
      ) : null}
      <RiNavigationFill
        className="relative size-1/2 text-white"
        style={{ transform: `rotate(${heading}deg)` }}
        aria-hidden
      />
    </div>
  ),
)
DriverMarker.displayName = "DriverMarker"
