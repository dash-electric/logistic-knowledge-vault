"use client"

import * as React from "react"
import { RiErrorWarningLine as AlertCircle, RiAlertLine as AlertTriangle, RiCheckboxCircleLine as CheckCircle2, RiInformationLine as Info, RiSparkling2Line as Sparkles, RiCloseLine as X } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Alert — Figma 1:1 parity (node 169:2399, paste verified 2026-05-17).
 *
 * Figma component name: "Alert & Notification & Toast [1.1]"
 * (one component set shared between Alert + Toast surface variant).
 *
 * 5 statuses × 4 styles × 3 sizes.
 *
 * Sizes (from Figma absoluteBoundingBox):
 *   xs (X-Small=32) → h=32, pad=8, gap=8, radius=8, icon=16, text=14/16
 *   sm (Small=36)   → h=36, pad y=8 x=10, gap=8, radius=8, icon=20, text=14/20
 *   lg (Large)      → pad y=14/16 x=14, gap=12, radius=12, icon=20, vertical
 *                     stack content (title gap=4 description, gap=10 to actions)
 *
 * Style → token map (matches Figma source-of-truth solid rendering):
 *   filled   → bg state-X-base   | text+icon static-white
 *   light    → bg state-X-light  | text text-strong-950 | icon state-X-base
 *   lighter  → bg state-X-lighter| text text-strong-950 | icon state-X-base
 *   stroke   → bg bg-white-0 | border stroke-soft-200 | text text-strong-950
 *              | icon state-X-base
 *
 * Note: Only the icon carries status color in non-filled appearances.
 * Text + close icon = neutral text-strong-950 regardless of status.
 *
 * Dash deviation (D3): `feature` status uses state-feature-base
 * (Dash purple-500), NOT Figma source (gray-500). This matches Badge,
 * Banner, and the rest of Dash where "feature" = brand purple.
 */

type Status = "error" | "warning" | "success" | "information" | "feature"
type Appearance = "filled" | "lighter" | "stroke"
type Size = "xs" | "sm" | "lg"

const STATUS_ICON: Record<Status, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  information: Info,
  feature: Sparkles,
}

const filledBg: Record<Status, string> = {
  error: "bg-(--state-error-base) text-static-white",
  warning: "bg-(--state-warning-base) text-static-white",
  success: "bg-(--state-success-base) text-static-white",
  information: "bg-(--state-information-base) text-static-white",
  feature: "bg-(--state-feature-base) text-static-white",
}

// "Lighter" — soft-tint Alert using state-X-light (-200 bg).
// Old "lighter" (-50 bg) dropped per Figma audit 2026-05-17.
const lighterBg: Record<Status, string> = {
  error: "bg-(--state-error-light)",
  warning: "bg-(--state-warning-light)",
  success: "bg-(--state-success-light)",
  information: "bg-(--state-information-light)",
  feature: "bg-(--state-feature-light)",
}

const iconColorClass: Record<Status, string> = {
  error: "text-(--state-error-base)",
  warning: "text-(--state-warning-base)",
  success: "text-(--state-success-base)",
  information: "text-(--state-information-base)",
  feature: "text-(--state-feature-base)",
}

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  status?: Status
  appearance?: Appearance
  size?: Size
  showIcon?: boolean
  icon?: React.ReactNode
  title?: React.ReactNode
  /** Inline action slot. In lg, renders below content. In xs/sm, renders inline after title (underlined link style). */
  action?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      status = "information",
      appearance = "lighter",
      size = "sm",
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
          : "bg-bg-white-0 border border-stroke-soft-200"

    const textClass =
      appearance === "filled" ? "text-static-white" : "text-text-strong-950"

    const iconClass =
      appearance === "filled" ? "text-static-white" : iconColorClass[status]

    const closeIconClass =
      appearance === "filled" ? "text-static-white" : "text-text-strong-950"

    /* size dimensions per Figma --------------------------------------------- */
    const sizeShell =
      size === "xs"
        ? "min-h-8 py-2 px-2 gap-2 rounded-lg"
        : size === "sm"
          ? "min-h-9 py-2 px-2.5 gap-2 rounded-lg"
          : "py-3.5 px-3.5 pb-4 gap-3 rounded-xl items-start" // lg: 14 14 16 14, gap 12, r 12

    const iconBox =
      size === "xs"
        ? "size-4 [&_svg]:size-3"
        : "size-5 [&_svg]:size-[15px]"

    const textSize = "text-sm leading-5" // 14/20 (sm) — xs also uses 14 in Figma but lh=16
    const textXsLh = size === "xs" ? "leading-4" : "leading-5"

    const isAssertive = status === "error"
    const role = isAssertive ? "alert" : "status"
    const ariaLive = isAssertive ? "assertive" : "polite"

    if (size === "lg") {
      return (
        <div
          ref={ref}
          role={role}
          aria-live={ariaLive}
          data-slot="alert"
          data-status={status}
          data-appearance={appearance}
          className={cn(
            "relative inline-flex w-full items-start justify-start",
            sizeShell,
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
                "shrink-0 inline-flex items-center justify-center mt-px",
                iconBox,
                iconClass,
              )}
            >
              {icon ?? <StatusIcon strokeWidth={1.75} />}
            </span>
          ) : null}

          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              {title ? <div className="text-sm leading-5 font-medium">{title}</div> : null}
              {children ? (
                <div className="text-sm leading-5 font-normal">{children}</div>
              ) : null}
            </div>
            {action ? <div className="flex items-center gap-2">{action}</div> : null}
          </div>

          {dismissible ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className={cn(
                "shrink-0 inline-flex size-5 items-center justify-center rounded-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300)",
                "hover:opacity-100 opacity-[0.72] transition-opacity",
                closeIconClass,
              )}
            >
              <X strokeWidth={2} className="size-2.5" />
            </button>
          ) : null}
        </div>
      )
    }

    // xs / sm — inline single-row layout
    return (
      <div
        ref={ref}
        role={role}
        aria-live={ariaLive}
        data-slot="alert"
        data-status={status}
        data-appearance={appearance}
        className={cn(
          "relative inline-flex w-full items-center justify-start",
          sizeShell,
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
              "shrink-0 inline-flex items-center justify-center",
              iconBox,
              iconClass,
            )}
          >
            {icon ?? <StatusIcon strokeWidth={1.75} />}
          </span>
        ) : null}

        <span
          className={cn("flex-1 min-w-0 truncate text-sm font-medium", textXsLh)}
        >
          {title ?? children}
        </span>

        {action ? (
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 text-sm font-medium",
              textXsLh,
            )}
          >
            {action}
          </span>
        ) : null}

        {dismissible ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className={cn(
              "shrink-0 inline-flex items-center justify-center rounded-sm",
              iconBox,
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300)",
              "hover:opacity-100 opacity-[0.72] transition-opacity",
              closeIconClass,
            )}
          >
            <X strokeWidth={2} className={cn(size === "xs" ? "size-2.5" : "size-2.5")} />
          </button>
        ) : null}
      </div>
    )
  },
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="alert-title"
      className={cn("text-sm leading-5 font-medium", className)}
      {...props}
    />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="alert-description"
      className={cn("text-sm leading-5 font-normal opacity-90", className)}
      {...props}
    />
  ),
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
export type { Status as AlertStatus, Appearance as AlertAppearance, Size as AlertSize }
