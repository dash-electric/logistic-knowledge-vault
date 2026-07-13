"use client"

import * as React from "react"
import { RiLoader4Line as Loader2 } from "@remixicon/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

const spinnerVariants = cva("inline-block animate-spin", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
      xl: "size-8",
    },
    tone: {
      primary: "text-primary",
      neutral: "text-icon-sub",
      white: "text-white",
      destructive: "text-error-base",
    },
  },
  defaultVariants: { size: "md", tone: "primary" },
})

type SpinnerProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof spinnerVariants> & {
    label?: string
  }

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, tone, label = "Loading", ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      data-slot="spinner"
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      <Loader2 className={spinnerVariants({ size, tone })} strokeWidth={2.25} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  ),
)
Spinner.displayName = "Spinner"

export { Spinner }
