"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * Heatmap — a density grid (e.g. orders by hour × day, lateness by hub × route).
 * Custom, no recharts: a CSS grid of cells whose fill interpolates a single hue
 * by value. GSM-safe — the default hue is Dash Purple used as a *sequential data
 * ramp* (allowed for data-viz), low values fade to the gray-50 surface, not white.
 * Pair color with the on-cell number so intensity is never the only signal.
 */
export type HeatmapProps = {
  xLabels: string[]
  yLabels: string[]
  /** Row-major matrix: data[y][x]. */
  data: number[][]
  /** Base hue for the high end of the ramp. Default Dash Purple. */
  color?: string
  /** Upper bound of the ramp; defaults to the max value in `data`. */
  max?: number
  /** Render the value inside each cell. Default on. */
  showValues?: boolean
  formatValue?: (v: number) => React.ReactNode
  /** Square min size per cell, px. */
  cellSize?: number
  className?: string
}

/** #RRGGBB → "r, g, b". */
function rgbOf(hex: string): string {
  const h = hex.replace("#", "")
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function Heatmap({
  xLabels, yLabels, data, color = "#5E2AAC", max, showValues = true, formatValue, cellSize = 36, className,
}: HeatmapProps) {
  const rgb = React.useMemo(() => rgbOf(color), [color])
  const hi = React.useMemo(() => max ?? Math.max(1, ...data.flat()), [data, max])
  const fmt = formatValue ?? ((v: number) => v)

  return (
    <div className={cn("w-full overflow-x-auto", className)} data-slot="heatmap">
      <div className="inline-grid gap-px" style={{ gridTemplateColumns: `auto repeat(${xLabels.length}, minmax(${cellSize}px, 1fr))` }}>
        {/* corner + column headers */}
        <div />
        {xLabels.map((x) => (
          <div key={x} className="gsm-label px-1 pb-1 text-center text-[10px] text-text-soft-400">{x}</div>
        ))}
        {/* rows */}
        {yLabels.map((y, yi) => (
          <React.Fragment key={y}>
            <div className="flex items-center justify-end pr-2 text-[11px] text-text-sub-600">{y}</div>
            {xLabels.map((_, xi) => {
              const v = data[yi]?.[xi] ?? 0
              const t = Math.max(0, Math.min(1, v / hi))
              const dark = t > 0.55
              return (
                <div
                  key={xi}
                  title={`${y} · ${xLabels[xi]}: ${v}`}
                  className="grid aspect-square place-items-center rounded-[2px] text-[11px] tabular-nums"
                  style={{
                    minWidth: cellSize,
                    backgroundColor: t === 0 ? "var(--dash-gray-50, #f7f7f7)" : `rgba(${rgb}, ${0.12 + t * 0.88})`,
                    color: dark ? "#fff" : "var(--text-sub-600, #5C5C5C)",
                  }}
                >
                  {showValues && v !== 0 ? fmt(v) : null}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
