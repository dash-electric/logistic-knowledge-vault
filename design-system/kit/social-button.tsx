"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/**
 * SocialButton — Figma 1:1 parity (node 180:4264, paste verified 2026-05-17).
 *
 * Figma axes:
 *   Brand    : Apple | X (Twitter) | Google | Facebook | Linkedin | Github | Dropbox
 *   Style    : Filled | Stroke  — Filled = brand bg, Stroke = white bg + gray ring
 *   State    : Default | Hover | Focus
 *   Only Icon: Off | On  — icon-only square at 40×40
 *
 * Size: Figma ships a single size (40 height, r=10, pad 10/16/10/10, gap 8).
 *   sm/md/lg/xl retained as Dash extensions for shipped blocks.
 *
 * `microsoft` is a Dash extension (not in Figma); kept for legacy login blocks.
 */

const socialButtonVariants = cva(
  cn(
    "inline-flex items-center justify-center font-medium text-sm",
    "cursor-pointer transition-colors disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "border",
    "[&_svg]:shrink-0",
  ),
  {
    variants: {
      brand: {
        // Filled brand colors verified from Figma 2026-05-17:
        apple:     "bg-black text-static-white border-black hover:bg-black/90",
        twitter:   "bg-black text-static-white border-black hover:bg-black/90",       // X (Twitter) = black
        // Google official sign-in branding: white surface + 4-color G logo. Never red.
        google:    "bg-bg-white-0 text-text-strong-950 border-stroke-soft-200 hover:bg-bg-weak-50",
        facebook:  "bg-[#1977F3] text-static-white border-[#1977F3] hover:bg-[#1977F3]/90",
        linkedin:  "bg-[#0077B5] text-static-white border-[#0077B5] hover:bg-[#0077B5]/90",
        github:    "bg-[#24292F] text-static-white border-[#24292F] hover:bg-[#24292F]/90",
        dropbox:   "bg-[#3984FF] text-static-white border-[#3984FF] hover:bg-[#3984FF]/90",
        // Dash extension (not in Figma — for legacy ms365 blocks)
        microsoft: "bg-bg-white-0 text-text-strong-950 border-stroke-soft-200 hover:bg-bg-weak-50",
      },
      style: {
        filled: "",
        // Figma "Stroke" — white bg + gray-200 ring + dark text. Overrides brand classes for non-icon visuals.
        stroke:
          "!bg-bg-white-0 !text-text-strong-950 !border-stroke-soft-200 hover:!bg-bg-weak-50",
      },
      size: {
        // Figma canonical (Medium 40) — sm/lg/xl are Dash extensions
        sm: "h-9 px-3 rounded-lg gap-2 [&_svg]:size-4",
        md: "h-10 px-4 rounded-sm gap-2 [&_svg]:size-5",  // Figma default
        lg: "h-11 px-4 rounded-sm gap-2 [&_svg]:size-5",
        xl: "h-12 px-6 rounded-sm gap-2.5 [&_svg]:size-5",
      },
      block: {
        true: "w-full",
        false: "",
      },
      onlyIcon: {
        true: "!px-0 !w-10 aspect-square",
        false: "",
      },
    },
    compoundVariants: [
      // Larger square for onlyIcon at each size
      { onlyIcon: true, size: "sm", className: "!w-9" },
      { onlyIcon: true, size: "lg", className: "!w-11" },
      { onlyIcon: true, size: "xl", className: "!w-12" },
    ],
    defaultVariants: { size: "md", block: false, style: "filled", onlyIcon: false },
  },
)

const brandLabel = {
  google: "Continue with Google",
  apple: "Continue with Apple",
  github: "Continue with GitHub",
  facebook: "Continue with Facebook",
  twitter: "Continue with X",
  linkedin: "Continue with LinkedIn",
  dropbox: "Continue with Dropbox",
  microsoft: "Continue with Microsoft",
} as const

type Brand = keyof typeof brandLabel

const brandIcon: Record<Brand, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.44 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c.005.08.008.16.008.24 0 1.063-.39 2.106-1.05 2.86-.69.806-1.812 1.43-2.91 1.34-.014-.08-.02-.166-.02-.252 0-1.06.408-2.106 1.075-2.86.704-.806 1.847-1.42 2.897-1.328zM20.5 17.27c-.482 1.115-.71 1.62-1.33 2.61-.866 1.38-2.087 3.1-3.6 3.115-1.345.015-1.69-.875-3.516-.86-1.827.014-2.207.882-3.552.866-1.514-.014-2.67-1.58-3.536-2.96-2.428-3.86-2.684-8.39-1.184-10.8 1.066-1.715 2.747-2.72 4.327-2.72 1.61 0 2.624.88 3.95.88 1.293 0 2.08-.88 3.94-.88 1.41 0 2.91.77 3.98 2.1-3.5 1.91-2.93 6.92-.479 8.65z"/>
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.03c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.26 5.69.41.35.78 1.04.78 2.1v3.11c0 .31.2.67.8.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.014 1.792-4.679 4.533-4.679 1.313 0 2.686.236 2.686.236v2.965h-1.514c-1.491 0-1.956.93-1.956 1.886v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
    </svg>
  ),
  dropbox: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 2L0 6l6 4 6-4-6-4zm12 0l-6 4 6 4 6-4-6-4zM0 14l6 4 6-4-6-4-6 4zm18-4l-6 4 6 4 6-4-6-4zM6 19.5l6 4 6-4-6-4-6 4z"/>
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  ),
}

type SocialButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof socialButtonVariants> & {
    /** Override the auto-generated label. Ignored if onlyIcon. */
    label?: React.ReactNode
  }

const SocialButton = React.forwardRef<HTMLButtonElement, SocialButtonProps>(
  (
    { className, brand = "google", size, block, style: styleVariant, onlyIcon, label, type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      data-slot="social-button"
      data-brand={brand}
      data-style={styleVariant ?? "filled"}
      data-only-icon={onlyIcon || undefined}
      className={cn(socialButtonVariants({ brand, size, block, style: styleVariant, onlyIcon }), className)}
      {...props}
    >
      {brand ? brandIcon[brand] : null}
      {!onlyIcon ? <span>{label ?? brandLabel[brand ?? "google"]}</span> : null}
    </button>
  ),
)
SocialButton.displayName = "SocialButton"

export { SocialButton }
