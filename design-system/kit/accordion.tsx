"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { RiArrowDownSLine as ChevronDown, RiAddLine as Plus, RiSubtractLine as Minus } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Accordion — Figma node 210:4022 "Accordion [1.1]".
 *
 * Figma ships a card-style accordion: bg-white-0 + 1px stroke-soft-200 +
 * radius-10 + padding 14 + 14, with a leading icon + title (14px medium) +
 * optional description (14px regular text-sub-600) + trailing chevron 20×20.
 *
 * This Dash version supports BOTH:
 *   variant="default" (Figma 1:1 card-style — each item is a bordered card)
 *   variant="ghost"   (shadcn classic — items separated by border-b only)
 *
 * Variants:
 *   iconPosition: "right" | "left"  (Figma defaults right)
 *   iconVariant:  "chevron" | "plus-minus" (chevron = Figma "Flip Icon=Off")
 */

type AccordionVariant = "default" | "ghost"

const AccordionVariantContext = React.createContext<AccordionVariant>("default")

type AccordionRootProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
  variant?: AccordionVariant
}

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionRootProps
>(({ variant = "default", className, ...props }, ref) => (
  <AccordionVariantContext.Provider value={variant}>
    <AccordionPrimitive.Root
      ref={ref}
      data-slot="accordion"
      data-variant={variant}
      className={cn(variant === "default" && "flex flex-col gap-2", className)}
      {...(props as React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>)}
    />
  </AccordionVariantContext.Provider>
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(AccordionVariantContext)
  return (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn(
        variant === "default"
          ? // Figma 210:4021 — card-style: white bg, 1px stroke-soft-200, radius-10
            "bg-bg-white-0 border border-stroke-soft-200 rounded-sm"
          : "border-b border-stroke-soft-200 last:border-b-0",
        className,
      )}
      {...props}
    />
  )
})
AccordionItem.displayName = "AccordionItem"

type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
  /** Position of the open/close toggle icon. Figma default: right. */
  iconPosition?: "left" | "right"
  /** Toggle icon style. chevron = rotating ▼ (default). plus-minus = +/− swap. */
  iconVariant?: "chevron" | "plus-minus"
  /** Optional 20×20 leading icon (FAQ-style — user/lock/card glyph before the title). */
  leadingIcon?: React.ReactNode
  /** Optional trailing meta slot — sits between title and toggle icon. Use for status Badge, "Ready", "Draft" etc. */
  meta?: React.ReactNode
}

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(
  (
    { className, children, iconPosition = "right", iconVariant = "chevron", leadingIcon, meta, ...props },
    ref,
  ) => {
    const variant = React.useContext(AccordionVariantContext)
    // Figma trailing icon is 20×20 (size-5)
    const ChevronIcon = (
      <ChevronDown
        aria-hidden
        strokeWidth={1.75}
        className={cn(
          "size-5 shrink-0 text-icon-sub-600 transition-transform duration-(--duration-fast) ease-(--ease-out)",
          "group-data-[state=open]:rotate-180",
        )}
      />
    )
    const PlusMinusIcon = (
      <span
        aria-hidden
        className="relative inline-flex size-5 shrink-0 text-icon-sub-600 items-center justify-center"
      >
        <Plus
          strokeWidth={1.75}
          className="size-5 absolute transition-opacity duration-(--duration-fast) ease-(--ease-out) group-data-[state=open]:opacity-0"
        />
        <Minus
          strokeWidth={1.75}
          className="size-5 absolute opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-out) group-data-[state=open]:opacity-100"
        />
      </span>
    )
    const Icon = iconVariant === "plus-minus" ? PlusMinusIcon : ChevronIcon

    // Layout slots (LTR title baseline):
    //   [leadingIcon] [title flex-1] [meta] [toggleIcon]
    // When iconPosition="left" the toggle leads instead — still tucked left of leadingIcon.
    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          data-slot="accordion-trigger"
          className={cn(
            "group flex flex-1 items-center gap-2.5 text-left text-sm font-medium text-text-strong-950",
            variant === "default" ? "p-3.5" : "py-3.5 px-1",
            "transition-colors hover:text-text-strong-950/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-24) rounded-[inherit]",
            "[&[data-state=open]_[data-toggle-icon]]:text-icon-strong-950",
            className,
          )}
          {...props}
        >
          {iconPosition === "left" ? (
            <span data-toggle-icon className="contents">{Icon}</span>
          ) : null}
          {leadingIcon ? (
            <span aria-hidden className="shrink-0 inline-flex items-center justify-center text-icon-soft-400 [&_svg]:size-5">
              {leadingIcon}
            </span>
          ) : null}
          <span className="flex-1 min-w-0">{children}</span>
          {meta ? (
            <span className="shrink-0 inline-flex items-center">{meta}</span>
          ) : null}
          {iconPosition === "right" ? (
            <span data-toggle-icon className="contents">{Icon}</span>
          ) : null}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    )
  },
)
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const variant = React.useContext(AccordionVariantContext)
  return (
    <AccordionPrimitive.Content
      ref={ref}
      data-slot="accordion-content"
      className={cn(
        // Figma description = 14px regular, text-sub-600
        "overflow-hidden text-sm text-text-sub-600",
        "data-[state=closed]:animate-[accordion-up_var(--duration-fast)_var(--ease-out)]",
        "data-[state=open]:animate-[accordion-down_var(--duration-fast)_var(--ease-out)]",
      )}
      {...props}
    >
      <div
        className={cn(
          variant === "default" ? "px-3.5 pb-3.5 pt-0" : "pb-4 pt-0 pl-1 pr-8",
          "leading-relaxed",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
