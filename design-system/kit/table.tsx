"use client"

import * as React from "react"
import { cn } from "./lib/utils"

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  /** Classes for the scroll wrapper — e.g. `max-h-64` so the body scrolls
   * under a sticky header (`<TableHeader sticky>`). */
  containerClassName?: string
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <div
      data-slot="table-wrapper"
      className={cn("relative w-full overflow-auto", containerClassName)}
    >
      <table
        ref={ref}
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  ),
)
Table.displayName = "Table"

type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement> & {
  /** Pin the header to the top of the scroll wrapper so rows scroll beneath
   * it. Pair with `<Table containerClassName="max-h-…">`. */
  sticky?: boolean
}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, sticky, ...props }, ref) => (
    <thead
      ref={ref}
      data-slot="table-header"
      // Figma 587:5793 Table Header Cell: fill = #f7f7f7 (bg-weak-50), 1px bottom stroke (stroke-soft-200)
      className={cn(
        "bg-bg-weak-50 [&_tr]:border-b [&_tr]:border-stroke-soft-200",
        // Sticky cells carry their own opaque fill so scrolled rows pass under cleanly.
        sticky && "[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-bg-weak-50",
        className,
      )}
      {...props}
    />
  ),
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    data-slot="table-body"
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    data-slot="table-footer"
    className={cn(
      "border-t border-stroke-soft-200 bg-bg-weak-50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      data-slot="table-row"
      // Figma 553:22175 Row Cell hover state: solid #f7f7f7 (bg-weak-50), NOT translucent.
      // Selected state matches hover fill.
      className={cn(
        "border-b border-stroke-soft-200 transition-colors",
        "hover:bg-bg-weak-50 data-[state=selected]:bg-bg-weak-50",
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  // Figma 587:5793 Header Cell: 36px tall, padding 8t/12r/8b/12l, text 12/16 weight 500
  // ls 0.48 (~tracking-wider). Uppercase by convention (AlignUI samples: "EMAIL", "BUY FROM").
  // Color = text-soft-400 (#a3a3a3) per Figma fill var 262:1714.
  <th
    ref={ref}
    data-slot="table-head"
    className={cn(
      "h-9 px-3 py-2 text-left align-middle text-xs font-medium uppercase tracking-wider text-text-soft-400",
      "[&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  // Figma 553:22175 Row Cell: padding 12 all (py-3 px-3), text 14/20 weight 400
  // ls -0.084 (~tracking-tight), color text-strong-950 for primary content.
  <td
    ref={ref}
    data-slot="table-cell"
    className={cn(
      "px-3 py-3 align-middle text-sm tracking-tight text-text-strong-950 [&:has([role=checkbox])]:pr-0",
      className,
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    data-slot="table-caption"
    className={cn("mt-4 text-sm text-text-sub-600", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

/* -------------------------------------------------------------------------- */
/*  Sort indicator — Figma 581:2327                                            */
/*                                                                            */
/*  Stacked up/down triangles to the right of a header label. Highlights the   */
/*  active direction by tinting one triangle text-strong-950 and the other     */
/*  text-soft-400.                                                             */
/* -------------------------------------------------------------------------- */

type SortDirection = "asc" | "desc" | null

const TableSortIcon = ({
  direction,
  className,
}: {
  direction?: SortDirection
  className?: string
}) => {
  const upActive = direction === "asc"
  const downActive = direction === "desc"
  return (
    <span
      aria-hidden
      className={cn("inline-flex flex-col items-center justify-center leading-none -my-1", className)}
    >
      <svg
        viewBox="0 0 6 4"
        className={cn(
          "h-1 w-1.5 transition-colors",
          upActive ? "text-text-strong-950" : "text-icon-soft-400",
        )}
        fill="currentColor"
      >
        <path d="M3 0 L6 4 L0 4 Z" />
      </svg>
      <svg
        viewBox="0 0 6 4"
        className={cn(
          "h-1 w-1.5 mt-0.5 transition-colors",
          downActive ? "text-text-strong-950" : "text-icon-soft-400",
        )}
        fill="currentColor"
      >
        <path d="M0 0 L6 0 L3 4 Z" />
      </svg>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableHeadSortable — Figma 587:5793                                         */
/*                                                                            */
/*  A `<th>` cell that renders an optional checkbox slot + label + sort        */
/*  indicator. Pass `direction` for the current sort state, `onSort` for the   */
/*  click handler. Works with TanStack column.getCanSort()/toggleSorting().    */
/* -------------------------------------------------------------------------- */

type TableHeadSortableProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  /** Visible column label. */
  label: React.ReactNode
  /** Current sort direction, or `null` for unsorted. */
  direction?: SortDirection
  /** Click handler — should toggle direction. */
  onSort?: () => void
  /** Slot rendered before the label (typical use: a `<Checkbox />`). */
  leading?: React.ReactNode
  /** Hide the sort affordance for this column. */
  unsortable?: boolean
}

const TableHeadSortable = React.forwardRef<HTMLTableCellElement, TableHeadSortableProps>(
  ({ className, label, direction = null, onSort, leading, unsortable, ...props }, ref) => {
    const sortable = !unsortable
    return (
      <th
        ref={ref}
        data-slot="table-head-sortable"
        data-sort={direction ?? undefined}
        className={cn(
          "h-9 px-3 py-2 text-left align-middle text-xs font-medium tracking-tight text-text-soft-400",
          className,
        )}
        {...props}
      >
        <div className="inline-flex items-center gap-2">
          {leading}
          <button
            type="button"
            onClick={sortable ? onSort : undefined}
            disabled={!sortable}
            className={cn(
              "inline-flex items-center gap-1 select-none",
              "text-xs font-medium tracking-tight",
              sortable
                ? "hover:text-text-strong-950 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-24) rounded-sm"
                : "cursor-default",
              direction ? "text-text-strong-950" : "text-text-soft-400",
            )}
          >
            {label}
            {sortable ? <TableSortIcon direction={direction} /> : null}
          </button>
        </div>
      </th>
    )
  },
)
TableHeadSortable.displayName = "TableHeadSortable"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableHeadSortable,
  TableSortIcon,
  TableCell,
  TableCaption,
  type SortDirection,
}
