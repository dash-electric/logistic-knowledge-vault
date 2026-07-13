"use client"

import * as React from "react"
import { cn } from "./lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Shape preset; "rect" default, "circle" for avatar slots, "text" for paragraphs. */
  shape?: "rect" | "circle" | "text"
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape = "rect", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="skeleton"
      data-shape={shape}
      aria-hidden
      className={cn(
        "animate-pulse bg-bg-soft-200/80",
        shape === "rect" && "rounded-md",
        shape === "circle" && "rounded-full",
        shape === "text" && "rounded h-3.5",
        className,
      )}
      {...props}
    />
  ),
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
