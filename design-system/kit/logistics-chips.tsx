"use client"

import * as React from "react"
import { RiTimeLine, RiRoadMapLine, RiTimerLine, RiScales3Line, RiBox3Line } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Logistics chips — small icon + tabular value pills used across the dispatch
 * panel and the rider app: ETA, distance, duration, weight, volume. Neutral by
 * default (operational metadata, not brand). All figures tabular so rows align.
 */
export type LogisticsChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  icon?: React.ReactNode
  tone?: "neutral" | "warning" | "error"
}

const TONE = {
  neutral: "text-text-sub-600",
  warning: "text-(--state-warning-dark)",
  error: "text-(--state-error-base)",
} as const

export const LogisticsChip = React.forwardRef<HTMLSpanElement, LogisticsChipProps>(
  ({ icon, tone = "neutral", className, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="logistics-chip"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums [&_svg]:size-3.5 [&_svg]:shrink-0",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  ),
)
LogisticsChip.displayName = "LogisticsChip"

export const ETAChip = ({ children, ...p }: LogisticsChipProps) => (
  <LogisticsChip icon={<RiTimeLine />} {...p}>{children}</LogisticsChip>
)
export const DurationChip = ({ children, ...p }: LogisticsChipProps) => (
  <LogisticsChip icon={<RiTimerLine />} {...p}>{children}</LogisticsChip>
)
export const DistanceChip = ({ children, ...p }: LogisticsChipProps) => (
  <LogisticsChip icon={<RiRoadMapLine />} {...p}>{children}</LogisticsChip>
)
export const WeightChip = ({ children, ...p }: LogisticsChipProps) => (
  <LogisticsChip icon={<RiScales3Line />} {...p}>{children}</LogisticsChip>
)
export const VolumeChip = ({ children, ...p }: LogisticsChipProps) => (
  <LogisticsChip icon={<RiBox3Line />} {...p}>{children}</LogisticsChip>
)
