"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "./lib/utils"

/**
 * NotificationFeed — Figma 1:1 parity (node 4308:731, paste verified 2026-05-17).
 *
 * Figma component name: "Notifications Items [1.1]".
 * 4 type variants: Basic, Button, File, Message · 2 states: Default + Hover.
 *
 * Per-item shell:
 *   - 524x{auto}, layout HORIZONTAL, pad=12, gap=15, radius=12, white bg
 *   - Hover bg = bg-weak-50 (subtle neutral hover, matches AlignUI convention)
 *
 * Slots (left-to-right):
 *   - Avatar 40x40 (NotificationAvatar)
 *   - Content (vertical):
 *       Title 14/500 strong-950
 *       Description row 12/400 sub-600 (timestamp ∙ author-icon · text)
 *       Action slot (button row / file chip / message chip)
 *
 * Dash extensions (NOT in Figma but kept for backward compat):
 *   - `unread` flag → adds purple dot + tinted bg (purple-50/40)
 *   - NotificationGroup label header
 *   - NotificationFeed root list container
 *
 * Note: Figma has NO divider between items. The previous `divide-y` was a
 * Dash addition; removed for parity. Use NotificationGroup label if you
 * need visual grouping.
 */

/* -------------------------------------------------------------------------- */
/* Root list                                                                   */
/* -------------------------------------------------------------------------- */

const NotificationFeed = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="notification-feed"
      className={cn("flex flex-col", className)}
      {...props}
    />
  ),
)
NotificationFeed.displayName = "NotificationFeed"

/* -------------------------------------------------------------------------- */
/* Avatar primitive (40x40 default, matches Figma)                             */
/* -------------------------------------------------------------------------- */

const NotificationAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex size-10 shrink-0 overflow-hidden rounded-full bg-bg-soft-200",
      className,
    )}
    {...props}
  />
))
NotificationAvatar.displayName = "NotificationAvatar"

const NotificationAvatarImage = AvatarPrimitive.Image
const NotificationAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex size-full items-center justify-center text-xs font-medium text-text-sub-600",
      className,
    )}
    {...props}
  />
))
NotificationAvatarFallback.displayName = "NotificationAvatarFallback"

/* -------------------------------------------------------------------------- */
/* Item                                                                        */
/* -------------------------------------------------------------------------- */

type NotificationItemProps = React.HTMLAttributes<HTMLDivElement> & {
  unread?: boolean
  /** Left avatar slot — pass a NotificationAvatar or arbitrary 40x40 node. */
  avatar?: React.ReactNode
  /** Legacy convenience: a lucide icon rendered inside a 40x40 rounded chip. */
  icon?: React.ReactNode
  title: React.ReactNode
  /** Timestamp shown in the description row. */
  timestamp?: React.ReactNode
  /** Optional small (16x16) author/app icon shown after the timestamp · separator. */
  authorIcon?: React.ReactNode
  /** Description text shown after the timestamp + optional author icon. */
  description?: React.ReactNode
  /** Action slot (buttons / file chip / message chip) — rendered below title row. */
  actions?: React.ReactNode
}

const NotificationItem = React.forwardRef<HTMLDivElement, NotificationItemProps>(
  (
    {
      className,
      unread,
      avatar,
      icon,
      title,
      timestamp,
      authorIcon,
      description,
      actions,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="notification-item"
      data-unread={unread ? "true" : undefined}
      className={cn(
        "relative flex gap-4 px-3 py-3 rounded-xl transition-colors",
        "hover:bg-bg-weak-50",
        unread && "bg-(--dash-purple-50)/40",
        className,
      )}
      {...props}
    >
      {unread ? (
        <span
          aria-hidden
          className="absolute left-1 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary"
        />
      ) : null}
      {avatar
        ? avatar
        : icon
          ? (
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-weak-50 text-icon-sub-600">
              {icon}
            </span>
          )
          : null}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-sm leading-5 font-medium text-text-strong-950 truncate">{title}</p>
        {(timestamp || description || authorIcon) ? (
          <div className="flex items-center gap-1 text-xs leading-4 text-text-sub-600 min-w-0">
            {timestamp ? <span className="shrink-0">{timestamp}</span> : null}
            {timestamp && (authorIcon || description) ? (
              <span aria-hidden className="text-text-soft-400 select-none">
                ∙
              </span>
            ) : null}
            {authorIcon ? (
              <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full">
                {authorIcon}
              </span>
            ) : null}
            {description ? <span className="truncate">{description}</span> : null}
          </div>
        ) : null}
        {actions ? <div className="flex gap-2.5 pt-1">{actions}</div> : null}
      </div>
    </div>
  ),
)
NotificationItem.displayName = "NotificationItem"

/* -------------------------------------------------------------------------- */
/* Group (Dash extension — visual section header)                              */
/* -------------------------------------------------------------------------- */

const NotificationGroup = ({
  className,
  label,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label: React.ReactNode }) => (
  <div data-slot="notification-group" className={cn("flex flex-col", className)} {...props}>
    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-soft-400 bg-bg-weak-50">
      {label}
    </div>
    {children}
  </div>
)

export {
  NotificationFeed,
  NotificationItem,
  NotificationGroup,
  NotificationAvatar,
  NotificationAvatarImage,
  NotificationAvatarFallback,
}
