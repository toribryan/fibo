import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CSSProperties } from "react"
import { expect, userEvent } from "storybook/test"

import {
  MessageList,
  type ChatAuthor,
  type ChatMessage,
  type MessageListProps,
} from "./message-list.js"

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
    author: ben,
    sentAt: at(1, 9, 13),
    content: (
      <>
        The diff is in{" "}
        <a href="#pr-58" className="underline underline-offset-2">
          #58
        </a>
        .
      </>
    ),
  },
  {
    id: "7",
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
    id: "8",
    author: ana,
    sentAt: at(1, 9, 16),
    deleted: true,
    content: "Wrong channel",
  },
  {
    id: "9",
    author: ana,
    sentAt: at(1, 9, 17),
    content: "Merging after lunch unless anyone shouts.",
  },
]

type Args = Omit<MessageListProps, "messages">

const meta: Meta<MessageListProps> = {
  title: "Base components/Display/Message list",
  component: MessageList,
  argTypes: {
    windowMinutes: { control: { type: "range", min: 0, max: 30, step: 1 } },
    windowFrom: { control: "inline-radio", options: ["previous", "first"] },
    headingLevel: { control: "inline-radio", options: [2, 3, 4, 5, 6] },
    messages: { control: false },
    dividers: { control: false },
    strings: { control: false },
    locale: { control: false },
  },
  args: {
    messages: conversation,
    windowMinutes: 5,
    windowFrom: "previous",
    headingLevel: 3,
  },
  parameters: {
    controls: { exclude: ["messages", "dividers", "strings", "locale"] },
  },
  decorators: [
    (Story) => (
      <div className="w-[26rem] max-w-full">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<MessageListProps>

export const Default: Story = {
  play: async ({ canvas }) => {
    const log = canvas.getByRole("log", { name: "Messages" })
    await expect(log).toBeInTheDocument()

    // One heading per group, so screen reader users can jump author to author.
    const headings = canvas.getAllByRole("heading", { level: 3 })
    await expect(headings.map((h) => h.textContent?.split(/\d/)[0])).toEqual([
      "Ana Ruiz",
      "Ben Okafor",
      "Ben Okafor",
      "Ana Ruiz",
      "Ana Ruiz",
    ])

    await userEvent.tab()
    const last = canvas.getByRole("article", { name: /^Ana Ruiz, 9:17/ })
    await expect(last).toHaveFocus()

    await userEvent.keyboard("{Home}")
    await expect(
      canvas.getByRole("article", { name: /^Ana Ruiz, 4:02/ })
    ).toHaveFocus()

    await userEvent.keyboard("{End}{ArrowUp}{ArrowUp}{ArrowUp}")
    const withLink = canvas.getByRole("article", { name: /^Ben Okafor, 9:13/ })
    await expect(withLink).toHaveFocus()

    await userEvent.keyboard("{Enter}")
    await expect(canvas.getByRole("link", { name: "#58" })).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect(withLink).toHaveFocus()

    // By pointer: clicking a message's text makes it the list's tab stop.
    await userEvent.click(
      canvas.getByText("Nice. I'll look first thing tomorrow.")
    )
    const clicked = canvas.getByRole("article", { name: /^Ben Okafor, 4:10/ })
    await expect(clicked).toHaveFocus()
    await expect(clicked).toHaveAttribute("tabindex", "0")
  },
}

const burst: ChatMessage[] = [0, 4, 8, 12, 16].map((minute, i) => ({
  id: `b${i}`,
  author: ana,
  sentAt: at(1, 14, minute),
  content: ["Trying a thing.", "Nope.", "Closer.", "Got it.", "Pushed."][i],
}))

function Windows(args: Args) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {(["previous", "first"] as const).map((from) => (
        <section key={from} className="flex flex-col gap-3">
          <h2 className="text-xs font-medium text-muted-foreground">
            {from === "previous" ? "Rolling" : "Fixed"}, 5 minutes
          </h2>
          <MessageList
            {...args}
            aria-label={`${from === "previous" ? "Rolling" : "Fixed"} window`}
            messages={burst}
            windowMinutes={5}
            windowFrom={from}
          />
        </section>
      ))}
    </div>
  )
}

export const Window: Story = {
  name: "Rolling or fixed window",
  decorators: [
    (Story) => (
      <div className="w-[44rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  render: (args) => <Windows {...args} />,
}

export const Unread: Story = {
  args: { unreadFrom: "7" },
}

export const Divider: Story = {
  name: "With a divider",
  args: { dividers: { "5": "New" } },
}

export const Spacing: Story = {
  name: "Custom spacing",
  args: {
    style: {
      "--message-gap": "0.25rem",
      "--message-group-gap": "1.5rem",
    } as CSSProperties,
  },
}

export const Translated: Story = {
  args: {
    locale: "es",
    strings: {
      list: "Mensajes",
      label: (message, time) =>
        message.kind === "system"
          ? time
          : message.deleted
            ? `Mensaje eliminado de ${message.author.name}, ${time}`
            : `${message.author.name}, ${time}`,
      deleted: "Se eliminó este mensaje.",
      replyingTo: (name) => `En respuesta a ${name}`,
    },
  },
}
