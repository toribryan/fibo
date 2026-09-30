"use client"

import { useState } from "react"

import {
  ChapterScrubber,
  type Chapter,
} from "@workspace/ui/components/chapter-scrubber"

const talk: Chapter[] = [
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
    description: "Every colour in production, clustered and counted.",
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
    id: "motion",
    meta: "26:05",
    title: "Motion",
    description: "Springs, reduced motion, and when to leave things still.",
  },
  {
    id: "next",
    meta: "31:22",
    title: "What is next",
    description: "Charts, forms, and a second theme.",
  },
  { id: "qa", meta: "33:10", title: "Questions" },
]

export default function ChapterScrubberDemo() {
  const [current, setCurrent] = useState(3)
  const chapter = talk[current]!
  return (
    <div className="flex min-h-80 items-center justify-center gap-10 p-10">
      <ChapterScrubber
        chapters={talk}
        currentIndex={current}
        onCurrentIndexChange={setCurrent}
      />
      <div className="flex w-64 flex-col gap-2">
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {chapter.meta} · {current + 1} of {talk.length}
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {chapter.title}
        </span>
        {chapter.description && (
          <p className="text-sm text-muted-foreground">{chapter.description}</p>
        )}
      </div>
    </div>
  )
}
