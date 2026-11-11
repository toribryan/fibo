"use client"

import { JumpBar } from "@workspace/ui/components/jump-bar"

export function JumpBarHiddenCount() {
  return (
    <div className="relative h-16 w-64">
      <JumpBar
        type="new-below"
        count={3}
        strings={{ newBelow: () => "Scroll down" }}
      />
    </div>
  )
}
