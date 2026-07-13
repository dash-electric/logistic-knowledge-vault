"use client"

import * as React from "react"
import { RiStarLine as Star } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Rating — Figma 1:1 (16 nodes verified 2026-05-18).
 *
 * Star or heart row with half-step support, three sizes, controlled value.
 * Pass `icon` to swap the glyph (default Star, common alt Heart).
 * Pass `tone` to switch the filled colour (default yellow-500, heart usually error-base).
 */

type RatingTone = "yellow" | "error" | "primary" | "success" | "current"

type RatingProps = {
  value: number
  onValueChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  readOnly?: boolean
  allowHalf?: boolean
  /** Custom glyph component. Default = Remix RiStarLine. Pass any Remix icon (e.g. RiHeart3Fill) to render a heart row. */
  icon?: React.ElementType
  /** Filled-state colour. Default yellow (star). Use "error" for heart, "primary" for purple, "current" to inherit text-color. */
  tone?: RatingTone
  className?: string
  "aria-label"?: string
}

const sizeMap: Record<NonNullable<RatingProps["size"]>, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

const toneClass: Record<RatingTone, { fill: string; text: string }> = {
  yellow:  { fill: "fill-[var(--dash-yellow-500)]",   text: "text-[var(--dash-yellow-500)]" },
  error:   { fill: "fill-[var(--state-error-base)]", text: "text-[var(--state-error-base)]" },
  primary: { fill: "fill-primary",                    text: "text-primary" },
  success: { fill: "fill-[var(--state-success-base)]", text: "text-[var(--state-success-base)]" },
  current: { fill: "fill-current",                    text: "text-current" },
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    { value, onValueChange, max = 5, size = "md", readOnly = false, allowHalf = false, icon: IconCmp = Star, tone = "yellow", className, ...props },
    ref,
  ) => {
    const [hover, setHover] = React.useState<number | null>(null)
    const display = hover ?? value
    const sizeCls = sizeMap[size]
    const filledFillCls = toneClass[tone].fill
    const filledTextCls = toneClass[tone].text

    const handleClick = (i: number, half: boolean) => {
      if (readOnly) return
      onValueChange?.(half ? i - 0.5 : i)
    }

    return (
      <div
        ref={ref}
        role="radiogroup"
        data-slot="rating"
        // Figma node 532:4374 — row uses itemSpacing=2 (gap=0.5)
        className={cn("inline-flex items-center gap-0.5", readOnly && "pointer-events-none", className)}
        onMouseLeave={() => setHover(null)}
        {...props}
      >
        {Array.from({ length: max }, (_, idx) => {
          const i = idx + 1
          const filled = display >= i
          const halfFilled = !filled && display >= i - 0.5
          return (
            <span key={i} className="relative inline-flex">
              <IconCmp
                className={cn(
                  sizeCls,
                  "stroke-1 transition-colors",
                  filled
                    ? `${filledFillCls} ${filledTextCls}`
                    : "fill-transparent text-stroke-soft-200",
                )}
              />
              {halfFilled ? (
                <IconCmp
                  aria-hidden
                  className={cn(
                    sizeCls,
                    "absolute inset-0 stroke-1",
                    filledFillCls,
                    filledTextCls,
                  )}
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              ) : null}
              {!readOnly && allowHalf ? (
                <>
                  <button
                    type="button"
                    aria-label={`${i - 0.5} of ${max}`}
                    onClick={() => handleClick(i, true)}
                    onMouseEnter={() => setHover(i - 0.5)}
                    className="absolute inset-0 w-1/2"
                  />
                  <button
                    type="button"
                    aria-label={`${i} of ${max}`}
                    onClick={() => handleClick(i, false)}
                    onMouseEnter={() => setHover(i)}
                    className="absolute right-0 inset-y-0 w-1/2"
                  />
                </>
              ) : !readOnly ? (
                <button
                  type="button"
                  aria-label={`${i} of ${max}`}
                  onClick={() => handleClick(i, false)}
                  onMouseEnter={() => setHover(i)}
                  className="absolute inset-0"
                />
              ) : null}
            </span>
          )
        })}
      </div>
    )
  },
)
Rating.displayName = "Rating"

export { Rating }
export type { RatingProps, RatingTone }
