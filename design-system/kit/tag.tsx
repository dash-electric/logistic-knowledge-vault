"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { RiCloseLine as X } from "@remixicon/react"
import { cn } from "./lib/utils"

// Figma Tag [1.1] node 417:12348 — canonical sm = 24h, py=4 px=8 gap=2 r=6,
// text 12/16 weight 500. Two styles (Gray / Stroke), 4 states.
//   Gray Default: bg #F7F7F7 (bg-weak-50) text #5C5C5C (text-sub-600)
//   Gray Hover: bg #FFF (bg-white-0) + 1px border #EAEAEA (stroke-soft-200)
//   Gray Active: bg #FFF + 1px border #161616 (stroke-strong-950) text #161616
//   Stroke Default: bg #FFF + border #EAEAEA text #5C5C5C
//   Stroke Hover: bg #F7F7F7 text #5C5C5C (no border)
//   Stroke Active: bg #FFF + border #161616 text #161616
//   Disabled (both): bg #F7F7F7 text #D1D1D1 (text-disabled-300)
const tagVariants = cva(
  cn(
    "inline-flex items-center gap-0.5 font-medium",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "data-[state=disabled]:pointer-events-none data-[state=disabled]:text-text-disabled-300 data-[state=disabled]:bg-bg-weak-50 data-[state=disabled]:border-transparent",
  ),
  {
    variants: {
      size: {
        // Dash extension xs/md retained for sub-/super-canonical sizes
        xs: "h-5 px-1.5 text-[10px] rounded-sm",
        sm: "h-6 px-2 py-1 text-xs leading-4 rounded-md",
        md: "h-7 px-2.5 text-sm rounded-md",
      },
      variant: {
        stroke: cn(
          "border bg-bg-white-0 border-stroke-soft-200 text-text-sub-600",
          "hover:bg-bg-weak-50 hover:border-transparent",
          "data-[state=active]:bg-bg-white-0 data-[state=active]:border-stroke-strong-950 data-[state=active]:text-text-strong-950",
        ),
        gray: cn(
          "border border-transparent bg-bg-weak-50 text-text-sub-600",
          "hover:bg-bg-white-0 hover:border-stroke-soft-200",
          "data-[state=active]:bg-bg-white-0 data-[state=active]:border-stroke-strong-950 data-[state=active]:text-text-strong-950",
        ),
        primary: "bg-bg-strong-950 text-text-white-0",
      },
    },
    defaultVariants: { size: "sm", variant: "stroke" },
  },
)

type TagProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tagVariants> & {
    onRemove?: () => void
    icon?: React.ReactNode
    /** Visual state — matches Figma Tag State variants. */
    state?: "default" | "active" | "disabled"
  }

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, size, variant, state = "default", onRemove, icon, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="tag"
      data-state={state}
      className={cn(tagVariants({ size, variant }), className)}
      {...props}
    >
      {icon ? <span aria-hidden className="-ml-0.5">{icon}</span> : null}
      <span>{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="-mr-0.5 inline-flex items-center justify-center rounded-sm size-3.5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
        >
          <X aria-hidden strokeWidth={2} className="size-3" />
        </button>
      ) : null}
    </span>
  ),
)
Tag.displayName = "Tag"

export { Tag, tagVariants }
