/**
 * GSM map style — near-monochrome Google Maps canvas so brand-purple pins and
 * batch-colored routes carry all the color. Ported from react-logistic-web
 * (src/lib/googleMapsStyle.ts). Apply via the `styles` option on the map.
 *
 * Typed as any[] — the runtime SDK accepts the shape; @types/google.maps isn't
 * a kit dependency.
 */
export const GSM_MAP_STYLE: any[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#fafafa" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#f4f4f5" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#f5f5f4" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#fafafa" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e5e7eb" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d4d4d8" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road.arterial", elementType: "labels.text.stroke", stylers: [{ color: "#fafafa" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#fafafa" }] },
  { featureType: "administrative", elementType: "geometry.fill", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d4d4d8" }, { weight: 0.5 }] },
  { featureType: "administrative.locality", elementType: "geometry.stroke", stylers: [{ color: "#a1a1aa" }, { weight: 0.5 }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#171717" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { featureType: "administrative", elementType: "labels.text.stroke", stylers: [{ color: "#fafafa" }, { weight: 2 }] },
]

/** Default map framing (Jakarta, the primary ops region). */
export const DASH_MAP_DEFAULT_CENTER = { lat: -6.1754, lng: 106.8272 }
export const DASH_MAP_DEFAULT_ZOOM = 11
