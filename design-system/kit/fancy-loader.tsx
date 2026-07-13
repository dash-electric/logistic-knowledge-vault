"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/**
 * FancyLoader — Ported from Dash Next Portal v2.
 *
 * Full-screen branded "securing access" loader. Heavy animation budget
 * (shield-pulse + float + bouncing dots) — only use for trust-critical
 * waits like auth, payment, KYC. For inline work prefer Spinner or Shimmer.
 */
export type FancyLoaderProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** Render in a sized container instead of fixed-inset. */
  inline?: boolean
  className?: string
}

const FancyLoader = React.forwardRef<HTMLDivElement, FancyLoaderProps>(
  (
    {
      title = "Securing your access",
      description = "Verifying credentials and permissions...",
      inline = false,
      className,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="fancy-loader"
        className={cn(
          "flex items-center justify-center bg-bg-weak-50",
          inline ? "h-[480px] w-full rounded-2xl" : "fixed inset-0 z-50",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-8">
          <svg
            width="240"
            height="240"
            viewBox="0 0 280 280"
            fill="none"
            className="dash-fancy-float"
            aria-hidden
          >
            {/*
             * Layer-1 token discipline (audit C2): all SVG fills bind to
             * foundation tokens so theme overrides and dark-mode flip work.
             * - outer halos: dash-purple-50 / -100 (lightest brand ramp)
             * - shield body: dash-purple-300 (mid-saturation, soft tint)
             * - lock body + bow: dash-purple-500 (canonical brand purple)
             * - lock highlights: bg-weak-50 (semantic surface, dark-mode safe)
             */}
            <circle cx="140" cy="140" r="120" fill="var(--dash-purple-50)" className="dash-fancy-pulse" />
            <circle cx="140" cy="140" r="90" fill="var(--dash-purple-100)" opacity="0.6" className="dash-fancy-pulse-d" />
            <path d="M140 60s-40 10-40 30v50c0 30 20 50 40 60 20-10 40-30 40-60V90c0-20-40-30-40-30Z" fill="var(--dash-purple-300)" className="dash-fancy-shield" />
            <rect x="120" y="130" width="40" height="35" rx="4" fill="var(--dash-purple-500)" className="dash-fancy-lock" />
            <path d="M127 130v-10c0-7 6-13 13-13s13 6 13 13v10" stroke="var(--dash-purple-500)" strokeWidth="6" strokeLinecap="round" className="dash-fancy-lock" />
            <circle cx="140" cy="142" r="4" fill="var(--bg-weak-50)" />
            <rect x="138" y="145" width="4" height="10" rx="1" fill="var(--bg-weak-50)" />
          </svg>
          <div className="space-y-3 text-center">
            <h2 className="text-xl font-semibold text-text-strong-950">{title}</h2>
            <p className="text-sm text-text-sub-600">{description}</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="size-2 rounded-full bg-(--dash-purple-500) dash-fancy-dot" />
              <span className="size-2 rounded-full bg-(--dash-red-400) dash-fancy-dot" style={{ animationDelay: "0.2s" }} />
              <span className="size-2 rounded-full bg-(--dash-blue-400) dash-fancy-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes dash-fancy-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes dash-fancy-pulse { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.5; } }
          @keyframes dash-fancy-pulse-d { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.08); opacity: 0.7; } }
          @keyframes dash-fancy-shield { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02); } }
          @keyframes dash-fancy-lock { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
          @keyframes dash-fancy-dot { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          .dash-fancy-float { animation: dash-fancy-float 3s ease-in-out infinite; transform-origin: center; }
          .dash-fancy-pulse { animation: dash-fancy-pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
          .dash-fancy-pulse-d { animation: dash-fancy-pulse-d 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
          .dash-fancy-shield { animation: dash-fancy-shield 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
          .dash-fancy-lock { animation: dash-fancy-lock 2s ease-in-out infinite; }
          .dash-fancy-dot { animation: dash-fancy-dot 1.4s ease-in-out infinite; }
        `}</style>
      </div>
    )
  },
)
FancyLoader.displayName = "FancyLoader"

export { FancyLoader }
