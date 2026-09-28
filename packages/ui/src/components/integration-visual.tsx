"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { SnailIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type IntegrationItem = {
  /** Name of the tool; the tile's accessible label and tooltip. */
  title: string
  /** Mark shown in the tile. */
  icon: React.ReactNode
  /** Idle items keep their route but drop the pulse and fade back. */
  status?: "active" | "idle"
  /** In the `sides` layout, which column the item sits in. */
  side?: "in" | "out"
}

/** An image or clip for the preview. Videos play muted on a loop. */
type IntegrationPreviewMedia = {
  src: string
  /** Describes the media. Leave empty for purely decorative clips. */
  alt?: string
  /** Width over height, as a number or a CSS ratio. Defaults to `"16 / 9"`. */
  aspectRatio?: number | string
}

type Point = { x: number; y: number }
type Slot = Point & { path: string }

// Drawing space. The plate keeps this aspect ratio, and every position below
// is in these units.
const W = 400
const H = 260
const CX = W / 2
const CY = H / 2
/*
 * The plate's lattice, centred on the hub. Corner and pipeline positions,
 * route legs and turns are all multiples of it, so routes run along grid
 * lines and tiles sit on dots instead of landing beside them.
 */
const PITCH = 12
// Routes leave the hub a little inside its edge so they read as attached.
const HUB_EDGE = PITCH
const TURN = PITCH

/*
 * `corners` is the reference layout: four tools in the corners, each route
 * leaving the hub, turning once and running out to its tile. Positions are
 * fixed rather than computed so the routes stay tidy.
 */
function cornerSlots(count: number): Slot[] {
  const top = CY - 5 * PITCH
  const bottom = CY + 5 * PITCH
  const left = CX - 11 * PITCH
  const right = CX + 11 * PITCH
  const route = (dx: number, y: number, x: number) => {
    const dir = Math.sign(dx)
    const dy = Math.sign(y - CY)
    const hubX = CX + dir * HUB_EDGE
    return `M ${hubX} ${CY} V ${y - dy * TURN} Q ${hubX} ${y} ${hubX + dir * TURN} ${y} H ${x}`
  }
  const slots: Slot[] = [
    { x: left, y: top, path: route(-1, top, left) },
    { x: right, y: top, path: route(1, top, right) },
    { x: left, y: bottom, path: route(-1, bottom, left) },
    { x: right, y: bottom, path: route(1, bottom, right) },
  ]
  return slots.slice(0, count)
}

/* `orbit` spaces any number of tools evenly on an ellipse, joined by spokes. */
function orbitSlots(count: number): Slot[] {
  const rx = 146
  const ry = 92
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2
    const x = CX + Math.cos(angle) * rx
    const y = CY + Math.sin(angle) * ry
    const start = {
      x: CX + Math.cos(angle) * 24,
      y: CY + Math.sin(angle) * 24,
    }
    return { x, y, path: `M ${start.x} ${start.y} L ${x} ${y}` }
  })
}

/*
 * `sides` reads left to right: inputs in one column, outputs in the other,
 * each route bending once through a shared bus beside the hub.
 */
function sideSlots(items: IntegrationItem[]): Slot[] {
  const columns = { in: [] as number[], out: [] as number[] }
  items.forEach((item, i) => {
    const column = item.side ?? (i < Math.ceil(items.length / 2) ? "in" : "out")
    columns[column].push(i)
  })
  const slots: Slot[] = new Array(items.length)
  // Rows are six pitches apart and centred on the hub, so both odd and even
  // counts land on the lattice.
  const place = (indices: number[], dir: -1 | 1) => {
    const x = CX + dir * 11 * PITCH
    const bus = CX + dir * 5 * PITCH
    indices.forEach((itemIndex, row) => {
      const y = CY + (row - (indices.length - 1) / 2) * 6 * PITCH
      const hubX = CX + dir * 2 * PITCH
      const bend = Math.min(TURN, Math.abs(y - CY) / 2)
      const dy = Math.sign(y - CY)
      const path =
        dy === 0
          ? `M ${hubX} ${CY} H ${x}`
          : `M ${hubX} ${CY} H ${bus - dir * bend} Q ${bus} ${CY} ${bus} ${CY + dy * bend} V ${y - dy * bend} Q ${bus} ${y} ${bus + dir * bend} ${y} H ${x}`
      slots[itemIndex] = { x, y, path }
    })
  }
  place(columns.in, -1)
  place(columns.out, 1)
  return slots
}

const MAX_ITEMS = { corners: 4, orbit: 8, sides: 8 } as const

const tileVariants = cva(
  "flex items-center justify-center border border-border bg-card text-card-foreground shadow-xs [&_svg]:shrink-0",
  {
    variants: {
      size: {
        sm: "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
        default: "size-10 rounded-lg [&_svg:not([class*='size-'])]:size-5",
        lg: "size-12 rounded-xl [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { size: "default" },
  }
)

const HUB =
  "relative rounded-xl border border-border bg-background p-1.5 shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"

// The face is square for an icon and widens for text, so a word or a count
// never gets squeezed.
const hubFaceVariants = cva(
  "flex items-center justify-center rounded-lg border border-border text-foreground",
  {
    variants: {
      size: {
        sm: "h-9 min-w-9 [&_svg:not([class*='size-'])]:size-4",
        default: "h-11 min-w-11 [&_svg:not([class*='size-'])]:size-5",
        lg: "h-14 min-w-14 [&_svg:not([class*='size-'])]:size-6",
      },
      content: {
        icon: "",
        text: "px-2.5 font-semibold tracking-tight whitespace-nowrap tabular-nums",
      },
    },
    compoundVariants: [
      { content: "text", size: "sm", class: "text-sm" },
      { content: "text", size: "default", class: "text-base" },
      { content: "text", size: "lg", class: "text-lg" },
    ],
    defaultVariants: { size: "default", content: "icon" },
  }
)

function Track({
  d,
  dashed,
  idle,
}: {
  d: string
  dashed: boolean
  idle: boolean
}) {
  return (
    <path
      d={d}
      className="stroke-border"
      strokeWidth={1}
      strokeDasharray={dashed ? "4 3" : undefined}
      vectorEffect="non-scaling-stroke"
      opacity={idle ? 0.45 : 1}
    />
  )
}

function Pulse({
  d,
  direction,
  delay,
}: {
  d: string
  direction: "inward" | "outward"
  delay: number
}) {
  return (
    <motion.path
      d={d}
      pathLength={1}
      className="stroke-muted-foreground"
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray="0.18 2"
      initial={{ strokeDashoffset: direction === "outward" ? 0.18 : -2 }}
      animate={{ strokeDashoffset: direction === "outward" ? -2 : 0.18 }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "linear", delay }}
    />
  )
}

function isMedia(
  preview: React.ReactNode | IntegrationPreviewMedia
): preview is IntegrationPreviewMedia {
  return (
    typeof preview === "object" &&
    preview !== null &&
    !React.isValidElement(preview) &&
    "src" in preview
  )
}

function PreviewMedia({
  src,
  alt = "",
  aspectRatio = "16 / 9",
}: IntegrationPreviewMedia) {
  const className = "block w-full rounded-lg bg-muted object-cover"
  const style = { aspectRatio }
  return /\.(mp4|webm)(\?|#|$)/i.test(src) ? (
    <video
      className={className}
      style={style}
      src={src}
      aria-label={alt || undefined}
      autoPlay
      loop
      muted
      playsInline
    />
  ) : (
    <img className={className} style={style} src={src} alt={alt} />
  )
}

type IntegrationVisualProps = Omit<React.ComponentProps<"div">, "children"> &
  Pick<VariantProps<typeof hubFaceVariants>, "size"> & {
    /**
     * What names the hub. An icon element sits in a square face; a string or
     * number is set as text and the face widens to fit. Defaults to a snail,
     * for syncs that take their time.
     */
    center?: React.ReactNode
    /** The tools wired into the hub. */
    items: IntegrationItem[]
    /**
     * Shown above the hub while it is hovered or focused, for looking at
     * only. Pass any content, or `{ src, alt }` for an image, an animated
     * image, or a video (`.mp4`, `.webm`) that plays muted on a loop.
     */
    preview?: React.ReactNode | IntegrationPreviewMedia
    /**
     * `corners` holds up to four, `orbit` and `sides` up to eight. Items past
     * the limit are not drawn.
     */
    layout?: "corners" | "orbit" | "sides"
    /** The plate behind the diagram. */
    background?: "dots" | "grid" | "none"
    /** Route stroke. */
    routes?: "solid" | "dashed"
    /**
     * Which way the pulse travels along each active route. `through` runs
     * left to right, into the hub from the left and out of it on the right,
     * so `sides` reads as a pipeline.
     */
    pulse?: "inward" | "outward" | "through" | "none"
    /** A slow ring breathing out from the hub. */
    halo?: boolean
    /** Accessible name for the diagram. */
    label?: string
  }

/**
 * A hub and the tools wired into it, on a plate. Pulses run along the routes
 * of active items, idle items sit back, and a preview springs up above the
 * hub on hover or focus.
 */
function IntegrationVisual({
  center = <SnailIcon />,
  items,
  preview,
  layout = "corners",
  background = "dots",
  routes = "solid",
  pulse = "inward",
  halo = true,
  size = "default",
  label = "Integrations",
  className,
  ...props
}: IntegrationVisualProps) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = React.useState(false)
  const previewId = React.useId()
  const plateId = React.useId()

  const shown = items.slice(0, MAX_ITEMS[layout])
  const slots =
    layout === "orbit"
      ? orbitSlots(shown.length)
      : layout === "sides"
        ? sideSlots(shown)
        : cornerSlots(shown.length)
  const effectivePulse = reduceMotion ? "none" : pulse

  return (
    <div
      data-slot="integration-visual"
      data-layout={layout}
      role="group"
      aria-label={label}
      className={cn(
        "relative isolate aspect-[400/260] w-full overflow-hidden bg-muted",
        className
      )}
      {...props}
    >
      {background !== "none" ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
          viewBox={`0 0 ${W} ${H}`}
        >
          <defs>
            <pattern
              id={plateId}
              patternUnits="userSpaceOnUse"
              x={CX - PITCH / 2}
              y={CY - PITCH / 2}
              width={PITCH}
              height={PITCH}
            >
              {background === "dots" ? (
                <circle
                  cx={PITCH / 2}
                  cy={PITCH / 2}
                  r={0.7}
                  className="fill-foreground"
                  opacity={0.22}
                />
              ) : (
                <path
                  d={`M ${PITCH / 2} 0 V ${PITCH} M 0 ${PITCH / 2} H ${PITCH}`}
                  className="stroke-border"
                  strokeWidth={0.5}
                  fill="none"
                />
              )}
            </pattern>
          </defs>
          <rect width={W} height={H} fill={`url(#${plateId})`} />
        </svg>
      ) : null}

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
      >
        {layout === "orbit" ? (
          <ellipse
            cx={CX}
            cy={CY}
            rx={146}
            ry={92}
            className="stroke-border"
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* Every track before any pulse: routes share legs near the hub,
            and a later track would otherwise paint over an earlier pulse. */}
        {shown.map((item, i) => (
          <Track
            key={item.title}
            d={slots[i]!.path}
            dashed={routes === "dashed"}
            idle={item.status === "idle"}
          />
        ))}
        {effectivePulse !== "none"
          ? shown.map((item, i) =>
              item.status === "idle" ? null : (
                <Pulse
                  key={item.title}
                  d={slots[i]!.path}
                  direction={
                    effectivePulse === "through"
                      ? slots[i]!.x < CX
                        ? "inward"
                        : "outward"
                      : effectivePulse
                  }
                  delay={i * 0.55}
                />
              )
            )
          : null}
      </svg>

      <ul className="m-0 list-none p-0">
        {shown.map((item, i) => (
          <motion.li
            key={item.title}
            title={item.title}
            data-slot="integration-visual-item"
            data-status={item.status ?? "active"}
            className={cn(
              tileVariants({ size }),
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 data-[status=idle]:text-muted-foreground"
            )}
            style={{
              left: `${(slots[i]!.x / W) * 100}%`,
              top: `${(slots[i]!.y / H) * 100}%`,
            }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: item.status === "idle" ? 0.6 : 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.08 }}
          >
            {item.icon}
            <span className="sr-only">
              {item.title}
              {item.status === "idle" ? ", idle" : ""}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div
          data-slot="integration-visual-hub"
          tabIndex={preview ? 0 : undefined}
          aria-describedby={preview && open ? previewId : undefined}
          className={HUB}
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <div
            data-slot="integration-visual-hub-face"
            className={hubFaceVariants({
              size,
              content:
                typeof center === "string" || typeof center === "number"
                  ? "text"
                  : "icon",
            })}
          >
            {center}
          </div>
          {halo && !reduceMotion ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl border-2 border-border"
              animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
        </div>

        <AnimatePresence>
          {preview && open ? (
            <motion.div
              id={previewId}
              data-slot="integration-visual-preview"
              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-56 origin-bottom -translate-x-1/2 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, scale: 0.85 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      y: 6,
                      scale: 0.9,
                      transition: { duration: 0.15 },
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.15 }
                  : { type: "spring", bounce: 0.4, duration: 0.5 }
              }
            >
              {isMedia(preview) ? <PreviewMedia {...preview} /> : preview}
              <span
                aria-hidden="true"
                className="absolute top-full left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-border bg-popover"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export {
  IntegrationVisual,
  type IntegrationItem,
  type IntegrationPreviewMedia,
  type IntegrationVisualProps,
}
