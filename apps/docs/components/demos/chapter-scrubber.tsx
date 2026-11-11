"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  ChapterScrubber,
  type Chapter,
} from "@workspace/ui/components/chapter-scrubber"

const TALK: Chapter[] = [
  {
    id: "intro",
    meta: "00:00",
    title: "Why a design system",
    description:
      "The problem: four products, four button styles, no shared names.",
  },
  {
    id: "audit",
    meta: "02:14",
    title: "The audit",
    description: "Every color in production, clustered and counted.",
  },
  {
    id: "tokens",
    meta: "05:40",
    title: "Primitive tokens",
    description: "Ramps first, named for what they are, not what they do.",
  },
  {
    id: "roles",
    meta: "08:02",
    title: "Semantic roles",
    description: "Primary, muted, destructive: names components can rely on.",
  },
  {
    id: "opacity",
    meta: "10:31",
    title: "No opacity modifiers",
    description: "Why every tint became a named role Figma can bind.",
  },
  {
    id: "contrast",
    meta: "12:48",
    title: "Measuring contrast",
    description: "Moving status tones to the 700 step to clear AA.",
  },
  {
    id: "figma",
    meta: "15:05",
    title: "One name on both sides",
    description: "Variables in Figma that match the CSS one to one.",
  },
  {
    id: "registry",
    meta: "17:36",
    title: "The registry",
    description:
      "Copying source into projects instead of depending on a package.",
  },
  {
    id: "docs",
    meta: "20:12",
    title: "Docs people read",
    description: "Usage rules and do's and don'ts beside every part.",
  },
  {
    id: "adoption",
    meta: "23:40",
    title: "Adoption",
    description: "What got teams to switch, and what did not.",
  },
  {
    id: "motion",
    meta: "26:05",
    title: "Motion",
    description: "Springs, reduced motion, and when to leave things still.",
  },
  {
    id: "special",
    meta: "28:50",
    title: "Special components",
    description: "Room for the playful components next to the base ones.",
  },
  {
    id: "next",
    meta: "31:22",
    title: "What is next",
    description: "Charts, forms, and a second theme.",
  },
  { id: "qa", meta: "33:10", title: "Questions" },
]

// The rail grows toward its preview, so it needs room around it to swell into.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-80 w-full items-center justify-center p-10">
      {children}
    </div>
  )
}

export function ChapterScrubberDemo() {
  return (
    <Stage>
      <ChapterScrubber chapters={TALK} defaultCurrentIndex={3} />
    </Stage>
  )
}

export function ChapterScrubberHorizontalDemo() {
  return (
    <Stage>
      <ChapterScrubber
        chapters={TALK}
        orientation="horizontal"
        preview="label"
        side="top"
        defaultCurrentIndex={3}
      />
    </Stage>
  )
}

export function ChapterScrubberDotsDemo() {
  return (
    <Stage>
      <ChapterScrubber chapters={TALK} variant="dot" defaultCurrentIndex={3} />
    </Stage>
  )
}

export function ChapterScrubberControlledDemo() {
  const [current, setCurrent] = React.useState(3)
  const chapter = TALK[current]!
  return (
    <Stage>
      <div className="flex items-center gap-10">
        <ChapterScrubber
          chapters={TALK}
          currentIndex={current}
          onCurrentIndexChange={setCurrent}
        />
        <div className="flex w-64 flex-col gap-3">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {chapter.meta} · {current + 1} of {TALK.length}
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {chapter.title}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              <ChevronUpIcon data-icon="inline-start" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={current === TALK.length - 1}
              onClick={() => setCurrent(current + 1)}
            >
              Next
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </Stage>
  )
}
