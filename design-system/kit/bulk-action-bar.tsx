"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { RiCloseLine as X, RiMoreLine as More } from "@remixicon/react"
import { cn } from "./lib/utils"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

/**
 * BulkActionBar — sticky multi-select action toolbar for DataTable.
 * Layout: [count + Clear] [divider] [actions (overflow → menu)] [optional X]
 * - Appears when selectedCount > 0; slides in (sober motion per design.md).
 * - position: "bottom" (fixed viewport) | "top" (sticky inside container).
 * - Destructive actions go through a confirmation gate (native confirm
 *   fallback; TODO swap for <ConfirmAction> when that primitive ships).
 * - role="toolbar", Escape dismisses, first action focused on appear.
 * - On <md viewports inline actions collapse into a single DropdownMenu.
 * Tokens only — no raw hex. See doc page `Tokens` section for the map.
 */

const barVariants = cva(
  cn(
    "flex items-center gap-3 w-full max-w-[min(960px,calc(100vw-24px))]",
    "rounded-sm border bg-bg-white-0 shadow-custom-shadows-medium",
    "transition-[opacity,transform] duration-(--duration-fast) ease-(--ease-out)",
    "data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none",
    "data-[position=bottom][data-state=hidden]:translate-y-3",
    "data-[position=top][data-state=hidden]:-translate-y-3",
    "data-[state=visible]:translate-y-0 data-[state=visible]:opacity-100",
  ),
  {
    variants: {
      tone: {
        neutral: "border-stroke-soft-200",
        primary: "border-(--primary-alpha-24)",
        destructive: "border-(--state-error-base)/30",
      },
      size: {
        sm: "h-11 px-3 gap-2",
        md: "h-13 px-4 gap-3",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
)

const wrapperVariants = cva(
  "z-40 flex justify-center pointer-events-none px-3 [&>*]:pointer-events-auto",
  {
    variants: {
      position: {
        bottom: "fixed inset-x-0 bottom-4",
        top: "sticky top-0 -mt-px py-2",
      },
    },
    defaultVariants: { position: "bottom" },
  },
)

export type BulkActionTone = "neutral" | "primary" | "destructive"

const accentDotClass: Record<BulkActionTone, string> = {
  neutral: "bg-bg-strong-950",
  primary: "bg-(--state-feature-base)",
  destructive: "bg-(--state-error-base)",
}

const styleFor = (t?: BulkActionTone) =>
  t === "destructive" ? "lighter" : t === "primary" ? "filled" : "stroke"

export type BulkActionBarAction = {
  /** Stable id — React key + DropdownMenu item key. */
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void | Promise<void>
  /** Color intent. Destructive triggers confirmation. */
  tone?: BulkActionTone
  loading?: boolean
  disabled?: boolean
  /** Override the default destructive confirmation prompt. */
  confirmMessage?: string
}

export type BulkActionBarProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof barVariants> & {
    selectedCount: number
    onClear: () => void
    actions: BulkActionBarAction[]
    position?: "top" | "bottom"
    showClose?: boolean
    /** Max inline actions before collapsing into a DropdownMenu. Default 4. */
    inlineLimit?: number
    /** Selection summary noun. Default `{ singular: "item", plural: "items" }`. */
    itemNoun?: { singular: string; plural: string }
  }

const BulkActionBar = React.forwardRef<HTMLDivElement, BulkActionBarProps>(
  (
    {
      className,
      selectedCount,
      onClear,
      actions,
      position = "bottom",
      tone = "neutral",
      size = "md",
      showClose = false,
      inlineLimit = 4,
      itemNoun = { singular: "item", plural: "items" },
      ...props
    },
    ref,
  ) => {
    const visible = selectedCount > 0
    const firstActionRef = React.useRef<HTMLButtonElement | null>(null)

    React.useEffect(() => {
      if (!visible) return
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.stopPropagation()
          onClear()
        }
      }
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }, [visible, onClear])

    React.useEffect(() => {
      if (visible) firstActionRef.current?.focus()
    }, [visible])

    const handleAction = React.useCallback(
      (action: BulkActionBarAction) => {
        if (action.disabled || action.loading) return
        if (action.tone === "destructive") {
          const noun = selectedCount === 1 ? itemNoun.singular : itemNoun.plural
          const msg =
            action.confirmMessage ??
            `Confirm "${action.label}" for ${selectedCount} ${noun}?`
          // TODO: replace with <ConfirmAction> primitive when shipped.
          if (typeof window !== "undefined" && !window.confirm(msg)) return
        }
        void action.onClick()
      },
      [selectedCount, itemNoun],
    )

    const inline = actions.slice(0, inlineLimit)
    const overflow = actions.slice(inlineLimit)
    const noun = selectedCount === 1 ? itemNoun.singular : itemNoun.plural
    const toneKey = tone ?? "neutral"

    return (
      <div
        className={wrapperVariants({ position })}
        data-slot="bulk-action-bar-wrapper"
        aria-hidden={!visible}
      >
        <div
          ref={ref}
          role="toolbar"
          aria-label={`Bulk actions for ${selectedCount} selected ${noun}`}
          data-slot="bulk-action-bar"
          data-state={visible ? "visible" : "hidden"}
          data-position={position}
          data-tone={toneKey}
          className={cn(barVariants({ tone, size }), className)}
          {...props}
        >
          {/* LEFT — count + Clear */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <span aria-hidden className={cn("inline-block size-1.5 rounded-full shrink-0", accentDotClass[toneKey])} />
            <span className="text-sm font-medium text-text-strong-950 tabular-nums whitespace-nowrap">
              {selectedCount.toLocaleString()}{" "}
              <span className="text-text-sub-600 font-normal">{noun} selected</span>
            </span>
            <Button size={size === "sm" ? "xs" : "sm"} tone="neutral" style="ghost" onClick={onClear} className="text-text-sub-600 hover:text-text-strong-950">
              Clear
            </Button>
          </div>

          <span aria-hidden className="h-5 w-px bg-stroke-soft-200 shrink-0" />

          {/* CENTER — actions */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <div className="hidden md:flex items-center gap-1.5 flex-wrap">
              {inline.map((action, i) => (
                <Button
                  key={action.id}
                  ref={i === 0 ? firstActionRef : undefined}
                  size={size === "sm" ? "xs" : "sm"}
                  tone={action.tone ?? "neutral"}
                  style={styleFor(action.tone)}
                  leftIcon={action.icon}
                  loading={action.loading}
                  disabled={action.disabled}
                  onClick={() => handleAction(action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>

            {actions.length > 0 ? (
              <div className="flex md:hidden">
                <BulkActionOverflowMenu
                  ref={firstActionRef}
                  actions={actions}
                  size={size ?? "md"}
                  onAction={handleAction}
                  label={`${actions.length} bulk actions`}
                />
              </div>
            ) : null}
            {overflow.length > 0 ? (
              <div className="hidden md:flex">
                <BulkActionOverflowMenu
                  actions={overflow}
                  size={size ?? "md"}
                  onAction={handleAction}
                  label={`${overflow.length} more bulk actions`}
                />
              </div>
            ) : null}
          </div>

          {showClose ? (
            <button type="button" onClick={onClear} aria-label="Dismiss bulk actions" className="shrink-0 inline-flex items-center justify-center rounded-md size-7 text-icon-sub-600 hover:text-text-strong-950 hover:bg-bg-weak-50 transition-colors">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    )
  },
)
BulkActionBar.displayName = "BulkActionBar"

type OverflowMenuProps = {
  actions: BulkActionBarAction[]
  size: "sm" | "md"
  onAction: (a: BulkActionBarAction) => void
  label: string
}

const BulkActionOverflowMenu = React.forwardRef<HTMLButtonElement, OverflowMenuProps>(
  ({ actions, size, onAction, label }, ref) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          size={size === "sm" ? "xs" : "sm"}
          tone="neutral"
          style="stroke"
          aria-label={label}
        >
          <More className="size-4" aria-hidden />
          <span className="ml-1 hidden md:inline">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            disabled={action.disabled || action.loading}
            destructive={action.tone === "destructive"}
            onSelect={(e) => {
              e.preventDefault()
              onAction(action)
            }}
          >
            {action.icon ? <span aria-hidden>{action.icon}</span> : null}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
)
BulkActionOverflowMenu.displayName = "BulkActionOverflowMenu"

export { BulkActionBar, barVariants as bulkActionBarVariants }
