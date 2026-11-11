"use client"

import type { ComponentProps } from "react"
import {
  BellIcon,
  CalendarIcon,
  CloudIcon,
  DatabaseIcon,
  FileTextIcon,
  GitBranchIcon,
  MailIcon,
  MessageSquareIcon,
  WebhookIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  IntegrationVisual,
  type IntegrationItem,
} from "@workspace/ui/components/integration-visual"

const tools: IntegrationItem[] = [
  { title: "Database", icon: <DatabaseIcon /> },
  { title: "Repository", icon: <GitBranchIcon /> },
  { title: "Chat", icon: <MessageSquareIcon /> },
  { title: "Calendar", icon: <CalendarIcon /> },
  { title: "Email", icon: <MailIcon /> },
  { title: "Storage", icon: <CloudIcon /> },
  { title: "Alerts", icon: <BellIcon /> },
  { title: "Docs", icon: <FileTextIcon /> },
]

const pipeline: IntegrationItem[] = [
  { title: "Webhook", icon: <WebhookIcon />, side: "in" },
  { title: "Database", icon: <DatabaseIcon />, side: "in" },
  { title: "Repository", icon: <GitBranchIcon />, side: "in" },
  { title: "Chat", icon: <MessageSquareIcon />, side: "out" },
  { title: "Email", icon: <MailIcon />, side: "out" },
]

// Stands in for Storybook's snail-sync.svg, which this site can't reach.
const SYNC_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#f5f5f5"/><path d="M24 132 H296" stroke="#a3a3a3" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/><ellipse cx="150" cy="120" rx="58" ry="12" fill="#404040"/><circle cx="160" cy="92" r="30" fill="#d4d4d4" stroke="#404040" stroke-width="6"/><path d="M160 92 m-14 0 a14 14 0 1 0 14 -14" fill="none" stroke="#404040" stroke-width="5" stroke-linecap="round"/><path d="M98 118 L88 82 M108 116 L104 80" stroke="#404040" stroke-width="5" stroke-linecap="round"/></svg>`
)}`

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
          <Badge variant="secondary">2m ago</Badge>
        </div>
      ))}
    </div>
  )
}

function Frame(props: ComponentProps<typeof IntegrationVisual>) {
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border">
      <IntegrationVisual {...props} />
    </div>
  )
}

export function IntegrationVisualDemo() {
  return <Frame items={tools.slice(0, 4)} preview={<SyncPreview />} />
}

export function IntegrationVisualMediaDemo() {
  return (
    <Frame
      items={tools.slice(0, 4)}
      preview={{
        src: SYNC_IMAGE,
        alt: "A snail inching along a sync track",
      }}
    />
  )
}

export function IntegrationVisualOrbitDemo() {
  return <Frame layout="orbit" items={tools.slice(0, 6)} />
}

export function IntegrationVisualSidesDemo() {
  return <Frame layout="sides" pulse="through" items={pipeline} />
}

export function IntegrationVisualIdleDemo() {
  return (
    <Frame
      items={tools
        .slice(0, 4)
        .map((tool, i) => (i % 2 ? { ...tool, status: "idle" } : tool))}
    />
  )
}

export function IntegrationVisualPlatesDemo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {(["dots", "grid", "none"] as const).map((background) => (
        <div key={background} className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <IntegrationVisual
              background={background}
              items={tools.slice(0, 4)}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {background}
          </span>
        </div>
      ))}
    </div>
  )
}

export function IntegrationVisualCardDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <IntegrationVisual
        center="12"
        items={tools.slice(0, 4)}
        preview={<SyncPreview />}
      />
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

export function IntegrationVisualRulesDo() {
  return (
    <div className="w-64 overflow-hidden rounded-lg border border-border">
      <IntegrationVisual
        items={[
          { title: "Database", icon: <DatabaseIcon /> },
          { title: "Repository", icon: <GitBranchIcon /> },
          { title: "Chat", icon: <MessageSquareIcon />, status: "idle" },
          { title: "Email", icon: <MailIcon />, status: "idle" },
        ]}
      />
    </div>
  )
}

export function IntegrationVisualRulesDont() {
  return (
    <div className="w-64 overflow-hidden rounded-lg border border-border">
      <IntegrationVisual
        layout="corners"
        items={[
          { title: "Database", icon: <DatabaseIcon /> },
          { title: "Repository", icon: <GitBranchIcon /> },
        ]}
      />
    </div>
  )
}
