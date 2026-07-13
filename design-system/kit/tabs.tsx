"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Tabs — Figma 1:1 parity (Tab Menu node 553:734, paste verified 2026-05-17).
 *
 * Figma exposes TWO orientations:
 *
 *  - Horizontal (3511:9958 group / 3511:9832 items):
 *      • Outer frame: white card bg, stroke-soft border, 14px vertical pad,
 *        24px gap between items, label row height 20px.
 *      • Items: icon (text-sub-600 default, primary-base active) + label
 *        (text-sub-600 default, text-strong-950 hover/active) + optional
 *        2px primary underline bar when active.
 *      • State map:
 *        - Default: icon+text text-sub-600, no underline
 *        - Hover:   icon text-sub-600, text text-strong-950, no underline
 *        - Active:  icon primary-base, text text-strong-950, 2px primary
 *          underline bar (full item width).
 *
 *  - Vertical / Pill (3516:10411 group / 3515:10326 items):
 *      • Outer card optional (Card style = rounded-2xl + stroke; List style =
 *        no chrome). Item = 36px tall pill with 8px radius.
 *      • State map:
 *        - Default: text-sub-600 / bg transparent
 *        - Hover:   text-strong-950 / bg bg-weak-50
 *        - Active:  text-strong-950 / bg bg-weak-50 + 2px primary underline
 *          bar (same as horizontal). Icon primary-base on active.
 *
 * Dash exposes `variant="line"` (Figma horizontal) and `variant="pill"`
 * (Figma vertical / list-style — a row of 36px pills).
 */

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      // Figma horizontal: 24px gap, no border below the LIST (the underline
      // is per-trigger). We keep a hairline border on the list for visual
      // separation from page content.
      line: "h-10 gap-6 border-b border-stroke-soft-200 w-full",
      // Figma vertical list-style: 6px gap between pill items, no chrome
      pill: "h-9 gap-1.5",
    },
  },
  defaultVariants: { variant: "line" },
})

const tabsTriggerVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium",
    "transition-colors disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base",
    // Icon color follows state (see variants for primary swap on active)
    "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-icon-sub-600",
  ),
  {
    variants: {
      variant: {
        line: cn(
          // Figma horizontal item: 20px label row + 14px pad top/bot ≈ 48px,
          // but our list is h-10 so use -mb-px to align the 2px underline
          // bar with the list border-bottom.
          "h-10 -mb-px border-b-2 border-transparent px-1 text-text-sub-600",
          "hover:text-text-strong-950",
          "data-[state=active]:border-primary-base data-[state=active]:text-text-strong-950",
          "data-[state=active]:[&_svg]:text-primary-base",
        ),
        pill: cn(
          // Figma vertical list item: 36px tall, rounded-lg, 8px pad
          "h-9 rounded-lg px-2 text-text-sub-600",
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "data-[state=active]:bg-bg-weak-50 data-[state=active]:text-text-strong-950",
          "data-[state=active]:[&_svg]:text-primary-base",
        ),
      },
    },
    defaultVariants: { variant: "line" },
  },
)

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      data-variant={variant ?? "line"}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  ),
)
TabsList.displayName = "TabsList"

type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabsTriggerVariants>

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      "mt-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
