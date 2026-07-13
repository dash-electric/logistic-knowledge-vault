import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { RiArrowRightSLine as ChevronRight, RiMoreLine as MoreHorizontal } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Breadcrumb — Figma 1:1 parity (node 447:8760, paste verified 2026-05-17).
 *
 * Two component sets in Figma:
 *  - Breadcrumb Items (447:8767): 3 states (default/hover/active) × 3 layouts
 *    (icon-only / text-only / icon+text). Default text/icon = text-sub-600.
 *    Hover + active = text-strong-950 (active is just a styling-equivalent
 *    locked state).
 *  - Breadcrumbs Group (447:8832): 3 dividers (arrow/slash/dot) × 3 lengths.
 *    Group spacing = 6px between item and divider. Divider color = text-soft-400
 *    (#d1d1d1) for arrow vector, but Figma renders separators as 20×20 boxes
 *    with 6px gap.
 *
 * Sizing per Figma:
 *  - Item row height: 20px (h-5)
 *  - Item icon box: 20×20 (size-5) with 14×14 vector inside
 *  - Label: Plus Jakarta Sans 14px / 20px line-height / weight 500
 *  - Group gap: 6px (gap-1.5)
 *  - Separator chevron vector: 6×10 inside 20×20 box
 */

const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"nav">>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    />
  ),
)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="breadcrumb-list"
      className={cn(
        // Figma group: 6px gap, horizontal, items 20px tall, font-medium text-sm
        "flex flex-wrap items-center gap-1.5 text-sm font-medium text-text-sub-600",
        className,
      )}
      {...props}
    />
  ),
)
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="breadcrumb-item"
      // Figma item: h-5 with optional 20×20 icon + label; intra-item gap = 2px
      // (text immediately follows the icon box).
      className={cn("inline-flex h-5 items-center gap-0.5", className)}
      {...props}
    />
  ),
)
BreadcrumbItem.displayName = "BreadcrumbItem"

type BreadcrumbLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  asChild?: boolean
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"
    return (
      <Comp
        ref={ref as React.Ref<HTMLAnchorElement>}
        data-slot="breadcrumb-link"
        // Figma states: default text-sub-600 + icon-sub-600,
        // hover/active text-strong-950 + icon-strong-950
        className={cn(
          "inline-flex h-5 items-center gap-0.5 rounded-sm transition-colors",
          "text-text-sub-600 [&_svg]:text-icon-sub-600",
          "hover:text-text-strong-950 hover:[&_svg]:text-icon-strong-950",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base",
          className,
        )}
        {...props}
      />
    )
  },
)
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      data-slot="breadcrumb-page"
      // Figma "active" state = strong text/icon color, no underline
      className={cn(
        "inline-flex h-5 items-center gap-0.5 text-text-strong-950 [&_svg]:text-icon-strong-950",
        className,
      )}
      {...props}
    />
  ),
)
BreadcrumbPage.displayName = "BreadcrumbPage"

type SeparatorVariant = "chevron" | "slash" | "dot"

const BreadcrumbSeparator = ({
  children,
  className,
  variant = "chevron",
  ...props
}: React.ComponentProps<"li"> & { variant?: SeparatorVariant }) => (
  <li
    role="presentation"
    aria-hidden="true"
    data-slot="breadcrumb-separator"
    data-variant={variant}
    // Figma separator: 20×20 frame with text-disabled-300 icon
    className={cn("inline-flex size-5 items-center justify-center text-icon-disabled-300", className)}
    {...props}
  >
    {children ??
      (variant === "slash" ? (
        <span className="select-none">/</span>
      ) : variant === "dot" ? (
        <span className="size-1 rounded-full bg-current" />
      ) : (
        // Figma chevron vector 6×10 inside 20×20 (size-3 ≈ 12px is closer to 10px native)
        <ChevronRight strokeWidth={1.75} className="size-3" />
      ))}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="presentation"
      aria-hidden="true"
      data-slot="breadcrumb-ellipsis"
      // Figma 20×20 box with sub icon
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-sm text-icon-sub-600 hover:bg-bg-weak-50",
        className,
      )}
      {...props}
    >
      <MoreHorizontal strokeWidth={1.75} className="size-3.5" />
      <span className="sr-only">More</span>
    </span>
  ),
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
