"use client"

import * as React from "react"
import { RiEyeLine, RiEyeOffLine, RiArrowRightSLine } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * BatchVisibilityToggle — the eye that shows/hides a rider's route on the map.
 */
export type BatchVisibilityToggleProps = {
  visible: boolean
  onToggle: () => void
  className?: string
}
export function BatchVisibilityToggle({ visible, onToggle, className }: BatchVisibilityToggleProps) {
  return (
    <button
      type="button"
      aria-label={visible ? "Hide route" : "Show route"}
      aria-pressed={visible}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-sm text-icon-sub-600 transition-colors hover:bg-bg-weak-50 hover:text-icon-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-24) [&_svg]:size-4",
        className,
      )}
    >
      {visible ? <RiEyeLine /> : <RiEyeOffLine />}
    </button>
  )
}

/**
 * RiderBatchCard — a rider row in the dispatch "Planned" panel: visibility eye,
 * name + mitra code, a metrics line (trips · items · kg · duration / shift),
 * the route color dot, and an expand chevron. Expanded content (TripCards) is
 * passed as children. Selecting highlights the card to sync with the map.
 */
export type RiderBatchCardProps = React.HTMLAttributes<HTMLDivElement> & {
  name: React.ReactNode
  /** Mitra / rider code (e.g. MTR0002796). */
  code?: React.ReactNode
  /** Route color (use routeColor(index)). */
  color: string
  trips?: number
  items?: number
  weightKg?: number
  durationLabel?: React.ReactNode
  shiftLabel?: React.ReactNode
  visible?: boolean
  onToggleVisible?: () => void
  expanded?: boolean
  onToggleExpand?: () => void
  selected?: boolean
  children?: React.ReactNode
}

export const RiderBatchCard = React.forwardRef<HTMLDivElement, RiderBatchCardProps>(
  (
    {
      name, code, color,
      trips, items, weightKg, durationLabel, shiftLabel,
      visible = true, onToggleVisible,
      expanded, onToggleExpand, selected,
      children, className, ...props
    },
    ref,
  ) => {
    const metrics = [
      trips != null ? `${trips} trip${trips === 1 ? "" : "s"}` : null,
      items != null ? `${items} items` : null,
      weightKg != null ? `${weightKg.toFixed(2)} kg` : null,
      durationLabel ? (shiftLabel ? <>{durationLabel} / {shiftLabel}</> : durationLabel) : null,
    ].filter(Boolean)

    return (
      <div
        ref={ref}
        data-slot="rider-batch-card"
        data-selected={selected || undefined}
        className={cn(
          "rounded-sm border bg-bg-white-0 transition-colors",
          selected ? "border-stroke-strong-950" : "border-stroke-soft-200",
          className,
        )}
        {...props}
      >
        {/* Eye is a sibling of the expand trigger — never nest buttons. */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {onToggleVisible ? (
            <BatchVisibilityToggle visible={visible} onToggle={onToggleVisible} />
          ) : null}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-text-strong-950">{name}</span>
                {code ? <span className="gsm-mono shrink-0 text-[11px] text-text-soft-400">{code}</span> : null}
              </span>
              {metrics.length ? (
                <span className="mt-0.5 block truncate text-xs tabular-nums text-text-sub-600">
                  {metrics.map((m, i) => (
                    <React.Fragment key={i}>
                      {i > 0 ? " · " : ""}
                      {m}
                    </React.Fragment>
                  ))}
                </span>
              ) : null}
            </span>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
            <RiArrowRightSLine
              className={cn("size-4 shrink-0 text-icon-soft-400 transition-transform", expanded && "rotate-90")}
              aria-hidden
            />
          </button>
        </div>
        {expanded && children ? <div className="space-y-2 px-3 pb-3">{children}</div> : null}
      </div>
    )
  },
)
RiderBatchCard.displayName = "RiderBatchCard"
