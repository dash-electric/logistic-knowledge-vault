"use client"

import * as React from "react"
import {
  RiCloseLine as X,
  RiNotification3Line as Bell,
  RiArrowUpSLine as ArrowUp,
} from "@remixicon/react"
import { IconButton } from "./icon-button"
import { Button } from "./button"

/**
 * NotificationOnboarding — Ported from Dash Next Portal v2.
 *
 * Popover-based feature walkthrough hint. Wraps a target element with a pulsing
 * dot, then promotes to a backdrop + arrowed card after a short delay. Persists
 * "seen" state in localStorage so the hint fires once per device.
 */

export const DEFAULT_NOTIFICATION_ONBOARDING_KEY = "dash_notification_onboarding_seen"

export function useOnboardingHint(key = DEFAULT_NOTIFICATION_ONBOARDING_KEY) {
  const [seen, setSeen] = React.useState(true)
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    setSeen(!!localStorage.getItem(key))
    setReady(true)
  }, [key])
  const markSeen = React.useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(key, "1")
    setSeen(true)
  }, [key])
  const reset = React.useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(key)
    setSeen(false)
  }, [key])
  return { seen, ready, markSeen, reset }
}

export type NotificationOnboardingProps = {
  /** Anchor — typically the bell icon. */
  children: React.ReactNode
  /** Storage key — bump when copy changes to re-fire for everyone. */
  storageKey?: string
  title?: React.ReactNode
  description?: React.ReactNode
  cta?: React.ReactNode
  hint?: React.ReactNode
}

const NotificationOnboarding = React.forwardRef<
  HTMLDivElement,
  NotificationOnboardingProps
>(
  (
    {
      children,
      storageKey,
      title = "New: Notifications",
      description = "Get notified when a driver accepts your delivery, picks up, or completes a job.",
      cta = "Got it",
      hint = "Click the bell to open",
    },
    ref,
  ) => {
    const { seen, ready, markSeen } = useOnboardingHint(storageKey)
    const [show, setShow] = React.useState(false)

    React.useEffect(() => {
      if (ready && !seen) {
        const t = setTimeout(() => setShow(true), 800)
        return () => clearTimeout(t)
      }
    }, [ready, seen])

    const dismiss = () => {
      setShow(false)
      markSeen()
    }

    return (
      <div ref={ref} data-slot="notification-onboarding" className="relative">
        {children}

        {!seen && ready && !show && (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-primary" />
          </span>
        )}

        {show && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={dismiss}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-[280px]">
              <div className="absolute -top-2 right-4 flex items-center justify-center">
                <ArrowUp className="size-5 text-bg-white-0 drop-shadow-sm" />
              </div>
              <div className="overflow-hidden rounded-2xl bg-bg-white-0 shadow-lg ring-1 ring-stroke-soft-200">
                <div className="flex items-start gap-3 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-(--primary-alpha-10)">
                    <Bell className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-text-strong-950">{title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-sub-600">
                      {description}
                    </p>
                  </div>
                  <IconButton
                    tone="neutral"
                    style="ghost"
                    size="xs"
                    aria-label="Dismiss"
                    onClick={dismiss}
                    className="-mr-1 -mt-1"
                  >
                    <X />
                  </IconButton>
                </div>
                <div className="flex items-center justify-between border-t border-stroke-soft-200 bg-bg-weak-50 px-4 py-2.5">
                  <span className="text-xs text-text-soft-400">{hint}</span>
                  <Button size="xs" onClick={dismiss}>
                    {cta}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  },
)
NotificationOnboarding.displayName = "NotificationOnboarding"

export { NotificationOnboarding }
