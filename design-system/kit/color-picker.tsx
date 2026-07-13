"use client"

import * as React from "react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { RiCheckLine as Check } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * Color picker family — Figma node 553:22078.
 *
 * Figma's canonical "Color Picker" is a brand-fixed swatch dot grid (10
 * colors × 4 states: Gray / Blue / Orange / Red / Green / Yellow / Purple /
 * Sky / Pink / Teal). Hit-area 24x24, dot 16x16, selected = inner 2px
 * white-0 ring inside the dot.
 *
 * The continuous HSV picker (`ColorPicker`) is a Dash extension on top of
 * react-colorful for product surfaces that need arbitrary hex.
 *
 * Exports:
 *   ColorDot         — single Figma swatch (24x24).
 *   ColorDotGroup    — 10-brand grid + onValueChange.
 *   ColorPickerPresets — generic preset row (kept).
 *   ColorPicker      — HSV square + hex input (Dash extension).
 *   ColorSwatch      — combobox-style trigger swatch (kept, restyled).
 */

/* -------------------------------------------------------------------------- */
/* ColorDot — Figma swatch                                                     */
/* -------------------------------------------------------------------------- */

export type ColorDotKey =
  | "gray"
  | "blue"
  | "orange"
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "sky"
  | "pink"
  | "teal"

const COLOR_DOT_VAR: Record<ColorDotKey, string> = {
  gray: "var(--dash-slate-500)",
  blue: "var(--dash-blue-500)",
  orange: "var(--dash-orange-500)",
  red: "var(--dash-red-500)",
  green: "var(--dash-green-500)",
  yellow: "var(--dash-yellow-500)",
  purple: "var(--dash-purple-500)",
  sky: "var(--dash-sky-500)",
  pink: "var(--dash-pink-500)",
  teal: "var(--dash-teal-500)",
}

export const COLOR_DOT_KEYS: ColorDotKey[] = [
  "gray",
  "blue",
  "orange",
  "red",
  "green",
  "yellow",
  "purple",
  "sky",
  "pink",
  "teal",
]

export type ColorDotProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color: ColorDotKey
  selected?: boolean
  /** Optional override hex (custom palette beyond the brand 10). */
  hex?: string
}

const ColorDot = React.forwardRef<HTMLButtonElement, ColorDotProps>(
  ({ className, color, selected, hex, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="color-dot"
      data-color={color}
      data-state={selected ? "selected" : "default"}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "relative inline-flex size-6 items-center justify-center rounded-full",
        "transition-transform duration-(--duration-fast) ease-(--ease-out)",
        "hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10) focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "block size-4 rounded-full",
          selected && "ring-2 ring-bg-white-0 ring-inset",
        )}
        style={{ background: hex ?? COLOR_DOT_VAR[color] }}
      />
    </button>
  ),
)
ColorDot.displayName = "ColorDot"

export type ColorDotGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: ColorDotKey
  onValueChange?: (color: ColorDotKey) => void
  colors?: ColorDotKey[]
}

const ColorDotGroup = React.forwardRef<HTMLDivElement, ColorDotGroupProps>(
  ({ className, value, onValueChange, colors = COLOR_DOT_KEYS, ...props }, ref) => (
    <div
      ref={ref}
      role="radiogroup"
      data-slot="color-dot-group"
      className={cn("inline-flex flex-wrap items-center gap-1", className)}
      {...props}
    >
      {colors.map((c) => (
        <ColorDot
          key={c}
          color={c}
          selected={value === c}
          aria-label={`Pilih ${c}`}
          role="radio"
          aria-checked={value === c}
          onClick={() => onValueChange?.(c)}
        />
      ))}
    </div>
  ),
)
ColorDotGroup.displayName = "ColorDotGroup"

/* -------------------------------------------------------------------------- */
/* ColorPicker — HSV square + hex (Dash extension)                            */
/* -------------------------------------------------------------------------- */

export type ColorPickerProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
  onValueChange: (color: string) => void
  presets?: string[]
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ className, value, onValueChange, presets, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="color-picker"
      className={cn(
        "inline-flex flex-col gap-3 p-3 rounded-xl border border-stroke-soft-200 bg-bg-white-0 shadow-custom-xs",
        className,
      )}
      {...props}
    >
      <HexColorPicker color={value} onChange={onValueChange} className="dash-color-picker" />
      <style>{`
        .dash-color-picker.react-colorful { width: 224px; height: 200px; gap: 10px; }
        .dash-color-picker .react-colorful__saturation { border-radius: 8px; border-bottom: 0; }
        .dash-color-picker .react-colorful__hue { height: 14px; border-radius: 9999px; }
        .dash-color-picker .react-colorful__pointer { width: 16px; height: 16px; border-width: 2px; }
      `}</style>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-7 rounded-md border border-stroke-soft-200 shrink-0"
          style={{ background: value }}
        />
        <span className="text-xs text-text-soft-400">#</span>
        <HexColorInput
          color={value}
          onChange={onValueChange}
          prefixed={false}
          className={cn(
            "flex-1 h-8 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-2 text-sm uppercase text-text-strong-950",
            "focus-visible:outline-none focus-visible:border-stroke-strong-950 focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
          )}
        />
      </div>
      {presets && presets.length > 0 ? (
        <ColorPickerPresets presets={presets} value={value} onValueChange={onValueChange} />
      ) : null}
    </div>
  ),
)
ColorPicker.displayName = "ColorPicker"

/* -------------------------------------------------------------------------- */
/* Preset row                                                                  */
/* -------------------------------------------------------------------------- */

export type ColorPickerPresetsProps = {
  presets: string[]
  value?: string
  onValueChange: (color: string) => void
  className?: string
}

const ColorPickerPresets = ({
  presets,
  value,
  onValueChange,
  className,
}: ColorPickerPresetsProps) => (
  <div
    data-slot="color-picker-presets"
    className={cn("flex flex-wrap gap-1.5 pt-2 border-t border-stroke-soft-200", className)}
  >
    {presets.map((preset) => {
      const isActive = value?.toLowerCase() === preset.toLowerCase()
      return (
        <button
          key={preset}
          type="button"
          onClick={() => onValueChange(preset)}
          aria-label={`Pick ${preset}`}
          aria-pressed={isActive}
          className={cn(
            "relative size-6 rounded-md border border-stroke-soft-200 transition-transform",
            "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10) focus-visible:ring-offset-2",
          )}
          style={{ background: preset }}
        >
          {isActive ? (
            <Check
              aria-hidden
              strokeWidth={3}
              className="absolute inset-0 m-auto size-3.5 text-static-white drop-shadow-[0_0_2px_rgba(0,0,0,0.7)]"
            />
          ) : null}
        </button>
      )
    })}
  </div>
)
ColorPickerPresets.displayName = "ColorPickerPresets"

/* -------------------------------------------------------------------------- */
/* Trigger swatch                                                              */
/* -------------------------------------------------------------------------- */

export type ColorSwatchProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
  size?: "sm" | "md" | "lg"
}

const swatchSize: Record<NonNullable<ColorSwatchProps["size"]>, string> = {
  sm: "h-8 rounded-lg px-2 text-xs gap-1.5",
  md: "h-9 rounded-lg px-2.5 text-sm gap-2",
  lg: "h-10 rounded-sm px-3 text-sm gap-2",
}

const ColorSwatch = React.forwardRef<HTMLButtonElement, ColorSwatchProps>(
  ({ className, value, size = "md", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="color-swatch"
      className={cn(
        "inline-flex items-center border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950",
        "transition-colors duration-(--duration-fast) ease-(--ease-out)",
        "hover:bg-bg-weak-50 hover:border-transparent",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--primary-alpha-10)",
        swatchSize[size],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "rounded-sm border border-stroke-soft-200 shrink-0",
          size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4",
        )}
        style={{ background: value }}
      />
      <span className="uppercase text-text-sub-600">{value}</span>
    </button>
  ),
)
ColorSwatch.displayName = "ColorSwatch"

export {
  ColorDot,
  ColorDotGroup,
  ColorPicker,
  ColorPickerPresets,
  ColorSwatch,
}
