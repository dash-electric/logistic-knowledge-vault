"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { RiDraggable, RiRouteLine, RiArrowRightSLine, RiCheckLine, RiLock2Line } from "@remixicon/react"
import { cn } from "./lib/utils"
import { Button } from "./button"

/**
 * StopSequenceList — reorder a trip's stops by drag (or keyboard) AND open each
 * stop to reveal its items. Pointer + keyboard sensors (Space to lift, arrows to
 * move, Space to drop) so it isn't gesture-only. When the order changes and
 * `onRecalculate` is provided, a "recalculate route" footer appears — reordering
 * stops invalidates the drawn polyline/ETA until the optimizer re-runs.
 *
 * Pass `children` (ItemRows) on a stop to make it expandable; the expand chevron
 * is a separate control from the drag handle, so there are no nested buttons and
 * dragging never fights the open/close tap.
 */
export type SequenceStop = {
  id: string
  address: React.ReactNode
  color: string
  meta?: React.ReactNode
  /** Item rows revealed when the stop is opened. */
  children?: React.ReactNode
  defaultOpen?: boolean
  /** Completed/locked: cannot be dragged and cannot be passed by other stops. */
  locked?: boolean
  /** Show a check instead of the sequence number (delivered). */
  done?: boolean
}

export type StopSequenceListProps = {
  stops: SequenceStop[]
  onReorder: (orderedIds: string[]) => void
  /** Show a recalculate affordance once the order is dirty. */
  onRecalculate?: () => void
  /** Read-only: disable all reordering (no handles, no drag). */
  disabled?: boolean
  className?: string
}

function SortableRow({ stop, index, disabled }: { stop: SequenceStop; index: number; disabled?: boolean }) {
  const locked = Boolean(stop.locked) || Boolean(disabled)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id, disabled: locked })
  const [open, setOpen] = React.useState(stop.defaultOpen ?? false)
  const hasItems = Boolean(stop.children)
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "border-b border-stroke-soft-200 bg-bg-white-0 last:border-0",
        isDragging && "relative z-10 rounded-sm shadow-card-md",
        stop.locked && "opacity-55",
      )}
    >
      <div className="flex items-center gap-2 px-1 py-2">
        {locked ? (
          // Locked: no drag handle — a lock glyph signals "order fixed".
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center text-icon-disabled-300 [&_svg]:size-4"
            title={stop.done ? "Delivered — order locked" : "Order locked"}
          >
            <RiLock2Line />
          </span>
        ) : (
          // Drag handle — a sibling of the disclosure, never nested.
          <button
            type="button"
            aria-label={`Reorder ${typeof stop.address === "string" ? stop.address : "stop"}`}
            className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-sm text-icon-soft-400 hover:bg-bg-weak-50 hover:text-icon-sub-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-24) active:cursor-grabbing [&_svg]:size-4"
            {...attributes}
            {...listeners}
          >
            <RiDraggable />
          </button>
        )}
        <span
          className="grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold tabular-nums text-white"
          style={{ background: stop.color }}
        >
          {stop.done ? <RiCheckLine className="size-3" /> : index + 1}
        </span>
        {hasItems ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text-strong-950">{stop.address}</span>
              {stop.meta ? <span className="mt-0.5 block text-xs tabular-nums text-text-sub-600">{stop.meta}</span> : null}
            </span>
            <RiArrowRightSLine className={cn("size-4 shrink-0 text-icon-soft-400 transition-transform", open && "rotate-90")} aria-hidden />
          </button>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-text-strong-950">{stop.address}</span>
            {stop.meta ? <span className="mt-0.5 block text-xs tabular-nums text-text-sub-600">{stop.meta}</span> : null}
          </span>
        )}
      </div>
      {hasItems && open ? <div className="pb-2 pl-10 pr-1">{stop.children}</div> : null}
    </li>
  )
}

export function StopSequenceList({ stops, onReorder, onRecalculate, disabled, className }: StopSequenceListProps) {
  const [order, setOrder] = React.useState<string[]>(() => stops.map((s) => s.id))
  const initialRef = React.useRef<string>(stops.map((s) => s.id).join(","))

  // Keep in sync if the parent swaps the stop set.
  React.useEffect(() => {
    const ids = stops.map((s) => s.id)
    setOrder(ids)
    initialRef.current = ids.join(",")
  }, [stops.map((s) => s.id).join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const byId = React.useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops])
  const lockedIds = React.useMemo(() => new Set(stops.filter((s) => s.locked).map((s) => s.id)), [stops])
  const dirty = order.join(",") !== initialRef.current

  const handleDragEnd = (e: DragEndEvent) => {
    if (disabled) return
    const { active, over } = e
    if (!over || active.id === over.id) return
    // A locked (completed) stop can't be moved, and nothing can be dropped onto
    // its position — completed stops stay put and stay ahead of the rest.
    if (lockedIds.has(active.id as string) || lockedIds.has(over.id as string)) return
    setOrder((prev) => {
      const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string))
      onReorder(next)
      return next
    })
  }

  return (
    <div className={cn("rounded-sm border border-stroke-soft-200 bg-bg-white-0", className)} data-slot="stop-sequence-list">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="px-1">
            {order.map((id, i) => {
              const stop = byId.get(id)
              return stop ? <SortableRow key={id} stop={stop} index={i} disabled={disabled} /> : null
            })}
          </ol>
        </SortableContext>
      </DndContext>
      {onRecalculate && dirty && !disabled ? (
        <div className="flex items-center justify-between gap-3 border-t border-stroke-soft-200 bg-bg-weak-50 px-3 py-2">
          <span className="text-xs text-text-sub-600">Order changed — route &amp; ETA are stale.</span>
          <Button size="xs" leftIcon={<RiRouteLine />} onClick={onRecalculate}>
            Recalculate
          </Button>
        </div>
      ) : null}
    </div>
  )
}
