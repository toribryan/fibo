import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { expect } from "storybook/test"

import { Button } from "./button.js"
import {
  TypingIndicator,
  type TypingFormatter,
  type TypingIndicatorProps,
  type TypingPerson,
} from "./typing-indicator.js"

const ME = "me"

const team: TypingPerson[] = [
  { id: "ana", name: "Ana" },
  { id: "ben", name: "Ben" },
  { id: "cy", name: "Cy" },
  { id: "dara", name: "Dara" },
  { id: "eli", name: "Eli" },
  { id: "fen", name: "Fen" },
]

type Args = TypingIndicatorProps & {
  typing: number
  includeMe: boolean
}

// The props the playground tunes, without the story-only `typing` and
// `includeMe`, which would otherwise land on the div.
function tuning({ maxNames, maxNameLength, announceDelay }: Args) {
  return { maxNames, maxNameLength, announceDelay }
}

const meta: Meta<Args> = {
  title: "Base components/Feedback/Typing indicator",
  component: TypingIndicator,
  argTypes: {
    typing: {
      control: { type: "range", min: 0, max: team.length, step: 1 },
      description: "How many people are typing, for the playground.",
      table: { category: "Story" },
    },
    includeMe: {
      control: "boolean",
      description:
        "Adds the current person to `people`, to show they're left out.",
      table: { category: "Story" },
    },
    maxNames: { control: { type: "range", min: 1, max: 5, step: 1 } },
    maxNameLength: { control: { type: "range", min: 4, max: 40, step: 1 } },
    announceDelay: { control: { type: "number", min: 0, step: 250 } },
    people: { control: false },
    currentUserId: { control: false },
    format: { control: false },
    locale: { control: false },
  },
  args: {
    people: [],
    typing: 2,
    includeMe: false,
    maxNames: 3,
    maxNameLength: 24,
    announceDelay: 1500,
  },
  parameters: {
    controls: {
      exclude: ["people", "currentUserId", "format", "locale"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <TypingIndicator
      currentUserId={ME}
      {...tuning(args)}
      people={[
        ...team.slice(0, args.typing),
        ...(args.includeMe ? [{ id: ME, name: "You" }] : []),
      ]}
    />
  ),
}

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  args: { includeMe: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("Ana and Ben are typing…")).toBeVisible()
    // The current person is in `people` but never in the sentence.
    await expect(canvas.queryByText(/You/)).toBeNull()
    await expect(canvas.getByRole("status")).toBeInTheDocument()
    const dots = canvasElement.querySelector(
      '[data-slot="typing-indicator-dots"]'
    )
    await expect(dots?.closest("[aria-hidden]")).not.toBeNull()
  },
}

export const OnePerson: Story = {
  name: "One person",
  args: { typing: 1 },
}

export const Three: Story = {
  name: "Three people",
  args: { typing: 3 },
}

export const Several: Story = {
  name: "Several people",
  args: { typing: 5 },
}

export const LongNames: Story = {
  name: "Long names",
  render: (args) => (
    <TypingIndicator
      {...tuning(args)}
      people={[
        { id: "a", name: "Maximiliana Cordelia Featherstonehaugh" },
        { id: "b", name: "Bartholomew Alistair Ravenscroft" },
      ]}
    />
  ),
}

export const CustomIndicator: Story = {
  name: "Custom indicator",
  render: (args) => {
    const ana: TypingPerson = {
      id: "ana",
      name: "Ana",
      indicator: <PencilIcon className="size-3.5" />,
    }
    return (
      <div className="flex flex-col gap-2">
        <TypingIndicator {...tuning(args)} people={[ana]} />
        <TypingIndicator {...tuning(args)} people={[ana, team[1]!]} />
      </div>
    )
  },
}

// Spanish keeps one sentence per case and lets Intl.ListFormat supply "y".
const spanish: TypingFormatter = ({ count, names, list }) => {
  if (count === 0) return ""
  if (names.length === 0) return "Varias personas están escribiendo…"
  return count === 1
    ? `${list} está escribiendo…`
    : `${list} están escribiendo…`
}

export const Translated: Story = {
  render: (args) => (
    <div lang="es" className="flex flex-col gap-2">
      {[1, 3, 5].map((n) => (
        <TypingIndicator
          key={n}
          {...tuning(args)}
          people={team.slice(0, n)}
          format={spanish}
          locale="es"
        />
      ))}
    </div>
  ),
}

const thread = [
  { id: 1, author: "Ana", text: "Pushed the new tokens to the branch." },
  { id: 2, author: "Ben", text: "Looking now. Is dark mode in there too?" },
  { id: 3, author: "Ana", text: "Both themes, and the drift check passes." },
]

function Conversation() {
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

export const InAConversation: Story = {
  name: "In a conversation",
  render: () => <Conversation />,
}
