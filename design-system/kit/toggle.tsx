"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

const toggleVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium",
    "transition-colors disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "hover:bg-bg-weak-50 hover:text-text-strong-950",
    "data-[state=on]:bg-bg-weak-50 data-[state=on]:text-text-strong-950",
    "text-text-sub-600",
  ),
  {
    variants: {
      variant: {
        default: "",
        outline: "border border-stroke-soft-200 bg-bg-white-0 data-[state=on]:bg-bg-weak-50",
      },
      size: {
        sm: "h-8 px-2 [&_svg]:size-3.5",
        md: "h-9 px-2.5 [&_svg]:size-4",
        lg: "h-10 px-3 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
)

type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>

const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Toggle.displayName = "Toggle"

export { Toggle, toggleVariants }
