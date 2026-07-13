"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * DiscountLineItem — Ported from Dash Next Portal v2.
 *
 * Single row in a payment-breakdown table: "Discount (20%) -Rp12,500".
 * Renders nothing when there's no discount, so callers can drop it in
 * unconditionally. Pairs with PriceWithDiscount.
 */
export type DiscountLineItemProps = {
  amount: number
  discountAmount: number
  /** Label, defaults to "Discount". */
  label?: React.ReactNode
  /** Formatter — default = "Rp" prefix, id-ID locale. */
  format?: (n: number) => string
  className?: string
}

const defaultFmt = (n: number) =>
  "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n || 0))

const DiscountLineItem = React.forwardRef<HTMLDivElement, DiscountLineItemProps>(
  (
    {
      amount,
      discountAmount,
      label = "Discount",
      format = defaultFmt,
      className,
    },
    ref,
  ) => {
    if (!discountAmount || discountAmount <= 0) return null
    const percent =
      amount > 0 ? Math.round((discountAmount / amount) * 100) : 0
    return (
      <div
        ref={ref}
        data-slot="discount-line-item"
        className={cn("flex items-center justify-between", className)}
      >
        <p className="flex items-center gap-1 text-sm text-text-sub-600">
          {label}
          {percent > 0 && (
            <span className="text-xs text-text-sub-600">({percent}%)</span>
          )}
        </p>
        <p className="text-sm font-medium tabular-nums text-(--state-success-base)">
          -{format(discountAmount)}
        </p>
      </div>
    )
  },
)
DiscountLineItem.displayName = "DiscountLineItem"

export { DiscountLineItem }
