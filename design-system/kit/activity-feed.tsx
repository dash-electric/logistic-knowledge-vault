"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { RiAttachmentLine as Paperclip, RiDownloadLine as Download, RiChat3Line as MessageSquareText, RiMoreLine as MoreHorizontal, RiCheckboxCircleLine as CheckCircle2, RiAlertLine as AlertTriangle, RiErrorWarningLine as AlertCircle, RiTimeLine as Clock } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * ActivityFeed — Figma 1:1 parity (node 166035:46833, paste verified 2026-05-17).
 *
 * Figma component name: "Activity Feed [1.1]". 5 type variants:
 *   Default · File · Comment · Avatar Group · Tasks
 *
 * Per-item shell:
 *   - layout HORIZONTAL, gap=16
 *   - Slots (left → right):
 *       Key icon (32x32, white circle, gray border, brand-purple icon)  — optional
 *       Avatar  (32x32, neutral fallback) — required
 *       Content (vertical, gap=8): Title row (name · action · target · ・ ts), Attachment (children)
 *       More button (3-dot compact, 20x20) — optional
 *
 * Title row typography (fs=14):
 *   - name   → fw 500, text-strong-950
 *   - action → fw 400, text-sub-600
 *   - target → fw 500, text-strong-950
 *   - "・"   → text #d1d1d1 (sub-300)
 *   - timestamp → fw 400, text-soft-400
 *
 * Sub-components for attachments:
 *   - ActivityFeedFile     → file chip with download button
 *   - ActivityFeedComment  → comment chip with Reply link
 *   - ActivityFeedTask     → 4 states: success, warning, pending, error
 *   - ActivityFeedFilter   → filter pill with Default + Active state (brand purple)
 */

/* -------------------------------------------------------------------------- */
/* Avatar primitive (32x32 per Figma)                                          */
/* -------------------------------------------------------------------------- */

const FeedAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex size-8 shrink-0 overflow-hidden rounded-full bg-bg-soft-200",
      className,
    )}
    {...props}
  />
))
FeedAvatar.displayName = "FeedAvatar"

const FeedAvatarImage = AvatarPrimitive.Image
const FeedAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex size-full items-center justify-center text-[10px] font-medium text-text-sub-600",
      className,
    )}
    {...props}
  />
))
FeedAvatarFallback.displayName = "FeedAvatarFallback"

/* -------------------------------------------------------------------------- */
/* Key icon (left of avatar — optional decorative chip)                        */
/* -------------------------------------------------------------------------- */

const ActivityFeedKeyIcon = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="activity-feed-key-icon"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
        "bg-bg-white-0 border border-stroke-soft-200 text-(--state-feature-base)",
        "[&_svg]:size-[15px]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
)
ActivityFeedKeyIcon.displayName = "ActivityFeedKeyIcon"

/* -------------------------------------------------------------------------- */
/* Root container                                                              */
/* -------------------------------------------------------------------------- */

const ActivityFeed = React.forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    data-slot="activity-feed"
    className={cn("flex flex-col gap-4", className)}
    {...props}
  />
))
ActivityFeed.displayName = "ActivityFeed"

/* -------------------------------------------------------------------------- */
/* Item                                                                        */
/* -------------------------------------------------------------------------- */

type ActivityFeedItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  user: { name: string; src?: string; initials?: string }
  /** Verb phrase between the name and target — e.g. "uploaded". */
  action: React.ReactNode
  /** Optional bold target after the action verb — e.g. "Q2 financial report". */
  target?: React.ReactNode
  timestamp: string
  /** Optional decorative key icon shown to the LEFT of the avatar. */
  keyIcon?: React.ReactNode
  /** Optional more-button (3-dot) shown to the far right. Set to true for default behavior. */
  more?: React.ReactNode | boolean
  onMoreClick?: () => void
}

const ActivityFeedItem = React.forwardRef<HTMLLIElement, ActivityFeedItemProps>(
  (
    { user, action, target, timestamp, keyIcon, more, onMoreClick, children, className, ...props },
    ref,
  ) => {
    const initials =
      user.initials ??
      user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    return (
      <li
        ref={ref}
        data-slot="activity-feed-item"
        className={cn("flex items-start gap-4", className)}
        {...props}
      >
        {keyIcon ? <span className="mt-px">{keyIcon}</span> : null}
        <FeedAvatar className="mt-px">
          {user.src ? <FeedAvatarImage src={user.src} alt={user.name} /> : null}
          <FeedAvatarFallback>{initials}</FeedAvatarFallback>
        </FeedAvatar>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-baseline gap-0.5 flex-wrap text-sm leading-5">
            <span className="inline-flex items-baseline gap-[2px]">
              <span className="font-medium text-text-strong-950">{user.name}</span>
              <span className="font-normal text-text-sub-600">{action}</span>
              {target ? (
                <span className="font-medium text-text-strong-950">{target}</span>
              ) : null}
            </span>
            <span aria-hidden className="text-(--dash-gray-300) font-medium select-none">
              ・
            </span>
            <span className="font-normal text-text-soft-400">{timestamp}</span>
          </div>
          {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
        </div>
        {more ? (
          <button
            type="button"
            onClick={onMoreClick}
            aria-label="More"
            data-slot="activity-feed-more"
            className={cn(
              "shrink-0 inline-flex size-5 items-center justify-center rounded-full",
              "text-icon-sub-600 hover:text-text-strong-950 hover:bg-bg-weak-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300)",
            )}
          >
            {typeof more === "boolean" ? <MoreHorizontal className="size-[18px]" strokeWidth={1.75} /> : more}
          </button>
        ) : null}
      </li>
    )
  },
)
ActivityFeedItem.displayName = "ActivityFeedItem"

/* -------------------------------------------------------------------------- */
/* File attachment chip — Figma "Activity Feed File Items"                     */
/* -------------------------------------------------------------------------- */

type ActivityFeedFileProps = React.HTMLAttributes<HTMLDivElement> & {
  name: string
  size?: string
  onDownload?: () => void
}

const ActivityFeedFile = React.forwardRef<HTMLDivElement, ActivityFeedFileProps>(
  ({ name, size, onDownload, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="activity-feed-file"
      className={cn(
        "inline-flex items-stretch rounded-lg border border-stroke-soft-200 bg-bg-white-0 overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1">
        <Paperclip aria-hidden strokeWidth={1.75} className="size-[15px] text-icon-soft-400" />
        <span className="text-sm leading-5 font-medium text-text-sub-600 truncate max-w-[180px]">{name}</span>
        {size ? <span className="text-sm leading-5 font-normal text-text-soft-400">({size})</span> : null}
      </div>
      {onDownload ? (
        <button
          type="button"
          onClick={onDownload}
          aria-label={`Download ${name}`}
          className={cn(
            "inline-flex items-center justify-center px-1 border-l border-stroke-soft-200",
            "text-icon-soft-400 hover:text-text-strong-950 hover:bg-bg-weak-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300)",
          )}
        >
          <Download strokeWidth={1.75} className="size-[14px]" />
        </button>
      ) : null}
    </div>
  ),
)
ActivityFeedFile.displayName = "ActivityFeedFile"

/* -------------------------------------------------------------------------- */
/* Comment chip — Figma "Activity Feed Comment Items"                          */
/* -------------------------------------------------------------------------- */

type ActivityFeedCommentProps = React.HTMLAttributes<HTMLDivElement> & {
  body: React.ReactNode
  onReply?: () => void
}

const ActivityFeedComment = React.forwardRef<HTMLDivElement, ActivityFeedCommentProps>(
  ({ body, onReply, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="activity-feed-comment"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-stroke-soft-200 bg-bg-white-0 pl-2 pr-3.5 py-2",
        className,
      )}
      {...props}
    >
      <MessageSquareText aria-hidden strokeWidth={1.75} className="size-[15px] shrink-0 text-icon-soft-400" />
      <span className="text-sm leading-5 font-medium text-text-sub-600">{body}</span>
      {onReply ? (
        <button
          type="button"
          onClick={onReply}
          className={cn(
            "ml-1 text-sm leading-5 font-medium text-primary hover:underline shrink-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300) rounded-sm",
          )}
        >
          Reply
        </button>
      ) : null}
    </div>
  ),
)
ActivityFeedComment.displayName = "ActivityFeedComment"

/* -------------------------------------------------------------------------- */
/* Task chip — Figma "Activity Feed Task Status Items"                         */
/* States: success (green) · warning (orange) · pending (yellow) · error (red) */
/* -------------------------------------------------------------------------- */

type TaskState =
  | "success"
  | "warning"
  | "pending"
  | "error"
  // Backward-compat aliases (Dash pre-parity API)
  | "completed"
  | "in-progress"
  | "blocked"
  | "cancelled"

const taskIcon: Record<TaskState, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  pending: Clock,
  error: AlertCircle,
  completed: CheckCircle2,
  "in-progress": Clock,
  blocked: AlertTriangle,
  cancelled: AlertCircle,
}

const taskColor: Record<TaskState, string> = {
  success: "text-(--state-success-base)",
  warning: "text-(--state-warning-base)",
  pending: "text-(--state-away-base)",
  error: "text-(--state-error-base)",
  completed: "text-(--state-success-base)",
  "in-progress": "text-(--state-information-base)",
  blocked: "text-(--state-warning-base)",
  cancelled: "text-(--state-faded-base)",
}

type ActivityFeedTaskProps = React.HTMLAttributes<HTMLDivElement> & {
  state: TaskState
  /** Free-form label. Either pass the full string ("12 tasks completed")
   *  OR pair with `count` for the Dash legacy API ("12 completed"). */
  label?: React.ReactNode
  /** Legacy: numeric prefix shown before the label. */
  count?: number
}

const ActivityFeedTask = React.forwardRef<HTMLDivElement, ActivityFeedTaskProps>(
  ({ state, label, count, className, ...props }, ref) => {
    const Icon = taskIcon[state]
    const resolvedLabel = label ?? state.replace("-", " ")
    return (
      <div
        ref={ref}
        data-slot="activity-feed-task"
        data-state={state}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-stroke-soft-200 bg-bg-white-0 pl-1.5 pr-2.5 py-1",
          className,
        )}
        {...props}
      >
        <Icon strokeWidth={1.75} className={cn("size-[15px]", taskColor[state])} />
        {count !== undefined ? (
          <span className="text-sm leading-5 font-medium text-text-strong-950">{count}</span>
        ) : null}
        <span className="text-sm leading-5 font-medium text-text-sub-600">{resolvedLabel}</span>
      </div>
    )
  },
)
ActivityFeedTask.displayName = "ActivityFeedTask"

/* -------------------------------------------------------------------------- */
/* Filter chip group (selectable) — Figma "Activity Feed Selected Filter"      */
/* -------------------------------------------------------------------------- */

type ActivityFeedFilterProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
}

const ActivityFeedFilter = React.forwardRef<HTMLButtonElement, ActivityFeedFilterProps>(
  ({ selected = false, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="activity-feed-filter"
      data-state={selected ? "on" : "off"}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm leading-5 font-medium",
        "transition-colors duration-(--duration-fast) ease-(--ease-out)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-purple-300)",
        // Default state: white bg, soft border, sub-600 text + icon
        // Active state: light primary tint bg (alpha-16) + primary text + icon (Figma 165967:3881)
        selected
          ? "border-transparent bg-(--primary-alpha-16) text-primary [&_svg]:text-primary"
          : "border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 [&_svg]:text-icon-soft-400 hover:text-text-strong-950 hover:bg-bg-weak-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)
ActivityFeedFilter.displayName = "ActivityFeedFilter"

export {
  ActivityFeed,
  ActivityFeedItem,
  ActivityFeedKeyIcon,
  ActivityFeedFile,
  ActivityFeedComment,
  ActivityFeedTask,
  ActivityFeedFilter,
  FeedAvatar,
  FeedAvatarImage,
  FeedAvatarFallback,
}
