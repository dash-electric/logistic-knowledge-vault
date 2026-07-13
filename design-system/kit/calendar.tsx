"use client"

import * as React from "react"
import { RiArrowLeftSLine as ChevronLeft, RiArrowRightSLine as ChevronRight } from "@remixicon/react"
import { DayPicker } from "react-day-picker"
import { cn } from "./lib/utils"

import "react-day-picker/style.css"

/**
 * Calendar — Figma 1:1 parity (node 435:8548 Date Picker).
 *
 * Outer: p-6 bg-bg-white-0 rounded-sm (the popover provides border).
 * Header: 36h bg-bg-weak-50 rounded-lg, 24x24 r-6 compact buttons.
 * Day label: 14/20 medium text-soft-400, 40x40.
 * Day cell (40x40 r-8):
 *   Default  → bg-white text-sub-600
 *   Hover    → bg-bg-weak-50 text-strong-950
 *   Selected → bg-(--primary-base) text-static-white
 *   Today    → text-(--primary-base) bold (no fill)
 *   Outside  → text-text-disabled-300
 *   Disabled → text-text-disabled-300 opacity-50
 *   Range middle → bg-bg-weak-50 text-strong-950
 */

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      className={cn("p-6 bg-bg-white-0 text-text-strong-950", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-6",
        month: "flex flex-col gap-2",
        month_caption: "flex items-center justify-center h-9 px-1.5 rounded-lg bg-bg-weak-50 relative",
        caption_label: "text-sm font-medium text-text-sub-600",
        nav: "absolute inset-x-1.5 inset-y-1.5 flex items-center justify-between",
        button_previous: cn(
          "size-6 inline-flex items-center justify-center rounded-md bg-bg-white-0 text-icon-sub-600",
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)",
        ),
        button_next: cn(
          "size-6 inline-flex items-center justify-center rounded-md bg-bg-white-0 text-icon-sub-600",
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)",
        ),
        chevron: "size-5",
        month_grid: "w-full border-collapse mt-1",
        weekdays: "flex",
        weekday: "size-10 text-sm font-medium text-text-soft-400 flex items-center justify-center",
        week: "flex w-full",
        day: "size-10 text-center text-sm relative p-0 [&:has(button)]:cursor-pointer",
        day_button: cn(
          "size-10 inline-flex items-center justify-center rounded-lg font-medium text-text-sub-600",
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)",
        ),
        selected:
          "[&>button]:bg-(--primary-base) [&>button]:text-static-white [&>button]:hover:bg-(--primary-dark) [&>button]:hover:text-static-white",
        today: "[&>button]:font-bold [&>button]:text-(--primary-base)",
        outside: "[&>button]:text-text-disabled-300",
        disabled: "[&>button]:text-text-disabled-300 [&>button]:opacity-50 [&>button]:cursor-not-allowed",
        range_start:
          "[&>button]:bg-(--primary-base) [&>button]:text-static-white rounded-l-lg [&>button]:hover:bg-(--primary-dark)",
        range_middle:
          "[&>button]:bg-bg-weak-50 [&>button]:text-text-strong-950 rounded-none [&>button]:rounded-none [&>button]:hover:bg-bg-weak-50",
        range_end:
          "[&>button]:bg-(--primary-base) [&>button]:text-static-white rounded-r-lg [&>button]:hover:bg-(--primary-dark)",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft strokeWidth={1.75} className="size-5" />
          ) : (
            <ChevronRight strokeWidth={1.75} className="size-5" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"
