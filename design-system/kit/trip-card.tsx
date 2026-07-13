"use client"

import * as React from "react"
import { cn } from "./lib/utils"
import { DispatchStatusBadge, type DispatchStatus } from "./dispatch-status-badge"

/**
 * TripCard — one trip within a rider's batch: the BTH code + trip number +
 * dispatch status, a metrics line (stops · items · estimated time), an optional
 * real-route line (km · time), and a slot for CapacityMeter + stop list.
 */
export type TripCardProps = React.HTMLAttributes<HTMLDivElement> & {
  code: React.ReactNode
  tripNumber?: number
  status: DispatchStatus
  stops?: number
  items?: number
  estimateLabel?: React.ReactNode
  /** e.g. "34.6 km · 1h 25m real route" */
  realRouteLabel?: React.ReactNode
  defaultOpen?: boolean
  children?: React.ReactNode
}

export const TripCard = React.forwardRef<HTMLDivElement, TripCardProps>(
  ({ code, tripNumber, status, stops, items, estimateLabel, realRouteLabel, defaultOpen = true, children, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen)
    const metrics = [
      stops != null ? `${stops} stops` : null,
      items != null ? `${items} items` : null,
      estimateLabel,
    ].filter(Boolean)

    return (
      <div
        ref={ref}
        data-slot="trip-card"
        className={cn("rounded-sm border border-stroke-soft-200 bg-bg-white-0", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="gsm-mono text-xs font-medium text-text-strong-950">{code}</span>
            {tripNumber != null ? <span className="text-xs text-text-sub-600">Trip #{tripNumber}</span> : null}
          </span>
          <DispatchStatusBadge status={status} />
        </button>

        {open ? (
          <div className="px-3 pb-3">
            {metrics.length ? (
              <p className="text-xs tabular-nums text-text-sub-600">{metrics.join(" · ")}</p>
            ) : null}
            {realRouteLabel ? (
              <p className="mt-0.5 text-xs tabular-nums text-text-soft-400">{realRouteLabel}</p>
            ) : null}
            {children ? <div className="mt-3">{children}</div> : null}
          </div>
        ) : null}
      </div>
    )
  },
)
TripCard.displayName = "TripCard"
