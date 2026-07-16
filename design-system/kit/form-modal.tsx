"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { RiCloseLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { Button } from "./button"

/**
 * FormModal — the opinionated dialog shell for CRUD forms and detail panels.
 *
 * Where `Modal` (modal.tsx) and `Sheet` (sheet.tsx) are compositional Radix
 * primitives, FormModal is the batteries-included assembly ported from
 * react-logistic-web: icon-chip header (title / subtitle / headerExtra),
 * scrollable body, footer strip, `position="center" | "right"`, and — the
 * reason it exists — a `confirmOnClose` guard that intercepts every close
 * path (Escape, backdrop, ✕) with an inline "discard changes?" layer.
 *
 * Radix supplies focus trap, scroll lock, and aria wiring. Clicks inside
 * `[data-searchable-dropdown-portal]` (body-portaled dropdown menus) are
 * treated as inside the dialog.
 */

export type FormModalTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"

const ICON_TONE: Record<FormModalTone, string> = {
  primary: "bg-(--theme-accent-alpha-10) text-accent",
  success: "bg-(--state-success-lighter) text-(--state-success-dark)",
  warning: "bg-(--state-warning-lighter) text-(--state-warning-dark)",
  danger: "bg-(--state-error-lighter) text-(--state-error-dark)",
  info: "bg-(--state-information-lighter) text-(--state-information-dark)",
  neutral: "bg-bg-weak-50 text-text-sub-600",
}

type FormModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full"

const CENTER_SIZE: Record<FormModalSize, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-lg",
  xl: "w-full max-w-xl",
  "2xl": "w-full max-w-2xl",
  full: "w-full max-w-7xl",
}

const RIGHT_SIZE: Record<FormModalSize, string> = {
  sm: "w-[400px] max-w-full",
  md: "w-[500px] max-w-full",
  lg: "w-[600px] max-w-full",
  xl: "w-[800px] max-w-full",
  "2xl": "w-[800px] max-w-full",
  full: "w-full max-w-7xl",
}

export type FormModalProps = {
  open: boolean
  /** Called when the modal actually closes (after the confirm guard, if any). */
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Leading header icon (an SVG icon element). */
  icon?: React.ReactNode
  iconTone?: FormModalTone
  /** Right-aligned header slot, before the close button. */
  headerExtra?: React.ReactNode
  footer?: React.ReactNode
  size?: FormModalSize
  /** center = dialog card; right = full-height drawer. */
  position?: "center" | "right"
  /** Intercept every close path with an inline discard-confirmation layer. */
  confirmOnClose?: boolean
  confirmTitle?: string
  confirmDescription?: string
  confirmDiscardLabel?: string
  confirmStayLabel?: string
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  /** Body padding on/off. */
  padded?: boolean
  className?: string
  bodyClassName?: string
  /** Ref to the scrollable body element. */
  contentRef?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconTone = "primary",
  headerExtra,
  footer,
  size = "md",
  position = "center",
  confirmOnClose = false,
  confirmTitle = "Discard unsaved changes?",
  confirmDescription = "Anything you have entered in this form will be lost.",
  confirmDiscardLabel = "Discard and exit",
  confirmStayLabel = "Stay and continue",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  padded = true,
  className,
  bodyClassName,
  contentRef,
  children,
}) => {
  const [confirmVisible, setConfirmVisible] = React.useState(false)

  // Reset the guard whenever the modal (re)opens.
  React.useEffect(() => {
    if (open) setConfirmVisible(false)
  }, [open])

  const requestClose = React.useCallback(() => {
    if (confirmOnClose) setConfirmVisible(true)
    else onClose()
  }, [confirmOnClose, onClose])

  const isRight = position === "right"

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="form-modal-overlay"
          className={cn(
            "fixed inset-0 z-50 bg-[#171717]/45 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          data-slot="form-modal-content"
          // Radix warns when a dialog ships without a Description; the
          // explicit undefined opts out for subtitle-less modals.
          {...(subtitle ? {} : { "aria-describedby": undefined })}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            if (closeOnEscape) requestClose()
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault()
            const target = e.target as HTMLElement | null
            if (target?.closest?.("[data-searchable-dropdown-portal]")) return
            if (closeOnBackdropClick) requestClose()
          }}
          onInteractOutside={(e) => {
            // Focus moving into body-portaled dropdowns must not close us.
            const target = e.target as HTMLElement | null
            if (target?.closest?.("[data-searchable-dropdown-portal]")) {
              e.preventDefault()
            }
          }}
          className={cn(
            "fixed z-50 flex flex-col bg-bg-white-0 border border-stroke-soft-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            isRight
              ? cn(
                  "inset-y-0 right-0 h-full shadow-custom-shadows-large",
                  "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
                  "data-[state=closed]:duration-200 data-[state=open]:duration-300",
                  RIGHT_SIZE[size],
                )
              : cn(
                  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm",
                  "max-h-[90vh] shadow-custom-shadows-medium",
                  "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
                  CENTER_SIZE[size],
                ),
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-stroke-soft-200 px-5 py-4">
            {icon ? (
              <span
                aria-hidden
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[18px]",
                  ICON_TONE[iconTone],
                )}
              >
                {icon}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-medium tracking-tight text-text-strong-950">
                {title}
              </DialogPrimitive.Title>
              {subtitle ? (
                <DialogPrimitive.Description className="mt-0.5 text-sm text-text-sub-600">
                  {subtitle}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            {headerExtra ? (
              <div className="shrink-0 self-center">{headerExtra}</div>
            ) : null}
            {showCloseButton ? (
              <button
                type="button"
                aria-label="Close"
                onClick={requestClose}
                className="shrink-0 self-start inline-flex size-7 items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950"
              >
                <RiCloseLine strokeWidth={1.75} className="size-4" />
              </button>
            ) : null}
          </div>

          {/* Body */}
          <div
            ref={contentRef}
            data-slot="form-modal-body"
            className={cn("flex-1 overflow-y-auto", padded && "px-5 py-4", bodyClassName)}
          >
            {children}
          </div>

          {/* Footer */}
          {footer ? (
            <div
              data-slot="form-modal-footer"
              className="border-t border-stroke-soft-200 bg-bg-weak-50 px-5 py-4"
            >
              {footer}
            </div>
          ) : null}

          {/* Confirm-on-close guard layer */}
          {confirmVisible ? (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-bg-white-0/80 p-6 backdrop-blur-[2px]">
              <div
                role="alertdialog"
                aria-label={confirmTitle}
                className="w-full max-w-sm rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-5 shadow-custom-shadows-large"
              >
                <p className="text-sm font-medium tracking-tight text-text-strong-950">
                  {confirmTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-sub-600">
                  {confirmDescription}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    tone="neutral"
                    style="stroke"
                    size="sm"
                    onClick={() => {
                      setConfirmVisible(false)
                      onClose()
                    }}
                  >
                    {confirmDiscardLabel}
                  </Button>
                  <Button
                    tone="primary"
                    style="filled"
                    size="sm"
                    onClick={() => setConfirmVisible(false)}
                  >
                    {confirmStayLabel}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
FormModal.displayName = "FormModal"

export { FormModal }
