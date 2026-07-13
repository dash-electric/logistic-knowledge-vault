"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * DispatchStatsBar — the compact metric strip above the dispatch map
 * (ITEMS · STOPS · BATCHES · DEMAND/CAPACITY · UTILIZATION). Label over value,
 * hairline separators, tabular figures. Scans left-to-right, no cards.
 */
export type DispatchStat = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}

export type DispatchStatsBarProps = React.HTMLAttributes<HTMLDivElement> & {
  stats: DispatchStat[]
}

export const DispatchStatsBar = React.forwardRef<HTMLDivElement, DispatchStatsBarProps>(
  ({ stats, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="dispatch-stats-bar"
      className={cn(
        "flex flex-wrap items-stretch gap-x-6 gap-y-2 rounded-sm border border-stroke-soft-200 bg-bg-white-0 px-4 py-2.5",
        className,
      )}
      {...props}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col justify-center",
            i > 0 && "border-l border-stroke-soft-200 pl-6",
          )}
        >
          <span className="gsm-label text-[10px] text-text-soft-400">{s.label}</span>
          <span className="text-lg font-semibold tabular-nums leading-tight text-text-strong-950">{s.value}</span>
          {s.hint ? <span className="text-[11px] tabular-nums text-text-sub-600">{s.hint}</span> : null}
        </div>
      ))}
    </div>
  ),
)
DispatchStatsBar.displayName = "DispatchStatsBar"
