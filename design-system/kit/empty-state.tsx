"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

// Figma 3860:4495 / 3860:5822 Empty States: composed inside widget cards as a
// VERTICAL stack with itemSpacing 12 (illustration → description text).
// Inline (md) follows that gap-3 spec; sm/lg keep proportional rhythm.
const emptyStateVariants = cva("flex flex-col items-center text-center", {
  variants: {
    size: {
      sm: "gap-2 py-6",
      md: "gap-3 py-10",
      lg: "gap-4 py-16",
    },
  },
  defaultVariants: { size: "md" },
})

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof emptyStateVariants>

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-state"
      role="status"
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    />
  ),
)
EmptyState.displayName = "EmptyState"

// Default Dash icon container = 48px disc (compact / list contexts).
// For Figma illustration parity use `<EmptyStateIllustration>` slot (148x148) instead.
const EmptyStateIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-state-icon"
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-full bg-bg-weak-50 text-icon-sub mb-1",
        "[&_svg]:size-6",
        className,
      )}
      {...props}
    />
  ),
)
EmptyStateIcon.displayName = "EmptyStateIcon"

// Figma illustration slot: 148x148 vector (e.g. "Empty States [HR Management]" 3860:4495).
// Wrap your SVG in this slot to lock canonical sizing without bg/border decoration.
const EmptyStateIllustration = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-state-illustration"
      className={cn("inline-flex size-[148px] items-center justify-center [&_svg]:size-full", className)}
      {...props}
    />
  ),
)
EmptyStateIllustration.displayName = "EmptyStateIllustration"

// Figma EmptyState title (when present): 16/24 weight 500 tracking-tight.
// Was font-semibold; patched to font-medium for Figma parity.
const EmptyStateTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="empty-state-title"
      className={cn("text-base font-medium tracking-tight text-text-strong-950", className)}
      {...props}
    />
  ),
)
EmptyStateTitle.displayName = "EmptyStateTitle"

// Figma description (e.g. "No records of tracked time yet."): 14/20 weight 400 text-sub-600.
const EmptyStateDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="empty-state-description"
    className={cn("text-sm text-text-sub-600 max-w-sm leading-relaxed", className)}
    {...props}
  />
))
EmptyStateDescription.displayName = "EmptyStateDescription"

const EmptyStateActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-state-actions"
      className={cn("flex flex-wrap items-center justify-center gap-2 mt-2", className)}
      {...props}
    />
  ),
)
EmptyStateActions.displayName = "EmptyStateActions"

export {
  EmptyState,
  EmptyStateIcon,
  // Renamed to avoid colliding with the canonical asset-based illustration in
  // ./empty-state-illustration. This is the bare 148×148 layout slot.
  EmptyStateIllustration as EmptyStateIllustrationSlot,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
}
