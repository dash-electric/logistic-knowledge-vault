"use client"

import * as React from "react"
import { RiMapPinLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { createSessionToken, loadGoogleMaps } from "./lib/google-maps"
import { Hint } from "./hint"
import { Input, InputIcon, InputRoot } from "./input"

/**
 * PlacesAutocomplete — address search field on Google Places.
 *
 * Ported from react-logistic-web's hub form and generalized. The heavy
 * lifting is the billing-aware session handling: one AutocompleteSessionToken
 * is reused across the autocomplete→getDetails exchange (Google's cheaper
 * per-session bucket) and rotated after every successful pick.
 *
 * Consumer contract:
 *   - `value`/`onChange` control the text (a plain controlled input).
 *   - `onPick` fires when the user commits a suggestion — with the resolved
 *     formatted address and lat/lng. The caller owns what happens next
 *     (fill coordinate fields, move a map pin, …).
 *   - `onStatusChange` surfaces SDK lifecycle (`idle → loading-sdk → ready`
 *     or `error`) so forms can show a manual-entry fallback path.
 *
 * The API key comes from `configureDashMaps({ apiKey })` (see
 * lib/google-maps) or the `apiKey` prop. Without a key the field stays
 * usable as a plain text input and reports `error` — never a broken control.
 */

export interface PlacePick {
  address: string
  latitude: number
  longitude: number
}

export type PlacesAutocompleteStatus = "idle" | "loading-sdk" | "ready" | "error"

interface Prediction {
  placeId: string
  primary: string
  secondary: string
}

export type PlacesAutocompleteProps = {
  /** Current address text (controlled). */
  value: string
  onChange: (value: string) => void
  /** Fired when the user commits a place. Caller updates lat/lng. */
  onPick: (place: PlacePick) => void
  /** SDK status updates, for rendering a manual-entry fallback hint. */
  onStatusChange?: (status: PlacesAutocompleteStatus, message?: string) => void
  placeholder?: string
  disabled?: boolean
  /** id for the input, so an external <Label htmlFor> can target it. */
  inputId?: string
  /** ISO 3166-1 alpha-2 country restriction. Defaults to Indonesia. */
  country?: string
  /** Debounce before querying predictions. Default 1000ms (billing-friendly). */
  debounceMs?: number
  /** Minimum characters before searching. Default 3. */
  minChars?: number
  /** Field size (kit Input scale). Default "md". */
  size?: "sm" | "md" | "lg" | "xl"
  /** Google Maps API key override; falls back to configureDashMaps. */
  apiKey?: string
  /** Render the built-in status hint below the field. Default true. */
  showHint?: boolean
  className?: string
}

const PlacesAutocomplete = React.forwardRef<HTMLInputElement, PlacesAutocompleteProps>(
  (
    {
      value,
      onChange,
      onPick,
      onStatusChange,
      placeholder,
      disabled,
      inputId,
      country = "id",
      debounceMs = 1000,
      minChars = 3,
      size = "md",
      apiKey,
      showHint = true,
      className,
    },
    forwardedRef,
  ) => {
    const generatedId = React.useId()
    const id = inputId ?? `dash-places-${generatedId}`
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement)
    // Hidden node required by the PlacesService constructor (it expects a
    // div/Map). A throwaway node keeps Google's attribution UI out of the card.
    const placesAnchorRef = React.useRef<HTMLDivElement>(null)

    const [status, setStatus] = React.useState<PlacesAutocompleteStatus>("idle")
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
    const mapsRef = React.useRef<any>(null)
    const autoSvcRef = React.useRef<any>(null)
    const placesSvcRef = React.useRef<any>(null)
    const sessionTokenRef = React.useRef<any>(null)

    const [predictions, setPredictions] = React.useState<Prediction[]>([])
    const [open, setOpen] = React.useState(false)
    const [activeIdx, setActiveIdx] = React.useState<number>(-1)
    const [fetching, setFetching] = React.useState(false)
    // True right after a programmatic onChange caused by picking a suggestion,
    // so the next debounce tick won't re-open the dropdown.
    const suppressFetchRef = React.useRef(false)

    // Mirror the latest onStatusChange in a ref so updateStatus stays
    // reference-stable across parent renders (an inline callback from the
    // parent must not re-fire every effect on each keystroke).
    const onStatusChangeRef = React.useRef(onStatusChange)
    React.useEffect(() => {
      onStatusChangeRef.current = onStatusChange
    }, [onStatusChange])

    const updateStatus = React.useCallback(
      (next: PlacesAutocompleteStatus, message?: string) => {
        setStatus(next)
        setErrorMsg(message ?? null)
        onStatusChangeRef.current?.(next, message)
      },
      [],
    )

    // Load the SDK exactly once per component lifetime.
    React.useEffect(() => {
      let cancelled = false
      updateStatus("loading-sdk")
      loadGoogleMaps(apiKey)
        .then((maps) => {
          if (cancelled) return
          mapsRef.current = maps
          autoSvcRef.current = new maps.places.AutocompleteService()
          placesSvcRef.current = new maps.places.PlacesService(
            placesAnchorRef.current ?? document.createElement("div"),
          )
          sessionTokenRef.current = createSessionToken(maps)
          updateStatus("ready")
        })
        .catch((err) => {
          if (cancelled) return
          updateStatus(
            "error",
            err instanceof Error ? err.message : "Failed to load Google Maps",
          )
        })
      return () => {
        cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Click-outside closes the dropdown.
    React.useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [open])

    // Debounced predictions fetch.
    React.useEffect(() => {
      if (status !== "ready") return
      if (suppressFetchRef.current) {
        suppressFetchRef.current = false
        return
      }
      const term = value.trim()
      if (term.length < minChars) {
        setPredictions([])
        setActiveIdx(-1)
        return
      }

      let cancelled = false
      const t = setTimeout(() => {
        const svc = autoSvcRef.current
        if (!svc) return
        setFetching(true)
        svc.getPlacePredictions(
          {
            input: term,
            componentRestrictions: { country },
            sessionToken: sessionTokenRef.current,
          },
          (preds: any[] | null, predStatus: string) => {
            if (cancelled) return
            setFetching(false)
            if (predStatus !== "OK" && predStatus !== "ZERO_RESULTS") {
              // Usually REQUEST_DENIED (bad key / referrer restriction) or
              // OVER_QUERY_LIMIT — surface so the manual-entry hint appears.
              updateStatus("error", `Address search error: ${predStatus}`)
              setPredictions([])
              return
            }
            const mapped: Prediction[] = (preds ?? []).map((p) => ({
              placeId: p.place_id,
              primary: p.structured_formatting?.main_text ?? p.description,
              secondary:
                p.structured_formatting?.secondary_text ??
                (p.description !== p.structured_formatting?.main_text
                  ? p.description
                  : ""),
            }))
            setPredictions(mapped)
            setActiveIdx(mapped.length > 0 ? 0 : -1)
            setOpen(mapped.length > 0)
          },
        )
      }, debounceMs)

      return () => {
        cancelled = true
        clearTimeout(t)
      }
      // updateStatus is reference-stable (see ref pattern above).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, status, country, debounceMs, minChars])

    const choose = React.useCallback(
      (pred: Prediction) => {
        const svc = placesSvcRef.current
        if (!svc) return
        svc.getDetails(
          {
            placeId: pred.placeId,
            fields: ["formatted_address", "geometry.location", "name"],
            sessionToken: sessionTokenRef.current,
          },
          (place: any, detailsStatus: string) => {
            if (detailsStatus !== "OK" || !place?.geometry?.location) {
              updateStatus("error", `Place details error: ${detailsStatus}`)
              return
            }
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const address =
              place.formatted_address ||
              [pred.primary, pred.secondary].filter(Boolean).join(", ")

            // Rotate the session token — a Google billing session ends with
            // getDetails; the next query starts a fresh one.
            if (mapsRef.current) {
              sessionTokenRef.current = createSessionToken(mapsRef.current)
            }

            suppressFetchRef.current = true
            onChange(address)
            onPick({ address, latitude: lat, longitude: lng })
            setPredictions([])
            setOpen(false)
            setActiveIdx(-1)
          },
        )
      },
      [onChange, onPick, updateStatus],
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || predictions.length === 0) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % predictions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + predictions.length) % predictions.length)
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && activeIdx < predictions.length) {
          e.preventDefault()
          choose(predictions[activeIdx])
        }
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }

    const hint = React.useMemo(() => {
      if (status === "loading-sdk") return "Loading address search…"
      if (status === "error")
        return errorMsg ?? "Address search unavailable — enter coordinates manually."
      if (status === "ready" && value.trim().length > 0 && value.trim().length < minChars)
        return `Type at least ${minChars} characters to search`
      if (status === "ready" && fetching) return "Searching…"
      return null
    }, [status, errorMsg, value, fetching, minChars])

    return (
      <div ref={containerRef} data-slot="places-autocomplete" className={cn("relative", className)}>
        <InputRoot size={size}>
          <InputIcon>
            <RiMapPinLine className="size-4" aria-hidden />
          </InputIcon>
          <Input
            id={id}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Search address, neighborhood, landmark…"}
            disabled={disabled || status === "loading-sdk"}
            autoComplete="off"
          />
        </InputRoot>

        {/* Hidden anchor for PlacesService. Required by the SDK constructor. */}
        <div ref={placesAnchorRef} aria-hidden="true" className="hidden" />

        {showHint && hint ? (
          <Hint
            tone={status === "error" ? "error" : "neutral"}
            hideIcon={status !== "error"}
            className="mt-1"
          >
            {hint}
          </Hint>
        ) : null}

        {open && predictions.length > 0 ? (
          <ul
            role="listbox"
            className={cn(
              "absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto",
              "rounded-lg border border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-medium",
            )}
          >
            {predictions.map((p, idx) => {
              const active = idx === activeIdx
              return (
                <li
                  key={p.placeId}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => {
                    // mousedown (not click) so the input's blur doesn't close
                    // the dropdown before the pick lands.
                    e.preventDefault()
                    choose(p)
                  }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={cn(
                    "cursor-pointer border-b border-stroke-soft-200 px-3 py-2 text-sm last:border-b-0",
                    active ? "bg-bg-weak-50" : "bg-bg-white-0",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <RiMapPinLine
                      aria-hidden
                      className="mt-0.5 size-3.5 shrink-0 text-icon-soft-400"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium tracking-tight text-text-strong-950">
                        {p.primary}
                      </p>
                      {p.secondary ? (
                        <p className="truncate text-[11px] text-text-sub-600">{p.secondary}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    )
  },
)
PlacesAutocomplete.displayName = "PlacesAutocomplete"

export { PlacesAutocomplete }
