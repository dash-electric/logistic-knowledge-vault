"use client"

import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { RiArrowDownSLine as ChevronDown } from "@remixicon/react"
import { cva } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * NavigationMenu — Figma 1:1 parity (Topbar Items node 3802:24588 inside
 * Navigation page 3789:4743, paste verified 2026-05-17).
 *
 * Figma topbar item (3802:24589/24605/24621) maps to one menu trigger.
 *  - Item: 36px tall, rounded-lg (8px), 20px icon + label + optional badge +
 *    chevron-down.
 *  - State map:
 *      Default → bg-white-0,  icon text-sub-600,    text-sub-600
 *      Hover   → bg-weak-50,  icon text-sub-600,    text-sub-600
 *      Active  → bg-weak-50,  icon primary-base,    text-strong-950
 *    (Active = current section / expanded menu.)
 *
 * Viewport / content surface follows Figma "Dropdown" treatment — white
 * card on stroke-soft border with custom-shadows-small.
 */

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    data-slot="navigation-menu"
    className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = "NavigationMenu"

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    // Figma topbar gap = 2px between items
    className={cn("group flex flex-1 list-none items-center justify-center gap-0.5", className)}
    {...props}
  />
))
NavigationMenuList.displayName = "NavigationMenuList"

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  cn(
    // Figma topbar item: 36px tall, rounded-lg, 14/20 font-medium
    "inline-flex h-9 w-max items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium",
    "transition-colors disabled:pointer-events-none disabled:opacity-50",
    // Default: white bg, text-sub-600
    "bg-bg-white-0 text-text-sub-600 [&_svg]:text-icon-sub-600",
    // Hover: bg-weak-50
    "hover:bg-bg-weak-50",
    // Focus
    "focus:bg-bg-weak-50 focus:outline-none",
    // Active / Open: bg-weak-50, text-strong-950, icon primary-base
    "data-[state=open]:bg-bg-weak-50 data-[active]:bg-bg-weak-50",
    "data-[state=open]:text-text-strong-950 data-[active]:text-text-strong-950",
    "data-[state=open]:[&_svg]:text-(--primary-base) data-[active]:[&_svg]:text-(--primary-base)",
  ),
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}
    <ChevronDown
      strokeWidth={1.75}
      // Figma chevron 10×6 fill text-soft-400; we size 14px and let parent
      // color win.
      className="size-3.5 text-icon-soft-400 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = "NavigationMenuTrigger"

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out",
      "data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out",
      "data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52",
      "data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52",
      "md:absolute md:w-auto",
      className,
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = "NavigationMenuContent"

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className="absolute left-0 top-full flex justify-center">
    <NavigationMenuPrimitive.Viewport
      ref={ref}
      // Figma dropdown surface: rounded-xl (16px), stroke-soft border, white
      // bg, custom-shadows-small.
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-2xl border border-stroke-soft-200 bg-bg-white-0 shadow-custom-shadows-small",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90",
        "md:w-[var(--radix-navigation-menu-viewport-width)]",
        className,
      )}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName = "NavigationMenuViewport"

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
      "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] size-2 rotate-45 rounded-tl-sm border-l border-t border-stroke-soft-200 bg-bg-white-0" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName = "NavigationMenuIndicator"

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
