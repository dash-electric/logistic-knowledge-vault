"use client"

import * as React from "react"
import { RiBuilding2Line } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * HubMarker — the origin/depot teardrop pin. Dash Purple by default (brand
 * moment: the hub is the one fixed anchor of every plan). Place with
 * <MapOverlay anchor="bottom"> so the tip sits on the coordinate.
 */
export type HubMarkerProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode
  icon?: React.ReactNode
  /** Pin fill. Defaults to Dash Purple (the family/brand anchor). */
  color?: string
  size?: "sm" | "md" | "lg"
}

const PX = { sm: 28, md: 36, lg: 44 } as const

export const HubMarker = React.forwardRef<HTMLDivElement, HubMarkerProps>(
  ({ label, icon, color = "var(--dash-purple-500)", size = "md", className, ...props }, ref) => {
    const d = PX[size]
    return (
      <div ref={ref} data-slot="hub-marker" className={cn("relative flex flex-col items-center", className)} {...props}>
        <div className="relative" style={{ width: d, height: d * 1.32 }}>
          <svg viewBox="0 0 24 32" width={d} height={d * 1.32} aria-hidden>
            <path
              d="M12 0 C5.4 0 0 5.2 0 11.6 C0 20 12 32 12 32 C12 32 24 20 24 11.6 C24 5.2 18.6 0 12 0 Z"
              fill={color}
            />
            <circle cx="12" cy="11.5" r="7.5" fill="#fff" fillOpacity="0.16" />
          </svg>
          <span className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 text-white [&_svg]:size-1/2">
            {icon ?? <RiBuilding2Line style={{ width: d * 0.42, height: d * 0.42 }} />}
          </span>
        </div>
        {label ? (
          <span className="mt-0.5 max-w-32 truncate rounded-sm bg-bg-white-0/90 px-1.5 py-0.5 text-[11px] font-medium text-text-strong-950 shadow-xs">
            {label}
          </span>
        ) : null}
      </div>
    )
  },
)
HubMarker.displayName = "HubMarker"
