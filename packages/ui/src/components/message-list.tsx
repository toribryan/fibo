"use client"

import * as React from "react"
import { CornerUpRightIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  EmptyState,
  EmptyStateTitle,
} from "@workspace/ui/components/empty-state"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

type ChatAuthor = {
  /** Stable id. A new group starts when it changes. */
  id: string
  /** Display name, shown in the group's heading. */
  name: string
  /** Image URL. Initials stand in without one. */
  avatar?: string
}

type ChatReply = {
  /** The id of the message being replied to. */
  id: string
  /** Who wrote it. */
  name: string
  /** A short excerpt of it. */
  text: string
}

type ChatMessage = {
  /** Stable id, unique in the list. */
  id: string
  /** Who sent it. */
  author: ChatAuthor
  /** When it was sent. */
  sentAt: Date
  /** The body. */
  content: React.ReactNode
  /** `system` for events like someone joining, set apart from conversation. */
  kind?: "message" | "system"
  /** The message was deleted; its content is replaced. */
  deleted?: boolean
  /** The message it answers, quoted above it. */
  replyTo?: ChatReply
}

type BreakContext = {
  /** The first message of the group so far. */
  first: ChatMessage
  /** The window, in milliseconds. */
  windowMs: number
  /** Whether the window runs from the previous message or the group's first. */
  windowFrom: "previous" | "first"
  /** Ids of messages with a divider above them. */
  dividers: ReadonlySet<string>
}

type BreakRule = (
  previous: ChatMessage,
  message: ChatMessage,
  context: BreakContext
) => boolean

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/*
 * Each reason a message starts a new group, checked in this order; the first
 * that holds is the one reported. Element, Zulip and Stream all break on
 * these. Keeping them as named rules lets each be tested, and lets a product
 * see why two messages didn't merge.
 */
const breakRules = {
  divider: (_, message, { dividers }) => dividers.has(message.id),
  day: (previous, message) => !sameDay(previous.sentAt, message.sentAt),
  system: (previous, message) =>
    previous.kind === "system" || message.kind === "system",
  deleted: (previous, message) =>
    Boolean(previous.deleted) || Boolean(message.deleted),
  reply: (_, message) => Boolean(message.replyTo),
  author: (previous, message) => previous.author.id !== message.author.id,
  // Same person under a new name or picture: the old heading would be wrong.
  identity: (previous, message) =>
    previous.author.name !== message.author.name ||
    previous.author.avatar !== message.author.avatar,
  window: (previous, message, { first, windowMs, windowFrom }) =>
    message.sentAt.getTime() -
      (windowFrom === "first" ? first : previous).sentAt.getTime() >
    windowMs,
} satisfies Record<string, BreakRule>

type BreakReason = "start" | keyof typeof breakRules

type MessagePosition = "single" | "first" | "middle" | "last"

type GroupedMessage = {
  message: ChatMessage
  /** Where it sits in its group, for squaring off bubble corners. */
  position: MessagePosition
  /** Why it starts a group, or null when it continues one. */
  breakReason: BreakReason | null
  /** It's the first message on its calendar day. */
  newDay: boolean
}

type GroupOptions = {
  /** Minutes a group stays open. */
  windowMinutes?: number
  /** Measure the window from the previous message (rolling) or the group's first (fixed). */
  windowFrom?: "previous" | "first"
  /** Ids of messages with a divider above them, such as the first unread. */
  dividers?: Iterable<string>
}

/*
 * Grouping depends on each message's neighbours, so run it over the whole
 * list before virtualizing. Run on only the rendered window, the first row
 * would always look like the start of a group.
 */
function groupMessages(
  messages: readonly ChatMessage[],
  { windowMinutes = 5, windowFrom = "previous", dividers }: GroupOptions = {}
): GroupedMessage[] {
  const rules = Object.entries(breakRules) as [
    keyof typeof breakRules,
    BreakRule,
  ][]
  const base = {
    windowMs: windowMinutes * 60_000,
    windowFrom,
    dividers: new Set(dividers),
  }

  let first = messages[0]
  const reasons = messages.map((message, i): BreakReason | null => {
    const previous = messages[i - 1]
    if (!previous || !first) {
      first = message
      return "start"
    }
    const context = { ...base, first }
    const match = rules.find(([, rule]) => rule(previous, message, context))
    if (!match) return null
    first = message
    return match[0]
  })

  return messages.map((message, i) => {
    const starts = reasons[i] !== null
    const ends = i === messages.length - 1 || reasons[i + 1] !== null
    const previous = messages[i - 1]
    return {
      message,
      position: starts ? (ends ? "single" : "first") : ends ? "last" : "middle",
      breakReason: reasons[i] ?? null,
      newDay: !previous || !sameDay(previous.sentAt, message.sentAt),
    }
  })
}

type MessageListStrings = {
  /** The accessible name of the whole list. */
  list: string
  /** The accessible name of each message. Screen reader users can land mid-group, so it names the author every time. */
  label: (message: ChatMessage, time: string) => string
  /** Shown in place of a deleted message. */
  deleted: string
  /** Read before a reply's quote. */
  replyingTo: (name: string) => string
  /** The label on the unread divider. */
  unread: string
  /** Shown when there are no messages yet. */
  empty: string
}

const defaultStrings: MessageListStrings = {
  list: "Messages",
  label: (message, time) =>
    message.kind === "system"
      ? time
      : message.deleted
        ? `Deleted message from ${message.author.name}, ${time}`
        : `${message.author.name}, ${time}`,
  deleted: "This message was deleted.",
  replyingTo: (name) => `Replying to ${name}`,
  unread: "New",
  empty: "No messages yet",
}

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "iframe",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  "[tabindex]",
].join(", ")

// Where a locked control's own tabindex waits ("" when it had none).
const LOCK = "data-locked-tabindex"

/*
 * One Tab stop for the whole list: controls inside a message stay out of the
 * tab order until the message is entered. Content is the caller's markup, so
 * this works on the DOM, and runs again whenever that markup changes.
 */
function syncLocks(root: HTMLElement, enteredId: string | null) {
  for (const article of root.querySelectorAll<HTMLElement>(
    '[data-slot="message"]'
  )) {
    const open = article.dataset.id === enteredId
    for (const el of article.querySelectorAll<HTMLElement>(FOCUSABLE)) {
      const current = el.getAttribute("tabindex")
      if (open) {
        if (!el.hasAttribute(LOCK)) continue
        const original = el.getAttribute(LOCK)
        el.removeAttribute(LOCK)
        if (original) el.setAttribute("tabindex", original)
        else el.removeAttribute("tabindex")
      } else if (current !== "-1" || !el.hasAttribute(LOCK)) {
        // Also catches the caller changing tabIndex on a locked control:
        // their new value is kept for when the message opens.
        el.setAttribute(LOCK, current ?? "")
        el.setAttribute("tabindex", "-1")
      }
    }
  }
}

// The first control in a message the caller meant to be reachable.
function firstControl(article: HTMLElement) {
  return Array.from(article.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
    (el) =>
      (el.getAttribute(LOCK) ?? el.getAttribute("tabindex")) !== "-1" &&
      !el.matches(":disabled") &&
      el.getClientRects().length > 0
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase()
}

type MessageListProps = Omit<React.ComponentProps<"div">, "children"> &
  Omit<GroupOptions, "dividers"> & {
    /** The conversation, oldest first. */
    messages: ChatMessage[]
    /** The first unread message. Freeze it when the conversation opens, so the divider stays put while people read. */
    unreadFrom?: string
    /** Labels for dividers above messages, keyed by message id. Each one also breaks the group. */
    dividers?: Record<string, string>
    /** The level of each group's heading. */
    headingLevel?: 2 | 3 | 4 | 5 | 6
    /** Locale for times and dates. */
    locale?: string
    /** Copy for screen readers and deleted messages. Swap it to translate. */
    strings?: Partial<MessageListStrings>
    /** Shown in place of the conversation when there are no messages. Defaults to an EmptyState with `strings.empty`; null shows nothing. */
    empty?: React.ReactNode
  }

function MessageList({
  messages,
  windowMinutes,
  windowFrom,
  unreadFrom,
  dividers = {},
  headingLevel = 3,
  locale = "en",
  strings: stringOverrides,
  empty,
  className,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: MessageListProps) {
  const strings = { ...defaultStrings, ...stringOverrides }
  const dividerKey = [...Object.keys(dividers), unreadFrom ?? ""]
    .filter(Boolean)
    .join("\u0000")
  const grouped = React.useMemo(
    () =>
      groupMessages(messages, {
        windowMinutes,
        windowFrom,
        dividers: dividerKey ? dividerKey.split("\u0000") : [],
      }),
    [messages, windowMinutes, windowFrom, dividerKey]
  )

  const time = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
    [locale]
  )
  const day = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    [locale]
  )

  const listRef = React.useRef<HTMLDivElement>(null)
  // The index is kept so a removed message's neighbour can take its place.
  const [active, setActive] = React.useState<{
    id: string
    index: number
  } | null>(null)
  const [enteredId, setEnteredId] = React.useState<string | null>(null)
  const focusWithin = React.useRef(false)

  const found = messages.findIndex((m) => m.id === active?.id)
  const current =
    messages[
      found !== -1
        ? found
        : Math.min(active?.index ?? Infinity, messages.length - 1)
    ]?.id ?? null
  const entered = messages.some((m) => m.id === enteredId) ? enteredId : null

  React.useLayoutEffect(() => {
    const root = listRef.current
    if (!root) return
    syncLocks(root, entered)
    // The caller's content can add controls without this list re-rendering.
    const observer = new MutationObserver(() => syncLocks(root, entered))
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["tabindex", "href", "contenteditable", "controls"],
    })
    return () => observer.disconnect()
  }, [entered])

  /*
   * React fires no blur when a focused element unmounts, so a deleted
   * message would drop focus to the page. Put it on the neighbour instead.
   */
  React.useLayoutEffect(() => {
    const root = listRef.current
    if (!root || !focusWithin.current || root.contains(document.activeElement))
      return
    root
      .querySelector<HTMLElement>(`[data-slot="message"][tabindex="0"]`)
      ?.focus()
  }, [messages])

  function articles() {
    return Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-slot="message"]') ??
        []
    )
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const target = event.target as HTMLElement
    const article = target.closest<HTMLElement>('[data-slot="message"]')
    if (!article) return

    if (target !== article) {
      if (event.key === "Escape") {
        event.preventDefault()
        setEnteredId(null)
        article.focus()
      }
      return
    }

    const all = articles()
    const index = all.indexOf(article)
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }
    const moves: Record<string, HTMLElement | undefined> = {
      ArrowDown: all[index + 1],
      ArrowUp: all[index - 1],
      Home: all[0],
      End: all[all.length - 1],
    }
    if (event.key in moves) {
      event.preventDefault()
      moves[event.key]?.focus()
      return
    }

    if (event.key === "Enter") {
      const inner = firstControl(article)
      if (!inner) return
      event.preventDefault()
      // Focusing it marks the message entered, which puts its controls back
      // in the tab order.
      inner.focus()
    }
  }

  const Heading = `h${headingLevel}` as const

  return (
    <div
      ref={listRef}
      role="log"
      aria-label={strings.list}
      data-slot="message-list"
      className={cn(
        "flex flex-col [--message-gap:0.125rem] [--message-group-gap:1rem]",
        className
      )}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        focusWithin.current = true
        onFocus?.(event)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focusWithin.current = false
        }
        onBlur?.(event)
      }}
      {...props}
    >
      {messages.length === 0 ? (
        empty === undefined ? (
          <EmptyState>
            <EmptyStateTitle>{strings.empty}</EmptyStateTitle>
          </EmptyState>
        ) : (
          empty
        )
      ) : null}
      {grouped.map(({ message, position, breakReason, newDay }, i) => {
        const sent = time.format(message.sentAt)
        const iso = message.sentAt.toISOString()
        const starts = position === "single" || position === "first"
        const plain = message.kind === "system" || message.deleted
        const divider = dividers[message.id]

        return (
          <React.Fragment key={message.id}>
            {newDay || divider || message.id === unreadFrom ? (
              <MessageDivider
                label={
                  [newDay ? day.format(message.sentAt) : "", divider ?? ""]
                    .filter(Boolean)
                    .join(" \u00b7 ") || undefined
                }
                unread={message.id === unreadFrom ? strings.unread : undefined}
              />
            ) : null}
            <article
              data-slot="message"
              data-id={message.id}
              data-position={position}
              data-break={breakReason ?? undefined}
              data-kind={message.kind ?? "message"}
              data-deleted={message.deleted ? "" : undefined}
              aria-label={strings.label(message, sent)}
              tabIndex={message.id === current ? 0 : -1}
              onFocus={(event) => {
                setActive({ id: message.id, index: i })
                if (event.target !== event.currentTarget) {
                  setEnteredId(message.id)
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setEnteredId((id) => (id === message.id ? null : id))
                }
              }}
              // A touch has no hover, and not every browser focuses what is
              // tapped, so a tap focuses the message to show its time.
              onPointerDown={(event) => {
                if (
                  event.pointerType !== "mouse" &&
                  !event.currentTarget.contains(document.activeElement)
                ) {
                  event.currentTarget.focus({ preventScroll: true })
                }
              }}
              className={cn(
                "group/message grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 rounded-md px-2 py-0.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
                starts
                  ? "mt-[var(--message-group-gap)] pt-1"
                  : "mt-[var(--message-gap)]",
                "first:mt-0"
              )}
            >
              {starts && !plain ? (
                <Avatar size="lg" className="row-span-3 mt-0.5">
                  {message.author.avatar ? (
                    <AvatarImage src={message.author.avatar} alt="" />
                  ) : null}
                  <AvatarFallback aria-hidden>
                    {initials(message.author.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <time
                  dateTime={iso}
                  data-slot="message-time"
                  className="row-span-3 pt-0.5 text-right text-[10px] leading-5 text-muted-foreground tabular-nums opacity-0 group-focus-within/message:opacity-100 group-hover/message:opacity-100"
                >
                  {sent}
                </time>
              )}

              {message.replyTo ? (
                <p
                  data-slot="message-reply"
                  className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <CornerUpRightIcon aria-hidden className="size-3 shrink-0" />
                  <span className="sr-only">
                    {strings.replyingTo(message.replyTo.name)}:
                  </span>
                  <span aria-hidden className="font-medium text-foreground">
                    {message.replyTo.name}
                  </span>
                  <span className="truncate">{message.replyTo.text}</span>
                </p>
              ) : null}

              {starts && !plain ? (
                <Heading
                  data-slot="message-heading"
                  className="flex items-baseline gap-2 text-sm leading-5"
                >
                  <span className="font-semibold text-foreground">
                    {message.author.name}
                  </span>
                  <time
                    dateTime={iso}
                    data-slot="message-time"
                    className="text-xs text-muted-foreground tabular-nums"
                  >
                    {sent}
                  </time>
                </Heading>
              ) : null}

              <div
                data-slot="message-content"
                className={cn(
                  "min-w-0 leading-5 break-words",
                  plain ? "text-muted-foreground italic" : "text-foreground"
                )}
              >
                {message.deleted ? strings.deleted : message.content}
              </div>
            </article>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/*
 * One divider carries whatever marks a message: its date, a caller's label,
 * the unread marker. A new day that is also where unread messages begin
 * draws one line, not two.
 */
function MessageDivider({
  label,
  unread,
}: {
  /** What the divider marks, such as a date, or a date and a label. */
  label?: string
  /** The unread marker's label. Turns the line red, with the label beside it. */
  unread?: string
}) {
  return (
    <Separator
      data-slot="message-divider"
      data-unread={unread ? "" : undefined}
      aria-label={[label, unread].filter(Boolean).join(", ")}
      className="mt-[var(--message-group-gap)] first:mt-0 data-unread:*:data-[slot=separator-line]:bg-destructive"
    >
      {label}
      {unread ? (
        // A word as well as a colour, since red alone carries nothing for
        // people who can't tell it apart (WCAG 1.4.1).
        <span
          data-slot="message-divider-unread"
          className="rounded-sm bg-destructive px-1.5 py-0.5 text-[10px] leading-none font-semibold text-destructive-foreground not-first:ml-3"
        >
          {unread}
        </span>
      ) : null}
    </Separator>
  )
}

export {
  MessageList,
  groupMessages,
  breakRules,
  type MessageListProps,
  type MessageListStrings,
  type ChatMessage,
  type ChatAuthor,
  type ChatReply,
  type GroupedMessage,
  type GroupOptions,
  type BreakReason,
  type MessagePosition,
}
