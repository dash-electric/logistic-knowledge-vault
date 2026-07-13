"use client"

import * as React from "react"
import { cn } from "./lib/utils"
import { ProgressBar } from "./progress-bar"
import { ETAChip } from "./logistics-chips"

/**
 * RouteProgress — top-of-screen progress for a rider's active route:
 * "N / M stops" + a bar + the trip ETA. The rider's at-a-glance "how far am I"
 * on a phone at arm's length, one hand free.
 */
export type RouteProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  done: number
  total: number
  etaLabel?: React.ReactNode
}

export const RouteProgress = React.forwardRef<HTMLDivElement, RouteProgressProps>(
  ({ done, total, etaLabel, className, ...props }, ref) => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return (
      <div ref={ref} data-slot="route-progress" className={cn("w-full", className)} {...props}>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium tabular-nums text-text-strong-950">
            {done} / {total} stops
          </span>
          {etaLabel ? <ETAChip>{etaLabel}</ETAChip> : null}
        </div>
        <ProgressBar value={pct} tone="success" />
      </div>
    )
  },
)
RouteProgress.displayName = "RouteProgress"
