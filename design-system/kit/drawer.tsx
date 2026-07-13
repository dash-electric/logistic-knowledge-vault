"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { RiCloseLine as X } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Drawer — Figma 1:1 parity (node 486:7366).
 *
 * Container (Figma):
 *   400 wide | radius 20 (all corners — Figma renders as floating panel)
 *   bg bg-white-0 | shadow-custom-shadows-large (matches 8-layer drop + inner)
 *
 * Sections:
 *   Header / Footer / Content all pad=20 (p-6)
 *   Internal dividers: pad=6/20 (Content Divider [1.1])
 *
 * Sizes (Dash extension — Figma only ships 400px; we expose sm..xl + full):
 *   sm 320 | md 400 (Figma default) | lg 480 | xl 640 | full screen
 *
 * Drift fixed (2026-05-17): replaced shadcn-legacy tokens (bg-popover,
 * bg-foreground/40, text-popover-foreground, border-border, bg-card,
 * bg-accent, text-muted-foreground, var(--shadow-card-lg)) with Dash
 * semantic tokens + Figma multi-layer shadow.
 */

const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close
const DrawerPortal = DialogPrimitive.Portal

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="drawer-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-[#171717]/45 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
))
DrawerOverlay.displayName = "DrawerOverlay"

const drawerContentVariants = cva(
  cn(
    "fixed z-50 flex flex-col bg-bg-white-0 text-text-strong-950 shadow-custom-shadows-large",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:duration-200 data-[state=open]:duration-300",
  ),
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        left:
          "inset-y-0 left-0 h-full data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        top:
          "inset-x-0 top-0 data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
        bottom:
          "inset-x-0 bottom-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
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
      // right / left widths — md = 400 = Figma source-of-truth width
      { side: "right", size: "sm", className: "w-80" },
      { side: "right", size: "md", className: "w-[400px]" },
      { side: "right", size: "lg", className: "w-[480px]" },
      { side: "right", size: "xl", className: "w-[640px]" },
      { side: "right", size: "full", className: "w-screen" },
      { side: "left", size: "sm", className: "w-80" },
      { side: "left", size: "md", className: "w-[400px]" },
      { side: "left", size: "lg", className: "w-[480px]" },
      { side: "left", size: "xl", className: "w-[640px]" },
      { side: "left", size: "full", className: "w-screen" },
      // top / bottom heights
      { side: "top", size: "sm", className: "h-40" },
      { side: "top", size: "md", className: "h-64" },
      { side: "top", size: "lg", className: "h-96" },
      { side: "top", size: "xl", className: "h-[60vh]" },
      { side: "top", size: "full", className: "h-screen" },
      { side: "bottom", size: "sm", className: "h-40" },
      { side: "bottom", size: "md", className: "h-64" },
      { side: "bottom", size: "lg", className: "h-96" },
      { side: "bottom", size: "xl", className: "h-[60vh]" },
      { side: "bottom", size: "full", className: "h-screen" },
    ],
    defaultVariants: {
      side: "right",
      size: "md",
    },
  },
)

type DrawerContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    showClose?: boolean
  }

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, side, size, showClose = true, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-slot="drawer-content"
      data-side={side ?? "right"}
      className={cn(drawerContentVariants({ side, size }), className)}
      {...props}
    >
      {children}
      {showClose ? (
        <DialogPrimitive.Close
          aria-label="Close drawer"
          className="absolute top-3 right-3 size-7 inline-flex items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950"
        >
          <X strokeWidth={1.75} className="size-4" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1 p-6 border-b border-stroke-soft-200", className)}
      {...props}
    />
  ),
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="drawer-title"
    className={cn("text-base font-medium tracking-tight text-text-strong-950", className)}
    {...props}
  />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="drawer-description"
    className={cn("text-sm text-text-sub-600 leading-relaxed", className)}
    {...props}
  />
))
DrawerDescription.displayName = "DrawerDescription"

const DrawerBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-body"
      className={cn("flex-1 overflow-y-auto p-6", className)}
      {...props}
    />
  ),
)
DrawerBody.displayName = "DrawerBody"

const DrawerFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="drawer-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 border-t border-stroke-soft-200",
        className,
      )}
      {...props}
    />
  ),
)
DrawerFooter.displayName = "DrawerFooter"

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
}
