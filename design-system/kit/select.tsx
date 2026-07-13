"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { RiCheckLine as Check, RiArrowDownSLine as ChevronDown, RiArrowUpSLine as ChevronUp } from "@remixicon/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Select — Figma 1:1 parity (node 270:1084).
 *
 * Figma exposes 3 sizes (Medium 40 / Small 36 / X-Small 32) × 6 states
 * (Default / Filled / Hover / Focus / Disabled / Error) × 7 types
 * (Basic / Country / Avatar / Provider / Brand / Color / Icon).
 *
 * Token mapping (state):
 *   Default  → bg-bg-white-0 border stroke-soft-200 | placeholder text-sub-600
 *   Filled   → bg-bg-white-0 border stroke-soft-200 | text text-strong-950
 *   Hover    → bg-bg-weak-50  no border             | text text-sub-600
 *   Focus    → bg-bg-white-0 border stroke-strong-950 | text text-strong-950
 *   Disabled → bg-bg-weak-50  no border             | all text-disabled-300
 *   Error    → bg-bg-white-0 border state-error-base | text text-strong-950
 *
 * Sizes (Figma → Dash):
 *   md (Medium 40)  : h-10 r-10 px-3 py-2.5 gap-2  (12/10/10/10)
 *   sm (Small 36)   : h-9  r-8  px-2.5 py-2  gap-2 (10/8/8/8)
 *   xs (X-Small 32) : h-8  r-8  px-2 py-1.5 gap-1.5 (8/6/6/6)
 */

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const selectTriggerVariants = cva(
  cn(
    "flex w-full items-center justify-between rounded-lg border bg-bg-white-0 text-text-strong-950 text-left",
    "border-stroke-soft-200",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "hover:bg-bg-weak-50 hover:border-transparent hover:text-text-sub-600",
    "data-[state=open]:bg-bg-white-0 data-[state=open]:border-stroke-strong-950 data-[state=open]:text-text-strong-950",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
    "data-[placeholder]:text-text-sub-600",
    "data-[invalid]:border-(--state-error-base) aria-[invalid=true]:border-(--state-error-base)",
    "disabled:cursor-not-allowed disabled:bg-bg-weak-50 disabled:border-transparent disabled:text-text-disabled-300",
    "[&>span]:line-clamp-1",
    "[&_svg]:shrink-0",
  ),
  {
    variants: {
      // Figma: sm=X-Small (32) · md=Small (36) · lg=Medium (40) · xl alias of lg
      size: {
        sm: "h-8 rounded-lg px-2 text-sm gap-1.5 [&_svg]:size-4",
        md: "h-9 rounded-lg px-2.5 text-sm gap-2 [&_svg]:size-5",
        lg: "h-10 rounded-sm px-3 text-sm gap-2 [&_svg]:size-5",
        xl: "h-11 rounded-sm px-4 text-base gap-2 [&_svg]:size-5",
      },
    },
    defaultVariants: { size: "lg" },
  },
)

type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
  VariantProps<typeof selectTriggerVariants>

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, size, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-slot="select-trigger"
    className={cn(selectTriggerVariants({ size }), className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown strokeWidth={1.75} className="text-icon-soft-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="size-4 text-icon-sub-600" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = "SelectScrollUpButton"

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="size-4 text-icon-sub-600" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = "SelectScrollDownButton"

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      data-slot="select-content"
      position={position}
      className={cn(
        "relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-sm border border-stroke-soft-200 bg-bg-white-0 shadow-custom-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn("p-1", position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]")}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = "SelectContent"

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-[10px] font-medium uppercase tracking-widest text-text-soft-400",
      className,
    )}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    data-slot="select-item"
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none text-text-strong-950",
      "data-[highlighted]:bg-bg-weak-50 data-[highlighted]:text-text-strong-950",
      "data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled-300",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check strokeWidth={3} className="size-3.5 text-(--primary-base)" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-stroke-soft-200", className)}
    {...props}
  />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
