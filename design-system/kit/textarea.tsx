"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * Text Area — Figma parity v2 (node 434:6100 → Text Area [1.1]).
 *
 * Figma: single size · h auto · pad t/r/b/l = 10/10/10/12 · radius=12.
 * States: Default/Hover/Focus/Filled = bg-white-0 + stroke-soft-200 (Focus → stroke-strong-950).
 * Disabled = bg-weak-50, no border.
 * Error = bg-white-0 + state-error-base border.
 */

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot="textarea"
      data-invalid={invalid ? "true" : undefined}
      className={cn(
        // Figma: radius 12 · pad 10/10/10/12 · 1px border · bg white
        "flex min-h-20 w-full rounded-xl border bg-bg-white-0 pl-3 pr-2.5 py-2.5 text-sm",
        "border-stroke-soft-200 text-text-strong-950 placeholder:text-text-soft-400",
        "transition-colors resize-y",
        "focus-visible:outline-none focus-visible:border-stroke-strong-950 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:bg-bg-weak-50 disabled:cursor-not-allowed",
        "data-[invalid=true]:border-error-base data-[invalid=true]:focus-visible:ring-error-base/30",
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"

export { Textarea }
