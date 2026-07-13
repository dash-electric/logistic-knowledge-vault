"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * DotStepper — Figma 1:1 parity (Stepper Dot node 479:14398, paste verified
 * 2026-05-17).
 *
 * Figma variants: 3 active positions × 2 sizes.
 *  - Small  : 8×8 circles, 18px stride (14px gap between)
 *  - X-Small: 4×4 circles, 10px stride ( 6px gap between)
 *
 * Critical Figma behaviour: ALL dots are the same size. Active dot = primary
 * fill (#5e2aac), inactive dots = stroke-soft-200 fill (#eaeaea). There is
 * NO width animation / pill-stretch on the active dot — that's a Dash
 * embellishment we drop for parity.
 *
 * Dash adds md size (6×6) between small (8) and x-small (4) for legacy users.
 */

type DotStepperProps = React.HTMLAttributes<HTMLOListElement> & {
  steps: number
  current: number
  size?: "xs" | "sm" | "md" | "lg"
}

const sizeMap = {
  // Figma X-Small
  xs: { dot: "size-1", gap: "gap-1.5" },
  // Dash legacy middle ground (not in Figma) — kept for backwards compat
  md: { dot: "size-1.5", gap: "gap-2" },
  // Figma Small (default)
  sm: { dot: "size-2", gap: "gap-2.5" },
  // Dash extension above Figma Small — kept for docs/legacy callers
  lg: { dot: "size-2.5", gap: "gap-3" },
}

const DotStepper = React.forwardRef<HTMLOListElement, DotStepperProps>(
  ({ className, steps, current, size = "sm", ...props }, ref) => {
    const sz = sizeMap[size]
    return (
      <ol
        ref={ref}
        data-slot="dot-stepper"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={steps}
        className={cn("inline-flex items-center", sz.gap, className)}
        {...props}
      >
        {Array.from({ length: steps }, (_, i) => (
          <li
            key={i}
            data-state={i === current ? "current" : i < current ? "completed" : "upcoming"}
            className={cn(
              // Figma: ALL dots same shape/size; only fill colour changes.
              "rounded-full transition-colors",
              sz.dot,
              i === current
                ? "bg-(--primary-base)"
                : "bg-stroke-soft-200",
            )}
          />
        ))}
      </ol>
    )
  },
)
DotStepper.displayName = "DotStepper"

export { DotStepper }
