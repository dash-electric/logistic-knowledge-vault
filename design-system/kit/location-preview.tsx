"use client"

import * as React from "react"
import { RiErrorWarningLine, RiMapPinLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { loadGoogleMaps } from "./lib/google-maps"
import {
  DASH_MAP_DEFAULT_CENTER,
  DASH_MAP_DEFAULT_ZOOM,
  GSM_MAP_STYLE,
} from "./lib/gsm-map-style"

/**
 * LocationPreview — read-only single-pin map for forms and detail panels.
 *
 * Companion to DashMap: DashMap is the interactive canvas with overlays and
 * a context; LocationPreview is the small "here is the point" widget a form
 * shows next to lat/lng fields. Ported from react-logistic-web's hub form.
 *
 * States (GSM editorial — never a broken gray box):
 *   - no coordinates → map at the default city view + centered hint overlay
 *   - loading        → pulse hint overlay
 *   - SDK error / no key → flat fallback panel with the reason
 *   - coordinates    → re-centers + re-pins smoothly as the caller edits
 *
 * API key comes from `configureDashMaps({ apiKey })` or the `apiKey` prop.
 */

export type LocationPreviewProps = {
  /** When either is null/non-finite, the preview renders the empty hint state. */
  latitude: number | null
  longitude: number | null
  /** Panel height in px. Default 200. */
  height?: number
  /** Zoom once a pin exists. 15 fits a city block neatly. Default 15. */
  zoom?: number
  /** Google Maps API key override; falls back to configureDashMaps. */
  apiKey?: string
  /** Hint shown when no coordinates are set yet. */
  emptyHint?: string
  className?: string
}

const LocationPreview = React.forwardRef<HTMLDivElement, LocationPreviewProps>(
  (
    {
      latitude,
      longitude,
      height = 200,
      zoom = 15,
      apiKey,
      emptyHint = "Enter coordinates or pick a place to preview the pin.",
      className,
    },
    ref,
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const mapRef = React.useRef<any>(null)
    const markerRef = React.useRef<any>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)

    const hasCoords =
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)

    React.useEffect(() => {
      let cancelled = false
      setLoading(true)
      loadGoogleMaps(apiKey)
        .then((maps) => {
          if (cancelled || !containerRef.current) return
          const center =
            hasCoords && latitude !== null && longitude !== null
              ? { lat: latitude, lng: longitude }
              : DASH_MAP_DEFAULT_CENTER

          if (!mapRef.current) {
            mapRef.current = new maps.Map(containerRef.current, {
              center,
              zoom: hasCoords ? zoom : DASH_MAP_DEFAULT_ZOOM,
              styles: GSM_MAP_STYLE,
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: "cooperative",
              clickableIcons: false,
            })
          }

          if (hasCoords) {
            if (!markerRef.current) {
              markerRef.current = new maps.Marker({
                position: center,
                map: mapRef.current,
              })
            } else {
              markerRef.current.setPosition(center)
            }
          } else if (markerRef.current) {
            markerRef.current.setMap(null)
            markerRef.current = null
          }
          setLoading(false)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : "Failed to load Google Maps")
          setLoading(false)
        })
      return () => {
        cancelled = true
      }
      // Re-run on coord changes so the marker tracks the value being edited.
    }, [latitude, longitude, hasCoords, zoom, apiKey])

    // When coords change after the map exists, re-center + re-pin without
    // re-creating the map instance.
    React.useEffect(() => {
      const map = mapRef.current
      if (!map || !hasCoords || latitude === null || longitude === null) return
      const w = window as any
      const maps = w.google?.maps
      if (!maps) return
      map.setCenter({ lat: latitude, lng: longitude })
      map.setZoom(zoom)
      if (!markerRef.current) {
        markerRef.current = new maps.Marker({
          position: { lat: latitude, lng: longitude },
          map,
        })
      } else {
        markerRef.current.setPosition({ lat: latitude, lng: longitude })
      }
    }, [latitude, longitude, hasCoords, zoom])

    return (
      <div
        ref={ref}
        data-slot="location-preview"
        className={cn(
          "relative isolate overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-weak-50",
          className,
        )}
        style={{ height }}
      >
        {error ? (
          <div className="grid h-full place-items-center px-4">
            <div className="flex max-w-xs flex-col items-center gap-1.5 text-center">
              <RiErrorWarningLine aria-hidden className="size-5 text-icon-soft-400" />
              <p className="text-sm font-medium text-text-strong-950">Map unavailable</p>
              <p className="text-xs text-text-sub-600">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="h-full w-full" aria-label="Location preview" />
            {!hasCoords && !loading ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-bg-white-0/70">
                <p className="flex items-center gap-1.5 px-4 text-center text-xs text-text-sub-600">
                  <RiMapPinLine aria-hidden className="size-4 shrink-0 text-icon-soft-400" />
                  {emptyHint}
                </p>
              </div>
            ) : null}
            {loading ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-bg-white-0/70">
                <p className="flex items-center gap-1.5 text-xs text-text-sub-600">
                  <RiMapPinLine aria-hidden className="size-4 animate-pulse text-icon-soft-400" />
                  Loading map…
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    )
  },
)
LocationPreview.displayName = "LocationPreview"

export { LocationPreview }
