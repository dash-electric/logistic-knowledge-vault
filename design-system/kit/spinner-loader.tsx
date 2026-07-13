"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * SpinnerLoader — Ported from Dash Next Portal v2.
 *
 * Page-level overlay spinner — 8 dots rotating with staggered opacity fade.
 * Differs from inline `Spinner`: this one owns its own backdrop, meant for
 * full-screen route-transition / suspense boundaries.
 */
export type SpinnerLoaderProps = {
  /** Render in a sized container instead of fixed-inset. */
  inline?: boolean
  className?: string
}

const SpinnerLoader = React.forwardRef<HTMLDivElement, SpinnerLoaderProps>(
  ({ inline = false, className }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="spinner-loader"
        className={cn(
          "flex items-center justify-center bg-bg-white-0",
          inline
            ? "h-64 w-full rounded-xl border border-stroke-soft-200"
            : "fixed inset-0 z-50",
          className,
        )}
        role="status"
        aria-label="Loading"
      >
        <div className="relative size-16">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8
            return (
              <span
                key={i}
                className="absolute size-3 rounded-full bg-primary dash-spinner-dot"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${angle}deg) translateY(-24px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            )
          })}
        </div>
        <style>{`
          @keyframes dash-spinner-dots {
            0%, 20% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
          .dash-spinner-dot { animation: dash-spinner-dots 1s ease-in-out infinite; }
        `}</style>
      </div>
    )
  },
)
SpinnerLoader.displayName = "SpinnerLoader"

export { SpinnerLoader }
