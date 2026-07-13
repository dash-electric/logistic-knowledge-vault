"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { RiCloseLine as X } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Sheet — generic side panel built on Radix Dialog.
 * Companion to Drawer (Drawer is mobile-bottom-anchored variant);
 * Sheet is for desktop side / top / bottom large overlays.
 */

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-[#171717]/45 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const sheetContentVariants = cva(
  cn(
    "fixed z-50 flex flex-col bg-bg-white-0 text-text-strong-950 shadow-custom-shadows-large",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:duration-200 data-[state=open]:duration-300",
  ),
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full border-l border-stroke-soft-200 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        left: "inset-y-0 left-0 h-full border-r border-stroke-soft-200 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        top: "inset-x-0 top-0 border-b border-stroke-soft-200 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t border-stroke-soft-200 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
        xl: "",
        full: "",
      },
    },
    compoundVariants: [
      { side: "right", size: "sm", className: "w-80" },
      { side: "right", size: "md", className: "w-96" },
      { side: "right", size: "lg", className: "w-[28rem]" },
      { side: "right", size: "xl", className: "w-[36rem]" },
      { side: "right", size: "full", className: "w-screen" },
      { side: "left", size: "sm", className: "w-80" },
      { side: "left", size: "md", className: "w-96" },
      { side: "left", size: "lg", className: "w-[28rem]" },
      { side: "left", size: "xl", className: "w-[36rem]" },
      { side: "left", size: "full", className: "w-screen" },
      { side: "top", size: "sm", className: "h-40" },
      { side: "top", size: "md", className: "h-64" },
      { side: "top", size: "lg", className: "h-80" },
      { side: "top", size: "xl", className: "h-[28rem]" },
      { side: "top", size: "full", className: "h-screen" },
      { side: "bottom", size: "sm", className: "h-40" },
      { side: "bottom", size: "md", className: "h-64" },
      { side: "bottom", size: "lg", className: "h-80" },
      { side: "bottom", size: "xl", className: "h-[28rem]" },
      { side: "bottom", size: "full", className: "h-screen" },
    ],
    defaultVariants: { side: "right", size: "md" },
  },
)

type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & { showClose?: boolean }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, side, size, showClose = true, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-slot="sheet-content"
      className={cn(sheetContentVariants({ side, size }), className)}
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
  </SheetPortal>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-header"
    className={cn("flex flex-col gap-1 p-6 border-b border-stroke-soft-200", className)}
    {...props}
  />
)

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="sheet-title"
    className={cn("text-base font-medium tracking-tight text-text-strong-950", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="sheet-description"
    className={cn("text-sm text-text-sub-600 leading-relaxed", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-body"
    className={cn("flex-1 overflow-y-auto p-6", className)}
    {...props}
  />
)

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="sheet-footer"
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 border-t border-stroke-soft-200",
      className,
    )}
    {...props}
  />
)

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
}
