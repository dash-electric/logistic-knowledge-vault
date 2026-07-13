"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * AddressPair — origin → destination, the from/to block every delivery screen
 * shows. A filled ink dot for pickup, a square pin for drop-off, joined by a
 * dashed hairline. GSM: ink marks, no color (route color, if any, belongs on the
 * map, not here). Each endpoint carries a label, an address, and optional meta
 * (contact, window, distance).
 */
export type AddressPoint = {
  label?: React.ReactNode
  address: React.ReactNode
  meta?: React.ReactNode
}

export type AddressPairProps = React.HTMLAttributes<HTMLDivElement> & {
  from: AddressPoint
  to: AddressPoint
}

function Endpoint({ point, kind }: { point: AddressPoint; kind: "from" | "to" }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-0.5">
        {kind === "from" ? (
          <span className="size-2.5 rounded-full border-[3px] border-bg-strong-950 bg-bg-white-0" aria-hidden />
        ) : (
          <span className="size-2.5 rounded-[2px] bg-bg-strong-950" aria-hidden />
        )}
      </div>
      <div className="min-w-0 pb-0.5">
        {point.label ? <div className="gsm-label text-[10px] text-text-soft-400">{point.label}</div> : null}
        <div className="truncate text-sm text-text-strong-950">{point.address}</div>
        {point.meta ? <div className="mt-0.5 truncate text-xs text-text-sub-600">{point.meta}</div> : null}
      </div>
    </div>
  )
}

export const AddressPair = React.forwardRef<HTMLDivElement, AddressPairProps>(({ from, to, className, ...props }, ref) => (
  <div ref={ref} className={cn("relative", className)} data-slot="address-pair" {...props}>
    {/* dashed connector between the two dots (dot sits at x=5px, top ~7px) */}
    <span
      className="pointer-events-none absolute left-[4.5px] top-3 bottom-4 w-px border-l border-dashed border-stroke-sub-300"
      aria-hidden
    />
    <div className="flex flex-col gap-3">
      <Endpoint point={from} kind="from" />
      <Endpoint point={to} kind="to" />
    </div>
  </div>
))
AddressPair.displayName = "AddressPair"
