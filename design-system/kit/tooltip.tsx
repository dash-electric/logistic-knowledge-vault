"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Tooltip — Figma 1:1 parity (node 553:14954 → ComponentSet 2604:269).
 *
 * 3 sizes × 2 appearance (light/dark).
 *
 * Figma sizes (per spec):
 *   xs  "2X-Small (24)" → pad 2/6   | radius 4  | text 12/16 weight 400
 *   sm  "X-Small (34)"  → pad 4/10  | radius 6  | text 14/20 weight 400
 *   lg  "Large"         → pad 12/12 | radius 12 | text 14/20 weight 500 (+ desc + close)
 *
 * Appearance:
 *   light (default) → bg bg-white-0  | text text-strong-950 | shadow shadow-tooltip
 *   dark            → bg bg-strong-950 | text text-white-0
 *
 * Note: Dash previously shipped tooltip dark-only with shadcn-era shadow.
 * Figma source-of-truth defaults to LIGHT with the tokenized `shadow-tooltip`
 * (multi-layer with 1px ring). Dark variant exposed via `appearance="dark"`.
 */

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const tooltipContentVariants = cva(
  cn(
    "z-50 max-w-xs",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
    "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
    "data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1",
    "data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
  ),
  {
    variants: {
      size: {
        xs: "rounded-sm px-1.5 py-0.5 text-xs leading-4",
        sm: "rounded-md px-2.5 py-1 text-sm leading-5",
        lg: "rounded-xl p-3 text-sm leading-5 font-medium",
      },
      appearance: {
        light: "bg-bg-white-0 text-text-strong-950 shadow-tooltip",
        dark: "bg-bg-strong-950 text-text-white-0",
      },
    },
    defaultVariants: { size: "sm", appearance: "light" },
  },
)

type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
  VariantProps<typeof tooltipContentVariants>

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, size, appearance, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-slot="tooltip-content"
      className={cn(tooltipContentVariants({ size, appearance }), className)}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
