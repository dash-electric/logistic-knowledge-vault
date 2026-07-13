"use client"

import * as React from "react"
import {
  RiSunLine as Sun,
  RiMoonLine as Moon,
  RiEqualizer3Fill as System,
} from "@remixicon/react"
import {
  SegmentedControl,
  SegmentedItem,
} from "./segmented-control"

/**
 * ThemeSwitch — Ported from Dash Next Portal v2.
 *
 * Three-segment toggle for theme preference: light / dark / system. Wraps
 * SegmentedControl and binds to next-themes' `useTheme` hook (or any
 * equivalent controlled state). Square aspect ratio per segment — icon-only.
 */
export type ThemeSwitchValue = "light" | "dark" | "system"

export type ThemeSwitchProps = {
  value?: ThemeSwitchValue
  defaultValue?: ThemeSwitchValue
  onValueChange?: (value: string) => void
}

function ThemeSwitch({
  value,
  defaultValue = "system",
  onValueChange,
}: ThemeSwitchProps) {
  return (
    <SegmentedControl
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <SegmentedItem value="light" aria-label="Light theme" className="aspect-square">
        <Sun className="size-4" />
      </SegmentedItem>
      <SegmentedItem value="dark" aria-label="Dark theme" className="aspect-square">
        <Moon className="size-4" />
      </SegmentedItem>
      <SegmentedItem value="system" aria-label="Match system" className="aspect-square">
        <System className="size-4" />
      </SegmentedItem>
    </SegmentedControl>
  )
}

export { ThemeSwitch }
