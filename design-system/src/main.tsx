import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { configureDashMaps } from "@dash-electric/logistic-kit"
import "./index.css"
import { App } from "./App"

// Live Google Maps for DashMap demos. Key comes from apps/docs/.env.local
// (VITE_GOOGLE_MAPS_API_KEY). Without it, DashMap shows its no-key fallback.
const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
if (mapsKey) configureDashMaps({ apiKey: mapsKey })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
