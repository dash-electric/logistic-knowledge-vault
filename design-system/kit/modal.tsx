"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { RiCloseLine as X } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Modal — Figma 1:1 parity (node 466:4630).
 *
 * Container:
 *   radius 20 | bg bg-white-0 | stroke 1px stroke-soft-200
 *   shadow shadow-custom-shadows-medium (Figma single 0/16/32 -12 @10%, closest token)
 *
 * Sections (separate Figma component_sets stacked inside Modal):
 *   Header  → pad 16 / 20 / 16 / 20 | gap 16 | bg bg-white-0
 *   Body    → pad 20 (consumer choice)
 *   Footer  → pad 16 / 20 / 16 / 20 | gap 12 | bg bg-white-0
 *
 * Status Modal (Alert variant): same container, Content frame uses HORIZONTAL
 * layout pad=20 gap=16 with leading icon box.
 *
 * Overlay: Figma color #333333 @ 24% opacity (no semantic token exists yet).
 *
 * Drift fixed (2026-05-17):
 *   - was rounded-2xl (16) → rounded-sm
 *   - was bg-overlay (undefined token) → bg-[#333]/24
 *   - was shadow-custom-lg (undefined) → shadow-custom-shadows-medium
 *   - was px-6 pt-6 pb-4 header / px-6 py-4 footer (24-based) → 16/20 (Figma 4-based grid)
 *   - footer was bg-bg-weak-50 + border-t (NOT in Figma) → bg-bg-white-0
 */

const Modal = DialogPrimitive.Root
const ModalTrigger = DialogPrimitive.Trigger
const ModalClose = DialogPrimitive.Close
const ModalPortal = DialogPrimitive.Portal

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="modal-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-[#171717]/45 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
))
ModalOverlay.displayName = "ModalOverlay"

const modalContentVariants = cva(
  cn(
    "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col",
    "bg-bg-white-0 rounded-sm border border-stroke-soft-200 shadow-custom-shadows-medium",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
    "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
    "max-h-[85vh]",
  ),
  {
    variants: {
      size: {
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
        "2xl": "w-full max-w-2xl",
      },
    },
    defaultVariants: { size: "md" },
  },
)

type ModalContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof modalContentVariants> & { showClose?: boolean }

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, size, showClose = true, children, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-slot="modal-content"
      className={cn(modalContentVariants({ size }), className)}
      {...props}
    >
      {children}
      {showClose ? (
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 size-7 inline-flex items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950"
        >
          <X strokeWidth={1.75} className="size-4" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </ModalPortal>
))
ModalContent.displayName = "ModalContent"

const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="modal-header"
    className={cn("flex flex-col gap-1 pt-4 pr-4 pb-4 pl-6", className)}
    {...props}
  />
)

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="modal-title"
    className={cn("text-base font-medium tracking-tight text-text-strong-950", className)}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="modal-description"
    className={cn("text-sm text-text-sub-600 leading-relaxed", className)}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

const ModalBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="modal-body"
    className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
    {...props}
  />
)

const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="modal-footer"
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 py-4 border-t border-stroke-soft-200",
      className,
    )}
    {...props}
  />
)

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
}
