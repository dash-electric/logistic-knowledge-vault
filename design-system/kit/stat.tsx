"use client"

import * as React from "react"
import { RiArrowRightUpLine as ArrowUpRight, RiArrowDownSLine as ArrowDownRight, RiSubtractLine as Minus } from "@remixicon/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

const trendVariants = cva("inline-flex items-center gap-0.5 text-xs font-medium", {
  variants: {
    trend: {
      up: "text-success-base",
      down: "text-error-base",
      neutral: "text-text-sub-600",
    },
  },
  defaultVariants: { trend: "neutral" },
})

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: Minus,
} as const

const Stat = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="stat"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  ),
)
Stat.displayName = "Stat"

const StatLabel = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    // Figma label (e.g. "SPEND", "OUT OF 20"): 12/16 weight 500 uppercase ls 0.48 (~tracking-wider).
    <p
      ref={ref}
      data-slot="stat-label"
      className={cn("text-xs font-medium text-text-sub-600 uppercase tracking-wider", className)}
      {...props}
    />
  ),
)
StatLabel.displayName = "StatLabel"

const statValueVariants = cva(
  "font-medium text-text-strong-950 tabular-nums",
  {
    variants: {
      size: {
        // Figma "Spending Summary" / "Total Balance": 24/32 weight 500.
        md: "text-2xl leading-8 tracking-tight",
        // Figma "My Cards" / "Total Expenses": 32/40 weight 500 ls -0.16 (~tracking-tighter).
        lg: "text-[32px] leading-10 tracking-tighter",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type StatValueProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof statValueVariants>

const StatValue = React.forwardRef<HTMLParagraphElement, StatValueProps>(
  ({ className, size, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="stat-value"
      data-size={size ?? "md"}
      className={cn(statValueVariants({ size }), className)}
      {...props}
    />
  ),
)
StatValue.displayName = "StatValue"

type StatTrendProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof trendVariants> & {
    value?: React.ReactNode
  }

const StatTrend = React.forwardRef<HTMLSpanElement, StatTrendProps>(
  ({ className, trend = "neutral", value, children, ...props }, ref) => {
    const Icon = trendIcon[trend ?? "neutral"]
    return (
      <span
        ref={ref}
        data-slot="stat-trend"
        data-trend={trend}
        className={cn(trendVariants({ trend }), className)}
        {...props}
      >
        <Icon strokeWidth={2} className="size-3.5" />
        {value !== undefined ? <span className="tabular-nums">{value}</span> : null}
        {children}
      </span>
    )
  },
)
StatTrend.displayName = "StatTrend"

const StatDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="stat-description"
    className={cn("text-xs text-text-sub-600 leading-relaxed", className)}
    {...props}
  />
))
StatDescription.displayName = "StatDescription"

export { Stat, StatLabel, StatValue, StatTrend, StatDescription }
