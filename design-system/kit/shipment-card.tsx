"use client"

import * as React from "react"
import { cn } from "./lib/utils"
import { AddressPair, type AddressPoint } from "./address-pair"

/**
 * ShipmentCard — the recipient-facing order card: tracking number, a status
 * badge, the from → to pair, and a facts row (ETA, items, weight, courier). Slot
 * a <DeliveryTracker> or <DeliveryTimeline> in as children for the status view.
 *
 * GSM: hairline card, no shadow. Tracking number in mono, figures tabular. The
 * status pill is a slot — pass the kit's <Badge status=…> so tone stays
 * consistent with the rest of the app.
 */
export type ShipmentFact = { label: React.ReactNode; value: React.ReactNode }

export type ShipmentCardProps = React.HTMLAttributes<HTMLDivElement> & {
  trackingNumber: React.ReactNode
  /** A status pill — pass <Badge status="…">. */
  status?: React.ReactNode
  from: AddressPoint
  to: AddressPoint
  /** Facts strip below the addresses (ETA, items, weight, courier…). */
  facts?: ShipmentFact[]
  actions?: React.ReactNode
  footer?: React.ReactNode
}

export const ShipmentCard = React.forwardRef<HTMLDivElement, ShipmentCardProps>(
  ({ trackingNumber, status, from, to, facts, actions, footer, className, children, ...props }, ref) => (
    <section ref={ref} className={cn("flex flex-col rounded-md border border-stroke-soft-200 bg-bg-white-0", className)} data-slot="shipment-card" {...props}>
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <div className="gsm-label text-[10px] text-text-soft-400">Tracking no.</div>
          <div className="truncate font-mono text-sm text-text-strong-950">{trackingNumber}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status}
          {actions}
        </div>
      </header>

      <div className="px-4 py-3.5">
        <AddressPair from={from} to={to} />
      </div>

      {facts && facts.length ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-stroke-soft-200 px-4 py-3">
          {facts.map((f, i) => (
            <div key={i} className="min-w-0">
              <dt className="gsm-label text-[10px] text-text-soft-400">{f.label}</dt>
              <dd className="truncate text-sm tabular-nums text-text-strong-950">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children ? <div className="border-t border-stroke-soft-200 px-4 py-3.5">{children}</div> : null}

      {footer ? <footer className="border-t border-stroke-soft-200 px-4 py-2.5 text-xs text-text-sub-600">{footer}</footer> : null}
    </section>
  ),
)
ShipmentCard.displayName = "ShipmentCard"
