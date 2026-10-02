"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type JumpBarType = "unread-above" | "new-below" | "history"

type JumpBarStrings = {
  /** Unread messages above. `shown` is the count as displayed, capped at 99+. `since` is empty without a time. */
  unreadAbove: (count: number, shown: string, since: string) => string
  /** New messages below. */
  newBelow: (count: number, shown: string) => string
  /** The history bar's message. */
  history: string
  /** The mark as read button. */
  markRead: string
  /** The jump to present button. */
  jumpToPresent: string
}

const plural = (count: number) => (count === 1 ? "message" : "messages")

const defaultStrings: JumpBarStrings = {
  unreadAbove: (count, shown, since) =>
    since
      ? `${shown} new ${plural(count)} since ${since}`
      : `${shown} new ${plural(count)}`,
  newBelow: (count, shown) => `${shown} new ${plural(count)}`,
  history: "You're viewing older messages",
  markRead: "Mark as read",
  jumpToPresent: "Jump to present",
}

const MAX_SHOWN = 99

type JumpBarProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Which bar: unread messages above, new messages below, or reading history. */
  type: JumpBarType
  /** How many unread or new messages. Shown up to 99+, read out in full. */
  count?: number
  /** When the unread messages begin, for `unread-above`. */
  since?: Date
  /** Jumps to the first unread message, the newest message, or the present. */
  onJump?: () => void
  /** Marks the conversation read, for `unread-above`. */
  onMarkRead?: () => void
  /** Locale for the count and time. */
  locale?: string
  /** The bar's copy. Swap it to translate. */
  strings?: Partial<JumpBarStrings>
}

const BUTTON =
  "inline-flex items-center gap-1.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle [&_svg]:size-3.5 [&_svg]:shrink-0"

function JumpBar({
  type,
  count = 0,
  since,
  onJump,
  onMarkRead,
  locale = "en",
  strings: overrides,
  className,
  ...props
}: JumpBarProps) {
  const strings = { ...defaultStrings, ...overrides }
  const number = new Intl.NumberFormat(locale)
  const shown =
    count > MAX_SHOWN ? `${number.format(MAX_SHOWN)}+` : number.format(count)
  // A capped count keeps the visible words in the name, so speech input can
  // say what's on screen, and adds the full number after them (WCAG 2.5.3).
  const exact =
    count > MAX_SHOWN ? (
      <span className="sr-only"> ({number.format(count)})</span>
    ) : null
  const time = since
    ? new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
      }).format(since)
    : ""

  if (type === "unread-above") {
    return (
      <div
        data-slot="jump-bar"
        data-type={type}
        className={cn(
          "absolute inset-x-2 top-2 z-10 flex items-center justify-between gap-2 rounded-lg bg-primary px-1 text-xs text-primary-foreground shadow-md",
          className
        )}
        {...props}
      >
        <button
          type="button"
          className={cn(
            BUTTON,
            "min-w-0 px-2 py-1.5 font-medium hover:bg-primary-hover"
          )}
          onClick={onJump}
        >
          <ArrowUpIcon aria-hidden />
          <span className="truncate">
            {strings.unreadAbove(count, shown, time)}
          </span>
          {exact}
        </button>
        <button
          type="button"
          className={cn(BUTTON, "shrink-0 px-2 py-1 hover:bg-primary-hover")}
          onClick={onMarkRead}
        >
          {strings.markRead}
        </button>
      </div>
    )
  }

  if (type === "new-below") {
    return (
      <div
        data-slot="jump-bar"
        data-type={type}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center",
          className
        )}
        {...props}
      >
        <button
          type="button"
          className={cn(
            BUTTON,
            "pointer-events-auto h-8 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-md hover:bg-primary-hover"
          )}
          onClick={onJump}
        >
          {strings.newBelow(count, shown)}
          {exact}
          <ArrowDownIcon aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      data-slot="jump-bar"
      data-type={type}
      className={cn(
        "absolute inset-x-2 bottom-2 z-10 flex items-center justify-between gap-2 rounded-lg border border-border bg-popover py-1 pr-1 pl-3 text-xs text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      <span className="min-w-0 truncate text-muted-foreground">
        {strings.history}
      </span>
      <button
        type="button"
        className={cn(BUTTON, "shrink-0 px-2 py-1 font-medium hover:bg-muted")}
        onClick={onJump}
      >
        {strings.jumpToPresent}
        <ArrowDownIcon aria-hidden />
      </button>
    </div>
  )
}

/*
 * Whether a scroll container sits within `threshold` pixels of its end.
 * Takes the element rather than a ref so it can resubscribe when the
 * element changes: pass it from a callback ref, `ref={setElement}`.
 */
function useAtBottom(element: HTMLElement | null, threshold = 150) {
  const subscribe = React.useCallback(
    (notify: () => void) => {
      if (!element) return () => {}
      element.addEventListener("scroll", notify, { passive: true })
      // Content growing underneath moves the end without a scroll event.
      const resize = new ResizeObserver(notify)
      resize.observe(element)
      for (const child of element.children) resize.observe(child)
      return () => {
        element.removeEventListener("scroll", notify)
        resize.disconnect()
      }
    },
    [element]
  )
  return React.useSyncExternalStore(
    subscribe,
    () =>
      !element ||
      element.scrollHeight - element.scrollTop - element.clientHeight <=
        threshold,
    () => true
  )
}

/*
 * Scrolls a message into view and focuses it, so focus never stays on a bar
 * that's about to disappear. Smooth for a short hop; instant under reduced
 * motion, and for a long jump, where gliding past screens of history helps
 * nobody.
 */
function jumpTo(
  target: HTMLElement,
  {
    container,
    block = "center",
  }: {
    /** The scroll container, to judge how far the jump is. */
    container?: HTMLElement | null
    /** Where the target lands in view. */
    block?: ScrollLogicalPosition
  } = {}
) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const far = container
    ? Math.abs(
        target.getBoundingClientRect().top -
          container.getBoundingClientRect().top
      ) >
      container.clientHeight * 3
    : false
  target.scrollIntoView({
    block,
    behavior: reduce || far ? "instant" : "smooth",
  })
  target.focus({ preventScroll: true })
}

export {
  JumpBar,
  useAtBottom,
  jumpTo,
  type JumpBarProps,
  type JumpBarType,
  type JumpBarStrings,
}
