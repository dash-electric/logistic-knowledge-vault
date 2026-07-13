"use client"

import * as React from "react"
import { RiCloseLine, RiAlertLine } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * ActiveZoneChip — shows the currently selected zone (color dot + name) with an
 * optional clear button. Sits above the map while editing/inspecting a zone.
 */
export type ActiveZoneChipProps = {
  name: React.ReactNode
  color?: string
  onClear?: () => void
  className?: string
}
export function ActiveZoneChip({ name, color = "#5E2AAC", onClear, className }: ActiveZoneChipProps) {
  return (
    <span
      data-slot="active-zone-chip"
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border border-stroke-soft-200 bg-bg-white-0 py-1 pl-2.5 pr-1 text-sm shadow-xs",
        className,
      )}
    >
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span className="font-medium text-text-strong-950">{name}</span>
      {onClear ? (
        <button
          type="button"
          aria-label="Clear active zone"
          onClick={onClear}
          className="grid size-6 place-items-center rounded-sm text-icon-soft-400 hover:bg-bg-weak-50 hover:text-icon-strong-950 [&_svg]:size-4"
        >
          <RiCloseLine />
        </button>
      ) : null}
    </span>
  )
}

/**
 * ConflictBanner — warns when zones overlap (a stop could route to two hubs).
 * Lists the conflicting zones and offers a resolve action. Error-toned, hairline.
 */
export type ConflictBannerProps = {
  count?: number
  message?: React.ReactNode
  conflicts?: React.ReactNode[]
  onResolve?: () => void
  resolveLabel?: React.ReactNode
  className?: string
}
export function ConflictBanner({ count, message, conflicts, onResolve, resolveLabel = "Resolve", className }: ConflictBannerProps) {
  return (
    <div
      role="alert"
      data-slot="conflict-banner"
      className={cn(
        "rounded-sm border border-(--state-error-base) bg-(--state-error-lighter) px-3 py-2",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <RiAlertLine className="mt-0.5 size-4 shrink-0 text-(--state-error-base)" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-(--state-error-dark)">
            {message ?? `${count ?? conflicts?.length ?? ""} zone conflict${(count ?? conflicts?.length ?? 0) === 1 ? "" : "s"} detected`}
          </p>
          {conflicts?.length ? (
            <ul className="mt-1 space-y-0.5 text-xs text-(--state-error-dark)">
              {conflicts.map((c, i) => (
                <li key={i} className="truncate">· {c}</li>
              ))}
            </ul>
          ) : null}
        </div>
        {onResolve ? (
          <button
            type="button"
            onClick={onResolve}
            className="shrink-0 rounded-sm px-2 py-1 text-xs font-medium text-(--state-error-dark) underline-offset-2 hover:underline"
          >
            {resolveLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
