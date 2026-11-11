"use client"

import { useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/progress"

// Starts at 0 and only moves after a click, so the server and the first
// browser render match.
export function ProgressLiveDemo() {
  const [value, setValue] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(
      () =>
        setValue((current) => {
          const next = Math.min(100, current + 7)
          if (next === 100) setRunning(false)
          return next
        }),
      300
    )
    return () => window.clearInterval(id)
  }, [running])

  return (
    <div className="flex w-80 flex-col gap-4">
      <Progress value={value}>
        <ProgressLabel>
          {value === 100 ? "Export ready" : "Exporting report"}
        </ProgressLabel>
        <ProgressValue />
      </Progress>
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => {
          setValue(0)
          setRunning(true)
        }}
      >
        {value === 0 ? "Start export" : "Export again"}
      </Button>
    </div>
  )
}
