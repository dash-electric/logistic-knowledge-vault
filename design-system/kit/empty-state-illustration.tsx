"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * EmptyStateIllustration — 34 widget-specific empty-state illustrations.
 *
 * 148x148 viewBox SVGs sourced from Dash brand asset library (2026-05-19).
 * Files served from `/brand/empty-states/<kind>.svg` (public static asset).
 *
 * Use inside any empty body slot:
 *   <EmptyStateIllustration kind="donation-profile" />
 *   <EmptyStateIllustration kind="quick-transfer" size={96} />
 *
 * Falls back to a neutral muted disc placeholder if `kind` not in catalog
 * (helps catch typos at design-time without crashing the page).
 */

export type EmptyStateKind =
  | "budget-overview"
  | "course-progress"
  | "courses"
  | "credit-score"
  | "currency-list"
  | "current-project"
  | "daily-feedback"
  | "daily-work-hours"
  | "donation-profile"
  | "employee-comments"
  | "employee-rating"
  | "employee-rewards"
  | "employee-spotlight-overview"
  | "exchange"
  | "major-expenses"
  | "my-cards"
  | "my-cards-vertical"
  | "my-subscriptions"
  | "notes"
  | "quick-transfer"
  | "recent-transactions"
  | "saved-actions"
  | "schedule-events"
  | "schedule-holiday"
  | "schedule-meetings"
  | "spending-summary"
  | "status-tracker"
  | "stock-market-tracker"
  | "time-off"
  | "time-tracker"
  | "total-balance"
  | "total-expenses"
  | "training-analysis"
  | "work-hour-analysis"

const EMPTY_KINDS = new Set<EmptyStateKind>([
  "budget-overview",
  "course-progress",
  "courses",
  "credit-score",
  "currency-list",
  "current-project",
  "daily-feedback",
  "daily-work-hours",
  "donation-profile",
  "employee-comments",
  "employee-rating",
  "employee-rewards",
  "employee-spotlight-overview",
  "exchange",
  "major-expenses",
  "my-cards",
  "my-cards-vertical",
  "my-subscriptions",
  "notes",
  "quick-transfer",
  "recent-transactions",
  "saved-actions",
  "schedule-events",
  "schedule-holiday",
  "schedule-meetings",
  "spending-summary",
  "status-tracker",
  "stock-market-tracker",
  "time-off",
  "time-tracker",
  "total-balance",
  "total-expenses",
  "training-analysis",
  "work-hour-analysis",
])

export interface EmptyStateIllustrationProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> {
  kind: EmptyStateKind
  /** Pixel size of the illustration (square). Defaults to 148 (Figma native). */
  size?: number
  alt?: string
}

export const EmptyStateIllustration = React.forwardRef<HTMLImageElement, EmptyStateIllustrationProps>(
  function EmptyStateIllustration({ kind, size = 148, alt, className, ...props }, ref) {
    const safe = EMPTY_KINDS.has(kind) ? kind : null
    const src = safe ? `/brand/empty-states/${safe}.svg` : null
    if (!src) {
      return (
        <div
          aria-hidden
          style={{ width: size, height: size }}
          className={cn(
            "rounded-full bg-bg-weak-50 inline-flex items-center justify-center text-text-soft-400 text-xs",
            className,
          )}
        >
          ?
        </div>
      )
    }
    return (
      <img
        ref={ref}
        src={src}
        alt={alt ?? ""}
        width={size}
        height={size}
        className={cn("inline-block select-none", className)}
        draggable={false}
        {...props}
      />
    )
  },
)

EmptyStateIllustration.displayName = "EmptyStateIllustration"
