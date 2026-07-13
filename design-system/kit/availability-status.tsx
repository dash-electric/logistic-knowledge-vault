"use client"

import * as React from "react"
import { RiCheckLine as Check, RiCloseLine as X } from "@remixicon/react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip"
import { cn } from "./lib/utils"

/**
 * AvailabilityStatus — Ported from Dash Next Portal v2.
 *
 * Tooltip-augmented pill that signals real-time service availability.
 * Distinct from Badge — this implies a live signal, not a category.
 */
export type AvailabilityStatusKind = "available" | "unavailable"

export type AvailabilityStatusProps = {
  status: AvailabilityStatusKind
  label?: React.ReactNode
  tooltipTitle?: React.ReactNode
  tooltipDescription?: React.ReactNode
  className?: string
}

const AvailabilityStatus = React.forwardRef<
  HTMLDivElement,
  AvailabilityStatusProps
>(
  (
    { status, label, tooltipTitle, tooltipDescription, className },
    ref,
  ) => {
    const isUp = status === "available"
    const Icon = isUp ? Check : X
    const defaultLabel = isUp ? "Drivers available" : "No drivers nearby"
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              data-slot="availability-status"
              data-status={status}
              className={cn(
                "inline-flex cursor-help items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-inset transition-colors",
                isUp
                  ? "bg-(--state-success-lighter) ring-(--state-success-base)/20 hover:bg-(--state-success-light)"
                  : "bg-(--state-error-lighter) ring-(--state-error-base)/20 hover:bg-(--state-error-light)",
                className,
              )}
            >
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  isUp ? "bg-(--state-success-base)" : "bg-(--state-error-base)",
                )}
              >
                <Icon className="size-3.5 text-static-white" />
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isUp ? "text-(--state-success-base)" : "text-(--state-error-base)",
                )}
              >
                {label ?? defaultLabel}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={5} className="max-w-[240px]">
            <div className="space-y-1">
              <p className="font-medium text-text-strong-950">
                {tooltipTitle ?? (isUp ? "Drivers are available" : "No drivers nearby")}
              </p>
              <p className="text-text-sub-600">
                {tooltipDescription ??
                  (isUp
                    ? "You can create deliveries now. We'll notify you if availability changes."
                    : "Try again in a few minutes — we're notifying nearby drivers.")}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  },
)
AvailabilityStatus.displayName = "AvailabilityStatus"

export { AvailabilityStatus }
