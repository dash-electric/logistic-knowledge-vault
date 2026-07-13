"use client"

import * as React from "react"
import { RiLockLine as Lock, RiEyeLine as Eye, RiEyeOffLine as EyeOff } from "@remixicon/react"
import { InputRoot, Input, InputIcon } from "./input"
import { cn } from "./lib/utils"

/**
 * PasswordInput — wraps `InputRoot + Input + InputIcon` with a leading lock
 * icon (toggleable) and an eye / eye-off trailing toggle that flips the input
 * `type` between `password` and `text`. Use anywhere a password field is needed
 * in auth flows (login, signup, reset, change-password).
 */

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: "sm" | "md" | "lg" | "xl"
  invalid?: boolean
  /** Whether to show the leading lock icon. Defaults to `true`. */
  showLeadingIcon?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      size,
      invalid,
      showLeadingIcon = true,
      autoComplete = "current-password",
      placeholder = "••••••••",
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <InputRoot size={size} invalid={invalid}>
        {showLeadingIcon ? (
          <InputIcon>
            <Lock className="size-4" strokeWidth={1.75} />
          </InputIcon>
        ) : null}
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={className}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md mr-0.5",
            "text-icon-soft-400 hover:text-text-strong-950 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={1.75} />
          ) : (
            <Eye className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </InputRoot>
    )
  },
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
