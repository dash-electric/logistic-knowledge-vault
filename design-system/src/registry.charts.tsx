import * as React from "react"
import type { Category } from "./registry"
import {
  ChartCard, Sparkline,
  TrendLineChart, TrendAreaChart, CompareBarChart, StackedBarChart,
  DonutChart, DeliveryFunnelChart, ScatterPlot, RadialGauge, ComboChart,
  Heatmap, GanttTimeline,
  Button, type ChartSeries,
} from "@dash-electric/logistic-kit"
import { RiMoreLine } from "@remixicon/react"

/* ── sample logistics data ──────────────────────────────────────────────── */

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const deliveriesByDay = WEEK.map((d, i) => ({
  day: d,
  delivered: [820, 932, 901, 1040, 1290, 1330, 720][i],
  failed: [24, 18, 31, 22, 40, 35, 12][i],
}))

const volumeByHub = WEEK.map((d, i) => ({
  day: d,
  kemang: [120, 145, 132, 160, 190, 210, 90][i],
  cilandak: [90, 110, 105, 130, 150, 165, 70][i],
  pejaten: [60, 72, 80, 95, 110, 120, 55][i],
}))

const slaByHub = [
  { hub: "Kemang", onTime: 96, late: 4 },
  { hub: "Cilandak", onTime: 91, late: 9 },
  { hub: "Pejaten", onTime: 88, late: 12 },
  { hub: "Tebet", onTime: 93, late: 7 },
]

const fleetMix = [
  { key: "motor", label: "Motorbike", value: 142 },
  { key: "van", label: "Van", value: 38 },
  { key: "truck", label: "Truck", value: 12 },
  { key: "bicycle", label: "Bicycle", value: 8 },
]

const funnel = [
  { key: "created", label: "Orders created", value: 5200 },
  { key: "allocated", label: "Allocated", value: 4980 },
  { key: "picked", label: "Picked up", value: 4760 },
  { key: "transit", label: "In transit", value: 4610 },
  { key: "delivered", label: "Delivered", value: 4395 },
]

const scatter = [
  {
    key: "ontime", label: "On time", color: undefined, // ink default
    points: Array.from({ length: 22 }, (_, i) => ({ x: 4 + (i % 11) * 1.6, y: 8 + ((i * 37) % 40), z: 60 + (i % 5) * 30 })),
  },
  {
    key: "late", label: "Late", color: "#FB3748", // status red
    points: Array.from({ length: 12 }, (_, i) => ({ x: 12 + (i % 8) * 2.1, y: 40 + ((i * 53) % 45), z: 50 + (i % 4) * 35 })),
  },
]

const revenueVsOrders = WEEK.map((d, i) => ({
  day: d,
  orders: [820, 932, 901, 1040, 1290, 1330, 720][i],
  revenue: [41, 47, 45, 52, 64, 67, 36][i], // Rp millions
}))

const heatHours = ["06", "08", "10", "12", "14", "16", "18", "20"]
const heatRows = ["Kemang", "Cilandak", "Pejaten", "Tebet"]
const heatData = [
  [4, 12, 28, 40, 22, 35, 58, 30],
  [2, 9, 22, 33, 18, 28, 47, 24],
  [1, 6, 15, 26, 14, 21, 38, 19],
  [3, 10, 19, 31, 16, 25, 44, 21],
]

const gantt = [
  { id: "t1", row: "Andi", label: "Batch A · 8 stops", row_: 0, start: 6 * 60, end: 9 * 60, progress: 1 },
  { id: "t2", row: "Andi", label: "Batch B · 6 stops", start: 9 * 60 + 30, end: 12 * 60, progress: 0.4 },
  { id: "t3", row: "Budi", label: "Batch C · 10 stops", start: 7 * 60, end: 11 * 60, progress: 0.7 },
  { id: "t4", row: "Citra", label: "Batch D · 5 stops", start: 8 * 60, end: 10 * 60 + 30, progress: 1 },
  { id: "t5", row: "Citra", label: "Batch E · 7 stops", start: 11 * 60, end: 14 * 60, progress: 0 },
].map(({ row_, ...t }) => t)

const fmtClock = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:00`

const trendSeries: ChartSeries[] = [
  { key: "delivered", label: "Delivered" },
  { key: "failed", label: "Failed", color: "#FB3748" },
]
const hubSeries: ChartSeries[] = [
  { key: "kemang", label: "Kemang" },
  { key: "cilandak", label: "Cilandak" },
  { key: "pejaten", label: "Pejaten" },
]
const slaSeries: ChartSeries[] = [
  { key: "onTime", label: "On time" },
  { key: "late", label: "Late", color: "#FB3748" },
]

export const CHART_CATEGORIES: Category[] = [
  {
    id: "charts",
    title: "Charts & data viz",
    blurb:
      "Operational charts on recharts, themed to the GSM. Color is information, not decoration: series default to the ink ramp, status uses red/amber/green, purple is punctuation, and the bright categorical palette (routeColor) is opt-in via `categorical` only when series map to distinct operational entities (hubs, vehicles, routes). Ink-soft axes, gray-200 hairline grids, tabular numerals. Drop any chart inside a ChartCard for the frame + loading/empty/error states.",
    demos: [
      {
        name: "ChartCard",
        description: "The frame every chart lives in — eyebrow, title, headline figure + delta, actions, and loading/empty/error bodies.",
        render: () => (
          <div className="grid w-full gap-4 md:grid-cols-2">
            <ChartCard
              eyebrow="Last 7 days"
              title="Deliveries"
              value="6,043"
              delta={{ value: "+12.4%", trend: "up" }}
              actions={<Button tone="neutral" style="ghost" size="xs" aria-label="More"><RiMoreLine className="size-4" /></Button>}
              footer="vs 5,378 the prior week"
            >
              <TrendLineChart data={deliveriesByDay} xKey="day" series={trendSeries} height={200} />
            </ChartCard>
            <ChartCard eyebrow="Last 7 days" title="Loading state" state="loading" />
            <ChartCard eyebrow="Last 7 days" title="Empty state" state="empty" emptyMessage="No deliveries in this window" />
            <ChartCard eyebrow="Last 7 days" title="Error state" state="error" onRetry={() => {}} />
          </div>
        ),
      },
      {
        name: "Sparkline",
        description: "Tiny inline trend for KPI tiles — no axes, area or line, draws in routeColor.",
        render: () => (
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {[
              { label: "On-time rate", value: "94.2%", data: [88, 90, 89, 92, 91, 93, 94] },
              { label: "Avg stops / trip", value: "8.6", data: [7, 7.5, 8, 7.8, 8.2, 8.4, 8.6] },
              { label: "Failed deliveries", value: "182", data: [40, 35, 38, 30, 28, 24, 17] },
            ].map((k, i) => (
              <div key={k.label} className="rounded-md border border-stroke-soft-200 bg-bg-white-0 p-4">
                <div className="gsm-label text-[10px] text-text-soft-400">{k.label}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-text-strong-950">{k.value}</div>
                <div className="mt-2"><Sparkline data={k.data.map((value) => ({ value }))} color={i === 2 ? "#FB3748" : undefined} /></div>
              </div>
            ))}
          </div>
        ),
      },
      {
        name: "TrendLineChart",
        description: "Multi-series time series — delivered vs failed across the week.",
        render: () => (
          <ChartCard title="Deliveries vs failures" eyebrow="This week" className="w-full max-w-2xl">
            <TrendLineChart data={deliveriesByDay} xKey="day" series={trendSeries} />
          </ChartCard>
        ),
      },
      {
        name: "TrendAreaChart",
        description: "Volume over time, stacked by hub.",
        render: () => (
          <ChartCard title="Parcel volume by hub" eyebrow="This week" className="w-full max-w-2xl">
            <TrendAreaChart data={volumeByHub} xKey="day" series={hubSeries} stacked categorical />
          </ChartCard>
        ),
      },
      {
        name: "CompareBarChart",
        description: "Grouped bars — SLA on-time vs late per hub. Horizontal variant included.",
        render: () => (
          <div className="grid w-full gap-4 lg:grid-cols-2">
            <ChartCard title="SLA by hub" eyebrow="Grouped">
              <CompareBarChart data={slaByHub} xKey="hub" series={slaSeries} />
            </ChartCard>
            <ChartCard title="SLA by hub" eyebrow="Horizontal">
              <CompareBarChart data={slaByHub} xKey="hub" series={slaSeries} horizontal />
            </ChartCard>
          </div>
        ),
      },
      {
        name: "StackedBarChart",
        description: "Composition per category — daily volume stacked by hub.",
        render: () => (
          <ChartCard title="Volume composition" eyebrow="This week" className="w-full max-w-2xl">
            <StackedBarChart data={volumeByHub} xKey="day" series={hubSeries} />
          </ChartCard>
        ),
      },
      {
        name: "ComboChart",
        description: "Bars + line on a dual axis — order count against revenue.",
        render: () => (
          <ChartCard title="Orders vs revenue" eyebrow="This week · Rp M" className="w-full max-w-2xl">
            <ComboChart
              data={revenueVsOrders}
              xKey="day"
              bars={[{ key: "orders", label: "Orders" }]}
              lines={[{ key: "revenue", label: "Revenue (Rp M)", color: "#5E2AAC" }]}
            />
          </ChartCard>
        ),
      },
      {
        name: "DonutChart",
        description: "Proportion with a center total — fleet mix by vehicle type.",
        render: () => (
          <ChartCard title="Fleet mix" eyebrow="Active vehicles" className="w-full max-w-sm">
            <DonutChart data={fleetMix} centerLabel="vehicles" height={220} />
          </ChartCard>
        ),
      },
      {
        name: "RadialGauge",
        description: "Utilization gauge — capacity used right now.",
        render: () => (
          <div className="grid w-full gap-4 sm:grid-cols-3">
            <ChartCard title="Fleet utilization" eyebrow="Now">
              <RadialGauge data={[{ key: "util", label: "Utilization", value: 78 }]} centerValue="78%" centerLabel="in use" />
            </ChartCard>
            <ChartCard title="On-time SLA" eyebrow="Today">
              <RadialGauge data={[{ key: "sla", label: "On time", value: 94, color: "#1FC16B" }]} centerValue="94%" centerLabel="on time" />
            </ChartCard>
            <ChartCard title="Bag capacity" eyebrow="Hub Kemang">
              <RadialGauge data={[{ key: "cap", label: "Capacity", value: 88, color: "#FA7319" }]} centerValue="88%" centerLabel="full" />
            </ChartCard>
          </div>
        ),
      },
      {
        name: "DeliveryFunnelChart",
        description: "Order funnel — created → allocated → picked → in transit → delivered.",
        render: () => (
          <ChartCard title="Fulfilment funnel" eyebrow="Today" className="w-full max-w-xl">
            <DeliveryFunnelChart data={funnel} />
          </ChartCard>
        ),
      },
      {
        name: "ScatterPlot",
        description: "Distribution — distance (km) vs delivery time (min), bubble = parcel weight.",
        render: () => (
          <ChartCard title="Distance vs delivery time" eyebrow="Last 24h" className="w-full max-w-2xl">
            <ScatterPlot groups={scatter} xLabel="Distance (km)" yLabel="Time (min)" />
          </ChartCard>
        ),
      },
      {
        name: "Heatmap",
        description: "Density grid — order intensity by hub × hour. Sequential ramp, value on cell.",
        render: () => (
          <ChartCard title="Orders by hub × hour" eyebrow="Today" className="w-full max-w-2xl">
            <Heatmap xLabels={heatHours} yLabels={heatRows} data={heatData} />
          </ChartCard>
        ),
      },
      {
        name: "GanttTimeline",
        description: "Schedule bars on a shared axis — driver batches across the morning, with progress + a 'now' marker.",
        render: () => (
          <ChartCard title="Batch schedule" eyebrow="Today · by driver" className="w-full max-w-3xl">
            <GanttTimeline
              tasks={gantt}
              domain={[6 * 60, 14 * 60]}
              ticks={8}
              now={10 * 60 + 20}
              formatTick={fmtClock}
            />
          </ChartCard>
        ),
      },
    ],
  },
]
