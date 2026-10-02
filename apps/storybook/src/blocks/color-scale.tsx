import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { DARK, LIGHT, primitive } from "./color-tokens.js"
import { LeaderLines, useAnnotations, type Callout } from "./leader-lines.js"

type Mode = "light" | "dark"

// Tailwind's neutral ramp, light to dark, with white in front. Spelled out
// in full so Tailwind generates each class.
const RAMP = [
  ["white", "bg-white"],
  ["50", "bg-neutral-50"],
  ["100", "bg-neutral-100"],
  ["200", "bg-neutral-200"],
  ["300", "bg-neutral-300"],
  ["400", "bg-neutral-400"],
  ["500", "bg-neutral-500"],
  ["600", "bg-neutral-600"],
  ["700", "bg-neutral-700"],
  ["800", "bg-neutral-800"],
  ["900", "bg-neutral-900"],
  ["950", "bg-neutral-950"],
] as const

/*
 * Step 1 is always the page. Light mode reads the ramp from white and dark
 * mode from 950, so most tokens keep their step number in both: background
 * is 1, muted is 3, ring is 6, muted text is 7, primary is 11.
 */
function stepOf(index: number, mode: Mode) {
  return mode === "light" ? index + 1 : RAMP.length - index
}

const BANDS = [
  { label: "Surfaces", from: 1, to: 2 },
  { label: "Fills and borders", from: 3, to: 4 },
  { label: "Focus and quiet text", from: 5, to: 10 },
  { label: "Solids and text", from: 11, to: 12 },
]

// Which ramp entry a token points at in a mode, and the alpha it's mixed
// at, if any: dark borders are white at a low alpha rather than a step.
function resolve(token: string, mode: Mode) {
  const name = primitive((mode === "dark" ? DARK : LIGHT)[token])
  const alpha = / at (\d+%)$/.exec(name)?.[1]
  const base = name.replace(/ at \d+%$/, "")
  const index = RAMP.findIndex(
    ([step]) => base === (step === "white" ? "white" : `neutral-${step}`)
  )
  return { name, alpha, index }
}

const NOISE = "_!X$0-+*#"
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/*
 * Text that runs as noise for a moment when it changes, resolving left to
 * right onto the new value, as Token flow's values do. The first value is
 * shown as is.
 */
function Scramble({
  text,
  duration = 500,
}: {
  text: string
  duration?: number
}) {
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
  const settled = useRef<string | null>(null)
  const [noise, setNoise] = useState<string | null>(null)

  useEffect(() => {
    const previous = settled.current
    settled.current = text
    if (previous === null || previous === text || reduced) return
    const started = performance.now()
    let frame = 0
    let tick = -1
    const loop = (now: number) => {
      const progress = Math.min((now - started) / duration, 1)
      const next = Math.floor(progress * (duration / 40))
      if (progress >= 1) return setNoise(null)
      if (next !== tick) {
        tick = next
        const revealed = Math.floor(progress * text.length)
        setNoise(
          text.slice(0, revealed) +
            Array.from(
              { length: text.length - revealed },
              () => NOISE[Math.floor(Math.random() * NOISE.length)]
            ).join("")
        )
      }
      frame = window.requestAnimationFrame(loop)
    }
    frame = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(frame)
  }, [text, duration, reduced])

  return <span aria-hidden="true">{noise ?? text}</span>
}

/*
 * Each callout sits on the side of the card nearest its part, in the same
 * order top to bottom, so no two lines cross. The button's fill and its
 * label each get a line, since they're two tokens.
 */
const CALLOUTS: Callout[] = [
  { token: "foreground", side: "left" },
  { token: "muted-foreground", side: "left" },
  { token: "border", side: "left" },
  { token: "muted", side: "left" },
  // The two surfaces are met near a corner, clear of the content: the card
  // at its foot, the page at its top.
  { token: "card", side: "left", landing: 0.96 },
  { token: "background", side: "right", landing: 0.08 },
  { token: "success", side: "right" },
  { token: "ring", side: "right" },
  { token: "primary", side: "right" },
  // A label inside a button, whose line comes in below the button and
  // rises into the text rather than cutting through the fill from the side.
  { token: "primary-foreground", side: "right", fromBelow: true },
]

/**
 * fibo's neutrals as a twelve-step scale, grouped by the job each step does,
 * above a card whose parts are labelled with the tokens that colour them.
 * Switching mode reverses the ramp under the fixed steps, and pointing at a
 * token or a step picks out the other.
 */
function ColorScale() {
  const [mode, setMode] = useState<Mode>(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  )
  const [active, setActive] = useState<
    { token: string } | { step: number } | null
  >(null)

  const frame = useRef<HTMLDivElement>(null)
  const columnNodes = useRef(new Map<string, HTMLElement>())
  const calloutNodes = useRef(new Map<string, HTMLElement>())
  const partNodes = useRef(new Map<string, HTMLElement>())
  const annotations = useAnnotations(
    frame,
    columnNodes,
    calloutNodes,
    partNodes,
    CALLOUTS
  )
  const lines = annotations?.lines ?? []

  const names = RAMP.map(([step]) =>
    step === "white" ? "white" : `neutral-${step}`
  )
  const ordered = mode === "light" ? names : [...names].reverse()
  const stepFor = (token: string) => {
    const { index } = resolve(token, mode)
    return index < 0 ? null : stepOf(index, mode)
  }
  const isActive = (token: string) =>
    active !== null &&
    ("token" in active
      ? active.token === token
      : stepFor(token) === active.step)
  const activeStep =
    active === null
      ? null
      : "step" in active
        ? active.step
        : stepFor(active.token)

  // A mouse picks by hovering; a tap picks and a second tap lets go, since
  // touch has no hover to end.
  const same = (
    a: { token: string } | { step: number } | null,
    b: { token: string } | { step: number }
  ) => JSON.stringify(a) === JSON.stringify(b)
  const pointAt = (next: { token: string } | { step: number }) => ({
    onPointerEnter: (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") setActive(next)
    },
    onPointerLeave: (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") setActive(null)
    },
    onClick: (event: ReactMouseEvent) => {
      const { pointerType } = event.nativeEvent as PointerEvent
      if (pointerType !== "touch" && pointerType !== "pen") return
      setActive((current) => (same(current, next) ? null : next))
    },
    // A tap focuses too, so only keyboard focus picks, or the tap's own
    // click would toggle it straight back off.
    onFocus: (event: ReactFocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(":focus-visible")) setActive(next)
    },
    onBlur: () => setActive(null),
  })

  // A run of steps under their headers. A header that spans the run's edge
  // is cut to it, so a band split across two rows is labelled in both.
  const scale = (first: number, last: number) => {
    const count = last - first + 1
    return (
      <div
        className="grid gap-x-1.5 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {BANDS.filter(({ from, to }) => to >= first && from <= last).map(
          ({ label, from, to }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-end gap-2"
              style={{
                gridColumn: `${Math.max(from, first) - first + 1} / ${Math.min(to, last) - first + 2}`,
              }}
            >
              <span className="text-center text-[11px] leading-tight text-balance text-muted-foreground sm:text-xs">
                {label}
              </span>
              <span className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          )
        )}
        {/* The steps stay put; each takes its colour for the mode, and its
        Tailwind name scrambles over to the new one. Names sit centred in
        fixed cells, so the scramble never moves anything. */}
        {Array.from({ length: count }, (_, i) => {
          const slot = first - 1 + i
          const [step, className] =
            RAMP[mode === "light" ? slot : RAMP.length - 1 - slot]!
          const picked = activeStep === slot + 1
          return (
            <button
              key={slot}
              type="button"
              aria-label={`Step ${slot + 1}`}
              aria-pressed={picked}
              {...pointAt({ step: slot + 1 })}
              className="flex flex-col gap-1.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
            >
              <span
                className={cn(
                  "text-center font-mono text-xs",
                  picked ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {slot + 1}
              </span>
              <span
                className={cn(
                  "h-10 rounded-md border border-border sm:h-12",
                  className,
                  picked &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                )}
              />
              <span className="text-center font-mono text-[10px] text-muted-foreground">
                <Scramble text={step} />
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // A part of the card, registered for its leader line and outlined while
  // its token is picked.
  const part = (token: string) => ({
    ref: (node: HTMLElement | null) => {
      if (node) partNodes.current.set(token, node)
      else partNodes.current.delete(token)
    },
    "data-picked": isActive(token) || undefined,
  })

  const values = mode === "dark" ? DARK : LIGHT
  const modeVars = Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`--${name}`, value])
  ) as CSSProperties

  const callout = ({ token, side }: Callout) => (
    <button
      key={token}
      type="button"
      ref={(node) => {
        if (node) calloutNodes.current.set(token, node)
        else calloutNodes.current.delete(token)
      }}
      {...pointAt({ token })}
      // Hidden until measured, so callouts never jump into place.
      style={{ top: annotations?.tops[token] ?? 0 }}
      className={cn(
        "absolute inset-x-0 flex flex-col gap-1 rounded-md px-2 py-0.5 transition-opacity duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
        side === "left" ? "items-end text-right" : "items-start text-left",
        annotations?.tops[token] === undefined && "invisible",
        active && !isActive(token) && "opacity-40"
      )}
    >
      <span className="font-mono text-xs whitespace-nowrap text-foreground">
        --{token}
      </span>
    </button>
  )

  return (
    // The whole exhibit takes the chosen mode's tokens, whatever the page is
    // in, and every colour in it eases across when the mode changes.
    <figure
      style={modeVars}
      className="my-6 flex flex-col gap-8 rounded-xl border border-border bg-card p-4 text-foreground transition-colors duration-500 motion-reduce:transition-none sm:p-6 [&_*]:transition-[color,background-color,border-color,outline-color,fill,stroke,opacity,box-shadow] [&_*]:duration-500 motion-reduce:[&_*]:transition-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <figcaption className="flex max-w-md flex-col items-start gap-2">
          <Badge variant="outline">Tailwind neutral</Badge>
          <span className="text-sm text-muted-foreground">
            Pick a token or a step to trace it, and switch modes to watch the
            ramp turn over.
          </span>
        </figcaption>
        <div
          role="group"
          aria-label="Mode"
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          {(["light", "dark"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className="rounded-md px-3 py-1 text-sm text-muted-foreground capitalize outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <span className="sr-only">
          In {mode} mode, steps 1 to 12 are {ordered.join(", ")}.
        </span>
        {/* Phones get the twelve steps as two rows of six, so the whole
        ramp shows without scrolling. */}
        <div className="flex flex-col gap-6 sm:hidden">
          {scale(1, 6)}
          {scale(7, 12)}
        </div>
        <div className="hidden sm:block">{scale(1, 12)}</div>
      </div>

      <div
        ref={frame}
        className="relative flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-10"
      >
        <LeaderLines
          lines={lines}
          isActive={isActive}
          anyActive={active !== null}
        />

        <div
          ref={(node) => {
            if (node) columnNodes.current.set("left", node)
            else columnNodes.current.delete("left")
          }}
          className="relative hidden w-44 shrink-0 self-stretch md:block"
        >
          {CALLOUTS.filter((c) => c.side === "left").map((c) => callout(c))}
        </div>

        <Specimen part={part} />

        <div
          ref={(node) => {
            if (node) columnNodes.current.set("right", node)
            else columnNodes.current.delete("right")
          }}
          className="relative hidden w-44 shrink-0 self-stretch md:block"
        >
          {CALLOUTS.filter((c) => c.side === "right").map((c) => callout(c))}
        </div>

        {/* On narrow screens the callouts list under the card instead. */}
        <div className="flex w-full flex-wrap justify-center gap-1.5 md:hidden">
          {CALLOUTS.map(({ token }) => (
            <button
              key={token}
              type="button"
              aria-pressed={isActive(token)}
              {...pointAt({ token })}
              className="rounded-full border border-border px-2.5 py-1 font-mono text-xs whitespace-nowrap text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle aria-pressed:border-foreground aria-pressed:text-foreground"
            >
              --{token}
            </button>
          ))}
        </div>
      </div>
    </figure>
  )
}

type PartProps = (token: string) => {
  ref: (node: HTMLElement | null) => void
  "data-picked"?: true
}

const PICKED =
  "data-picked:outline-2 data-picked:outline-offset-2 data-picked:outline-foreground data-picked:outline-dashed"

// A small settings card on its own page, drawn with the tokens it's
// labelled with.
function Specimen({ part }: { part: PartProps }): ReactNode {
  return (
    <div
      aria-hidden="true"
      {...part("background")}
      className={cn(
        "w-full max-w-72 shrink-0 rounded-xl border border-dashed border-border bg-background p-5 transition-colors duration-500 motion-reduce:transition-none",
        PICKED
      )}
    >
      <div
        {...part("card")}
        className={cn(
          "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors duration-500 motion-reduce:transition-none",
          PICKED
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <span
              {...part("foreground")}
              className={cn(
                "w-fit text-sm font-medium text-foreground",
                PICKED
              )}
            >
              Weekly sync
            </span>
            <span
              {...part("muted-foreground")}
              className={cn("w-fit text-xs text-muted-foreground", PICKED)}
            >
              Last run 2 minutes ago
            </span>
          </div>
          <span
            {...part("success")}
            className={cn(
              "flex items-center gap-1 text-xs text-success",
              PICKED
            )}
          >
            <span className="size-1.5 rounded-full bg-success" />
            Synced
          </span>
        </div>
        <span {...part("border")} className={cn("h-px bg-border", PICKED)} />
        <span
          {...part("ring")}
          className={cn(
            "flex h-8 items-center rounded-md border border-ring px-2 text-xs text-foreground ring-[3px] ring-ring-subtle",
            PICKED
          )}
        >
          Design review
        </span>
        <div className="flex items-center gap-2">
          <span
            {...part("muted")}
            className={cn(
              "rounded-full bg-muted px-2 py-0.5 text-xs text-foreground",
              PICKED
            )}
          >
            Design
          </span>
          <span
            {...part("primary")}
            className={cn(
              "ml-auto flex rounded-md bg-primary px-3 py-1.5 text-xs font-medium",
              PICKED
            )}
          >
            <span
              {...part("primary-foreground")}
              // Outlined in its own colour, which is the one that shows
              // against the button's fill.
              className={cn(
                "text-primary-foreground",
                PICKED,
                "data-picked:outline-primary-foreground"
              )}
            >
              Save
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export { ColorScale }
