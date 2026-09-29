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
  motion,
  useReducedMotion as usePrefersReducedMotion,
} from "motion/react"

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

// A highlight sweeps across the caption so it reads as work in progress.
function Shimmer({ children }: { children: string }) {
  const reduceMotion = usePrefersReducedMotion()
  if (reduceMotion) {
    return <span className="text-xs text-muted-foreground">{children}</span>
  }
  return (
    <motion.span
      className="bg-clip-text text-xs text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-muted-foreground) 35%, var(--color-foreground) 50%, var(--color-muted-foreground) 65%)",
        backgroundSize: "250% 100%",
      }}
      initial={{ backgroundPosition: "100% 0" }}
      animate={{ backgroundPosition: "0% 0" }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  )
}

function SyncThumbnail() {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted px-4">
      <PixelSnail travel pace="fast" label="Syncing" />
      <Shimmer>Syncing 6 sources</Shimmer>
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
