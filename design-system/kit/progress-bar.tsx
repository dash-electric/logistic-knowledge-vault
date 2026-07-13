"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * ProgressBar — Figma 1:1 parity (node 450:17821 + 450:17810,
 * paste verified 2026-05-17).
 *
 * Figma component name: "Progress Bar [1.1]" (track) +
 * "Progress Bar Line [1.1]" (indicator) + "Progress Bar Label [1.1]" (label
 * wrappers).
 *
 * Default Figma height = 6px (h=1.5), radius = full, track = stroke-soft-200.
 * Figma only ships 6px height — `sm` and `lg` are Dash extensions for
 * compact/prominent surfaces.
 *
 * Color variants (from "Progress Bar Line" component set):
 *   Empty   → no fill (0% state)
 *   Blue    → --dash-blue-500   (#335cff) — Figma DEFAULT
 *   Red     → --dash-red-500    (#fa3748)
 *   Orange  → --dash-orange-500 (#fa7319)
 *   Green   → --dash-green-500  (#1fc16b)
 *
 * Dash deviations:
 *   - `tone="primary"` retained → renders Dash brand purple (--primary-base).
 *     Use `tone="information"` to match the Figma DEFAULT blue.
 */

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-stroke-soft-200",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-1.5", // Figma default = 6px
        lg: "h-2",
      },
    },
    defaultVariants: { size: "md" },
  },
)

const indicatorVariants = cva("h-full w-full flex-1 transition-transform duration-300 ease-out rounded-full", {
  variants: {
    tone: {
      primary: "bg-primary",
      information: "bg-(--state-information-base)",
      success: "bg-(--state-success-base)",
      warning: "bg-(--state-warning-base)",
      error: "bg-(--state-error-base)",
    },
  },
  defaultVariants: { tone: "primary" },
})

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> &
  VariantProps<typeof indicatorVariants> & {
    value?: number
  }

const ProgressBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, size, tone, value = 0, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    data-slot="progress-root"
    className={cn(progressVariants({ size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(indicatorVariants({ tone }))}
      style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
    />
  </ProgressPrimitive.Root>
))
ProgressBar.displayName = "ProgressBar"

/* -------------------------------------------------------------------------- */
/* ProgressBarLabel — Figma "Progress Bar Label" composition wrapper           */
/* -------------------------------------------------------------------------- */

type ProgressBarLabelProps = React.HTMLAttributes<HTMLDivElement> &
  ProgressProps & {
    /** Label shown above the bar (left side). */
    label: React.ReactNode
    /** Percentage / right-side caption shown above the bar (right side). */
    caption?: React.ReactNode
    /** Optional description text shown below the bar. */
    description?: React.ReactNode
    /** Optional placement for the caption — top is the only Figma layout in scope. */
    captionPlacement?: "top"
  }

const ProgressBarLabel = React.forwardRef<HTMLDivElement, ProgressBarLabelProps>(
  (
    { label, caption, description, value, size, tone, className, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="progress-bar-label"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="flex-1 text-sm leading-5 font-medium text-text-strong-950">{label}</span>
        {caption ? (
          <span className="text-xs leading-4 font-normal text-text-sub-600">{caption}</span>
        ) : null}
      </div>
      <ProgressBar value={value} size={size} tone={tone} />
      {description ? (
        <div className="text-xs leading-4 font-normal text-text-sub-600">{description}</div>
      ) : null}
    </div>
  ),
)
ProgressBarLabel.displayName = "ProgressBarLabel"

export { ProgressBar, ProgressBarLabel }
