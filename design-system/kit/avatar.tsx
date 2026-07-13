"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/* -------------------------------------------------------------------------- */
/* Avatar root + image + fallback                                              */
/* -------------------------------------------------------------------------- */

// Figma Avatar [1.1] node 210:4129 — 9 sizes 20/24/32/40/48/56/64/72/80.
// Fallback text sizes (Plus Jakarta Sans 500):
//   20,24 → 12/16 · 32 → 14/20 · 40 → 16/24 · 48,56 → 18/24 · 64,72,80 → 24/32.
const avatarVariants = cva(
  "relative inline-flex shrink-0 overflow-hidden bg-muted text-muted-foreground",
  {
    variants: {
      size: {
        xs: "size-5 text-[12px] leading-4",
        sm: "size-6 text-[12px] leading-4",
        md: "size-8 text-sm leading-5",
        lg: "size-10 text-base leading-6",
        xl: "size-12 text-lg leading-6",
        "2xl": "size-14 text-lg leading-6",
        "3xl": "size-16 text-2xl leading-8",
        "4xl": "size-[72px] text-2xl leading-8",
        "5xl": "size-20 text-2xl leading-8",
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-md",
      },
      ring: {
        none: "",
        background: "ring-2 ring-background",
        card: "ring-2 ring-card",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
      ring: "none",
    },
  },
)

export type AvatarProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, shape, ring, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      className={cn(avatarVariants({ size, shape, ring }), className)}
      {...props}
    />
  ),
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    className={cn("aspect-square size-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn("flex size-full items-center justify-center font-medium", className)}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

/* -------------------------------------------------------------------------- */
/* Status indicator (top-right or bottom-right corner dot)                     */
/* -------------------------------------------------------------------------- */

/**
 * AvatarIndicator — Figma 245:18721 (status dots) + 245:18697 (badge icons).
 *
 *   Status tones (dot only, no children):
 *     online   — state-success-base (green)
 *     away     — state-away-base    (yellow)
 *     busy     — state-error-base   (red)
 *     offline  — state-faded-base   (gray)
 *
 *   Badge tones (icon-bearing, pass a 10-12px child glyph):
 *     verified — state-verified-base (sky blue ✓)
 *     feature  — state-feature-base  (purple ★)
 *     favorite — state-success-base  (green ★)
 *     add      — bg-bg-soft-200 + text-sub-600 (gray +)
 *     cancel   — state-error-base    (red ×)
 *
 *   Brand badge — pass any custom className (e.g. brand-mark color).
 */
const indicatorVariants = cva(
  "absolute inline-flex items-center justify-center ring-2 ring-card text-static-white",
  {
    variants: {
      position: {
        "top-right":    "right-0 top-0",
        "bottom-right": "right-0 bottom-0",
        "top-left":     "left-0 top-0",
        "bottom-left":  "left-0 bottom-0",
      },
      tone: {
        online:   "bg-(--state-success-base)",
        away:     "bg-(--state-away-base)",
        busy:     "bg-(--state-error-base)",
        offline:  "bg-(--state-faded-base)",
        verified: "bg-(--state-verified-base)",
        feature:  "bg-(--state-feature-base)",
        favorite: "bg-(--state-success-base)",
        add:      "bg-bg-soft-200 text-text-sub-600",
        cancel:   "bg-(--state-error-base)",
        custom:   "",
      },
      size: {
        xs:   "size-1.5",
        sm:   "size-2",
        md:   "size-2.5",
        lg:   "size-3",
        xl:   "size-3.5",
        "2xl":"size-3.5",
        "3xl":"size-4",
        "4xl":"size-[18px]",
        "5xl":"size-5",
      },
      shape: {
        dot:   "rounded-full",
        badge: "rounded-full [&_svg]:size-[60%]",
      },
    },
    defaultVariants: {
      position: "bottom-right",
      tone: "online",
      size: "md",
      shape: "dot",
    },
  },
)

export type AvatarIndicatorProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof indicatorVariants>

const AvatarIndicator = React.forwardRef<HTMLSpanElement, AvatarIndicatorProps>(
  ({ className, position, tone, size, shape, children, ...props }, ref) => {
    // If children present, auto-upgrade dot → badge so the icon has padding to render.
    const resolvedShape = shape ?? (children ? "badge" : "dot")
    // Badge needs to be larger than dot to fit a glyph — bump size by one step.
    const badgeSizeBump: Record<NonNullable<AvatarIndicatorProps["size"]>, NonNullable<AvatarIndicatorProps["size"]>> = {
      xs: "sm", sm: "md", md: "lg", lg: "xl", xl: "2xl", "2xl": "3xl", "3xl": "4xl", "4xl": "5xl", "5xl": "5xl",
    }
    const resolvedSize =
      resolvedShape === "badge" && size ? badgeSizeBump[size] : size
    return (
      <span
        ref={ref}
        data-slot="avatar-indicator"
        className={cn(indicatorVariants({ position, tone, size: resolvedSize, shape: resolvedShape }), className)}
        {...props}
      >
        {children}
      </span>
    )
  },
)
AvatarIndicator.displayName = "AvatarIndicator"

/* -------------------------------------------------------------------------- */
/* Avatar group — stacked or compact                                           */
/* -------------------------------------------------------------------------- */

type AvatarGroupContextValue = {
  size: NonNullable<AvatarProps["size"]>
  shape: NonNullable<AvatarProps["shape"]>
  spacing: "tight" | "default" | "loose"
}

const AvatarGroupContext = React.createContext<AvatarGroupContextValue | null>(null)

function useAvatarGroup() {
  return React.useContext(AvatarGroupContext)
}

const spacingClass: Record<AvatarGroupContextValue["spacing"], string> = {
  tight: "[&>[data-slot=avatar]]:-ml-3 [&>[data-slot=avatar]:first-child]:ml-0",
  default: "[&>[data-slot=avatar]]:-ml-2 [&>[data-slot=avatar]:first-child]:ml-0",
  loose: "[&>[data-slot=avatar]]:-ml-1 [&>[data-slot=avatar]:first-child]:ml-0",
}

export type AvatarGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: AvatarProps["size"]
  shape?: AvatarProps["shape"]
  spacing?: "tight" | "default" | "loose"
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, size = "md", shape = "circle", spacing = "default", children, ...props }, ref) => (
    <AvatarGroupContext.Provider value={{ size: size!, shape: shape!, spacing }}>
      <div
        ref={ref}
        data-slot="avatar-group"
        className={cn("flex items-center", spacingClass[spacing], className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child
          // Only inject size/shape/ring on Avatar children to avoid overriding count badge
          if (child.type === Avatar || (child as React.ReactElement<AvatarProps>).props?.["data-slot" as keyof AvatarProps] === "avatar") {
            return React.cloneElement(child as React.ReactElement<AvatarProps>, {
              size,
              shape,
              ring: "card",
            })
          }
          return child
        })}
      </div>
    </AvatarGroupContext.Provider>
  ),
)
AvatarGroup.displayName = "AvatarGroup"

const AvatarGroupCount = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: number; size?: AvatarProps["size"]; shape?: AvatarProps["shape"] }
>(({ className, value, size: sizeProp, shape: shapeProp, ...props }, ref) => {
  const ctx = useAvatarGroup()
  const size = sizeProp ?? ctx?.size ?? "md"
  const shape = shapeProp ?? ctx?.shape ?? "circle"
  return (
    <div
      ref={ref}
      data-slot="avatar-group-count"
      className={cn(
        avatarVariants({ size, shape, ring: "card" }),
        "items-center justify-center font-medium text-foreground bg-muted",
        className,
      )}
      {...props}
    >
      +{value}
    </div>
  )
})
AvatarGroupCount.displayName = "AvatarGroupCount"

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarIndicator,
  AvatarGroup,
  AvatarGroupCount,
  avatarVariants,
}
