"use client"

import * as React from "react"
import { RiGlobalLine as Globe } from "@remixicon/react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select"

/**
 * LanguageSelect — Ported from Dash Next Portal v2.
 *
 * Globe-iconed locale picker. In real apps, the onLocaleChange handler
 * should rewrite the URL's locale segment and reload.
 */
export type LanguageOption = { value: string; label: string }

export type LanguageSelectProps = {
  value: string
  languages?: LanguageOption[]
  onLocaleChange: (locale: string) => void
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { value: "en", label: "English" },
  { value: "id", label: "Bahasa Indonesia" },
]

function LanguageSelect({
  value,
  languages = DEFAULT_LANGUAGES,
  onLocaleChange,
}: LanguageSelectProps) {
  return (
    <Select value={value} onValueChange={onLocaleChange}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-text-sub-600" />
          <SelectValue placeholder="Select language" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { LanguageSelect, DEFAULT_LANGUAGES }
