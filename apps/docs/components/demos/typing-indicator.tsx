"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  TypingIndicator,
  type TypingFormatter,
  type TypingPerson,
} from "@workspace/ui/components/typing-indicator"

const team: TypingPerson[] = [
  { id: "ana", name: "Ana" },
  { id: "ben", name: "Ben" },
  { id: "cy", name: "Cy" },
  { id: "dara", name: "Dara" },
  { id: "eli", name: "Eli" },
  { id: "fen", name: "Fen" },
]

// One sentence per case; Intl.ListFormat supplies "y".
const spanish: TypingFormatter = ({ count, names, list }) => {
  if (count === 0) return ""
  if (names.length === 0) return "Varias personas están escribiendo…"
  return count === 1
    ? `${list} está escribiendo…`
    : `${list} están escribiendo…`
}

export function TypingIndicatorTranslatedDemo() {
  return (
    <div lang="es" className="flex w-80 flex-col gap-2">
      {[1, 3, 5].map((n) => (
        <TypingIndicator
          key={n}
          people={team.slice(0, n)}
          format={spanish}
          locale="es"
        />
      ))}
    </div>
  )
}

const thread = [
  { id: 1, author: "Ana", text: "Pushed the new tokens to the branch." },
  { id: 2, author: "Ben", text: "Looking now. Is dark mode in there too?" },
  { id: 3, author: "Ana", text: "Both themes, and the drift check passes." },
]

export function TypingIndicatorConversationDemo() {
  const [typing, setTyping] = useState(0)
  return (
    <div className="flex w-80 flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div role="log" aria-label="Messages" className="flex flex-col gap-3">
          {thread.map((message) => (
            <div key={message.id} className="flex flex-col text-sm">
              <span className="font-medium">{message.author}</span>
              <span className="text-muted-foreground">{message.text}</span>
            </div>
          ))}
        </div>
        <TypingIndicator people={team.slice(0, typing)} />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={typing === team.length}
          onClick={() => setTyping((n) => n + 1)}
        >
          Someone starts
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={typing === 0}
          onClick={() => setTyping((n) => n - 1)}
        >
          Someone stops
        </Button>
      </div>
    </div>
  )
}
