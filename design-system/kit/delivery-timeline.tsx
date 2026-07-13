"use client"

import * as React from "react"
import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * DeliveryTimeline — the vertical status history of a single parcel: created →
 * allocated → picked up → in transit → out for delivery → delivered (or failed).
 * Each event carries a state, a time, a place, and optionally a proof thumbnail.
 *
 * GSM: an ink rail. Done nodes are filled ink with a check; the current node is
 * the one purple moment (accent = punctuation, the "you are here"); pending nodes
 * are hollow grey and dimmed; a failed node is error red with an ✕. Color is never
 * the only signal — every state also has a distinct glyph and weight.
 *
 * Distinct from GanttTimeline (horizontal schedule), StepIndicator (form wizard),
 * and ActivityFeed (collaboration feed). This is per-shipment lifecycle.
 */
export type DeliveryState = "done" | "current" | "pending" | "failed"

export type DeliveryEvent = {
  key: string
  title: React.ReactNode
  /** Defaults to "done". */
  state?: DeliveryState
  time?: React.ReactNode
  location?: React.ReactNode
  description?: React.ReactNode
  /** Proof thumbnail (photo/signature URL) shown beside the event. */
  proof?: string
  /** Override the rail glyph. */
  icon?: React.ReactNode
}

export type DeliveryTimelineProps = React.HTMLAttributes<HTMLOListElement> & {
  events: DeliveryEvent[]
}

const ACCENT = "#5E2AAC"

function Node({ state, icon }: { state: DeliveryState; icon?: React.ReactNode }) {
  if (icon) return <span className="grid size-6 place-items-center rounded-full bg-bg-white-0 ring-1 ring-stroke-soft-200">{icon}</span>
  switch (state) {
    case "done":
      return (
        <span className="grid size-6 place-items-center rounded-full bg-bg-strong-950 text-static-white">
          <RiCheckLine className="size-3.5" />
        </span>
      )
    case "current":
      return (
        <span className="grid size-6 place-items-center rounded-full text-static-white" style={{ backgroundColor: ACCENT, boxShadow: `0 0 0 4px ${ACCENT}26` }}>
          <span className="size-1.5 rounded-full bg-static-white" />
        </span>
      )
    case "failed":
      return (
        <span className="grid size-6 place-items-center rounded-full bg-error-base text-static-white">
          <RiCloseLine className="size-3.5" />
        </span>
      )
    default:
      return <span className="grid size-6 place-items-center rounded-full border-2 border-stroke-sub-300 bg-bg-white-0" />
  }
}

export const DeliveryTimeline = React.forwardRef<HTMLOListElement, DeliveryTimelineProps>(({ events, className, ...props }, ref) => (
  <ol ref={ref} className={cn("flex flex-col", className)} data-slot="delivery-timeline" {...props}>
    {events.map((e, i) => {
      const state = e.state ?? "done"
      const last = i === events.length - 1
      const dim = state === "pending"
      // The connector below a node is inked while the journey has reached it.
      const inkedLine = state === "done" || state === "current"
      return (
        <li key={e.key} className="relative flex gap-3 pb-5 last:pb-0">
          {!last ? (
            <span
              className={cn("absolute left-[11px] top-7 -bottom-0 w-px", inkedLine ? "bg-bg-strong-950" : "bg-stroke-soft-200")}
              aria-hidden
            />
          ) : null}
          <div className="relative z-10 shrink-0">
            <Node state={state} icon={e.icon} />
          </div>
          <div className={cn("min-w-0 flex-1", dim && "opacity-55")}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn("truncate text-sm", state === "current" ? "font-semibold text-text-strong-950" : "font-medium text-text-strong-950")}>
                {e.title}
              </span>
              {e.time ? <span className="shrink-0 font-mono text-xs tabular-nums text-text-soft-400">{e.time}</span> : null}
            </div>
            {e.location ? <div className="mt-0.5 truncate text-xs text-text-sub-600">{e.location}</div> : null}
            {e.description ? <div className="mt-0.5 text-xs text-text-sub-600">{e.description}</div> : null}
            {e.proof ? (
              <img src={e.proof} alt="" className="mt-2 h-16 w-16 rounded-sm border border-stroke-soft-200 object-cover" />
            ) : null}
          </div>
        </li>
      )
    })}
  </ol>
))
DeliveryTimeline.displayName = "DeliveryTimeline"
