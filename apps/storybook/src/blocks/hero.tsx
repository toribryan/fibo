import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react"
import { ArrowRightIcon, Volume2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  BaseUIIcon,
  FigmaIcon,
  GithubIcon,
  ReactIcon,
  ShadcnIcon,
  StorybookIcon,
  TailwindIcon,
} from "./brand-icons.js"
import { DocLink } from "./doc-link.js"
import { createHeckle, FIBO_LINES, type FiboLine } from "./lines.js"
import { LINKS } from "./links.js"
import {
  PixelRabbitSprite,
  type RabbitAction,
  type RabbitLook,
} from "./pixel-rabbit.js"
import { listenForUnlock, sfx } from "./sounds.js"

/*
 * Geometry is ncdai's hero-01 (@ncdai/hero-01): a golden rectangle whose
 * large square holds the copy, a few hairlines marking the cuts, and a
 * spiral from the pole out past the frame. `wide` is the landscape frame;
 * `tall` turns it upright for narrow containers. fibo adds the motion: the
 * spiral draws outward from the pole, and fibo, a pixel rabbit, builds up on
 * a line clear of it and dances there.
 */
type Geometry = {
  viewBox: string
  diagonals: string[]
  lines: string[]
  rects: {
    x: number
    y: number
    width: number
    height: number
    transform?: string
  }[]
  /** Pole to the frame's edge. */
  spiral: string
  /** Where fibo stands: a point on a cut or the frame's edge, under his foot. */
  fibo: { x: number; y: number }
  /** The last quarter turn, which leaves the frame. */
  tail: string
  /** Stroke and dot size in viewBox units, about 2px and 7px at full size. */
  stroke: number
  dot: number
  /** The part of the frame without copy. Hover and click targets are clipped
   * to it so they never sit over the heading, text or buttons. */
  open: { x: number; y: number; width: number; height: number }
  /** Drafting marks for the sketch look. Only the landscape frame has room. */
  sketch?: Sketch
}

type Sketch = {
  /** Dimension lines below the frame, each with end ticks and a label. */
  dimensions: { d: string; label: string; x: number; y: number }[]
  /** Where the spiral converges: the crossing of the two diagonals. */
  pole: { x: number; y: number }
}

const WIDE: Geometry = {
  viewBox: "0 0 340 210",
  diagonals: [
    "M105.1 -170.853L464.633 411.625",
    "M-267.831 375.247L600.141 -159.777",
  ],
  lines: ["M260 0.5V80", "M339.5 80.5H210", "M210 210V0.5"],
  rects: [
    { x: 210, y: 50.5, width: 30, height: 30 },
    { x: 240, y: 60.5, width: 20, height: 20 },
    { x: 240, y: 50.5, width: 20, height: 10 },
  ],
  spiral:
    "M239.897 60.3571C239.897 54.894 244.414 50.381 249.882 50.381C255.35 50.381 259.868 54.894 259.868 60.3571C259.868 71.2835 250.833 80.3095 239.897 80.3095C223.493 80.3095 209.941 66.7704 209.941 50.381C209.941 23.0652 232.527 0.499999 259.868 0.5C303.613 0.499995 339.75 36.6043 339.75 80.3095C339.75 151.33 281.027 210 209.941 210C95.1103 210 0.25 115.226 0.25 0.5",
  fibo: { x: 300, y: 80.5 },
  tail: "C0.250008 -185.69 154.06 -339.5 340.25 -339.5",
  stroke: 0.62,
  dot: 2.2,
  open: { x: 210, y: -400, width: 600, height: 1000 },
  sketch: {
    dimensions: [
      {
        d: "M0 220H96M114 220H210M0 216V224M210 216V224",
        label: "1",
        x: 105,
        y: 221.2,
      },
      {
        d: "M210 220H262M288 220H340M340 216V224",
        label: "0.618",
        x: 275,
        y: 221.2,
      },
    ],
    pole: { x: 246.5, y: 58.2 },
  },
}

const TALL: Geometry = {
  viewBox: "0 0 210 340",
  diagonals: [
    "M380.853 105.099L-201.625 464.632",
    "M-165.247 -267.831L369.777 600.141",
  ],
  lines: [
    "M209.5 260L130 260",
    "M129.5 339.5L129.5 210",
    "M159.5 260L159.5 210",
    "M0 210L209.5 210",
    "M160 240L130.133 240",
    "M149.5 240L149.5 260",
  ],
  rects: [
    {
      x: 159.5,
      y: 210,
      width: 30,
      height: 30,
      transform: "rotate(90 159.5 210)",
    },
    {
      x: 149.5,
      y: 240,
      width: 20,
      height: 20,
      transform: "rotate(90 149.5 240)",
    },
    {
      x: 159.5,
      y: 240,
      width: 20,
      height: 10,
      transform: "rotate(90 159.5 240)",
    },
  ],
  spiral:
    "M149.643 239.897C155.106 239.897 159.619 244.414 159.619 249.882C159.619 255.35 155.106 259.868 149.643 259.868C138.717 259.868 129.69 250.833 129.69 239.897C129.69 223.493 143.23 209.941 159.619 209.941C186.935 209.941 209.5 232.527 209.5 259.868C209.5 303.613 173.396 339.75 129.69 339.75C58.6695 339.75 0 281.027 0 209.941C0 95.1103 94.7738 0.24998 209.5 0.249985",
  fibo: { x: 30, y: 340 },
  tail: "C395.69 0.250001 549.5 154.06 549.5 340.25",
  stroke: 0.9,
  dot: 3,
  open: { x: -400, y: 210, width: 1000, height: 600 },
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
}

type Rect = Geometry["rects"][number]

// The construction sits behind the pitch, so it stays a step quieter than
// a border.
const LINE_OPACITY = 0.55

function Spiral({ geometry }: { geometry: Geometry }) {
  const { viewBox, diagonals, lines, rects, spiral, tail, stroke, sketch } =
    geometry
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
    >
      <g opacity={LINE_OPACITY}>
        <g
          className="fibo-tile stroke-border"
          style={{ animationDelay: "0.5s" }}
        >
          {diagonals.map((d) => (
            <path
              key={d}
              d={d}
              strokeDasharray="4 2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <g
          className="fibo-tile stroke-border"
          style={{ animationDelay: "0.2s" }}
        >
          {lines.map((d) => (
            <path key={d} d={d} vectorEffect="non-scaling-stroke" />
          ))}
          {rects.map((rect) => (
            <rect
              key={`${rect.x}-${rect.y}`}
              {...rect}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <path
          d={spiral + tail}
          pathLength={1}
          strokeWidth={stroke}
          className="fibo-draw fibo-draw--spiral stroke-border"
        />
      </g>

      {sketch ? (
        <>
          <g opacity={LINE_OPACITY}>
            <g
              className="fibo-tile stroke-border"
              style={{ animationDelay: "0.8s" }}
            >
              <path
                d={`M${sketch.pole.x - 6} ${sketch.pole.y}h12M${sketch.pole.x} ${sketch.pole.y - 6}v12`}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={sketch.pole.x}
                cy={sketch.pole.y}
                r={2.4}
                vectorEffect="non-scaling-stroke"
              />
              {sketch.dimensions.map((dimension) => (
                <path
                  key={dimension.d}
                  d={dimension.d}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          </g>
          <g
            className="fibo-tile font-hand fill-muted-foreground"
            style={{ animationDelay: "1s" }}
          >
            {sketch.dimensions.map((dimension) => (
              <text
                key={dimension.label}
                x={dimension.x}
                y={dimension.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={5.2}
              >
                {dimension.label}
              </text>
            ))}
          </g>
        </>
      ) : null}
    </svg>
  )
}

/*
 * fibo stands at twice the spiral's weight per pixel, so he reads as the
 * logo rather than a mark on the drawing.
 */
const FIBO_SCALE = 2
const FIBO_ASSEMBLE_MS = 1200
// Art pixels from his origin to his eyes, and how far the pointer must be
// from them before he looks that way.
const FIBO_EYES = { x: 5, y: -10 }
const FIBO_GLANCE = 1.5
// How far past his middle the pointer must go before he turns round. The
// gap between the two sides keeps him from flipping back and forth.
const FIBO_TURN = 4
// How far round him, in art pixels from his origin, a click counts as being
// on him: his outline plus a margin so a click beside him still lands.
const FIBO_REACH = { left: 16, right: 16, top: 28, bottom: 8 }

const FIBO_HELLO_MS = 1000
const FIBO_TYPE_MS = 35
const FIBO_LINGER_MS = 2800

/*
 * A poke sets fibo talking: a speech bubble types his line out with a blip
 * every other letter, then clears. Poking again starts him over.
 */
function useSpeech(reduced: boolean) {
  const [poke, setPoke] = useState(0)
  const [line, setLine] = useState<FiboLine>("poke")
  const [typed, setTyped] = useState(0)
  const text = FIBO_LINES[line]

  useEffect(() => {
    if (poke === 0) return
    let count = reduced ? text.length : 0
    let linger = 0
    const typing = window.setInterval(() => {
      if (count >= text.length) {
        window.clearInterval(typing)
        linger = window.setTimeout(() => setPoke(0), FIBO_LINGER_MS)
        return
      }
      count += 1
      setTyped(count)
      if (count % 2 === 0 && text[count - 1] !== " ") sfx.blip()
    }, FIBO_TYPE_MS)
    return () => {
      window.clearInterval(typing)
      window.clearTimeout(linger)
    }
  }, [poke, text, reduced])

  const speak = (next: FiboLine) => {
    sfx.voice(next)
    setLine(next)
    setTyped(reduced ? FIBO_LINES[next].length : 0)
    setPoke((p) => p + 1)
  }

  return { speaking: poke > 0, text, typed, speak }
}

/*
 * Both layouts are in the page with one hidden, and a hidden SVG still
 * reports a screen matrix, so the fibo on show is found by its size.
 */
function isShown(svg: SVGSVGElement | null): svg is SVGSVGElement {
  return !!svg && svg.getBoundingClientRect().width > 0
}

// The pointer in art pixels from fibo's origin, under the middle of his foot.
function pointerOffset(
  svg: SVGSVGElement | null,
  { clientX, clientY }: { clientX: number; clientY: number },
  origin: { x: number; y: number },
  pixel: number
) {
  if (!isShown(svg)) return null
  const matrix = svg.getScreenCTM()?.inverse()
  if (!matrix) return null
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix)
  return { dx: (point.x - origin.x) / pixel, dy: (point.y - origin.y) / pixel }
}

function glance(offset: number): -1 | 0 | 1 {
  if (offset < -FIBO_GLANCE) return -1
  return offset > FIBO_GLANCE ? 1 : 0
}

/*
 * fibo builds up from coarse blocks once the spiral has drawn, then idles:
 * blinks, ear twitches and the odd hop. With the pointer anywhere in the
 * hero he turns to it, eyes following and ears up, and turns round when it
 * goes behind him. Clicking him earns a remark and a reaction; his click
 * area is padded so a click beside him counts.
 */
function Fibo({
  geometry,
  area,
}: {
  geometry: Geometry
  /** Where the pointer is followed: the whole hero, not just around him. */
  area: RefObject<HTMLElement | null>
}) {
  const svg = useRef<SVGSVGElement>(null)
  const [look, setLook] = useState<RabbitLook | null>(null)
  const [action, setAction] = useState<{
    kind: RabbitAction
    id: number
  } | null>(null)
  const { speaking, text, typed, speak } = useSpeech(usePrefersReducedMotion())
  const pixel = geometry.stroke * FIBO_SCALE
  const { x, y } = geometry.fibo
  const [, , width = 1, height = 1] = geometry.viewBox.split(" ").map(Number)
  const opensRight = x < width / 2
  // Each reply is a line and something to do with it.
  const act = (line: FiboLine, kind: RabbitAction) => {
    speak(line)
    setAction((last) => ({ kind, id: (last?.id ?? 0) + 1 }))
  }
  const reply = useRef(act)
  useEffect(() => {
    reply.current = act
  })

  // A click anywhere in the hero gets a line, bar the buttons and links,
  // which keep their own jobs.
  useEffect(() => {
    const node = area.current
    if (!node) return
    const heckle = createHeckle()
    const respond = (event: globalThis.MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a, button"))
        return
      const at = pointerOffset(svg.current, event, geometry.fibo, pixel)
      if (!at) return
      const onHim =
        at.dx >= -FIBO_REACH.left &&
        at.dx <= FIBO_REACH.right &&
        at.dy >= -FIBO_REACH.top &&
        at.dy <= FIBO_REACH.bottom
      const line = heckle({ onHim, at: performance.now() })
      // Rage clicks frighten him; a poke makes him flinch; a click beside
      // him leaves him puzzled.
      reply.current(
        line,
        line === "rage" ? "thump" : onHim ? "flinch" : "wonder"
      )
    }
    node.addEventListener("click", respond)
    return () => node.removeEventListener("click", respond)
  }, [area, geometry.fibo, pixel])

  // Once per visit to the hero, a pointer that stays a while without
  // clicking gets a hello, from the fibo on show only.
  useEffect(() => {
    const node = area.current
    if (!node) return
    let wait = 0
    const cancel = () => window.clearTimeout(wait)
    const arrive = () => {
      cancel()
      wait = window.setTimeout(() => {
        if (isShown(svg.current)) reply.current("hello", "hello")
      }, FIBO_HELLO_MS)
    }
    node.addEventListener("pointerenter", arrive)
    node.addEventListener("pointerleave", cancel)
    node.addEventListener("click", cancel)
    return () => {
      cancel()
      node.removeEventListener("pointerenter", arrive)
      node.removeEventListener("pointerleave", cancel)
      node.removeEventListener("click", cancel)
    }
  }, [area])

  useEffect(() => {
    const node = area.current
    if (!node) return
    let facing: -1 | 1 = 1
    const follow = (event: globalThis.PointerEvent) => {
      const at = pointerOffset(svg.current, event, geometry.fibo, pixel)
      if (!at) return
      const { dx, dy } = at
      const next = dx < -FIBO_TURN ? -1 : dx > FIBO_TURN ? 1 : facing
      if (next !== facing) sfx.turn()
      facing = next
      setLook({
        facing,
        x: glance((dx - facing * FIBO_EYES.x) * facing),
        y: glance(dy - FIBO_EYES.y),
      })
    }
    // Left alone he faces right again, so the next visit starts from there.
    const forget = () => {
      facing = 1
      setLook(null)
    }
    node.addEventListener("pointermove", follow)
    node.addEventListener("pointerleave", forget)
    return () => {
      node.removeEventListener("pointermove", follow)
      node.removeEventListener("pointerleave", forget)
    }
  }, [area, geometry.fibo, pixel])

  return (
    <>
      <svg
        ref={svg}
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
        viewBox={geometry.viewBox}
        aria-hidden="true"
      >
        <PixelRabbitSprite
          className="text-foreground"
          transform={`translate(${x} ${y})`}
          pixel={pixel}
          look={look}
          action={action}
          assembleDelay={FIBO_ASSEMBLE_MS}
          onAssemble={(step) => {
            if (!isShown(svg.current)) return
            if (step === "whole") sfx.settle()
            else sfx.pixels(step)
          }}
          onSound={(sound) => {
            if (isShown(svg.current)) sfx[sound]()
          }}
        />
        <rect
          x={x - FIBO_REACH.left * pixel}
          y={y - FIBO_REACH.top * pixel}
          width={(FIBO_REACH.left + FIBO_REACH.right) * pixel}
          height={(FIBO_REACH.top + FIBO_REACH.bottom) * pixel}
          fill="transparent"
          pointerEvents="all"
          className="cursor-pointer"
        />
      </svg>
      {speaking ? (
        // Anchored by the edge over his head nearest the frame's side, so it
        // opens back across the frame instead of off the side of it. The
        // untyped rest of the line holds its place, so the bubble keeps its
        // size as it fills.
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 w-max max-w-[15rem] rounded-lg border border-border bg-popover px-2.5 py-1.5 font-mono text-xs leading-snug text-popover-foreground shadow-sm"
          style={{
            ...(opensRight
              ? { left: `${((x - 12 * pixel) / width) * 100}%` }
              : { right: `${(1 - (x + 12 * pixel) / width) * 100}%` }),
            bottom: `${(1 - (y - 25 * pixel) / height) * 100}%`,
          }}
        >
          {text.slice(0, typed)}
          <span className="text-transparent">{text.slice(typed)}</span>
          <span
            className={cn(
              "absolute -bottom-[5px] size-2 rotate-45 border-r border-b border-border bg-popover",
              opensRight ? "left-6" : "right-6"
            )}
          />
        </div>
      ) : null}
    </>
  )
}

type Shape = { path?: string; rect?: Rect }

/*
 * A line that answers the pointer: crossing its hit area sends one quick
 * pulse along it. The hit stroke is wide and transparent so the line is
 * easy to catch, and a pulse already in flight is left to finish.
 */
function Trace({ shape, width }: { shape: Shape; width: number }) {
  const flash = useRef<SVGPathElement & SVGRectElement>(null)
  const running = useRef<Animation | null>(null)

  const fire = () => {
    const node = flash.current
    if (!node || running.current?.playState === "running") return
    running.current = node.animate(
      [{ strokeDashoffset: 0.1 }, { strokeDashoffset: -1 }],
      { duration: 900, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
    )
  }

  const flashProps = {
    ref: flash,
    pathLength: 1,
    strokeDasharray: "0.1 2",
    strokeDashoffset: 0.1,
    strokeWidth: width,
    strokeLinecap: "round" as const,
    className: "pointer-events-none stroke-muted-foreground",
  }
  const hitProps = {
    strokeWidth: 16,
    vectorEffect: "non-scaling-stroke",
    pointerEvents: "stroke",
    className: "stroke-transparent",
    onPointerEnter: fire,
  }
  return shape.rect ? (
    <g>
      <rect {...shape.rect} {...flashProps} />
      <rect {...shape.rect} {...hitProps} />
    </g>
  ) : (
    <g>
      <path d={shape.path} {...flashProps} />
      <path d={shape.path} {...hitProps} />
    </g>
  )
}

/** One dot launched by a click: rides in from the frame's edge and fades. */
function LaunchedDot({ href, r }: { href: string; r: number }) {
  const motion = useRef<SVGAnimateMotionElement>(null)
  const fade = useRef<SVGAnimateElement>(null)

  useEffect(() => {
    motion.current?.beginElement()
    fade.current?.beginElement()
  }, [])

  return (
    <circle r={r} opacity={0} className="pointer-events-none fill-ring">
      <animate
        ref={fade}
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.08;0.85;1"
        dur="3.4s"
        begin="indefinite"
        fill="freeze"
      />
      <animateMotion
        ref={motion}
        dur="3.4s"
        begin="indefinite"
        fill="freeze"
        keyPoints="1;0"
        keyTimes="0;1"
        calcMode="spline"
        keySplines="0.3 0 0.2 1"
      >
        <mpath href={href} />
      </animateMotion>
    </circle>
  )
}

const LAUNCH_MS = 3500
const MAX_LAUNCHED = 8

/*
 * The pointer layer, drawn over the copy's grid so it can receive events.
 * The SVG itself ignores the pointer; only the clipped hit strokes take it,
 * which keeps every target on the side of the frame without copy.
 */
function Interactive({ id, geometry }: { id: string; geometry: Geometry }) {
  const reduced = usePrefersReducedMotion()
  const [launched, setLaunched] = useState<number[]>([])
  const next = useRef(0)

  if (reduced) return null

  const launch = () => {
    const key = next.current++
    setLaunched((keys) => [...keys.slice(-(MAX_LAUNCHED - 1)), key])
    window.setTimeout(
      () => setLaunched((keys) => keys.filter((k) => k !== key)),
      LAUNCH_MS
    )
  }

  const ride = `${id}-ride`
  const clip = `${id}-open`
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      viewBox={geometry.viewBox}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clip}>
          <rect {...geometry.open} />
        </clipPath>
        <path id={ride} d={geometry.spiral} />
      </defs>
      <g clipPath={`url(#${clip})`}>
        <path
          d={geometry.spiral}
          strokeWidth={18}
          vectorEffect="non-scaling-stroke"
          pointerEvents="stroke"
          className="cursor-pointer stroke-transparent"
          onPointerDown={launch}
        />
        {geometry.lines.map((d) => (
          <Trace key={d} shape={{ path: d }} width={geometry.stroke} />
        ))}
        {geometry.rects.map((rect) => (
          <Trace
            key={`${rect.x}-${rect.y}`}
            shape={{ rect }}
            width={geometry.stroke}
          />
        ))}
      </g>
      {launched.map((key) => (
        <LaunchedDot key={key} href={`#${ride}`} r={geometry.dot} />
      ))}
    </svg>
  )
}

function Pronounce() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Pronounce fibo"
      onClick={() => {
        if (!("speechSynthesis" in window)) return
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("feebo"))
      }}
      className="text-muted-foreground"
    >
      <Volume2Icon />
    </Button>
  )
}

const STACK: { icon: ComponentType<{ className?: string }>; title: string }[] =
  [
    { icon: ShadcnIcon, title: "shadcn/ui" },
    { icon: BaseUIIcon, title: "Base UI" },
    { icon: ReactIcon, title: "React" },
    { icon: TailwindIcon, title: "Tailwind CSS" },
    { icon: StorybookIcon, title: "Storybook" },
  ]

/*
 * The pitch is laid out in lattice cells (--u) so the buttons land on the dot
 * grid: their row starts on a dot row and they are whole cells tall. The text
 * above hangs off that row.
 */
function Pitch({ width, className }: { width: number; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-rows-[max(calc(var(--u)*13),round(up,15rem,var(--u)))_auto_auto] content-start overflow-hidden px-[calc(var(--u)*2)]",
        className
      )}
      style={{ "--u": `calc(100cqw * ${LATTICE} / ${width})` } as CSSProperties}
    >
      <div className="flex flex-col justify-end">
        <h1 className="fibo-tile m-0 mb-[max(0.75rem,1.2cqw)] text-[clamp(3.5rem,18cqw,5rem)] leading-none font-semibold tracking-[-0.035em] text-foreground">
          fibo
        </h1>
        <p
          className="fibo-tile m-0 mb-[max(1rem,1.8cqw)] flex items-center gap-1 font-mono text-xl text-muted-foreground"
          style={{ animationDelay: "0.1s" }}
        >
          <span>
            <span className="sr-only">Pronounced </span>FEE-boh
          </span>
          <Pronounce />
        </p>
        <p
          className="fibo-tile m-0 mb-[max(1.5rem,2.4cqw)] max-w-[36ch] text-[clamp(1rem,1.9cqw,1.25rem)] leading-normal text-pretty text-muted-foreground"
          style={{ animationDelay: "0.2s" }}
        >
          A library of parts for{" "}
          <strong className="font-normal text-foreground">
            experimental projects
          </strong>{" "}
          and{" "}
          <strong className="font-normal text-foreground">
            special components
          </strong>{" "}
          that anyone can use.
        </p>
      </div>
      <div
        className="fibo-tile flex flex-wrap gap-2"
        style={{ animationDelay: "0.3s" }}
      >
        <Button
          size="lg"
          nativeButton={false}
          render={<DocLink to="getting-started--docs" />}
          className="h-[round(up,1.5rem,var(--u))] w-[round(up,8rem,var(--u))]"
        >
          Get started
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          className="h-[round(up,1.5rem,var(--u))] w-[round(up,6rem,var(--u))] bg-background hover:bg-accent"
          render={<a href={LINKS.figma} target="_blank" rel="noreferrer" />}
        >
          <FigmaIcon data-icon="inline-start" />
          Figma
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          className="h-[round(up,1.5rem,var(--u))] w-[round(up,6rem,var(--u))] bg-background hover:bg-accent"
          render={<a href={LINKS.github} target="_blank" rel="noreferrer" />}
        >
          <GithubIcon data-icon="inline-start" />
          GitHub
        </Button>
      </div>
      {/* On a phone the pitch has no room for the stack under its buttons,
          so it's left out rather than clipped by the frame. */}
      <ul
        className="fibo-tile m-0 mt-[var(--u)] hidden min-h-[var(--u)] list-none flex-wrap items-center gap-x-4 gap-y-2 p-0 @sm:flex"
        style={{ animationDelay: "0.45s" }}
      >
        {STACK.map(({ icon: Icon, title }) => (
          <li
            key={title}
            className="flex items-center gap-2 text-muted-foreground select-none"
          >
            <Icon className="size-5 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/*
 * hero-01's frame is built on a 10-unit lattice: 340 by 210, with every cut
 * at a multiple of ten. The dots sit on that same lattice, anchored to the
 * frame's corner, so each line runs through a row or column of them. The
 * plate runs well past the frame and the header clips it at the page edges.
 */
const LATTICE = 10

function Plate({ id, geometry }: { id: string; geometry: Geometry }) {
  const [, , w = 0, h = 0] = geometry.viewBox.split(" ").map(Number)
  const dots = `${id}-dots`
  const fade = `${id}-fade`
  const mask = `${id}-mask`
  const bounds = { x: -w, y: -LATTICE, width: w * 3, height: h + LATTICE * 5 }
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      viewBox={geometry.viewBox}
    >
      <defs>
        <pattern
          id={dots}
          patternUnits="userSpaceOnUse"
          x={-LATTICE / 2}
          y={-LATTICE / 2}
          width={LATTICE}
          height={LATTICE}
        >
          <circle
            cx={LATTICE / 2}
            cy={LATTICE / 2}
            r={0.4}
            className="fill-foreground"
          />
        </pattern>
        {/* Fades in below the toolbar and out under the dimension lines. */}
        <linearGradient
          id={fade}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={0}
          y2={h + LATTICE * 3}
        >
          <stop offset={0} stopColor="white" stopOpacity={0} />
          <stop offset={0.1} stopColor="white" />
          <stop offset={0.85} stopColor="white" />
          <stop offset={1} stopColor="white" stopOpacity={0} />
        </linearGradient>
        <mask id={mask} maskUnits="userSpaceOnUse" {...bounds}>
          <rect {...bounds} fill={`url(#${fade})`} />
        </mask>
      </defs>
      <rect
        {...bounds}
        fill={`url(#${dots})`}
        mask={`url(#${mask})`}
        opacity={0.16}
      />
    </svg>
  )
}

function Frame({
  geometry,
  id,
  area,
  className,
  children,
}: {
  geometry: Geometry
  id: string
  area: RefObject<HTMLElement | null>
  className: string
  children: ReactNode
}) {
  return (
    <div className="fibo-screen-lines relative border-x border-border">
      <Plate id={id} geometry={geometry} />
      <Spiral geometry={geometry} />
      <div className={cn("relative grid", className)}>{children}</div>
      <Interactive id={id} geometry={geometry} />
      <Fibo geometry={geometry} area={area} />
    </div>
  )
}

function Hero() {
  const area = useRef<HTMLElement>(null)
  useEffect(listenForUnlock, [])
  return (
    <header
      ref={area}
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden px-4 pb-12 sm:px-8"
    >
      <div className="@container relative mx-auto w-full max-w-[68rem]">
        <div className="hidden @3xl:block">
          <Frame
            geometry={WIDE}
            id="fibo-hero-spiral"
            area={area}
            className="aspect-[1.618/1] grid-cols-[1.618fr_minmax(0,1fr)] grid-rows-[1fr_1.618fr]"
          >
            <Pitch width={340} className="col-1 row-[1/span_2]" />
          </Frame>
        </div>
        <div className="@3xl:hidden">
          <Frame
            geometry={TALL}
            id="fibo-hero-spiral-tall"
            area={area}
            className="aspect-[1/1.618] grid-cols-[1.618fr_minmax(0,1fr)] grid-rows-[1.618fr_1fr]"
          >
            <Pitch width={210} className="col-[1/span_2] row-1" />
          </Frame>
        </div>
      </div>
    </header>
  )
}

export { Hero }
