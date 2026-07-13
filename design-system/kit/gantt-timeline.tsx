"use client"

import * as React from "react"
import { cn } from "./lib/utils"
import { routeColor } from "./lib/route-colors"

/**
 * GanttTimeline — schedule bars on a shared time axis (trips per driver, dock
 * windows per bay, shift coverage). Custom, no recharts: each row is a track
 * with an absolutely-positioned bar placed by % of the domain. GSM-themed —
 * hairline gridlines, route-colored bars, an optional "now" marker, and an
 * inner progress fill for in-flight work.
 *
 * Times are plain numbers (epoch ms, minutes since midnight — your unit). Pass a
 * `domain` to fix the axis, or it's derived from the tasks. `formatTick` labels.
 */
export type GanttTask = {
  id: string
  label: React.ReactNode
  /** Lane this bar sits in; tasks sharing a row are drawn on one track. */
  row: string
  start: number
  end: number
  color?: string
  /** 0–1 completion; draws a darker inner fill. */
  progress?: number
  sublabel?: React.ReactNode
}
export type GanttTimelineProps = {
  tasks: GanttTask[]
  /** Ordered lane labels (top→bottom). Defaults to first-seen order in tasks. */
  rows?: string[]
  domain?: [number, number]
  /** Number of axis ticks. Default 6. */
  ticks?: number
  formatTick?: (v: number) => React.ReactNode
  /** Draw a vertical "now" line at this value. */
  now?: number
  rowHeight?: number
  /** Width of the left lane-label gutter, px. */
  labelWidth?: number
  className?: string
}

export function GanttTimeline({
  tasks, rows, domain, ticks = 6, formatTick, now, rowHeight = 36, labelWidth = 120, className,
}: GanttTimelineProps) {
  const lanes = React.useMemo(() => rows ?? Array.from(new Set(tasks.map((t) => t.row))), [rows, tasks])
  const [lo, hi] = React.useMemo<[number, number]>(() => {
    if (domain) return domain
    const starts = tasks.map((t) => t.start)
    const ends = tasks.map((t) => t.end)
    return [Math.min(...starts), Math.max(...ends)]
  }, [domain, tasks])
  const span = Math.max(1, hi - lo)
  const pct = (v: number) => ((v - lo) / span) * 100
  const fmt = formatTick ?? ((v: number) => Math.round(v))
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => lo + (span * i) / ticks)
  const colorFor = (t: GanttTask, i: number) => t.color ?? routeColor(i)

  return (
    <div className={cn("w-full text-text-sub-600", className)} data-slot="gantt-timeline">
      {/* axis header */}
      <div className="flex">
        <div style={{ width: labelWidth }} className="shrink-0" />
        <div className="relative h-5 flex-1">
          {tickVals.map((v, i) => (
            <div key={i} className="absolute top-0 -translate-x-1/2 gsm-label text-[10px] text-text-soft-400" style={{ left: `${pct(v)}%` }}>
              {fmt(v)}
            </div>
          ))}
        </div>
      </div>

      {/* lanes */}
      <div className="relative">
        {/* vertical gridlines spanning all lanes */}
        <div className="pointer-events-none absolute inset-0" style={{ left: labelWidth }}>
          {tickVals.map((v, i) => (
            <div key={i} className="absolute inset-y-0 w-px bg-stroke-soft-200/70" style={{ left: `${pct(v)}%` }} />
          ))}
          {now != null && now >= lo && now <= hi ? (
            <div className="absolute inset-y-0 z-10 w-px bg-warning-base" style={{ left: `${pct(now)}%` }}>
              <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-warning-base" />
            </div>
          ) : null}
        </div>

        {lanes.map((lane) => {
          const inLane = tasks.filter((t) => t.row === lane)
          return (
            <div key={lane} className="flex items-stretch border-t border-stroke-soft-200" style={{ minHeight: rowHeight }}>
              <div style={{ width: labelWidth }} className="flex shrink-0 items-center pr-3 text-xs font-medium text-text-strong-950">
                <span className="truncate">{lane}</span>
              </div>
              <div className="relative flex-1 py-1">
                {inLane.map((t) => {
                  const i = tasks.indexOf(t)
                  const c = colorFor(t, i)
                  const left = pct(t.start)
                  const width = Math.max(0.5, pct(t.end) - left)
                  return (
                    <div
                      key={t.id}
                      title={typeof t.label === "string" ? t.label : undefined}
                      className="absolute top-1 flex h-[calc(100%-8px)] min-w-0 items-center overflow-hidden rounded-[2px] px-2 text-[11px] font-medium text-white"
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: c }}
                    >
                      {t.progress != null ? (
                        <span className="absolute inset-y-0 left-0 bg-black/25" style={{ width: `${Math.max(0, Math.min(1, t.progress)) * 100}%` }} />
                      ) : null}
                      <span className="relative truncate">{t.label}</span>
                      {t.sublabel ? <span className="relative ml-1.5 truncate opacity-80">{t.sublabel}</span> : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
