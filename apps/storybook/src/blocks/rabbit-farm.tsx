import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type RefObject,
  useSyncExternalStore,
} from "react"
import { PauseIcon, PlayIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { PixelRabbitSprite } from "./pixel-rabbit.js"

type Pair = {
  id: number
  age: number
  /** The pair in the month above: itself, or the parent of a newborn. */
  from?: number
}

const LAST_MONTH = 6
const MONTH_MS = 1600
const HOLD_MS = 3500
// A row's lines draw first, then its rabbits build in, left to right.
const LINE_MS = 250
const STAGGER_MS = 300

// The classic diagram: a ruled row per month with its count on the right.
// Every pair is the same size. A brace joins a pair to the baby pair it just
// had; a single line follows a pair too young to breed.
const PAD = 16
const SLOT = 52
const GUTTER = 56
const ROW = 70
const RABBIT = 40
const WIDTH = PAD + 8 * SLOT + GUTTER
const HEIGHT = LAST_MONTH * ROW

// Fibonacci's rules: a pair needs a month to grow up, then has a new pair
// every month, and nobody dies. Each newborn sits right after its parent.
function buildMonths() {
  const months: Pair[][] = [[{ id: 0, age: 0 }]]
  let nextId = 1
  for (let m = 1; m < LAST_MONTH; m++) {
    const row: Pair[] = []
    for (const pair of months[m - 1]!) {
      row.push({ id: pair.id, age: pair.age + 1, from: pair.id })
      if (pair.age >= 1) row.push({ id: nextId++, age: 0, from: pair.id })
    }
    months.push(row)
  }
  return months
}

const MONTHS = buildMonths()

// Where each pair stands in its month's row, centered left of the counts.
const LAYOUT = MONTHS.map((row, m) => {
  const top = m * ROW
  let x = PAD + (WIDTH - PAD - GUTTER - row.length * SLOT) / 2
  const at = new Map<number, number>()
  for (const pair of row) {
    at.set(pair.id, x + SLOT / 2)
    x += SLOT
  }
  return { top, base: top + ROW - 8, brace: top + 10, at }
})

type Connector = { key: string; d: string }

// What joins month m to the month above: for each pair up there, a brace
// over it and its new baby pair, or a line to itself when it had none.
const CONNECTORS: Connector[][] = MONTHS.map((row, m) => {
  if (m === 0) return []
  const above = LAYOUT[m - 1]!
  const here = LAYOUT[m]!
  return MONTHS[m - 1]!.map((parent) => {
    const from = { x: above.at.get(parent.id)!, y: above.base + 3 }
    const children = row.filter((pair) => pair.from === parent.id)
    if (children.length === 1) {
      const x = here.at.get(parent.id)!
      return {
        key: `line-${parent.id}`,
        d: `M${from.x} ${from.y}L${x} ${here.base - RABBIT - 4}`,
      }
    }
    const left = here.at.get(children[0]!.id)! - 14
    const right = here.at.get(children[1]!.id)! + 14
    const mid = (left + right) / 2
    return {
      key: `brace-${parent.id}`,
      d: `M${from.x} ${from.y}L${mid} ${here.brace}M${left} ${here.brace + 6}V${here.brace}H${right}V${here.brace + 6}`,
    }
  })
})

const REDUCED = "(prefers-reduced-motion: reduce)"

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false
  )
}

function useInView(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(!!entry?.isIntersecting),
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return inView
}

/**
 * Fibonacci's rabbit puzzle drawn the classic way, a ruled row per month,
 * matching the lore page on toribryan.com. It starts the first time it
 * scrolls into view, adds a month at a time, holds on the last and starts
 * over. With reduced motion the whole diagram shows at once.
 */
function RabbitFarm() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reduced = useReducedMotion()
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [step, setStep] = useState(1)
  // Bumped on each loop, so every row mounts and builds up afresh.
  const [cycle, setCycle] = useState(0)

  if (inView && !started) setStarted(true)

  const month = reduced ? LAST_MONTH : step
  const rows = started || reduced ? MONTHS.slice(0, month) : []

  useEffect(() => {
    if (reduced || !started || !playing || !inView) return
    const id = window.setTimeout(
      () => {
        if (step < LAST_MONTH) return setStep(step + 1)
        setStep(1)
        setCycle(cycle + 1)
      },
      step === LAST_MONTH ? HOLD_MS : MONTH_MS
    )
    return () => window.clearTimeout(id)
  }, [reduced, started, playing, inView, step, cycle])

  return (
    <div
      ref={ref}
      className="relative my-8 overflow-hidden rounded-2xl border border-border bg-card px-2"
    >
      <p className="sr-only">
        An animation of Fibonacci&apos;s rabbit puzzle, one row per month. Over
        six months the pairs go {MONTHS.map((row) => row.length).join(", ")}.
      </p>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full text-foreground"
        aria-hidden
      >
        <style>
          {
            "@keyframes rabbit-farm-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }"
          }
        </style>
        {MONTHS.slice(1).map((_, m) => (
          <line
            key={m}
            x1={0}
            x2={WIDTH}
            y1={(m + 1) * ROW}
            y2={(m + 1) * ROW}
            className="stroke-border"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {rows.map((row, m) => {
          const { base, at } = LAYOUT[m]!
          const stagger = row.length > 1 ? STAGGER_MS / (row.length - 1) : 0
          const lead = m > 0 ? LINE_MS : 0
          return (
            <Fragment key={`${cycle}-${m}`}>
              {CONNECTORS[m]!.map(({ key, d }) => (
                <path
                  key={key}
                  d={d}
                  fill="none"
                  className="stroke-muted-foreground"
                  // Drawn in the diagram's own units: a non-scaling stroke
                  // would measure the drawing-in dash on screen instead and
                  // cut braces short once the diagram scales up.
                  strokeWidth={1.25}
                  pathLength={1}
                  strokeDasharray={1}
                  style={
                    reduced
                      ? undefined
                      : {
                          animation: `rabbit-farm-draw ${LINE_MS}ms ease-out both`,
                        }
                  }
                />
              ))}
              {row.map((pair, i) => (
                <PixelRabbitSprite
                  key={pair.id}
                  pixel={RABBIT / 20}
                  assembleDelay={reduced ? undefined : lead + i * stagger}
                  transform={`translate(${at.get(pair.id)} ${base})`}
                />
              ))}
              <text
                x={WIDTH - 20}
                y={base - 12}
                textAnchor="end"
                className="fill-muted-foreground font-mono"
                fontSize={18}
              >
                {row.length}
              </text>
            </Fragment>
          )
        })}
      </svg>

      {reduced ? null : (
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-2 left-2"
          aria-label={playing ? "Pause the animation" : "Play the animation"}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
      )}
    </div>
  )
}

export { RabbitFarm }
