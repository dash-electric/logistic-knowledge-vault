"use client"

import * as React from "react"
import { RiMegaphoneLine as Megaphone } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * AnnouncementBar — Ported from Dash Next Portal v2.
 *
 * Sticky top-of-page running text (news-ticker style). Marquee duplicates the
 * text N times so the loop is seamless on any width.
 */
export type AnnouncementBarProps = React.HTMLAttributes<HTMLDivElement> & {
  text: string
  visible?: boolean
}

const AnnouncementBar = React.forwardRef<HTMLDivElement, AnnouncementBarProps>(
  ({ text, visible = true, className, ...props }, ref) => {
    if (!visible) return null
    return (
      <div
        ref={ref}
        data-slot="announcement-bar"
        className={cn(
          "relative flex h-10 w-full items-center overflow-hidden bg-(--state-information-base) text-static-white",
          className,
        )}
        {...props}
      >
        <div className="flex shrink-0 items-center gap-2 pl-4 pr-3">
          <Megaphone className="size-4 shrink-0" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="inline-flex whitespace-nowrap"
            style={{ animation: "dash-announcement-marquee 30s linear infinite" }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="px-12 text-sm font-medium">
                {text}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes dash-announcement-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    )
  },
)
AnnouncementBar.displayName = "AnnouncementBar"

export { AnnouncementBar }
