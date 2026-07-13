"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * LinkButton — Figma 1:1 parity (node 168:4889, paste verified 2026-05-17).
 *
 * Figma axes:
 *   Style    : Gray | Black | Primary | Error → `tone` (with Dash aliases)
 *   Size     : Medium (20) | Small (16)       → `size` (md | sm)
 *   Underline: Off | On                       → `underline` (hover | always)
 *   State    : Default | Hover | Focus | Disabled
 *
 * Tone map (Figma → API):
 *   Gray    → muted    text-text-sub-600 (rgb 92,92,92)
 *   Black   → neutral  text-text-strong-950 (rgb 22,22,22)
 *   Primary → primary  text-primary (dash-purple-500)
 *   Error   → destructive text-error-base (dash-red-600)
 *
 * Size: Medium = text-sm/lh-20px (text-sm), Small = text-xs/lh-16px (text-xs).
 * `lg` is a Dash extension (not in Figma).
 *
 * Use for inline call-outs, breadcrumb-style nav back, footer secondary
 * actions. For real navigation, use Next/Link via asChild.
 */

const linkButtonVariants = cva(
  cn(
    "inline-flex items-center gap-1 font-medium underline-offset-4 transition-colors",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10) focus-visible:ring-offset-2 focus-visible:ring-offset-bg-white-0 rounded-sm",
    "cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:text-text-disabled-300",
    "hover:underline",
  ),
  {
    variants: {
      tone: {
        primary: "text-primary active:text-(--dash-purple-700)",
        neutral: "text-text-strong-950 active:text-text-strong-950/80",
        muted: "text-text-sub-600 hover:text-text-strong-950 active:text-text-strong-950/80",
        destructive: "text-error-base active:text-(--dash-red-700) focus-visible:ring-(--dash-red-alpha-10)",
      },
      size: {
        sm: "text-xs leading-4", // Figma Small (16): 12px / lh 16
        md: "text-sm leading-5", // Figma Medium (20): 14px / lh 20
        lg: "text-base leading-6", // Dash extension (not in Figma)
      },
      underline: {
        always: "underline",
        hover: "",
        none: "no-underline hover:no-underline",
      },
    },
    defaultVariants: { tone: "primary", size: "md", underline: "hover" },
  },
)

type LinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof linkButtonVariants> & {
    asChild?: boolean
  }

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, tone, size, underline, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"
    return (
      <Comp
        ref={ref}
        data-slot="link-button"
        className={cn(linkButtonVariants({ tone, size, underline }), className)}
        {...props}
      />
    )
  },
)
LinkButton.displayName = "LinkButton"

export { LinkButton, linkButtonVariants }
