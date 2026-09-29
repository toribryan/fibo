"use client"

import { PixelSnail } from "@workspace/ui/components/pixel-snail"

export default function PixelSnailDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <PixelSnail size="lg" travel label="Loading your projects" />
      <p className="text-sm text-muted-foreground">Fetching your projects</p>
    </div>
  )
}
