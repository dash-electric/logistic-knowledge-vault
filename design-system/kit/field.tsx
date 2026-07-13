"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * Field — lightweight form-row primitive without react-hook-form coupling.
 * Use when wiring forms manually. For RHF integration use <Form*> from form.tsx.
 *
 * Layout: <Field> wraps a stack of label + control + hint/error.
 */

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  ),
)
Field.displayName = "Field"

const FieldRow = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-row"
      className={cn("flex items-center justify-between gap-3", className)}
      {...props}
    />
  ),
)
FieldRow.displayName = "FieldRow"

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-group"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  ),
)
FieldGroup.displayName = "FieldGroup"

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="field-description"
    className={cn("text-xs text-text-sub-600 leading-relaxed", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

export { Field, FieldRow, FieldGroup, FieldDescription }
