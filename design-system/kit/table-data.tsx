"use client"

import * as React from "react"
import { RiSearchLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSortable,
  TableRow,
  type SortDirection,
} from "./table"
import { Checkbox } from "./checkbox"
import { Skeleton } from "./skeleton"
import { StatusBadge, type BadgeStatus } from "./badge"
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "./empty-state"

/**
 * TableData — config-driven data table (columns array in, table out).
 *
 * Ported from react-logistic-web. Where `DataTable` (data-table.tsx) wraps
 * TanStack Table for column-def composition, TableData is the lighter
 * declarative API every list page actually uses: columns config, cycle
 * sorting (asc → desc → none, internal or delegated), checkbox selection with
 * selectable-row rules, sticky action columns, skeleton loading, and an
 * empty state that echoes the active search term.
 *
 * Strings in columns whose key contains "status" auto-render as a
 * StatusBadge (dot-light) using a common status-word map — pass a custom
 * `render` to opt out.
 */

export type TableDataColumn<T> = {
  key: string
  title: string
  width?: string
  sortable?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  align?: "left" | "center" | "right"
  sticky?: "left" | "right"
}

export type TableDataSorting = {
  field: string
  direction: SortDirection
  /** When provided, sorting is delegated — data is rendered as passed. */
  onSort?: (field: string, direction: SortDirection) => void
}

export type TableDataSelection<T> = {
  selectedKeys: string[]
  onSelectionChange?: (keys: string[]) => void
  getRowKey?: (record: T) => string
  isRowSelectable?: (record: T) => boolean
  headerCheckboxDisabled?: boolean
}

export type TableDataRowActions<T> = {
  render: (record: T, index: number) => React.ReactNode
}

export type TableDataProps<T> = {
  data: T[]
  columns: TableDataColumn<T>[]
  loading?: boolean
  sorting?: TableDataSorting
  selection?: TableDataSelection<T>
  rowActions?: TableDataRowActions<T>
  emptyState?: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
  onRowClick?: (record: T, index: number) => void
}

/* Common status words → operational status tone (dot-light StatusBadge). */
const STATUS_TONES: Record<string, BadgeStatus> = {
  complete: "success",
  completed: "success",
  active: "success",
  approved: "success",
  delivered: "success",
  online: "success",
  "in delivery": "away",
  "in progress": "away",
  "pending pickup": "away",
  "picking up": "away",
  processing: "away",
  failed: "error",
  error: "error",
  rejected: "error",
  offline: "error",
  unavailable: "error",
  allocating: "information",
  queueing: "information",
  scheduled: "information",
  reviewing: "information",
  canceled: "neutral",
  cancelled: "neutral",
  draft: "neutral",
  idle: "neutral",
  pending: "warning",
  waiting: "warning",
  hold: "warning",
  inactive: "faded",
}

const SIZE_TEXT = { sm: "text-xs", md: "text-[14px]", lg: "text-base" } as const
const SIZE_PAD = { sm: "px-3 py-2", md: "px-6 py-4", lg: "px-8 py-6" } as const

const TableData = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  sorting,
  selection,
  rowActions,
  emptyState,
  className,
  size = "md",
  onRowClick,
}: TableDataProps<T>) => {
  const [internalSorting, setInternalSorting] = React.useState<{
    field: string
    direction: SortDirection
  }>({
    field: sorting?.field || "",
    direction: sorting?.direction || null,
  })

  // Cycle asc → desc → null.
  const handleSort = (field: string) => {
    const column = columns.find((col) => col.key === field)
    if (!column?.sortable) return

    let next: SortDirection = "asc"
    if (internalSorting.field === field) {
      if (internalSorting.direction === "asc") next = "desc"
      else if (internalSorting.direction === "desc") next = null
    }

    setInternalSorting({ field, direction: next })
    sorting?.onSort?.(field, next)
  }

  // Client-side sort only when sorting isn't delegated.
  const sortedData = React.useMemo(() => {
    if (sorting?.onSort || !internalSorting.direction) return data
    return [...data].sort((a, b) => {
      const aValue = a[internalSorting.field]
      const bValue = b[internalSorting.field]
      if (aValue === bValue) return 0
      const comparison = aValue < bValue ? -1 : 1
      return internalSorting.direction === "asc" ? comparison : -comparison
    })
  }, [data, internalSorting, sorting?.onSort])

  // Select-all and the header checkbox only count rows that pass
  // `isRowSelectable` — disabled rows are skipped.
  const selectableRows = React.useMemo(() => {
    if (!selection?.isRowSelectable) return sortedData
    return sortedData.filter(selection.isRowSelectable)
  }, [sortedData, selection])

  const handleSelectAll = (checked: boolean) => {
    if (!selection?.onSelectionChange || !selection?.getRowKey) return
    selection.onSelectionChange(checked ? selectableRows.map(selection.getRowKey) : [])
  }

  const handleSelectRow = (record: T, checked: boolean) => {
    if (!selection?.onSelectionChange || !selection?.getRowKey) return
    const key = selection.getRowKey(record)
    selection.onSelectionChange(
      checked
        ? [...selection.selectedKeys, key]
        : selection.selectedKeys.filter((k) => k !== key),
    )
  }

  const renderCell = (column: TableDataColumn<T>, record: T, index: number) => {
    const value = record[column.key]
    if (column.render) return column.render(value, record, index)

    if (column.key.toLowerCase().includes("status") && typeof value === "string") {
      const tone = STATUS_TONES[value.toLowerCase()] ?? "neutral"
      return (
        <StatusBadge variant="dot-light" status={tone} size="sm">
          {value}
        </StatusBadge>
      )
    }

    return value
  }

  // Sticky treatment per header cell — `actions` pins right with an opaque
  // fill and a hairline edge.
  const headStickyClass = (column: TableDataColumn<T>) =>
    column.key === "actions" || column.sticky === "right"
      ? "sticky right-0 z-10 border-l border-stroke-soft-200 bg-bg-weak-50"
      : column.sticky === "left"
        ? "sticky left-0 z-10 border-r border-stroke-soft-200 bg-bg-weak-50"
        : ""

  const cellStickyClass = (column: TableDataColumn<T>) =>
    column.key === "actions" || column.sticky === "right"
      ? "sticky right-0 z-[2] border-l border-stroke-soft-200 bg-bg-white-0"
      : column.sticky === "left"
        ? "sticky left-0 z-[2] border-r border-stroke-soft-200 bg-bg-white-0"
        : ""

  const alignClass = (align?: TableDataColumn<T>["align"]) =>
    align === "center" ? "text-center" : align === "right" ? "text-right" : ""

  if (loading) {
    return (
      <div
        data-slot="table-data"
        className={cn(
          "overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-white-0",
          className,
        )}
      >
        <Skeleton className="h-12 rounded-none" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex h-16 items-center border-t border-stroke-soft-200 px-6"
          >
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!data.length) {
    // Echo the active search term: URL params first, then any visible
    // search input.
    let searchTerm = ""
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const searchParam =
        urlParams.get("search") || urlParams.get("query") || urlParams.get("q")
      const searchInput = document.querySelector(
        'input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]',
      ) as HTMLInputElement | null
      searchTerm = searchParam || searchInput?.value || ""
    }

    return (
      <div
        data-slot="table-data"
        className={cn(
          "rounded-lg border border-stroke-soft-200 bg-bg-white-0",
          className,
        )}
      >
        {emptyState ? (
          <div className="p-12 text-center">{emptyState}</div>
        ) : (
          <EmptyState size="md" className="p-12">
            <EmptyStateIcon>
              <RiSearchLine aria-hidden />
            </EmptyStateIcon>
            <EmptyStateTitle>
              {searchTerm ? `No results found for "${searchTerm}"` : "No data"}
            </EmptyStateTitle>
            <EmptyStateDescription>
              Try checking the spelling or using a different search term.
            </EmptyStateDescription>
          </EmptyState>
        )}
      </div>
    )
  }

  const allSelected =
    !!selection &&
    selectableRows.length > 0 &&
    selection.selectedKeys.length === selectableRows.length
  const someSelected = !!selection && selection.selectedKeys.length > 0 && !allSelected

  return (
    <div
      data-slot="table-data"
      className={cn(
        "overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-white-0",
        className,
      )}
    >
      <Table containerClassName="overflow-x-auto">
        <TableHeader>
          <TableRow>
            {selection ? (
              <TableHead className={cn(SIZE_PAD[size], "w-px")}>
                <Checkbox
                  aria-label="Select all rows"
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  disabled={selection.headerCheckboxDisabled || selectableRows.length === 0}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                />
              </TableHead>
            ) : null}

            {columns.map((column) =>
              column.sortable ? (
                <TableHeadSortable
                  key={column.key}
                  label={column.title}
                  direction={
                    internalSorting.field === column.key ? internalSorting.direction : null
                  }
                  onSort={() => handleSort(column.key)}
                  className={cn(
                    SIZE_PAD[size],
                    "whitespace-nowrap",
                    alignClass(column.align),
                    headStickyClass(column),
                  )}
                  style={{ width: column.width }}
                />
              ) : (
                <TableHead
                  key={column.key}
                  className={cn(
                    SIZE_PAD[size],
                    "whitespace-nowrap",
                    alignClass(column.align),
                    headStickyClass(column),
                  )}
                  style={{ width: column.width }}
                >
                  {column.title}
                </TableHead>
              ),
            )}

            {rowActions ? (
              <TableHead
                className={cn(
                  SIZE_PAD[size],
                  "sticky right-0 z-10 border-l border-stroke-soft-200 bg-bg-weak-50",
                )}
              >
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedData.map((record, index) => {
            const rowKey = selection?.getRowKey?.(record) || index.toString()
            const isSelected = selection?.selectedKeys.includes(rowKey) || false

            return (
              <TableRow
                key={rowKey}
                data-state={isSelected ? "selected" : undefined}
                className={cn("group align-middle", onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(record, index)}
              >
                {selection ? (
                  <TableCell
                    className={SIZE_PAD[size]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      aria-label="Select row"
                      checked={isSelected}
                      disabled={
                        selection.isRowSelectable
                          ? !selection.isRowSelectable(record)
                          : false
                      }
                      onCheckedChange={(checked) => handleSelectRow(record, checked === true)}
                    />
                  </TableCell>
                ) : null}

                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      SIZE_PAD[size],
                      SIZE_TEXT[size],
                      "whitespace-nowrap",
                      alignClass(column.align),
                      cellStickyClass(column),
                    )}
                  >
                    {renderCell(column, record, index)}
                  </TableCell>
                ))}

                {rowActions ? (
                  <TableCell
                    className={cn(
                      SIZE_PAD[size],
                      SIZE_TEXT[size],
                      "sticky right-0 z-10 border-l border-stroke-soft-200 bg-bg-white-0 text-right font-medium",
                    )}
                  >
                    {rowActions.render(record, index)}
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export { TableData }
