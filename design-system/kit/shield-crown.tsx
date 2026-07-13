"use client"

import * as React from "react"
import { RiShieldFill, RiVipCrown2Fill } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * ShieldCrown — Ported from Dash Next Portal v2.
 *
 * Composite trust icon: filled shield with a tiny crown centred inside.
 * Used for "verified VIP / trusted partner" affordances next to a name or row.
 */
export type ShieldCrownTone =
  | "away"
  | "primary"
  | "warning"
  | "feature"
  | "success"
export type ShieldCrownSize = "sm" | "md" | "lg"

export type ShieldCrownProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: ShieldCrownTone
  size?: ShieldCrownSize
}

const toneClass: Record<ShieldCrownTone, string> = {
  away: "text-(--state-warning-base)",
  primary: "text-primary",
  warning: "text-(--state-warning-base)",
  feature: "text-(--state-feature-base)",
  success: "text-(--state-success-base)",
}

const sizeShield: Record<ShieldCrownSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
}

const sizeCrown: Record<ShieldCrownSize, string> = {
  sm: "size-[7px] pb-[1px]",
  md: "size-[10px] pb-[1px]",
  lg: "size-[14px] pb-[1px]",
}

const ShieldCrown = React.forwardRef<HTMLSpanElement, ShieldCrownProps>(
  ({ tone = "away", size = "md", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="shield-crown"
        className={cn("relative inline-block", className)}
        aria-hidden
        {...props}
      >
        <RiShieldFill className={cn(sizeShield[size], toneClass[tone])} />
        <RiVipCrown2Fill
          className={cn(
            "absolute inset-0 m-auto text-static-white",
            sizeCrown[size],
          )}
        />
      </span>
    )
  },
)
ShieldCrown.displayName = "ShieldCrown"

export { ShieldCrown }
