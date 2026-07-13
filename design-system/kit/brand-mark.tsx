"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * BrandMark — circular icon container used at the top of auth blocks. Maps to
 * Figma "Key Icons [1.1]" (node 263:1844) which ships 5 sizes (32/40/48/56/64)
 * fully round with optional Stroke/Lighter style + 9 colour tints. Dash adds
 * a `square` shape (rounded-2xl) for the legacy 96px auth illustration block.
 *
 * Figma canonical Stroke Gray:
 *   bg #FFF (bg-white-0) · 1px border #EAEAEA (stroke-soft-200) · icon #5C5C5C
 *   icon = 50% of container (16/20/24/28/32 for sizes 32/40/48/56/64)
 */

const brandMarkVariants = cva(
  cn(
    "inline-flex items-center justify-center shrink-0",
  ),
  {
    variants: {
      shape: {
        round: "rounded-full",
        square: "rounded-2xl",
      },
      size: {
        // Figma canonical: 32/40/48/56/64
        xs: "size-8 [&_svg]:size-4",
        sm: "size-10 [&_svg]:size-5",
        md: "size-12 [&_svg]:size-6",
        lg: "size-14 [&_svg]:size-7",
        xl: "size-16 [&_svg]:size-8",
        // Dash extension — 96px auth surface
        "2xl": "size-24 [&_svg]:size-10",
      },
      tone: {
        primary: "bg-primary text-static-white",
        neutral:
          "bg-bg-white-0 text-icon-sub-600 border border-stroke-soft-200",
        soft:
          "bg-bg-weak-50 text-text-strong-950 border border-stroke-soft-200",
        custom: "",
      },
    },
    defaultVariants: { shape: "round", size: "md", tone: "primary" },
  },
)

type BrandMarkProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof brandMarkVariants>

const BrandMark = React.forwardRef<HTMLDivElement, BrandMarkProps>(
  ({ className, shape, size, tone, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="brand-mark"
      className={cn(brandMarkVariants({ shape, size, tone }), className)}
      {...props}
    />
  ),
)
BrandMark.displayName = "BrandMark"

export { BrandMark, brandMarkVariants }
