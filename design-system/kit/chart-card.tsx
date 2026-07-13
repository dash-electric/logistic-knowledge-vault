"use client"

import * as React from "react"
import { RiRefreshLine } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * ChartCard — the GSM frame every chart lives in: hairline card, eyebrow label,
 * title, optional delta/actions, and a body that swaps between loading (skeleton),
 * empty, error (with retry), and the chart itself. No shadow — a 1px rule does
 * the elevation. Put any chart from `charts.tsx` (or a custom SVG one) as children.
 */
export type ChartCardState = "ready" | "loading" | "empty" | "error"

export type ChartCardProps = {
  title: React.ReactNode
  /** Small all-caps eyebrow above the title. */
  eyebrow?: React.ReactNode
  subtitle?: React.ReactNode
  /** Right-aligned controls (range toggle, menu, legend). */
  actions?: React.ReactNode
  /** A headline figure shown under the title (e.g. "1,284"). */
  value?: React.ReactNode
  /** A signed delta chip beside the value, e.g. "+12.4%". */
  delta?: { value: React.ReactNode; trend?: "up" | "down" | "flat" }
  state?: ChartCardState
  emptyMessage?: React.ReactNode
  errorMessage?: React.ReactNode
  onRetry?: () => void
  footer?: React.ReactNode
  className?: string
  bodyClassName?: string
  children?: React.ReactNode
}

const TREND: Record<string, string> = {
  up: "text-success-base",
  down: "text-error-base",
  flat: "text-text-soft-400",
}

export function ChartCard({
  title, eyebrow, subtitle, actions, value, delta, state = "ready",
  emptyMessage = "No data for this range", errorMessage = "Couldn't load this chart",
  onRetry, footer, className, bodyClassName, children,
}: ChartCardProps) {
  return (
    <section className={cn("flex flex-col rounded-md border border-stroke-soft-200 bg-bg-white-0", className)} data-slot="chart-card">
      <header className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="min-w-0">
          {eyebrow ? <div className="gsm-label mb-1 text-[10px] text-text-soft-400">{eyebrow}</div> : null}
          <h3 className="truncate text-sm font-semibold text-text-strong-950">{title}</h3>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-text-sub-600">{subtitle}</p> : null}
          {value != null ? (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-text-strong-950">{value}</span>
              {delta ? (
                <span className={cn("text-xs font-medium tabular-nums", TREND[delta.trend ?? "flat"])}>{delta.value}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </header>

      <div className={cn("relative min-h-[120px] flex-1 px-2 py-3", bodyClassName)}>
        {state === "ready" ? children : null}
        {state === "loading" ? (
          <div className="grid size-full place-items-center px-2">
            <div className="h-full max-h-[220px] w-full animate-pulse rounded-sm bg-bg-weak-50" />
          </div>
        ) : null}
        {state === "empty" ? (
          <div className="grid size-full place-content-center px-4 py-8 text-center">
            <p className="text-sm text-text-soft-400">{emptyMessage}</p>
          </div>
        ) : null}
        {state === "error" ? (
          <div className="grid size-full place-content-center gap-2 px-4 py-8 text-center">
            <p className="text-sm text-text-sub-600">{errorMessage}</p>
            {onRetry ? (
              <button type="button" onClick={onRetry} className="mx-auto inline-flex items-center gap-1.5 rounded-sm border border-stroke-soft-200 px-2.5 py-1 text-xs font-medium text-text-strong-950 transition-colors hover:bg-bg-weak-50">
                <RiRefreshLine className="size-3.5" />
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {footer ? <footer className="border-t border-stroke-soft-200 px-4 py-2.5 text-xs text-text-sub-600">{footer}</footer> : null}
    </section>
  )
}
