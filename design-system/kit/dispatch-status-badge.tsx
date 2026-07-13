"use client"

import * as React from "react"
import { Badge } from "./badge"

/**
 * DispatchStatusBadge — maps a dispatch/trip lifecycle status to the right
 * semantic Badge. Status color is operational data (allowed under the GSM).
 */
export type DispatchStatus =
  | "planned"
  | "dispatched"
  | "in-progress"
  | "completed"
  | "deferred"
  | "cancelled"

const MAP: Record<DispatchStatus, { status: React.ComponentProps<typeof Badge>["status"]; label: string }> = {
  planned: { status: "feature", label: "Planned" },
  dispatched: { status: "information", label: "Dispatched" },
  "in-progress": { status: "warning", label: "In progress" },
  completed: { status: "success", label: "Completed" },
  deferred: { status: "away", label: "Deferred" },
  cancelled: { status: "error", label: "Cancelled" },
}

export type DispatchStatusBadgeProps = {
  status: DispatchStatus
  size?: React.ComponentProps<typeof Badge>["size"]
}

export function DispatchStatusBadge({ status, size = "sm" }: DispatchStatusBadgeProps) {
  const m = MAP[status] ?? MAP.planned
  return (
    <Badge status={m.status} appearance="lighter" size={size} type="dot">
      {m.label}
    </Badge>
  )
}
