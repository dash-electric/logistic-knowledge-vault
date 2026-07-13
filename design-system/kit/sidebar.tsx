"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Sidebar — Figma 1:1 parity (Sidebar [Navigation] node 3802:11759 inside
 * Navigation page 3789:4743, paste verified 2026-05-17).
 *
 * Figma Sidebar item (3741:45019 set, 3 states × collapsed off/on):
 *  - Item: 232×36 (expanded), rounded-lg, 8px padding implied by inner layout.
 *      Layout: 20px icon + label + optional badges + optional shortcut chip +
 *              optional trailing chevron.
 *  - State map:
 *      Default → bg-white-0,  icon text-sub-600,    text-sub-600
 *      Hover   → bg-weak-50,  icon text-sub-600,    text-sub-600
 *      Active  → bg-weak-50,  icon (--primary-base),text-strong-950,
 *                + 4×20 primary fill bar on the leading edge (Figma's
 *                "active rail" affordance).
 *
 * Group label (Figma "Section Title" pattern): 12px uppercase tracking-wider
 * text-soft-400, weight 500.
 *
 * Sidebar shell width: 264px expanded, 64px collapsed (per Figma sidebar
 * column). Header/footer 64px tall with stroke-soft-200 divider.
 */

type SidebarState = "expanded" | "collapsed"

type SidebarContextValue = {
  state: SidebarState
  setState: React.Dispatch<React.SetStateAction<SidebarState>>
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export const useSidebar = () => {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>")
  return ctx
}

type ProviderProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultState?: SidebarState
}

const SidebarProvider = React.forwardRef<HTMLDivElement, ProviderProps>(
  ({ defaultState = "expanded", className, children, ...props }, ref) => {
    const [state, setState] = React.useState<SidebarState>(defaultState)
    const value = React.useMemo(
      () => ({
        state,
        setState,
        toggle: () => setState((s) => (s === "expanded" ? "collapsed" : "expanded")),
      }),
      [state],
    )
    return (
      <SidebarContext.Provider value={value}>
        <div
          ref={ref}
          data-slot="sidebar-provider"
          data-state={state}
          className={cn("flex h-full w-full", className)}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  },
)
SidebarProvider.displayName = "SidebarProvider"

const sidebarVariants = cva(
  cn(
    "h-full shrink-0 border-stroke-soft-200 bg-bg-white-0 transition-[width] duration-200",
    "flex flex-col",
  ),
  {
    variants: {
      side: {
        left: "border-r",
        right: "border-l order-last",
      },
      collapsedWidth: {
        none: "data-[state=collapsed]:w-0 data-[state=collapsed]:overflow-hidden",
        // Figma collapsed rail = 64px (icon column)
        icon: "data-[state=collapsed]:w-16",
      },
    },
    defaultVariants: { side: "left", collapsedWidth: "icon" },
  },
)

type SidebarProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof sidebarVariants> & {
    /** Expanded width — Figma defaults to 264px (16.5rem). */
    width?: string
  }

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, side, collapsedWidth, width = "16.5rem", style, ...props }, ref) => {
    const ctx = React.useContext(SidebarContext)
    return (
      <aside
        ref={ref}
        data-slot="sidebar"
        data-state={ctx?.state ?? "expanded"}
        data-side={side ?? "left"}
        style={{ ...(style as React.CSSProperties), width: ctx?.state === "expanded" ? width : undefined }}
        className={cn(sidebarVariants({ side, collapsedWidth }), className)}
        {...props}
      />
    )
  },
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-header"
      // Figma Sidebar Header (3789:3886): 64px tall with bottom border.
      className={cn(
        "flex h-16 items-center gap-2 border-b border-stroke-soft-200 px-4",
        className,
      )}
      {...props}
    />
  ),
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-content"
      // Figma scroll area: 16px vertical pad, 12px horizontal pad
      className={cn("flex-1 overflow-y-auto px-3 py-4", className)}
      {...props}
    />
  ),
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-footer"
      // Figma Sidebar Footer (3789:5341): 64px tall, top border.
      className={cn(
        "flex h-16 items-center gap-2 border-t border-stroke-soft-200 px-4",
        className,
      )}
      {...props}
    />
  ),
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group"
      className={cn("mb-4 flex flex-col gap-0.5", className)}
      {...props}
    />
  ),
)
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group-label"
      // Figma section header: 12px/16 medium uppercase, text-soft-400
      className={cn(
        "px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-text-soft-400",
        className,
      )}
      {...props}
    />
  ),
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

type SidebarItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  active?: boolean
}

const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, asChild, active, type = "button", children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        data-slot="sidebar-item"
        data-active={active ? "true" : undefined}
        className={cn(
          // Figma item: 36px tall, rounded-lg, 8px horizontal pad, 8px gap
          "relative flex h-9 w-full items-center gap-2 rounded-lg px-2 text-sm font-medium",
          "text-text-sub-600 transition-colors",
          // Hover: bg-weak-50 (text stays sub-600 per Figma hover variant)
          "hover:bg-bg-weak-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-base)",
          // Active: bg-weak-50, text-strong-950, icon primary
          "data-[active=true]:bg-bg-weak-50 data-[active=true]:text-text-strong-950",
          // Icon defaults to sub-600; active swaps to primary-base
          "[&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-icon-sub-600",
          "data-[active=true]:[&_svg]:text-(--primary-base)",
          className,
        )}
        {...props}
      >
        {children}
        {/* Figma "active rail" — 4×20 primary bar pinned to the leading edge.
            Rendered only on active state via the data attribute. */}
        {active ? (
          <span
            aria-hidden
            data-slot="sidebar-item-rail"
            className="pointer-events-none absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-md bg-(--primary-base)"
          />
        ) : null}
      </Comp>
    )
  },
)
SidebarItem.displayName = "SidebarItem"

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = "button", onClick, ...props }, ref) => {
    const { toggle } = useSidebar()
    return (
      <button
        ref={ref}
        type={type}
        data-slot="sidebar-trigger"
        aria-label="Toggle sidebar"
        onClick={(e) => {
          onClick?.(e)
          toggle()
        }}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-icon-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-base)",
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-inset"
      className={cn("flex h-full flex-1 flex-col overflow-hidden", className)}
      {...props}
    />
  ),
)
SidebarInset.displayName = "SidebarInset"

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarTrigger,
  SidebarInset,
}
