/**
 * Google Maps JS SDK loader for the Dash Logistic kit.
 *
 * Ported from react-logistic-web (src/lib/googleMaps.ts) and made
 * framework-agnostic: the API key is supplied via `configureDashMaps({ apiKey })`
 * or per-call, instead of reading a CRA `process.env`. Loads the SDK exactly
 * once per page; subsequent calls return the same promise. If the key is
 * missing or the script fails, the promise rejects and the caller (DashMap)
 * renders a fallback instead of a broken map.
 *
 * `DashMap` is the public name; Google is the current engine. Swapping engines
 * later means a new adapter behind the same component API, not a consumer churn.
 */

const SCRIPT_ID = "dash-gmaps-loader"

let loaderPromise: Promise<any> | null = null
let configuredApiKey: string | undefined

/** Set the Google Maps API key once at app startup (framework-agnostic). */
export function configureDashMaps(opts: { apiKey: string }): void {
  configuredApiKey = opts.apiKey
}

export function getDashMapsApiKey(): string | undefined {
  return configuredApiKey
}

export function loadGoogleMaps(apiKey?: string): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps requires a browser window"))
  }

  const w = window as any
  if (w.google?.maps?.places && w.google.maps.geometry) {
    return Promise.resolve(w.google.maps)
  }

  if (loaderPromise) return loaderPromise

  const key = apiKey ?? configuredApiKey
  if (!key) {
    return Promise.reject(
      new Error(
        "No Google Maps API key. Call configureDashMaps({ apiKey }) or pass apiKey to <DashMap>.",
      ),
    )
  }

  loaderPromise = new Promise<any>((resolve, reject) => {
    const ok = () => {
      if (w.google?.maps?.places && w.google.maps.geometry) resolve(w.google.maps)
      else reject(new Error("Google Maps loaded without Places + Geometry libraries"))
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.addEventListener("load", ok)
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps script")),
      )
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    // places (Autocomplete) + geometry (encoding.decodePath for route polylines).
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&libraries=places,geometry&language=en&region=ID&v=weekly`
    script.onload = ok
    script.onerror = () => {
      loaderPromise = null // allow retry on next call
      reject(new Error("Failed to load Google Maps script"))
    }
    document.head.appendChild(script)
  })

  return loaderPromise
}

/**
 * Reuse one session token across an autocomplete→details exchange to stay in the
 * cheaper per-session billing bucket. Issue a fresh token after each getDetails.
 */
export function createSessionToken(maps: any): any {
  return new maps.places.AutocompleteSessionToken()
}
