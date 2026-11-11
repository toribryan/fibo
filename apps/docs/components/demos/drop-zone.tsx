"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { DropZone } from "@workspace/ui/components/drop-zone"

const MESSAGES = [
  { author: "Ada Lovelace", text: "Can you send the audit?" },
  { author: "Grace Hopper", text: "Dropping it in now." },
]

function Conversation() {
  return (
    <ol aria-label="Messages" className="flex flex-col gap-3 p-4">
      {MESSAGES.map((message) => (
        <li key={message.text} className="flex items-start gap-2.5 text-sm">
          <Avatar size="sm">
            <AvatarFallback>
              {message.author
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{message.author}</span>
            <span className="text-muted-foreground">{message.text}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

const zoneProps = {
  label: "Drop files to attach",
  description: "Images, PDFs and CSV files up to 25 MB",
  accept: "image/*,.pdf,.csv",
  className: "rounded-xl border border-border bg-background",
}

export function DropZoneDemo() {
  return (
    <div className="w-full max-w-md">
      <DropZone {...zoneProps} onDropFiles={() => {}}>
        <Conversation />
        <p className="px-4 pb-4 text-xs text-muted-foreground">
          Drag files from your desktop over this panel.
        </p>
      </DropZone>
    </div>
  )
}

export function DropZoneDraggingDemo() {
  return (
    <div className="w-full max-w-md">
      <DropZone
        {...zoneProps}
        // A real drag can't be held still, so this starts one to show the overlay.
        ref={(node) => {
          if (!node || node.dataset.dragging !== undefined) return
          const data = new DataTransfer()
          data.items.add(new File([""], "shot.png", { type: "image/png" }))
          node.dispatchEvent(
            new DragEvent("dragenter", { bubbles: true, dataTransfer: data })
          )
        }}
      >
        <Conversation />
      </DropZone>
    </div>
  )
}
