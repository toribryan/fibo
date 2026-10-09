import { useEffect, useRef, useState, useSyncExternalStore } from "react"

/*
 * fibo, a pixel rabbit, as an SVG sprite for the Welcome page. He is drawn
 * facing left in a one-pixel line: 0 empty, 1 line, 2 fill. Every pose is
 * an edit to this one grid, so he never changes style.
 */
const RABBIT = [
  "01110001110000000000",
  "12221012221000000000",
  "12121012121000000000",
  "12121012121000000000",
  "01221012121000000000",
  "01221112210000000000",
  "00122222221000000000",
  "01222222222100000000",
  "12222222222100000000",
  "12122221222100000000",
  "12122221222111100000",
  "12221122221222210000",
  "01122222112222221000",
  "00122222222212222100",
  "00122222222122222111",
  "00122212221222222121",
  "00122212212222222121",
  "00122212212222222110",
  "01122112112222221000",
  "01111111111111111000",
]
const WIDTH = 20
// Rows above his ears, for perked ears.
const HEADROOM = 3
const LEG_ROW = 16 + HEADROOM

type Cell = 0 | 1 | 2
type Grid = Cell[][]

/*
 * Ear poses replace the top of the drawing, headroom included. The last row
 * of each is where the ears meet his head.
 */
const EARS = {
  up: [
    "",
    "",
    "",
    ".###...###",
    "#ooo#.#ooo#",
    "#o#o#.#o#o#",
    "#o#o#.#o#o#",
    ".#oo#.#o#o#",
    ".#oo###oo#",
  ],
  perk: [
    "",
    "",
    ".###...###",
    "#ooo#.#ooo#",
    "#o#o#.#o#o#",
    "#o#o#.#o#o#",
    "#o#o#.#o#o#",
    ".#oo#.#o#o#",
    ".#oo###oo#",
  ],
  // Pinned back, one over the other, sweeping away from his face.
  down: [
    "",
    "",
    "",
    "",
    ".......#####.",
    "......#ooooo#",
    "....#########",
    "...#ooooooo#.",
    "..#oo#####...",
  ],
  // The tip of the far ear folds over.
  lean: [
    "",
    "",
    "",
    ".###......",
    "#ooo#...###",
    "#o#o#.##ooo#",
    "#o#o#.#o#o#",
    ".#oo#.#o#o#",
    ".#oo###oo#",
  ],
}

// Scared: both ears flopped forward over his eyes, from row 4 down.
const FLAPS = [
  ".###.###....",
  "#ooo#ooo#...",
  "#ooo#ooo#...",
  "#ooo#ooo#...",
  "#ooo#ooo#...",
  "#ooo#ooo#...",
  "#ooo#ooo#...",
  ".###.###....",
]

const EYES = [
  [2, 9],
  [2, 10],
  [7, 9],
  [7, 10],
] as const

type Pose = {
  ears?: keyof typeof EARS | "cover"
  eyes?: "open" | "shut"
  /** Where the eyes look, in the drawing's own direction: -1 is toward his face. */
  dx?: -1 | 0 | 1
  dy?: -1 | 0 | 1
  /** The mouth, at rest or nudged along a pixel. */
  mouth?: 0 | 1
  /** A row shorter, or a row taller, at the legs. */
  legs?: "squash" | "stretch"
}

const cell = (c: string | undefined): Cell =>
  c === "#" ? 1 : c === "o" ? 2 : 0

function compose(pose: Pose): Grid {
  const g: Grid = [
    ...Array.from({ length: HEADROOM }, () => Array<Cell>(WIDTH).fill(0)),
    ...RABBIT.map((r) => [...r].map((c) => Number(c) as Cell)),
  ]
  const set = (x: number, y: number, v: Cell) => {
    g[y + HEADROOM]![x] = v
  }
  const ears = pose.ears === "cover" ? EARS.up : EARS[pose.ears ?? "up"]
  ears.forEach((row, y) => {
    for (let x = 0; x < 13; x++) g[y]![x] = cell(row[x])
  })
  for (const [x, y] of EYES) set(x, y, 2)
  if (pose.eyes === "shut") {
    for (const [x, y] of [
      [2, 10],
      [3, 10],
      [7, 10],
      [8, 10],
    ] as const)
      set(x, y, 1)
  } else {
    for (const [x, y] of EYES) set(x + (pose.dx ?? 0), y + (pose.dy ?? 0), 1)
  }
  const m = pose.mouth ?? 0
  set(4, 11, 2)
  set(5, 11, 2)
  set(4 + m, 11, 1)
  set(5 + m, 11, 1)
  if (pose.ears === "cover") {
    for (let y = 0; y < HEADROOM + 6; y++)
      for (let x = 0; x < 12; x++) g[y]![x] = 0
    FLAPS.forEach((row, i) => {
      for (let x = 0; x < 12; x++)
        if (row[x] !== ".") set(x, 4 + i, cell(row[x]))
    })
  }
  if (pose.legs === "squash") return g.filter((_, i) => i !== LEG_ROW)
  if (pose.legs === "stretch")
    return [...g.slice(0, LEG_ROW), [...g[LEG_ROW]!], ...g.slice(LEG_ROW)]
  return g
}

/*
 * On dark grounds he turns solid: his outline and fill both go light and
 * only the inner lines stay dark. Swapping the two colors instead would
 * leave a thin light outline round a dark body.
 */
function invert(grid: Grid): Grid {
  const h = grid.length
  const outside = grid.map((r) => r.map(() => false))
  const stack: [number, number][] = []
  for (let x = 0; x < WIDTH; x++) stack.push([x, 0], [x, h - 1])
  for (let y = 0; y < h; y++) stack.push([0, y], [WIDTH - 1, y])
  while (stack.length) {
    const [x, y] = stack.pop()!
    if (x < 0 || y < 0 || x >= WIDTH || y >= h) continue
    if (outside[y]![x] || grid[y]![x]) continue
    outside[y]![x] = true
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  const out = (x: number, y: number) =>
    x < 0 || y < 0 || x >= WIDTH || y >= h || outside[y]![x]!
  return grid.map((row, y) =>
    row.map((v, x): Cell => {
      if (v !== 1) return v
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if ((dx || dy) && out(x + dx, y + dy)) return 2
      return 1
    })
  )
}

// One rect per run of a value along a row, so a frame is a few dozen nodes.
function Runs({ grid, value }: { grid: Grid; value: Cell }) {
  const rects = []
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]!
    let x = 0
    while (x < WIDTH) {
      if (row[x] !== value) {
        x++
        continue
      }
      let end = x
      while (end < WIDTH && row[end] === value) end++
      rects.push(
        <rect key={`${x}:${y}`} x={x} y={y} width={end - x} height={1} />
      )
      x = end
    }
  }
  return rects
}

type RabbitSound = "hop" | "land" | "thump" | "flinch"

type Step = {
  pose: Pose
  ms: number
  /** Pixels off the ground. */
  lift?: number
  /** Pixels sideways, for a shudder. */
  nudge?: number
  sound?: RabbitSound
}

/*
 * An 8-bit hop: three held frames on a 12 fps beat, one jump height, no
 * easing. Idle hops are silent; only a reply makes noise.
 */
const HOP: Step[] = [
  { pose: { legs: "squash" }, ms: 166 },
  { pose: { legs: "stretch", ears: "perk" }, ms: 250, lift: 4 },
  { pose: { legs: "squash" }, ms: 83 },
  { pose: {}, ms: 250 },
]

// Resting: blinks, twitches an ear, sniffs, glances about, hops in place.
// The holds are uneven on purpose; an even beat reads as a machine.
const IDLE: Step[] = [
  { pose: {}, ms: 1800 },
  { pose: { eyes: "shut" }, ms: 130 },
  { pose: {}, ms: 1300 },
  { pose: { ears: "lean" }, ms: 520 },
  { pose: {}, ms: 600 },
  { pose: { ears: "lean" }, ms: 160 },
  { pose: {}, ms: 900 },
  { pose: { mouth: 1 }, ms: 110 },
  { pose: {}, ms: 110 },
  { pose: { mouth: 1 }, ms: 110 },
  { pose: {}, ms: 1200 },
  { pose: { dx: -1 }, ms: 900 },
  { pose: { dx: 1 }, ms: 900 },
  { pose: { dx: 1, dy: -1 }, ms: 600 },
  { pose: {}, ms: 700 },
  { pose: { eyes: "shut" }, ms: 130 },
  { pose: {}, ms: 900 },
  ...HOP,
  { pose: {}, ms: 1400 },
]

const ACTIONS = {
  // Poked: ears back, eyes shut, a squash and a shudder.
  flinch: [
    {
      pose: { ears: "down", eyes: "shut", legs: "squash" },
      ms: 110,
      nudge: 1,
      sound: "flinch",
    },
    {
      pose: { ears: "down", eyes: "shut", legs: "squash" },
      ms: 110,
      nudge: -1,
    },
    { pose: { ears: "down" }, ms: 400 },
    { pose: { ears: "down", dx: 1 }, ms: 900 },
  ],
  // Rage clicks: he hides his eyes behind his ears and thumps twice, as
  // scared rabbits do.
  thump: [
    { pose: { ears: "cover" }, ms: 200 },
    {
      pose: { ears: "cover", legs: "squash" },
      ms: 90,
      nudge: 1,
      sound: "thump",
    },
    { pose: { ears: "cover" }, ms: 160 },
    {
      pose: { ears: "cover", legs: "squash" },
      ms: 90,
      nudge: -1,
      sound: "thump",
    },
    { pose: { ears: "cover" }, ms: 1900 },
    { pose: { ears: "down" }, ms: 300 },
  ],
  // A lingering pointer: ears up and a waggle.
  hello: [
    { pose: { ears: "perk" }, ms: 260 },
    { pose: { ears: "lean" }, ms: 200 },
    { pose: { ears: "perk" }, ms: 200 },
    { pose: { ears: "lean" }, ms: 200 },
    { pose: { ears: "perk", mouth: 1 }, ms: 1200 },
  ],
  // A click beside him: one ear folds while he works out what you meant.
  wonder: [{ pose: { ears: "lean", dx: 1 }, ms: 1400 }],
} satisfies Record<string, Step[]>

type RabbitAction = keyof typeof ACTIONS

const REST: Step = { pose: {}, ms: 0 }

/*
 * Steps through a timeline. `key` restarts it; a timeline that does not
 * loop reports `onDone` after its last step.
 */
function usePlayer(
  steps: Step[] | null,
  key: string,
  loop: boolean,
  onStep: (step: Step) => void,
  onDone: () => void
): Step {
  const [state, setState] = useState({ key, index: 0 })
  const index = state.key === key ? state.index : 0
  const handlers = useRef({ onStep, onDone })
  useEffect(() => {
    handlers.current = { onStep, onDone }
  })
  useEffect(() => {
    if (!steps) return
    const step = steps[index]!
    handlers.current.onStep(step)
    const timer = window.setTimeout(() => {
      const next = index + 1
      if (next < steps.length) setState({ key, index: next })
      else if (loop) setState({ key, index: 0 })
      else handlers.current.onDone()
    }, step.ms)
    return () => window.clearTimeout(timer)
  }, [steps, key, index, loop])
  return steps ? (steps[index] ?? REST) : REST
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION)
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
}

// The build-up: coarse blocks arriving, holding, then halving, then whole.
const ASSEMBLE_STAGES = [
  { block: 4, ms: 400, reveal: true },
  { block: 4, ms: 120, reveal: false },
  { block: 2, ms: 160, reveal: false },
] as const
const ASSEMBLE_MS = ASSEMBLE_STAGES.reduce((sum, s) => sum + s.ms, 0)
const ASSEMBLE_TICK_MS = 40
const ASSEMBLE_STEPS = 10

type Assembly = { block: number; shown: number } | "hidden" | "whole"

// The stage comes from the time since mount, so a throttled background tab
// skips ahead instead of dragging the build-up out.
function useAssemble(delay: number | undefined, skip: boolean): Assembly {
  const [elapsed, setElapsed] = useState(-1)
  const active = delay !== undefined && !skip
  useEffect(() => {
    if (!active) return
    const start = performance.now() + delay
    const id = window.setInterval(() => {
      const since = performance.now() - start
      setElapsed(since)
      if (since >= ASSEMBLE_MS) window.clearInterval(id)
    }, ASSEMBLE_TICK_MS)
    return () => window.clearInterval(id)
  }, [active, delay])
  if (!active || elapsed >= ASSEMBLE_MS) return "whole"
  if (elapsed < 0) return "hidden"
  let rest = elapsed
  for (const stage of ASSEMBLE_STAGES) {
    if (rest < stage.ms) {
      const shown = stage.reveal ? rest / stage.ms : 1
      return {
        block: stage.block,
        shown: Math.round(shown * ASSEMBLE_STEPS) / ASSEMBLE_STEPS,
      }
    }
    rest -= stage.ms
  }
  return "whole"
}

function scatter(x: number, y: number) {
  return ((x * 73856093) ^ (y * 19349663)) % 97
}

// The art at a coarser grid, blocks arriving in a scattered but fixed order.
function Mosaic({
  grid,
  block,
  shown,
}: {
  grid: Grid
  block: number
  shown: number
}) {
  const blocks: [number, number][] = []
  for (let by = 0; by * block < grid.length; by++)
    for (let bx = 0; bx * block < WIDTH; bx++) {
      let count = 0
      for (let y = by * block; y < (by + 1) * block; y++)
        for (let x = bx * block; x < (bx + 1) * block; x++)
          if (grid[y]?.[x]) count++
      if (count >= Math.max(1, (block * block) / 4)) blocks.push([bx, by])
    }
  blocks.sort(([ax, ay], [bx, by]) => scatter(ax, ay) - scatter(bx, by))
  return blocks
    .slice(0, Math.ceil(blocks.length * shown))
    .map(([bx, by]) => (
      <rect
        key={`${bx}:${by}`}
        x={bx * block}
        y={by * block}
        width={block}
        height={block}
      />
    ))
}

type RabbitLook = {
  /** Behind, level or ahead, from where he faces. */
  x: -1 | 0 | 1
  /** Up, level or down. */
  y: -1 | 0 | 1
  /** `1` faces right, `-1` faces left. */
  facing?: -1 | 1
}

type PixelRabbitSpriteProps = {
  /** Size of one art pixel, in the parent SVG's user units. */
  pixel?: number
  /** Watch a point: eyes toward it, ears up, turned to face it. */
  look?: RabbitLook | null
  /** A reply to play once. A new `id` plays it again. */
  action?: { kind: RabbitAction; id: number } | null
  /** Builds him up from coarse blocks after this many milliseconds. */
  assembleDelay?: number
  /** Called as the build-up moves on, for syncing sound to the pixels. */
  onAssemble?: (step: { block: number; shown: number } | "whole") => void
  /** Called for each sound a reply makes. */
  onSound?: (sound: RabbitSound) => void
  transform?: string
  className?: string
}

/**
 * fibo as a bare SVG group. His origin is under the middle of his feet, so
 * he stands on a point rather than straddling it.
 */
function PixelRabbitSprite({
  pixel = 1,
  look = null,
  action = null,
  assembleDelay,
  onAssemble,
  onSound,
  transform,
  className,
}: PixelRabbitSpriteProps) {
  const reduced = useReducedMotion()
  const assembly = useAssemble(assembleDelay, reduced)
  const [finished, setFinished] = useState<number | null>(null)
  const acting = !!action && action.id !== finished && !reduced
  const whole = assembly === "whole"

  const steps = acting
    ? ACTIONS[action.kind]
    : whole && !look && !reduced
      ? IDLE
      : null
  const step = usePlayer(
    steps,
    acting ? `action:${action.id}` : "idle",
    !acting,
    (s) => {
      if (acting && s.sound) onSound?.(s.sound)
    },
    () => setFinished(action?.id ?? null)
  )

  const report = useRef(onAssemble)
  useEffect(() => {
    report.current = onAssemble
  })
  const building = typeof assembly === "object"
  const block = building ? assembly.block : 0
  const shown = building ? assembly.shown : 0
  const built = useRef(false)
  useEffect(() => {
    if (building) {
      built.current = true
      report.current?.({ block, shown })
    } else if (whole && built.current) {
      built.current = false
      report.current?.("whole")
    }
  }, [building, whole, block, shown])

  // He is drawn facing left; `look.facing` of 1 turns him right.
  const facing = look?.facing ?? 1
  const pose: Pose =
    acting || !look
      ? step.pose
      : {
          dx: look.x === 0 ? 0 : look.x === 1 ? -1 : 1,
          dy: look.y,
          ears: "perk",
        }
  const grid = compose(pose)
  const lift = acting || !look ? (step.lift ?? 0) : 0
  const nudge = acting ? (step.nudge ?? 0) : 0
  const flip = facing === 1 ? -1 : 1
  const origin = `translate(${nudge * pixel} 0) scale(${pixel * flip} ${pixel}) translate(${-WIDTH / 2} ${-grid.length - lift})`

  return (
    <g
      data-slot="pixel-rabbit-sprite"
      fill="currentColor"
      shapeRendering="crispEdges"
      transform={transform ? `${transform} ${origin}` : origin}
      className={className}
    >
      {assembly === "hidden" ? null : building ? (
        <Mosaic grid={grid} block={block} shown={shown} />
      ) : (
        <>
          <g className="dark:hidden">
            <g className="fill-background">
              <Runs grid={grid} value={2} />
            </g>
            <Runs grid={grid} value={1} />
          </g>
          <g className="hidden dark:inline">
            <Runs grid={invert(grid)} value={2} />
            <g className="fill-background">
              <Runs grid={invert(grid)} value={1} />
            </g>
          </g>
        </>
      )}
    </g>
  )
}

export { PixelRabbitSprite }
export type { RabbitAction, RabbitLook, RabbitSound }
