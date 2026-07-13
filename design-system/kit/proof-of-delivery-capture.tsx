"use client"

import * as React from "react"
import { RiCameraLine, RiCloseLine } from "@remixicon/react"
import { cn } from "./lib/utils"
import { Button } from "./button"
import { Textarea } from "./textarea"

/**
 * ProofOfDeliveryCapture — the arrival proof step: capture photo(s) + an
 * optional note, then confirm delivery. Photo + note now; signature is a later
 * add (kept out of scope to keep the rider flow fast). Uses the device camera
 * via <input capture> on mobile.
 */
export type PodPhoto = { id: string; url: string }

export type ProofOfDeliveryCaptureProps = {
  photos: PodPhoto[]
  onAddPhoto?: (file: File) => void
  onRemovePhoto?: (id: string) => void
  note?: string
  onNoteChange?: (v: string) => void
  onConfirm?: () => void
  confirmLabel?: React.ReactNode
  minPhotos?: number
  className?: string
}

export function ProofOfDeliveryCapture({
  photos, onAddPhoto, onRemovePhoto, note, onNoteChange, onConfirm,
  confirmLabel = "Confirm delivery", minPhotos = 1, className,
}: ProofOfDeliveryCaptureProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const canConfirm = photos.length >= minPhotos
  return (
    <div className={cn("space-y-4", className)} data-slot="proof-of-delivery">
      <div>
        <p className="gsm-label mb-2 text-[10px] text-text-soft-400">Proof of delivery</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative size-20 overflow-hidden rounded-sm border border-stroke-soft-200">
              <img src={p.url} alt="Delivery proof" className="size-full object-cover" />
              {onRemovePhoto ? (
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => onRemovePhoto(p.id)}
                  className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-[#171717]/70 text-white [&_svg]:size-3"
                >
                  <RiCloseLine />
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid size-20 place-items-center rounded-sm border border-dashed border-stroke-sub-300 text-icon-soft-400 hover:bg-bg-weak-50 hover:text-icon-sub-600 [&_svg]:size-6"
            aria-label="Add photo"
          >
            <RiCameraLine />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onAddPhoto?.(f)
              e.target.value = ""
            }}
          />
        </div>
      </div>

      <Textarea
        placeholder="Note (e.g. left with security, recipient absent)…"
        rows={2}
        value={note}
        onChange={(e) => onNoteChange?.(e.target.value)}
      />

      <Button className="w-full" disabled={!canConfirm} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      {!canConfirm ? (
        <p className="text-center text-xs text-text-sub-600">Capture at least {minPhotos} photo to confirm.</p>
      ) : null}
    </div>
  )
}
