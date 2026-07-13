"use client"

import * as React from "react"
import { RiErrorWarningLine as AlertCircle, RiCheckboxCircleLine as CheckCircle2, RiInformationLine as Info } from "@remixicon/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

// Figma Hint Text [1.1] node 263:1844 — 3 states (Default/Error/Disabled).
//   text 12/16 weight 400 (font-normal), 4px gap, leading 16x16 icon (vector 12x12).
//   Default: icon + text #5C5C5C (text-sub-600)
//   Error:   icon + text #FA3748 (state-error-base)
//   Disabled: icon + text #D1D1D1 (text-disabled-300) — Dash adds via [data-disabled]
const hintVariants = cva("inline-flex items-start gap-1 text-xs leading-4", {
  variants: {
    tone: {
      neutral: "text-text-sub-600",
      success: "text-success-base",
      warning: "text-warning-base",
      error: "text-error-base",
      information: "text-information-base",
    },
  },
  defaultVariants: { tone: "neutral" },
})

const iconForTone = {
  neutral: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  information: Info,
} as const

type HintProps = React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof hintVariants> & {
    /** Hide leading icon. */
    hideIcon?: boolean
    /** Visual disabled state per Figma. */
    disabled?: boolean
  }

const Hint = React.forwardRef<HTMLParagraphElement, HintProps>(
  ({ className, tone = "neutral", hideIcon, disabled, children, ...props }, ref) => {
    const Icon = iconForTone[tone ?? "neutral"]
    return (
      <p
        ref={ref}
        data-slot="hint"
        data-tone={tone}
        data-disabled={disabled ? "" : undefined}
        className={cn(
          hintVariants({ tone }),
          disabled && "text-text-disabled-300",
          className,
        )}
        {...props}
      >
        {!hideIcon ? (
          <Icon strokeWidth={2} className="size-4 shrink-0" aria-hidden />
        ) : null}
        <span>{children}</span>
      </p>
    )
  },
)
Hint.displayName = "Hint"

export { Hint }
