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
 *
 * Dash divergence from Figma: the active underline + icon use ink
 * (strong-950), not accent purple — accent is punctuation, tabs are chrome.
 */

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      // Line tabs: padded triggers sitting on a shared hairline. (Figma drew
      // 24px gaps with text-hugging px-1 items — in real toolbars that reads
      // sparse and gives tiny click targets, so triggers carry the padding.)
      line: "h-10 gap-1 border-b border-stroke-soft-200 w-full",
      // Figma vertical list-style: 6px gap between pill items, no chrome
      pill: "h-9 gap-1.5",
    },
  },
  defaultVariants: { variant: "line" },
})

const tabsTriggerVariants = cva(
  cn(
    "group inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium",
    "transition-colors disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-base",
    // Icon color follows state (see variants for primary swap on active)
    "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-icon-sub-600",
  ),
  {
    variants: {
      variant: {
        line: cn(
          // -mb-px drops the 2px underline onto the list's hairline. px-3
          // gives the underline body and a real hover/click target.
          "h-10 -mb-px border-b-2 border-transparent px-3 text-text-sub-600",
          "hover:text-text-strong-950",
          "data-[state=active]:border-stroke-strong-950 data-[state=active]:text-text-strong-950",
          "data-[state=active]:[&_svg]:text-icon-strong-950",
        ),
        pill: cn(
          // Figma vertical list item: 36px tall, rounded-lg, 8px pad
          "h-9 rounded-lg px-2 text-text-sub-600",
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "data-[state=active]:bg-bg-weak-50 data-[state=active]:text-text-strong-950",
          "data-[state=active]:[&_svg]:text-icon-strong-950",
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

/**
 * TabsCount — small tabular count chip inside a TabsTrigger.
 * Neutral tint by default; flips to an ink pill on the active tab.
 */
const TabsCount = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="tabs-count"
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums",
        "bg-bg-weak-50 text-text-sub-600",
        "group-data-[state=active]:bg-bg-strong-950 group-data-[state=active]:text-text-white-0",
        className,
      )}
      {...props}
    />
  ),
)
TabsCount.displayName = "TabsCount"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      "mt-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-base",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount }
