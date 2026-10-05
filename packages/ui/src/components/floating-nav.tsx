"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@workspace/ui/lib/utils"

type FloatingNavItem = {
  /** Stable, unique identifier. Matched against `value`. */
  value: string
  /** Visible name of the destination. Also its accessible name. */
  label: string
  /** An icon, usually a 20px Lucide icon. Hidden from screen readers. Leave it out for a text item, whose label always shows. */
  icon?: React.ReactNode
  /** Renders the item as a link. Without it, the item is a button. */
  href?: string
}

type FloatingNavProps = Omit<React.ComponentProps<"nav">, "onChange"> & {
  /** Destinations, in order from left to right. Three to five read best. */
  items: FloatingNavItem[]
  /** The current item, when controlled. */
  value?: string
  /** The item current on first render, when uncontrolled. */
  defaultValue?: string
  /** Called when an item is pressed. Call `event.preventDefault()` on a link to route it yourself. */
  onValueChange?: (
    value: string,
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => void
  /** `active` shows only the current item's label; `always` stacks every label under its icon. */
  labels?: "active" | "always"
  /** `sm` tightens the pill: 36px items and 16px icons instead of 44px and 20px. */
  size?: "sm" | "default"
  /** `fixed` floats above the page at the bottom of the viewport; `static` sits in the flow. */
  position?: "fixed" | "static"
  /** Slides the bar away while the page scrolls down and back when it scrolls up. */
  hideOnScroll?: boolean
  /** `glass` is Apple's liquid glass: a clear bar that bends the page behind its edges, with a glass lens on the current item. */
  variant?: "default" | "glass"
}

const floatingNavVariants = cva(
  "pointer-events-auto relative flex max-w-full [scrollbar-width:none] items-center overflow-x-auto rounded-full shadow-lg",
  {
    variants: {
      variant: {
        default: "border border-border bg-popover-overlay backdrop-blur-md",
        // The surface is drawn by the layers in GlassSurface, under the items.
        // Visible overflow, so the lens can lift past the bar's edges.
        glass: "isolate overflow-visible",
      },
      size: { sm: "gap-0.5 p-1", default: "gap-1 p-1.5" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

const floatingNavItemVariants = cva(
  "relative flex shrink-0 items-center justify-center rounded-full font-medium text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-[current]:text-primary-foreground data-[current]:hover:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "",
        // Glass has no fill to read against, so every label is in the text
        // colour and the lens marks the current one.
        glass:
          "text-foreground data-[current]:text-foreground data-[current]:hover:text-foreground",
      },
      labels: {
        active: "",
        always: "flex-col gap-0.5 leading-4",
      },
      size: { sm: "", default: "" },
    },
    compoundVariants: [
      {
        labels: "active",
        size: "default",
        className: "h-11 min-w-11 px-3 text-sm",
      },
      {
        labels: "always",
        size: "default",
        className: "h-14 min-w-16 px-3 text-[11px]",
      },
      {
        labels: "active",
        size: "sm",
        className: "h-9 min-w-9 px-2.5 text-[13px]",
      },
      {
        labels: "always",
        size: "sm",
        className: "h-12 min-w-14 px-2 text-[10px]",
      },
    ],
    defaultVariants: { variant: "default", labels: "active", size: "default" },
  }
)

// Past this distance from the top, scrolling down hides the bar. Near the top
// it always shows, so a page that barely scrolls never loses its nav.
const HIDE_AFTER = 64
// Ignores the jitter of momentum scrolling and small layout shifts.
const SCROLL_THRESHOLD = 8

const SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 40,
  mass: 0.8,
} as const

// Looser, so the glass lens overshoots a little as it lands, like a drop.
const GLASS_SPRING = {
  type: "spring",
  stiffness: 380,
  damping: 26,
  mass: 0.9,
} as const

// How far the glass bends the page at its edges, in CSS pixels, and how wide
// the bending band along each edge is.
const REFRACTION = 14
const REFRACTION_EDGE = 12

/*
 * A displacement map for one axis: neutral grey through the middle, and
 * along each edge a ramp that pulls the page in from further inside, so
 * content bends toward the rim the way it does through a lens.
 */
function edgeMap(axis: "x" | "y", width: number, height: number) {
  const length = axis === "x" ? width : height
  const band = Math.min(REFRACTION_EDGE, length / 2) / length
  const channel = (value: number) =>
    axis === "x" ? `rgb(${value},128,128)` : `rgb(128,${value},128)`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="${axis === "x" ? 1 : 0}" y2="${axis === "y" ? 1 : 0}"><stop offset="0" stop-color="${channel(255)}"/><stop offset="${band}" stop-color="${channel(128)}"/><stop offset="${1 - band}" stop-color="${channel(128)}"/><stop offset="1" stop-color="${channel(0)}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/*
 * The liquid glass surface, under the items. A tinted, lightly blurred layer
 * works everywhere. Over it, a layer whose backdrop runs through an SVG
 * displacement filter bends what's behind the edges; only Chromium applies
 * url() in backdrop-filter, and elsewhere that layer is clear, so the bar
 * falls back to the blur and rim.
 */
function GlassSurface() {
  const filterId = `floating-nav-glass-${React.useId().replace(/:/g, "")}`
  const surfaceRef = React.useRef<HTMLLIElement>(null)
  const [box, setBox] = React.useState<{ width: number; height: number }>()

  // The surface fills the list, so its own size is the bar's.
  React.useLayoutEffect(() => {
    const element = surfaceRef.current
    if (!element) return
    const observer = new ResizeObserver(() =>
      setBox({
        width: Math.round(element.offsetWidth),
        height: Math.round(element.offsetHeight),
      })
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <li
      ref={surfaceRef}
      aria-hidden="true"
      data-slot="floating-nav-glass"
      className="pointer-events-none absolute inset-0 -z-10 rounded-full"
    >
      {box ? (
        <svg width="0" height="0" className="absolute">
          <filter
            id={filterId}
            x="0"
            y="0"
            width={box.width}
            height={box.height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={edgeMap("x", box.width, box.height)}
              width={box.width}
              height={box.height}
              preserveAspectRatio="none"
              result="x"
            />
            <feImage
              href={edgeMap("y", box.width, box.height)}
              width={box.width}
              height={box.height}
              preserveAspectRatio="none"
              result="y"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="x"
              scale={REFRACTION}
              xChannelSelector="R"
              yChannelSelector="G"
              result="bentX"
            />
            <feDisplacementMap
              in="bentX"
              in2="y"
              scale={REFRACTION}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      ) : null}
      <span className="absolute inset-0 rounded-full bg-glass backdrop-blur-[1px] backdrop-saturate-150" />
      <span
        className="absolute inset-0 rounded-full"
        style={box ? { backdropFilter: `url(#${filterId})` } : undefined}
      />
      <span className="absolute inset-0 rounded-full ring-1 inset-shadow-[0_1px_1px] ring-glass-edge inset-shadow-glass-edge" />
    </li>
  )
}

// How far the lens grows as it lifts off the bar, and how far it magnifies
// what's under it: the shift at its rim, as a share of its width.
const LIFT = { scaleX: 1.16, scaleY: 1.42 }
const MAGNIFY = 0.2
// Red bends most and blue least, which splits colour into fringes at the rim.
const DISPERSION = { R: 1, G: 0.95, B: 0.9 }
// How long the lens stays lifted after a press, so it can travel lifted.
const SETTLE_AFTER = 420

/*
 * A magnifying map for one axis: a ramp right across the lens, steeper at
 * the rim, so content near the middle swells and content at the rim bends.
 */
function lensMap(axis: "x" | "y", width: number, height: number) {
  const channel = (value: number) =>
    axis === "x" ? `rgb(${value},128,128)` : `rgb(128,${value},128)`
  const stops = [
    [0, 255],
    [0.12, 160],
    [0.5, 128],
    [0.88, 96],
    [1, 0],
  ]
    .map(
      ([at, value]) => `<stop offset="${at}" stop-color="${channel(value!)}"/>`
    )
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="${axis === "x" ? 1 : 0}" y2="${axis === "y" ? 1 : 0}">${stops}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/*
 * The glass lens on the current item. At rest it's a tinted pill under the
 * icon and label. Lifted, while pressed and while it travels to a new item,
 * it grows past the bar, clears, and moves over the item, magnifying it with
 * a fringe of colour at the rim, the way iOS lifts its tab bar's selection.
 * The magnifying runs on url() in backdrop-filter, so only in Chromium;
 * elsewhere the lens still lifts and clears.
 */
function GlassLens({
  layoutId,
  lifted,
  transition,
}: {
  layoutId: string
  lifted: boolean
  transition: object
}) {
  const filterId = `floating-nav-lens-${React.useId().replace(/:/g, "")}`
  const lensRef = React.useRef<HTMLSpanElement>(null)
  const [box, setBox] = React.useState<{ width: number; height: number }>()

  React.useLayoutEffect(() => {
    const element = lensRef.current
    if (!element) return
    const observer = new ResizeObserver(() =>
      setBox({
        width: Math.round(element.offsetWidth),
        height: Math.round(element.offsetHeight),
      })
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const bend = box ? Math.round(box.width * MAGNIFY) : 0
  const channel = (key: keyof typeof DISPERSION, row: string) => {
    if (!box) return null
    const scale = bend * DISPERSION[key]
    return (
      <>
        <feDisplacementMap
          in="SourceGraphic"
          in2="x"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result={`${key}x`}
        />
        <feDisplacementMap
          in={`${key}x`}
          in2="y"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
          result={`${key}xy`}
        />
        <feColorMatrix
          in={`${key}xy`}
          type="matrix"
          values={`${row} 0 0 0 1 0`}
          result={key}
        />
      </>
    )
  }

  return (
    <motion.span
      ref={lensRef}
      layoutId={layoutId}
      aria-hidden="true"
      data-slot="floating-nav-lens"
      data-lifted={lifted ? "" : undefined}
      initial={false}
      animate={lifted ? LIFT : { scaleX: 1, scaleY: 1 }}
      transition={transition}
      className={cn(
        "absolute inset-0 rounded-full transition-[background-color,box-shadow] duration-200",
        lifted
          ? "z-10 bg-transparent shadow-lg ring-1 inset-shadow-[0_1px_2px] ring-glass-edge inset-shadow-glass-edge"
          : "bg-glass-lens inset-shadow-[0_1px_1px] inset-shadow-glass-edge"
      )}
      style={
        lifted && box ? { backdropFilter: `url(#${filterId})` } : undefined
      }
    >
      {box ? (
        <svg width="0" height="0" className="absolute">
          <filter
            id={filterId}
            x="0"
            y="0"
            width={box.width}
            height={box.height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={lensMap("x", box.width, box.height)}
              width={box.width}
              height={box.height}
              preserveAspectRatio="none"
              result="x"
            />
            <feImage
              href={lensMap("y", box.width, box.height)}
              width={box.width}
              height={box.height}
              preserveAspectRatio="none"
              result="y"
            />
            {channel("R", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0")}
            {channel("G", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0")}
            {channel("B", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0")}
            <feBlend in="R" in2="G" mode="screen" result="RG" />
            <feBlend in="RG" in2="B" mode="screen" />
          </filter>
        </svg>
      ) : null}
    </motion.span>
  )
}

/*
 * Whether the glass lens is lifted: from a press until a beat after it ends,
 * so a tap lifts it for the whole trip to the new item.
 */
function useLift(enabled: boolean) {
  const [lifted, setLifted] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const lift = React.useCallback(() => {
    if (!enabled) return
    window.clearTimeout(timer.current)
    setLifted(true)
  }, [enabled])
  const settle = React.useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLifted(false), SETTLE_AFTER)
  }, [])

  return { lifted: enabled && lifted, lift, settle }
}

function useHiddenOnScroll(enabled: boolean) {
  const [hidden, setHidden] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - last
      if (Math.abs(delta) < SCROLL_THRESHOLD) return
      setHidden(delta > 0 && y > HIDE_AFTER)
      last = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [enabled])

  return [enabled && hidden, setHidden] as const
}

/*
 * Each label's natural width in CSS pixels, for the current item to grow
 * into. Motion would measure "auto" on screen instead, which inside a zoomed
 * or scaled parent comes out in the wrong units, so the label ends a few
 * pixels short and snaps. scrollWidth isn't scaled. Measured again once web
 * fonts load, since they change the width, and whenever `key` changes: the
 * labels, their number or the size they're set in.
 */
function useLabelWidths(key: string, enabled: boolean) {
  const labels = React.useRef<(HTMLSpanElement | null)[]>([])
  const [widths, setWidths] = React.useState<number[]>([])

  React.useLayoutEffect(() => {
    if (!enabled) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      // A pixel over, since scrollWidth rounds and would clip the last letter.
      setWidths(
        labels.current.map((label) => (label ? label.scrollWidth + 1 : 0))
      )
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
    }
  }, [key, enabled])

  return [labels, widths] as const
}

function FloatingNav({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  labels = "active",
  size = "default",
  position = "fixed",
  hideOnScroll = false,
  variant = "default",
  className,
  onFocus,
  "aria-label": ariaLabel = "Main",
  ...props
}: FloatingNavProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = valueProp !== undefined ? valueProp : uncontrolled
  const [hidden, setHidden] = useHiddenOnScroll(hideOnScroll)
  const reduceMotion = useReducedMotion()
  const indicatorId = React.useId()
  const glass = variant === "glass"
  const transition = reduceMotion
    ? { duration: 0 }
    : glass
      ? GLASS_SPRING
      : SPRING
  const { lifted, lift, settle } = useLift(glass && !reduceMotion)
  const [labelRefs, labelWidths] = useLabelWidths(
    [size, ...items.map((item) => item.label)].join("\n"),
    labels !== "always"
  )

  return (
    <nav
      data-slot="floating-nav"
      data-position={position}
      data-labels={labels}
      data-size={size}
      data-variant={variant}
      data-hidden={hidden ? "" : undefined}
      aria-label={ariaLabel}
      // A keyboard user tabbing into a hidden bar brings it back.
      onFocus={(event) => {
        onFocus?.(event)
        setHidden(false)
      }}
      className={cn(
        "flex justify-center",
        position === "fixed" &&
          "pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 px-4",
        className
      )}
      {...props}
    >
      <motion.ul
        data-slot="floating-nav-list"
        initial={false}
        animate={
          hidden ? { y: "calc(100% + 2rem)", opacity: 0 } : { y: 0, opacity: 1 }
        }
        // Glass swells a touch under a finger, as Apple's bars do.
        whileTap={glass && !reduceMotion ? { scale: 1.03 } : undefined}
        onPointerDown={lift}
        onPointerUp={settle}
        onPointerCancel={settle}
        transition={transition}
        className={cn(
          floatingNavVariants({ variant, size }),
          // Out of sight, it mustn't catch taps meant for the page beneath.
          // Its items stay focusable, so tabbing in still brings it back.
          hidden && "pointer-events-none"
        )}
      >
        {glass ? <GlassSurface /> : null}
        {items.map((item, index) => {
          const current = item.value === value
          const handleClick = (
            event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
          ) => {
            if (valueProp === undefined) setUncontrolled(item.value)
            onValueChange?.(item.value, event)
            // Enter and Space lift it too, for the trip to the new item.
            if (item.value !== value) {
              lift()
              settle()
            }
          }
          const content = (
            <>
              {current && glass ? (
                <GlassLens
                  layoutId={indicatorId}
                  lifted={lifted}
                  transition={transition}
                />
              ) : current ? (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  transition={transition}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              ) : null}
              {item.icon != null ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative flex items-center justify-center [&_svg]:shrink-0",
                    size === "sm"
                      ? "size-4 [&_svg]:size-4"
                      : "size-5 [&_svg]:size-5"
                  )}
                >
                  {item.icon}
                </span>
              ) : null}
              {item.icon == null ? (
                <span className="relative whitespace-nowrap">{item.label}</span>
              ) : labels === "always" ? (
                <span className="relative">{item.label}</span>
              ) : (
                // Kept in the DOM at zero width, so every item keeps its name
                // and the current one can grow into it.
                <motion.span
                  ref={(label) => {
                    labelRefs.current[index] = label
                  }}
                  initial={false}
                  animate={
                    current
                      ? {
                          width: labelWidths[index] || "auto",
                          opacity: 1,
                          marginLeft: size === "sm" ? 6 : 8,
                        }
                      : { width: 0, opacity: 0, marginLeft: 0 }
                  }
                  transition={transition}
                  className="relative overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </>
          )
          const itemProps = {
            "data-slot": "floating-nav-item",
            "data-current": current ? "" : undefined,
            // "page" only means something on a link; a button item marks
            // the current one of a set.
            "aria-current": current
              ? item.href !== undefined
                ? ("page" as const)
                : ("true" as const)
              : undefined,
            onClick: handleClick,
            className: cn(
              floatingNavItemVariants({ variant, labels, size }),
              item.icon == null && (size === "sm" ? "px-3.5" : "px-4")
            ),
          }
          return (
            <li key={item.value} className="flex">
              {item.href !== undefined ? (
                <a href={item.href} {...itemProps}>
                  {content}
                </a>
              ) : (
                <button type="button" {...itemProps}>
                  {content}
                </button>
              )}
            </li>
          )
        })}
      </motion.ul>
    </nav>
  )
}

export {
  FloatingNav,
  floatingNavItemVariants,
  floatingNavVariants,
  type FloatingNavItem,
  type FloatingNavProps,
}
