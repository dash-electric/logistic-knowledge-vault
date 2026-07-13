"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Radio — Figma parity v2 (node 515:3884 → Radio [1.1]).
 *
 * Figma: 16px circle · radius full ·
 *  - Off  : bg-stroke-soft-200 (#ebebeb) with 13px inner white box
 *  - On   : bg-primary-base (purple) with 8px inner WHITE dot
 *  - Hover: bg-stroke-sub-300 (Off) / bg-primary-darker (On)
 * Dash extension: `sm` (14) + `lg` (20) sizes added — Figma ships only 16px.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    data-slot="radio-group"
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
))
RadioGroup.displayName = "RadioGroup"

const radioItemVariants = cva(
  cn(
    "peer relative aspect-square shrink-0 rounded-full",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Off state: filled with stroke-soft-200 (Figma bg), inner small white visible via pseudo
    "data-[state=unchecked]:bg-stroke-soft-200 hover:data-[state=unchecked]:bg-stroke-sub-300",
    // Inner white 'box' (Figma 13px on 16px) — show as inset white circle when unchecked
    "data-[state=unchecked]:before:content-[''] data-[state=unchecked]:before:absolute",
    "data-[state=unchecked]:before:rounded-full data-[state=unchecked]:before:bg-bg-white-0",
    "data-[state=unchecked]:before:inset-[1.5px]",
    // On state: filled with primary, hover = darker
    "data-[state=checked]:bg-primary hover:data-[state=checked]:bg-primary-darker",
  ),
  {
    variants: {
      size: {
        // Dash extension
        sm: "size-3.5",
        // Figma default = 16px
        md: "size-4",
        // Dash extension
        lg: "size-5",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type RadioItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof radioItemVariants>

const RadioItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioItemProps
>(({ className, size, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    data-slot="radio-item"
    className={cn(radioItemVariants({ size }), className)}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
      {/* Figma "On" inner dot = 8px white circle on 16px primary disc (8/16 = 50%) */}
      <span
        className={cn(
          "block rounded-full bg-bg-white-0",
          size === "sm" ? "size-1.5" : size === "lg" ? "size-2.5" : "size-2",
        )}
      />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
))
RadioItem.displayName = "RadioItem"

type RadioFieldProps = RadioItemProps & {
  label: React.ReactNode
  description?: React.ReactNode
}

const RadioField = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioFieldProps
>(({ id, label, description, size, className, ...props }, ref) => {
  const generatedId = React.useId()
  const itemId = id ?? generatedId
  return (
    <div className="flex items-start gap-2.5">
      <RadioItem ref={ref} id={itemId} size={size} className={cn("mt-0.5", className)} {...props} />
      <div className="grid gap-0.5 leading-none">
        <label
          htmlFor={itemId}
          className="text-sm font-medium text-text-strong-950 select-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
        {description ? (
          <p className="text-xs text-text-sub-600 leading-relaxed">{description}</p>
        ) : null}
      </div>
    </div>
  )
})
RadioField.displayName = "RadioField"

export { RadioGroup, RadioItem, RadioField }
