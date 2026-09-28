"use client"

import * as React from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"

import { cn } from "@workspace/ui/lib/utils"

type Chapter = {
  /** Stable, unique identifier. */
  id: string
  /** Heading in the preview. */
  title: string
  /** Supporting copy under the title, clamped to three lines. */
  description?: React.ReactNode
  /** Small muted label above the title, such as a timestamp or step number. */
  meta?: React.ReactNode
}

type Orientation = "vertical" | "horizontal"
type Side = "left" | "right" | "top" | "bottom"

type Metrics = {
  /** Row pitch along the rail: the gap between marks. */
  rowSize: number
  /** Resting length of a tick, or diameter of a dot. */
  rest: number
  /** Length or diameter at the crest of the wave. */
  peak: number
  /** Tick thickness. Dots ignore it. */
  thickness: number
}

const SIZES: Record<
  "tick" | "dot",
  Record<"sm" | "default" | "lg", Metrics>
> = {
  tick: {
    sm: { rowSize: 8, rest: 10, peak: 40, thickness: 1.5 },
    default: { rowSize: 10, rest: 14, peak: 56, thickness: 2 },
    lg: { rowSize: 14, rest: 18, peak: 72, thickness: 2 },
  },
  dot: {
    sm: { rowSize: 12, rest: 3, peak: 9, thickness: 0 },
    default: { rowSize: 16, rest: 4, peak: 12, thickness: 0 },
    lg: { rowSize: 20, rest: 5, peak: 16, thickness: 0 },
  },
}

const CARD_WIDTH = 260
const GAP = 16

// Near-critically damped: the crest tracks the pointer with almost no lag and
// never overshoots, so the wave reads as attached to it.
const POINTER_SPRING = { stiffness: 700, damping: 52, mass: 0.5 }
// Softer, so the wave swells in and relaxes rather than snapping.
const STRENGTH_SPRING = { stiffness: 260, damping: 30, mass: 0.6 }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Raised cosine: 1 at the crest, 0 past the radius, with zero slope at both
// ends so the wave has no visible seam where it meets the resting marks.
function bump(distance: number, radius: number) {
  if (distance >= radius) return 0
  return 0.5 * (1 + Math.cos(Math.PI * (distance / radius)))
}

type MarkProps = {
  index: number
  pointer: MotionValue<number>
  strength: MotionValue<number>
  radius: number
  metrics: Metrics
  variant: "tick" | "dot"
  orientation: Orientation
  isCurrent: boolean
}

const Mark = React.memo(function Mark({
  index,
  pointer,
  strength,
  radius,
  metrics,
  variant,
  orientation,
  isCurrent,
}: MarkProps) {
  const rise = useTransform(
    () => strength.get() * bump(Math.abs(index - pointer.get()), radius)
  )
  const length = useTransform(
    rise,
    (r) => metrics.rest + r * (metrics.peak - metrics.rest)
  )
  const opacity = useTransform(rise, (r) => {
    const base = isCurrent ? 0.9 : 0.25
    return base + r * (1 - base)
  })
  // A quiet second cue: ticks thicken slightly at the crest while the length
  // carries the rise.
  const thicken = useTransform(rise, (r) => 1 + r * 0.4)

  if (variant === "dot") {
    return (
      <motion.span
        aria-hidden="true"
        data-current={isCurrent ? "" : undefined}
        style={{ width: length, height: length, opacity }}
        className="block shrink-0 rounded-full bg-foreground"
      />
    )
  }

  const vertical = orientation === "vertical"
  return (
    <motion.span
      aria-hidden="true"
      data-current={isCurrent ? "" : undefined}
      style={
        vertical
          ? {
              width: length,
              height: metrics.thickness,
              opacity,
              scaleY: thicken,
            }
          : {
              height: length,
              width: metrics.thickness,
              opacity,
              scaleX: thicken,
            }
      }
      className="block shrink-0 rounded-full bg-foreground"
    />
  )
})

type ChapterScrubberProps = Omit<React.ComponentProps<"div">, "onSelect"> & {
  /** Chapters in order along the rail, one mark each. */
  chapters: Chapter[]
  /** Which way the rail runs. */
  orientation?: Orientation
  /** Mark style: hairline ticks or dots. */
  variant?: "tick" | "dot"
  /** Density preset. Numeric props below override it. */
  size?: "sm" | "default" | "lg"
  /**
   * Where the preview opens. Vertical rails take left or right, horizontal
   * rails top or bottom. Flips when the preferred side would leave the
   * viewport.
   */
  side?: Side
  /** Ticks grow from the rail's edge, or out from its centre line. */
  align?: "edge" | "center"
  /** What shows beside the crest. */
  preview?: "card" | "label" | "none"
  /** Row pitch along the rail, in pixels. */
  rowSize?: number
  /** Resting mark length (or dot diameter), in pixels. */
  restLength?: number
  /** Mark length (or dot diameter) at the crest, in pixels. */
  peakLength?: number
  /** How far the wave reaches from the pointer, in rows. */
  radius?: number
  /** The chapter marked as current. Pass it to control the marker. */
  currentIndex?: number
  /** The starting current chapter when uncontrolled. */
  defaultCurrentIndex?: number
  /** Fires when a chapter is chosen, with the new current index. */
  onCurrentIndexChange?: (index: number, chapter: Chapter) => void
  /** Fires as the hovered or focused chapter changes; `null` on leave. */
  onActiveChange?: (chapter: Chapter | null, index: number) => void
  /** Accessible name for the rail. */
  label?: string
}

/**
 * A rail of marks that swell under the pointer the way the macOS Dock does,
 * with a preview of the chapter at the crest. Clicking, Enter or Space makes
 * that chapter current; arrow keys, Home and End move along the rail.
 */
function ChapterScrubber({
  chapters,
  orientation = "vertical",
  variant = "tick",
  size = "default",
  side,
  align = "edge",
  preview = "card",
  rowSize,
  restLength,
  peakLength,
  radius = 4,
  currentIndex: currentIndexProp,
  defaultCurrentIndex,
  onCurrentIndexChange,
  onActiveChange,
  label = "Chapters",
  className,
  style,
  ...props
}: ChapterScrubberProps) {
  const vertical = orientation === "vertical"
  const preset = SIZES[variant][size]
  const metrics: Metrics = {
    rowSize: rowSize ?? preset.rowSize,
    rest: restLength ?? preset.rest,
    peak: peakLength ?? preset.peak,
    thickness: preset.thickness,
  }
  const preferredSide: Side = side ?? (vertical ? "right" : "top")

  const reduceMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const railRef = React.useRef<HTMLDivElement>(null)
  const previewRef = React.useRef<HTMLDivElement>(null)
  const optionsRef = React.useRef<Array<HTMLButtonElement | null>>([])
  const baseId = React.useId()
  const optionId = (index: number) => `${baseId}-option-${index}`

  const rawPointer = useMotionValue(0)
  const rawStrength = useMotionValue(0)
  const springPointer = useSpring(rawPointer, POINTER_SPRING)
  const springStrength = useSpring(rawStrength, STRENGTH_SPRING)
  // Reduced motion keeps the wave's shape but drops the springs, so it
  // appears and follows instantly instead of easing.
  const pointer = reduceMotion ? rawPointer : springPointer
  const strength = reduceMotion ? rawStrength : springStrength

  const [uncontrolledCurrent, setUncontrolledCurrent] =
    React.useState(defaultCurrentIndex)
  const currentIndex = currentIndexProp ?? uncontrolledCurrent

  const [activeIndex, setActiveIndex] = React.useState(0)
  const [engaged, setEngaged] = React.useState(false)
  const [flipped, setFlipped] = React.useState(false)
  const [previewSize, setPreviewSize] = React.useState(0)
  const hoveringRef = React.useRef(false)
  const focusedRef = React.useRef<number | null>(null)
  const activeRef = React.useRef(0)

  const last = chapters.length - 1
  const railLength = chapters.length * metrics.rowSize

  const commitActive = React.useCallback((index: number) => {
    if (index === activeRef.current) return
    activeRef.current = index
    setActiveIndex(index)
  }, [])

  React.useEffect(() => {
    onActiveChange?.(
      engaged ? (chapters[activeIndex] ?? null) : null,
      engaged ? activeIndex : -1
    )
  }, [engaged, activeIndex, chapters, onActiveChange])

  // The preview is clamped to the rail's length, which needs its size along
  // the rail.
  React.useLayoutEffect(() => {
    const node = previewRef.current
    if (!node) return
    setPreviewSize(vertical ? node.offsetHeight : node.offsetWidth)
  }, [activeIndex, vertical, preview])

  React.useEffect(() => {
    if (!engaged || preview === "none") return
    const root = rootRef.current
    const view = root?.ownerDocument.defaultView
    if (!root || !view) return
    const rect = root.getBoundingClientRect()
    const node = previewRef.current
    const need =
      (vertical
        ? (node?.offsetWidth ?? CARD_WIDTH)
        : (node?.offsetHeight ?? 120)) +
      GAP +
      8
    const before = vertical ? rect.left : rect.top
    const after = vertical
      ? view.innerWidth - rect.right
      : view.innerHeight - rect.bottom
    const wantsAfter = preferredSide === "right" || preferredSide === "bottom"
    let useAfter = wantsAfter
    if (useAfter && after < need && before >= need) useAfter = false
    if (!useAfter && before < need && after >= need) useAfter = true
    setFlipped(useAfter !== wantsAfter)
  }, [engaged, activeIndex, preferredSide, vertical, preview])

  const opposite: Record<Side, Side> = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top",
  }
  const resolvedSide = flipped ? opposite[preferredSide] : preferredSide

  const previewOffset = useTransform(pointer, (p) => {
    const half = previewSize / 2
    const center = clamp(
      (p + 0.5) * metrics.rowSize,
      half,
      Math.max(half, railLength - half)
    )
    return center - half
  })
  const previewScale = useTransform(strength, [0, 1], [0.97, 1])
  const drift = resolvedSide === "right" || resolvedSide === "bottom" ? -6 : 6
  const previewShift = useTransform(strength, [0, 1], [drift, 0])

  const engageAt = (pointerRow: number, activeAt: number) => {
    rawPointer.set(pointerRow)
    rawStrength.set(1)
    commitActive(clamp(activeAt, 0, last))
    if (!engaged) setEngaged(true)
  }

  const release = () => {
    rawStrength.set(0)
    setEngaged(false)
  }

  const choose = (index: number) => {
    const chapter = chapters[index]
    if (!chapter) return
    if (currentIndexProp === undefined) setUncontrolledCurrent(index)
    onCurrentIndexChange?.(index, chapter)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current
    if (!rail) return
    const rect = rail.getBoundingClientRect()
    const offset = vertical
      ? event.clientY - rect.top
      : event.clientX - rect.left
    const row = offset / metrics.rowSize - 0.5
    hoveringRef.current = true
    engageAt(clamp(row, -0.5, last + 0.5), Math.round(row))
  }

  const handlePointerLeave = () => {
    hoveringRef.current = false
    if (focusedRef.current != null) rawPointer.set(focusedRef.current)
    else release()
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    focusedRef.current = null
    if (!hoveringRef.current) release()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next = focusedRef.current ?? activeRef.current
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = Math.min(last, next + 1)
        break
      case "ArrowUp":
      case "ArrowLeft":
        next = Math.max(0, next - 1)
        break
      case "Home":
        next = 0
        break
      case "End":
        next = last
        break
      default:
        return
    }
    event.preventDefault()
    optionsRef.current[next]?.focus()
  }

  // Exactly one option is tabbable at a time.
  const rovingIndex = engaged ? activeIndex : (currentIndex ?? 0)
  const crossSize = Math.max(metrics.peak, 1)

  // Ticks sit against the edge the preview opens from, so they grow toward
  // it; `center` grows both ways from the middle line.
  const markAlign =
    align === "center" || variant === "dot"
      ? "center"
      : resolvedSide === "right" || resolvedSide === "bottom"
        ? "start"
        : "end"

  const chapter = chapters[activeIndex]
  const placement = {
    right: { left: crossSize + GAP },
    left: { right: crossSize + GAP },
    bottom: { top: crossSize + GAP },
    top: { bottom: crossSize + GAP },
  }[resolvedSide]

  return (
    <div
      ref={rootRef}
      data-slot="chapter-scrubber"
      data-orientation={orientation}
      data-variant={variant}
      style={{
        ...(vertical ? { width: crossSize } : { height: crossSize }),
        ...style,
      }}
      className={cn("relative shrink-0", className)}
      {...props}
    >
      <div
        ref={railRef}
        role="listbox"
        aria-label={label}
        aria-orientation={orientation}
        aria-activedescendant={engaged ? optionId(activeIndex) : undefined}
        className={cn("flex", vertical ? "w-full flex-col" : "h-full flex-row")}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        {chapters.map((item, index) => {
          const isCurrent = index === currentIndex
          const description =
            typeof item.description === "string" ? `. ${item.description}` : ""
          return (
            <button
              ref={(node) => {
                optionsRef.current[index] = node
              }}
              key={item.id}
              id={optionId(index)}
              type="button"
              role="option"
              aria-selected={isCurrent}
              aria-label={`${item.title}${description}`}
              tabIndex={index === rovingIndex ? 0 : -1}
              onFocus={() => {
                focusedRef.current = index
                engageAt(index, index)
              }}
              onClick={() => choose(index)}
              style={
                vertical
                  ? { height: metrics.rowSize }
                  : { width: metrics.rowSize }
              }
              className={cn(
                "flex shrink-0 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
                vertical ? "w-full items-center" : "h-full justify-center",
                vertical
                  ? {
                      start: "justify-start",
                      center: "justify-center",
                      end: "justify-end",
                    }[markAlign]
                  : {
                      start: "items-start",
                      center: "items-center",
                      end: "items-end",
                    }[markAlign]
              )}
            >
              <Mark
                index={index}
                pointer={pointer}
                strength={strength}
                radius={radius}
                metrics={metrics}
                variant={variant}
                orientation={orientation}
                isCurrent={isCurrent}
              />
            </button>
          )
        })}
      </div>

      {chapter && preview !== "none" ? (
        <motion.div
          ref={previewRef}
          aria-hidden="true"
          data-slot="chapter-scrubber-preview"
          style={{
            ...(vertical ? { top: previewOffset } : { left: previewOffset }),
            ...(vertical ? { x: previewShift } : { y: previewShift }),
            scale: previewScale,
            opacity: strength,
            ...placement,
          }}
          className={cn(
            "pointer-events-none absolute z-10",
            {
              right: "origin-left",
              left: "origin-right",
              bottom: "origin-top",
              top: "origin-bottom",
            }[resolvedSide],
            preview === "card"
              ? "w-[260px] rounded-2xl border border-border bg-popover px-4 py-3.5 text-popover-foreground shadow-lg"
              : "w-max max-w-[220px]"
          )}
        >
          {preview === "card" ? (
            <>
              {chapter.meta ? (
                <div className="mb-1 text-xs font-medium text-muted-foreground tabular-nums">
                  {chapter.meta}
                </div>
              ) : null}
              <div className="truncate text-sm leading-snug font-semibold tracking-[-0.01em]">
                {chapter.title}
              </div>
              {chapter.description ? (
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {chapter.description}
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex items-baseline gap-2 text-sm whitespace-nowrap">
              {chapter.meta ? (
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {chapter.meta}
                </span>
              ) : null}
              <span className="truncate font-medium text-foreground">
                {chapter.title}
              </span>
            </div>
          )}
        </motion.div>
      ) : null}
    </div>
  )
}

export { ChapterScrubber, type Chapter, type ChapterScrubberProps }
