"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "./lib/utils"

/**
 * Popover — Figma 1:1 parity (node 553:22099 → ComponentSet 4431:81573).
 *
 * Container:
 *   width 320  | radius 16 (rounded-2xl) | bg bg-white-0
 *   stroke 1px stroke-soft-200          | shadow shadow-custom-shadows-medium
 *
 * Inner Content frame: pad 24 (p-6 — Dash grid, Figma was 20), gap 16 (vertical stack)
 * Inner Footer frame:  pad 16/20, gap 12 — supplied by consumer
 *
 * Previously shipped with bogus tokens `shadow-custom-md` (undefined) and
 * `rounded-xl p-4` (Figma uses rounded-2xl, content padding is 20).
 */

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor
const PopoverClose = PopoverPrimitive.Close

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      data-slot="popover-content"
      className={cn(
        "z-50 w-80 rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-6 shadow-custom-shadows-medium",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverContent }
