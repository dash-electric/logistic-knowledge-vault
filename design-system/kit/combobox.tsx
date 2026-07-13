"use client"

import * as React from "react"
import { RiCheckLine as Check, RiArrowDownSLine as ChevronDown } from "@remixicon/react"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./command"
import { cn } from "./lib/utils"

/**
 * Combobox — Select pattern + cmdk search. Figma 1:1 trigger parity with
 * the Select component (node 270:1084 — searchable variant).
 *
 * Trigger styles mirror Select.md (h-10, r-10, default → focus → error).
 */

export type ComboboxOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  invalid?: boolean
  /** Figma: sm=X-Small (32) · md=Small (36) · lg=Medium (40, default). */
  size?: "sm" | "md" | "lg"
  className?: string
  "aria-label"?: string
}

const sizeMap: Record<NonNullable<ComboboxProps["size"]>, string> = {
  sm: "h-8 rounded-lg px-2 text-sm gap-1.5",
  md: "h-9 rounded-lg px-2.5 text-sm gap-2",
  lg: "h-10 rounded-sm px-3 text-sm gap-2",
}

const Combobox = ({
  options,
  value,
  onValueChange,
  placeholder = "Pilih opsi…",
  searchPlaceholder = "Cari…",
  emptyText = "Tidak ada hasil.",
  disabled,
  invalid,
  size = "lg",
  className,
  ...props
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          data-slot="combobox-trigger"
          className={cn(
            "inline-flex w-full items-center justify-between rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-left text-text-strong-950",
            "transition-colors duration-(--duration-fast) ease-(--ease-out)",
            "hover:bg-bg-weak-50 hover:border-transparent hover:text-text-sub-600",
            "data-[state=open]:bg-bg-white-0 data-[state=open]:border-stroke-strong-950 data-[state=open]:text-text-strong-950",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
            "aria-[invalid=true]:border-(--state-error-base)",
            "disabled:cursor-not-allowed disabled:bg-bg-weak-50 disabled:border-transparent disabled:text-text-disabled-300",
            sizeMap[size],
            className,
          )}
          {...props}
        >
          <span className={cn("truncate", !selected && "text-text-sub-600")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown strokeWidth={1.75} className="size-5 text-icon-soft-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" sideOffset={4}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  disabled={o.disabled}
                  onSelect={(v) => {
                    onValueChange?.(v)
                    setOpen(false)
                  }}
                >
                  <Check
                    strokeWidth={3}
                    className={cn(
                      "size-3.5 text-(--primary-base) mr-2",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{o.label}</span>
                    {o.description ? (
                      <span className="text-xs text-text-sub-600">{o.description}</span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
