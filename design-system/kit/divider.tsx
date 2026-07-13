"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

// Figma Content Divider [1.1] "Line" / "Line Spacing" — 1px stroke #EAEAEA
// (Dash token --stroke-soft-200). `regular` 1.5px is a Dash extension.
const dividerVariants = cva("shrink-0 bg-stroke-soft-200", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px h-full self-stretch",
    },
    weight: {
      thin: "",
      regular: "",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", weight: "regular", className: "h-[1.5px]" },
    { orientation: "vertical", weight: "regular", className: "w-[1.5px]" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    weight: "thin",
  },
})

export type DividerProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof dividerVariants>

const Divider = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, DividerProps>(
  ({ className, orientation = "horizontal", weight = "thin", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation === "vertical" ? "vertical" : "horizontal"}
      decorative={decorative}
      data-slot="divider"
      className={cn(dividerVariants({ orientation, weight }), className)}
      {...props}
    />
  ),
)
Divider.displayName = "Divider"

/* -------------------------------------------------------------------------- */
/* ContentDivider — line + label or icon in the middle                         */
/* -------------------------------------------------------------------------- */

type Align = "start" | "center" | "end"

const contentAlignClass: Record<Align, string> = {
  start: "[&>:first-child]:flex-[0_0_auto] [&>:last-child]:flex-1",
  center: "",
  end: "[&>:first-child]:flex-1 [&>:last-child]:flex-[0_0_auto]",
}

// Figma Content Divider [1.1] node 414:4397 — Type variants:
//   Line · Line Spacing · Text Divider · Text & Line Divider · Solid Text Divider
//   stroke #EAEAEA (stroke-soft-200) · text #A3A3A3 (text-soft-400)
//   text 12/16 weight 500 letter-spacing 0.48 (≈ tracking-[0.04em])
export type ContentDividerProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: Align
  weight?: "thin" | "regular"
  /** Visual variant — "line" (default) frames text with lines, "solid" uses filled bar. */
  variant?: "line" | "solid"
}

const ContentDivider = React.forwardRef<HTMLDivElement, ContentDividerProps>(
  ({ className, align = "center", weight = "thin", variant = "line", children, ...props }, ref) => {
    if (variant === "solid") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          data-slot="content-divider"
          data-variant="solid"
          className={cn(
            "flex items-center justify-center bg-bg-weak-50 px-6 py-1.5 gap-1.5",
            "text-xs leading-4 font-medium uppercase tracking-[0.04em] text-text-soft-400",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      )
    }
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        data-slot="content-divider"
        data-align={align}
        data-variant="line"
        className={cn(
          "flex items-center gap-2 text-xs leading-4 font-medium uppercase tracking-[0.04em] text-text-soft-400",
          contentAlignClass[align],
          className,
        )}
        {...props}
      >
        <span aria-hidden className={cn("flex-1", weight === "regular" ? "h-[1.5px]" : "h-px", "bg-stroke-soft-200")} />
        {children ? <span className="whitespace-nowrap">{children}</span> : null}
        <span aria-hidden className={cn("flex-1", weight === "regular" ? "h-[1.5px]" : "h-px", "bg-stroke-soft-200")} />
      </div>
    )
  },
)
ContentDivider.displayName = "ContentDivider"

export { Divider, ContentDivider, dividerVariants }
