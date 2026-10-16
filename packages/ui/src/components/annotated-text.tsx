"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cva } from "class-variance-authority"

import { mergeRefs } from "@workspace/ui/lib/merge-refs"
import { cn } from "@workspace/ui/lib/utils"

/** The mark drawn on the text. */
type AnnotatedTextVariant =
  | "underline"
  | "wavy"
  | "double"
  | "highlight"
  | "circle"
  | "box"
  | "bracket"
  | "strike"
  | "cross"
  | "arrow"

/** What the mark means, if anything. Color only carries meaning in fibo. */
type AnnotatedTextTone =
  "default" | "muted" | "info" | "success" | "warning" | "destructive"

type Size = { w: number; h: number; y: number }

const markVariants = cva("fill-none", {
  variants: {
    tone: {
      default: "stroke-foreground",
      muted: "stroke-muted-foreground",
      info: "stroke-info",
      success: "stroke-success",
      warning: "stroke-warning",
      destructive: "stroke-destructive",
    },
  },
  defaultVariants: { tone: "default" },
})

// A highlight sits behind the text, so it takes the quiet fill of each tone.
const highlightVariants = cva("fill-none", {
  variants: {
    tone: {
      default: "stroke-highlight",
      muted: "stroke-muted",
      info: "stroke-info-subtle",
      success: "stroke-success-subtle",
      warning: "stroke-warning-subtle",
      destructive: "stroke-destructive-subtle",
    },
  },
  defaultVariants: { tone: "default" },
})

/*
 * A small seeded generator, so a phrase gets the same wobble on every render,
 * device and server, and two different phrases don't wobble alike.
 */
function seeded(seed: string) {
  let hash = 2166136261
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  let state = hash >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return (state / 2 ** 32) * 2 - 1
  }
}

const fmt = (n: number) => Math.round(n * 10) / 10

function line(points: [number, number][]) {
  return points
    .map(([x, y], i) => `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`)
    .join(" ")
}

/*
 * One gently bowed stroke from start to end, the way a pen drifts: the
 * control point sits off the straight line by up to `bow` pixels.
 */
function bowed(
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
  bow: number,
  rand: () => number
) {
  const cx = (x1 + x2) / 2 + rand() * bow
  const cy = (y1 + y2) / 2 + rand() * bow
  return `M${fmt(x1)} ${fmt(y1)} Q${fmt(cx)} ${fmt(cy)} ${fmt(x2)} ${fmt(y2)}`
}

/*
 * Paths in the text's own pixels, origin at its top left. Text height drives
 * every offset, so a mark keeps its proportions from a caption to a display
 * heading. Each entry is drawn in order when the mark animates in.
 */
function markPaths(
  variant: AnnotatedTextVariant,
  { w, h }: Size,
  rand: () => number
): string[] {
  const j = h * 0.06
  const base = h * 0.98
  switch (variant) {
    case "underline":
      return [
        bowed([-j, base + rand() * j], [w + j, base + rand() * j], j, rand),
      ]
    case "double":
      return [
        bowed([-j, base], [w + j, base + rand() * j], j, rand),
        bowed(
          [j, base + h * 0.16],
          [w - j, base + h * 0.16 + rand() * j],
          j,
          rand
        ),
      ]
    case "wavy": {
      const wave = h * 0.32
      const amp = h * 0.06
      const count = Math.max(2, Math.round(w / wave))
      const step = w / count
      let d = `M0 ${fmt(base)}`
      for (let i = 0; i < count; i++) {
        const x = i * step
        const up = i % 2 ? amp : -amp
        d += ` Q${fmt(x + step / 2)} ${fmt(base + up * 2)} ${fmt(x + step)} ${fmt(base)}`
      }
      return [d]
    }
    case "highlight":
      return [
        bowed(
          [-h * 0.12, h * 0.58 + rand() * j],
          [w + h * 0.12, h * 0.54 + rand() * j],
          j * 0.5,
          rand
        ),
      ]
    case "strike":
      return [bowed([-j, h * 0.56 + rand() * j], [w + j, h * 0.5], j, rand)]
    case "cross":
      return [
        bowed([-j, h * 0.15], [w + j, h * 0.9], j * 2, rand),
        bowed([w + j, h * 0.1], [-j, h * 0.88], j * 2, rand),
      ]
    case "circle": {
      // A loop that starts above the left of the text and runs a little past
      // where it began, so the ends cross the way a hand-drawn ring does.
      const cx = w / 2
      const cy = h / 2
      const rx = w / 2 + h * 0.4
      const ry = h / 2 + h * 0.3
      const tilt = rand() * 0.04
      const start = -Math.PI * 0.62
      const points: [number, number][] = []
      const steps = 48
      for (let i = 0; i <= steps; i++) {
        const t = start + (i / steps) * Math.PI * 2.08
        const drift = 0.96 + (i / steps) * 0.12 + Math.sin(t * 3) * 0.015
        const x = cx + Math.cos(t) * rx * drift
        const y = cy + Math.sin(t) * ry * drift
        points.push([x, y + (x - cx) * tilt])
      }
      return [line(points)]
    }
    case "box": {
      const p = h * 0.22
      const l = -p
      const r = w + p
      const t = -p * 0.6
      const b = h + p * 0.6
      // Each side overshoots the corner a little, as boxes drawn by hand do.
      const o = p * 0.5
      return [
        line([
          [l + rand() * j, t - o * 0.3],
          [r + o, t + rand() * j],
          [r + rand() * j, b + o * 0.6],
          [l - o * 0.4, b + rand() * j],
          [l + rand() * j, t - o],
        ]),
      ]
    }
    case "bracket": {
      const p = h * 0.24
      const arm = h * 0.22
      return [
        line([
          [-p + arm, -h * 0.08],
          [-p, -h * 0.06 + rand() * j],
          [-p + rand() * j, h * 1.08],
          [-p + arm, h * 1.1],
        ]),
        line([
          [w + p - arm, -h * 0.08],
          [w + p, -h * 0.06 + rand() * j],
          [w + p + rand() * j, h * 1.08],
          [w + p - arm, h * 1.1],
        ]),
      ]
    }
    case "arrow": {
      const end: [number, number] = [w + h * 0.5, base - h * 0.08]
      const head = h * 0.28
      return [
        bowed([-j, base + h * 0.06], end, j * 2, rand),
        line([
          [end[0] - head, end[1] - head * 0.7],
          end,
          [end[0] - head * 0.9, end[1] + head * 0.6],
        ]),
      ]
    }
  }
}

function strokeWidth(variant: AnnotatedTextVariant, h: number) {
  if (variant === "highlight") return h * 0.78
  return Math.max(1.5, h * 0.075)
}

// Marks drawn round the text reach past it, so they keep clear of the
// neighboring words.
const ENCLOSING: AnnotatedTextVariant[] = ["circle", "box", "bracket"]

// Ascender to descender for most UI faces, in em.
const GLYPH_HEIGHT = 1.2

// How long a mark takes to draw in, and the pause between its strokes.
const DRAW_MS = 520
const STAGGER_MS = 160

type AnnotatedTextProps = React.ComponentProps<"span"> & {
  /** The mark drawn on the text. */
  variant?: AnnotatedTextVariant
  /** What the mark means. Color only carries meaning, so leave it at default otherwise. */
  tone?: AnnotatedTextTone
  /** Draws the mark in the first time it scrolls into view, rather than showing it at once. */
  animate?: boolean
  /** Milliseconds to wait before drawing in, for staging several marks. */
  delay?: number
}

function AnnotatedText({
  variant = "underline",
  tone = "default",
  animate = false,
  delay = 0,
  className,
  children,
  ref,
  ...props
}: AnnotatedTextProps) {
  const root = React.useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()
  const [size, setSize] = React.useState<Size | null>(null)
  const [text, setText] = React.useState("")
  const [seen, setSeen] = React.useState(false)
  const drawn = !animate || seen

  // The mark is drawn in the text's own pixels, so it follows font loading,
  // resizing and type changes rather than stretching a fixed drawing.
  React.useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () => {
      // The glyphs, not the line box: loose leading would push an underline
      // halfway to the next line.
      const h = Math.min(
        el.offsetHeight,
        parseFloat(getComputedStyle(el).fontSize) * GLYPH_HEIGHT
      )
      setSize({ w: el.offsetWidth, h, y: (el.offsetHeight - h) / 2 })
      setText(el.textContent ?? "")
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const el = root.current
    if (!animate || !el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setSeen(true)
        observer.disconnect()
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [animate])

  const paths = React.useMemo(
    () =>
      size && size.w > 0
        ? markPaths(variant, size, seeded(`${variant}:${text}`))
        : [],
    [variant, size, text]
  )
  const behind = variant === "highlight"
  const still = reduceMotion || !animate

  return (
    <span
      ref={mergeRefs(root, ref)}
      data-slot="annotated-text"
      data-variant={variant}
      data-tone={tone}
      data-drawn={drawn ? "" : undefined}
      className={cn(
        "relative isolate inline-block whitespace-nowrap",
        ENCLOSING.includes(variant) && "mx-[0.45em]",
        className
      )}
      {...props}
    >
      {children}
      {size && (
        <svg
          data-slot="annotated-text-mark"
          aria-hidden="true"
          width={size.w}
          height={size.h}
          style={{ top: size.y }}
          className={cn(
            "pointer-events-none absolute left-0 overflow-visible",
            behind && "-z-10"
          )}
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength={1}
              strokeWidth={strokeWidth(variant, size.h)}
              strokeLinecap={behind ? "butt" : "round"}
              strokeLinejoin="round"
              className={(behind ? highlightVariants : markVariants)({ tone })}
              style={
                still
                  ? undefined
                  : {
                      strokeDasharray: "1 2",
                      strokeDashoffset: drawn ? 0 : 1,
                      transition: `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.65, 0, 0.35, 1) ${delay + i * STAGGER_MS}ms`,
                    }
              }
            />
          ))}
        </svg>
      )}
    </span>
  )
}

/*
 * Two ways to make a sticker. An emoji or image already has a solid
 * silhouette, so it gets a die-cut paper edge: stacked drop shadows in em
 * that follow its outline. A line icon has holes the edge would trace stroke
 * by stroke, so it is printed in ink on a small paper tile instead.
 */
const CUTOUT =
  "[filter:drop-shadow(0.05em_0_0_var(--sticker-edge))_drop-shadow(-0.05em_0_0_var(--sticker-edge))_drop-shadow(0_0.05em_0_var(--sticker-edge))_drop-shadow(0_-0.05em_0_var(--sticker-edge))_drop-shadow(0_0.04em_0.06em_var(--sticker-shadow))]"
const TILE =
  "rounded-[0.24em] bg-sticker-edge p-[0.17em] text-sticker-ink shadow-[0_0.03em_0.08em_var(--sticker-shadow)] [&>svg]:stroke-[2.5]"

function isCutout(icon: React.ReactNode) {
  return (
    typeof icon === "string" ||
    (React.isValidElement(icon) && icon.type === "img")
  )
}

const PILL = "rounded-full bg-chip py-[0.04em] leading-[1.1] whitespace-nowrap"

type AnnotatedTextChipProps = React.ComponentProps<"span"> & {
  /** A sticker at the chip's start. An emoji or `<img>` is die-cut; an icon is printed on a paper tile. Decorative. */
  icon?: React.ReactNode
  /** Tilts the sticker, in degrees. Defaults to a small tilt from the text. */
  tilt?: number
}

function chipTilt(children: React.ReactNode) {
  return typeof children === "string" ? seeded(children)() * 9 : -6
}

function AnnotatedTextChip({
  icon,
  tilt,
  className,
  children,
  ...props
}: AnnotatedTextChipProps) {
  return (
    <span
      data-slot="annotated-text-chip"
      className={cn(
        "inline-block ps-[0.12em] pe-[0.32em]",
        PILL,
        !icon && "ps-[0.32em]",
        className
      )}
      {...props}
    >
      {icon && (
        <ChipSticker tilt={tilt ?? chipTilt(children)}>{icon}</ChipSticker>
      )}
      {children}
    </span>
  )
}

function ChipSticker({
  tilt,
  children,
}: {
  tilt: number
  children: React.ReactNode
}) {
  return (
    <span
      data-slot="annotated-text-chip-icon"
      aria-hidden="true"
      style={{ rotate: `${tilt}deg` }}
      className={cn(
        "me-[0.18em] inline-flex size-[1.1em] items-center justify-center align-[-0.2em] leading-none [&>img]:size-full [&>img]:object-contain [&>svg]:size-full",
        isCutout(children) ? CUTOUT : TILE
      )}
    >
      {children}
    </span>
  )
}

type AnnotatedTextCycleItem = {
  /** The word or phrase. */
  label: string
  /** Its sticker. */
  icon?: React.ReactNode
}

type AnnotatedTextCycleProps = Omit<
  React.ComponentProps<"span">,
  "children"
> & {
  /** What the chip cycles through, in order. Needs at least one. */
  items: AnnotatedTextCycleItem[]
  /** Milliseconds each item holds. */
  interval?: number
  /** Keeps cycling. Off, it runs through once and settles on the last item. */
  loop?: boolean
  /** Stops on the current item, for a pause button or a hidden tab. */
  paused?: boolean
  /** What screen readers hear in place of the changing word. Defaults to the first item. */
  label?: string
}

function AnnotatedTextCycle({
  items,
  interval = 2000,
  loop = false,
  paused = false,
  label,
  className,
  onPointerEnter,
  onPointerLeave,
  ...props
}: AnnotatedTextCycleProps) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [hovered, setHovered] = React.useState(false)
  const [width, setWidth] = React.useState<number | null>(null)
  const content = React.useRef<HTMLSpanElement>(null)

  const last = items.length - 1
  const done = !loop && index >= last
  const still = reduceMotion || paused || hovered || done || items.length < 2

  React.useEffect(() => {
    if (still) return
    const timer = window.setTimeout(
      () => setIndex((i) => (i + 1) % items.length),
      interval
    )
    return () => window.clearTimeout(timer)
  }, [still, index, interval, items.length])

  React.useLayoutEffect(() => {
    const el = content.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const item = items[Math.min(index, last)]
  if (!item) return null

  return (
    <span
      data-slot="annotated-text-cycle"
      data-index={index}
      className={cn("inline-block", className)}
      onPointerEnter={(event) => {
        setHovered(true)
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        setHovered(false)
        onPointerLeave?.(event)
      }}
      {...props}
    >
      <span className="sr-only">{label ?? items[0]?.label}</span>
      <motion.span
        aria-hidden="true"
        className={cn(
          "inline-flex [overflow-x:clip] [overflow-clip-margin:0.25em]",
          PILL
        )}
        initial={false}
        animate={width === null ? undefined : { width }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", bounce: 0.2, duration: 0.5 }
        }
      >
        <span
          ref={content}
          className="relative inline-block ps-[0.12em] pe-[0.32em]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={item.label}
              className="inline-block"
              initial={{ opacity: 0, y: "0.5em", filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: "-0.5em", filter: "blur(4px)" }}
              transition={{ duration: reduceMotion ? 0 : 0.32 }}
            >
              {item.icon && (
                <ChipSticker tilt={chipTilt(item.label)}>
                  {item.icon}
                </ChipSticker>
              )}
              {item.label}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.span>
    </span>
  )
}

export { AnnotatedText, AnnotatedTextChip, AnnotatedTextCycle }
export type {
  AnnotatedTextProps,
  AnnotatedTextVariant,
  AnnotatedTextTone,
  AnnotatedTextChipProps,
  AnnotatedTextCycleProps,
  AnnotatedTextCycleItem,
}
