"use client"

import * as React from "react"
import { RiNavigationLine, RiPhoneLine, RiCheckLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { Button } from "./button"
import { DistanceChip, ETAChip } from "./logistics-chips"

/**
 * NextStopCard — the rider's current target stop: big sequence badge, address,
 * distance + ETA, and large primary actions (Navigate, Call, Arrived). Built
 * for one-handed use: 44px+ targets, one clear primary (Arrived), Navigate hands
 * off to the system map app.
 */
export type NextStopCardProps = React.HTMLAttributes<HTMLDivElement> & {
  sequence: number
  color: string
  address: React.ReactNode
  recipient?: React.ReactNode
  distanceLabel?: React.ReactNode
  etaLabel?: React.ReactNode
  itemsLabel?: React.ReactNode
  onNavigate?: () => void
  onCall?: () => void
  onArrived?: () => void
}

export const NextStopCard = React.forwardRef<HTMLDivElement, NextStopCardProps>(
  ({ sequence, color, address, recipient, distanceLabel, etaLabel, itemsLabel, onNavigate, onCall, onArrived, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="next-stop-card"
      className={cn("rounded-sm border border-stroke-soft-200 bg-bg-white-0 p-4 shadow-card-sm", className)}
      {...props}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="gsm-label text-[10px] text-text-soft-400">Next stop</span>
        {itemsLabel ? <span className="text-xs tabular-nums text-text-sub-600">· {itemsLabel}</span> : null}
      </div>
      <div className="flex items-start gap-3">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums text-white"
          style={{ background: color }}
        >
          {sequence}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-snug text-text-strong-950">{address}</p>
          {recipient ? <p className="mt-0.5 truncate text-sm text-text-sub-600">{recipient}</p> : null}
          <div className="mt-1.5 flex items-center gap-3">
            {distanceLabel ? <DistanceChip>{distanceLabel}</DistanceChip> : null}
            {etaLabel ? <ETAChip>{etaLabel}</ETAChip> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {onArrived ? (
          <Button className="flex-1" leftIcon={<RiCheckLine />} onClick={onArrived}>
            Arrived
          </Button>
        ) : null}
        {onNavigate ? (
          <Button tone="neutral" style="stroke" aria-label="Navigate" onClick={onNavigate}>
            <RiNavigationLine />
          </Button>
        ) : null}
        {onCall ? (
          <Button tone="neutral" style="stroke" aria-label="Call recipient" onClick={onCall}>
            <RiPhoneLine />
          </Button>
        ) : null}
      </div>
    </div>
  ),
)
NextStopCard.displayName = "NextStopCard"
