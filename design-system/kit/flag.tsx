"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * Flag — renders a region flag by slug key.
 *
 * Full-COLOR, circular-cropped static SVGs (not `currentColor`-tintable). The
 * asset lives at `public/flags/<key>.svg` (vendored by
 * `scripts/vendor-brand-flags.mjs`). The `key` is a slugified region name;
 * see `public/flags/manifest.json` for the full key↔name set. 262 flags.
 *
 *   <Flag code="indonesia" />
 *   <Flag code="singapore" size={20} className="rounded-full" />
 */
export interface FlagProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  /** Region slug key, e.g. "indonesia". Matches public/flags/manifest.json. */
  code: string
  /** Square render size in px. Default 24. */
  size?: number
  /** Public base path; override only if assets are served elsewhere. */
  basePath?: string
}

export const Flag = React.forwardRef<HTMLImageElement, FlagProps>(
  ({ code, size = 24, basePath = "/flags", className, alt, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={`${basePath}/${code}.svg`}
        width={size}
        height={size}
        alt={alt ?? `${code} flag`}
        loading="lazy"
        decoding="async"
        className={cn("inline-block shrink-0 object-contain align-middle", className)}
        {...props}
      />
    )
  },
)
Flag.displayName = "Flag"
