"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Switch — Figma parity v2 (node 379:6649 → Switch [1.1]).
 *
 * Figma sizes (track w × h / thumb):
 *  - Default (28×16 track, 12px thumb) — primary spec
 *  - Off  : track bg-soft-200 · thumb white
 *  - On   : track primary · thumb white
 *  - Hover: track stroke-sub-300 (Off) / primary-darker (On)
 *  - Disabled: track bg-white-0 · thumb stroke-soft-200
 * Dash extension: `sm` / `lg` scales — Figma ships single 28×16 size only.
 */
const switchVariants = cva(
  cn(
    "peer inline-flex shrink-0 cursor-pointer items-center rounded-full",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Off: stroke-soft-200 (Figma uses stroke-soft-200 token #ebebeb)
    "data-[state=unchecked]:bg-stroke-soft-200 hover:data-[state=unchecked]:bg-stroke-sub-300",
    // On: primary purple, darken on hover (Figma hover = primary-darker)
    "data-[state=checked]:bg-primary hover:data-[state=checked]:bg-primary-darker",
  ),
  {
    variants: {
      size: {
        // Dash extension (smaller — keep callers using sm visually consistent)
        sm: "h-3.5 w-6 [&>span]:size-2.5 data-[state=checked]:[&>span]:translate-x-2.5",
        // Figma default — track 28×16, thumb 12px
        md: "h-4 w-7 [&>span]:size-3 data-[state=checked]:[&>span]:translate-x-3",
        // Dash extension (larger)
        lg: "h-5 w-9 [&>span]:size-4 data-[state=checked]:[&>span]:translate-x-4",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants>

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, size, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-static-white shadow-switch-thumb",
          "transition-transform duration-(--duration-fast) ease-(--ease-out)",
          "translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  ),
)
Switch.displayName = "Switch"

export { Switch }
