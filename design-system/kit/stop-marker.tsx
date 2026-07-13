"use client"

import * as React from "react"
import { RiCheckLine, RiCloseLine, RiArrowUpLine } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * StopMarker — a numbered, route-colored stop pin for <DashMap> (place it with
 * <MapOverlay anchor="center">). Pure presentational, so it also renders
 * standalone in the gallery.
 *
 * State drives the glyph: planned/active → sequence number, done → check,
 * failed → ✕. Selected enlarges + adds a ring (z-raised by the consumer).
 * `kind` distinguishes drop-off (default, number) from pick-up (up-arrow accent).
 */
export type StopState = "planned" | "active" | "done" | "failed"
export type StopKind = "dropoff" | "pickup"

export type StopMarkerProps = React.HTMLAttributes<HTMLButtonElement> & {
  /** Route/batch color (use routeColor(index)). */
  color: string
  sequence?: number
  state?: StopState
  kind?: StopKind
  selected?: boolean
  size?: "sm" | "md"
}

const SIZES = { sm: "size-6 text-[11px]", md: "size-7 text-xs" } as const

export const StopMarker = React.forwardRef<HTMLButtonElement, StopMarkerProps>(
  ({ color, sequence, state = "planned", kind = "dropoff", selected, size = "md", className, style, ...props }, ref) => {
    const glyph =
      state === "done" ? (
        <RiCheckLine className="size-3.5" />
      ) : state === "failed" ? (
        <RiCloseLine className="size-3.5" />
      ) : (
        sequence
      )
    // Failed stops read in error red regardless of batch color.
    const bg = state === "failed" ? "var(--state-error-base)" : color
    return (
      <button
        ref={ref}
        type="button"
        data-slot="stop-marker"
        data-state={state}
        data-kind={kind}
        aria-label={`Stop ${sequence ?? ""} ${state}`}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full font-semibold text-white",
          "shadow-[0_1px_3px_rgba(23,23,23,0.35)] ring-2 ring-white",
          "cursor-pointer transition-transform duration-(--duration-fast) ease-(--ease-out)",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-24)",
          SIZES[size],
          state === "active" && "animate-pulse",
          selected && "scale-125 ring-[3px] ring-white",
          className,
        )}
        style={{ backgroundColor: bg, ...style }}
        {...props}
      >
        <span className="tabular-nums">{glyph}</span>
        {kind === "pickup" ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 inline-flex size-3.5 items-center justify-center rounded-full bg-bg-strong-950 ring-1 ring-white"
          >
            <RiArrowUpLine className="size-2.5 text-text-white-0" />
          </span>
        ) : null}
      </button>
    )
  },
)
StopMarker.displayName = "StopMarker"

export const DropoffMarker = React.forwardRef<HTMLButtonElement, Omit<StopMarkerProps, "kind">>(
  (props, ref) => <StopMarker ref={ref} kind="dropoff" {...props} />,
)
DropoffMarker.displayName = "DropoffMarker"

export const PickupMarker = React.forwardRef<HTMLButtonElement, Omit<StopMarkerProps, "kind">>(
  (props, ref) => <StopMarker ref={ref} kind="pickup" {...props} />,
)
PickupMarker.displayName = "PickupMarker"
