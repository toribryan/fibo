"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type TokenRow = {
  /** The raw value, as written in CSS. */
  base: string
  /** The primitive it is named as, e.g. a palette step. */
  primitive: string
  /** The semantic role that points at the primitive. */
  semantic: string
  /** What the role is for, shown under the semantic chip when `showUse` is set. */
  use?: string
  /** The value and primitive the role resolves to under the dark theme, when they differ. */
  dark?: {
    base: string
    primitive: string
  }
}

const TIERS = ["Base", "Primitive", "Semantic"] as const

const SCRAMBLE_CHARS = "_!X$0-+*#"

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
}

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

/**
 * Whether the `dark` class is on the document, the way next-themes sets it.
 * `null` until the client has looked, so the first real value is taken as a
 * baseline rather than a change.
 */
function useIsDark() {
  return React.useSyncExternalStore<boolean | null>(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => null
  )
}

function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

function useInView(ref: React.RefObject<Element | null>) {
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting))
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return inView
}

/**
 * Text that holds still until it changes, then spends a moment as noise
 * before settling on the new value, resolving left to right. Until `live`
 * is set the text is only a placeholder, so no change is played.
 */
function ScrambleText({
  text,
  live,
  reduceMotion,
  duration = 1000,
}: {
  text: string
  /** Whether `text` is the real value rather than a server-side guess. */
  live: boolean
  reduceMotion: boolean
  /** Milliseconds the noise runs for after a change. */
  duration?: number
}) {
  const settled = React.useRef<string | null>(null)
  const [noise, setNoise] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!live) return
    const previous = settled.current
    settled.current = text
    if (previous === null || previous === text || reduceMotion) return

    const startedAt = performance.now()
    let frame = 0
    let lastStep = -1
    const loop = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const step = Math.floor(progress * (duration / 40))
      if (step !== lastStep) {
        lastStep = step
        const revealed = Math.floor(progress * text.length)
        let next = text.slice(0, revealed)
        for (let i = revealed; i < text.length; i++) {
          next += text[i] === " " ? " " : randomChar()
        }
        setNoise(next)
      }
      if (progress < 1) {
        frame = window.requestAnimationFrame(loop)
      } else {
        setNoise(null)
      }
    }
    frame = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(frame)
  }, [text, live, duration, reduceMotion])

  return (
    <span className="relative inline-block whitespace-pre">
      <span className="invisible" aria-hidden>
        {text}
      </span>
      <span className="absolute inset-0" aria-hidden>
        {noise ?? text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  )
}

/**
 * A hairline with a pulse travelling along it. Fills whatever cell it is
 * in; `vertical` runs it top to bottom for the stacked layout. The pulse is
 * a Web Animation on the stroke offset, so it needs no keyframes in the
 * consumer's CSS.
 */
function Wire({
  delay,
  vertical,
  active,
}: {
  /** Seconds before this wire's pulse starts, to stagger the rows. */
  delay: number
  vertical: boolean
  /** Whether the pulse should be running. */
  active: boolean
}) {
  const pulse = React.useRef<SVGLineElement>(null)

  React.useEffect(() => {
    const node = pulse.current
    if (!node || !active) return
    const animation = node.animate(
      [{ strokeDashoffset: 1.25 }, { strokeDashoffset: -1.25 }],
      { duration: 3500, delay: delay * 1000, iterations: Infinity }
    )
    return () => animation.cancel()
  }, [active, delay])

  const coords = vertical
    ? { x1: 4, y1: 0, x2: 4, y2: 100 }
    : { x1: 0, y1: 4, x2: 100, y2: 4 }

  return (
    <svg
      className={vertical ? "h-6 w-2" : "h-2 w-full"}
      viewBox={vertical ? "0 0 8 100" : "0 0 100 8"}
      preserveAspectRatio="none"
      aria-hidden
    >
      <line
        {...coords}
        className="stroke-border"
        vectorEffect="non-scaling-stroke"
      />
      {active ? (
        <line
          ref={pulse}
          {...coords}
          className="stroke-muted-foreground"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray="0.25 1"
          strokeDashoffset={1.25}
        />
      ) : null}
    </svg>
  )
}

function Chip({
  color,
  className,
  children,
}: {
  color: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      data-slot="token-flow-chip"
      className={cn(
        "inline-flex h-6 max-w-fit items-center gap-1.5 justify-self-center rounded-full border border-border bg-card pr-2 pl-1.5 font-mono text-xs whitespace-nowrap text-card-foreground",
        className
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full ring-1 ring-border transition-colors duration-1000"
        style={{ background: color }}
        aria-hidden
      />
      {children}
    </span>
  )
}

type TokenFlowProps = Omit<React.ComponentProps<"div">, "children"> & {
  rows: TokenRow[]
  /** Print each row's `use` under its semantic chip. */
  showUse?: boolean
  /** Force a theme instead of following the document's `dark` class. */
  theme?: "light" | "dark"
}

/**
 * How a color travels through the token tiers: a raw value, the primitive
 * that names it, and the semantic role that uses it. One row per color,
 * wired left to right across a dotted plate, with a pulse travelling along
 * each wire. Rows that carry a `dark` value swap to it when the theme
 * changes, scrambling for a moment on the way.
 */
function TokenFlow({
  rows,
  showUse = false,
  theme,
  className,
  ...props
}: TokenFlowProps) {
  const documentDark = useIsDark()
  const isDark = theme ? theme === "dark" : documentDark === true
  const live = theme !== undefined || documentDark !== null
  const narrow = useMediaQuery("(max-width: 639px)")
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const plate = React.useRef<HTMLDivElement>(null)
  const inView = useInView(plate)
  const pulse = inView && !reduceMotion

  return (
    <div
      ref={plate}
      data-slot="token-flow"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-muted px-6 py-4",
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />

      <div className="relative grid grid-cols-1 items-center gap-y-6 sm:grid-cols-[auto_minmax(2rem,1fr)_auto_minmax(2rem,1fr)_auto] sm:gap-x-3 sm:gap-y-3">
        <div className="contents" aria-hidden>
          {TIERS.map((tier, i) => (
            <div key={tier} className="contents">
              {i > 0 ? <div className="hidden sm:block" /> : null}
              <p className="hidden text-center font-mono text-[10px] tracking-wide text-muted-foreground uppercase sm:block">
                {tier}
              </p>
            </div>
          ))}
        </div>

        {rows.map((row, i) => {
          const value = isDark && row.dark ? row.dark : row
          return (
            <div
              key={`${row.semantic}-${i}`}
              className="flex flex-col items-center gap-1.5 sm:col-span-5 sm:grid sm:grid-cols-subgrid sm:gap-0"
            >
              <Chip color={value.base}>
                <span className="sr-only">{TIERS[0]} </span>
                <ScrambleText
                  text={value.base}
                  live={live}
                  reduceMotion={reduceMotion}
                />
              </Chip>
              <Wire delay={i * 0.5} vertical={narrow} active={pulse} />
              <Chip color={value.base}>
                <span className="sr-only">{TIERS[1]} </span>
                <ScrambleText
                  text={value.primitive}
                  live={live}
                  reduceMotion={reduceMotion}
                />
              </Chip>
              <Wire delay={i * 0.5 + 0.8} vertical={narrow} active={pulse} />
              <div className="flex flex-col items-center gap-1 justify-self-center">
                <Chip color={value.base}>
                  <span className="sr-only">{TIERS[2]} </span>
                  {row.semantic}
                </Chip>
                {showUse && row.use ? (
                  <span className="font-mono text-[9px] whitespace-nowrap text-muted-foreground">
                    {row.use}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { TokenFlow, type TokenRow }
