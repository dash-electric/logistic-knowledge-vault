"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { RiSearchLine as Search } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Command Menu — Figma 1:1 parity (node 4152:24764).
 *
 * Input row: 48h, border-b 1px stroke-soft-200, pad L20 R20 T14 B14, gap 8,
 *            placeholder text-soft-400 (rgba(163,163,163)).
 * Item: 40h Small (r=10, pad L12 R12 T10 B10, gap 12). Hover bg-bg-weak-50.
 * Shortcut chip: r=4, 1px stroke-soft-200, pad L6 R6 T2 B2, font 12/16 Plus Jakarta.
 * Group heading: 10px uppercase tracking-widest text-soft-400.
 */

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    data-slot="command"
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-bg-white-0 text-text-strong-950",
      className,
    )}
    {...props}
  />
))
Command.displayName = "Command"

/* -------------------------------------------------------------------------- */
/* Modal dialog wrapper                                                        */
/* -------------------------------------------------------------------------- */

type CommandDialogProps = React.ComponentProps<typeof DialogPrimitive.Root> & {
  title?: string
  description?: string
  children: React.ReactNode
}

const CommandDialog = ({ title = "Command Menu", description, children, ...props }: CommandDialogProps) => (
  <DialogPrimitive.Root {...props}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="command-dialog-overlay"
        className={cn(
          "fixed inset-0 z-50 bg-bg-strong-950/40 backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        )}
      />
      <DialogPrimitive.Content
        data-slot="command-dialog-content"
        className={cn(
          "fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-stroke-soft-200 bg-bg-white-0 overflow-hidden shadow-custom-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        )}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
        ) : null}
        <Command>{children}</Command>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)
CommandDialog.displayName = "CommandDialog"

/* -------------------------------------------------------------------------- */
/* Subparts                                                                    */
/* -------------------------------------------------------------------------- */

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex h-12 items-center gap-2 px-6 border-b border-stroke-soft-200" data-slot="command-input-wrapper">
    <Search aria-hidden strokeWidth={1.75} className="size-5 text-icon-soft-400 shrink-0" />
    <CommandPrimitive.Input
      ref={ref}
      data-slot="command-input"
      className={cn(
        "flex h-full w-full bg-transparent text-sm text-text-strong-950 outline-none",
        "placeholder:text-text-soft-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    data-slot="command-list"
    className={cn("max-h-[320px] overflow-y-auto overflow-x-hidden p-2", className)}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    data-slot="command-empty"
    className="py-8 text-center text-sm text-text-soft-400"
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    data-slot="command-group"
    className={cn(
      "overflow-hidden p-1 text-text-strong-950",
      "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-text-soft-400",
      className,
    )}
    {...props}
  />
))
CommandGroup.displayName = "CommandGroup"

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    data-slot="command-separator"
    className={cn("-mx-1 h-px bg-stroke-soft-200 my-1", className)}
    {...props}
  />
))
CommandSeparator.displayName = "CommandSeparator"

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    data-slot="command-item"
    className={cn(
      "relative flex cursor-default select-none items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-text-strong-950 outline-none",
      "data-[selected=true]:bg-bg-weak-50 data-[selected=true]:text-text-strong-950",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:text-text-disabled-300",
      "[&_svg]:size-5 [&_svg]:text-icon-sub-600 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-slot="command-shortcut"
    className={cn(
      "ml-auto inline-flex items-center gap-0.5 text-xs text-text-soft-400",
      className,
    )}
    {...props}
  />
)
CommandShortcut.displayName = "CommandShortcut"

const CommandKbd = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <kbd
    data-slot="command-kbd"
    className={cn(
      "inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded border border-stroke-soft-200 bg-bg-white-0 text-text-soft-400 text-xs font-medium",
      className,
    )}
    {...props}
  />
)
CommandKbd.displayName = "CommandKbd"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
  CommandItem,
  CommandShortcut,
  CommandKbd,
}
