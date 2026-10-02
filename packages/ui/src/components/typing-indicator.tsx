"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type TypingPerson = {
  /** Stable id, compared with `currentUserId`. */
  id: string
  /** Display name, as it should read in the sentence. */
  name: string
  /** Replaces the dots while this person is the only one typing. Held to 16px tall. */
  indicator?: React.ReactNode
}

type TypingSentence = {
  /** Everyone typing, the current person left out. */
  count: number
  /** The names to show, at most `maxNames` of them. Empty past that. */
  names: string[]
  /** `names` joined for the locale, such as "Ana, Ben, and Cy". */
  list: string
}

type TypingFormatter = (sentence: TypingSentence) => string

/*
 * One whole sentence per case, never "x" + " and " + "y": other languages
 * change the verb, the word order and the plural form with the count, so a
 * translator needs the full sentence for each. `list` comes from
 * Intl.ListFormat, which already knows each locale's "and".
 */
const formatTyping: TypingFormatter = ({ count, names, list }) => {
  if (count === 0) return ""
  if (names.length === 0) return "Several people are typing…"
  return count === 1 ? `${list} is typing…` : `${list} are typing…`
}

function shorten(name: string, limit: number) {
  // Room for at least one letter before the ellipsis.
  const max = Math.max(2, limit)
  const chars = Array.from(name)
  return chars.length > max
    ? `${chars
        .slice(0, max - 1)
        .join("")
        .trimEnd()}…`
    : name
}

/*
 * Screen readers hear the sentence once it has held still for `delay`, so a
 * burst of people starting and stopping reads as one update instead of a
 * stream. Clearing is immediate and silent: an emptied status region isn't
 * announced, and nobody needs telling that a person stopped typing.
 */
function useSettled(value: string, delay: number) {
  const [settled, setSettled] = React.useState("")
  React.useEffect(() => {
    // An empty value resets at once too, so a stale sentence can't flash
    // back when someone starts typing again.
    const id = window.setTimeout(() => setSettled(value), value ? delay : 0)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return value ? settled : ""
}

type TypingIndicatorProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Everyone typing right now. Pass the current person too; they're left out. */
  people: TypingPerson[]
  /** The id of the person looking at the screen, who never sees themselves typing. */
  currentUserId?: string
  /** How many people to name before switching to "Several people". */
  maxNames?: number
  /** Characters a name may take before it's cut short on screen, at least 2. Announcements keep it whole. */
  maxNameLength?: number
  /** Builds the sentence. Swap it to translate; the default is English. */
  format?: TypingFormatter
  /** Locale for joining names, passed to Intl.ListFormat. */
  locale?: string
  /** Milliseconds the sentence must hold still before screen readers hear it. */
  announceDelay?: number
}

function TypingIndicator({
  people,
  currentUserId,
  maxNames = 3,
  maxNameLength = 24,
  format = formatTyping,
  locale = "en",
  announceDelay = 1500,
  className,
  ...props
}: TypingIndicatorProps) {
  // One person typing on two devices sends two events; they're still one name.
  const typing = [
    ...new Map(
      people
        .filter((person) => person.id !== currentUserId)
        .map((person) => [person.id, person])
    ).values(),
  ]
  const count = typing.length
  const named = count <= maxNames ? typing : []

  const join = React.useMemo(
    () => new Intl.ListFormat(locale, { type: "conjunction" }),
    [locale]
  )
  const sentence = (names: string[]) =>
    format({ count, names, list: join.format(names) })

  const shown = sentence(named.map((p) => shorten(p.name, maxNameLength)))
  const spoken = useSettled(sentence(named.map((p) => p.name)), announceDelay)

  const custom = count === 1 ? typing[0]?.indicator : undefined

  return (
    <div
      data-slot="typing-indicator"
      data-active={count > 0 ? "" : undefined}
      className={cn(
        // A fixed height that's there even when nobody is typing, so the
        // message list above doesn't jump each time someone starts.
        "flex h-6 min-w-0 items-center gap-2 text-xs text-muted-foreground",
        className
      )}
      {...props}
    >
      {count > 0 ? (
        <div aria-hidden className="flex min-w-0 items-center gap-2">
          {/* A fixed height rather than a cap, so the dots have room to
              rise inside the clip that holds a custom indicator to 16px. */}
          <span
            data-slot="typing-indicator-dots"
            className="flex h-4 shrink-0 items-center gap-0.5 overflow-hidden [&_svg]:size-3.5"
          >
            {custom ?? <TypingDots />}
          </span>
          <span data-slot="typing-indicator-text" className="truncate">
            {shown}
          </span>
        </div>
      ) : null}
      <span
        role="status"
        data-slot="typing-indicator-status"
        className="sr-only"
      >
        {spoken}
      </span>
    </div>
  )
}

function TypingDots() {
  return [0, 1, 2].map((i) => (
    <span
      key={i}
      className="size-1 animate-typing-dot rounded-full bg-current motion-reduce:animate-none"
      style={{ animationDelay: `${i * 150}ms` }}
    />
  ))
}

export {
  TypingIndicator,
  formatTyping,
  type TypingIndicatorProps,
  type TypingPerson,
  type TypingSentence,
  type TypingFormatter,
}
