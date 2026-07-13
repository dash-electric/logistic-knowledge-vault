"use client"

import * as React from "react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Funnel, FunnelChart,
  LabelList, Line, LineChart, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart,
  ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis,
} from "recharts"
import { cn } from "./lib/utils"
import { routeColor } from "./lib/route-colors"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./chart"

/**
 * Opinionated, GSM-themed charts on top of recharts + ChartContainer.
 *
 * Color policy (GSM §3 — "color is information, not decoration"): series default
 * to the INK RAMP, not a rainbow. Reach for chromatic color only when it carries
 * meaning:
 *   • `categorical` → series map to distinct operational entities (hubs, vehicles,
 *     routes). Uses routeColor() — the same field-app palette the GSM exempts as
 *     "operational data, not brand."
 *   • status → pass `color` per series for success/warning/error (green/amber/red).
 *   • purple (#5E2AAC) → punctuation: the one highlighted point, or the line over
 *     bars in a combo. Never a default fill.
 *
 * Axes are ink-soft, grid is a gray-200 hairline, numbers are tabular. Drop any
 * of these inside a <ChartCard>.
 */

export type ChartSeries = { key: string; label?: string; color?: string }

/** Ink-first neutral ramp for non-categorical series. Distinguishable by value,
 *  not hue — a single series reads as ink, a second as mid-grey, and so on. */
const NEUTRAL_SERIES = ["#171717", "#5C5C5C", "#A3A3A3", "#CFCFCF"]
const ACCENT = "#5E2AAC"

function seriesColor(s: ChartSeries, i: number, categorical: boolean): string {
  if (s.color) return s.color
  return categorical ? routeColor(i) : NEUTRAL_SERIES[Math.min(i, NEUTRAL_SERIES.length - 1)]
}

function useChartConfig(series: ChartSeries[], categorical = false): ChartConfig {
  return React.useMemo(
    () =>
      Object.fromEntries(
        series.map((s, i) => [s.key, { label: s.label ?? s.key, color: seriesColor(s, i, categorical) }]),
      ) as ChartConfig,
    [series, categorical],
  )
}

type Datum = Record<string, any>
type BaseProps = {
  data: Datum[]
  series: ChartSeries[]
  /** X-axis category key. */
  xKey: string
  height?: number
  className?: string
  /** Series map to distinct operational entities (hubs, vehicles, routes) → use
   *  the categorical palette. Default false: series render in the ink ramp and
   *  color stays reserved for status (pass `color` per series). */
  categorical?: boolean
}

const axisProps = { tickLine: false, axisLine: false, tickMargin: 8 } as const
const GRID = "var(--dash-gray-200)"

function frame(height: number | undefined, className?: string) {
  return cn("aspect-auto w-full", className)
}

/* ── Sparkline — tiny inline trend (no axes), for KPI/Stat cards ────────── */
export type SparklineProps = {
  data: Datum[]
  dataKey?: string
  color?: string
  height?: number
  area?: boolean
  className?: string
}
export function Sparkline({ data, dataKey = "value", color, height = 36, area = true, className }: SparklineProps) {
  const c = color ?? NEUTRAL_SERIES[0]
  return (
    <div className={cn("w-full", className)} style={{ height }} data-slot="sparkline">
      <ResponsiveContainer width="100%" height="100%">
        {area ? (
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <Area dataKey={dataKey} stroke={c} fill={c} fillOpacity={0.12} strokeWidth={2} dot={false} isAnimationActive={false} />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <Line dataKey={dataKey} stroke={c} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/* ── TrendLineChart — multi-series time series ──────────────────────────── */
export function TrendLineChart({ data, series, xKey, height = 240, className, curved = true, categorical = false }: BaseProps & { curved?: boolean }) {
  const config = useChartConfig(series, categorical)
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey} {...axisProps} fontSize={11} />
        <YAxis {...axisProps} width={36} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s) => (
          <Line key={s.key} dataKey={s.key} type={curved ? "monotone" : "linear"} stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ChartContainer>
  )
}

/* ── TrendAreaChart — volume over time (single or stacked) ───────────────── */
export function TrendAreaChart({ data, series, xKey, height = 240, className, stacked, categorical = false }: BaseProps & { stacked?: boolean }) {
  const config = useChartConfig(series, categorical)
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey} {...axisProps} fontSize={11} />
        <YAxis {...axisProps} width={36} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s) => (
          <Area key={s.key} dataKey={s.key} type="monotone" stackId={stacked ? "a" : undefined} stroke={`var(--color-${s.key})`} fill={`var(--color-${s.key})`} fillOpacity={stacked ? 0.6 : 0.15} strokeWidth={2} />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}

/* ── CompareBarChart — grouped bars (vertical or horizontal) ────────────── */
export function CompareBarChart({ data, series, xKey, height = 240, className, horizontal, categorical = false }: BaseProps & { horizontal?: boolean }) {
  const config = useChartConfig(series, categorical)
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, bottom: 0, left: horizontal ? 8 : -8 }}>
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke={GRID} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} fontSize={11} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={84} fontSize={11} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} fontSize={11} />
            <YAxis {...axisProps} width={36} fontSize={11} />
          </>
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={2} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

/* ── StackedBarChart — composition per category ─────────────────────────── */
export function StackedBarChart({ data, series, xKey, height = 240, className, categorical = true }: BaseProps) {
  const config = useChartConfig(series, categorical)
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey} {...axisProps} fontSize={11} />
        <YAxis {...axisProps} width={36} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} stackId="a" fill={`var(--color-${s.key})`} radius={i === series.length - 1 ? [2, 2, 0, 0] : 0} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

/* ── ComboChart — bars + line on a dual axis ────────────────────────────── */
export type ComboChartProps = {
  data: Datum[]
  xKey: string
  bars: ChartSeries[]
  lines: ChartSeries[]
  height?: number
  className?: string
}
export function ComboChart({ data, xKey, bars, lines, height = 240, className }: ComboChartProps) {
  // Bars default to the ink ramp; the overlaid line defaults to the purple accent
  // (punctuation against the ink mass). Pass `color` per series to override.
  const config = React.useMemo(() => {
    const e: Record<string, { label: string; color: string }> = {}
    bars.forEach((s, i) => (e[s.key] = { label: s.label ?? s.key, color: s.color ?? NEUTRAL_SERIES[Math.min(i, NEUTRAL_SERIES.length - 1)] }))
    lines.forEach((s) => (e[s.key] = { label: s.label ?? s.key, color: s.color ?? ACCENT }))
    return e as ChartConfig
  }, [bars, lines])
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey} {...axisProps} fontSize={11} />
        <YAxis yAxisId="left" {...axisProps} width={36} fontSize={11} />
        <YAxis yAxisId="right" orientation="right" {...axisProps} width={36} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {bars.map((s) => (
          <Bar key={s.key} yAxisId="left" dataKey={s.key} fill={`var(--color-${s.key})`} radius={2} />
        ))}
        {lines.map((s) => (
          <Line key={s.key} yAxisId="right" dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} />
        ))}
      </ComposedChart>
    </ChartContainer>
  )
}

/* ── DonutChart — proportion with a center total ────────────────────────── */
export type DonutDatum = { key: string; label?: string; value: number; color?: string }
export type DonutChartProps = {
  data: DonutDatum[]
  height?: number
  centerLabel?: React.ReactNode
  centerValue?: React.ReactNode
  className?: string
}
export function DonutChart({ data, height = 240, centerLabel, centerValue, className }: DonutChartProps) {
  const config = React.useMemo(
    () => Object.fromEntries(data.map((d, i) => [d.key, { label: d.label ?? d.key, color: d.color ?? routeColor(i) }])) as ChartConfig,
    [data],
  )
  const total = React.useMemo(() => data.reduce((n, d) => n + d.value, 0), [data])
  return (
    <div className={cn("relative", className)} data-slot="donut-chart" style={{ height }}>
      <ChartContainer config={config} className="aspect-auto size-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie data={data.map((d) => ({ ...d, name: d.label ?? d.key }))} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} strokeWidth={2}>
            {data.map((d, i) => (
              <Cell key={d.key} fill={d.color ?? routeColor(i)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        <span className="text-2xl font-semibold tabular-nums text-text-strong-950">{centerValue ?? total}</span>
        {centerLabel ? <span className="gsm-label text-[10px] text-text-soft-400">{centerLabel}</span> : null}
      </div>
    </div>
  )
}

/* ── FunnelChart — delivery funnel ──────────────────────────────────────── */
export type FunnelDatum = { key: string; label: string; value: number; color?: string }
export function DeliveryFunnelChart({ data, height = 260, className }: { data: FunnelDatum[]; height?: number; className?: string }) {
  // Funnel stages are sequential steps, not distinct entities — the narrowing
  // width already encodes the drop-off, so stages share one neutral fill (white
  // labels stay AA-legible on Neutral). Pass `color` to flag a problem stage.
  const rows = data.map((d) => ({ ...d, name: d.label, fill: d.color ?? "#5C5C5C" }))
  const config = Object.fromEntries(data.map((d) => [d.key, { label: d.label, color: d.color ?? "#5C5C5C" }])) as ChartConfig
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <FunnelChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Funnel dataKey="value" data={rows} isAnimationActive>
          <LabelList position="insideLeft" dataKey="name" fill="#fff" stroke="none" fontSize={12} offset={12} />
          <LabelList position="insideRight" dataKey="value" fill="#fff" stroke="none" fontSize={12} offset={12} className="tabular-nums" />
        </Funnel>
      </FunnelChart>
    </ChartContainer>
  )
}

/* ── ScatterPlot — distribution (x vs y) ────────────────────────────────── */
export type ScatterSeries = { key: string; label?: string; color?: string; points: { x: number; y: number; z?: number }[] }
export function ScatterPlot({ groups, xLabel, yLabel, height = 240, className, categorical = false }: { groups: ScatterSeries[]; xLabel?: string; yLabel?: string; height?: number; className?: string; categorical?: boolean }) {
  const config = useChartConfig(groups, categorical)
  return (
    <ChartContainer config={config} className={frame(height, className)} style={{ height }}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis type="number" dataKey="x" name={xLabel} {...axisProps} fontSize={11} />
        <YAxis type="number" dataKey="y" name={yLabel} {...axisProps} width={36} fontSize={11} />
        <ZAxis type="number" dataKey="z" range={[40, 200]} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={{ strokeDasharray: "3 3" }} />
        {groups.map((g) => (
          <Scatter key={g.key} name={g.label ?? g.key} data={g.points} fill={`var(--color-${g.key})`} />
        ))}
      </ScatterChart>
    </ChartContainer>
  )
}

/* ── RadialGauge — utilization gauge (one or more rings) ────────────────── */
export type GaugeDatum = { key: string; label?: string; value: number; color?: string }
export function RadialGauge({ data, height = 200, max = 100, centerValue, centerLabel, className }: { data: GaugeDatum[]; height?: number; max?: number; centerValue?: React.ReactNode; centerLabel?: React.ReactNode; className?: string }) {
  // The figure in the center is the information; the ring defaults to ink. Pass
  // `color` for status (green = healthy, amber = warning, red = over).
  const config = React.useMemo(
    () => Object.fromEntries(data.map((d) => [d.key, { label: d.label ?? d.key, color: d.color ?? NEUTRAL_SERIES[0] }])) as ChartConfig,
    [data],
  )
  const rows = data.map((d) => ({ ...d, name: d.label ?? d.key, fill: d.color ?? NEUTRAL_SERIES[0] }))
  return (
    <div className={cn("relative", className)} style={{ height }} data-slot="radial-gauge">
      <ChartContainer config={config} className="aspect-auto size-full">
        <RadialBarChart data={rows} innerRadius="55%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={12}>
          <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <RadialBar dataKey="value" background cornerRadius={6} />
        </RadialBarChart>
      </ChartContainer>
      {centerValue != null ? (
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="text-2xl font-semibold tabular-nums text-text-strong-950">{centerValue}</span>
          {centerLabel ? <span className="gsm-label text-[10px] text-text-soft-400">{centerLabel}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
