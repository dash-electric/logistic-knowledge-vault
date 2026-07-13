"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { RiUploadCloud2Line as CloudUpload, RiFileLine as FileIcon, RiFileTextLine as FileText, RiFileExcel2Line as FileSpreadsheet, RiFileImageLine as FileImage, RiFileCodeLine as FileCode, RiFileZipLine as FileArchive, RiCloseLine as X, RiCheckboxCircleLine as CheckCircle2, RiErrorWarningLine as AlertCircle, RiLoader4Line as Loader2, RiPencilLine as Pencil, RiDeleteBinLine as Trash2 } from "@remixicon/react"
import { cn } from "./lib/utils"

/**
 * File Upload — Figma 1:1 parity (node 450:9364).
 *
 * Upload Area: 400x202 default, r-12, 32px padding, 20px gap, border 1px
 * stroke-sub-300 (dashed). States: Default / Hover (bg-bg-weak-50 / border
 * remain) / In Progress / Success / Error.
 *
 * Upload Card: r-12, pad L14 R16 T16 B16, gap 16. File format icon 40x40
 * with format chip (PDF in red, CSV in green, etc.). Status row:
 *   In Progress → progress bar 6h r-full bg-stroke-soft-200 + blue fill
 *   Success     → check icon, "Completed" text-text-strong-950
 *   Error       → border state-error-base, error-tinted icon + retry link
 */

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function inferIconFromMime(name: string, mime?: string): React.ElementType {
  const lower = name.toLowerCase()
  const m = (mime ?? "").toLowerCase()
  if (m.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return FileImage
  if (m.includes("spreadsheet") || /\.(csv|xlsx?|numbers)$/.test(lower)) return FileSpreadsheet
  if (/\.(zip|tar|gz|rar|7z)$/.test(lower)) return FileArchive
  if (/\.(js|ts|tsx?|jsx?|json|html|css|py|go|rs|java|kt|swift)$/.test(lower)) return FileCode
  if (/\.(pdf|doc|docx|md|txt)$/.test(lower)) return FileText
  return FileIcon
}

/** Figma "File Format Icons" coloured chip palette. */
const formatChipColor: Record<string, string> = {
  pdf: "bg-(--state-error-base)",
  csv: "bg-(--state-success-base)",
  xls: "bg-(--state-success-base)",
  xlsx: "bg-(--state-success-base)",
  doc: "bg-(--state-information-base)",
  docx: "bg-(--state-information-base)",
  png: "bg-(--state-feature-base)",
  jpg: "bg-(--state-feature-base)",
  jpeg: "bg-(--state-feature-base)",
  zip: "bg-(--state-warning-base)",
  tar: "bg-(--state-warning-base)",
  json: "bg-(--state-verified-base)",
  default: "bg-bg-sub-300",
}

const formatIconColor: Record<string, string> = {
  pdf: "text-(--state-error-base)",
  csv: "text-(--state-success-base)",
  xls: "text-(--state-success-base)",
  xlsx: "text-(--state-success-base)",
  doc: "text-(--state-information-base)",
  docx: "text-(--state-information-base)",
  png: "text-(--state-feature-base)",
  jpg: "text-(--state-feature-base)",
  jpeg: "text-(--state-feature-base)",
  zip: "text-(--state-warning-base)",
  tar: "text-(--state-warning-base)",
  json: "text-(--state-verified-base)",
  default: "text-icon-sub-600",
}

function colorForName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "default"
  return formatIconColor[ext] ?? formatIconColor.default
}

function chipForName(name: string): { bg: string; label: string } {
  const ext = (name.split(".").pop()?.toLowerCase() ?? "default") as keyof typeof formatChipColor
  return {
    bg: formatChipColor[ext] ?? formatChipColor.default,
    label: ext === "default" ? "" : ext.toUpperCase(),
  }
}

/* -------------------------------------------------------------------------- */
/* Dropzone                                                                    */
/* -------------------------------------------------------------------------- */

const dropzoneVariants = cva(
  cn(
    "relative flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-bg-white-0 text-center",
    "transition-colors duration-(--duration-fast) ease-(--ease-out)",
    "focus-within:ring-4 focus-within:ring-(--primary-alpha-10)",
  ),
  {
    variants: {
      size: {
        sm: "p-6 min-h-32",
        md: "p-8 min-h-[200px]",
        lg: "p-10 min-h-60",
      },
      state: {
        idle: "border-stroke-sub-300 hover:bg-bg-weak-50",
        active: "border-(--primary-base) bg-(--primary-alpha-10)",
        error: "border-(--state-error-base) bg-(--state-error-lighter)",
        disabled: "border-stroke-sub-300 opacity-50 pointer-events-none",
      },
    },
    defaultVariants: { size: "md", state: "idle" },
  },
)

export type FileUploadDropzoneProps = React.HTMLAttributes<HTMLLabelElement> &
  VariantProps<typeof dropzoneVariants> & {
    accept?: string
    multiple?: boolean
    disabled?: boolean
    maxBytes?: number
    onFiles?: (files: File[]) => void
    title?: React.ReactNode
    description?: React.ReactNode
    browseLabel?: React.ReactNode
  }

const FileUploadDropzone = React.forwardRef<HTMLLabelElement, FileUploadDropzoneProps>(
  (
    {
      className,
      size,
      accept,
      multiple = true,
      disabled,
      maxBytes,
      onFiles,
      title = "Choose a file or drag & drop it here.",
      description = "JPEG, PNG, PDF, and MP4 formats, up to 50 MB.",
      browseLabel = "Browse file",
      ...props
    },
    ref,
  ) => {
    const [dragOver, setDragOver] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFiles = (incoming: FileList | null) => {
      if (!incoming || incoming.length === 0) return
      const files = Array.from(incoming)
      if (maxBytes) {
        const tooBig = files.find((f) => f.size > maxBytes)
        if (tooBig) {
          setError(`${tooBig.name} exceeds ${formatBytes(maxBytes)}`)
          return
        }
      }
      setError(null)
      onFiles?.(files)
    }

    const state = disabled ? "disabled" : error ? "error" : dragOver ? "active" : "idle"

    return (
      <label
        ref={ref}
        data-slot="file-upload-dropzone"
        data-state={state}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (disabled) return
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(dropzoneVariants({ size, state }), "cursor-pointer", className)}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <CloudUpload aria-hidden strokeWidth={1.5} className="size-6 text-icon-sub-600" />
        <div className="space-y-1.5">
          <div className="text-sm font-medium text-text-strong-950">{title}</div>
          {description ? (
            <div className="text-xs text-text-sub-600">{description}</div>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1 h-8 px-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-sm font-medium text-text-sub-600 hover:bg-bg-weak-50 transition-colors">
          {browseLabel}
        </span>
        {error ? (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-(--state-error-base)">
            <AlertCircle aria-hidden strokeWidth={1.75} className="size-3.5" />
            {error}
          </div>
        ) : null}
      </label>
    )
  },
)
FileUploadDropzone.displayName = "FileUploadDropzone"

/* -------------------------------------------------------------------------- */
/* File list + item                                                            */
/* -------------------------------------------------------------------------- */

export type FileUploadStatus = "uploading" | "complete" | "error"

export type FileUploadItemProps = React.HTMLAttributes<HTMLDivElement> & {
  name: string
  size?: number
  mime?: string
  progress?: number
  status?: FileUploadStatus
  errorMessage?: string
  onRetry?: () => void
  onRemove?: () => void
}

const FileUploadItem = React.forwardRef<HTMLDivElement, FileUploadItemProps>(
  (
    {
      className,
      name,
      size,
      mime,
      progress = 0,
      status = "uploading",
      errorMessage,
      onRetry,
      onRemove,
      ...props
    },
    ref,
  ) => {
    const Icon = inferIconFromMime(name, mime)
    const iconColor = colorForName(name)
    const chip = chipForName(name)
    return (
      <div
        ref={ref}
        data-slot="file-upload-item"
        data-status={status}
        className={cn(
          "relative flex flex-col gap-4 rounded-xl border bg-bg-white-0 pl-3.5 pr-4 py-4",
          status === "error"
            ? "border-(--state-error-base)"
            : "border-stroke-soft-200",
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="relative size-10 shrink-0 rounded-md border border-stroke-sub-300 bg-bg-white-0 flex items-end justify-center pb-1">
            <Icon aria-hidden strokeWidth={1.5} className={cn("absolute inset-0 m-auto size-5", iconColor)} />
            {chip.label ? (
              <span
                aria-hidden
                className={cn(
                  "relative z-10 inline-flex items-center justify-center h-4 px-1 rounded text-[11px] font-semibold leading-none text-static-white",
                  chip.bg,
                )}
              >
                {chip.label}
              </span>
            ) : null}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="text-sm font-medium text-text-strong-950 truncate">{name}</div>
            <div className="flex items-center gap-1 text-xs text-text-sub-600">
              {typeof size === "number" ? (
                <>
                  <span className="tabular-nums">
                    {status === "uploading"
                      ? `${formatBytes((progress / 100) * size)} of ${formatBytes(size)}`
                      : formatBytes(size)}
                  </span>
                  <span aria-hidden>∙</span>
                </>
              ) : null}
              {status === "uploading" ? (
                <span className="inline-flex items-center gap-1 text-text-strong-950">
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                  Uploading...
                </span>
              ) : status === "complete" ? (
                <span className="inline-flex items-center gap-1 text-text-strong-950">
                  <CheckCircle2 aria-hidden strokeWidth={1.75} className="size-3.5 text-(--state-success-base)" />
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-(--state-error-base)">
                  <AlertCircle aria-hidden strokeWidth={1.75} className="size-3.5" />
                  {errorMessage ?? "Upload failed"}
                </span>
              )}
            </div>
            {status === "error" && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-medium text-(--state-error-base) underline underline-offset-2 hover:no-underline"
              >
                Try again
              </button>
            ) : null}
          </div>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${name}`}
              className={cn(
                "shrink-0 size-6 inline-flex items-center justify-center rounded-md",
                status === "error" ? "text-(--state-error-base)" : "text-icon-sub-600",
                "hover:bg-bg-weak-50 hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)",
              )}
            >
              <X strokeWidth={1.75} className="size-5" />
            </button>
          ) : null}
        </div>
        {status === "uploading" ? (
          <div className="h-1.5 rounded-full bg-stroke-soft-200 overflow-hidden">
            <div
              className="h-full bg-(--state-information-base) transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        ) : null}
      </div>
    )
  },
)
FileUploadItem.displayName = "FileUploadItem"

const FileUploadList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="file-upload-list"
      className={cn("space-y-2", className)}
      {...props}
    />
  ),
)
FileUploadList.displayName = "FileUploadList"

/* -------------------------------------------------------------------------- */
/* Image upload                                                                */
/* -------------------------------------------------------------------------- */

export type ImageUploadProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  src?: string | null
  fallback?: React.ReactNode
  label?: React.ReactNode
  description?: React.ReactNode
  onChange?: (file: File) => void
  onRemove?: () => void
  shape?: "circle" | "rounded"
  size?: "sm" | "md" | "lg"
  accept?: string
}

const sizeClass: Record<NonNullable<ImageUploadProps["size"]>, string> = {
  sm: "size-12",
  md: "size-16",
  lg: "size-20",
}

const ImageUpload = React.forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      className,
      src,
      fallback,
      label,
      description,
      onChange,
      onRemove,
      shape = "circle",
      size = "md",
      accept = "image/png,image/jpeg,image/webp",
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    return (
      <div
        ref={ref}
        data-slot="image-upload"
        className={cn("flex items-center gap-4", className)}
        {...props}
      >
        <div
          className={cn(
            "relative overflow-hidden border border-stroke-soft-200 bg-bg-weak-50",
            sizeClass[size],
            shape === "circle" ? "rounded-full" : "rounded-lg",
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center text-icon-soft-400">
              {fallback ?? <FileImage strokeWidth={1.5} className="size-5" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {label ? <div className="text-sm font-medium text-text-strong-950">{label}</div> : null}
          {description ? (
            <div className="text-xs text-text-sub-600 leading-snug">{description}</div>
          ) : null}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onChange?.(f)
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 hover:bg-bg-weak-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-alpha-10)"
            >
              <Pencil strokeWidth={1.75} className="size-3.5" />
              Change
            </button>
            {src && onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-(--state-error-base) hover:bg-(--state-error-lighter) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--state-error-base)/20"
              >
                <Trash2 strokeWidth={1.75} className="size-3.5" />
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  },
)
ImageUpload.displayName = "ImageUpload"

export {
  FileUploadDropzone,
  FileUploadList,
  FileUploadItem,
  ImageUpload,
  dropzoneVariants,
}
