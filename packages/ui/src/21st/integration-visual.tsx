"use client"

import {
  BellIcon,
  CalendarIcon,
  CloudIcon,
  DatabaseIcon,
  GitBranchIcon,
  MessageSquareIcon,
} from "lucide-react"

import {
  IntegrationVisual,
  type IntegrationItem,
} from "@workspace/ui/components/integration-visual"
import { PixelSnail } from "@workspace/ui/components/pixel-snail"

const tools: IntegrationItem[] = [
  { title: "Database", icon: <DatabaseIcon /> },
  { title: "Repository", icon: <GitBranchIcon /> },
  { title: "Chat", icon: <MessageSquareIcon /> },
  { title: "Calendar", icon: <CalendarIcon /> },
  { title: "Storage", icon: <CloudIcon /> },
  { title: "Alerts", icon: <BellIcon /> },
]

function SyncThumbnail() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted px-4">
      <PixelSnail travel label="Syncing" />
      <span className="text-xs font-medium text-muted-foreground">
        Syncing 6 sources
      </span>
    </div>
  )
}

export default function IntegrationVisualDemo() {
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border">
      <IntegrationVisual
        layout="orbit"
        items={tools}
        preview={<SyncThumbnail />}
      />
    </div>
  )
}
