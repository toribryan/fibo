"use client"

import { useState } from "react"

import { Reactions, type Reaction } from "@workspace/ui/components/reactions"

const seeded: Reaction[] = [
  { emoji: "👍", label: "Thumbs up", count: 5 },
  { emoji: "❤️", label: "Heart", count: 3, active: true },
  { emoji: "😂", label: "Laughing", count: 1 },
]

export function ReactionsControlledDemo() {
  const [reactions, setReactions] = useState<Reaction[]>(seeded)
  const total = reactions.reduce((sum, item) => sum + (item.count ?? 0), 0)

  return (
    <div className="flex flex-col gap-4">
      <Reactions reactions={reactions} onReactionsChange={setReactions} />
      <p className="text-xs font-medium text-muted-foreground tabular-nums">
        {total} {total === 1 ? "reaction" : "reactions"} across{" "}
        {reactions.length} {reactions.length === 1 ? "kind" : "kinds"}
      </p>
    </div>
  )
}
