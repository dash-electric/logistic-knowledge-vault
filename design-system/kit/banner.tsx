"use client"

import * as React from "react"
import { RiErrorWarningLine as AlertCircle, RiAlertLine as AlertTriangle, RiCheckboxCircleLine as CheckCircle2, RiInformationLine as Info, RiSparkling2Line as Sparkles, RiForbidLine as Ban, RiCloseLine as X } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Banner — full-bleed inline alert. Figma 1:1 parity (paste verified 2026-05-16).
 *
 * 5 canonical status colors × 4 appearance styles. Status set matches Figma
 * exactly (error / warning / success / information / faded). `feature` and
 * `neutral` are Dash extensions kept for backward compat with existing
 * shipped UI (login-04, system-banner blocks).
 *
 * Appearance → token map (verified against Figma source paste):
 *   filled   → bg state-X-base | text+icon static-white | close opacity 0.72
 *   light    → bg state-X-light (solid -200) | text text-strong-950
 *              | icon state-X-base | close opacity 0.48 + icon-strong-950
 *   lighter  → bg state-X-lighter (solid -50) | text text-strong-950
 *              | icon state-X-base | close opacity 0.48
 *   stroke   → bg bg-white-0 | border-b 1px stroke-soft-200
 *              | text text-strong-950 | icon state-X-base
 *              | close opacity 0.48
 *
 * Layout: full-bleed, py-3 px-12, inline-flex center, title + bullet ∙
 * separator + description on one row, action underlined text, close
 * absolute right.
 *
 * Note: light/lighter/stroke all use NEUTRAL dark text (text-strong-950),
 * NOT color-toned (--state-X-dark). Only the icon carries status color.
 */

type Status =
  | "error"
  | "warning"
  | "success"
  | "information"
  | "faded"
  | "feature"
  | "neutral"

type Appearance = "filled" | "lighter" | "stroke"

type Size = "sm" | "md"

const STATUS_ICON: Record<Status, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  information: Info,
  faded: Ban,
  feature: Sparkles,
  neutral: Info,
}

const filledBg: Record<Status, string> = {
  error: "bg-(--state-error-base)",
  warning: "bg-(--state-warning-base)",
  success: "bg-(--state-success-base)",
  information: "bg-(--state-information-base)",
  faded: "bg-(--state-faded-base)",
  feature: "bg-(--state-feature-base)",
  neutral: "bg-bg-strong-950",
}

// "Lighter" — soft-tint Banner using state-X-light (-200 bg).
// Old "lighter" (-50 bg) dropped per Figma audit 2026-05-17.
const lighterBg: Record<Status, string> = {
  error: "bg-(--state-error-light)",
  warning: "bg-(--state-warning-light)",
  success: "bg-(--state-success-light)",
  information: "bg-(--state-information-light)",
  faded: "bg-(--state-faded-light)",
  feature: "bg-(--state-feature-light)",
  neutral: "bg-bg-weak-50",
}

const iconColorClass: Record<Status, string> = {
  error: "text-(--state-error-base)",
  warning: "text-(--state-warning-base)",
  success: "text-(--state-success-base)",
  information: "text-(--state-information-base)",
  faded: "text-(--state-faded-base)",
  feature: "text-(--state-feature-base)",
  neutral: "text-text-sub-600",
}

export type BannerProps = React.HTMLAttributes<HTMLDivElement> & {
  status?: Status
  appearance?: Appearance
  size?: Size
  showIcon?: boolean
  icon?: React.ReactNode
  title?: React.ReactNode
  /** Inline action slot. Renders as underlined text link. */
  action?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      className,
      status = "information",
      appearance = "lighter",
      size = "md",
      showIcon = true,
      icon,
      title,
      action,
      dismissible,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    const StatusIcon = STATUS_ICON[status]

    const bgClass =
      appearance === "filled"
        ? filledBg[status]
        : appearance === "lighter"
          ? lighterBg[status]
          : "bg-bg-white-0 border-b border-stroke-soft-200"

    const textClass =
      appearance === "filled" ? "text-static-white" : "text-text-strong-950"

    const iconClass =
      appearance === "filled" ? "text-static-white" : iconColorClass[status]

    const closeOpacityClass =
      appearance === "filled" ? "opacity-[0.72]" : "opacity-[0.48]"
    const closeIconClass =
      appearance === "filled" ? "text-static-white" : "text-icon-strong-950"

    const padY = size === "sm" ? "py-2" : "py-3"

    return (
      <div
        ref={ref}
        role="status"
        data-slot="banner"
        data-status={status}
        data-appearance={appearance}
        className={cn(
          "relative w-full px-12 inline-flex items-center justify-center gap-3",
          padY,
          bgClass,
          textClass,
          "transition-colors duration-(--duration-fast) ease-(--ease-out)",
          className,
        )}
        {...props}
      >
        {showIcon ? (
          <span
            aria-hidden
            className={cn(
              "shrink-0 inline-flex items-center justify-center size-5 [&_svg]:size-[15px]",
              iconClass,
            )}
          >
            {icon ?? <StatusIcon strokeWidth={1.75} />}
          </span>
        ) : null}

        <div className="inline-flex items-center justify-center gap-2 text-sm leading-5">
          {title ? <span className="font-medium">{title}</span> : null}
          {title && children ? (
            <span aria-hidden className="font-medium select-none">
              ∙
            </span>
          ) : null}
          {children ? <span className="font-normal">{children}</span> : null}
        </div>

        {action ? (
          <div className="shrink-0 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2">
            {action}
          </div>
        ) : null}

        {dismissible ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 inline-flex size-5 items-center justify-center rounded-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300)",
              "hover:opacity-100 transition-opacity",
              closeOpacityClass,
              closeIconClass,
            )}
          >
            <X strokeWidth={2} className="size-[10px]" />
          </button>
        ) : null}
      </div>
    )
  },
)
Banner.displayName = "Banner"

export { Banner }
export type { Status as BannerStatus, Appearance as BannerAppearance, Size as BannerSize }
