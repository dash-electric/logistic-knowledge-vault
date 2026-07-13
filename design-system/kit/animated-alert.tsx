"use client"

import * as React from "react"
import { Alert } from "./alert"
import { cn } from "./lib/utils"

/**
 * AnimatedAlert — Ported from Dash Next Portal v2.
 * A thin wrapper around Alert that adds a `fade-in / zoom-in-95 / slide-in-from-top-4`
 * entrance using Tailwind's `animate-in` utilities. Re-keying on the alert's identity
 * causes the animation to replay on every change.
 */

export type AnimatedAlertStatus =
  | "error"
  | "warning"
  | "success"
  | "information"
  | "feature"

export type AnimatedAlertError = {
  type: AnimatedAlertStatus
  title?: React.ReactNode
  message?: React.ReactNode
}

export type AnimatedAlertProps = {
  error: AnimatedAlertError
  className?: string
}

const AnimatedAlert = React.forwardRef<HTMLDivElement, AnimatedAlertProps>(
  ({ error, className }, ref) => {
    const k = `${error.type}-${String(error.title)}-${String(error.message)}`
    return (
      <div
        ref={ref}
        key={k}
        data-slot="animated-alert"
        className={cn(
          "duration-300 animate-in fade-in zoom-in-95 slide-in-from-top-4",
          className,
        )}
      >
        <Alert status={error.type} appearance="lighter" size="lg" className="w-full">
          <div className="flex flex-col gap-1">
            {error.title ? (
              <span className="text-sm font-medium text-text-strong-950">
                {error.title}
              </span>
            ) : null}
            {error.message ? (
              <span className="text-sm text-text-strong-950">{error.message}</span>
            ) : null}
          </div>
        </Alert>
      </div>
    )
  },
)
AnimatedAlert.displayName = "AnimatedAlert"

export { AnimatedAlert }
