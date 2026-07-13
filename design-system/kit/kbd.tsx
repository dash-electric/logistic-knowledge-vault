"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

const kbdVariants = cva(
  cn(
    "inline-flex items-center justify-center font-medium",
    "rounded-md border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600",
    "shadow-[inset_0_-1px_0_0_var(--stroke-soft-200)]",
  ),
  {
    variants: {
      size: {
        sm: "h-5 min-w-5 px-1 text-[10px]",
        md: "h-6 min-w-6 px-1.5 text-xs",
        lg: "h-7 min-w-7 px-2 text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type KbdProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof kbdVariants>

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, size, ...props }, ref) => (
    <kbd
      ref={ref}
      data-slot="kbd"
      className={cn(kbdVariants({ size }), className)}
      {...props}
    />
  ),
)
Kbd.displayName = "Kbd"

export { Kbd }
