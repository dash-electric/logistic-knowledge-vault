"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

// Figma Widgets [HR/Finance] (node 3851:32690 / 3963:7181): canonical card =
//   stroke 1px (#ebebeb / stroke-soft-200), cornerRadius 16 (rounded-2xl),
//   padding 16 all (p-4), itemSpacing 16, fill bg-white-0.
// Default padding aligned to Figma "md" = 16px (was 20px).
const cardVariants = cva("flex flex-col bg-bg-white-0 text-text-strong-950", {
  variants: {
    variant: {
      stroke: "border border-stroke-soft-200 rounded-2xl",
      elevated: "border border-stroke-soft-200 rounded-2xl shadow-custom-sm",
      ghost: "border border-transparent rounded-2xl",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-6",
    },
  },
  defaultVariants: { variant: "stroke", padding: "md" },
})

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      data-variant={variant ?? "stroke"}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  ),
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // Figma Header frame inside Widget: horizontal flex, gap 8, header-to-body gap 16
    // (cardVariants itemSpacing). pb-4 keeps optical spacing without double-counting card gap.
    <div
      ref={ref}
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 pb-4", className)}
      {...props}
    />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    // Figma Widget header text: 16/24 weight 500 ls -0.176 (tracking-tight).
    // Was font-semibold (600); patched to font-medium (500) for Figma parity.
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn("text-base font-medium tracking-tight leading-tight", className)}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    // Figma secondary body text: 14/20 weight 400 (text-sm), color text-sub-600.
    <p
      ref={ref}
      data-slot="card-description"
      className={cn("text-sm text-text-sub-600 leading-relaxed", className)}
      {...props}
    />
  ),
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-slot="card-content" className={cn("flex-1", className)} {...props} />
  ),
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // Bleed footer to card edges via -mx-4 (matches default p-4). pt-3 + 1px top divider.
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn("flex items-center pt-3 border-t border-stroke-soft-200 -mx-4 mt-auto px-4 first:border-0 first:pt-0 first:mt-0", className)}
      {...props}
    />
  ),
)
CardFooter.displayName = "CardFooter"

const CardMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    // Bleed media to card edges via -mt-4/-mx-4 (matches default p-4).
    <div
      ref={ref}
      data-slot="card-media"
      className={cn("relative overflow-hidden first:-mt-4 first:-mx-4 first:rounded-t-2xl", className)}
      {...props}
    />
  ),
)
CardMedia.displayName = "CardMedia"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMedia }
