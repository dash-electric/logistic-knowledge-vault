"use client"

import * as React from "react"
import { RiMapPin2Line, RiErrorWarningLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { loadGoogleMaps, getDashMapsApiKey } from "./lib/google-maps"
import { GSM_MAP_STYLE, DASH_MAP_DEFAULT_CENTER, DASH_MAP_DEFAULT_ZOOM } from "./lib/gsm-map-style"
import { isValidCoord, type LatLng } from "./lib/route-colors"

/* -------------------------------------------------------------------------- */
/* Context — children (overlays, markers, polylines) read the map instance    */
/* -------------------------------------------------------------------------- */

type DashMapContextValue = {
  /** The google.maps namespace (after load). */
  maps: any | null
  /** The google.maps.Map instance. */
  map: any | null
}

const DashMapContext = React.createContext<DashMapContextValue>({ maps: null, map: null })

/** Access the live map + maps namespace from inside <DashMap>. */
export function useDashMap(): DashMapContextValue {
  return React.useContext(DashMapContext)
}

/* -------------------------------------------------------------------------- */
/* DashMap                                                                     */
/* -------------------------------------------------------------------------- */

export type DashMapProps = {
  /** Google Maps API key. Falls back to configureDashMaps({ apiKey }). */
  apiKey?: string
  center?: LatLng
  zoom?: number
  /** Auto-fit the viewport to these points (overrides center/zoom once set). */
  fitTo?: LatLng[]
  /** Padding (px) used when fitting to `fitTo`. */
  fitPadding?: number
  /** Called once the map instance is ready. */
  onMapReady?: (map: any, maps: any) => void
  className?: string
  children?: React.ReactNode
}

const DashMap = React.forwardRef<HTMLDivElement, DashMapProps>(
  ({ apiKey, center, zoom, fitTo, fitPadding = 48, onMapReady, className, children }, ref) => {
    const elRef = React.useRef<HTMLDivElement | null>(null)
    const mapRef = React.useRef<any>(null)
    const [ctx, setCtx] = React.useState<DashMapContextValue>({ maps: null, map: null })
    const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading")
    const [errorMsg, setErrorMsg] = React.useState("")

    const hasKey = Boolean(apiKey ?? getDashMapsApiKey())

    React.useEffect(() => {
      let cancelled = false
      if (!hasKey) {
        setStatus("error")
        setErrorMsg("No Google Maps API key configured.")
        return
      }
      loadGoogleMaps(apiKey)
        .then((maps) => {
          if (cancelled || !elRef.current) return
          const map = new maps.Map(elRef.current, {
            center: center ?? DASH_MAP_DEFAULT_CENTER,
            zoom: zoom ?? DASH_MAP_DEFAULT_ZOOM,
            styles: GSM_MAP_STYLE,
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: "greedy",
          })
          mapRef.current = map
          setCtx({ maps, map })
          setStatus("ready")
          onMapReady?.(map, maps)
        })
        .catch((err) => {
          if (cancelled) return
          setStatus("error")
          setErrorMsg(err?.message ?? "Failed to load the map.")
        })
      return () => {
        cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, hasKey])

    // Recenter / zoom when props change (and not fitting to points).
    React.useEffect(() => {
      const map = mapRef.current
      if (!map || (fitTo && fitTo.length)) return
      if (center) map.setCenter(center)
      if (typeof zoom === "number") map.setZoom(zoom)
    }, [center?.lat, center?.lng, zoom, fitTo])

    // Fit viewport to points.
    React.useEffect(() => {
      const { map, maps } = ctx
      if (!map || !maps || !fitTo || fitTo.length === 0) return
      const valid = fitTo.filter((p) => isValidCoord(p.lat, p.lng))
      if (valid.length === 0) return
      if (valid.length === 1) {
        map.setCenter(valid[0])
        map.setZoom(14)
        return
      }
      const bounds = new maps.LatLngBounds()
      valid.forEach((p) => bounds.extend(p))
      map.fitBounds(bounds, fitPadding)
    }, [ctx, fitTo, fitPadding])

    return (
      <div
        ref={ref}
        data-slot="dash-map"
        className={cn("relative isolate overflow-hidden rounded-sm bg-bg-weak-50", className)}
      >
        {/* Map canvas */}
        <div ref={elRef} className="absolute inset-0 h-full w-full" aria-label="Map" role="application" />

        {/* Overlays / markers — only meaningful once the map exists */}
        {status === "ready" ? (
          <DashMapContext.Provider value={ctx}>{children}</DashMapContext.Provider>
        ) : null}

        {/* Loading + fallback states (GSM editorial, never a broken gray box) */}
        {status !== "ready" ? (
          <div className="absolute inset-0 grid place-items-center bg-bg-weak-50">
            <div className="flex max-w-xs flex-col items-center gap-2 px-6 text-center">
              {status === "loading" ? (
                <>
                  <RiMapPin2Line className="size-6 animate-pulse text-icon-soft-400" />
                  <p className="text-sm text-text-sub-600">Loading map…</p>
                </>
              ) : (
                <>
                  <RiErrorWarningLine className="size-6 text-icon-soft-400" />
                  <p className="text-sm font-medium text-text-strong-950">Map unavailable</p>
                  <p className="text-xs text-text-sub-600">{errorMsg} Routes and stops still render in the panel.</p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    )
  },
)
DashMap.displayName = "DashMap"

export { DashMap, DashMapContext }
