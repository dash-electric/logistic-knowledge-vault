"use client"

import * as React from "react"
import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import type { StopState } from "./stop-marker"

/**
 * RiderStopManifest — the rider's ordered stop list (drop it inside a Sheet for
 * the bottom-sheet manifest pattern). Each row shows a state-aware sequence
 * badge, address, and metadata. The current stop is emphasized; done/failed
 * stops show a check / ✕ and dim.
 */
export type ManifestStop = {
  id: string
  sequence: number
  color: string
  address: React.ReactNode
  state?: StopState
  meta?: React.ReactNode
  current?: boolean
}

export type RiderStopManifestProps = React.HTMLAttributes<HTMLDivElement> & {
  stops: ManifestStop[]
  onSelect?: (id: string) => void
}

export const RiderStopManifest = React.forwardRef<HTMLDivElement, RiderStopManifestProps>(
  ({ stops, onSelect, className, ...props }, ref) => (
    <div ref={ref} data-slot="rider-stop-manifest" className={cn("divide-y divide-stroke-soft-200", className)} {...props}>
      {stops.map((s) => {
        const done = s.state === "done"
        const failed = s.state === "failed"
        const Row = onSelect ? "button" : "div"
        return (
          <Row
            key={s.id}
            {...(onSelect ? { type: "button" as const, onClick: () => onSelect(s.id) } : {})}
            className={cn(
              "flex w-full items-center gap-3 px-1 py-3 text-left",
              onSelect && "cursor-pointer hover:bg-bg-weak-50",
              s.current && "bg-bg-weak-50",
              (done || failed) && "opacity-60",
            )}
          >
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums text-white"
              style={{ background: failed ? "var(--state-error-base)" : s.color }}
            >
              {done ? <RiCheckLine className="size-3.5" /> : failed ? <RiCloseLine className="size-3.5" /> : s.sequence}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-sm text-text-strong-950", s.current && "font-medium")}>{s.address}</span>
              {s.meta ? <span className="mt-0.5 block text-xs tabular-nums text-text-sub-600">{s.meta}</span> : null}
            </span>
            {s.current ? <span className="gsm-label shrink-0 text-[10px] text-(--state-warning-dark)">Now</span> : null}
          </Row>
        )
      })}
    </div>
  ),
)
RiderStopManifest.displayName = "RiderStopManifest"
