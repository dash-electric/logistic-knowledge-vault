"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "./lib/utils"

/**
 * Chart — Recharts wrapper with Dash color-token-aware theming.
 * Mirrors shadcn/ui chart anatomy.
 *
 * Usage:
 *   const config = { dispatch: { label: "Dispatch", color: "var(--dash-purple-500)" } }
 *   <ChartContainer config={config}>
 *     <BarChart data={data}>
 *       <Bar dataKey="dispatch" fill="var(--color-dispatch)" />
 *       <ChartTooltip content={<ChartTooltipContent />} />
 *     </BarChart>
 *   </ChartContainer>
 */

const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
}

type ChartContextValue = { config: ChartConfig }

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be used inside <ChartContainer>")
  return ctx
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uid = React.useId()
  const chartId = `chart-${id ?? uid.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        data-slot="chart"
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-text-soft-400",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-stroke-soft-200/60",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-stroke-soft-200",
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-none",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-stroke-soft-200",
          "[&_.recharts-radial-bar-background-sector]:fill-bg-weak-50",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-bg-weak-50",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-stroke-soft-200",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-none",
          "[&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color)
  if (!colorConfig.length) return null
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => {
            const vars = colorConfig
              .map(([key, c]) => {
                const color = c.theme?.[theme as keyof typeof c.theme] ?? c.color
                return color ? `  --color-${key}: ${color};` : null
              })
              .filter(Boolean)
              .join("\n")
            return `${prefix} [data-chart=${id}] {\n${vars}\n}`
          })
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelFormatter?: (label: string, payload: any[]) => React.ReactNode
  labelClassName?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any, name: string, item: any, i: number, payload: any) => React.ReactNode
  color?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel,
      hideIndicator,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
    },
    ref,
  ) => {
    const { config } = useChart()
    if (!active || !payload?.length) return null

    const tooltipLabel = !hideLabel ? (
      <div className={cn("font-medium text-text-strong-950", labelClassName)}>
        {labelFormatter ? labelFormatter(label as string, payload) : (label as React.ReactNode)}
      </div>
    ) : null

    return (
      // Figma Widgets (e.g. 3963:6854 Stacked Bar Chart) axis labels = 12/16 weight 400.
      // Tooltip body uses Dash shadow-tooltip token + stroke-soft-200 1px border + bg-white-0
      // for elevation consistency with Tooltip [1.1] (no dedicated chart-tooltip in Figma).
      <div
        ref={ref}
        className={cn(
          "grid min-w-32 items-start gap-1.5 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2.5 py-1.5 text-xs shadow-tooltip",
          className,
        )}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item: Record<string, unknown>, i: number) => {
            const name = (item.name as string) || (item.dataKey as string) || "value"
            const key = nameKey || name
            const itemConfig = config[key]
            const indicatorColor =
              color || (item.payload as Record<string, string> | undefined)?.fill || (item.color as string)
            const itemValue = item.value as number | string | undefined
            return (
              <div
                key={(item.dataKey as string)?.toString() ?? i}
                className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-text-soft-400"
              >
                {formatter && itemValue !== undefined && name ? (
                  formatter(itemValue, name, item, i, item.payload)
                ) : (
                  <>
                    {!hideIndicator ? (
                      <div
                        className={cn(
                          "shrink-0 rounded-sm border-(--color-border) bg-(--color-bg)",
                          indicator === "dot" && "size-2.5",
                          indicator === "line" && "w-1",
                          indicator === "dashed" && "w-0 border-[1.5px] border-dashed bg-transparent",
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    ) : null}
                    <div className="flex flex-1 justify-between leading-none">
                      <div className="grid gap-1.5">
                        <span className="text-text-sub-600">{itemConfig?.label || name}</span>
                      </div>
                      {itemValue !== undefined ? (
                        <span className="font-medium tabular-nums text-text-strong-950">
                          {Number(itemValue).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

type LegendContentProps = React.ComponentProps<"div"> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  verticalAlign?: "top" | "bottom" | "middle"
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, LegendContentProps>(
  ({ className, hideIcon, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart()
    if (!payload?.length) return null
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className,
        )}
      >
        {payload.map((item: Record<string, unknown>) => {
          const dataKey = (item.dataKey as string) || "value"
          const key = nameKey || dataKey
          const itemConfig = config[key]
          return (
            <div
              key={String(item.value)}
              className="flex items-center gap-1.5 [&>svg]:size-3 text-text-sub-600"
            >
              {!hideIcon ? (
                <div
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color as string }}
                />
              ) : null}
              {itemConfig?.label ?? (item.value as React.ReactNode)}
            </div>
          )
        })}
      </div>
    )
  },
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  useChart,
}
