"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type Pixel = [x: number, y: number]

/*
 * One step of the crawl, in shell-anchored columns. `shift` is how far the
 * shell has moved since the cycle began; a cycle moves the snail forward by
 * CYCLE_SHIFT columns. Head, shell and tail each move on a different frame,
 * so the body stretches and gathers like a real foot instead of sliding.
 */
type Frame = {
  tail: number
  head: number
  /** Stalk tips: back, upright or forward. */
  lean: -1 | 0 | 1
  shift: number
  /** Eyes shut. */
  blink?: boolean
  /** Nudges the whole snail sideways, for shuffling while it rests. */
  dx?: number
}

const FRAMES: Frame[] = [
  { tail: 0, head: 13, lean: 0, shift: 0 },
  { tail: 0, head: 14, lean: 1, shift: 0 },
  { tail: -1, head: 14, lean: 1, shift: 1 },
  { tail: -1, head: 13, lean: 0, shift: 2 },
]
const CYCLE_SHIFT = 2

const REST: Frame = FRAMES[0]!

/*
 * What a resting snail does: looks about, blinks, reaches, and shuffles a
 * pixel forward and back again, so it never ends where it began. The holds
 * are uneven on purpose; an even beat reads as a machine.
 */
const IDLE: [frame: Frame, ms: number][] = [
  [REST, 1800],
  [{ ...REST, lean: 1 }, 700],
  [REST, 900],
  [{ ...REST, blink: true }, 140],
  [REST, 1500],
  [{ ...REST, head: 14, lean: 1 }, 600],
  [{ ...REST, dx: 1 }, 1600],
  [{ ...REST, dx: 1, lean: -1 }, 900],
  [{ ...REST, dx: 1 }, 700],
  [{ ...REST, dx: 1, blink: true }, 140],
  [{ ...REST, dx: 1 }, 1200],
  [{ ...REST, tail: -1, head: 13, dx: 0 }, 500],
]

const SHELL = [
  "..#####..",
  ".#.....#.",
  "#..###..#",
  "#.#...#.#",
  "#.#.#.#.#",
  "#.#..#..#",
  "#..##...#",
  ".#.....#.",
  "..#####..",
]

// The drawing spans columns -1 to 17 and rows 0 to 12; the ground is row 12.
const MIN_X = -1
const COLS = 19
const ROWS = 13
const GROUND_ROW = 12
const GROUND_PITCH = 4

const SCALE = { sm: 2, default: 3, lg: 4 } as const
const FRAME_MS = { slow: 260, default: 180, fast: 110 } as const

function row(y: number, from: number, to: number): Pixel[] {
  return Array.from({ length: to - from + 1 }, (_, i) => [from + i, y])
}

function snailPixels({ tail, head, lean, blink, dx = 0 }: Frame): Pixel[] {
  const shell = SHELL.flatMap((line, y) =>
    [...line].flatMap((cell, x): Pixel[] => (cell === "#" ? [[x + 1, y]] : []))
  )
  // Two stalks splay into a V, and their tips nod forward as the head reaches.
  const stalk = (x: number, splay: -1 | 1): Pixel[] => [
    ...(blink ? [] : [[x + splay + lean, 1] satisfies Pixel]),
    [x + splay + lean, 2],
    [x, 3],
  ]
  const pixels: Pixel[] = [
    ...shell,
    ...stalk(head - 1, -1),
    ...stalk(head + 1, 1),
    ...row(4, head - 1, head + 1),
    ...row(5, head - 2, head + 1),
    ...row(6, head - 2, head + 1),
    ...row(7, head - 2, head),
    ...row(8, head - 3, head),
    ...row(9, tail + 1, head + 1),
    ...row(10, tail, head + 2),
  ]
  return dx ? pixels.map(([x, y]) => [x + dx, y]) : pixels
}

function groundPixels(distance: number): Pixel[] {
  const offset = distance % GROUND_PITCH
  return Array.from(
    { length: Math.ceil(COLS / GROUND_PITCH) + 1 },
    (_, i): Pixel => [MIN_X + i * GROUND_PITCH - offset, GROUND_ROW]
  ).filter(([x]) => x >= MIN_X)
}

function useReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia("(prefers-reduced-motion: reduce)")
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

function Pixels({ pixels }: { pixels: Pixel[] }) {
  return pixels.map(([x, y]) => (
    <rect key={`${x}:${y}`} x={x} y={y} width={1} height={1} />
  ))
}

type Pace = keyof typeof FRAME_MS

function useCrawl(pace: Pace, paused: boolean) {
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setStep((s) => s + 1), FRAME_MS[pace])
    return () => window.clearInterval(id)
  }, [pace, paused])
  return step
}

function useIdle(paused: boolean) {
  const [beat, setBeat] = React.useState(0)
  React.useEffect(() => {
    if (paused) return
    const id = window.setTimeout(
      () => setBeat((b) => (b + 1) % IDLE.length),
      IDLE[beat]![1]
    )
    return () => window.clearTimeout(id)
  }, [beat, paused])
  return IDLE[beat]![0]
}

type PixelSnailSpriteProps = Omit<React.ComponentProps<"g">, "children"> & {
  /** Size of one art pixel, in the parent SVG's user units. */
  pixel?: number
  /** How long each frame of the crawl holds. */
  pace?: Pace
  /**
   * Stops crawling and idles on the spot: it looks about, blinks and
   * shuffles, but goes nowhere.
   */
  resting?: boolean
}

/**
 * The snail as a bare SVG group for use inside another drawing, such as one
 * riding a path with `animateMotion`. Its origin is under the middle of the
 * foot, so it sits on the path rather than straddling it.
 */
function PixelSnailSprite({
  pixel = 1,
  pace = "default",
  resting = false,
  transform,
  ...props
}: PixelSnailSpriteProps) {
  const reduceMotion = useReducedMotion()
  const step = useCrawl(pace, resting || reduceMotion)
  const idle = useIdle(!resting || reduceMotion)
  const frame = resting ? idle : FRAMES[step % FRAMES.length]!
  const origin = `scale(${pixel}) translate(${-(MIN_X + COLS / 2)} -11)`
  return (
    <g
      data-slot="pixel-snail-sprite"
      fill="currentColor"
      shapeRendering="crispEdges"
      transform={transform ? `${transform} ${origin}` : origin}
      {...props}
    >
      <Pixels pixels={snailPixels(frame)} />
    </g>
  )
}

type PixelSnailProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Size of one art pixel: 2, 3 or 4 screen pixels. */
  size?: keyof typeof SCALE
  /** How long each frame of the crawl holds. */
  pace?: Pace
  /**
   * Crawl across the full width of the container and wrap around, instead
   * of crawling in place while the ground slides past.
   */
  travel?: boolean
  /** A dotted line under the snail that shows it moving. */
  ground?: boolean
  /** Announced to assistive technology while the snail is shown. */
  label?: string
}

/**
 * A one-colour pixel snail that crawls on a loop, for loading states. It
 * draws in `currentColor`, so a text colour class recolours it.
 */
function PixelSnail({
  size = "default",
  pace = "default",
  travel = false,
  ground = true,
  label = "Loading",
  className,
  ...props
}: PixelSnailProps) {
  const reduceMotion = useReducedMotion()
  const step = useCrawl(pace, reduceMotion)
  const [trackWidth, setTrackWidth] = React.useState(0)
  const trackRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const track = trackRef.current
    if (!travel || !track) return
    const observer = new ResizeObserver(([entry]) =>
      setTrackWidth(entry?.contentRect.width ?? 0)
    )
    observer.observe(track)
    return () => observer.disconnect()
  }, [travel])

  const frame = FRAMES[step % FRAMES.length]!
  const distance = Math.floor(step / FRAMES.length) * CYCLE_SHIFT + frame.shift
  const scale = SCALE[size]
  const width = COLS * scale
  const height = ROWS * scale

  const snail = (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`${MIN_X} 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      className="block shrink-0"
    >
      <Pixels pixels={snailPixels(frame)} />
      {ground && !travel ? <Pixels pixels={groundPixels(distance)} /> : null}
    </svg>
  )

  // The snail enters from past the left edge and leaves past the right one,
  // stepping a whole art pixel at a time so it never blurs between pixels.
  const lap = trackWidth + width
  const x =
    reduceMotion || lap <= width ? 0 : ((distance * scale) % lap) - width

  return (
    <div
      data-slot="pixel-snail"
      data-travel={travel || undefined}
      role="status"
      aria-label={label}
      className={cn(
        "text-foreground",
        travel ? "relative w-full overflow-hidden" : "inline-flex",
        className
      )}
      style={travel ? { height } : undefined}
      {...props}
    >
      {travel ? (
        <div ref={trackRef} className="absolute inset-0">
          {ground ? (
            <div
              data-slot="pixel-snail-ground"
              aria-hidden="true"
              className="absolute inset-x-0"
              style={{
                top: GROUND_ROW * scale,
                height: scale,
                backgroundImage: `linear-gradient(to right, currentColor ${scale}px, transparent ${scale}px)`,
                backgroundSize: `${GROUND_PITCH * scale}px ${scale}px`,
              }}
            />
          ) : null}
          <div
            className="absolute top-0 left-0"
            style={{ transform: `translateX(${x}px)` }}
          >
            {snail}
          </div>
        </div>
      ) : (
        snail
      )}
    </div>
  )
}

export { PixelSnail, PixelSnailSprite }
export type { PixelSnailProps, PixelSnailSpriteProps }
