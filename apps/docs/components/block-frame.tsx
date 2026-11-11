"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { storybookStory } from "@/lib/links"

const WIDTHS = [
  { label: "Phone", width: 390, height: 760 },
  { label: "Tablet", width: 820, height: 760 },
  { label: "Desktop", width: 1280, height: 800 },
] as const

/*
 * A block's Storybook story at a device's real width, scaled down to fit the
 * docs column. Blocks import their own files with `.js`, which this site's
 * bundler can't resolve, and an iframe also gives the block a true viewport,
 * so its container queries and sticky parts behave as on a page.
 */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

export function BlockFrame({ id, label }: { id: string; label: string }) {
  // The story follows the page's theme; the server has none, so it starts light.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    () =>
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    () => "light" as const
  )
  const [current, setCurrent] = useState<(typeof WIDTHS)[number]>(WIDTHS[2])
  const [available, setAvailable] = useState<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = stage.current
    if (!node) return
    const observer = new ResizeObserver(() => setAvailable(node.clientWidth))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const scale = available ? Math.min(1, available / current.width) : 1

  return (
    <div className="not-prose my-6">
      <div
        role="group"
        aria-label="Preview width"
        className="inline-flex gap-1 rounded-lg border border-border p-1"
      >
        {WIDTHS.map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={option === current}
            onClick={() => setCurrent(option)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none",
              option === current && "bg-muted text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div
        ref={stage}
        className="mt-3 overflow-hidden rounded-xl border border-border bg-background"
        style={{ height: current.height * scale }}
      >
        <iframe
          key={current.label}
          src={storybookStory(id, theme)}
          title={`${label}, ${current.label.toLowerCase()} width`}
          loading="lazy"
          className="origin-top-left border-0"
          style={{
            width: current.width,
            height: current.height,
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  )
}
