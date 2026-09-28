import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { PixelSnailSprite } from "@workspace/ui/components/pixel-snail"

// The sprite's drawing area in its own coordinates: its origin, under the
// middle of the foot, sits 10 art pixels in from the left and 15 down.
const LEFT = -10
const TOP = -15
const COLS = 23
const ROWS = 17
const GROUND = 1

const MODES = ["rest", "dance", "crawl"] as const
type Mode = (typeof MODES)[number]

/**
 * fibo drawn live over his art grid, one cell per art pixel, so every pose
 * in a loop can be seen landing on whole pixels. Replaying the build-up
 * shows the coarse blocks snapping to the same grid.
 */
function PixelGrid() {
  const [mode, setMode] = useState<Mode>("rest")
  const [build, setBuild] = useState(0)

  return (
    <figure className="my-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <svg
        viewBox={`${LEFT - 0.5} ${TOP - 0.5} ${COLS + 1} ${ROWS + 1}`}
        className="mx-auto w-full max-w-md text-foreground"
        role="img"
        aria-label={`fibo on a ${COLS} by ${ROWS} pixel grid, playing his ${mode} loop.`}
      >
        <rect
          x={LEFT}
          y={GROUND}
          width={COLS}
          height={1}
          className="fill-muted"
        />
        <PixelSnailSprite
          key={build}
          mode={mode}
          assembleDelay={build > 0 ? 200 : undefined}
        />
        <g className="stroke-border" strokeWidth={1} fill="none">
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line
              key={`c${i}`}
              x1={LEFT + i}
              x2={LEFT + i}
              y1={TOP}
              y2={TOP + ROWS}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line
              key={`r${i}`}
              x1={LEFT}
              x2={LEFT + COLS}
              y1={TOP + i}
              y2={TOP + i}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <circle
          r={0.4}
          className="fill-background stroke-foreground"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {MODES.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={option === mode ? "default" : "outline"}
            aria-pressed={option === mode}
            onClick={() => setMode(option)}
          >
            {option[0]!.toUpperCase() + option.slice(1)}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setBuild((b) => b + 1)}
        >
          Replay build-up
        </Button>
      </div>
      <figcaption className="text-center text-sm text-muted-foreground">
        {COLS} × {ROWS} art pixels. The ring is his origin, under the middle of
        his foot, and the shaded row is the ground.
      </figcaption>
    </figure>
  )
}

export { PixelGrid }
