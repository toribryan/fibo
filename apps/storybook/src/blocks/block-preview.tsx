import { useState, type ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { ScaledStage } from "./scaled-stage.js"

const WIDTHS = [
  { label: "Phone", width: 390, height: 760 },
  { label: "Tablet", width: 820, height: 760 },
  { label: "Desktop", width: 1280, height: 800 },
] as const

/*
 * A block at a device's width, scaled to fit the docs column. The block
 * scrolls inside the stage, so its sticky header and nav behave as they
 * would on a page. Buttons rather than Tabs: each one resizes the same
 * preview, it doesn't swap a panel.
 */
function BlockPreview({
  label,
  children,
}: {
  /** Names the preview for assistive technology, such as "App shell". */
  label: string
  /** Renders the block, given the stage to portal its popups into. */
  children: (container: HTMLElement) => ReactNode
}) {
  const [current, setCurrent] = useState<(typeof WIDTHS)[number]>(WIDTHS[2])
  return (
    <div data-slot="block-preview" className="my-6">
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
      <ScaledStage
        key={current.label}
        width={current.width}
        height={current.height}
        label={`${label}, ${current.label.toLowerCase()} width`}
        className="rounded-xl"
      >
        {(container) => (
          <div className="h-full overflow-y-auto">{children(container)}</div>
        )}
      </ScaledStage>
    </div>
  )
}

export { BlockPreview }
