"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { RiLoader4Line as Loader2 } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Button — Figma 1:1 parity (node 129:1422, paste verified 2026-05-17).
 *
 * Figma axes:
 *   Type    : Primary | Neutral | Error          → `tone` (primary | neutral | destructive)
 *   Style   : Filled | Stroke | Lighter | Ghost  → `style`
 *   State   : Default | Hover | Focus | Disabled → CSS pseudo-classes
 *   Size    : Medium (40) | Small (36) | X-Small (32) | 2X-Small (28) → `size`
 *   Only Icon: Off | On                          → use `IconButton` instead
 *
 * Size metrics (Figma exact):
 *   2xs (28) → r=8, pad 4/6, gap=2, text-sm/icon=16
 *   xs  (32) → r=8, pad 6/6, gap=2, text-sm/icon=16
 *   sm  (36) → r=8, pad 8/8, gap=4, text-sm/icon=20
 *   md  (40) → r=10, pad 10/10, gap=4, text-sm/icon=20  (Figma Medium = default)
 *   lg / xl  → Dash extensions (not in Figma), retained for shipped blocks
 *
 * Color tokens map (Filled state):
 *   Primary     bg --primary-base / text static-white  (hover: --primary-dark)
 *   Neutral     bg bg-strong-950  / text static-white  (hover: bg-strong-950 + darker)
 *   Destructive bg --state-error-base / text static-white (hover: --dash-red-700)
 *
 * Note: `light` style is a Dash convenience (NOT in Figma — only Filled/Stroke/Lighter/Ghost).
 * Kept for backward compat. `link` style is a Dash shortcut, use LinkButton for canonical.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center font-medium",
    "transition-[background-color,color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10) focus-visible:ring-offset-2 focus-visible:ring-offset-bg-white-0",
    "cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:border-transparent disabled:shadow-none",
    "select-none",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      size: {
        // Figma-canonical sizes (paste verified 2026-05-17). Maps:
        //   xs (28) → Figma "2X-Small"  r=8 pad=4/6  gap=2 text-sm
        //   sm (32) → Figma "X-Small"   r=8 pad=6/6  gap=2 text-sm
        //   md (36) → Figma "Small"     r=8 pad=8/8  gap=4 text-sm
        //   lg (40) → Figma "Medium"    r=10 pad=10/10 gap=4 text-sm  (default)
        //   xl (44) → Dash extension (not in Figma) — for hero CTA
        xs: "h-7 px-2.5 py-1 text-sm rounded-lg gap-0.5 [&_svg]:size-4",
        sm: "h-8 px-2.5 py-1.5 text-sm rounded-lg gap-0.5 [&_svg]:size-4",
        md: "h-9 px-3 py-2 text-sm rounded-lg gap-1 [&_svg]:size-5",
        lg: "h-10 px-3.5 py-2.5 text-sm rounded-sm gap-1 [&_svg]:size-5",
        xl: "h-11 px-4 text-base rounded-sm gap-1.5 [&_svg]:size-5",
        // Icon-only square variants (Figma "Only Icon=On" — same pad/radius)
        "icon-xs": "size-7 rounded-lg [&_svg]:size-4",
        "icon-sm": "size-8 rounded-lg [&_svg]:size-4",
        "icon-md": "size-9 rounded-lg [&_svg]:size-5",
        "icon-lg": "size-10 rounded-sm [&_svg]:size-5",
        "icon-xl": "size-11 rounded-sm [&_svg]:size-5",
      },
      style: {
        // Figma canon: Filled | Stroke | Lighter | Ghost (4 styles).
        // `link` is a Dash convenience shortcut — use LinkButton for canonical.
        filled: "border-transparent",
        stroke: "border bg-transparent",
        lighter: "border-transparent",
        ghost: "border-transparent bg-transparent",
        link: "border-transparent bg-transparent underline-offset-4 hover:underline px-0 h-auto",
      },
      tone: {
        primary: "",
        neutral: "",
        destructive: "",
      },
    },
    compoundVariants: [
      // PRIMARY — GSM: primary CTA is the one INK surface (purple is punctuation,
      // never a button fill). Uses the inverse-surface token pair so it flips
      // correctly in dark mode (ink→white bg, white→ink text). Purple stays on
      // the stroke / lighter / ghost / link styles below.
      { tone: "primary", style: "filled", className: "bg-bg-strong-950 text-text-white-0 hover:bg-bg-strong-950/90 active:bg-bg-strong-950/80" },
      { tone: "primary", style: "stroke", className: "bg-bg-white-0 border-primary text-primary hover:bg-(--primary-alpha-10) active:bg-(--primary-alpha-16)" },
      { tone: "primary", style: "lighter", className: "bg-(--primary-alpha-10) text-primary hover:bg-(--primary-alpha-16) active:bg-(--primary-alpha-24)" },
      { tone: "primary", style: "ghost", className: "text-primary hover:bg-(--primary-alpha-10) active:bg-(--primary-alpha-16)" },
      { tone: "primary", style: "link", className: "text-primary hover:underline underline-offset-4" },

      // NEUTRAL — source Figma mapping (sub-600 text, surface-800 fill, stroke-soft-200 border + shadow-regular-xs on stroke)
      { tone: "neutral", style: "filled", className: "bg-bg-surface-800 text-text-white-0 hover:bg-bg-strong-950 active:bg-bg-strong-950/90" },
      { tone: "neutral", style: "stroke", className: "bg-bg-white-0 border-stroke-soft-200 text-text-sub-600 shadow-xs hover:bg-bg-weak-50 hover:text-text-strong-950 active:bg-bg-weak-50" },
      { tone: "neutral", style: "lighter", className: "bg-bg-weak-50 text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950 active:bg-bg-soft-200" },
      { tone: "neutral", style: "ghost", className: "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 active:bg-bg-soft-200" },
      { tone: "neutral", style: "link", className: "text-text-sub-600 hover:text-text-strong-950 hover:underline underline-offset-4" },

      // DESTRUCTIVE — source Figma mapping
      { tone: "destructive", style: "filled", className: "bg-destructive text-static-white hover:bg-(--dash-red-700) active:bg-(--dash-red-800)" },
      { tone: "destructive", style: "stroke", className: "bg-bg-white-0 border-destructive text-destructive hover:bg-(--dash-red-alpha-10) active:bg-(--dash-red-alpha-16)" },
      { tone: "destructive", style: "lighter", className: "bg-(--dash-red-alpha-10) text-destructive hover:bg-(--dash-red-alpha-16) active:bg-(--dash-red-alpha-24)" },
      { tone: "destructive", style: "ghost", className: "text-destructive hover:bg-(--dash-red-alpha-10) active:bg-(--dash-red-alpha-16)" },
      { tone: "destructive", style: "link", className: "text-destructive hover:underline underline-offset-4" },

      // Tone-aware focus ring override (primary is base default)
      { tone: "neutral", className: "focus-visible:ring-(--dash-slate-alpha-16)" },
      { tone: "destructive", className: "focus-visible:ring-(--dash-red-alpha-10)" },
    ],
    defaultVariants: {
      size: "md",
      style: "filled",
      tone: "primary",
    },
  },
)

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      size,
      style: styleVariant,
      tone,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"
    const showLeft = leftIcon && !loading
    const showRight = rightIcon && !loading
    const showSpinner = loading

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-tone={tone ?? "primary"}
        data-style={styleVariant ?? "filled"}
        data-loading={loading || undefined}
        disabled={disabled || loading}
        className={cn(buttonVariants({ size, style: styleVariant, tone }), className)}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {showSpinner ? <Loader2 aria-hidden className="animate-spin" /> : null}
            {showLeft ? <span aria-hidden>{leftIcon}</span> : null}
            {children}
            {showRight ? <span aria-hidden>{rightIcon}</span> : null}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
