"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "./lib/utils"
import { Label } from "./label"
import { Hint } from "./hint"

/**
 * Form — vanilla useState + hand-rolled validation. No react-hook-form, no
 * zod, no @hookform/resolvers. Matches Dash AI rules: every Dash FE repo
 * (portal-v2, backoffice, halo-dash, basecamp, fleet-mgmt) hard-bans RHF and
 * schema libs, so the design-system block must too.
 *
 * Public surface:
 *   useDashForm<T>(initialValues)        -> FormState<T>
 *   <Form form={...} onSubmit={...}>     -> native <form> wrapper
 *   <FormField name form validate>       -> render-prop, supplies value/onChange/error
 *   <FormItem> / <FormLabel> / <FormControl> / <FormDescription> / <FormMessage>
 *   useFormField()                       -> id wiring + error for current field
 *
 * Composition mirrors the previous RHF API so call sites can migrate with
 * mostly mechanical edits — the render prop now hands you
 * `{ value, onChange, error }` instead of RHF's `{ field, fieldState }`.
 */

// -----------------------------------------------------------------------------
// useDashForm — minimal useState-backed form state
// -----------------------------------------------------------------------------

export type FormErrors<T> = Partial<Record<keyof T, string>>

export type FormState<T extends Record<string, unknown>> = {
  values: T
  errors: FormErrors<T>
  setValue: <K extends keyof T>(key: K, value: T[K]) => void
  setError: <K extends keyof T>(key: K, error: string | null) => void
  setErrors: (errors: FormErrors<T>) => void
  reset: (next?: T) => void
}

/**
 * Hand-rolled form state. One useState per concern (values, errors) keeps the
 * re-render footprint identical to what a developer would write by hand — no hidden
 * context updates, no proxy magic.
 */
export function useDashForm<T extends Record<string, unknown>>(
  initialValues: T,
): FormState<T> {
  const initialRef = React.useRef(initialValues)
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrorsState] = React.useState<FormErrors<T>>({})

  const setValue = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
      // Clear the field error on edit — punishing users for fixing an error
      // is the most common form anti-pattern.
      setErrorsState((prev) => {
        if (prev[key] === undefined) return prev
        const { [key]: _drop, ...rest } = prev
        return rest as FormErrors<T>
      })
    },
    [],
  )

  const setError = React.useCallback(
    <K extends keyof T>(key: K, error: string | null) => {
      setErrorsState((prev) => {
        if (error === null) {
          if (prev[key] === undefined) return prev
          const { [key]: _drop, ...rest } = prev
          return rest as FormErrors<T>
        }
        return { ...prev, [key]: error }
      })
    },
    [],
  )

  const setErrors = React.useCallback((next: FormErrors<T>) => {
    setErrorsState(next)
  }, [])

  const reset = React.useCallback((next?: T) => {
    setValues(next ?? initialRef.current)
    setErrorsState({})
  }, [])

  return { values, errors, setValue, setError, setErrors, reset }
}

// -----------------------------------------------------------------------------
// Field-level context (id wiring + per-field error visibility)
// -----------------------------------------------------------------------------

type FormFieldContextValue = {
  name: string
  error?: string
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue | null>(null)

/**
 * Read the active field + item context. Returns id wiring + the current
 * error string (or undefined). Must be called inside <FormField> + <FormItem>.
 */
export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  if (!fieldContext) {
    throw new Error("useFormField must be used within <FormField>")
  }
  if (!itemContext) {
    throw new Error("useFormField must be used within <FormItem>")
  }
  const { id } = itemContext
  return {
    id,
    name: fieldContext.name,
    error: fieldContext.error,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}

// -----------------------------------------------------------------------------
// <Form> — native <form> wrapper that calls onSubmit(form.values)
// -----------------------------------------------------------------------------

type FormProps<T extends Record<string, unknown>> = Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit"
> & {
  form: FormState<T>
  /** Called with the current values on submit. preventDefault is automatic. */
  onSubmit?: (values: T) => void | Promise<void>
  children: React.ReactNode
}

export function Form<T extends Record<string, unknown>>({
  form,
  onSubmit,
  children,
  ...rest
}: FormProps<T>) {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (onSubmit) await onSubmit(form.values)
  }
  return (
    <form onSubmit={handleSubmit} {...rest}>
      {children}
    </form>
  )
}

// -----------------------------------------------------------------------------
// <FormField> — render-prop bridge between FormState and FormItem subtree
// -----------------------------------------------------------------------------

type FormFieldRenderProps<TValue> = {
  value: TValue
  onChange: (next: TValue) => void
  error?: string
  name: string
}

type FormFieldProps<T extends Record<string, unknown>, K extends keyof T> = {
  form: FormState<T>
  name: K
  /**
   * Optional per-field validator. Called on submit via Form's validation
   * helper (see `validateForm`) OR on change if `validateOn === "change"`.
   * Return a string to mark invalid, null/undefined to mark valid.
   */
  validate?: (value: T[K], values: T) => string | null | undefined
  /** Defaults to "submit". "change" runs the validator on every keystroke. */
  validateOn?: "submit" | "change"
  children: (props: FormFieldRenderProps<T[K]>) => React.ReactNode
}

export function FormField<
  T extends Record<string, unknown>,
  K extends keyof T,
>({ form, name, validate, validateOn = "submit", children }: FormFieldProps<T, K>) {
  const value = form.values[name]
  const error = form.errors[name]
  const nameStr = String(name)

  const onChange = React.useCallback(
    (next: T[K]) => {
      form.setValue(name, next)
      if (validateOn === "change" && validate) {
        const result = validate(next, { ...form.values, [name]: next } as T)
        form.setError(name, result ?? null)
      }
    },
    [form, name, validate, validateOn],
  )

  return (
    <FormFieldContext.Provider value={{ name: nameStr, error }}>
      {children({ value, onChange, error, name: nameStr })}
    </FormFieldContext.Provider>
  )
}

// -----------------------------------------------------------------------------
// validateForm — helper for one-shot submit-time validation
// -----------------------------------------------------------------------------

/**
 * Run a set of validators against the current form values. Returns the error
 * map; an empty object means everything is valid. Sets the errors on the
 * form as a side effect so FormMessage components light up.
 *
 *   const errs = validateForm(form, {
 *     mitraId: (v) => /^mtr-\d{4,}$/.test(v) ? null : "Format: mtr-9412",
 *     reason:  (v) => v.length >= 20 ? null : "Minimal 20 karakter",
 *   })
 *   if (Object.keys(errs).length > 0) return
 */
export function validateForm<T extends Record<string, unknown>>(
  form: FormState<T>,
  validators: { [K in keyof T]?: (value: T[K], values: T) => string | null | undefined },
): FormErrors<T> {
  const next: FormErrors<T> = {}
  for (const key of Object.keys(validators) as (keyof T)[]) {
    const v = validators[key]
    if (!v) continue
    const result = v(form.values[key], form.values)
    if (result) next[key] = result
  }
  form.setErrors(next)
  return next
}

// -----------------------------------------------------------------------------
// Presentation parts — pure className wrappers, RHF-free
// -----------------------------------------------------------------------------

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId()
    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          data-slot="form-item"
          className={cn("space-y-1.5", className)}
          {...props}
        />
      </FormItemContext.Provider>
    )
  },
)
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()
  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      data-error={error ? "true" : undefined}
      className={cn(error && "text-error-base", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      data-slot="form-description"
      className={cn("text-xs text-text-sub-600", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ?? children
  if (!body) return null
  return (
    <Hint
      ref={ref as React.Ref<HTMLParagraphElement>}
      id={formMessageId}
      tone="error"
      className={className}
      {...props}
    >
      {body}
    </Hint>
  )
})
FormMessage.displayName = "FormMessage"

export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
