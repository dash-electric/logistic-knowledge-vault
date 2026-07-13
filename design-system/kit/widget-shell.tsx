import * as React from "react"
import { RiArrowRightSLine as ChevronRight } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * WidgetShell — Layer-1 primitive that frames a dashboard widget.
 *
 * Card-bordered container with three slots:
 *   - header (title + optional headerExtra controls)
 *   - body   (children — widget-specific content)
 *   - footer (optional "See all" link)
 *
 * Used by every dashboard widget in the registry (hr-time-off-widget,
 * finance-stock-tracker-widget, …). Each Layer-3 widget alias installs
 * this primitive plus its own composition deps (badge, card, charts, …).
 *
 * Hover affordance: border + shadow lift on group hover, ring tinted with
 * the active theme accent (`--primary-alpha-16`).
 */
export type WidgetShellProps = {
  title?: React.ReactNode
  /** Footer "See all" link — boolean for default label, string for custom. */
  seeAll?: boolean | string
  /** Right-aligned header controls (Button / dropdown / icon). */
  headerExtra?: React.ReactNode
  /** Skip the auto-rendered title slot when `title` is already a custom node. */
  headerNoTitle?: boolean
  /** Body content. */
  children: React.ReactNode
  className?: string
}

export function WidgetShell({
  title,
  seeAll,
  headerExtra,
  headerNoTitle,
  children,
  className,
}: WidgetShellProps) {
  return (
    <div
      className={cn(
        "group/widget relative flex h-full flex-col rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-regular-xs",
        "transition-all duration-150 hover:border-stroke-strong-950 hover:shadow-card-sm hover:ring-1 hover:ring-(--primary-alpha-16)",
        className,
      )}
    >
      {(title || headerExtra) && (
        <div className="flex items-center gap-2">
          {headerNoTitle
            ? title
            : title && (
                <div className="text-sm font-semibold text-text-strong-950 tracking-tight">
                  {title}
                </div>
              )}
          {headerExtra && (
            <div className="ml-auto inline-flex items-center gap-1.5">
              {headerExtra}
            </div>
          )}
        </div>
      )}
      <div className="mt-3 flex-1 space-y-3">{children}</div>
      {seeAll && (
        <div className="mt-3 flex justify-end">
          <a
            className="text-[11px] text-text-soft-400 hover:text-(--primary-base) transition-colors inline-flex items-center gap-0.5 group/seeall"
            href="#"
          >
            {typeof seeAll === "string" ? seeAll : "See All"}
            <ChevronRight className="size-3 transition-transform group-hover/seeall:translate-x-0.5" />
          </a>
        </div>
      )}
    </div>
  )
}
