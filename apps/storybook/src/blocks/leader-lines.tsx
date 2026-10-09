import { useLayoutEffect, useState, type RefObject } from "react"

import { cn } from "@workspace/ui/lib/utils"

/*
 * Labels in a column either side of a figure, each joined to the part it
 * names by a line ending in a dot. The Colors page and the design anatomy
 * diagrams share it, so every labeled figure in the docs reads the same.
 *
 * List callouts on each side in the order their parts run top to bottom,
 * and no two lines cross.
 */
type Callout = {
  /** Names the callout and the part it points at. */
  token: string
  /** The column the label sits in. */
  side: "left" | "right"
  /** Where down its part the line lands, as a share of the part's height. */
  landing?: number
  /** Comes in under the part and rises into it, for a part inside another. */
  fromBelow?: boolean
}

// The least room between two callouts stacked on one side.
const CALLOUT_GAP = 2

type Line = { token: string; d: string; x: number; y: number }
type Annotations = { tops: Record<string, number>; lines: Line[] }

/*
 * Sets each callout level with the part it names, so its line runs
 * straight across. Where two parts sit closer than their callouts are
 * tall, the lower callout steps down and its line bends in just short of
 * the part. Measured whenever the figure resizes.
 */
function useAnnotations(
  frame: RefObject<HTMLDivElement | null>,
  columns: RefObject<Map<string, HTMLElement>>,
  callouts: RefObject<Map<string, HTMLElement>>,
  parts: RefObject<Map<string, HTMLElement>>,
  items: Callout[]
) {
  const [annotations, setAnnotations] = useState<Annotations | null>(null)
  useLayoutEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(() => {
      const box = node.getBoundingClientRect()
      const tops: Record<string, number> = {}
      const lines: Line[] = []
      for (const side of ["left", "right"] as const) {
        const column = columns.current.get(side)?.getBoundingClientRect()
        // The columns are hidden on narrow screens, and measure as zero.
        if (!column || column.width === 0) continue
        const left = side === "left"
        const x1 = (left ? column.right : column.left) - box.left
        const offset = column.top - box.top
        let floor = -Infinity
        for (const { token, landing, fromBelow } of items.filter(
          (c) => c.side === side
        )) {
          const to = parts.current.get(token)?.getBoundingClientRect()
          const height = callouts.current.get(token)?.offsetHeight ?? 0
          if (!to) continue
          const y = fromBelow
            ? to.bottom + 3 - box.top
            : to.top + to.height * (landing ?? 0.5) - box.top
          // A line from below needs its callout clear of the part's owner,
          // so it aims a row lower.
          const aim = fromBelow ? y + 16 : y
          const top = Math.max(aim - offset - height / 2, floor)
          floor = top + height + CALLOUT_GAP
          tops[token] = top
          const from = top + offset + height / 2
          if (fromBelow) {
            const x2 = to.left + to.width / 2 - box.left
            lines.push({ token, d: `M${x1} ${from}H${x2}V${y}`, x: x2, y })
            continue
          }
          // The dot lands just outside the part, clear of its text.
          const x2 = (left ? to.left - 6 : to.right + 6) - box.left
          const bend = left ? x2 - 16 : x2 + 16
          lines.push({
            token,
            d:
              Math.abs(from - y) < 1
                ? `M${x1} ${y}H${x2}`
                : `M${x1} ${from}H${bend}L${x2} ${y}`,
            x: x2,
            y,
          })
        }
      }
      setAnnotations({ tops, lines })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [frame, columns, callouts, parts, items])
  return annotations
}

/** The lines and dots, drawn over the figure on wide screens. */
function LeaderLines({
  lines,
  isActive,
  anyActive,
}: {
  lines: Line[]
  isActive: (token: string) => boolean
  anyActive: boolean
}) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden size-full overflow-visible md:block"
    >
      {lines.map(({ token, d, x, y }) => (
        <g
          key={token}
          className={cn(
            "transition-opacity duration-200",
            anyActive && !isActive(token) ? "opacity-25" : "opacity-100",
            isActive(token)
              ? "fill-foreground stroke-foreground"
              : "fill-muted-foreground stroke-border"
          )}
        >
          <path d={d} fill="none" strokeWidth={1} />
          <circle cx={x} cy={y} r={2.5} className="stroke-none" />
        </g>
      ))}
    </svg>
  )
}

export { LeaderLines, useAnnotations, type Callout }
