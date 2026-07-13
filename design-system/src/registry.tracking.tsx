import * as React from "react"
import type { Category } from "./registry"
import {
  AddressPair, DeliveryTracker, DeliveryTimeline, ShipmentCard, Badge,
} from "@dash-electric/logistic-kit"

/* Self-contained stand-in for a proof-of-delivery photo (no network dependency). */
const POD_THUMB =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='160' height='160' fill='#efefef'/><rect x='0.5' y='0.5' width='159' height='159' fill='none' stroke='#00000022'/><text x='80' y='86' font-family='monospace' font-size='18' letter-spacing='2' fill='#5C5C5C' text-anchor='middle'>POD</text></svg>",
  )

/* ── sample shipment data ───────────────────────────────────────────────── */

const FROM = { label: "Pickup", address: "Hub CGK-01 · Kemang", meta: "Jl. Kemang Raya 12, Jakarta Selatan" }
const TO = { label: "Drop-off", address: "Ricky Aprinaldi", meta: "Jl. Ampera Raya 88 · 0812-xxxx-1120" }

const trackerSteps = [
  { key: "created", label: "Ordered", at: "08:12" },
  { key: "picked", label: "Picked up", at: "09:40" },
  { key: "transit", label: "In transit", at: "10:05" },
  { key: "ofd", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
]

const timelineEvents = [
  { key: "created", title: "Order created", state: "done" as const, time: "08:12", location: "Dash app · Ricky Aprinaldi" },
  { key: "allocated", title: "Allocated to rider", state: "done" as const, time: "09:02", location: "Andi · MTR0002796" },
  { key: "picked", title: "Picked up at hub", state: "done" as const, time: "09:40", location: "Hub CGK-01 · Kemang" },
  { key: "transit", title: "In transit", state: "current" as const, time: "10:05", location: "Jl. Ampera Raya · 1.4 km away", description: "ETA 10:22" },
  { key: "ofd", title: "Out for delivery", state: "pending" as const },
  { key: "delivered", title: "Delivered", state: "pending" as const },
]

const deliveredTimeline = [
  { key: "picked", title: "Picked up at hub", state: "done" as const, time: "09:40", location: "Hub CGK-01 · Kemang" },
  { key: "transit", title: "In transit", state: "done" as const, time: "10:05" },
  { key: "delivered", title: "Delivered", state: "done" as const, time: "10:24", location: "Received by Ricky", description: "Left at front desk", proof: POD_THUMB },
]

const failedTracker = [
  { key: "created", label: "Ordered" },
  { key: "picked", label: "Picked up" },
  { key: "transit", label: "In transit" },
  { key: "ofd", label: "Delivery failed", state: "failed" as const },
  { key: "delivered", label: "Rescheduled", state: "pending" as const },
]

export const TRACKING_CATEGORIES: Category[] = [
  {
    id: "tracking",
    title: "Logistics · tracking",
    blurb:
      "The recipient-facing 'where's my parcel' surface. An ink rail with one purple 'you are here' moment — every state also carries a glyph, so color is never the only signal. Distinct from GanttTimeline (ops schedule), StepIndicator (form wizard), and ActivityFeed (collaboration).",
    demos: [
      {
        name: "AddressPair",
        description: "Origin → destination — the from/to block every delivery screen shows. Ink pickup dot, square drop-off pin, dashed hairline connector.",
        render: () => (
          <div className="w-full max-w-sm rounded-md border border-stroke-soft-200 bg-bg-white-0 p-4">
            <AddressPair from={FROM} to={TO} />
          </div>
        ),
      },
      {
        name: "DeliveryTracker",
        description: "Compact milestone bar for the top of a tracking screen. Pass `current`; states derive. Failed state overrides per step.",
        render: () => (
          <div className="flex w-full max-w-xl flex-col gap-6">
            <div className="rounded-md border border-stroke-soft-200 bg-bg-white-0 p-5">
              <DeliveryTracker steps={trackerSteps} current={2} />
            </div>
            <div className="rounded-md border border-stroke-soft-200 bg-bg-white-0 p-5">
              <DeliveryTracker steps={failedTracker} current={3} />
            </div>
          </div>
        ),
      },
      {
        name: "DeliveryTimeline",
        description: "Vertical status history for one parcel — timestamps, location, and a proof thumbnail on delivery. Current node is the one purple moment; pending nodes dim.",
        render: () => (
          <div className="grid w-full gap-4 md:grid-cols-2">
            <div className="rounded-md border border-stroke-soft-200 bg-bg-white-0 p-4">
              <div className="gsm-label mb-3 text-[10px] text-text-soft-400">In progress</div>
              <DeliveryTimeline events={timelineEvents} />
            </div>
            <div className="rounded-md border border-stroke-soft-200 bg-bg-white-0 p-4">
              <div className="gsm-label mb-3 text-[10px] text-text-soft-400">Delivered · with proof</div>
              <DeliveryTimeline events={deliveredTimeline} />
            </div>
          </div>
        ),
      },
      {
        name: "ShipmentCard",
        description: "Recipient order card — tracking no., status badge, from → to, facts strip. Slot a tracker or timeline in as children.",
        render: () => (
          <div className="grid w-full gap-4 lg:grid-cols-2">
            <ShipmentCard
              trackingNumber="BTH260626-BHNXXXU"
              status={<Badge status="information" type="dot">In transit</Badge>}
              from={FROM}
              to={TO}
              facts={[
                { label: "ETA", value: "10:22" },
                { label: "Items", value: "3" },
                { label: "Weight", value: "2.4 kg" },
                { label: "Courier", value: "Andi" },
              ]}
            >
              <DeliveryTracker steps={trackerSteps} current={2} />
            </ShipmentCard>

            <ShipmentCard
              trackingNumber="BTH260626-DLVRD01"
              status={<Badge status="success" type="dot">Delivered</Badge>}
              from={FROM}
              to={TO}
              facts={[
                { label: "Delivered", value: "10:24" },
                { label: "Items", value: "2" },
                { label: "Received by", value: "Ricky" },
              ]}
              footer="Delivered in 2h 12m · on time"
            >
              <DeliveryTimeline events={deliveredTimeline} />
            </ShipmentCard>
          </div>
        ),
      },
    ],
  },
]
