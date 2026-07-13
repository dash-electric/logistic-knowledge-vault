"use client"

import * as React from "react"
import { DashMap } from "./dash-map"
import { MapOverlay } from "./map-overlay"
import { RoutePolyline } from "./route-polyline"
import { StopMarker, type StopState } from "./stop-marker"
import { DriverMarker } from "./driver-marker"
import { HubMarker } from "./hub-marker"
import { isValidCoord, type LatLng } from "./lib/route-colors"

/**
 * RiderMapView — single-route map for the rider app: one batch's route + its
 * stops + the live driver position, framed to fit. A convenience composition
 * over DashMap so the rider screen is one component, not a wiring exercise. For
 * the multi-route ops console, compose DashMap + RoutePolyline + StopMarker
 * directly instead.
 */
export type RiderStop = LatLng & {
  id: string
  sequence: number
  state?: StopState
}

export type RiderMapViewProps = {
  apiKey?: string
  /** Route color for this rider (routeColor(index)). */
  color: string
  stops: RiderStop[]
  path?: LatLng[] | string
  hub?: LatLng & { label?: React.ReactNode }
  driver?: LatLng & { heading?: number }
  currentStopId?: string
  onSelectStop?: (id: string) => void
  className?: string
}

export function RiderMapView({
  apiKey, color, stops, path, hub, driver, currentStopId, onSelectStop, className,
}: RiderMapViewProps) {
  const fitTo = React.useMemo<LatLng[]>(() => {
    const pts: LatLng[] = stops.filter((s) => isValidCoord(s.lat, s.lng))
    if (hub && isValidCoord(hub.lat, hub.lng)) pts.push({ lat: hub.lat, lng: hub.lng })
    if (driver && isValidCoord(driver.lat, driver.lng)) pts.push({ lat: driver.lat, lng: driver.lng })
    return pts
  }, [stops, hub, driver])

  return (
    <DashMap apiKey={apiKey} fitTo={fitTo} className={className}>
      {path ? <RoutePolyline path={path} color={color} state="active" /> : null}

      {hub && isValidCoord(hub.lat, hub.lng) ? (
        <MapOverlay position={{ lat: hub.lat, lng: hub.lng }} anchor="bottom" zIndex={20}>
          <HubMarker size="sm" label={hub.label} />
        </MapOverlay>
      ) : null}

      {stops.filter((s) => isValidCoord(s.lat, s.lng)).map((s) => (
        <MapOverlay key={s.id} position={{ lat: s.lat, lng: s.lng }} anchor="center" zIndex={s.id === currentStopId ? 40 : 30}>
          <StopMarker
            color={color}
            sequence={s.sequence}
            state={s.state}
            selected={s.id === currentStopId}
            onClick={() => onSelectStop?.(s.id)}
          />
        </MapOverlay>
      ))}

      {driver && isValidCoord(driver.lat, driver.lng) ? (
        <MapOverlay position={{ lat: driver.lat, lng: driver.lng }} anchor="center" zIndex={50}>
          <DriverMarker heading={driver.heading ?? 0} />
        </MapOverlay>
      ) : null}
    </DashMap>
  )
}
