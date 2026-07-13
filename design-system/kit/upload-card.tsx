"use client"

import * as React from "react"
import {
  RiCloseLine as X,
  RiDeleteBinLine as Trash,
  RiFileTextLine as FileIcon,
  RiCheckLine as Check,
  RiErrorWarningLine as Warn,
} from "@remixicon/react"
import { ProgressBar } from "./progress-bar"
import { IconButton } from "./icon-button"
import { cn } from "./lib/utils"

/**
 * UploadCard — Ported from Dash Next Portal v2.
 *
 * Per-file row in an upload list. Three states — uploading (progress + cancel),
 * completed (filename + delete), failed (red border + retry link). Distinct
 * from FileUpload (drop-zone): UploadCard is the row that appears once a file
 * is picked.
 */
export type UploadCardStatus = "uploading" | "completed" | "failed"

export type UploadCardProps = {
  fileName: string
  fileSizeKB: number
  totalSizeKB: number
  status: UploadCardStatus
  progress?: number
  onCancel?: () => void
  onDelete?: () => void
  onRetry?: () => void
  className?: string
}

const UploadCard = React.forwardRef<HTMLDivElement, UploadCardProps>(
  (
    {
      fileName,
      fileSizeKB,
      totalSizeKB,
      status,
      progress = 0,
      onCancel,
      onDelete,
      onRetry,
      className,
    },
    ref,
  ) => {
    const isUploading = status === "uploading"
    const isCompleted = status === "completed"
    const isFailed = status === "failed"

    return (
      <div
        ref={ref}
        data-slot="upload-card"
        data-status={status}
        className={cn(
          "flex flex-col gap-2 rounded-xl border p-4 shadow-sm",
          isFailed
            ? "border-(--state-error-base) bg-(--state-error-lighter)"
            : "border-stroke-soft-200 bg-bg-white-0",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50">
              <FileIcon className="size-5 text-text-sub-600" />
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium text-text-strong-950">
                {fileName}
              </p>
              <p className="text-xs text-text-sub-600">
                {fileSizeKB} KB of {totalSizeKB} KB{" "}
                {isUploading && <span className="animate-pulse">· Uploading...</span>}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 font-medium text-(--state-success-base)">
                    · <Check className="size-3" /> Completed
                  </span>
                )}
                {isFailed && (
                  <span className="inline-flex items-center gap-1 font-medium text-(--state-error-base)">
                    · <Warn className="size-3" /> Failed
                  </span>
                )}
              </p>
            </div>
          </div>

          {isUploading && onCancel && (
            <IconButton
              tone="neutral"
              style="ghost"
              size="sm"
              aria-label="Cancel upload"
              onClick={onCancel}
            >
              <X />
            </IconButton>
          )}
          {(isCompleted || isFailed) && onDelete && (
            <IconButton
              tone={isFailed ? "destructive" : "neutral"}
              style="ghost"
              size="sm"
              aria-label="Delete file"
              onClick={onDelete}
            >
              <Trash />
            </IconButton>
          )}
        </div>

        {isUploading && <ProgressBar value={progress} className="mt-1" />}
        {isFailed && onRetry && (
          <button
            onClick={onRetry}
            className="text-left text-sm text-(--state-error-base) underline transition hover:opacity-80"
          >
            Try again
          </button>
        )}
      </div>
    )
  },
)
UploadCard.displayName = "UploadCard"

export { UploadCard }
