"use client"

import * as React from "react"
import { cn } from "./lib/utils"

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean
  optional?: boolean
  hint?: React.ReactNode
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, optional, hint, children, ...props }, ref) => (
    <label
      ref={ref}
      data-slot="label"
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-text-strong-950",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {required ? <span aria-hidden className="text-error-base">*</span> : null}
      {optional ? <span className="text-text-soft-400 text-xs font-normal">(optional)</span> : null}
      {hint ? <span className="text-text-soft-400 text-xs font-normal">{hint}</span> : null}
    </label>
  ),
)
Label.displayName = "Label"

export { Label }
