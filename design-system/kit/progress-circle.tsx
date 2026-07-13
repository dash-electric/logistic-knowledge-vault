"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * ProgressCircle — Figma 1:1 parity (node 466:4652, paste verified 2026-05-17).
 *
 * Figma component name: "Circular Progress Bar [1.1]".
 * 5 sizes × 5 percentage demos. Sizes: 48 / 56 / 64 / 72 / 80.
 *
 * Figma source colors:
 *   track    = #eaeaea (--stroke-soft-200)
 *   progress = #5e2aac (--dash-purple-700, Dash brand primary)
 *   label    = 14/500 text-strong-950 (centered)
 *
 * Default tone = `primary` (matches Figma purple).
 * Status tones (success/warning/error/information) are Dash extensions for
 * status-aware progress (e.g. error budget burn).
 */

const trackStrokeVariants = cva("", {
  variants: {
    tone: {
      primary: "stroke-primary",
      information: "stroke-(--state-information-base)",
      success: "stroke-(--state-success-base)",
      warning: "stroke-(--state-warning-base)",
      error: "stroke-(--state-error-base)",
    },
  },
  defaultVariants: { tone: "primary" },
})

type ProgressCircleProps = React.SVGAttributes<SVGSVGElement> &
  VariantProps<typeof trackStrokeVariants> & {
    value: number // 0-100
    /** Pixel diameter — Figma ships 48/56/64/72/80. */
    size?: 48 | 56 | 64 | 72 | 80 | number
    strokeWidth?: number
    showLabel?: boolean
  }

const ProgressCircle = React.forwardRef<SVGSVGElement, ProgressCircleProps>(
  ({ className, value, tone, size = 48, strokeWidth = 4, showLabel = true, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value))
    const r = (size - strokeWidth) / 2
    const c = 2 * Math.PI * r
    const offset = c - (clamped / 100) * c

    return (
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        data-slot="progress-circle"
      >
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={cn("-rotate-90", className)}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          {...props}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={strokeWidth}
            className="stroke-stroke-soft-200"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={cn("transition-[stroke-dashoffset] duration-300 ease-out", trackStrokeVariants({ tone }))}
          />
        </svg>
        {showLabel ? (
          <span className="absolute inset-0 flex items-center justify-center text-sm leading-5 font-medium text-text-strong-950 tabular-nums">
            {Math.round(clamped)}%
          </span>
        ) : null}
      </div>
    )
  },
)
ProgressCircle.displayName = "ProgressCircle"

export { ProgressCircle }
