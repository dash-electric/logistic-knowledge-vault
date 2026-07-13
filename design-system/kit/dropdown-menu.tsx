"use client"

import * as React from "react"
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu"
import { RiCheckLine as Check, RiArrowRightSLine as ChevronRight, RiCircleLine as Circle } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * DropdownMenu — Figma 1:1 parity (node 166999:140904).
 *
 * Container ("Profile Dropdown Items" frames):
 *   pad 8 | radius 16 (rounded-2xl) | gap 4 (between items)
 *   bg bg-white-0 | stroke 1px stroke-soft-200
 *   shadow shadow-custom-shadows-medium (Figma 0/16/32 -12)
 *
 * Items ("Dropdown Items [1.1]"):
 *   Default size Small (36): pad 8 | corner 8 | gap 8 | layout horizontal
 *   Label text: 14/20 weight 400 color text-strong-950
 *   Sublabel: 12/16 weight 400 color text-soft-400
 *   Hover state: bg bg-weak-50
 *
 * Drift fixed (2026-05-17): replaced shadcn-legacy tokens (bg-popover,
 * text-popover-foreground, border-border, bg-accent, text-accent-foreground,
 * text-muted-foreground, bg-border, text-primary, text-destructive,
 * var(--shadow-card-md)) with Dash semantic tokens + Figma tokenized shadow.
 */

const DropdownMenu = DropdownPrimitive.Root
const DropdownMenuTrigger = DropdownPrimitive.Trigger
const DropdownMenuGroup = DropdownPrimitive.Group
const DropdownMenuPortal = DropdownPrimitive.Portal
const DropdownMenuSub = DropdownPrimitive.Sub
const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup

/* -------------------------------------------------------------------------- */
/* Content surface                                                             */
/* -------------------------------------------------------------------------- */

const surfaceClasses = cn(
  "z-50 min-w-44 rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-2 shadow-custom-shadows-medium",
  "flex flex-col gap-1",
)

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-slot="dropdown-menu-content"
      className={cn(
        surfaceClasses,
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
))
DropdownMenuContent.displayName = "DropdownMenuContent"

/* -------------------------------------------------------------------------- */
/* Items                                                                       */
/* -------------------------------------------------------------------------- */

const baseItemClasses = cn(
  "relative flex cursor-default select-none items-center gap-2 rounded-lg px-2 py-2 text-sm leading-5",
  "text-text-strong-950 outline-none transition-colors",
  "data-[highlighted]:bg-bg-weak-50 data-[highlighted]:text-text-strong-950",
  "data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled-300",
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-icon-sub-600",
  "data-[highlighted]:[&_svg]:text-icon-strong-950",
)

type DropdownMenuItemProps = React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
  inset?: boolean
  destructive?: boolean
}

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, inset, destructive, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    data-slot="dropdown-menu-item"
    data-destructive={destructive || undefined}
    className={cn(
      baseItemClasses,
      inset && "pl-8",
      destructive &&
        "text-state-error-base data-[highlighted]:bg-state-error-lighter data-[highlighted]:text-state-error-base [&_svg]:text-state-error-base data-[highlighted]:[&_svg]:text-state-error-base",
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownPrimitive.CheckboxItem
    ref={ref}
    data-slot="dropdown-menu-checkbox-item"
    checked={checked}
    className={cn(baseItemClasses, "pl-8", className)}
    {...props}
  >
    <span className="absolute left-2 inline-flex size-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Check strokeWidth={3} className="size-3 text-primary-base" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.RadioItem
    ref={ref}
    data-slot="dropdown-menu-radio-item"
    className={cn(baseItemClasses, "pl-8", className)}
    {...props}
  >
    <span className="absolute left-2 inline-flex size-4 items-center justify-center">
      <DropdownPrimitive.ItemIndicator>
        <Circle className="size-2 fill-primary-base text-primary-base" />
      </DropdownPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

/* -------------------------------------------------------------------------- */
/* Sub menu                                                                    */
/* -------------------------------------------------------------------------- */

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownPrimitive.SubTrigger
    ref={ref}
    data-slot="dropdown-menu-sub-trigger"
    className={cn(
      baseItemClasses,
      inset && "pl-8",
      "data-[state=open]:bg-bg-weak-50 data-[state=open]:text-text-strong-950",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight aria-hidden strokeWidth={1.75} className="ml-auto !size-3.5" />
  </DropdownPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.SubContent
    ref={ref}
    data-slot="dropdown-menu-sub-content"
    className={cn(
      surfaceClasses,
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
      className,
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

/* -------------------------------------------------------------------------- */
/* Section bits                                                                */
/* -------------------------------------------------------------------------- */

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownPrimitive.Label
    ref={ref}
    data-slot="dropdown-menu-label"
    className={cn(
      "px-2 py-1.5 text-[10px] font-medium uppercase tracking-widest text-text-soft-400",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Separator
    ref={ref}
    data-slot="dropdown-menu-separator"
    className={cn("-mx-2 my-1 h-px bg-stroke-soft-200", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-slot="dropdown-menu-shortcut"
    className={cn("ml-auto text-xs font-medium text-text-sub-600 tracking-wider", className)}
    {...props}
  />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

/* -------------------------------------------------------------------------- */
/* Rich item — icon + label + description, used in dispatch / mitra menus     */
/* -------------------------------------------------------------------------- */

type DropdownMenuRichItemProps = React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
  icon?: React.ReactNode
  description?: React.ReactNode
  shortcut?: React.ReactNode
  destructive?: boolean
}

const DropdownMenuRichItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  DropdownMenuRichItemProps
>(({ className, icon, description, shortcut, destructive, children, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    data-slot="dropdown-menu-rich-item"
    data-destructive={destructive || undefined}
    className={cn(
      "relative flex cursor-default select-none items-start gap-3 rounded-lg px-2 py-2 text-sm",
      "text-text-strong-950 outline-none transition-colors",
      "data-[highlighted]:bg-bg-weak-50 data-[highlighted]:text-text-strong-950",
      "data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled-300",
      destructive &&
        "text-state-error-base data-[highlighted]:bg-state-error-lighter data-[highlighted]:text-state-error-base",
      className,
    )}
    {...props}
  >
    {icon ? (
      <span className={cn("mt-0.5 shrink-0", destructive ? "text-state-error-base" : "text-icon-sub-600")}>
        {icon}
      </span>
    ) : null}
    <div className="flex-1 min-w-0 space-y-0.5">
      <div className="font-medium leading-snug truncate">{children}</div>
      {description ? (
        <div className="text-xs text-text-sub-600 leading-snug">{description}</div>
      ) : null}
    </div>
    {shortcut ? (
      <span className="ml-2 text-xs font-medium text-text-sub-600 tracking-wider shrink-0">
        {shortcut}
      </span>
    ) : null}
  </DropdownPrimitive.Item>
))
DropdownMenuRichItem.displayName = "DropdownMenuRichItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRichItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
