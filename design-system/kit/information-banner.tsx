"use client"

import * as React from "react"
import {
  RiArrowLeftSLine as ChevL,
  RiArrowRightSLine as ChevR,
} from "@remixicon/react"
import { IconButton } from "./icon-button"
import { cn } from "./lib/utils"

/**
 * InformationBanner — Ported from Dash Next Portal v2.
 *
 * Multi-slide info carousel for dashboard hero. Auto-advances every `autoMs`,
 * pauses on hover, swappable via arrows or pill indicators. Each slide is a
 * single image so marketing can ship without code changes.
 */
export type InformationBannerSlide = {
  id: string
  image: string
  alt: string
  href?: string
}

export type InformationBannerProps = {
  slides: InformationBannerSlide[]
  autoMs?: number
  className?: string
}

const InformationBanner = React.forwardRef<HTMLDivElement, InformationBannerProps>(
  ({ slides, autoMs = 6000, className }, ref) => {
    const [idx, setIdx] = React.useState(0)
    const [hover, setHover] = React.useState(false)

    React.useEffect(() => {
      if (slides.length <= 1 || hover || autoMs <= 0) return
      const id = setInterval(
        () => setIdx((i) => (i + 1) % slides.length),
        autoMs,
      )
      return () => clearInterval(id)
    }, [slides.length, hover, autoMs])

    if (slides.length === 0) return null
    const showControls = slides.length > 1

    return (
      <div
        ref={ref}
        data-slot="information-banner"
        className={cn("relative w-full select-none", className)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {showControls && (
          <>
            <IconButton
              tone="neutral"
              style="stroke"
              size="sm"
              aria-label="Previous slide"
              onClick={() =>
                setIdx((i) => (i - 1 + slides.length) % slides.length)
              }
              className="absolute -left-4 top-1/2 z-10 -translate-y-1/2"
            >
              <ChevL />
            </IconButton>
            <IconButton
              tone="neutral"
              style="stroke"
              size="sm"
              aria-label="Next slide"
              onClick={() => setIdx((i) => (i + 1) % slides.length)}
              className="absolute -right-4 top-1/2 z-10 -translate-y-1/2"
            >
              <ChevR />
            </IconButton>
          </>
        )}

        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {slides.map((s) => (
              <a
                key={s.id}
                href={s.href ?? "#"}
                className="shrink-0 grow-0 basis-full"
                onClick={(e) => !s.href && e.preventDefault()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.alt} className="h-auto w-full rounded-2xl" />
              </a>
            ))}
          </div>
        </div>

        {showControls && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-2 rounded-full bg-bg-soft-200 transition-all duration-300",
                  i === idx ? "w-6" : "w-2",
                )}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
)
InformationBanner.displayName = "InformationBanner"

export { InformationBanner }
