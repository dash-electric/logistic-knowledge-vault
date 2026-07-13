"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * ButtonGroup — Figma 1:1 parity (node 493:8644 + items 226:4669, paste verified
 * 2026-05-17).
 *
 * Figma layout: a stroke-1px gray-200 ring container with r=8, holding 2-6
 * children that share its outer corners. Children have NO own radius; their
 * borders collapse into the container ring.
 *
 * Quantity (Figma axis) is implicit — render as many <ButtonGroupItem /> /
 * <Button /> children as needed.
 *
 * Size axis (canonical, matches Figma):
 *   md  → 36px height  ("Small (36)" in Figma; default)
 *   sm  → 32px height  ("X-Small (32)")
 *   xs  → 24px height  ("2X-Small (24)")
 *
 * Item state colors (from Figma):
 *   Default  bg white          text text-sub-600
 *   Hover    bg bg-weak-50     text text-sub-600
 *   Active   bg bg-weak-50     text text-strong-950 (selected pill)
 *   Disabled bg bg-weak-50     text text-disabled-300
 *
 * Backward-compatible: `orientation` and `attached` props retained. When
 * `attached=false`, items render with gap-2 and individual radius (NOT the
 * Figma canonical look — kept for Dash blocks that need a spaced cluster).
 */

const buttonGroupVariants = cva(
  [
    "inline-flex isolate",
    // Default (attached, Figma-canonical): container ring + child border collapse
    "[&>[data-slot=button]:focus-visible]:relative [&>[data-slot=button]:focus-visible]:z-10",
    "[&>[data-slot=button-group-item]:focus-visible]:relative [&>[data-slot=button-group-item]:focus-visible]:z-10",
  ].join(" "),
  {
    variants: {
      orientation: {
        horizontal: cn(
          "flex-row",
          // Outer container ring (Figma: 1px stroke-soft-200 around the whole group)
          "border border-stroke-soft-200 rounded-lg",
          // Children: strip own radius, share outer rounded
          "[&>[data-slot=button]]:rounded-none",
          "[&>[data-slot=button-group-item]]:rounded-none",
          "[&>[data-slot=button]:first-child]:rounded-l-[7px]",
          "[&>[data-slot=button]:last-child]:rounded-r-[7px]",
          "[&>[data-slot=button-group-item]:first-child]:rounded-l-[7px]",
          "[&>[data-slot=button-group-item]:last-child]:rounded-r-[7px]",
          // Separators between siblings
          "[&>[data-slot=button]:not(:first-child)]:border-l [&>[data-slot=button]:not(:first-child)]:border-stroke-soft-200",
          "[&>[data-slot=button-group-item]:not(:first-child)]:border-l [&>[data-slot=button-group-item]:not(:first-child)]:border-stroke-soft-200",
        ),
        vertical: cn(
          "flex-col",
          "border border-stroke-soft-200 rounded-lg",
          "[&>[data-slot=button]]:rounded-none",
          "[&>[data-slot=button-group-item]]:rounded-none",
          "[&>[data-slot=button]:first-child]:rounded-t-[7px]",
          "[&>[data-slot=button]:last-child]:rounded-b-[7px]",
          "[&>[data-slot=button-group-item]:first-child]:rounded-t-[7px]",
          "[&>[data-slot=button-group-item]:last-child]:rounded-b-[7px]",
          "[&>[data-slot=button]:not(:first-child)]:border-t [&>[data-slot=button]:not(:first-child)]:border-stroke-soft-200",
          "[&>[data-slot=button-group-item]:not(:first-child)]:border-t [&>[data-slot=button-group-item]:not(:first-child)]:border-stroke-soft-200",
        ),
      },
      attached: {
        true: "",
        false: "border-0 gap-2 [&>[data-slot=button]]:rounded-md [&>[data-slot=button-group-item]]:rounded-md [&>[data-slot=button]:not(:first-child)]:border-0 [&>[data-slot=button-group-item]:not(:first-child)]:border-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      attached: true,
    },
  },
)

export type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof buttonGroupVariants> & {
    asChild?: boolean
  }

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation, attached, role = "group", ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      data-slot="button-group"
      data-orientation={orientation ?? "horizontal"}
      data-attached={attached === false ? "false" : "true"}
      className={cn(buttonGroupVariants({ orientation, attached }), className)}
      {...props}
    />
  ),
)
ButtonGroup.displayName = "ButtonGroup"

/* -------------------------------------------------------------------------- */
/* ButtonGroupItem — Figma node 226:4669 (Button Group Items componentSet)    */
/*                                                                            */
/* A neutral-stroke button styled specifically for ButtonGroup. Use when you  */
/* want the exact Figma look (white bg + gray text + hover/active fill).      */
/* Regular <Button> works inside ButtonGroup too — pick whichever fits.       */
/* -------------------------------------------------------------------------- */

const buttonGroupItemVariants = cva(
  [
    "inline-flex items-center justify-center font-medium",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
    "bg-bg-white-0 text-text-sub-600",
    "hover:bg-bg-weak-50",
    "data-[active=true]:bg-bg-weak-50 data-[active=true]:text-text-strong-950",
    "aria-pressed:bg-bg-weak-50 aria-pressed:text-text-strong-950",
    "disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300",
    "select-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      size: {
        // Figma exact: Small (36) default
        xs: "h-6 px-3 text-xs gap-1 [&_svg]:size-4",  // 2X-Small (24): pad 4/12 gap=4 text-xs
        sm: "h-8 px-3.5 text-sm gap-1.5 [&_svg]:size-4", // X-Small (32): pad 6/14 gap=6
        md: "h-9 px-4 text-sm gap-2 [&_svg]:size-5",   // Small (36): pad 8/16 gap=8 (default)
      },
    },
    defaultVariants: { size: "md" },
  },
)

export type ButtonGroupItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonGroupItemVariants> & {
    asChild?: boolean
    /** Renders the item in its "selected" appearance (matches Figma "Active" state). */
    active?: boolean
  }

const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ className, size, asChild, active, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        data-slot="button-group-item"
        data-active={active ? "true" : undefined}
        className={cn(buttonGroupItemVariants({ size }), className)}
        {...props}
      />
    )
  },
)
ButtonGroupItem.displayName = "ButtonGroupItem"

const ButtonGroupSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      data-slot="button-group-separator"
      className={cn("self-stretch w-px bg-stroke-soft-200", className)}
      {...props}
    />
  ),
)
ButtonGroupSeparator.displayName = "ButtonGroupSeparator"

export { ButtonGroup, ButtonGroupItem, ButtonGroupSeparator, buttonGroupVariants, buttonGroupItemVariants }
