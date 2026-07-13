"use client"

import { Toaster as SonnerToaster, toast } from "sonner"
import { RiCheckboxCircleLine as CheckCircle2, RiErrorWarningLine as AlertCircle, RiAlertLine as AlertTriangle, RiInformationLine as Info, RiSparkling2Line as Sparkles } from "@remixicon/react"
/**
 * Dash Toaster — wraps Sonner with Dash design tokens.
 *
 * Visual = Figma "Alert & Notification & Toast" Small (36) Light/Stroke
 * variant (node 169:2399, paste verified 2026-05-17).
 *
 * Mount once at the app root (e.g., inside layout.tsx):
 *
 *   <Toaster />
 *
 * Then call from anywhere:
 *
 *   import { toast } from "./toaster"
 *   toast.success("Mitra suspended for the rest of the day")
 *   toast.error("Dispatch retry failed", { description: "..." })
 *
 * Status colors bind to --state-{kind}-base to match Alert + Banner.
 * `feature` toast = brand purple per Dash D3 (Figma source uses gray).
 */
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="top-right"
      richColors={false}
      closeButton
      duration={4200}
      icons={{
        success: <CheckCircle2 strokeWidth={1.75} className="size-[15px] text-(--state-success-base)" />,
        error: <AlertCircle strokeWidth={1.75} className="size-[15px] text-(--state-error-base)" />,
        warning: <AlertTriangle strokeWidth={1.75} className="size-[15px] text-(--state-warning-base)" />,
        info: <Info strokeWidth={1.75} className="size-[15px] text-(--state-information-base)" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          // Mirror Alert sm-stroke: white bg, soft border, radius 8 → use Dash radius-10 for elevated toast variant, shadow-tooltip
          toast:
            "group pointer-events-auto flex items-center gap-2 w-full bg-bg-white-0 text-text-strong-950 border border-stroke-soft-200 rounded-sm py-2 px-2.5 shadow-(--shadow-tooltip)",
          title: "text-sm leading-5 font-medium",
          description: "text-xs leading-4 text-text-sub-600",
          actionButton:
            "rounded-md text-sm font-medium px-2 py-1 bg-(--state-information-base) text-static-white",
          cancelButton:
            "rounded-md text-sm font-medium px-2 py-1 text-text-sub-600 hover:text-text-strong-950",
          closeButton:
            "left-auto right-2 top-1/2 -translate-y-1/2 size-5 rounded-sm text-text-strong-950 opacity-[0.72] hover:opacity-100 border-0 bg-transparent",
        },
      }}
      {...props}
    />
  )
}

const featureToast = (message: string, opts?: Parameters<typeof toast>[1]) =>
  toast(message, {
    icon: <Sparkles strokeWidth={1.75} className="size-[15px] text-(--state-feature-base)" />,
    ...opts,
  })

/**
 * toastFilled — solid-color filled toast variant (Figma 2902:10807 / 2902:10862).
 * Status-tone bg + static-white text + white icon + white close button.
 *
 *   toastFilled.success("Payment Received", { action: { label: "See Transaction", onClick } })
 *   toastFilled.error("Database Connection Failure", { description: "We're encountering issues...", action: ... })
 */
type FilledStatus = "success" | "error" | "warning" | "information"

const filledBgVar: Record<FilledStatus, string> = {
  success:     "bg-(--state-success-base)",
  error:       "bg-(--state-error-base)",
  warning:     "bg-(--state-warning-base)",
  information: "bg-(--state-information-base)",
}

const filledIconFor: Record<FilledStatus, React.ReactNode> = {
  success: <CheckCircle2 strokeWidth={1.75} className="size-[15px] text-static-white" />,
  error:   <AlertCircle  strokeWidth={1.75} className="size-[15px] text-static-white" />,
  warning: <AlertTriangle strokeWidth={1.75} className="size-[15px] text-static-white" />,
  information: <Info strokeWidth={1.75} className="size-[15px] text-static-white" />,
}

function callFilled(
  status: FilledStatus,
  message: React.ReactNode,
  opts?: Parameters<typeof toast>[1],
) {
  return toast(message, {
    ...opts,
    icon: filledIconFor[status],
    classNames: {
      toast: `${filledBgVar[status]} text-static-white border-transparent rounded-sm py-2 px-2.5 shadow-(--shadow-tooltip)`,
      title: "text-sm leading-5 font-medium text-static-white",
      description: "text-xs leading-4 text-static-white/80",
      actionButton: "bg-transparent text-static-white underline underline-offset-4 px-1",
      closeButton: "left-auto right-2 top-1/2 -translate-y-1/2 size-5 rounded-sm text-static-white opacity-[0.72] hover:opacity-100 border-0 bg-transparent",
      ...(opts?.classNames ?? {}),
    },
  })
}

const toastFilled = Object.assign((message: React.ReactNode, opts?: Parameters<typeof toast>[1]) => callFilled("information", message, opts), {
  success:     (m: React.ReactNode, opts?: Parameters<typeof toast>[1]) => callFilled("success", m, opts),
  error:       (m: React.ReactNode, opts?: Parameters<typeof toast>[1]) => callFilled("error", m, opts),
  warning:     (m: React.ReactNode, opts?: Parameters<typeof toast>[1]) => callFilled("warning", m, opts),
  information: (m: React.ReactNode, opts?: Parameters<typeof toast>[1]) => callFilled("information", m, opts),
})

export { toast, featureToast, toastFilled }
