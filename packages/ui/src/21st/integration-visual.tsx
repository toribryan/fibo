"use client"

import {
  CalendarIcon,
  DatabaseIcon,
  GitBranchIcon,
  MessageSquareIcon,
} from "lucide-react"

import {
  IntegrationVisual,
  type IntegrationItem,
} from "@workspace/ui/components/integration-visual"

const tools: IntegrationItem[] = [
  { title: "Database", icon: <DatabaseIcon /> },
  { title: "Repository", icon: <GitBranchIcon /> },
  { title: "Chat", icon: <MessageSquareIcon /> },
  { title: "Calendar", icon: <CalendarIcon /> },
]

function SyncPreview() {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-3">
      <span className="text-xs font-medium text-muted-foreground">
        Last sync
      </span>
      {tools.slice(0, 3).map((tool) => (
        <div
          key={tool.title}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="flex items-center gap-2 text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground">
            {tool.icon}
            {tool.title}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            2m ago
          </span>
        </div>
      ))}
    </div>
  )
}

export default function IntegrationVisualDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <IntegrationVisual items={tools} center="12" preview={<SyncPreview />} />
      <div className="flex flex-col gap-1.5 border-t border-border px-5 py-4">
        <span className="text-lg font-semibold tracking-tight text-card-foreground">
          Twelve sources, one feed
        </span>
        <span className="text-sm leading-6 text-muted-foreground">
          Hover the hub to see what synced last. Routes pulse while a source is
          active.
        </span>
      </div>
    </div>
  )
}
