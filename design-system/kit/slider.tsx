"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "./lib/utils"

/**
 * Slider — Figma parity v2 (node 2604:3416 → Slider [1.1]).
 *
 * Figma:
 *  - Track:  h=6 · radius full · BG stroke-soft-200 · Range primary-base
 *  - Thumb:  16px white circle with 6px primary inner dot (NOT a stroke).
 *  - Tooltip: shown above thumb when dragging (dash uses native title for now).
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const values = Array.isArray(props.value)
    ? props.value
    : Array.isArray(props.defaultValue)
      ? props.defaultValue
      : [0]
  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider-root"
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-stroke-soft-200"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary"
        />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className={cn(
            // Figma: 16px white disc, NO border, inner 6px primary dot via ::after
            "relative block size-4 rounded-full bg-bg-white-0 shadow-switch-thumb",
            "after:content-[''] after:absolute after:inset-0 after:m-auto",
            "after:size-1.5 after:rounded-full after:bg-primary",
            "ring-offset-background transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = "Slider"

export { Slider }
