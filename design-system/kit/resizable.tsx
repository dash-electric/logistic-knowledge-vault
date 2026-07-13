"use client"

import * as React from "react"
import { RiDraggable as GripVertical } from "@remixicon/react"
import { Group, Panel, Separator } from "react-resizable-panels"
import { cn } from "./lib/utils"

/**
 * Resizable — splitter for two or more panels with draggable handles.
 * Built on react-resizable-panels v4 (Group/Panel/Separator API).
 */

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof Group>) => (
  <Group
    data-slot="resizable-panel-group"
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
)

const ResizablePanel = Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) => (
  <Separator
    data-slot="resizable-handle"
    className={cn(
      "relative flex w-px items-center justify-center bg-stroke-soft-200 transition-colors",
      "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
      "hover:bg-(--primary-alpha-24)",
      className,
    )}
    {...props}
  >
    {withHandle ? (
      <span className="z-10 flex h-6 w-3 items-center justify-center rounded-sm border border-stroke-soft-200 bg-bg-white-0 shadow-custom-xs">
        <GripVertical className="size-3 text-icon-soft-400" strokeWidth={1.75} />
      </span>
    ) : null}
  </Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
