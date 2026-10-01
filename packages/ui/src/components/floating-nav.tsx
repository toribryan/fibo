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
  /** An icon, usually a 20px Lucide icon. Hidden from screen readers. */
  icon: React.ReactNode
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
  /** `fixed` floats above the page at the bottom of the viewport; `static` sits in the flow. */
  position?: "fixed" | "static"
  /** Slides the bar away while the page scrolls down and back when it scrolls up. */
  hideOnScroll?: boolean
}

const floatingNavItemVariants = cva(
  "relative flex shrink-0 items-center justify-center rounded-full font-medium text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-[current]:text-primary-foreground data-[current]:hover:text-primary-foreground",
  {
    variants: {
      labels: {
        active: "h-11 min-w-11 px-3 text-sm",
        always: "h-14 min-w-16 flex-col gap-0.5 px-3 text-[11px] leading-4",
      },
    },
    defaultVariants: { labels: "active" },
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

function FloatingNav({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  labels = "active",
  position = "fixed",
  hideOnScroll = false,
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
  const transition = reduceMotion ? { duration: 0 } : SPRING

  return (
    <nav
      data-slot="floating-nav"
      data-position={position}
      data-labels={labels}
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
        transition={transition}
        className="pointer-events-auto flex max-w-full [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-full border border-border bg-popover-overlay p-1.5 shadow-lg backdrop-blur-md"
      >
        {items.map((item) => {
          const current = item.value === value
          const handleClick = (
            event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
          ) => {
            if (valueProp === undefined) setUncontrolled(item.value)
            onValueChange?.(item.value, event)
          }
          const content = (
            <>
              {current ? (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  transition={transition}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="relative flex size-5 items-center justify-center [&_svg]:size-5 [&_svg]:shrink-0"
              >
                {item.icon}
              </span>
              {labels === "always" ? (
                <span className="relative">{item.label}</span>
              ) : (
                // Kept in the DOM at zero width, so every item keeps its name
                // and the current one can grow into it.
                <motion.span
                  initial={false}
                  animate={
                    current
                      ? { width: "auto", opacity: 1, marginLeft: 8 }
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
            "aria-current": current ? ("page" as const) : undefined,
            onClick: handleClick,
            className: floatingNavItemVariants({ labels }),
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
  type FloatingNavItem,
  type FloatingNavProps,
}
