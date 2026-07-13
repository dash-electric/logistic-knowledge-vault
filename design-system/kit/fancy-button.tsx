"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * FancyButton — GSM-flattened emphasis button.
 *
 * The original carried a white sheen gradient (::before), stacked multi-layer
 * drop shadows, a 6px glow focus ring, and a press translate — all forbidden by
 * the GSM (rule 01: no glow / gradient / sheen; stable press states). Under the
 * GSM it collapses to a flat tone fill + 2px corners + hairline ring + the
 * standard focus ring, i.e. visually equivalent to <Button>. Kept as a distinct
 * export for source compatibility; prefer <Button> for new work.
 *
 *   Type : Neutral | Primary | Destructive | Basic → `tone`
 *   Size : Medium (40) | Small (36) | X-Small (32) + lg/xl extensions
 */

const fancyButtonVariants = cva(
  cn(
    "relative inline-flex items-center justify-center font-medium",
    "transition-[background-color,color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10) focus-visible:ring-offset-2 focus-visible:ring-offset-bg-white-0",
    "cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:shadow-none",
    "select-none",
    "[&_svg]:shrink-0",
  ),
  {
    variants: {
      tone: {
        // PRIMARY = the one ink surface (purple is punctuation, not a fill).
        primary: "bg-bg-strong-950 text-text-white-0 hover:bg-bg-strong-950/90 active:bg-bg-strong-950/80",
        neutral: "bg-bg-surface-800 text-text-white-0 hover:bg-bg-strong-950 active:bg-bg-strong-950/90",
        destructive: "bg-destructive text-static-white hover:bg-(--dash-red-700) active:bg-(--dash-red-800)",
        // Basic = white surface + hairline rule (GSM inset ring).
        stroke: "bg-bg-white-0 text-text-sub-600 shadow-xs hover:bg-bg-weak-50 hover:text-text-strong-950 active:bg-bg-weak-50",
      },
      size: {
        // Figma-canonical (paste verified 2026-05-17). Padding values match
        // Figma p-[6|8|10]; horizontal pad expanded so chevron + label fits.
        xs: "h-8 px-2.5 text-sm rounded-lg gap-1 [&_svg]:size-4",      // X-Small (32) r=8 pad=6
        sm: "h-9 px-3 text-sm rounded-lg gap-1 [&_svg]:size-4",        // Small (36)  r=8 pad=8
        md: "h-10 px-3.5 text-sm rounded-sm gap-1 [&_svg]:size-5", // Medium (40) r=10 pad=10 (default)
        // Dash extensions
        lg: "h-11 px-4 text-sm rounded-sm gap-1.5 [&_svg]:size-5",
        xl: "h-12 px-6 text-base rounded-sm gap-2 [&_svg]:size-5",
      },
    },
    defaultVariants: { tone: "primary", size: "md" },
  },
)

type FancyButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof fancyButtonVariants> & { asChild?: boolean }

const FancyButton = React.forwardRef<HTMLButtonElement, FancyButtonProps>(
  ({ className, tone, size, asChild, type = "button", children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        data-slot="fancy-button"
        data-tone={tone ?? "primary"}
        className={cn(fancyButtonVariants({ tone, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
FancyButton.displayName = "FancyButton"

export { FancyButton, fancyButtonVariants }
