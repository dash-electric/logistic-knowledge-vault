"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * Shimmer — Ported from Dash Next Portal v2.
 *
 * Low-level loading primitive: caller sets shape via className, Shimmer owns
 * the moving-highlight gradient. Distinct from Skeleton (pulse-only) — use
 * Shimmer when you want a visible sweep.
 */
export type ShimmerProps = React.HTMLAttributes<HTMLDivElement>

const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="shimmer"
        className={cn(
          "animate-pulse bg-gradient-to-r from-(--bg-soft-200) via-(--bg-weak-50) to-(--bg-soft-200) bg-[length:200%_100%] dash-shimmer",
          className,
        )}
        {...props}
      >
        <style>{`
          @keyframes dash-shimmer-sweep {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .dash-shimmer { animation: dash-shimmer-sweep 1.5s ease-in-out infinite; }
        `}</style>
      </div>
    )
  },
)
Shimmer.displayName = "Shimmer"

export { Shimmer }
