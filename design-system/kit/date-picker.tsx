"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { format } from "date-fns"
import { RiCalendarLine as CalendarIcon } from "@remixicon/react"
import type { DateRange } from "react-day-picker"
import { Calendar } from "./calendar"
import { cn } from "./lib/utils"

/**
 * Date Picker — Figma 1:1 parity (node 435:8548 Date & Range Picker).
 *
 * Trigger: aligns with Select (md=h-10 r-10). Default border stroke-soft-200,
 * hover bg-bg-weak-50, focus border stroke-strong-950. Calendar icon
 * text-icon-soft-400.
 * Popover card: r=20, border stroke-soft-200, bg-bg-white-0, p-5 (Figma
 * 368x432 with 20px padding).
 */

/* -------------------------------------------------------------------------- */
/* Trigger button                                                              */
/* -------------------------------------------------------------------------- */

type DatePickerTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  placeholder?: string
  value?: string
  /** Figma sizes: sm=X-Small (32) · md=Small (36) · lg=Medium (40, default). */
  size?: "sm" | "md" | "lg"
  active?: boolean
}

const triggerSizeMap: Record<NonNullable<DatePickerTriggerProps["size"]>, string> = {
  sm: "h-8 rounded-lg px-2 text-sm gap-1.5",
  md: "h-9 rounded-lg px-2.5 text-sm gap-2",
  lg: "h-10 rounded-sm px-3 text-sm gap-2",
}

const DatePickerTrigger = React.forwardRef<HTMLButtonElement, DatePickerTriggerProps>(
  ({ className, placeholder = "Pick a date", value, size = "lg", active, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="date-picker-trigger"
      data-state={active ? "open" : "closed"}
      className={cn(
        "inline-flex w-full items-center justify-start border border-stroke-soft-200 bg-bg-white-0 text-left text-text-strong-950",
        "transition-colors duration-(--duration-fast) ease-(--ease-out)",
        "hover:bg-bg-weak-50 hover:border-transparent hover:text-text-sub-600",
        "data-[state=open]:bg-bg-white-0 data-[state=open]:border-stroke-strong-950 data-[state=open]:text-text-strong-950",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
        "disabled:cursor-not-allowed disabled:bg-bg-weak-50 disabled:border-transparent disabled:text-text-disabled-300",
        triggerSizeMap[size],
        !value && "text-text-sub-600",
        className,
      )}
      {...props}
    >
      <CalendarIcon aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-icon-soft-400" />
      <span className="flex-1 truncate">{value || placeholder}</span>
    </button>
  ),
)
DatePickerTrigger.displayName = "DatePickerTrigger"

/* -------------------------------------------------------------------------- */
/* Popover-wrapped pickers                                                     */
/* -------------------------------------------------------------------------- */

const popoverContentClasses = cn(
  "z-50 rounded-sm border border-stroke-soft-200 bg-bg-white-0 p-0 overflow-hidden shadow-custom-md",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
  "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
)

export type DatePickerProps = {
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  triggerClassName?: string
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  format?: string
  startMonth?: Date
  endMonth?: Date
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  triggerClassName,
  size = "lg",
  disabled,
  format: fmt = "PPP",
  startMonth,
  endMonth,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <DatePickerTrigger
          placeholder={placeholder}
          value={value ? format(value, fmt) : ""}
          size={size}
          active={open}
          className={triggerClassName}
          disabled={disabled}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={6} className={popoverContentClasses}>
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onValueChange?.(d)
              setOpen(false)
            }}
            captionLayout={startMonth || endMonth ? "dropdown" : undefined}
            startMonth={startMonth}
            endMonth={endMonth}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
DatePicker.displayName = "DatePicker"

/* -------------------------------------------------------------------------- */
/* Range picker                                                                */
/* -------------------------------------------------------------------------- */

export type DateRangePickerProps = {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  placeholder?: string
  triggerClassName?: string
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  numberOfMonths?: number
  format?: string
}

export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Pick a date range",
  triggerClassName,
  size = "lg",
  disabled,
  numberOfMonths = 2,
  format: fmt = "MMM d",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const display = (() => {
    if (!value?.from) return ""
    if (!value.to) return format(value.from, fmt)
    return `${format(value.from, fmt)} – ${format(value.to, fmt)}`
  })()

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <DatePickerTrigger
          placeholder={placeholder}
          value={display}
          size={size}
          active={open}
          className={triggerClassName}
          disabled={disabled}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={6} className={popoverContentClasses}>
          <Calendar
            mode="range"
            numberOfMonths={numberOfMonths}
            selected={value}
            onSelect={(range) => onValueChange?.(range)}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
DateRangePicker.displayName = "DateRangePicker"

export { DatePickerTrigger }
