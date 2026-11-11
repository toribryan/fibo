"use client"

import {
  MessageList,
  type ChatAuthor,
  type ChatMessage,
} from "@workspace/ui/components/message-list"

const ana: ChatAuthor = { id: "ana", name: "Ana Ruiz" }
const ben: ChatAuthor = { id: "ben", name: "Ben Okafor" }
const bot: ChatAuthor = { id: "system", name: "fibo" }

// September 30 and October 1, 2026, so the list crosses a day.
const at = (day: 30 | 1, hour: number, minute: number) =>
  new Date(2026, day === 30 ? 8 : 9, day, hour, minute)

const conversation: ChatMessage[] = [
  {
    id: "1",
    author: ana,
    sentAt: at(30, 16, 2),
    content: "Pushed the new status tokens to the branch.",
  },
  {
    id: "2",
    author: ana,
    sentAt: at(30, 16, 3),
    content: "Success, warning and info all clear AA now.",
  },
  {
    id: "3",
    author: ben,
    sentAt: at(30, 16, 10),
    content: "Nice. I'll look first thing tomorrow.",
  },
  {
    id: "4",
    author: bot,
    sentAt: at(1, 9, 0),
    kind: "system",
    content: "Cy joined the channel.",
  },
  {
    id: "5",
    author: ben,
    sentAt: at(1, 9, 12),
    content: "Looked through it. Is dark mode in there too?",
  },
  {
    id: "6",
    author: ana,
    sentAt: at(1, 9, 15),
    replyTo: {
      id: "5",
      name: "Ben Okafor",
      text: "Looked through it. Is dark mode in there too?",
    },
    content: "Both themes, and the drift check passes.",
  },
  {
    id: "7",
    author: ana,
    sentAt: at(1, 9, 17),
    content: "Merging after lunch unless anyone shouts.",
  },
]

const burst: ChatMessage[] = [0, 4, 8, 12, 16].map((minute, i) => ({
  id: `b${i}`,
  author: ana,
  sentAt: at(1, 14, minute),
  content: ["Trying a thing.", "Nope.", "Closer.", "Got it.", "Pushed."][i],
}))

export function MessageListDemo() {
  return (
    <div className="w-[26rem] max-w-full">
      <MessageList messages={conversation} />
    </div>
  )
}

export function MessageListWindowDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-8 sm:grid-cols-2">
      {(["previous", "first"] as const).map((from) => {
        const name = from === "previous" ? "Rolling" : "Fixed"
        return (
          <section key={from} className="flex flex-col gap-3">
            <h2 className="m-0 text-xs font-medium text-muted-foreground">
              {name}, 5 minutes
            </h2>
            <MessageList
              aria-label={`${name} window`}
              messages={burst}
              windowMinutes={5}
              windowFrom={from}
            />
          </section>
        )
      })}
    </div>
  )
}

export function MessageListUnreadDemo() {
  return (
    <div className="w-[26rem] max-w-full">
      <MessageList messages={conversation} unreadFrom="6" />
    </div>
  )
}

const pair: ChatMessage[] = [
  {
    id: "1",
    author: { id: "a", name: "Ana" },
    sentAt: new Date(2026, 9, 1, 9, 0),
    content: "Pushed it.",
  },
  {
    id: "2",
    author: { id: "a", name: "Ana" },
    sentAt: new Date(2026, 9, 1, 9, 1),
    content: "Both themes.",
  },
]

export function MessageListGroupedDemo() {
  return (
    <MessageList className="w-64" aria-label="Good example" messages={pair} />
  )
}

export function MessageListUngroupedDemo() {
  return (
    <MessageList
      className="w-64"
      aria-label="Bad example"
      windowMinutes={0}
      messages={pair}
    />
  )
}
