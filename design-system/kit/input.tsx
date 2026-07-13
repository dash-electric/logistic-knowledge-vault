"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Text Input — Figma parity v2 (node 266:5230 → Text Input [1.1]).
 *
 * Figma sizes (height / padding TRBL / radius / gap):
 *  - Medium (40):   h=40 · pt/pr/pb/pl=10/10/10/12 · radius=10 · gap=8
 *  - Small (36):    h=36 · pt/pr/pb/pl=8/8/8/10   · radius=8  · gap=8
 *  - X-Small (32):  h=32 · pt/pr/pb/pl=6/6/6/8    · radius=8  · gap=6
 *
 * Dash extension: `xl` (44) kept for backwards compat (used in some auth flows).
 * State colors map to Dash semantic tokens (auto-theme primary purple).
 */
const inputRootVariants = cva(
  cn(
    "flex items-center w-full border bg-bg-white-0 transition-colors",
    "border-stroke-soft-200",
    "focus-within:border-stroke-strong-950 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    "has-[input:disabled]:opacity-50 has-[input:disabled]:bg-bg-weak-50 has-[input:disabled]:cursor-not-allowed",
    "data-[invalid=true]:border-error-base data-[invalid=true]:focus-within:ring-error-base/30",
  ),
  {
    variants: {
      size: {
        // Figma X-Small (32) — pad t/r/b/l = 6/6/6/8 · radius 8 · gap 6
        sm: "h-8 rounded-lg pl-2 pr-1.5 py-1.5 text-xs gap-1.5",
        // Figma Small (36) — pad 8/8/8/10 · radius 8 · gap 8
        md: "h-9 rounded-lg pl-2.5 pr-2 py-2 text-sm gap-2",
        // Figma Medium (40) — pad 10/10/10/12 · radius 10 · gap 8
        lg: "h-10 rounded-sm pl-3 pr-2.5 py-2.5 text-sm gap-2",
        // Dash extension (44) — used by some auth flows; not in Figma
        xl: "h-11 rounded-sm pl-3.5 pr-3 py-2.5 text-base gap-2.5",
      },
    },
    defaultVariants: { size: "lg" },
  },
)

type InputRootProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof inputRootVariants> & {
    invalid?: boolean
    disabled?: boolean
  }

const InputRoot = React.forwardRef<HTMLDivElement, InputRootProps>(
  ({ className, size, invalid, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-root"
      data-invalid={invalid ? "true" : undefined}
      className={cn(inputRootVariants({ size }), className)}
      {...props}
    />
  ),
)
InputRoot.displayName = "InputRoot"

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "flex-1 bg-transparent outline-none text-text-strong-950 placeholder:text-text-soft-400",
        "disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

const InputIcon = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-slot="input-icon"
    className={cn("inline-flex items-center justify-center text-icon-soft-400 shrink-0", className)}
    {...props}
  />
)

const InputAffix = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-slot="input-affix"
    className={cn("text-sm text-text-soft-400 shrink-0", className)}
    {...props}
  />
)

export { InputRoot, Input, InputIcon, InputAffix, inputRootVariants }
