"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * SegmentedControl — Figma 1:1 parity (node 553:14953, paste verified 2026-05-17).
 *
 * Two component sets:
 *  - Item (2603:2062): 3 types × 4 states. Item size 132×28, rounded-md (6px).
 *      Default state    → no fill, text-soft-400 (label "Label" appears
 *                          disabled-grey, indicating "this option exists but
 *                          isn't currently selected")
 *      Hover            → no fill, text-sub-600
 *      Active/Selected  → bg-white-0 fill, text-strong-950
 *      Disabled         → no fill, text-disabled-300
 *  - Group (2604:114): Track 36px tall, bg-weak-50, rounded-sm, 4px pad,
 *      4px gap between items.
 *
 * Sizing tokens (Figma exposes only 1 size — 36px track / 28px item).
 * Dash extends with sm/lg via vertical scale; md = Figma native.
 */

const segmentedRootVariants = cva(
  // Figma track: bg-weak-50, rounded-sm, 4px pad, 4px gap between items
  "inline-flex items-center rounded-sm bg-bg-weak-50 p-1 gap-1",
  {
    variants: {
      size: {
        sm: "h-8",
        md: "h-9",
        lg: "h-10",
      },
    },
    defaultVariants: { size: "md" },
  },
)

const segmentedItemVariants = cva(
  cn(
    // Figma item: rounded-md (6px), 14/20 font-medium
    "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium",
    "transition-colors",
    // Default = unselected: text-soft-400 (Figma "Default" state)
    "text-text-soft-400",
    // Hover bumps to text-sub-600 (Figma Hover state)
    "hover:text-text-sub-600",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base",
    // Active = bg-white-0 fill + text-strong-950 (Figma Active state)
    "data-[state=on]:bg-bg-white-0 data-[state=on]:text-text-strong-950 data-[state=on]:shadow-regular-xs",
    // Disabled
    "disabled:pointer-events-none disabled:text-text-disabled-300",
    // Icon color follows text
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      size: {
        sm: "h-6 px-2.5 text-xs",
        md: "h-7 px-3", // Figma native — 28px item inside 36px track
        lg: "h-8 px-3.5",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type SegmentedControlProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
  "type"
> &
  VariantProps<typeof segmentedRootVariants> & {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
  }

const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  SegmentedControlProps
>(({ className, size, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Root = ToggleGroupPrimitive.Root as any
  return (
    <Root
      ref={ref}
      type="single"
      data-slot="segmented-control"
      className={cn(segmentedRootVariants({ size }), className)}
      {...props}
    />
  )
})
SegmentedControl.displayName = "SegmentedControl"

type SegmentedItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof segmentedItemVariants>

const SegmentedItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  SegmentedItemProps
>(({ className, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    data-slot="segmented-item"
    className={cn(segmentedItemVariants({ size }), className)}
    {...props}
  />
))
SegmentedItem.displayName = "SegmentedItem"

export { SegmentedControl, SegmentedItem }
