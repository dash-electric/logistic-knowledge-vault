"use client"

import * as React from "react"
import { RiCloseLine, RiSearchLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { Input, InputIcon, InputRoot } from "./input"

/**
 * SearchField — debounced search input with clear button and optional
 * suggestions. Ported from react-logistic-web's InputSearch and made
 * kit-canonical (sm/md/lg sizes).
 *
 * Controlled when `value` is passed; uncontrolled otherwise.
 * `onChange` fires per keystroke; `onSearch` fires debounced (`debounceMs`,
 * 0 = immediate) — wire the expensive thing (API call, filter) to `onSearch`.
 */

export type SearchFieldProps = {
  placeholder?: string
  /** Controlled value. Omit for uncontrolled use. */
  value?: string
  /** Per-keystroke change. */
  onChange?: (value: string) => void
  /** Debounced search callback. */
  onSearch?: (value: string) => void
  onClear?: () => void
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  /** Pulses the field and hides the clear button while true. */
  loading?: boolean
  /** Debounce for `onSearch`. Default 300ms; 0 fires immediately. */
  debounceMs?: number
  showClearButton?: boolean
  /** Static suggestion list, filtered case-insensitively by the value. */
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  className?: string
}

const ICON_SIZE = { sm: "size-3.5", md: "size-4", lg: "size-[18px]" } as const

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      placeholder = "Search…",
      value: controlledValue,
      onChange,
      onSearch,
      onClear,
      size = "md",
      disabled = false,
      loading = false,
      debounceMs = 300,
      showClearButton = true,
      suggestions = [],
      onSuggestionClick,
      className,
    },
    forwardedRef,
  ) => {
    const [internalValue, setInternalValue] = React.useState(controlledValue ?? "")
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [focusedIndex, setFocusedIndex] = React.useState(-1)
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const suggestionsRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement)

    const isControlled = controlledValue !== undefined
    const currentValue = isControlled ? controlledValue : internalValue

    const commitValue = (next: string) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      commitValue(next)

      if (onSearch && debounceMs > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => onSearch(next), debounceMs)
      } else if (onSearch) {
        onSearch(next)
      }

      if (suggestions.length > 0 && next.length > 0) {
        setShowSuggestions(true)
        setFocusedIndex(-1)
      } else {
        setShowSuggestions(false)
      }
    }

    const handleClear = () => {
      commitValue("")
      onClear?.()
      setShowSuggestions(false)
      inputRef.current?.focus()
    }

    const handleSuggestionClick = (suggestion: string) => {
      commitValue(suggestion)
      onSuggestionClick?.(suggestion)
      setShowSuggestions(false)
      inputRef.current?.focus()
    }

    const filteredSuggestions = suggestions.filter((s) =>
      s.toLowerCase().includes(currentValue.toLowerCase()),
    )

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggestions || filteredSuggestions.length === 0) return
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0))
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1))
          break
        case "Enter":
          e.preventDefault()
          if (focusedIndex >= 0) handleSuggestionClick(filteredSuggestions[focusedIndex])
          break
        case "Escape":
          setShowSuggestions(false)
          setFocusedIndex(-1)
          break
      }
    }

    // Cleanup debounce on unmount.
    React.useEffect(
      () => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
      },
      [],
    )

    // Close suggestions on outside click.
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setShowSuggestions(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const iconSize = ICON_SIZE[size]

    return (
      <div data-slot="search-field" className={cn("relative", className)}>
        <InputRoot size={size} className={cn(loading && "animate-pulse")}>
          <InputIcon>
            <RiSearchLine aria-hidden className={iconSize} />
          </InputIcon>

          <Input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (filteredSuggestions.length > 0 && currentValue.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
          />

          {showClearButton && currentValue.length > 0 && !loading ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="shrink-0 inline-flex items-center justify-center text-icon-soft-400 hover:text-text-sub-600 transition-colors focus:outline-none"
            >
              <RiCloseLine aria-hidden className={iconSize} />
            </button>
          ) : null}
        </InputRoot>

        {showSuggestions && filteredSuggestions.length > 0 ? (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-medium"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm text-text-strong-950 transition-colors hover:bg-bg-weak-50 focus:bg-bg-weak-50 focus:outline-none",
                  index === focusedIndex && "bg-bg-weak-50",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    )
  },
)
SearchField.displayName = "SearchField"

export { SearchField }
