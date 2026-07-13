"use client"

import * as React from "react"
import { RiCheckLine as Check, RiArrowDownSLine as ChevronDown, RiAddLine as Plus } from "@remixicon/react"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "./command"
import { Tag } from "./tag"
import { cn } from "./lib/utils"

type FilterOption = {
  value: string
  label: string
  description?: string
}

type FilterProps = {
  label: string
  options: FilterOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

const Filter = ({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Cari…",
  emptyText = "Tidak ada hasil.",
  className,
}: FilterProps) => {
  const [open, setOpen] = React.useState(false)
  const selected = options.filter((o) => value.includes(o.value))

  const toggle = (v: string) => {
    onValueChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)} data-slot="filter">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-slot="filter-trigger"
            data-state={open ? "open" : "closed"}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-stroke-soft-200 bg-bg-white-0 text-sm",
              "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 hover:border-stroke-soft-200",
              "data-[state=open]:bg-bg-weak-50 data-[state=open]:text-text-strong-950 data-[state=open]:border-solid",
              "transition-colors duration-(--duration-fast) ease-(--ease-out)",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
            )}
          >
            <Plus strokeWidth={1.75} className="size-3.5" />
            <span>{label}</span>
            {selected.length > 0 ? (
              <span className="ml-1 inline-flex items-center gap-1">
                <span className="h-3 w-px bg-stroke-soft-200" />
                <span className="text-xs text-text-strong-950">{selected.length}</span>
              </span>
            ) : (
              <ChevronDown strokeWidth={1.75} className="size-3.5" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const isSelected = value.includes(o.value)
                  return (
                    <CommandItem key={o.value} onSelect={() => toggle(o.value)}>
                      <span
                        className={cn(
                          "inline-flex size-4 items-center justify-center rounded border mr-2",
                          isSelected
                            ? "bg-(--primary-base) border-(--primary-base) text-static-white"
                            : "border-stroke-soft-200",
                        )}
                      >
                        {isSelected ? <Check strokeWidth={3} className="size-3" /> : null}
                      </span>
                      <span>{o.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {value.length > 0 ? (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={() => onValueChange([])} className="justify-center text-text-sub-600">
                      Clear filter
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.map((s) => (
        <Tag key={s.value} variant="gray" onRemove={() => toggle(s.value)}>
          {s.label}
        </Tag>
      ))}
    </div>
  )
}

export { Filter }
export type { FilterOption }
