"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * CompactButton — Figma 1:1 parity (node 189:3646, verified 2026-05-17).
 *
 * The "mini" icon button. Use for close (X), expand/collapse, in-cell row
 * actions, sticker dismiss — anywhere a regular IconButton (28-44px) is
 * too large. Range here is 20-24px square.
 *
 * Figma axes:
 *   Style    : Stroke | Ghost | White | Modifiable → `variant`
 *              - stroke      : white bg + 1px stroke-soft-200 + soft depth shadow
 *              - ghost       : transparent bg, no border, icon text-text-soft-400
 *              - white       : solid bg-strong-950 + white icon (Figma "White" = filled dark)
 *              - modifiable  : transparent, no styling — bring your own bg/color
 *   Size     : Medium (20) | Large (24) → `size` (sm | md)
 *   State    : Default | Hover | Active | Disabled → CSS pseudo-classes
 *   fullRadius: Off (rounded-6) | On (rounded-full pill) → `fullRadius`
 *
 * Pair with a Remix Icon (e.g. RiCloseLine) sized at 14-16px. IconButton vs
 * CompactButton split:
 *   - CompactButton (20-24px): toast close, popover close, sticker dismiss,
 *                              data-cell inline action
 *   - IconButton    (28-44px): toolbar, table row action, header utility
 *
 * Accessibility: `aria-label` is required.
 */

const compactButtonVariants = cva(
  cn(
    "inline-flex items-center justify-center shrink-0",
    "transition-[background-color,color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-24) focus-visible:ring-offset-1 focus-visible:ring-offset-bg-white-0",
    "cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-transparent disabled:text-text-disabled-300 disabled:border-transparent disabled:shadow-none",
    "[&_svg]:shrink-0",
  ),
  {
    variants: {
      size: {
        // Figma exact:
        //   Medium (20) → 20×20, icon 14, r=6
        //   Large  (24) → 24×24, icon 16, r=6
        sm: "size-5 [&_svg]:size-3.5",
        md: "size-6 [&_svg]:size-4",
      },
      variant: {
        stroke: cn(
          "bg-bg-white-0 text-text-sub-600 border border-stroke-soft-200",
          "shadow-xs",
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "active:bg-bg-soft-200",
        ),
        ghost: cn(
          "bg-transparent text-text-soft-400 border border-transparent",
          "hover:bg-bg-weak-50 hover:text-text-sub-600",
          "active:bg-bg-soft-200 active:text-text-strong-950",
        ),
        white: cn(
          // Figma "White" tone = filled dark (the white refers to the icon glyph color)
          "bg-bg-strong-950 text-static-white border border-transparent",
          "hover:bg-bg-surface-800",
          "active:bg-bg-strong-950/90",
        ),
        modifiable: "bg-transparent border border-transparent",
      },
      fullRadius: {
        true: "rounded-full",
        false: "rounded-md", // 6px (--radius-6)
      },
    },
    defaultVariants: { size: "md", variant: "ghost", fullRadius: false },
  },
)

type CompactButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof compactButtonVariants> & {
    asChild?: boolean
    "aria-label": string
  }

const CompactButton = React.forwardRef<HTMLButtonElement, CompactButtonProps>(
  (
    { className, size, variant, fullRadius, asChild, type = "button", ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        data-slot="compact-button"
        data-variant={variant ?? "ghost"}
        data-full-radius={fullRadius || undefined}
        className={cn(compactButtonVariants({ size, variant, fullRadius }), className)}
        {...props}
      />
    )
  },
)
CompactButton.displayName = "CompactButton"

export { CompactButton, compactButtonVariants }
