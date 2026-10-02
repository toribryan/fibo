"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cva, type VariantProps } from "class-variance-authority"
import { SmilePlusIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type Reaction = {
  /** The emoji itself. Also the reaction's identity, so keep it unique. */
  emoji: string
  /** Its accessible name, such as "Heart". Screen readers hear this, not the emoji. */
  label: string
  /** How many people reacted with it. */
  count?: number
  /** Whether the current person is one of them. */
  active?: boolean
}

// Used when neither `choices` nor any existing reaction gives the picker
// something to offer. Escaped so the source stays plain ASCII.
const DEFAULT_CHOICES: Reaction[] = [
  { emoji: "\u{1F44D}", label: "Thumbs up" },
  { emoji: "\u2764\uFE0F", label: "Heart" },
  { emoji: "\u{1F602}", label: "Laughing" },
  { emoji: "\u{1F389}", label: "Celebrate" },
  { emoji: "\u{1F62E}", label: "Surprised" },
  { emoji: "\u{1F525}", label: "Fire" },
]

const compact = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
})

function formatCount(count: number) {
  return count < 1000 ? String(count) : compact.format(count)
}

function describeCount(count: number) {
  return `${count} ${count === 1 ? "reaction" : "reactions"}`
}

const ANCHOR =
  "pointer-events-none fixed z-50 flex [--edge:1rem] [--gap:0.5rem] sm:[--edge:1.5rem] sm:[--gap:1rem] lg:[--edge:2rem] lg:[--gap:2rem]"

const reactionsVariants = cva("group/reactions", {
  variants: {
    type: {
      inline: "relative flex flex-wrap items-center gap-1.5",
      floating: ANCHOR,
    },
    position: {
      "bottom-right": "",
      "bottom-left": "",
      "top-right": "",
      "top-left": "",
    },
  },
  compoundVariants: [
    {
      type: "floating",
      position: "bottom-right",
      class:
        "right-[var(--edge)] bottom-[calc(var(--gap)+env(safe-area-inset-bottom,0px))]",
    },
    {
      type: "floating",
      position: "bottom-left",
      class:
        "bottom-[calc(var(--gap)+env(safe-area-inset-bottom,0px))] left-[var(--edge)]",
    },
    {
      type: "floating",
      position: "top-right",
      class:
        "top-[calc(var(--gap)+env(safe-area-inset-top,0px))] right-[var(--edge)]",
    },
    {
      type: "floating",
      position: "top-left",
      class:
        "top-[calc(var(--gap)+env(safe-area-inset-top,0px))] left-[var(--edge)]",
    },
  ],
  defaultVariants: {
    type: "inline",
    position: "bottom-right",
  },
})

/*
 * One translucent surface for every floating piece: the bar that holds the
 * trigger and the panel that opens off it. `inset-ring` rather than `border`
 * so the ring sits inside the blur instead of drawing a hard edge around it.
 */
const SURFACE = "shadow-lg backdrop-blur-md inset-ring-1 inset-ring-border"

const RISE_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)"
const SPRING_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)"

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/*
 * Particles are thrown into a body-level layer rather than the component tree:
 * they outlive the click that spawned them, never affect layout, and escape
 * any ancestor that clips overflow or creates a containing block.
 */
function getParticleLayer() {
  const existing = document.querySelector<HTMLElement>(
    '[data-slot="reactions-particles"]'
  )
  if (existing) return existing

  const layer = document.createElement("div")
  layer.setAttribute("data-slot", "reactions-particles")
  layer.setAttribute("aria-hidden", "true")
  layer.style.cssText =
    "position:fixed;inset:0;z-index:9999;overflow:hidden;pointer-events:none"
  document.body.append(layer)
  return layer
}

function launchParticle(
  layer: HTMLElement,
  emoji: string,
  x: number,
  y: number
) {
  const node = document.createElement("span")
  node.textContent = emoji

  const size = 1.4 + Math.random() * 0.8
  const rise = window.innerHeight * (0.55 + Math.random() * 0.35)
  const sway = 24 + Math.random() * 28
  const spin = (Math.random() - 0.5) * 40

  // A trigger pinned to a corner would otherwise throw half its particles
  // straight into the clip boundary, so drift leans back toward the center in
  // proportion to how close the origin sits to an edge.
  const inward = (window.innerWidth / 2 - x) / (window.innerWidth / 2)
  const drift = (Math.random() - 0.5) * 90 + inward * 70
  const lean =
    Math.abs(inward) > 0.5 ? Math.sign(inward) : Math.random() < 0.5 ? -1 : 1

  node.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${size}rem;line-height:1;will-change:transform,opacity;filter:drop-shadow(0 2px 6px rgb(0 0 0 / 0.18))`
  layer.append(node)

  // Sway alternates sides on the way up so the path reads as an S-curve
  // rather than a straight line with jitter.
  const animation = node.animate(
    [
      {
        offset: 0,
        transform: "translate3d(0, 0, 0) scale(0.35) rotate(0deg)",
        opacity: 0,
      },
      {
        offset: 0.12,
        transform: `translate3d(${lean * sway * 0.35}px, ${-rise * 0.12}px, 0) scale(1.08) rotate(${spin * 0.4}deg)`,
        opacity: 1,
      },
      {
        offset: 0.38,
        transform: `translate3d(${-lean * sway}px, ${-rise * 0.38}px, 0) scale(1) rotate(${-spin * 0.6}deg)`,
        opacity: 1,
      },
      {
        offset: 0.66,
        transform: `translate3d(${lean * sway * 0.8 + drift * 0.5}px, ${-rise * 0.66}px, 0) scale(0.95) rotate(${spin * 0.8}deg)`,
        opacity: 0.85,
      },
      {
        offset: 1,
        transform: `translate3d(${drift}px, ${-rise}px, 0) scale(0.6) rotate(${-spin * 0.3}deg)`,
        opacity: 0,
      },
    ],
    {
      duration: 2200 + Math.random() * 1600,
      easing: RISE_EASING,
      fill: "forwards",
    }
  )

  const cleanup = () => node.remove()
  animation.finished.then(cleanup, cleanup)
}

function burst(emoji: string, origin: HTMLElement | null, count: number) {
  if (!origin || count < 1 || prefersReducedMotion()) return

  const layer = getParticleLayer()
  const rect = origin.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  for (let index = 0; index < count; index += 1) {
    const jitterX = x + (Math.random() - 0.5) * 36
    const jitterY = y + (Math.random() - 0.5) * 12
    window.setTimeout(
      () => launchParticle(layer, emoji, jitterX, jitterY),
      index * 55
    )
  }
}

function animatePill(pill: HTMLElement) {
  if (prefersReducedMotion()) return

  pill
    .querySelector<HTMLElement>('[data-slot="reactions-pill-emoji"]')
    ?.animate(
      [
        { transform: "scale(1) rotate(0deg)" },
        { transform: "scale(1.45) rotate(-9deg)", offset: 0.35 },
        { transform: "scale(0.93) rotate(5deg)", offset: 0.62 },
        { transform: "scale(1) rotate(0deg)" },
      ],
      { duration: 420, easing: SPRING_EASING }
    )

  pill
    .querySelector<HTMLElement>('[data-slot="reactions-pill-count"]')
    ?.animate(
      [
        { transform: "translateY(65%)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 260, easing: RISE_EASING }
    )
}

function pop(element: HTMLElement) {
  if (prefersReducedMotion()) return

  element.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.4)", offset: 0.5 },
      { transform: "scale(1)" },
    ],
    { duration: 380, easing: SPRING_EASING }
  )
}

type ReactionsProps = Omit<React.ComponentProps<"div">, "onChange"> &
  VariantProps<typeof reactionsVariants> & {
    /** The reactions on the item. Pass it to control the state yourself. */
    reactions?: Reaction[]
    /** The starting reactions when uncontrolled. */
    defaultReactions?: Reaction[]
    /**
     * What the picker offers. Defaults to six common reactions plus any
     * already on the item.
     */
    choices?: Reaction[]
    /** Fires with the whole new list after every change. */
    onReactionsChange?: (reactions: Reaction[]) => void
    /** Fires with the reaction that changed and whether it is now on. */
    onReact?: (reaction: Reaction, active: boolean) => void
    /** Show the count on each pill, or the total on the floating bar. */
    showCounts?: boolean
    /** Emoji thrown up on each new reaction. `0` turns the burst off. */
    particles?: number
    /** Accessible name of the button that opens the picker. */
    triggerLabel?: string
    /** Accessible name of the group of choices. */
    panelLabel?: string
  }

function Reactions({
  className,
  type = "inline",
  position = "bottom-right",
  reactions: reactionsProp,
  defaultReactions = [],
  choices,
  onReactionsChange,
  onReact,
  showCounts = true,
  particles = 7,
  triggerLabel = "Add reaction",
  panelLabel = "Pick a reaction",
  "aria-label": ariaLabel = "Reactions",
  ...props
}: ReactionsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const badgeRef = React.useRef<HTMLSpanElement>(null)
  const pulseNonce = React.useRef(0)

  const [uncontrolled, setUncontrolled] = React.useState(defaultReactions)
  const [pulse, setPulse] = React.useState<{ emoji: string; nonce: number }>()
  const [open, setOpen] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")

  const isControlled = reactionsProp !== undefined
  const items = isControlled ? reactionsProp : uncontrolled
  // Without `choices`, the picker offers the defaults plus anything already
  // reacted with that isn't among them.
  const palette =
    choices ??
    DEFAULT_CHOICES.concat(
      items.filter(
        (item) => !DEFAULT_CHOICES.some((choice) => choice.emoji === item.emoji)
      )
    )
  const total = items.reduce((sum, item) => sum + (item.count ?? 0), 0)

  React.useEffect(() => {
    if (!pulse) return
    const pill = rootRef.current?.querySelector<HTMLElement>(
      `[data-slot="reactions-pill"][data-emoji="${CSS.escape(pulse.emoji)}"]`
    )
    if (pill) animatePill(pill)
    if (badgeRef.current) pop(badgeRef.current)
  }, [pulse])

  function commit(next: Reaction[]) {
    if (!isControlled) setUncontrolled(next)
    onReactionsChange?.(next)
  }

  function toggle(reaction: Reaction, origin: HTMLElement | null) {
    const existing = items.find((item) => item.emoji === reaction.emoji)
    const nowActive = !existing?.active

    // A reaction nobody holds any more leaves the list instead of lingering
    // as a zero.
    commit(
      existing
        ? items
            .map((item) =>
              item.emoji === reaction.emoji
                ? {
                    ...item,
                    active: nowActive,
                    count: Math.max(
                      0,
                      (item.count ?? 0) + (nowActive ? 1 : -1)
                    ),
                  }
                : item
            )
            .filter((item) => item.active || (item.count ?? 0) > 0)
        : [
            ...items,
            { ...reaction, active: true, count: (reaction.count ?? 0) + 1 },
          ]
    )

    onReact?.(reaction, nowActive)
    const change = `${nowActive ? "Added" : "Removed"} ${reaction.label}`
    // The floating bar has no pills, so its total is the only count to hear.
    setAnnouncement(
      type === "floating" && showCounts
        ? `${change}, ${describeCount(total + (nowActive ? 1 : -1))} in total`
        : change
    )
    pulseNonce.current += 1
    setPulse({ emoji: reaction.emoji, nonce: pulseNonce.current })
    if (nowActive) burst(reaction.emoji, origin, particles)
  }

  function rove(event: React.KeyboardEvent<HTMLDivElement>) {
    const targets = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        '[data-slot="reactions-choice"]'
      ) ?? []
    )
    if (targets.length === 0) return

    const current = targets.indexOf(document.activeElement as HTMLElement)
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0

    if (step !== 0) {
      event.preventDefault()
      targets[(current + step + targets.length) % targets.length]?.focus()
      return
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      const target =
        event.key === "Home" ? targets[0] : targets[targets.length - 1]
      target?.focus()
    }
  }

  // The panel opens away from the bar's corner when floating, and above the
  // trigger inline. Base UI flips it to whichever side has room.
  const isBar = type === "floating"
  const opensDown =
    isBar && (position === "top-right" || position === "top-left")
  const alignsEnd =
    isBar && (position === "bottom-right" || position === "top-right")

  const totalChip = showCounts && total > 0 && (
    <span
      ref={badgeRef}
      data-slot="reactions-badge"
      className="inline-flex h-8 min-w-6 shrink-0 items-center justify-center px-1.5 text-xs font-medium text-muted-foreground tabular-nums"
    >
      <span aria-hidden="true">{formatCount(total)}</span>
      <span className="sr-only">{describeCount(total)}</span>
    </span>
  )

  const trigger = (
    <PopoverPrimitive.Trigger
      ref={triggerRef}
      data-slot="reactions-trigger"
      data-state={open ? "open" : "closed"}
      aria-label={triggerLabel}
      className={cn(
        "group/trigger relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform,box-shadow] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
        type === "inline"
          ? "size-7 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground [&_svg]:size-4"
          : "size-8 touch-manipulation text-foreground hover:bg-muted data-[state=open]:bg-muted motion-safe:active:scale-95 [&_svg]:size-4"
      )}
    >
      <SmilePlusIcon
        aria-hidden="true"
        className="transition-transform duration-300 ease-out motion-safe:group-data-[state=open]/trigger:rotate-90"
      />
    </PopoverPrimitive.Trigger>
  )

  return (
    <div
      ref={rootRef}
      data-slot="reactions"
      data-type={type}
      role="group"
      aria-label={ariaLabel}
      className={cn(reactionsVariants({ type, position, className }))}
      {...props}
    >
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {type === "inline" &&
        items.map((item) => (
          <button
            key={item.emoji}
            type="button"
            data-slot="reactions-pill"
            data-emoji={item.emoji}
            data-active={item.active ? "" : undefined}
            aria-pressed={Boolean(item.active)}
            aria-label={
              showCounts
                ? `${item.label}, ${describeCount(item.count ?? 0)}`
                : item.label
            }
            onClick={(event) => toggle(item, event.currentTarget)}
            className="group/pill relative inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs transition-[background-color,border-color,transform] duration-150 outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle active:translate-y-0 motion-safe:hover:-translate-y-px data-active:border-primary data-active:bg-primary-subtle"
          >
            <span
              data-slot="reactions-pill-emoji"
              aria-hidden="true"
              className="text-sm leading-none"
            >
              {item.emoji}
            </span>
            {showCounts && (
              <span
                data-slot="reactions-pill-count"
                aria-hidden="true"
                className="font-medium text-muted-foreground tabular-nums group-data-active/pill:text-primary"
              >
                {formatCount(item.count ?? 0)}
              </span>
            )}
          </button>
        ))}

      <span
        data-slot="reactions-picker"
        className={cn(
          "relative inline-flex items-center",
          isBar &&
            cn(
              "pointer-events-auto gap-1 rounded-full bg-popover-overlay p-1.5",
              SURFACE
            )
        )}
      >
        {/* Base UI's popover handles outside clicks, Escape, tabbing away
            and returning focus, and portals the panel so a card that clips
            its overflow can't cut it off. */}
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
              side={opensDown ? "bottom" : "top"}
              align={alignsEnd ? "end" : "start"}
              sideOffset={8}
              collisionPadding={8}
              className="isolate z-50"
            >
              <PopoverPrimitive.Popup
                ref={panelRef}
                data-slot="reactions-panel"
                data-state={open ? "open" : "closed"}
                aria-label={panelLabel}
                initialFocus={() =>
                  panelRef.current?.querySelector<HTMLElement>(
                    '[data-slot="reactions-choice"]'
                  ) ?? true
                }
                onKeyDown={rove}
                className={cn(
                  "flex origin-(--transform-origin) items-center gap-0.5 rounded-full bg-popover-overlay p-1 outline-hidden transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                  SURFACE,
                  "data-ending-style:scale-90 data-ending-style:opacity-0 data-starting-style:scale-90 data-starting-style:opacity-0",
                  "data-[side=bottom]:data-ending-style:-translate-y-2 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=top]:data-ending-style:translate-y-2 data-[side=top]:data-starting-style:translate-y-2"
                )}
              >
                {palette.map((choice, index) => {
                  const picked = items.find(
                    (entry) => entry.emoji === choice.emoji
                  )?.active
                  return (
                    <button
                      key={choice.emoji}
                      type="button"
                      data-slot="reactions-choice"
                      data-state={open ? "open" : "closed"}
                      data-active={picked ? "" : undefined}
                      aria-pressed={Boolean(picked)}
                      aria-label={choice.label}
                      // Staggering the entrance and reversing it on exit makes
                      // the panel unfurl and furl rather than pop as one block.
                      style={{
                        transitionDelay: `${open ? index * 28 : (palette.length - 1 - index) * 16}ms`,
                      }}
                      onClick={(event) => {
                        toggle(
                          choice,
                          isBar ? triggerRef.current : event.currentTarget
                        )
                        setOpen(false)
                      }}
                      className="inline-flex size-9 touch-manipulation items-center justify-center rounded-full text-lg leading-none transition-[background-color,transform,opacity] duration-200 ease-out outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-[state=closed]:scale-50 data-[state=closed]:opacity-0 motion-safe:hover:scale-115 motion-safe:active:scale-95 motion-reduce:transition-none starting:scale-50 starting:opacity-0 data-active:bg-primary-subtle"
                    >
                      <span aria-hidden="true">{choice.emoji}</span>
                    </button>
                  )
                })}
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>

          {type === "floating" && totalChip}

          {trigger}
        </PopoverPrimitive.Root>
      </span>
    </div>
  )
}

export { Reactions, reactionsVariants, type Reaction }
