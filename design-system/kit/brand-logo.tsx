"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * BrandLogo — renders a third-party brand / product / crypto logo by slug.
 *
 * These are full-COLOR static SVGs (brand hex preserved), so unlike `<Icon>`
 * they are NOT `currentColor`-tintable. The asset lives in
 * `public/brand/<slug>[-<variant>].svg` (vendored by
 * `scripts/vendor-brand-flags.mjs`). 333 brands; ~28 ship multi-variant
 * (black / original / white) for light/dark surfaces.
 *
 *   <BrandLogo name="github" />
 *   <BrandLogo name="adobe" variant="white" size={32} />
 *
 * Variant resolution: "default" (or omitted) → `<slug>.svg`; any other variant
 * → `<slug>-<variant>.svg`. See `public/brand/manifest.json` for the set.
 */
export type BrandVariant = "default" | "black" | "original" | "white"

export interface BrandLogoProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  /** Brand slug, e.g. "github", "adobe", "bitcoin". */
  name: string
  /** Color variant for brands that ship more than one. Defaults to "default". */
  variant?: BrandVariant
  /** Square render size in px. Default 24. */
  size?: number
  /** Public base path; override only if assets are served elsewhere. */
  basePath?: string
}

export const BrandLogo = React.forwardRef<HTMLImageElement, BrandLogoProps>(
  ({ name, variant = "default", size = 24, basePath = "/brand", className, alt, ...props }, ref) => {
    const file = variant && variant !== "default" ? `${name}-${variant}` : name
    return (
      <img
        ref={ref}
        src={`${basePath}/${file}.svg`}
        width={size}
        height={size}
        alt={alt ?? `${name} logo`}
        loading="lazy"
        decoding="async"
        className={cn("inline-block shrink-0 object-contain align-middle", className)}
        {...props}
      />
    )
  },
)
BrandLogo.displayName = "BrandLogo"
