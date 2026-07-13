"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * MarkerPopover — the brand-styled callout that replaces Google's default
 * InfoWindow. A hairline card with a downward tail; place above a marker with
 * <MapOverlay anchor="bottom"> (offset upward) so the tail points at the stop.
 */
export type MarkerPopoverProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode
  /** Accent dot (route color) shown before the title. */
  color?: string
}

export const MarkerPopover = React.forwardRef<HTMLDivElement, MarkerPopoverProps>(
  ({ title, color, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="marker-popover"
      className={cn(
        "relative w-max max-w-[15rem] rounded-sm border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 shadow-card-md",
        className,
      )}
      {...props}
    >
      {title ? (
        <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-text-strong-950">
          {color ? <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden /> : null}
          <span className="truncate">{title}</span>
        </div>
      ) : null}
      {children ? <div className="text-xs leading-snug text-text-sub-600">{children}</div> : null}
      {/* downward tail */}
      <span
        aria-hidden
        className="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-stroke-soft-200 bg-bg-white-0"
      />
    </div>
  ),
)
MarkerPopover.displayName = "MarkerPopover"
