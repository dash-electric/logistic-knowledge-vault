"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { RiCircleFill as Dot } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Input OTP — Figma parity v2 (node 266:5230 → Digit Input [1.1]).
 *
 * Figma: 80×64 per slot · radius 10 · pad 16/8 · text 24px.
 * Dash scales down to standard OTP dimensions (h-12 w-10) for codebase practicality,
 * preserves radius 10 + state tokens. Larger sizes via `size` prop later if needed.
 */
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-otp-group"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  ),
)
InputOTPGroup.displayName = "InputOTPGroup"

type SlotProps = React.HTMLAttributes<HTMLDivElement> & {
  index: number
}

const InputOTPSlot = React.forwardRef<HTMLDivElement, SlotProps>(
  ({ index, className, ...props }, ref) => {
    const ctx = React.useContext(OTPInputContext)
    const slot = ctx?.slots?.[index]
    return (
      <div
        ref={ref}
        data-slot="input-otp-slot"
        data-active={slot?.isActive ? "true" : undefined}
        className={cn(
          // Figma: radius 10 · 1px stroke-soft-200 · bg-white-0 (matches Text Input Medium)
          "relative flex h-12 w-10 items-center justify-center rounded-sm",
          "border border-stroke-soft-200 bg-bg-white-0 text-base font-medium text-text-strong-950",
          "transition-all",
          "data-[active=true]:border-stroke-strong-950 data-[active=true]:ring-2 data-[active=true]:ring-ring data-[active=true]:ring-offset-2",
          className,
        )}
        {...props}
      >
        {slot?.char ?? null}
        {slot?.hasFakeCaret ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-text-strong-950 duration-1000" />
          </div>
        ) : null}
      </div>
    )
  },
)
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" data-slot="input-otp-separator" {...props}>
      <Dot strokeWidth={1.75} className="size-4 text-icon-soft-400" />
    </div>
  ),
)
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
