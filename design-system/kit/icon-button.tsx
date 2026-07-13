"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * IconButton — square-format Button. Figma 1:1 parity for the "Only Icon=On"
 * matrix of Buttons componentSet (node 129:1422, paste verified 2026-05-17).
 *
 * Same tone × style matrix as Button. Sized for icon-only triggers
 * (toolbar, table row actions, header utilities). For text + icon use
 * the regular Button with leftIcon prop.
 *
 * Size metrics (Figma exact):
 *   xs (28) → r=8 pad=4  icon=16   "2X-Small"
 *   sm (32) → r=8 pad=6  icon=16   "X-Small"
 *   md (36) → r=8 pad=8  icon=20   "Small"
 *   lg (40) → r=10 pad=10 icon=20  "Medium" (Figma default)
 *   xl (44) → Dash extension
 *
 * Note: a separate "Compact Button" exists in Figma (node 189:3646) at 20/24px
 * with Stroke|Ghost|White|Modifiable styles — not implemented here. Use this
 * IconButton for general toolbar/table use; flag a need for Compact via
 * hold-list if you encounter a truly miniature icon-button slot.
 */

const iconButtonVariants = cva(
  cn(
    "inline-flex items-center justify-center border border-transparent",
    "transition-[background-color,color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10) focus-visible:ring-offset-2 focus-visible:ring-offset-bg-white-0",
    "cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:border-transparent disabled:shadow-none",
  ),
  {
    variants: {
      size: {
        xs: "size-7 rounded-lg [&_svg]:size-4",
        sm: "size-8 rounded-lg [&_svg]:size-4",
        md: "size-9 rounded-lg [&_svg]:size-5",
        lg: "size-10 rounded-sm [&_svg]:size-5",
        xl: "size-11 rounded-sm [&_svg]:size-5",
      },
      tone: {
        primary: "",
        neutral: "",
        destructive: "",
      },
      style: {
        // Figma canon: Filled | Stroke | Lighter | Ghost (4 styles).
        filled: "",
        stroke: "border-current",
        lighter: "",
        ghost: "",
      },
    },
    compoundVariants: [
      // source Figma mapping (mirrors Button)
      // PRIMARY filled = ink (GSM: purple is punctuation, never a fill). Purple
      // stays on stroke / lighter / ghost. Inverse-surface pair = dark-safe.
      { tone: "primary", style: "filled", className: "bg-bg-strong-950 text-text-white-0 hover:bg-bg-strong-950/90 active:bg-bg-strong-950/80" },
      { tone: "primary", style: "stroke", className: "bg-bg-white-0 border-primary text-primary hover:bg-(--primary-alpha-10) active:bg-(--primary-alpha-16)" },
      { tone: "primary", style: "lighter", className: "bg-(--primary-alpha-10) text-primary hover:bg-(--primary-alpha-16) active:bg-(--primary-alpha-24)" },
      { tone: "primary", style: "ghost", className: "text-primary hover:bg-(--primary-alpha-10) active:bg-(--primary-alpha-16)" },
      { tone: "neutral", style: "filled", className: "bg-bg-surface-800 text-text-white-0 hover:bg-bg-strong-950" },
      { tone: "neutral", style: "stroke", className: "bg-bg-white-0 border-stroke-soft-200 text-text-sub-600 shadow-regular-xs hover:bg-bg-weak-50 hover:text-text-strong-950" },
      { tone: "neutral", style: "lighter", className: "bg-bg-weak-50 text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950 active:bg-bg-soft-200" },
      { tone: "neutral", style: "ghost", className: "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 active:bg-bg-soft-200" },
      { tone: "destructive", style: "filled", className: "bg-destructive text-static-white hover:bg-(--dash-red-700) active:bg-(--dash-red-800)" },
      { tone: "destructive", style: "stroke", className: "bg-bg-white-0 border-destructive text-destructive hover:bg-(--dash-red-alpha-10) active:bg-(--dash-red-alpha-16)" },
      { tone: "destructive", style: "lighter", className: "bg-(--dash-red-alpha-10) text-destructive hover:bg-(--dash-red-alpha-16) active:bg-(--dash-red-alpha-24)" },
      { tone: "destructive", style: "ghost", className: "text-destructive hover:bg-(--dash-red-alpha-10) active:bg-(--dash-red-alpha-16)" },
      // Tone-aware focus ring override
      { tone: "neutral", className: "focus-visible:ring-(--dash-slate-alpha-16)" },
      { tone: "destructive", className: "focus-visible:ring-(--dash-red-alpha-10)" },
    ],
    defaultVariants: { size: "md", tone: "neutral", style: "ghost" },
  },
)

type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> &
  VariantProps<typeof iconButtonVariants> & {
    asChild?: boolean
    "aria-label": string
  }

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, tone, style: styleVariant, asChild, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        data-slot="icon-button"
        data-tone={tone ?? "neutral"}
        data-style={styleVariant ?? "ghost"}
        className={cn(iconButtonVariants({ size, tone, style: styleVariant }), className)}
        {...props}
      />
    )
  },
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
