"use client"

import * as React from "react"
import { RiCheckLine as Check, RiArrowRightSLine as ChevronRight } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * StepIndicator — Figma 1:1 parity (node 479:14388, paste verified 2026-05-17).
 *
 * Figma exposes:
 *  - Step Indicator Horizontal (3507:28) + Items (3505:3498):
 *      Inline row of pill items separated by a 20×20 chevron-right arrow.
 *      Item = 20×20 circle + 14px label (font-regular), no card chrome.
 *  - Step Indicator Vertical (3507:227) + Items (3507:190):
 *      Stacked pill items, each 36px tall with rounded-sm chrome. Active
 *      item has white bg + chevron-right at the tail; non-active items have
 *      bg-weak-50 fill.
 *  - Step Indicator Sidebar (3507:560): vertical inside a soft card.
 *
 * State map (both orientations):
 *  - upcoming   → 20×20 white circle + stroke-soft-200 border + text-sub-600
 *                  index numeral, label text-sub-600 regular.
 *  - current    → 20×20 primary-base circle + white numeral, label
 *                  text-strong-950. Vertical adds trailing chevron-right
 *                  + white card fill (vs upcoming weak-50).
 *  - completed  → 20×20 state-success-base circle + white check, label
 *                  text-sub-600 (NOT strong — Figma greys completed labels back).
 *
 * Connectors (horizontal between items) = 20×20 chevron-right
 * text-soft-400 (#a3a3a3) icon, NOT a hairline rule.
 */

type StepStatus = "completed" | "current" | "upcoming"

type StepIndicatorProps = React.HTMLAttributes<HTMLOListElement> & {
  orientation?: "horizontal" | "vertical"
}

const StepIndicator = React.forwardRef<HTMLOListElement, StepIndicatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="step-indicator"
      data-orientation={orientation}
      className={cn(
        "flex",
        // Horizontal: tight inline row (items + 20px chevron between them)
        orientation === "horizontal" ? "flex-row items-center gap-2" : "flex-col gap-1",
        className,
      )}
      {...props}
    />
  ),
)
StepIndicator.displayName = "StepIndicator"

type StepProps = React.HTMLAttributes<HTMLLIElement> & {
  status: StepStatus
  index: number
  label?: React.ReactNode
  description?: React.ReactNode
  /** Render a connector after this step. Horizontal=chevron, vertical=hairline. */
  withConnector?: boolean
  orientation?: "horizontal" | "vertical"
}

const Step = React.forwardRef<HTMLLIElement, StepProps>(
  (
    { className, status, index, label, description, withConnector = true, orientation = "horizontal", ...props },
    ref,
  ) => (
    <li
      ref={ref}
      data-slot="step"
      data-status={status}
      className={cn(
        "flex",
        orientation === "horizontal"
          ? "items-center gap-2"
          : cn(
              // Vertical item: full-width 36px pill with rounded-sm chrome
              "flex-row items-center gap-2 rounded-sm px-2 py-2 min-h-9 w-full",
              status === "current" ? "bg-bg-white-0" : "bg-bg-weak-50",
            ),
        className,
      )}
      {...props}
    >
      {/* 20×20 circle marker */}
      <span
        aria-hidden
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
          status === "completed" && "bg-(--state-success-base) text-static-white",
          status === "current" && "bg-(--primary-base) text-static-white",
          status === "upcoming" &&
            "bg-bg-white-0 text-text-sub-600 border border-stroke-soft-200",
        )}
      >
        {status === "completed" ? (
          <Check strokeWidth={3} className="size-2.5" />
        ) : (
          <span className="leading-none">{index + 1}</span>
        )}
      </span>

      {(label || description) && (
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          {label ? (
            <span
              className={cn(
                "text-sm",
                // Figma: only "current" gets strong text. Completed + upcoming
                // both fall back to sub-600.
                status === "current" ? "text-text-strong-950" : "text-text-sub-600",
              )}
            >
              {label}
            </span>
          ) : null}
          {description ? (
            <span className="text-xs text-text-sub-600">{description}</span>
          ) : null}
        </div>
      )}

      {/* Trailing chevron on the CURRENT vertical step (Figma vertical active) */}
      {orientation === "vertical" && status === "current" ? (
        <ChevronRight strokeWidth={1.75} className="size-5 shrink-0 text-icon-sub-600" aria-hidden />
      ) : null}

      {/* Connector */}
      {withConnector && orientation === "horizontal" ? (
        // Figma horizontal connector = 20×20 chevron, NOT a hairline rule
        <ChevronRight
          aria-hidden
          strokeWidth={1.75}
          className="size-5 shrink-0 text-icon-soft-400"
        />
      ) : null}
    </li>
  ),
)
Step.displayName = "Step"

export { StepIndicator, Step }
export type { StepStatus }
