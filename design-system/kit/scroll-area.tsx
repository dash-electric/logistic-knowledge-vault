"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "./lib/utils"

/**
 * ScrollArea — Figma 1:1 parity (node 166941:61889 "Scroll [1.1]").
 *
 * Variants:
 *   size:  x-small (12px track) | small (16px track) | medium (20px track, default)
 *   style: default (white track + stroke-soft border + soft thumb)
 *          lighter (bg-weak-50 track + stronger thumb)
 *
 * Thumb is always 4px (rounded-full). Track has 1px stroke-soft-200 border.
 */

type ScrollAreaSize = "x-small" | "small" | "medium"
type ScrollAreaStyle = "default" | "lighter"

type ScrollAreaContextValue = {
  size: ScrollAreaSize
  variant: ScrollAreaStyle
}

const ScrollAreaContext = React.createContext<ScrollAreaContextValue>({
  size: "medium",
  variant: "default",
})

type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  size?: ScrollAreaSize
  variant?: ScrollAreaStyle
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, size = "medium", variant = "default", ...props }, ref) => (
  <ScrollAreaContext.Provider value={{ size, variant }}>
    <ScrollAreaPrimitive.Root
      ref={ref}
      data-slot="scroll-area-root"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="h-full w-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  </ScrollAreaContext.Provider>
))
ScrollArea.displayName = "ScrollArea"

// Figma node 166941:61888..61885 — track widths per size variant
const trackSizeMap: Record<ScrollAreaSize, { vertical: string; horizontal: string }> = {
  "x-small": { vertical: "w-3", horizontal: "h-3" }, // 12px
  small: { vertical: "w-4", horizontal: "h-4" }, // 16px
  medium: { vertical: "w-5", horizontal: "h-5" }, // 20px
}

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => {
  const { size, variant } = React.useContext(ScrollAreaContext)
  const dims = trackSizeMap[size]
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      data-slot="scroll-area-scrollbar"
      data-size={size}
      data-variant={variant}
      className={cn(
        // Figma: 1px stroke-soft-200 border on entire track; bg per variant
        "flex touch-none select-none transition-colors border-stroke-soft-200",
        variant === "default" ? "bg-bg-white-0" : "bg-bg-weak-50",
        orientation === "vertical" && cn("h-full border-l", dims.vertical),
        orientation === "horizontal" && cn("flex-col border-t", dims.horizontal),
        // Center 4px thumb inside the wider track
        "items-center justify-center",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className={cn(
          // Figma: 4px thumb, rounded-full
          "relative rounded-full transition-colors",
          orientation === "vertical" ? "w-1" : "h-1",
          orientation === "vertical" ? "flex-1" : "flex-1",
          // Figma 166941:61888 default thumb = rgba(0.92,0.92,0.92) = stroke-soft-200
          // Figma 166941:61886 lighter thumb = rgba(0.82,0.82,0.82) = stroke-sub-300
          variant === "default" ? "bg-stroke-soft-200" : "bg-stroke-sub-300",
          "hover:bg-stroke-strong-950/40",
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
})
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
export type { ScrollAreaSize, ScrollAreaStyle }
