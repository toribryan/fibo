import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react"
import { ArrowRightIcon, Volume2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { PixelSnailSprite } from "@workspace/ui/components/pixel-snail"
import { cn } from "@workspace/ui/lib/utils"

import {
  BaseUIIcon,
  GithubIcon,
  ReactIcon,
  ShadcnIcon,
  StorybookIcon,
  TailwindIcon,
} from "./brand-icons.js"
import { DocLink } from "./doc-link.js"
import { LINKS } from "./links.js"

/*
 * Geometry is ncdai's hero-01 (@ncdai/hero-01): a golden rectangle whose
 * large square holds the copy, a few hairlines marking the cuts, and a
 * spiral from the pole out past the frame. `wide` is the landscape frame;
 * `tall` turns it upright for narrow containers. fibo adds the motion: the
 * spiral draws outward from the pole, and a pixel snail crawls in along it
 * and settles on the cut through the pole.
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
  /**
   * The snail's route: a short run from outside the frame, so it slides into
   * view, then along the spiral until it meets the cut through the pole, and
   * off along that cut to rest.
   */
  crawl: string
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
  crawl:
    "M0.25 -40V0.5C0.25 115.226 95.1103 210 209.941 210C281.027 210 339.75 151.33 339.75 80.3095C339.75 36.6043 303.613 0.5 259.868 0.5C232.527 0.5 209.941 23.0652 209.941 50.381C209.941 66.7704 223.493 80.3095 239.897 80.3095H300",
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
  crawl:
    "M250 0.249985H209.5C94.7738 0.24998 0 95.1103 0 209.941C0 281.027 58.6695 339.75 129.69 339.75C173.396 339.75 209.5 303.613 209.5 259.868C209.5 232.527 186.935 209.941 159.619 209.941C143.23 209.941 129.69 223.493 129.69 239.897V300",
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

function Spiral({ id, geometry }: { id: string; geometry: Geometry }) {
  const reduced = usePrefersReducedMotion()
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

      <path id={id} d={geometry.crawl} className="hidden" />
      {reduced ? null : <Snail href={`#${id}`} pixel={stroke} />}
    </svg>
  )
}

/*
 * Both frames' routes are the same length, and the entry and spiral are this
 * share of it; the rest is the straight run along the cut.
 */
const SPIRAL_SHARE = 0.932
const CRAWL_DELAY_S = 1.4
const SPIRAL_S = 5
const SETTLE_S = 2

/*
 * The snail crawls the spiral at a steady pace, turns onto the cut, and
 * eases to a stop there, where it idles. The second spline's opening slope
 * matches the first's closing speed, so it slows down rather than lurching.
 */
function Snail({ href, pixel }: { href: string; pixel: number }) {
  const [phase, setPhase] = useState<"spiral" | "settle" | "rest">("spiral")

  useEffect(() => {
    const settle = window.setTimeout(
      () => setPhase("settle"),
      (CRAWL_DELAY_S + SPIRAL_S) * 1000
    )
    const rest = window.setTimeout(
      () => setPhase("rest"),
      (CRAWL_DELAY_S + SPIRAL_S + SETTLE_S) * 1000
    )
    return () => {
      window.clearTimeout(settle)
      window.clearTimeout(rest)
    }
  }, [])

  return (
    <g opacity={0} className="text-foreground">
      {/* Until its motion starts the snail would sit at the SVG origin. */}
      <set attributeName="opacity" to="1" begin={`${CRAWL_DELAY_S}s`} />
      <animateMotion
        dur={`${SPIRAL_S + SETTLE_S}s`}
        begin={`${CRAWL_DELAY_S}s`}
        fill="freeze"
        rotate="auto"
        keyPoints={`0;${SPIRAL_SHARE};1`}
        keyTimes={`0;${SPIRAL_S / (SPIRAL_S + SETTLE_S)};1`}
        calcMode="spline"
        keySplines="0.3 0 0.7 0.7; 0.1 0.55 0.3 1"
      >
        <mpath href={href} />
      </animateMotion>
      <PixelSnailSprite
        pixel={pixel}
        pace={phase === "spiral" ? "default" : "slow"}
        resting={phase === "rest"}
      />
    </g>
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
        <h1 className="fibo-tile m-0 mb-[max(0.75rem,1.2cqw)] text-[80px] leading-none font-semibold tracking-[-0.035em] text-foreground">
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
          render={<a href={LINKS.github} target="_blank" rel="noreferrer" />}
        >
          <GithubIcon data-icon="inline-start" />
          GitHub
        </Button>
      </div>
      <ul
        className="fibo-tile m-0 mt-[var(--u)] flex min-h-[var(--u)] list-none flex-wrap items-center gap-x-4 gap-y-2 p-0"
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
  className,
  children,
}: {
  geometry: Geometry
  id: string
  className: string
  children: ReactNode
}) {
  return (
    <div className="fibo-screen-lines relative border-x border-border">
      <Plate id={id} geometry={geometry} />
      <Spiral id={id} geometry={geometry} />
      <div className={cn("relative grid", className)}>{children}</div>
      <Interactive id={id} geometry={geometry} />
    </div>
  )
}

function Hero() {
  return (
    <header className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden px-8 pb-12">
      <div className="@container relative mx-auto w-full max-w-[68rem]">
        <div className="hidden @3xl:block">
          <Frame
            geometry={WIDE}
            id="fibo-hero-spiral"
            className="aspect-[1.618/1] grid-cols-[1.618fr_minmax(0,1fr)] grid-rows-[1fr_1.618fr]"
          >
            <Pitch width={340} className="col-1 row-[1/span_2]" />
          </Frame>
        </div>
        <div className="@3xl:hidden">
          <Frame
            geometry={TALL}
            id="fibo-hero-spiral-tall"
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
