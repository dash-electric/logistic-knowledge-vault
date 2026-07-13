"use client"

import * as React from "react"
import { RiArrowLeftSLine as ChevronLeft, RiArrowRightSLine as ChevronRight, RiArrowLeftDoubleLine as ChevronsLeft, RiArrowRightDoubleLine as ChevronsRight, RiMoreLine as MoreHorizontal } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Pagination — Figma 1:1 parity (node 486:8465, paste verified 2026-05-17).
 *
 * Two component sets in Figma:
 *  - Pagination Cells (513:3681): 4 states × 2 radii (rounded-lg vs full).
 *    Cell 32×32, text 14px/20px medium, text-sub-600 default.
 *    Default = white bg + soft stroke. Hover = bg-weak-50 no stroke.
 *    Selected = white bg + soft stroke + text-strong-950 (NOT primary; Figma
 *    uses neutral white-card pattern with strong text). Disabled = white bg +
 *    soft stroke + text-disabled-300.
 *  - Pagination Group (513:3892): 3 types — Basic (rounded cells), Full Radius
 *    (pill cells), Group (button-group glued cells). Outer layout has
 *    left "Page X of Y" label, prev/next chevron buttons, page cells, and
 *    right "X / page" compact select.
 *
 * Component API stays composable. `shape` prop controls cell radius
 * (rounded vs full). `isActive` flips selected vs default.
 */

type PaginationProps = React.HTMLAttributes<HTMLElement>

const Pagination = ({ className, ...props }: PaginationProps) => (
  <nav
    role="navigation"
    aria-label="pagination"
    data-slot="pagination"
    className={cn("flex items-center justify-between gap-2", className)}
    {...props}
  />
)

const PaginationList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="pagination-list"
      // Figma cells sit flush; gap between cells in Pages frame is 0 by default
      // but the Group wrapper uses gap-1.
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  ),
)
PaginationList.displayName = "PaginationList"

const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
)
PaginationItem.displayName = "PaginationItem"

type CellShape = "rounded" | "full"

type PaginationButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean
  shape?: CellShape
}

const PaginationButton = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, isActive, shape = "rounded", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-button"
      data-active={isActive ? "true" : undefined}
      data-shape={shape}
      className={cn(
        // Figma cell: 32×32, font-medium 14/20. Tabular figures so page numbers
        // don't shift width (GSM rule 02 / number-tabular).
        "inline-flex h-8 min-w-8 items-center justify-center px-2 text-sm font-medium tabular-nums",
        shape === "full" ? "rounded-full" : "rounded-lg",
        // Default cell: white bg + stroke-soft + sub text
        "cursor-pointer border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 transition-colors",
        // Hover cell: bg-weak-50 + drop stroke (Figma hover variant has no stroke)
        "hover:border-transparent hover:bg-bg-weak-50 hover:text-text-strong-950",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base",
        // Disabled: keep stroke, text fades to disabled-300
        "disabled:pointer-events-none disabled:border-stroke-soft-200 disabled:bg-bg-white-0 disabled:text-text-disabled-300",
        // Selected: white bg + stroke-soft + strong text (Figma uses neutral
        // strong-text, NOT primary fill — primary fill is reserved for other
        // selected patterns)
        "data-[active=true]:border-stroke-soft-200 data-[active=true]:bg-bg-white-0 data-[active=true]:text-text-strong-950 data-[active=true]:hover:bg-bg-white-0",
        className,
      )}
      {...props}
    />
  ),
)
PaginationButton.displayName = "PaginationButton"

const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PaginationButton
      ref={ref}
      aria-label="Go to previous page"
      // Figma prev/next = icon-only 32×32 cells (no label by default)
      className={cn("px-0", className)}
      {...props}
    >
      <ChevronLeft strokeWidth={1.75} className="size-4" />
      {children}
    </PaginationButton>
  ),
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PaginationButton
      ref={ref}
      aria-label="Go to next page"
      className={cn("px-0", className)}
      {...props}
    >
      {children}
      <ChevronRight strokeWidth={1.75} className="size-4" />
    </PaginationButton>
  ),
)
PaginationNext.displayName = "PaginationNext"

const PaginationFirst = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PaginationButton
      ref={ref}
      aria-label="Go to first page"
      className={cn("px-0", className)}
      {...props}
    >
      <ChevronsLeft strokeWidth={1.75} className="size-4" />
      {children}
    </PaginationButton>
  ),
)
PaginationFirst.displayName = "PaginationFirst"

const PaginationLast = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PaginationButton
      ref={ref}
      aria-label="Go to last page"
      className={cn("px-0", className)}
      {...props}
    >
      {children}
      <ChevronsRight strokeWidth={1.75} className="size-4" />
    </PaginationButton>
  ),
)
PaginationLast.displayName = "PaginationLast"

const PaginationEllipsis = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden
    data-slot="pagination-ellipsis"
    // Figma renders "..." as a regular pagination cell (same chrome).
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600",
      className,
    )}
    {...props}
  >
    <MoreHorizontal strokeWidth={1.75} className="size-4" />
    <span className="sr-only">More pages</span>
  </span>
)

export {
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationButton,
  PaginationPrevious,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
}
