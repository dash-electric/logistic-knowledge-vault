import * as React from "react"
import type { Category } from "./registry"
import {
  DashMap, MapLegend, MapControls, MapOverlay, RoutePolyline,
  StopMarker, DropoffMarker, PickupMarker, HubMarker, DriverMarker, ClusterMarker, MarkerPopover,
  routeColor, type LatLng,
  RiderBatchCard, TripCard, ItemRow, CapacityMeter, DispatchStatsBar, DispatchStatusBadge,
  StopSequenceList, type SequenceStop,
  RiderMapView, RouteProgress, NextStopCard, RiderStopManifest, ProofOfDeliveryCapture,
  PlacesAutocomplete, LocationPreview, type PlacePick,
  ETAChip, DistanceChip, DurationChip, WeightChip, VolumeChip,
  HexZone, ActiveZoneChip, ConflictBanner,
} from "@dash-electric/logistic-kit"
import { RiCheckLine } from "@remixicon/react"
import { latLngToCell, gridDisk } from "h3-js"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4">{children}</div>
)

/* A static grayscale stand-in so the map composition is visible without an API key. */
function DispatchMapPreview() {
  const pins = [
    { x: "30%", y: "62%", n: 1, c: 0 }, { x: "40%", y: "74%", n: 2, c: 0 }, { x: "33%", y: "86%", n: 3, c: 0 },
    { x: "58%", y: "40%", n: 1, c: 1 }, { x: "66%", y: "30%", n: 2, c: 1 },
    { x: "70%", y: "66%", n: 1, c: 3 }, { x: "78%", y: "58%", n: 2, c: 3 },
  ]
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-sm border border-stroke-soft-200 bg-[#fafafa]">
      {/* faux hairline roads */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 600 288" preserveAspectRatio="none" aria-hidden>
        <path d="M0,140 H600 M0,210 H600 M180,0 V288 M380,0 V288" stroke="#e5e7eb" strokeWidth="1" fill="none" />
        <path d="M312,144 Q 240,200 198,248" stroke={routeColor(0)} strokeWidth="3" fill="none" opacity="0.9" />
        <path d="M312,144 Q 360,115 396,86" stroke={routeColor(1)} strokeWidth="3" fill="none" opacity="0.9" />
        <path d="M312,144 Q 384,173 468,167" stroke={routeColor(3)} strokeWidth="3" fill="none" opacity="0.9" />
      </svg>
      <div className="absolute" style={{ left: "52%", top: "50%", transform: "translate(-50%,-100%)" }}>
        <HubMarker size="sm" />
      </div>
      {pins.map((p, i) => (
        <div key={i} className="absolute" style={{ left: p.x, top: p.y, transform: "translate(-50%,-50%)" }}>
          <StopMarker color={routeColor(p.c)} sequence={p.n} size="sm" />
        </div>
      ))}
      <div className="absolute left-3 top-3">
        <MapLegend
          entries={[
            { id: "a", label: "Ricky aprinaldi", color: routeColor(0), meta: "20" },
            { id: "b", label: "Ahmad Rofi", color: routeColor(1), meta: "8" },
            { id: "c", label: "Henny S.", color: routeColor(3), meta: "20" },
          ]}
        />
      </div>
    </div>
  )
}

/* Live Google Map with a real route — renders when VITE_GOOGLE_MAPS_API_KEY is set. */
const LIVE_HUB: LatLng = { lat: -6.2607, lng: 106.8132 } // Kemang hub
const LIVE_STOPS: (LatLng & { id: string; seq: number })[] = [
  { id: "1", seq: 1, lat: -6.2615, lng: 106.799 },
  { id: "2", seq: 2, lat: -6.27, lng: 106.81 },
  { id: "3", seq: 3, lat: -6.2785, lng: 106.82 },
  { id: "4", seq: 4, lat: -6.266, lng: 106.824 },
]
function LiveDispatchMap() {
  const color = routeColor(0)
  const path: LatLng[] = [LIVE_HUB, ...LIVE_STOPS.map((s) => ({ lat: s.lat, lng: s.lng }))]
  return (
    <DashMap className="h-80 w-full max-w-2xl" fitTo={[LIVE_HUB, ...LIVE_STOPS]}>
      <MapControls />
      <RoutePolyline path={path} color={color} state="active" />
      <MapOverlay position={LIVE_HUB} anchor="bottom" zIndex={20}>
        <HubMarker size="sm" label="CGK-01 · Kemang" />
      </MapOverlay>
      {LIVE_STOPS.map((s) => (
        <MapOverlay key={s.id} position={{ lat: s.lat, lng: s.lng }} anchor="center" zIndex={30}>
          <StopMarker color={color} sequence={s.seq} />
        </MapOverlay>
      ))}
    </DashMap>
  )
}

function StopSequenceDemo() {
  const stops = [
    { id: "1", address: "Jl. Mujair Raya, Kios 14", color: routeColor(0), meta: "2 items · delivered", locked: true, done: true },
    { id: "2", address: "Griya Jakarta, Jl. Mahoni A5", color: routeColor(0), meta: "4 items · 2.8 km" },
    { id: "3", address: "Jl. Kemang Raya 12", color: routeColor(0), meta: "1 item · 3.1 km" },
    { id: "4", address: "Jl. Ampera Raya 88", color: routeColor(0), meta: "3 items · 1.4 km" },
  ]
  return (
    <div className="max-w-md">
      <StopSequenceList stops={stops} onReorder={() => {}} onRecalculate={() => {}} />
    </div>
  )
}

function batchStops(color: string): SequenceStop[] {
  return [
    {
      id: "s1", color, address: "Jl. Mujair Raya, Kios 14", meta: "2 items · 4 min · 24.6 km", defaultOpen: true,
      children: (
        <>
          <ItemRow code="DLSWP260626SA10QA3" id="26062602581036BVnU2EgoPu" weightKg={0.25} volumeM3={0.001} />
          <ItemRow code="DLSWP260626SA10QA3" id="26062602581036Y3pRc1Zy" weightKg={0.25} volumeM3={0.001} />
        </>
      ),
    },
    {
      id: "s2", color, address: "Griya Jakarta, Jl. Mahoni A5", meta: "4 items · 4 min · 2.8 km",
      children: (
        <>
          <ItemRow code="DLSWP260626105TD9R" id="26062512404398iOC7PXGZ6g" weightKg={0.82} volumeM3={0.002} />
          <ItemRow code="DLSWP260626105TD9R" id="26062510184040GnAX42bi" weightKg={0.82} volumeM3={0.002} />
        </>
      ),
    },
    { id: "s3", color, address: "Jl. Kemang Raya 12", meta: "1 item · 3 min · 3.1 km", children: <ItemRow code="DLSWP260626QVE12" id="26062512404397QveUKlmi" weightKg={1.1} volumeM3={0.003} /> },
    { id: "s4", color, address: "Jl. Ampera Raya 88", meta: "3 items · 5 min · 1.4 km", children: <ItemRow code="DLSWP260626AFE09" id="260625101840409aFEjDQ" weightKg={0.6} volumeM3={0.002} /> },
  ]
}

function RiderBatchDemo() {
  const [open, setOpen] = React.useState(true)
  return (
    <div className="max-w-md">
      <RiderBatchCard
        name="Ricky aprinaldi"
        code="MTR0002796"
        color={routeColor(0)}
        trips={2}
        items={28}
        weightKg={13.9}
        durationLabel="4h 12m"
        shiftLabel="8h"
        visible
        onToggleVisible={() => {}}
        expanded={open}
        onToggleExpand={() => setOpen((o) => !o)}
      >
        <TripCard code="BTH260626-BHNXXXU" tripNumber={1} status="dispatched" stops={4} items={20} estimateLabel="2h 56m est" realRouteLabel="34.6 km · 1h 25m real route" defaultOpen>
          <div className="mb-3 flex gap-4">
            <CapacityMeter label="Weight" value={10.6} max={80} unit="kg" />
            <CapacityMeter label="Volume" value={0.034} max={0.5} unit="m³" />
          </div>
          <StopSequenceList stops={batchStops(routeColor(0))} onReorder={() => {}} onRecalculate={() => {}} />
        </TripCard>

        <TripCard code="BTH260626-KLP2Z9" tripNumber={2} status="planned" stops={4} items={8} estimateLabel="1h 16m est" defaultOpen={false}>
          <div className="mb-3 flex gap-4">
            <CapacityMeter label="Weight" value={3.3} max={80} unit="kg" />
            <CapacityMeter label="Volume" value={0.012} max={0.5} unit="m³" />
          </div>
          <StopSequenceList stops={batchStops(routeColor(0))} onReorder={() => {}} onRecalculate={() => {}} />
        </TripCard>
      </RiderBatchCard>
    </div>
  )
}

/* ── Full rider-app screen mockup ──────────────────────────────────────── */
type RiderScreenStop = {
  id: string
  seq: number
  lat: number
  lng: number
  address: string
  items: number
  etaLabel: string
  distanceLabel: string
}
const RIDER_DONE: RiderScreenStop[] = [
  { id: "d1", seq: 1, lat: -6.245, lng: 106.8, address: "Jl. Wijaya I No. 4", items: 2, etaLabel: "—", distanceLabel: "—" },
  { id: "d2", seq: 2, lat: -6.252, lng: 106.795, address: "Apt. Senopati Suites 12A", items: 1, etaLabel: "—", distanceLabel: "—" },
]
const RIDER_ACTIVE: RiderScreenStop = { id: "a1", seq: 3, lat: -6.2615, lng: 106.799, address: "Jl. Kemang Raya 12, RT 4 / RW 2", items: 3, etaLabel: "6 min", distanceLabel: "1.2 km" }
const RIDER_UPCOMING: RiderScreenStop[] = [
  { id: "u1", seq: 4, lat: -6.27, lng: 106.81, address: "Griya Jakarta, Jl. Mahoni A5", items: 4, etaLabel: "14 min", distanceLabel: "2.8 km" },
  { id: "u2", seq: 5, lat: -6.2785, lng: 106.82, address: "Jl. Ampera Raya 88", items: 1, etaLabel: "22 min", distanceLabel: "3.1 km" },
  { id: "u3", seq: 6, lat: -6.266, lng: 106.824, address: "Ruko Cipete Blok C2", items: 2, etaLabel: "31 min", distanceLabel: "1.9 km" },
  { id: "u4", seq: 7, lat: -6.256, lng: 106.83, address: "Jl. Pangeran Antasari 45", items: 3, etaLabel: "40 min", distanceLabel: "2.2 km" },
]
const RIDER_DRIVER = { lat: -6.2566, lng: 106.7944, heading: 145 }

function RiderAppMockup() {
  const color = routeColor(0)
  const [upcoming, setUpcoming] = React.useState<RiderScreenStop[]>(RIDER_UPCOMING)

  // Markers for the whole route: done (dimmed/check), active (highlighted), upcoming (renumbered after active).
  const mapStops = [
    ...RIDER_DONE.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, sequence: s.seq, state: "done" as const })),
    { id: RIDER_ACTIVE.id, lat: RIDER_ACTIVE.lat, lng: RIDER_ACTIVE.lng, sequence: RIDER_ACTIVE.seq, state: "active" as const },
    ...upcoming.map((s, i) => ({ id: s.id, lat: s.lat, lng: s.lng, sequence: RIDER_ACTIVE.seq + 1 + i, state: "planned" as const })),
  ]
  // Route AHEAD: driver → active → upcoming (recomputes on reorder).
  const pathAhead = [
    { lat: RIDER_DRIVER.lat, lng: RIDER_DRIVER.lng },
    { lat: RIDER_ACTIVE.lat, lng: RIDER_ACTIVE.lng },
    ...upcoming.map((s) => ({ lat: s.lat, lng: s.lng })),
  ]
  const seqStops = [
    // Completed stops are locked — visible, but their order can't change.
    ...RIDER_DONE.map((s) => ({
      id: s.id, color, address: s.address, meta: `${s.items} items · delivered`, locked: true, done: true,
    })),
    // Upcoming stops are draggable.
    ...upcoming.map((s) => ({
      id: s.id, color, address: s.address, meta: `${s.items} items · ${s.distanceLabel} · ${s.etaLabel}`,
    })),
  ]

  return (
    <div className="mx-auto w-[390px] overflow-hidden rounded-[36px] border-[6px] border-[#171717] bg-[#171717] shadow-card-lg">
      <div className="relative h-[800px] overflow-hidden rounded-[28px] bg-bg-white-0">
        {/* status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 text-xs font-medium tabular-nums text-text-strong-950">
          <span>09:41</span>
          <span className="gsm-label text-[10px] text-text-soft-400">Trip BTH260626-BHNXXXU</span>
          <span>100%</span>
        </div>

        {/* Live map with the route ahead */}
        <RiderMapView
          color={color}
          stops={mapStops}
          path={pathAhead}
          driver={RIDER_DRIVER}
          currentStopId={RIDER_ACTIVE.id}
          className="h-[330px] w-full rounded-none"
        />

        {/* Bottom sheet */}
        <div className="absolute inset-x-0 bottom-0 top-[368px] overflow-y-auto rounded-t-[20px] border-t border-stroke-soft-200 bg-bg-white-0 px-4 pt-3 pb-6 shadow-card-lg">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-bg-soft-200" />
          <RouteProgress done={2} total={7} etaLabel="ETA 16:40" />

          <p className="gsm-label mt-4 mb-1.5 text-[10px] text-text-soft-400">Active stop</p>
          <NextStopCard
            sequence={RIDER_ACTIVE.seq}
            color={color}
            address={RIDER_ACTIVE.address}
            recipient="Andi · 0812-3456-7890"
            distanceLabel={RIDER_ACTIVE.distanceLabel}
            etaLabel={RIDER_ACTIVE.etaLabel}
            itemsLabel={`${RIDER_ACTIVE.items} items`}
            onArrived={() => {}}
            onNavigate={() => {}}
            onCall={() => {}}
          />

          <div className="mt-5 mb-1.5 flex items-baseline justify-between">
            <p className="gsm-label text-[10px] text-text-soft-400">Stops · drag upcoming to reorder</p>
            <span className="text-[11px] tabular-nums text-text-soft-400">{RIDER_DONE.length} done · {upcoming.length} left</span>
          </div>
          <StopSequenceList
            stops={seqStops}
            onReorder={(ids) => setUpcoming((prev) => ids.map((id) => prev.find((s) => s.id === id)).filter(Boolean) as RiderScreenStop[])}
            onRecalculate={() => {}}
          />
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-text-soft-400">
            <RiCheckLine className="size-3.5 text-(--state-success-base)" />
            Delivered stops are locked — their order can&apos;t change.
          </p>
        </div>
      </div>
    </div>
  )
}

function PodDemo() {
  const [photos, setPhotos] = React.useState<{ id: string; url: string }[]>([])
  const [note, setNote] = React.useState("")
  return (
    <div className="max-w-sm rounded-sm border border-stroke-soft-200 p-4">
      <ProofOfDeliveryCapture
        photos={photos}
        onAddPhoto={(f) => setPhotos((p) => [...p, { id: String(p.length), url: URL.createObjectURL(f) }])}
        onRemovePhoto={(id) => setPhotos((p) => p.filter((x) => x.id !== id))}
        note={note}
        onNoteChange={setNote}
        onConfirm={() => {}}
      />
    </div>
  )
}

/* ── H3 zones on a live map ────────────────────────────────────────────── */
const ZONE_DEFS = [
  { center: [-6.2555, 106.802] as [number, number], name: "Kemang", color: routeColor(0) },
  { center: [-6.2705, 106.815] as [number, number], name: "Cilandak", color: routeColor(2) },
  { center: [-6.262, 106.832] as [number, number], name: "Pejaten", color: routeColor(1) },
]
function ZonesDemo() {
  const zones = ZONE_DEFS.map((z) => ({ ...z, cells: gridDisk(latLngToCell(z.center[0], z.center[1], 8), 1) }))
  const [activeId, setActiveId] = React.useState<string>("Kemang")
  return (
    <div className="relative max-w-2xl">
      <DashMap className="h-80 w-full" fitTo={ZONE_DEFS.map((z) => ({ lat: z.center[0], lng: z.center[1] }))}>
        {zones.map((z) => (
          <HexZone
            key={z.name}
            cells={z.cells}
            color={z.color}
            active={z.name === activeId}
            label={z.name}
            onClick={() => setActiveId(z.name)}
          />
        ))}
      </DashMap>
      <div className="absolute left-3 top-3">
        <ActiveZoneChip
          name={activeId}
          color={zones.find((z) => z.name === activeId)?.color}
          onClear={() => setActiveId("")}
        />
      </div>
    </div>
  )
}

export const MAP_CATEGORIES: Category[] = [
  {
    id: "logistics-map",
    title: "Logistics · map & markers",
    blurb: "DashMap (Google Maps behind a Dash API) + brand-styled overlays. Route colors are operational data — distinct per rider, exempt from the one-accent rule.",
    demos: [
      {
        name: "Live dispatch map (route)",
        description: "Real Google Maps: GSM grayscale canvas, hub teardrop, a route polyline through route-colored numbered stops, zoom controls. Renders when VITE_GOOGLE_MAPS_API_KEY is set.",
        render: () => <LiveDispatchMap />,
      },
      {
        name: "Dispatch map (preview)",
        description: "Static stand-in showing the same composition without a live map: hub teardrop, route-colored stops, route lines, legend.",
        render: () => <DispatchMapPreview />,
      },
      {
        name: "DashMap",
        description: "The base Google Maps wrapper. Renders live when a key is configured; otherwise shows its graceful no-key fallback (never a broken gray box).",
        render: () => <DashMap className="h-56 w-full max-w-2xl" />,
      },
      {
        name: "PlacesAutocomplete",
        description: "Address search on Google Places with billing-aware session tokens, debounced predictions, and keyboard navigation. Without an API key it degrades to a plain input + manual-entry hint.",
        render: function PlacesDemo() {
          const [address, setAddress] = React.useState("")
          const [picked, setPicked] = React.useState<PlacePick | null>(null)
          return (
            <div className="w-full max-w-md space-y-2">
              <PlacesAutocomplete
                value={address}
                onChange={setAddress}
                onPick={setPicked}
                placeholder="Jl. Boulevard Raya, Kelapa Gading…"
              />
              {picked ? (
                <p className="font-mono text-[11px] tabular-nums text-text-sub-600">
                  {picked.latitude.toFixed(6)}, {picked.longitude.toFixed(6)}
                </p>
              ) : null}
            </div>
          )
        },
      },
      {
        name: "LocationPreview",
        description: "Read-only single-pin map for forms and detail panels — empty, loading, and no-key states are editorial hints, never a broken gray box. Re-pins live as coordinates change.",
        render: function LocationPreviewDemo() {
          const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>({
            lat: -6.2607,
            lng: 106.8132,
          })
          return (
            <div className="w-full max-w-md space-y-2">
              <LocationPreview
                latitude={coords?.lat ?? null}
                longitude={coords?.lng ?? null}
                height={220}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-text-sub-600 underline underline-offset-2 hover:text-text-strong-950"
                  onClick={() => setCoords({ lat: -6.2607, lng: 106.8132 })}
                >
                  Kemang pin
                </button>
                <button
                  type="button"
                  className="text-xs text-text-sub-600 underline underline-offset-2 hover:text-text-strong-950"
                  onClick={() => setCoords(null)}
                >
                  Clear (empty state)
                </button>
              </div>
            </div>
          )
        },
      },
      {
        name: "StopMarker · Dropoff · Pickup",
        description: "Numbered, route-colored stop pins. States: planned / active / done / failed / selected.",
        render: () => (
          <Row>
            <StopMarker color={routeColor(0)} sequence={1} />
            <StopMarker color={routeColor(1)} sequence={2} state="active" />
            <StopMarker color={routeColor(0)} sequence={3} state="done" />
            <StopMarker color={routeColor(0)} sequence={4} state="failed" />
            <StopMarker color={routeColor(4)} sequence={5} selected />
            <PickupMarker color={routeColor(6)} sequence={1} />
          </Row>
        ),
      },
      {
        name: "HubMarker",
        description: "Origin/depot teardrop — Dash Purple (the brand anchor of every plan).",
        render: () => <Row><HubMarker size="sm" /><HubMarker size="md" label="CGK-01" /><HubMarker size="lg" /></Row>,
      },
      {
        name: "DriverMarker",
        description: "Live rider position, heading-rotated, with a moving pulse.",
        render: () => <Row><DriverMarker heading={0} /><DriverMarker heading={90} /><DriverMarker heading={215} active={false} /></Row>,
      },
      {
        name: "ClusterMarker",
        description: "Collapses overlapping stops into a count bubble when zoomed out.",
        render: () => <Row><ClusterMarker count={5} /><ClusterMarker count={24} color={routeColor(2)} /><ClusterMarker count={120} size="lg" /></Row>,
      },
      {
        name: "MarkerPopover",
        description: "Brand-styled callout replacing the default InfoWindow.",
        render: () => (
          <MarkerPopover title="BTH260626 · Stop 1" color={routeColor(0)}>
            Jl. Mujair Raya, Kios 14 · 2 items · 24.6 km
          </MarkerPopover>
        ),
      },
      {
        name: "MapLegend",
        description: "Color↔rider key; rows toggle a route's visibility.",
        render: function LegendDemo() {
          const [hidden, setHidden] = React.useState<Record<string, boolean>>({})
          const entries = [0, 1, 3, 4].map((c, i) => ({
            id: String(c), label: ["Ricky", "Ahmad Rofi", "Henny S.", "Rohmani"][i], color: routeColor(c), hidden: hidden[String(c)],
          }))
          return <MapLegend entries={entries} onToggle={(id) => setHidden((h) => ({ ...h, [id]: !h[id] }))} />
        },
      },
      {
        name: "HexZone (H3 zones)",
        description: "Delivery zones as H3 hex cells on the live map, one color per zone. Click a zone to activate it; ActiveZoneChip shows the selection.",
        render: () => <ZonesDemo />,
      },
      {
        name: "ConflictBanner",
        description: "Warns when zones overlap (a stop could route to two hubs). Error-toned with a resolve path.",
        render: () => (
          <div className="max-w-xl">
            <ConflictBanner
              conflicts={["Kemang ↔ Cilandak — 3 cells", "Cilandak ↔ Pejaten — 1 cell"]}
              onResolve={() => {}}
            />
          </div>
        ),
      },
    ],
  },
  {
    id: "logistics-dispatch",
    title: "Logistics · dispatch panel",
    blurb: "The operations console panel — riders, trips, stops, items, capacity, and the metric strip. Reorder stops by drag.",
    demos: [
      {
        name: "DispatchStatsBar",
        description: "Top-of-console metric strip.",
        render: () => (
          <DispatchStatsBar
            className="max-w-2xl"
            stats={[
              { label: "Items", value: 185 },
              { label: "Stops", value: 65 },
              { label: "Batches", value: 12 },
              { label: "Demand · capacity", value: "1627 / 5760", hint: "min" },
              { label: "Utilization", value: "28%" },
            ]}
          />
        ),
      },
      { name: "RiderBatchCard · TripCard · StopSequenceList", description: "A rider with multiple batches — each batch opens/closes, stops drag to reorder, and each stop opens to its items. Three levels of disclosure.", render: () => <RiderBatchDemo /> },
      {
        name: "DispatchStatusBadge",
        description: "Trip lifecycle status (operational color).",
        render: () => (
          <Row>
            <DispatchStatusBadge status="planned" />
            <DispatchStatusBadge status="dispatched" />
            <DispatchStatusBadge status="in-progress" />
            <DispatchStatusBadge status="completed" />
            <DispatchStatusBadge status="deferred" />
            <DispatchStatusBadge status="cancelled" />
          </Row>
        ),
      },
      {
        name: "Logistics chips",
        description: "ETA / distance / duration / weight / volume — tabular metadata.",
        render: () => (
          <Row>
            <ETAChip>16:40</ETAChip>
            <DistanceChip>34.6 km</DistanceChip>
            <DurationChip>2h 56m</DurationChip>
            <WeightChip>10.60 kg</WeightChip>
            <VolumeChip>0.034 m³</VolumeChip>
          </Row>
        ),
      },
      { name: "StopSequenceList", description: "Drag (or keyboard) to reorder stops. Completed stops are locked (no handle, can't be moved or passed); recalculate appears once the order is dirty. Pass disabled for a fully read-only list.", render: () => <StopSequenceDemo /> },
    ],
  },
  {
    id: "logistics-rider",
    title: "Logistics · rider app",
    blurb: "How the rider sees the route + stops. Built React-first; mirrored to Jetpack Compose via the spec in the knowledge vault.",
    demos: [
      {
        name: "Rider app — route screen (mockup)",
        description: "Full screen: live map with the route ahead (driver → active → upcoming), progress, the active stop with actions, and the uncompleted stops reorderable by drag. Completed stops are locked.",
        render: () => <RiderAppMockup />,
      },
      {
        name: "RouteProgress",
        description: "At-a-glance progress + trip ETA, top of the rider screen.",
        render: () => <div className="max-w-sm"><RouteProgress done={12} total={20} etaLabel="ETA 16:40" /></div>,
      },
      {
        name: "NextStopCard",
        description: "Current target stop with one-handed actions (Arrived / Navigate / Call).",
        render: () => (
          <div className="max-w-sm">
            <NextStopCard
              sequence={3}
              color={routeColor(0)}
              address="Jl. Kemang Raya 12, RT 4 / RW 2"
              recipient="Andi · 0812-3456-7890"
              distanceLabel="1.2 km"
              etaLabel="6 min"
              itemsLabel="3 items"
              onArrived={() => {}}
              onNavigate={() => {}}
              onCall={() => {}}
            />
          </div>
        ),
      },
      {
        name: "RiderStopManifest",
        description: "The rider's ordered stop list (drop inside a Sheet for the bottom-sheet manifest).",
        render: () => (
          <div className="max-w-sm rounded-sm border border-stroke-soft-200 px-3">
            <RiderStopManifest
              onSelect={() => {}}
              stops={[
                { id: "1", sequence: 1, color: routeColor(0), address: "Jl. Mujair Raya 14", state: "done", meta: "2 items" },
                { id: "2", sequence: 2, color: routeColor(0), address: "Griya Jakarta A5", state: "done", meta: "4 items" },
                { id: "3", sequence: 3, color: routeColor(0), address: "Jl. Kemang Raya 12", current: true, meta: "3 items · 1.2 km" },
                { id: "4", sequence: 4, color: routeColor(0), address: "Jl. Ampera Raya 88", meta: "1 item" },
              ]}
            />
          </div>
        ),
      },
      { name: "ProofOfDeliveryCapture", description: "Arrival proof: photo(s) + note, confirm gated on a photo.", render: () => <PodDemo /> },
    ],
  },
]
