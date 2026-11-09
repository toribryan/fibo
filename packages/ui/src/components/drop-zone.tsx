"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type DropZoneProps = React.ComponentProps<"div"> & {
  /** Called with the dropped files that pass `accept`. */
  onDropFiles?: (files: File[]) => void
  /** Called with the dropped files that fail `accept`, to say why they were left out. */
  onRejectFiles?: (files: File[]) => void
  /** File types it takes, as in a file input's accept attribute. */
  accept?: string
  /** Takes no files and shows nothing while true. */
  disabled?: boolean
  /** What happens on drop, shown over the area while files are dragged across it. */
  label?: React.ReactNode
  /** The limits, such as the types and size it takes. */
  description?: React.ReactNode
}

/*
 * Wraps the area people can drop files onto and shows an overlay while they
 * drag. It has no other state, and it never touches what it covers: the
 * files go to whoever passed onDropFiles.
 */
function DropZone({
  onDropFiles,
  onRejectFiles,
  accept,
  disabled,
  label = "Drop files to attach",
  description,
  className,
  children,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: DropZoneProps) {
  const [dragging, setDragging] = React.useState(false)
  // dragenter and dragleave fire for every child crossed, so count them.
  const depth = React.useRef(0)

  const hasFiles = (event: React.DragEvent) =>
    !disabled && event.dataTransfer.types.includes("Files")

  return (
    <div
      data-slot="drop-zone"
      data-dragging={dragging ? "" : undefined}
      className={cn("relative", className)}
      onDragEnter={(event) => {
        // A caller's handler runs first and can take the drag over by
        // calling preventDefault.
        onDragEnter?.(event)
        if (event.defaultPrevented || !hasFiles(event)) return
        event.preventDefault()
        depth.current++
        setDragging(true)
      }}
      onDragOver={(event) => {
        onDragOver?.(event)
        if (event.defaultPrevented || !hasFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event)
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      }}
      onDrop={(event) => {
        onDrop?.(event)
        // Reset first, so the overlay never sticks if the zone was disabled
        // mid-drag.
        depth.current = 0
        setDragging(false)
        if (event.defaultPrevented || !hasFiles(event)) return
        event.preventDefault()
        const files = Array.from(event.dataTransfer.files)
        const accepted = files.filter((file) => matchesAccept(file, accept))
        const rejected = files.filter((file) => !accepted.includes(file))
        if (accepted.length) onDropFiles?.(accepted)
        if (rejected.length) onRejectFiles?.(rejected)
      }}
      {...props}
    >
      {children}
      {dragging ? (
        <div
          aria-hidden
          data-slot="drop-zone-overlay"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-popover-overlay p-2"
        >
          <div className="flex size-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ring p-4 text-center">
            <UploadIcon className="size-6 text-muted-foreground" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">{label}</span>
              {description ? (
                <span className="text-muted-foreground">{description}</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Whether a file passes an accept string such as "image/*,.pdf". */
function matchesAccept(file: File, accept?: string) {
  if (!accept?.trim()) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (!rule) return false
    if (rule.startsWith(".")) return name.endsWith(rule)
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

export { DropZone, matchesAccept, type DropZoneProps }
