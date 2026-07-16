"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * Sidebar — editorial/print dialect (GSM), restyled 2026-07-14 from the
 * original Figma soft-SaaS treatment (Sidebar [Navigation] node 3802:11759,
 * item set 3741:45019). Structure and API are unchanged; the visual language
 * now follows the Graphic Standard Manual instead of the Figma chip idiom:
 *
 *  - Items are full-bleed rows (edge to edge, square corners), not inset
 *    rounded chips. 36px tall, 20px horizontal padding.
 *  - State map:
 *      Default → bg-white-0, text/icon sub-600
 *      Hover   → bg-weak-50, text/icon strong-950
 *      Active  → NO wash; semibold ink text/icon + a full-height 3px accent
 *                rail welded to the sidebar's leading edge (accent as
 *                punctuation — icons stay ink, never accent-tinted).
 *    The rail is drawn with ::before so `asChild` (Slot) keeps a single child.
 *  - Groups are separated by full-width hairline rules (stroke-soft-200),
 *    not margins; group labels use the GSM eyebrow recipe (10px bold
 *    uppercase, 0.22em tracking, sub-600).
 *  - Shell width: 240px expanded, 64px collapsed. Header/footer 64px tall
 *    with stroke-soft-200 divider.
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
    /** Expanded width — GSM editorial column defaults to 240px (15rem). */
    width?: string
  }

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, side, collapsedWidth, width = "15rem", style, ...props }, ref) => {
    const ctx = React.useContext(SidebarContext)
    // Usable without a SidebarProvider (state falls back to "expanded"),
    // so the width prop must apply in that case too.
    const state = ctx?.state ?? "expanded"
    return (
      <aside
        ref={ref}
        data-slot="sidebar"
        data-state={state}
        data-side={side ?? "left"}
        style={{ ...(style as React.CSSProperties), width: state === "expanded" ? width : undefined }}
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
      // 64px tall with bottom hairline; 20px pad aligns with full-bleed rows.
      className={cn(
        "flex h-16 items-center gap-2 border-b border-stroke-soft-200 px-5",
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
      // Full-bleed scroll area; groups separated by hairline rules, not margins.
      className={cn(
        "flex-1 overflow-y-auto divide-y divide-stroke-soft-200",
        className,
      )}
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
      className={cn("flex flex-col gap-0.5 py-3", className)}
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
      // GSM eyebrow: 10px bold uppercase, wide tracking, sub-600
      className={cn(
        "px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-text-sub-600",
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
          // Editorial row: full-bleed, square corners, 36px tall, 20px pad
          "relative flex h-9 w-full items-center gap-3 px-5 text-sm font-medium tracking-tight",
          "text-text-sub-600 transition-colors",
          // Hover: bare tint, text darkens to ink
          "hover:bg-bg-weak-50 hover:text-text-strong-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--theme-accent-base)",
          // Active: NO wash — semibold ink text; icons ride currentColor
          "data-[active=true]:font-semibold data-[active=true]:text-text-strong-950",
          "[&_svg]:size-[17px] [&_svg]:shrink-0 [&_svg]:text-current",
          // Active rail: full-height 3px accent bar welded to the leading
          // edge, drawn with ::before so asChild (Slot) keeps a single child.
          "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
          "data-[active=true]:before:bg-(--theme-accent-base)",
          className,
        )}
        {...props}
      >
        {children}
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--theme-accent-base)",
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
