"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * ItemRow — a single parcel/item line inside a stop (code + id, weight, volume).
 * Mono code, tabular figures so columns align down the list.
 */
export type ItemRowProps = React.HTMLAttributes<HTMLDivElement> & {
  code: React.ReactNode
  id?: React.ReactNode
  weightKg?: number
  volumeM3?: number
}

export const ItemRow = React.forwardRef<HTMLDivElement, ItemRowProps>(
  ({ code, id, weightKg, volumeM3, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="item-row"
      className={cn("flex items-center justify-between gap-3 py-1.5", className)}
      {...props}
    >
      <div className="min-w-0">
        <p className="gsm-mono truncate text-xs font-medium text-text-strong-950">{code}</p>
        {id ? <p className="gsm-mono truncate text-[11px] text-text-soft-400">{id}</p> : null}
      </div>
      {weightKg != null || volumeM3 != null ? (
        <p className="shrink-0 gsm-mono text-[11px] tabular-nums text-text-sub-600">
          {weightKg != null ? `${weightKg.toFixed(2)} kg` : ""}
          {weightKg != null && volumeM3 != null ? " · " : ""}
          {volumeM3 != null ? `${volumeM3.toFixed(3)} m³` : ""}
        </p>
      ) : null}
    </div>
  ),
)
ItemRow.displayName = "ItemRow"
