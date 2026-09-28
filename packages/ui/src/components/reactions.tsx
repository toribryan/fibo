"use client"

import * as React from "react"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { SmilePlusIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type Reaction = {
  emoji: string
  label: string
  count?: number
  active?: boolean
}

const ANCHOR =
  "pointer-events-none fixed z-50 flex [--edge:1rem] [--gap:0.5rem] sm:[--edge:1.5rem] sm:[--gap:1rem] lg:[--edge:2rem] lg:[--gap:2rem]"

const reactionsVariants = cva("group/reactions", {
  variants: {
    variant: {
      inline: "relative flex flex-wrap items-center gap-1.5",
      floating: ANCHOR,
      menu: ANCHOR,
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
      variant: ["floating", "menu"],
      position: "bottom-right",
      class:
        "right-[var(--edge)] bottom-[calc(var(--gap)+env(safe-area-inset-bottom,0px))]",
    },
    {
      variant: ["floating", "menu"],
      position: "bottom-left",
      class:
        "bottom-[calc(var(--gap)+env(safe-area-inset-bottom,0px))] left-[var(--edge)]",
    },
    {
      variant: ["floating", "menu"],
      position: "top-right",
      class:
        "top-[calc(var(--gap)+env(safe-area-inset-top,0px))] right-[var(--edge)]",
    },
    {
      variant: ["floating", "menu"],
      position: "top-left",
      class:
        "top-[calc(var(--gap)+env(safe-area-inset-top,0px))] left-[var(--edge)]",
    },
  ],
  defaultVariants: {
    variant: "inline",
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
const PANEL_EXIT_MS = 220

type PanelState = "closed" | "open" | "exiting"

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

  pill.querySelector<HTMLElement>('[data-slot="reactions-ripple"]')?.animate(
    [
      { transform: "scale(0.9)", opacity: 0.6 },
      { transform: "scale(1.4)", opacity: 0 },
    ],
    { duration: 500, easing: RISE_EASING }
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

type ReactionsMenuItemProps = useRender.ComponentProps<"button"> & {
  active?: boolean
}

/*
 * A row in the menu panel. Defaults to a button so an item can run an action,
 * and takes Base UI's `render` so a consumer can swap in whatever their router
 * hands them. The component stays ignorant of what an item actually does.
 */
function ReactionsMenuItem({
  className,
  active,
  render,
  ...props
}: ReactionsMenuItemProps) {
  return useRender({
    render,
    defaultTagName: "button",
    props: {
      "data-slot": "reactions-menu-item",
      "data-active": active ? "" : undefined,
      ...(render ? {} : { type: "button" }),
      className: cn(
        "flex w-full items-center gap-2 rounded-full px-3 py-1.5 text-left text-sm text-popover-foreground no-underline transition-colors outline-none select-none hover:bg-muted focus-visible:bg-muted data-active:bg-muted data-active:font-medium [&_svg]:size-4 [&_svg]:shrink-0",
        className
      ),
      ...props,
    },
  })
}

type ReactionsProps = Omit<React.ComponentProps<"div">, "onChange"> &
  VariantProps<typeof reactionsVariants> & {
    reactions?: Reaction[]
    defaultReactions?: Reaction[]
    choices?: Reaction[]
    onReactionsChange?: (reactions: Reaction[]) => void
    onReact?: (reaction: Reaction, active: boolean) => void
    showCounts?: boolean
    particles?: number
    triggerLabel?: string
    closeLabel?: string
    panelLabel?: string
    menu?: React.ReactNode
    menuLabel?: string
  }

function Reactions({
  className,
  variant = "inline",
  position = "bottom-right",
  reactions: reactionsProp,
  defaultReactions = [],
  choices,
  onReactionsChange,
  onReact,
  showCounts = true,
  particles = 7,
  triggerLabel = "Add reaction",
  closeLabel = "Close",
  panelLabel = "Pick a reaction",
  menu,
  menuLabel = "Menu",
  "aria-label": ariaLabel = "Reactions",
  ...props
}: ReactionsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const railRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const badgeRef = React.useRef<HTMLSpanElement>(null)
  const pulseNonce = React.useRef(0)
  const timerRef = React.useRef(0)
  const panelId = React.useId()
  const railId = React.useId()

  const [uncontrolled, setUncontrolled] = React.useState(defaultReactions)
  const [pulse, setPulse] = React.useState<{ emoji: string; nonce: number }>()
  const [panel, setPanel] = React.useState<PanelState>("closed")

  const isControlled = reactionsProp !== undefined
  const items = isControlled ? reactionsProp : uncontrolled
  const palette = choices ?? items
  const total = items.reduce((sum, item) => sum + (item.count ?? 0), 0)

  const open = panel === "open"
  const rendered = panel !== "closed"

  React.useEffect(() => () => window.clearTimeout(timerRef.current), [])

  // Entry rides on @starting-style, so the panel can mount straight into its
  // open state. Exit has no such affordance and keeps the node mounted for the
  // length of the transition.
  function openPanel() {
    window.clearTimeout(timerRef.current)
    setPanel("open")
  }

  function closePanel() {
    setPanel("exiting")
    timerRef.current = window.setTimeout(
      () => setPanel("closed"),
      PANEL_EXIT_MS
    )
  }

  React.useEffect(() => {
    if (!open) return
    const choices = variant === "menu" ? railRef.current : panelRef.current
    choices
      ?.querySelector<HTMLButtonElement>('[data-slot="reactions-choice"]')
      ?.focus()
  }, [open, variant])

  React.useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closePanel()
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

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

    commit(
      existing
        ? items.map((item) =>
            item.emoji === reaction.emoji
              ? {
                  ...item,
                  active: nowActive,
                  count: Math.max(0, (item.count ?? 0) + (nowActive ? 1 : -1)),
                }
              : item
          )
        : [
            ...items,
            { ...reaction, active: true, count: (reaction.count ?? 0) + 1 },
          ]
    )

    onReact?.(reaction, nowActive)
    pulseNonce.current += 1
    setPulse({ emoji: reaction.emoji, nonce: pulseNonce.current })
    if (nowActive) burst(reaction.emoji, origin, particles)
  }

  function rove(
    event: React.KeyboardEvent<HTMLDivElement>,
    container: HTMLElement | null,
    selector: string,
    orientation: "horizontal" | "vertical"
  ) {
    const targets = Array.from(
      container?.querySelectorAll<HTMLElement>(selector) ?? []
    )
    if (targets.length === 0) return

    const [back, forward] =
      orientation === "horizontal"
        ? ["ArrowLeft", "ArrowRight"]
        : ["ArrowUp", "ArrowDown"]
    const current = targets.indexOf(document.activeElement as HTMLElement)
    const step = event.key === forward ? 1 : event.key === back ? -1 : 0

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

  const isMenu = variant === "menu"
  const isBar = isMenu || variant === "floating"
  const opensDown =
    isBar && (position === "top-right" || position === "top-left")
  const alignsEnd =
    isBar && (position === "bottom-right" || position === "top-right")
  // The rail grows away from the edge the bar is pinned to, so it never runs
  // off screen and the trigger stays where the thumb left it.
  const railBefore = alignsEnd

  const totalChip = total > 0 && (
    <span
      ref={badgeRef}
      data-slot="reactions-badge"
      aria-hidden="true"
      className="inline-flex h-8 min-w-6 shrink-0 items-center justify-center px-1.5 text-xs font-medium text-muted-foreground tabular-nums"
    >
      {total}
    </span>
  )

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      data-slot="reactions-trigger"
      data-state={open ? "open" : "closed"}
      aria-label={isMenu && open ? closeLabel : triggerLabel}
      aria-haspopup="true"
      aria-expanded={open}
      aria-controls={isMenu ? railId : rendered ? panelId : undefined}
      onClick={() => (open ? closePanel() : openPanel())}
      className={cn(
        "group/trigger relative inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform,box-shadow] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
        variant === "inline"
          ? "size-7 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground [&_svg]:size-4"
          : "size-8 touch-manipulation text-foreground hover:bg-muted data-[state=open]:bg-muted motion-safe:active:scale-95 [&_svg]:size-4",
        isMenu && "flex-col gap-1"
      )}
    >
      {isMenu ? (
        <>
          <span
            aria-hidden="true"
            className="h-0.5 w-4 rounded-[1px] bg-current transition-transform duration-300 ease-out group-data-[state=open]/trigger:translate-y-[3px] group-data-[state=open]/trigger:rotate-45"
          />
          <span
            aria-hidden="true"
            className="h-0.5 w-4 rounded-[1px] bg-current transition-transform duration-300 ease-out group-data-[state=open]/trigger:-translate-y-[3px] group-data-[state=open]/trigger:-rotate-45"
          />
        </>
      ) : (
        <SmilePlusIcon
          aria-hidden="true"
          className="transition-transform duration-300 ease-out motion-safe:group-data-[state=open]/trigger:rotate-90"
        />
      )}
    </button>
  )

  // A collapsed column of `0fr` gives the rail nothing to occupy, so opening
  // it animates real width rather than a guessed pixel value, and the bar
  // grows from the trigger outward however many choices there are.
  const rail = (
    <div
      id={railId}
      data-slot="reactions-rail"
      data-state={open ? "open" : "closed"}
      className="grid grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out data-[state=closed]:grid-cols-[0fr]"
    >
      <div
        ref={railRef}
        role="group"
        aria-label={panelLabel}
        inert={!open}
        onKeyDown={(event) =>
          rove(
            event,
            railRef.current,
            '[data-slot="reactions-choice"]',
            "horizontal"
          )
        }
        className={cn(
          "flex min-w-0 items-center gap-0.5 overflow-hidden",
          railBefore ? "justify-end pr-1" : "justify-start pl-1"
        )}
      >
        {!railBefore && totalChip}

        {palette.map((choice, index) => {
          const item = items.find((entry) => entry.emoji === choice.emoji)
          // Stagger from the end nearest the trigger so the rail unrolls out
          // of the button rather than arriving all at once.
          const distance = railBefore ? palette.length - 1 - index : index

          return (
            <button
              key={choice.emoji}
              type="button"
              data-slot="reactions-choice"
              data-state={open ? "open" : "closed"}
              data-active={item?.active ? "" : undefined}
              aria-pressed={Boolean(item?.active)}
              aria-label={choice.label}
              style={{
                transitionDelay: `${open ? distance * 30 : (palette.length - 1 - distance) * 18}ms`,
              }}
              onClick={(event) => {
                toggle(choice, event.currentTarget)
                pop(event.currentTarget)
              }}
              className="inline-flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-lg leading-none transition-[background-color,transform,opacity] duration-200 ease-out outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-[state=closed]:scale-50 data-[state=closed]:opacity-0 motion-safe:hover:scale-115 motion-safe:active:scale-95 data-active:bg-primary-subtle"
            >
              <span aria-hidden="true">{choice.emoji}</span>
            </button>
          )
        })}

        {railBefore && totalChip}
      </div>
    </div>
  )

  return (
    <div
      ref={rootRef}
      data-slot="reactions"
      data-variant={variant}
      role="group"
      aria-label={ariaLabel}
      className={cn(reactionsVariants({ variant, position, className }))}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return
        event.stopPropagation()
        closePanel()
        triggerRef.current?.focus()
      }}
      {...props}
    >
      {variant === "inline" &&
        items.map((item) => (
          <button
            key={item.emoji}
            type="button"
            data-slot="reactions-pill"
            data-emoji={item.emoji}
            data-active={item.active ? "" : undefined}
            aria-pressed={Boolean(item.active)}
            aria-label={`${item.label}, ${item.count ?? 0}`}
            onClick={(event) => toggle(item, event.currentTarget)}
            className="group/pill relative inline-flex h-7 items-center gap-1.5 rounded-full border border-transparent bg-muted px-2.5 text-xs transition-[background-color,border-color,transform] duration-150 outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle active:translate-y-0 motion-safe:hover:-translate-y-px data-active:border-primary data-active:bg-primary-subtle"
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
                {item.count ?? 0}
              </span>
            )}
            <span
              data-slot="reactions-ripple"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border border-primary opacity-0"
            />
          </button>
        ))}

      <span
        data-slot="reactions-picker"
        className={cn(
          "relative inline-flex items-center",
          isBar &&
            cn(
              "pointer-events-auto rounded-full bg-popover-overlay p-1.5",
              !isMenu && "gap-1",
              SURFACE
            )
        )}
      >
        {isMenu ? (
          <>
            {railBefore && rail}

            <span
              data-slot="reactions-menu-anchor"
              className="relative inline-flex"
            >
              {menu && rendered && (
                <div
                  ref={panelRef}
                  id={panelId}
                  data-slot="reactions-menu"
                  data-state={open ? "open" : "closed"}
                  role="group"
                  aria-label={menuLabel}
                  onKeyDown={(event) =>
                    rove(
                      event,
                      panelRef.current,
                      '[data-slot="reactions-menu-item"]',
                      "vertical"
                    )
                  }
                  className={cn(
                    "absolute z-10 flex min-w-44 flex-col gap-0.5 rounded-2xl bg-popover-overlay p-1 transition-[opacity,transform] duration-200 ease-out",
                    SURFACE,
                    "data-[state=closed]:scale-95 data-[state=closed]:opacity-0 starting:scale-95 starting:opacity-0",
                    opensDown
                      ? "top-full mt-2 data-[state=closed]:-translate-y-2 starting:-translate-y-2"
                      : "bottom-full mb-2 data-[state=closed]:translate-y-2 starting:translate-y-2",
                    opensDown
                      ? alignsEnd
                        ? "right-0 origin-top-right"
                        : "left-0 origin-top-left"
                      : alignsEnd
                        ? "right-0 origin-bottom-right"
                        : "left-0 origin-bottom-left"
                  )}
                >
                  {menu}
                </div>
              )}

              {trigger}
            </span>

            {!railBefore && rail}
          </>
        ) : (
          <>
            {rendered && (
              <div
                ref={panelRef}
                id={panelId}
                data-slot="reactions-panel"
                data-state={open ? "open" : "closed"}
                role="group"
                aria-label={panelLabel}
                onKeyDown={(event) =>
                  rove(
                    event,
                    panelRef.current,
                    '[data-slot="reactions-choice"]',
                    "horizontal"
                  )
                }
                className={cn(
                  "absolute z-10 flex items-center gap-0.5 rounded-full bg-popover-overlay p-1 transition-[opacity,transform] duration-200 ease-out",
                  SURFACE,
                  "data-[state=closed]:scale-90 data-[state=closed]:opacity-0 starting:scale-90 starting:opacity-0",
                  opensDown
                    ? "top-full mt-2 data-[state=closed]:-translate-y-2 starting:-translate-y-2"
                    : "bottom-full mb-2 data-[state=closed]:translate-y-2 starting:translate-y-2",
                  opensDown
                    ? alignsEnd
                      ? "right-0 origin-top-right"
                      : "left-0 origin-top-left"
                    : alignsEnd
                      ? "right-0 origin-bottom-right"
                      : "left-0 origin-bottom-left"
                )}
              >
                {palette.map((choice, index) => (
                  <button
                    key={choice.emoji}
                    type="button"
                    data-slot="reactions-choice"
                    data-state={open ? "open" : "closed"}
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
                      closePanel()
                      triggerRef.current?.focus()
                    }}
                    className="inline-flex size-9 touch-manipulation items-center justify-center rounded-full text-lg leading-none transition-[background-color,transform,opacity] duration-200 ease-out outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-[state=closed]:scale-50 data-[state=closed]:opacity-0 motion-safe:hover:scale-115 motion-safe:active:scale-95 starting:scale-50 starting:opacity-0"
                  >
                    <span aria-hidden="true">{choice.emoji}</span>
                  </button>
                ))}
              </div>
            )}

            {variant === "floating" && totalChip}

            {trigger}
          </>
        )}
      </span>
    </div>
  )
}

export { Reactions, ReactionsMenuItem, reactionsVariants, type Reaction }
