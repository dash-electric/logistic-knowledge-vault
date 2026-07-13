"use client"

import * as React from "react"
import { RiCheckLine, RiCloseLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import type { DeliveryState } from "./delivery-timeline"

/**
 * DeliveryTracker — the compact, glanceable milestone bar for the top of a
 * tracking screen: Ordered ●━● Shipped ●━○ Out for delivery ○ Delivered. Pair it
 * with a <DeliveryTimeline> below for the full history.
 *
 * Pass `current` (index of the active milestone) and states derive automatically:
 * before = done, at = current, after = pending. Or set a per-step `state`
 * (e.g. "failed") to override. GSM: ink track, one purple "you are here" dot,
 * every state also carries a glyph so color isn't the only signal.
 */
export type TrackerStep = {
  key: string
  label: React.ReactNode
  /** Small timestamp under the label. */
  at?: React.ReactNode
  /** Override the derived state. */
  state?: DeliveryState
}

export type DeliveryTrackerProps = React.HTMLAttributes<HTMLDivElement> & {
  steps: TrackerStep[]
  /** Index of the active milestone. Steps before it are done, after are pending. */
  current?: number
}

const ACCENT = "#5E2AAC"

function derive(step: TrackerStep, i: number, current: number): DeliveryState {
  if (step.state) return step.state
  if (i < current) return "done"
  if (i === current) return "current"
  return "pending"
}

function Dot({ state }: { state: DeliveryState }) {
  switch (state) {
    case "done":
      return (
        <span className="grid size-5 place-items-center rounded-full bg-bg-strong-950 text-static-white">
          <RiCheckLine className="size-3" />
        </span>
      )
    case "current":
      return (
        <span className="grid size-5 place-items-center rounded-full text-static-white" style={{ backgroundColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}26` }}>
          <span className="size-1.5 rounded-full bg-static-white" />
        </span>
      )
    case "failed":
      return (
        <span className="grid size-5 place-items-center rounded-full bg-error-base text-static-white">
          <RiCloseLine className="size-3" />
        </span>
      )
    default:
      return <span className="grid size-5 place-items-center rounded-full border-2 border-stroke-sub-300 bg-bg-white-0" />
  }
}

export const DeliveryTracker = React.forwardRef<HTMLDivElement, DeliveryTrackerProps>(
  ({ steps, current = 0, className, ...props }, ref) => {
    const n = steps.length
    const states = steps.map((s, i) => derive(s, i, current))
    // Ink the track up to the furthest reached milestone (last non-pending).
    let reached = -1
    states.forEach((st, i) => { if (st !== "pending") reached = i })
    const pct = (i: number) => ((i + 0.5) / n) * 100
    const trackLeft = pct(0)
    const trackWidth = pct(n - 1) - pct(0)
    const inkWidth = reached <= 0 ? 0 : pct(reached) - pct(0)

    return (
      <div ref={ref} className={cn("w-full", className)} data-slot="delivery-tracker" {...props}>
        {/* rail: dots sit at column centers; the track runs behind them at dot mid-height (10px) */}
        <div className="relative">
          <span className="pointer-events-none absolute top-[10px] h-px -translate-y-1/2 bg-stroke-soft-200" style={{ left: `${trackLeft}%`, width: `${trackWidth}%` }} aria-hidden />
          <span className="pointer-events-none absolute top-[10px] h-px -translate-y-1/2 bg-bg-strong-950" style={{ left: `${trackLeft}%`, width: `${inkWidth}%` }} aria-hidden />
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {steps.map((step, i) => (
              <li key={step.key} className="flex flex-col items-center">
                <div className="relative z-10 bg-bg-white-0 px-1">
                  <Dot state={states[i]} />
                </div>
                <div className="mt-1.5 max-w-[10ch] text-center">
                  <div className={cn("text-[11px] leading-tight", states[i] === "pending" ? "text-text-soft-400" : "font-medium text-text-strong-950")}>
                    {step.label}
                  </div>
                  {step.at ? <div className="mt-0.5 font-mono text-[10px] tabular-nums text-text-soft-400">{step.at}</div> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  },
)
DeliveryTracker.displayName = "DeliveryTracker"
