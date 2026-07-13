"use client"

import * as React from "react"
import { cn } from "./lib/utils"
import { ProgressBar } from "./progress-bar"

/**
 * CapacityMeter — weight/volume utilization for a trip or vehicle. Label + a
 * right-aligned percent, a ProgressBar, and the raw value/limit underneath.
 * Tone shifts to warning ≥80% and error ≥100% (overloaded).
 */
export type CapacityMeterProps = {
  label: string
  value: number
  max: number
  unit?: string
  format?: (n: number) => string
  className?: string
}

const defaultFmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

export function CapacityMeter({ label, value, max, unit, format = defaultFmt, className }: CapacityMeterProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const tone = pct >= 100 ? "error" : pct >= 80 ? "warning" : undefined
  return (
    <div className={cn("min-w-0 flex-1", className)} data-slot="capacity-meter">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-text-sub-600">{label}</span>
        <span className="text-xs font-medium tabular-nums text-text-strong-950">{pct}%</span>
      </div>
      <ProgressBar value={Math.min(pct, 100)} tone={tone as any} />
      <p className="mt-1 text-[11px] tabular-nums text-text-soft-400">
        {format(value)} / {format(max)}
        {unit ? ` ${unit}` : ""}
      </p>
    </div>
  )
}
