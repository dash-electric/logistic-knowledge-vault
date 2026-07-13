"use client"

import * as React from "react"
import { RiTimeLine as Clock, RiCheckLine as Check } from "@remixicon/react"
import { InputRoot, Input, InputIcon } from "./input"
import { cn } from "./lib/utils"

/**
 * TimePicker family — Figma node 164611:83414.
 *
 * Figma exposes 3 sets:
 *   1. Time Picker Select Status — status badge dots (Available / Busy / In-meeting / Offline)
 *   2. Time Picker Select Duration — dropdown trigger w/ chevron
 *   3. Time Picker Items — selectable time-slot row (292x36, r=8) with optional check
 *
 * The numeric HH:MM input variant (`TimePicker`) is a Dash extension kept for
 * form usage. Figma-faithful subparts: TimePickerSlot, TimePickerStatus.
 */

const pad = (n: number) => n.toString().padStart(2, "0")
const parse = (v: string) => {
  const [h, m] = v.split(":").map((x) => Number.parseInt(x, 10))
  return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 }
}

type TimePickerProps = {
  value?: string // "HH:MM"
  defaultValue?: string
  onValueChange?: (value: string) => void
  step?: number // minute step
  className?: string
  disabled?: boolean
  invalid?: boolean
  "aria-label"?: string
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value, defaultValue = "09:00", onValueChange, step = 1, className, disabled, invalid, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue)
    const current = value ?? internal
    const { h, m } = parse(current)

    const update = (nh: number, nm: number) => {
      const clampedH = Math.max(0, Math.min(23, nh))
      const clampedM = Math.max(0, Math.min(59, nm))
      const next = `${pad(clampedH)}:${pad(clampedM)}`
      if (value === undefined) setInternal(next)
      onValueChange?.(next)
    }

    return (
      <div ref={ref} className={cn("inline-flex", className)} data-slot="time-picker" {...props}>
        <InputRoot invalid={invalid} className="w-32">
          <InputIcon>
            <Clock strokeWidth={1.75} className="size-4" />
          </InputIcon>
          <Input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={pad(h)}
            onChange={(e) => update(Number.parseInt(e.target.value, 10) || 0, m)}
            className="w-7 text-center tabular-nums"
            aria-label="Hours"
            maxLength={2}
          />
          <span className="text-text-soft-400">:</span>
          <Input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={pad(m)}
            onChange={(e) => update(h, Number.parseInt(e.target.value, 10) || 0)}
            step={step}
            className="w-7 text-center tabular-nums"
            aria-label="Minutes"
            maxLength={2}
          />
        </InputRoot>
      </div>
    )
  },
)
TimePicker.displayName = "TimePicker"

/* -------------------------------------------------------------------------- */
/* TimePickerSlot — Figma "Time Picker Items" (292x36, r=8, dual-time row)    */
/* -------------------------------------------------------------------------- */

export type TimePickerSlotProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Primary time string e.g. "09:30" */
  start: string
  /** Optional secondary time (renders "—" separator + second time). */
  end?: string
  /** Localised period suffix per side ("AM" / "PM" / "WIB"). */
  startSuffix?: string
  endSuffix?: string
  selected?: boolean
}

const TimePickerSlot = React.forwardRef<HTMLButtonElement, TimePickerSlotProps>(
  ({ className, start, end, startSuffix, endSuffix, selected, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="time-picker-slot"
      data-state={selected ? "active" : "default"}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "group flex h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
        "transition-colors duration-(--duration-fast) ease-(--ease-out)",
        "hover:bg-bg-weak-50",
        "data-[state=active]:bg-bg-weak-50",
        "disabled:cursor-not-allowed disabled:text-text-disabled-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)",
        className,
      )}
      {...props}
    >
      <span className="inline-flex items-baseline gap-0.5 font-medium tabular-nums">
        <span className={cn(selected ? "text-text-strong-950" : "text-text-sub-600")}>{start}</span>
        {startSuffix ? <span className="text-text-soft-400 text-xs">{startSuffix}</span> : null}
      </span>
      {end ? (
        <>
          {selected ? (
            <Check strokeWidth={3} className="size-3.5 text-(--primary-base) shrink-0" />
          ) : (
            <span aria-hidden className="text-text-soft-400">
              —
            </span>
          )}
          <span className="inline-flex items-baseline gap-0.5 font-medium tabular-nums">
            <span className={cn(selected ? "text-text-strong-950" : "text-text-sub-600")}>{end}</span>
            {endSuffix ? <span className="text-text-soft-400 text-xs">{endSuffix}</span> : null}
          </span>
        </>
      ) : selected ? (
        <Check strokeWidth={3} className="size-3.5 text-(--primary-base) shrink-0" />
      ) : null}
    </button>
  ),
)
TimePickerSlot.displayName = "TimePickerSlot"

/* -------------------------------------------------------------------------- */
/* TimePickerStatus — Figma "Time Picker Select Status" (96x28, r=8 badge)    */
/* -------------------------------------------------------------------------- */

export type TimePickerStatusKind = "available" | "busy" | "in-meeting" | "offline"

const STATUS_DOT: Record<TimePickerStatusKind, string> = {
  available: "bg-(--state-success-base)",
  busy: "bg-(--state-error-base)",
  "in-meeting": "bg-(--state-warning-base)",
  offline: "bg-(--state-faded-base)",
}

const STATUS_LABEL: Record<TimePickerStatusKind, string> = {
  available: "Available",
  busy: "Busy",
  "in-meeting": "In-meeting",
  offline: "Offline",
}

export type TimePickerStatusProps = React.HTMLAttributes<HTMLSpanElement> & {
  kind: TimePickerStatusKind
  label?: React.ReactNode
}

const TimePickerStatus = React.forwardRef<HTMLSpanElement, TimePickerStatusProps>(
  ({ className, kind, label, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="time-picker-status"
      data-kind={kind}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg border border-stroke-soft-200 bg-bg-white-0 pl-1.5 pr-2.5 text-sm font-medium text-text-sub-600",
        className,
      )}
      {...props}
    >
      <span className="inline-flex size-4 items-center justify-center">
        <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[kind])} />
      </span>
      {label ?? STATUS_LABEL[kind]}
    </span>
  ),
)
TimePickerStatus.displayName = "TimePickerStatus"

export { TimePicker, TimePickerSlot, TimePickerStatus }
