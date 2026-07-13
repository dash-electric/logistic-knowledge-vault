"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Table as TanstackTable,
  type RowSelectionState,
} from "@tanstack/react-table"
import { RiArrowDownLine as ArrowDown, RiArrowUpLine as ArrowUp, RiExpandUpDownLine as ChevronsUpDown } from "@remixicon/react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table"
import { cn } from "./lib/utils"

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableSorting?: boolean
  enableRowSelection?: boolean
  pageSize?: number
  className?: string
  emptyState?: React.ReactNode
  onTableReady?: (table: TanstackTable<TData>) => void
}

function DataTable<TData, TValue>({
  columns,
  data,
  enableSorting = true,
  enableRowSelection = false,
  pageSize = 10,
  className,
  emptyState,
  onTableReady,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableSorting,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  React.useEffect(() => {
    onTableReady?.(table)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      data-slot="data-table"
      className={cn("rounded-xl border border-stroke-soft-200 bg-bg-white-0 overflow-hidden", className)}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sort = header.column.getIsSorted()
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      // Figma 587:5793 + Sorting Icons 581:2327: header label inherits TableHead
                      // typography (12/16 weight 500 uppercase tracking-wider text-soft-400).
                      // Sort icon = 16px, gap 8px between label and sort indicator.
                      <button
                        type="button"
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={cn(
                          "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-soft-400",
                          canSort && "hover:text-text-strong-950",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort ? (
                          sort === "asc" ? (
                            <ArrowUp strokeWidth={2} className="size-4" />
                          ) : sort === "desc" ? (
                            <ArrowDown strokeWidth={2} className="size-4" />
                          ) : (
                            <ChevronsUpDown strokeWidth={1.75} className="size-4 opacity-60" />
                          )
                        ) : null}
                      </button>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-10 text-text-sub-600">
                {emptyState ?? "Tidak ada data."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
export type { ColumnDef, TanstackTable }
