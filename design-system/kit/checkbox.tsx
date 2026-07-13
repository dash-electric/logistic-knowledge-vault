"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cva, type VariantProps } from "class-variance-authority"
import { RiCheckLine as Check, RiSubtractLine as Minus } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Checkbox — Figma parity v2 (node 227:1986 → Checkbox [1.1]).
 *
 * Figma: 16px box · radius 4 · 1.5px stroke when off (stroke-soft-200) ·
 * filled primary-base when checked/indeterminate · white check icon.
 * Dash extension: `sm` (14) + `lg` (20) sizes added — Figma ships only 16px.
 */
const checkboxVariants = cva(
  cn(
    "peer shrink-0 inline-flex items-center justify-center rounded",
    "border bg-bg-white-0 text-static-white",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "border-stroke-soft-200 hover:border-stroke-sub-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
    "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary",
  ),
  {
    variants: {
      size: {
        // Dash extension (smaller scale)
        sm: "size-3.5 [&_svg]:size-2.5",
        // Figma default = 16px
        md: "size-4 [&_svg]:size-3",
        // Dash extension (larger scale)
        lg: "size-5 [&_svg]:size-3.5",
      },
      tone: {
        primary: "",
        destructive:
          "data-[state=checked]:bg-error-base data-[state=checked]:border-error-base data-[state=indeterminate]:bg-error-base data-[state=indeterminate]:border-error-base focus-visible:ring-error-base",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "primary",
    },
  },
)

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof checkboxVariants>

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, size, tone, ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      className={cn(checkboxVariants({ size, tone }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.checked === "indeterminate" ? (
          <Minus aria-hidden strokeWidth={3} />
        ) : (
          <Check aria-hidden strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)
Checkbox.displayName = "Checkbox"

/* -------------------------------------------------------------------------- */
/* Composed: Checkbox with label + optional description                        */
/* -------------------------------------------------------------------------- */

type CheckboxFieldProps = CheckboxProps & {
  label: React.ReactNode
  /** Inline secondary text after the label (parenthesized in Figma). */
  sublabel?: React.ReactNode
  /** Trailing badge slot — typically a "NEW" pill or other status Badge. */
  badge?: React.ReactNode
  /** Block-level description below the label row. */
  description?: React.ReactNode
  /** Action link below the description (Figma: Link Button). */
  action?: React.ReactNode
  /** Position of checkbox relative to label. Default left. Use "right" for table-cell or trailing align. */
  controlPosition?: "left" | "right"
  containerClassName?: string
  labelClassName?: string
}

const CheckboxField = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxFieldProps>(
  ({ id, label, sublabel, badge, description, action, controlPosition = "left", size, tone, containerClassName, labelClassName, className, ...props }, ref) => {
    const generatedId = React.useId()
    const checkboxId = id ?? generatedId
    const control = (
      <Checkbox ref={ref} id={checkboxId} size={size} tone={tone} className={cn("mt-0.5", className)} {...props} />
    )
    const body = (
      <div className="grid gap-0.5 leading-none flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
          <label
            htmlFor={checkboxId}
            className={cn(
              "text-sm font-medium text-text-strong-950 select-none cursor-pointer",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              labelClassName,
            )}
          >
            {label}
          </label>
          {sublabel ? (
            <span className="text-sm text-text-sub-600 select-none">{sublabel}</span>
          ) : null}
          {badge ? <span>{badge}</span> : null}
        </div>
        {description ? (
          <p className="text-xs text-text-sub-600 leading-relaxed mt-0.5">{description}</p>
        ) : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    )
    return (
      <div className={cn("flex items-start gap-2.5", containerClassName)}>
        {controlPosition === "left" ? control : null}
        {body}
        {controlPosition === "right" ? control : null}
      </div>
    )
  },
)
CheckboxField.displayName = "CheckboxField"

/* -------------------------------------------------------------------------- */
/* Composed: Card-style checkbox — bordered container, optional leading icon  */
/* Figma 261:3896 / 3280:3234 — selectable option card                         */
/* -------------------------------------------------------------------------- */

type CheckboxCardProps = CheckboxFieldProps & {
  /** Optional leading visual — 28-36px icon, avatar, or brand mark. */
  leading?: React.ReactNode
  /** Override the active-border tone when checked. Default uses primary. */
  selected?: boolean
}

const CheckboxCard = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxCardProps>(
  ({ leading, selected, className, containerClassName, ...props }, ref) => {
    const isSelected = selected ?? props.checked === true
    return (
      <CheckboxField
        ref={ref}
        controlPosition="right"
        containerClassName={cn(
          "rounded-xl border bg-bg-white-0 p-4 transition-colors cursor-pointer",
          isSelected
            ? "border-primary"
            : "border-stroke-soft-200 hover:bg-bg-weak-50",
          containerClassName,
        )}
        className={className}
        {...props}
        label={
          <span className="flex items-center gap-3 w-full">
            {leading ? <span className="shrink-0 inline-flex items-center justify-center">{leading}</span> : null}
            <span className="flex-1 min-w-0">{props.label}</span>
          </span>
        }
      />
    )
  },
)
CheckboxCard.displayName = "CheckboxCard"

export { Checkbox, CheckboxField, CheckboxCard, checkboxVariants }
