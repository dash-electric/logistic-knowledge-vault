import * as React from "react"
import { RiCheckboxCircleLine as CheckCircle2, RiAlertLine as AlertTriangle, RiErrorWarningLine as AlertCircle, RiInformationLine as Info, RiForbidLine as Ban, RiShieldCheckLine as ShieldCheck, RiStarLine as Star, RiPulseLine as Activity, RiTimeLine as Clock } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Badge — Figma 1:1 parity (node 118-2324, paste verified 2026-05-16).
 *
 * 10 colors × 4 styles × 5 type modifiers × 2 sizes + disabled state.
 *
 * Pill shape: rounded-full (999px), NOT rounded-md.
 *
 * Style → bg / text token map (all use the state-* alias chain):
 *   filled   → bg state-X-base    | text static-white
 *   light    → bg state-X-light   | text state-X-dark  (solid -200 bg + -700 text)
 *   lighter  → bg state-X-lighter | text state-X-base  (solid -50 bg + -500 text)
 *   stroke   → outline state-X-base | text state-X-base | no bg
 *
 * 5 Type modifiers (asymmetric padding per Figma spec):
 *   default     → py-0.5 px-2          (label only)
 *   with-dot    → py-0 pl-0 pr-2       (16x16 box w/ 4x4 dot + label)
 *   left-icon   → py-0.5 pl-1 pr-2     (12x12 icon + label)
 *   right-icon  → py-0.5 pl-2 pr-1     (label + 12x12 icon)
 *   counter     → p-0.5                (just number, square-ish round)
 *
 * Disabled state (per Figma row 11):
 *   outline stroke-soft-200 | text text-disabled-300 | icon/dot icon-disabled-300
 */

type Status =
  | "error"
  | "warning"
  | "away"
  | "success"
  | "information"
  | "feature"
  | "verified"
  | "highlighted"
  | "stable"
  | "faded"
  | "neutral"

type Appearance = "filled" | "lighter" | "stroke"

type BadgeType = "default" | "dot" | "left-icon" | "right-icon" | "counter"

type BadgeSize = "sm" | "md"

const STATUSES: Status[] = [
  "error",
  "warning",
  "away",
  "success",
  "information",
  "feature",
  "verified",
  "highlighted",
  "stable",
  "faded",
  "neutral",
]

/* -------------------------------------------------------------------------- */
/* Style → color maps (one per appearance)                                     */
/* -------------------------------------------------------------------------- */

const filledClass: Record<Status, string> = {
  error: "bg-(--state-error-base) text-static-white",
  warning: "bg-(--state-warning-base) text-static-white",
  away: "bg-(--state-away-base) text-static-white",
  success: "bg-(--state-success-base) text-static-white",
  information: "bg-(--state-information-base) text-static-white",
  feature: "bg-(--state-feature-base) text-static-white",
  verified: "bg-(--state-verified-base) text-static-white",
  highlighted: "bg-(--state-highlighted-base) text-static-white",
  stable: "bg-(--state-stable-base) text-static-white",
  faded: "bg-(--state-faded-base) text-static-white",
  neutral: "bg-bg-strong-950 text-text-white-0",
}

// "Lighter" — the only soft-tint Badge variant (per Figma).
// Uses state-X-light bg (-200 scale) + state-X-dark text (-950 scale).
// Old "lighter" used state-X-lighter bg (-50 scale) — dropped per Figma audit
// 2026-05-17 (only Filled / Lighter / Stroke ship in Figma).
const lighterClass: Record<Status, string> = {
  error: "bg-(--state-error-light) text-(--state-error-dark)",
  warning: "bg-(--state-warning-light) text-(--state-warning-dark)",
  away: "bg-(--state-away-light) text-(--state-away-dark)",
  success: "bg-(--state-success-light) text-(--state-success-dark)",
  information: "bg-(--state-information-light) text-(--state-information-dark)",
  feature: "bg-(--state-feature-light) text-(--state-feature-dark)",
  verified: "bg-(--state-verified-light) text-(--state-verified-dark)",
  highlighted: "bg-(--state-highlighted-light) text-(--state-highlighted-dark)",
  stable: "bg-(--state-stable-light) text-(--state-stable-dark)",
  faded: "bg-(--state-faded-light) text-(--state-faded-dark)",
  neutral: "bg-bg-weak-50 text-text-strong-950",
}

const strokeClass: Record<Status, string> = {
  error: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-error-base) text-(--state-error-base)",
  warning: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-warning-base) text-(--state-warning-base)",
  away: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-away-base) text-(--state-away-base)",
  success: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-success-base) text-(--state-success-base)",
  information: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-information-base) text-(--state-information-base)",
  feature: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-feature-base) text-(--state-feature-base)",
  verified: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-verified-base) text-(--state-verified-base)",
  highlighted: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-highlighted-base) text-(--state-highlighted-base)",
  stable: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-stable-base) text-(--state-stable-base)",
  faded: "bg-transparent outline outline-1 -outline-offset-1 outline-(--state-faded-base) text-(--state-faded-base)",
  neutral: "bg-transparent outline outline-1 -outline-offset-1 outline-stroke-soft-200 text-text-strong-950",
}

const disabledClass =
  "bg-transparent outline outline-1 -outline-offset-1 outline-stroke-soft-200 text-text-disabled-300"

/* -------------------------------------------------------------------------- */
/* Dot color (for type="dot") — uses dot color from inverse of bg fill          */
/* -------------------------------------------------------------------------- */

function dotFill(status: Status, appearance: Appearance, disabled?: boolean): string {
  if (disabled) return "bg-icon-disabled-300"
  if (appearance === "filled") return "bg-static-white"
  if (appearance === "lighter") {
    // dot uses the same color as label text (state-X-dark)
    return {
      error: "bg-(--state-error-dark)",
      warning: "bg-(--state-warning-dark)",
      away: "bg-(--state-away-dark)",
      success: "bg-(--state-success-dark)",
      information: "bg-(--state-information-dark)",
      feature: "bg-(--state-feature-dark)",
      verified: "bg-(--state-verified-dark)",
      highlighted: "bg-(--state-highlighted-dark)",
      stable: "bg-(--state-stable-dark)",
      faded: "bg-(--state-faded-dark)",
      neutral: "bg-text-strong-950",
    }[status]
  }
  // stroke → use base color for dot
  return {
    error: "bg-(--state-error-base)",
    warning: "bg-(--state-warning-base)",
    away: "bg-(--state-away-base)",
    success: "bg-(--state-success-base)",
    information: "bg-(--state-information-base)",
    feature: "bg-(--state-feature-base)",
    verified: "bg-(--state-verified-base)",
    highlighted: "bg-(--state-highlighted-base)",
    stable: "bg-(--state-stable-base)",
    faded: "bg-(--state-faded-base)",
    neutral: "bg-text-sub-600",
  }[status]
}

/* -------------------------------------------------------------------------- */
/* Sizing — Figma: sm=11px/12 leading, md=12px/16 leading                       */
/* -------------------------------------------------------------------------- */

function sizeClass(size: BadgeSize): string {
  return size === "sm"
    ? "text-[11px] leading-3 tracking-[0.22px]"
    : "text-xs leading-4"
}

/* -------------------------------------------------------------------------- */
/* Padding per type (asymmetric per Figma)                                     */
/* -------------------------------------------------------------------------- */

function paddingClass(type: BadgeType): string {
  switch (type) {
    case "default":
      return "py-0.5 px-2"
    case "dot":
      // Match default badge insets (8px sides / 2px top-bottom). The dot is a
      // small inline mark next to the label — no oversized leading box.
      return "py-0.5 pl-2 pr-2"
    case "left-icon":
      return "py-0.5 pl-1 pr-2"
    case "right-icon":
      return "py-0.5 pl-2 pr-1"
    case "counter":
      return "p-0.5"
  }
}

/* -------------------------------------------------------------------------- */
/* Badge component                                                             */
/* -------------------------------------------------------------------------- */

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  status?: Status
  appearance?: Appearance
  size?: BadgeSize
  /** Figma type variant. Selects the layout (default / dot / left-icon /
   * right-icon / counter). For `dot`, `left-icon`, `right-icon` use children
   * for the label; the leading/trailing slot is auto-rendered. */
  type?: BadgeType
  /** Override the icon for `left-icon` / `right-icon` types. */
  icon?: React.ReactNode
  /** Disabled state — outlined stroke + neutral disabled text/icon. */
  disabled?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      status = "neutral",
      appearance = "lighter",
      size = "sm",
      type = "default",
      icon,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const colorClass = disabled
      ? disabledClass
      : appearance === "filled"
        ? filledClass[status]
        : appearance === "lighter"
          ? lighterClass[status]
          : strokeClass[status]

    const iconColorClass = disabled
      ? "text-icon-disabled-300"
      : appearance === "filled"
        ? "text-static-white"
        : ""

    return (
      <span
        ref={ref}
        data-slot="badge"
        data-status={status}
        data-appearance={appearance}
        data-type={type}
        data-disabled={disabled || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-0.5 font-medium",
          "rounded-full",
          paddingClass(type),
          sizeClass(size),
          colorClass,
          className,
        )}
        {...props}
      >
        {type === "dot" ? (
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", dotFill(status, appearance, disabled))}
          />
        ) : null}
        {type === "left-icon" ? (
          <span
            aria-hidden
            className={cn(
              "inline-flex size-3 shrink-0 items-center justify-center [&_svg]:size-3",
              iconColorClass,
            )}
          >
            {icon ?? <Activity strokeWidth={2} />}
          </span>
        ) : null}
        {type === "counter" ? null : children}
        {type === "right-icon" ? (
          <span
            aria-hidden
            className={cn(
              "inline-flex size-3 shrink-0 items-center justify-center [&_svg]:size-3",
              iconColorClass,
            )}
          >
            {icon ?? <Activity strokeWidth={2} />}
          </span>
        ) : null}
        {type === "counter" ? (
          <span className="w-3 text-center tabular-nums">{children}</span>
        ) : null}
      </span>
    )
  },
)
Badge.displayName = "Badge"

/* -------------------------------------------------------------------------- */
/* NumberBadge — convenience wrapper around Badge type="counter"               */
/* -------------------------------------------------------------------------- */

export type NumberBadgeProps = Omit<BadgeProps, "type" | "children"> & {
  value: number
}

const NumberBadge = React.forwardRef<HTMLSpanElement, NumberBadgeProps>(
  ({ value, status = "error", appearance = "filled", size = "sm", ...props }, ref) => {
    const display = value > 99 ? "99+" : String(value)
    return (
      <Badge
        ref={ref}
        type="counter"
        status={status}
        appearance={appearance}
        size={size}
        {...props}
      >
        {display}
      </Badge>
    )
  },
)
NumberBadge.displayName = "NumberBadge"

/* -------------------------------------------------------------------------- */
/* StatusBadge — Figma node 2939:19545 (separate spec from Badge)              */
/* Chip with rounded-sm, padding asymmetric pl-1 pr-2 py-1.                */
/* 4 variants: dot-stroke / icon-stroke / dot-light / icon-light.             */
/* -------------------------------------------------------------------------- */

const sbDotColor: Record<Status, string> = {
  error: "bg-(--state-error-base)",
  warning: "bg-(--state-warning-base)",
  away: "bg-(--state-away-base)",
  success: "bg-(--state-success-base)",
  information: "bg-(--state-information-base)",
  feature: "bg-(--state-feature-base)",
  verified: "bg-(--state-verified-base)",
  highlighted: "bg-(--state-highlighted-base)",
  stable: "bg-(--state-stable-base)",
  faded: "bg-(--state-faded-base)",
  neutral: "bg-text-sub-600",
}

const sbLabelColored: Record<Status, string> = {
  error: "text-(--state-error-base)",
  warning: "text-(--state-warning-base)",
  away: "text-(--state-away-base)",
  success: "text-(--state-success-base)",
  information: "text-(--state-information-base)",
  feature: "text-(--state-feature-base)",
  verified: "text-(--state-verified-base)",
  highlighted: "text-(--state-highlighted-base)",
  stable: "text-(--state-stable-base)",
  faded: "text-text-sub-600",
  neutral: "text-text-strong-950",
}

const sbChipLightBg: Record<Status, string> = {
  error: "bg-(--state-error-lighter)",
  warning: "bg-(--state-warning-lighter)",
  away: "bg-(--state-away-lighter)",
  success: "bg-(--state-success-lighter)",
  information: "bg-(--state-information-lighter)",
  feature: "bg-(--state-feature-lighter)",
  verified: "bg-(--state-verified-lighter)",
  highlighted: "bg-(--state-highlighted-lighter)",
  stable: "bg-(--state-stable-lighter)",
  faded: "bg-(--state-faded-lighter)",
  neutral: "bg-bg-weak-50",
}

const statusIcon: Record<Status, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  information: Info,
  faded: Ban,
  away: Clock,
  verified: ShieldCheck,
  feature: Star,
  highlighted: Star,
  stable: Activity,
  neutral: Activity,
}

export type StatusBadgeVariant =
  | "dot-stroke"
  | "icon-stroke"
  | "dot-light"
  | "icon-light"

export type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  status?: Status
  size?: BadgeSize
  variant?: StatusBadgeVariant
  pulse?: boolean
  icon?: React.ReactNode
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      className,
      status = "neutral",
      size = "sm",
      variant = "dot-stroke",
      pulse = false,
      icon,
      children,
      ...props
    },
    ref,
  ) => {
    const isDot = variant === "dot-stroke" || variant === "dot-light"
    const isStroke = variant === "dot-stroke" || variant === "icon-stroke"
    const Icon = statusIcon[status]

    return (
      <span
        ref={ref}
        data-slot="status-badge"
        data-status={status}
        data-variant={variant}
        className={cn(
          "inline-flex items-center font-medium rounded-sm py-1 pl-1 pr-2",
          size === "sm" ? "text-xs leading-4" : "text-sm leading-5",
          isDot ? "gap-0.5" : "gap-1",
          isStroke
            ? "bg-bg-white-0 outline outline-1 -outline-offset-1 outline-stroke-soft-200 text-text-sub-600"
            : cn(sbChipLightBg[status], sbLabelColored[status]),
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          className="relative inline-flex size-4 items-center justify-center shrink-0"
        >
          {isDot ? (
            <>
              <span
                className={cn(
                  "rounded-full size-1.5",
                  sbDotColor[status],
                )}
              />
              {pulse ? (
                <span
                  className={cn(
                    "absolute rounded-full animate-ping opacity-60 size-1.5",
                    sbDotColor[status],
                  )}
                />
              ) : null}
            </>
          ) : (
            <span
              className={cn(
                "inline-flex [&_svg]:size-3",
                isStroke ? sbLabelColored[status] : "",
              )}
            >
              {icon ?? <Icon strokeWidth={2} />}
            </span>
          )}
        </span>
        {children}
      </span>
    )
  },
)
StatusBadge.displayName = "StatusBadge"

export { Badge, NumberBadge, StatusBadge, STATUSES }
export type { Status as BadgeStatus, Appearance as BadgeAppearance, BadgeType, BadgeSize }
