"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * StopListItem — one stop in a trip's stop list: a route-colored sequence
 * badge, the address, and a metrics line (items · time · distance). Expandable
 * to reveal its ItemRows (pass them as children). Selectable to sync with the map.
 */
export type StopListItemProps = React.HTMLAttributes<HTMLDivElement> & {
  sequence: number
  color: string
  address: React.ReactNode
  items?: number
  durationLabel?: React.ReactNode
  distanceLabel?: React.ReactNode
  selected?: boolean
  /** Renders ItemRows / detail; when present the header reads as a disclosure. */
  children?: React.ReactNode
  defaultOpen?: boolean
}

export const StopListItem = React.forwardRef<HTMLDivElement, StopListItemProps>(
  ({ sequence, color, address, items, durationLabel, distanceLabel, selected, children, defaultOpen, className, ...props }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen ?? false)
    const hasDetail = Boolean(children)
    const metrics = [
      items != null ? `${items} item${items === 1 ? "" : "s"}` : null,
      durationLabel,
      distanceLabel,
    ].filter(Boolean)

    return (
      <div
        ref={ref}
        data-slot="stop-list-item"
        data-selected={selected || undefined}
        className={cn("border-b border-stroke-soft-200 last:border-0", selected && "bg-bg-weak-50", className)}
        {...props}
      >
        <button
          type="button"
          onClick={hasDetail ? () => setOpen((o) => !o) : undefined}
          className={cn(
            "flex w-full items-start gap-2.5 px-1 py-2 text-left",
            hasDetail && "cursor-pointer hover:bg-bg-weak-50",
          )}
        >
          <span
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums text-white"
            style={{ background: color }}
          >
            {sequence}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-text-strong-950">{address}</span>
            {metrics.length ? (
              <span className="mt-0.5 block text-xs tabular-nums text-text-sub-600">{metrics.join(" · ")}</span>
            ) : null}
          </span>
        </button>
        {hasDetail && open ? <div className="pb-2 pl-8 pr-1">{children}</div> : null}
      </div>
    )
  },
)
StopListItem.displayName = "StopListItem"
