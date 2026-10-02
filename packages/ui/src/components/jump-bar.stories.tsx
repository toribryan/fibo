import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { SendIcon } from "lucide-react"
import { expect, fn, userEvent, waitFor } from "storybook/test"

import { Button } from "./button.js"
import { JumpBar, jumpTo, useAtBottom, type JumpBarProps } from "./jump-bar.js"
import {
  MessageList,
  type ChatAuthor,
  type ChatMessage,
} from "./message-list.js"
import { Textarea } from "./textarea.js"
import { TypingIndicator } from "./typing-indicator.js"

const meta: Meta<JumpBarProps> = {
  title: "Base components/Jump bar",
  component: JumpBar,
  tags: ["new"],
  argTypes: {
    type: {
      control: "inline-radio",
      options: ["unread-above", "new-below", "history"],
    },
    count: { control: { type: "range", min: 0, max: 250, step: 1 } },
    since: { control: false },
    onJump: { control: false },
    onMarkRead: { control: false },
    strings: { control: false },
    locale: { control: false },
  },
  args: {
    type: "unread-above",
    count: 12,
    since: new Date(2026, 9, 1, 15, 42),
    onJump: fn(),
    onMarkRead: fn(),
  },
  parameters: {
    controls: {
      exclude: ["since", "onJump", "onMarkRead", "strings", "locale"],
    },
  },
  decorators: [
    // The bars position themselves inside a relative container, as they
    // would over a conversation. A full timeline brings its own.
    (Story, { parameters }) =>
      parameters.timeline ? (
        <Story />
      ) : (
        <div className="relative h-32 w-96 max-w-full overflow-hidden rounded-xl border border-border bg-card">
          <Story />
        </div>
      ),
  ],
}

export default meta
type Story = StoryObj<JumpBarProps>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const jump = canvas.getByRole("button", {
      name: /^12 new messages since 3:42/,
    })
    await userEvent.click(jump)
    await expect(args.onJump).toHaveBeenCalledTimes(1)

    await userEvent.tab()
    await expect(
      canvas.getByRole("button", { name: "Mark as read" })
    ).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onMarkRead).toHaveBeenCalledTimes(1)
  },
}

export const NewBelow: Story = {
  name: "New messages below",
  args: { type: "new-below", count: 3 },
}

export const Capped: Story = {
  name: "Over 99",
  args: { type: "new-below", count: 128 },
  play: async ({ canvas }) => {
    // Capped on screen; the full count follows in the name.
    await expect(
      canvas.getByRole("button", { name: "99+ new messages (128)" })
    ).toBeVisible()
  },
}

export const History: Story = {
  name: "Viewing history",
  args: { type: "history" },
}

const ME = "me"
const people: Record<string, ChatAuthor> = {
  ana: { id: "ana", name: "Ana Ruiz" },
  ben: { id: "ben", name: "Ben Okafor" },
  me: { id: ME, name: "You" },
}

const lines = [
  ["ana", "Morning. Status tokens are up for review."],
  ["ben", "Looking now."],
  ["ben", "Warning reads a bit dark on cards."],
  ["ana", "It's the 700 step so it clears AA at badge size."],
  ["me", "Makes sense to me."],
  ["ben", "Fine by me too."],
  ["ana", "Next up: the chat timeline."],
  ["ana", "Typing indicator is in review."],
  ["ben", "Message list after that?"],
  ["ana", "Yes, stacked on it."],
  ["me", "I'll take the jump bar."],
  ["ben", "Does the divider move as you read?"],
  ["me", "No, it stays where it was when you opened the channel."],
  ["ana", "Like Discord's red line."],
  ["ben", "And Esc marks it read?"],
  ["me", "Esc, sending a message, or the button."],
  ["ana", "Lunch?"],
  ["ben", "Ten minutes."],
  ["ana", "Pushed the divider styles."],
  ["ben", "The New label is a nice touch."],
  ["ana", "Colour alone wasn't enough."],
  ["ben", "Checked it in dark mode too."],
  ["ana", "Merging after the review."],
  ["ben", "Ship it."],
] as const

const FIRST_UNREAD = 16

const history: ChatMessage[] = lines.map(([who, text], i) => ({
  id: `m${i}`,
  author: people[who]!,
  sentAt: new Date(2026, 9, 1, 9, i * 3),
  content: text,
}))

const replies = [
  "One more thing on the tokens.",
  "Never mind, found it.",
  "Back after the standup.",
]

function Timeline() {
  const [messages, setMessages] = useState(history)
  // Frozen when the conversation opens; reading doesn't move it.
  const [unreadFrom, setUnreadFrom] = useState<string | undefined>(
    history[FIRST_UNREAD]!.id
  )
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const atBottom = useAtBottom(scroller)
  // Set by the scroll that opens the conversation at its end.
  const [dividerAbove, setDividerAbove] = useState(false)
  const [far, setFar] = useState(false)
  const [newBelow, setNewBelow] = useState(0)
  const [draft, setDraft] = useState("")
  const [typing, setTyping] = useState(false)
  const composer = useRef<HTMLTextAreaElement>(null)
  const snap = useRef(true)

  useEffect(() => {
    if (!scroller || !snap.current) return
    snap.current = false
    scroller.scrollTo({ top: scroller.scrollHeight })
  }, [scroller, messages])

  const unreadCount = unreadFrom
    ? messages.length - messages.findIndex((m) => m.id === unreadFrom)
    : 0

  function article(id: string) {
    return scroller?.querySelector<HTMLElement>(
      `[data-slot="message"][data-id="${id}"]`
    )
  }

  function markRead() {
    setUnreadFrom(undefined)
    // The button that was focused is about to disappear.
    composer.current?.focus()
  }

  function jumpToPresent() {
    setNewBelow(0)
    const last = messages[messages.length - 1]
    const target = last && article(last.id)
    if (target) jumpTo(target, { container: scroller, block: "end" })
  }

  function receive() {
    setTyping(false)
    if (!atBottom) setNewBelow((n) => n + 1)
    else snap.current = true
    setMessages((list) => [
      ...list,
      {
        id: `in${list.length}`,
        author: people.ben!,
        sentAt: new Date(2026, 9, 1, 12, list.length),
        content: replies[list.length % replies.length],
      },
    ])
  }

  function send() {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    setUnreadFrom(undefined)
    setNewBelow(0)
    snap.current = true
    setMessages((list) => [
      ...list,
      {
        id: `out${list.length}`,
        author: people.me!,
        sentAt: new Date(2026, 9, 1, 12, list.length),
        content: text,
      },
    ])
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const onMessage = (event.target as HTMLElement).dataset.slot === "message"
    if (event.key === "Escape" && onMessage) markRead()
  }

  const bottom =
    newBelow > 0 ? "new-below" : !atBottom && far ? "history" : null

  return (
    <div className="flex w-[28rem] max-w-full flex-col gap-2">
      <div className="relative">
        <div
          ref={setScroller}
          className="h-96 overflow-y-auto rounded-xl border border-border bg-card p-3"
          onScroll={(event) => {
            const box = event.currentTarget
            const divider = box.querySelector("[data-unread]")
            setDividerAbove(
              !!divider &&
                divider.getBoundingClientRect().top <
                  box.getBoundingClientRect().top
            )
            setFar(
              box.scrollHeight - box.scrollTop - box.clientHeight >
                box.clientHeight * 2
            )
            if (box.scrollHeight - box.scrollTop - box.clientHeight <= 150) {
              setNewBelow(0)
            }
          }}
        >
          <MessageList
            messages={messages}
            unreadFrom={unreadFrom}
            aria-label="#design-system"
            onKeyDown={onListKeyDown}
          />
        </div>
        {unreadFrom && dividerAbove ? (
          <JumpBar
            type="unread-above"
            count={unreadCount}
            since={history[FIRST_UNREAD]!.sentAt}
            onJump={() => {
              const target = article(unreadFrom)
              if (target) jumpTo(target, { container: scroller })
            }}
            onMarkRead={markRead}
          />
        ) : null}
        {bottom ? (
          <JumpBar type={bottom} count={newBelow} onJump={jumpToPresent} />
        ) : null}
      </div>
      <TypingIndicator
        people={typing ? [people.ben!] : []}
        currentUserId={ME}
        announceDelay={500}
      />
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
      >
        <Textarea
          ref={composer}
          aria-label="Message #design-system"
          placeholder="Message #design-system"
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              send()
            }
            if (event.key === "Escape") markRead()
          }}
          className="min-h-9 flex-1 resize-none"
        />
        <Button type="submit" size="icon" aria-label="Send">
          <SendIcon />
        </Button>
      </form>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setTyping(true)}>
          Ben starts typing
        </Button>
        <Button size="sm" variant="outline" onClick={receive}>
          Ben sends a message
        </Button>
      </div>
    </div>
  )
}

export const InATimeline: Story = {
  name: "In a timeline",
  parameters: { timeline: true },
  render: () => <Timeline />,
  play: async ({ canvas }) => {
    const divider = canvas.getByRole("separator", { name: "New" })
    await expect(divider).toBeInTheDocument()

    const markRead = await waitFor(() =>
      canvas.getByRole("button", { name: "Mark as read" })
    )
    await userEvent.click(markRead)
    await expect(
      canvas.queryByRole("separator", { name: "New" })
    ).not.toBeInTheDocument()
    // Focus lands on the composer, not on the bar that vanished.
    await expect(
      canvas.getByRole("textbox", { name: "Message #design-system" })
    ).toHaveFocus()
  },
}
