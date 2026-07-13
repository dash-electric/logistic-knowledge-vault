"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * PriceWithDiscount — Ported from Dash Next Portal v2.
 *
 * Visual price-pair: original (struck-through) + final, or just final when no
 * discount. Three sizes. Discount provenance (the "why") lives in the
 * separate DiscountLineItem — this primitive is purely the price-pair visual.
 */
export type PriceWithDiscountSize = "xl" | "lg" | "md"

export type PriceWithDiscountProps = {
  amount: number
  discountAmount: number
  finalAmount: number
  /** Locale + currency formatting. Default = Indonesian Rupiah, no decimals. */
  format?: (n: number) => string
  size?: PriceWithDiscountSize
  className?: string
}

const finalSizeClass: Record<PriceWithDiscountSize, string> = {
  xl: "text-xl font-semibold",
  lg: "text-base font-semibold",
  md: "text-sm font-medium",
}

const strikeSizeClass: Record<PriceWithDiscountSize, string> = {
  xl: "text-sm",
  lg: "text-xs",
  md: "text-xs",
}

const defaultFmt = (n: number) =>
  "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n || 0))

const PriceWithDiscount = React.forwardRef<
  HTMLDivElement,
  PriceWithDiscountProps
>(
  (
    {
      amount,
      discountAmount,
      finalAmount,
      format = defaultFmt,
      size = "xl",
      className,
    },
    ref,
  ) => {
    const hasDiscount = discountAmount > 0

    if (!hasDiscount) {
      return (
        <p
          ref={ref as unknown as React.Ref<HTMLParagraphElement>}
          data-slot="price-with-discount"
          className={cn(finalSizeClass[size], "tabular-nums text-text-strong-950", className)}
        >
          {format(finalAmount || 0)}
        </p>
      )
    }

    return (
      <div
        ref={ref}
        data-slot="price-with-discount"
        className={cn("flex items-center gap-2 tabular-nums", className)}
      >
        <p className={cn(strikeSizeClass[size], "text-text-sub-600 line-through")}>
          {format(amount)}
        </p>
        <p className={cn(finalSizeClass[size], "text-text-strong-950")}>
          {format(finalAmount)}
        </p>
      </div>
    )
  },
)
PriceWithDiscount.displayName = "PriceWithDiscount"

export { PriceWithDiscount }
