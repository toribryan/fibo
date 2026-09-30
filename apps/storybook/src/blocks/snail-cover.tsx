import { useEffect, useState, useSyncExternalStore } from "react"

import { PixelSnailSprite } from "@workspace/ui/components/pixel-snail"

import { FIBO_LINES } from "./lines.js"

// The sprite's drawing area around its origin, under the middle of the foot.
const LEFT = -10
const TOP = -15
const COLS = 24
const ROWS = 17
const PIXEL = 6

const LINE = FIBO_LINES.hello
const TYPE_MS = 35
const LINGER_MS = 2800
const QUIET_MS = 1600

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/*
 * How much of his line is typed, and whether the bubble is up. The count
 * climbs and holds, then the bubble fades with the line still in it, over
 * and over. Under reduced motion the line simply stays up.
 */
function useGreeting(reduced: boolean) {
  const [typed, setTyped] = useState(0)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (reduced) return
    let timer = 0
    const type = (count: number) => {
      setShown(true)
      setTyped(count)
      timer =
        count < LINE.length
          ? window.setTimeout(() => type(count + 1), TYPE_MS)
          : window.setTimeout(quiet, LINGER_MS)
    }
    const quiet = () => {
      setShown(false)
      timer = window.setTimeout(() => type(0), QUIET_MS)
    }
    timer = window.setTimeout(() => type(0), QUIET_MS / 2)
    return () => window.clearTimeout(timer)
  }, [reduced])

  return reduced ? { typed: LINE.length, shown: true } : { typed, shown }
}

/**
 * The cover for the Pixel snail page: the snail dancing, saying hello on a
 * loop.
 */
function SnailCover() {
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
  const { typed, shown } = useGreeting(reduced)

  return (
    <figure
      role="img"
      aria-label={`The pixel snail dancing and saying "${LINE}"`}
      className="my-6 flex h-72 flex-col items-center justify-end gap-3 rounded-xl border border-border bg-card pb-12"
    >
      {/* The bubble keeps its place between greetings, and the untyped rest
      of the line holds its width, so nothing shifts as it types. */}
      <div
        aria-hidden="true"
        className="relative ml-24 w-max rounded-lg border border-border bg-popover px-2.5 py-1.5 font-mono text-xs leading-snug text-popover-foreground shadow-sm transition-opacity duration-200 data-[quiet]:opacity-0"
        data-quiet={!shown || undefined}
      >
        {LINE.slice(0, typed)}
        <span className="text-transparent">{LINE.slice(typed)}</span>
        <span className="absolute -bottom-[5px] left-4 size-2 rotate-45 border-r border-b border-border bg-popover" />
      </div>
      <svg
        aria-hidden="true"
        width={COLS * PIXEL}
        height={ROWS * PIXEL}
        viewBox={`${LEFT * PIXEL} ${TOP * PIXEL} ${COLS * PIXEL} ${ROWS * PIXEL}`}
        className="overflow-visible text-foreground"
      >
        <PixelSnailSprite pixel={PIXEL} mode="dance" />
      </svg>
    </figure>
  )
}

export { SnailCover }
