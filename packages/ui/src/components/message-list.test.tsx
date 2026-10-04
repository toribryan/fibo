import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import {
  MessageList,
  breakRules,
  groupMessages,
  type ChatAuthor,
  type ChatMessage,
} from "./message-list.js"

const ana: ChatAuthor = { id: "ana", name: "Ana" }
const ben: ChatAuthor = { id: "ben", name: "Ben" }

let seq = 0
function msg(
  author: ChatAuthor,
  minute: number,
  extra: Partial<ChatMessage> = {}
): ChatMessage {
  seq += 1
  return {
    id: `m${seq}`,
    author,
    sentAt: new Date(2026, 9, 1, 9, minute),
    content: `Message ${seq}`,
    ...extra,
  }
}

const reasons = (messages: ChatMessage[], options = {}) =>
  groupMessages(messages, options).map((m) => m.breakReason)

describe("groupMessages", () => {
  it("keeps one author's messages in a group", () => {
    expect(reasons([msg(ana, 0), msg(ana, 1), msg(ana, 2)])).toEqual([
      "start",
      null,
      null,
    ])
  })

  it("gives each message its place in the group", () => {
    const positions = groupMessages([
      msg(ana, 0),
      msg(ana, 1),
      msg(ana, 2),
      msg(ben, 3),
    ]).map((m) => m.position)
    expect(positions).toEqual(["first", "middle", "last", "single"])
  })

  it("breaks on a new author", () => {
    expect(reasons([msg(ana, 0), msg(ben, 1)])[1]).toBe("author")
  })

  it("breaks when the same person changes name or picture", () => {
    const renamed = { ...ana, name: "Ana B." }
    const pictured = { ...ana, avatar: "/ana.png" }
    expect(reasons([msg(ana, 0), msg(renamed, 1)])[1]).toBe("identity")
    expect(reasons([msg(ana, 0), msg(pictured, 1)])[1]).toBe("identity")
  })

  it("breaks on a new day, and flags it", () => {
    const late = { ...msg(ana, 0), sentAt: new Date(2026, 9, 1, 23, 59) }
    const early = { ...msg(ana, 0), sentAt: new Date(2026, 9, 2, 0, 1) }
    const [, second] = groupMessages([late, early])
    expect(second?.breakReason).toBe("day")
    expect(second?.newDay).toBe(true)
  })

  it("breaks around system and deleted messages", () => {
    expect(
      reasons([msg(ana, 0), msg(ana, 1, { kind: "system" }), msg(ana, 2)])
    ).toEqual(["start", "system", "system"])
    expect(
      reasons([msg(ana, 0), msg(ana, 1, { deleted: true }), msg(ana, 2)])
    ).toEqual(["start", "deleted", "deleted"])
  })

  it("breaks on a reply", () => {
    const reply = { id: "x", name: "Ben", text: "Hi" }
    expect(reasons([msg(ana, 0), msg(ana, 1, { replyTo: reply })])[1]).toBe(
      "reply"
    )
  })

  it("breaks above a divider", () => {
    const a = msg(ana, 0)
    const b = msg(ana, 1)
    expect(reasons([a, b], { dividers: [b.id] })[1]).toBe("divider")
  })

  it("measures a rolling window from the previous message", () => {
    const list = [msg(ana, 0), msg(ana, 4), msg(ana, 8), msg(ana, 14)]
    expect(reasons(list, { windowMinutes: 5 })).toEqual([
      "start",
      null,
      null,
      "window",
    ])
  })

  it("measures a fixed window from the group's first message", () => {
    const list = [msg(ana, 0), msg(ana, 4), msg(ana, 8), msg(ana, 12)]
    expect(reasons(list, { windowMinutes: 5, windowFrom: "first" })).toEqual([
      "start",
      null,
      "window",
      null,
    ])
  })

  it("reports the first rule that holds", () => {
    const tomorrow = {
      ...msg(ben, 0),
      sentAt: new Date(2026, 9, 2, 9, 0),
    }
    expect(Object.keys(breakRules).indexOf("day")).toBeLessThan(
      Object.keys(breakRules).indexOf("author")
    )
    expect(reasons([msg(ana, 0), tomorrow])[1]).toBe("day")
  })
})

const thread: ChatMessage[] = [
  msg(ana, 0, { id: "a1", content: "Pushed the tokens." }),
  msg(ana, 1, {
    id: "a2",
    content: (
      <>
        See <a href="#pr">the PR</a>
      </>
    ),
  }),
  msg(ben, 2, { id: "b1", content: "Looking now." }),
]

describe("MessageList", () => {
  it("heads each group, and names the author on every message", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const headings = screen.getByRole("heading", { level: 3 }).elements()
    // Chrome puts a narrow no-break space before AM.
    expect(headings.map((h) => h.textContent?.replace(/\s/g, " "))).toEqual([
      "Ana9:00 AM",
      "Ben9:02 AM",
    ])
    await expect
      .element(screen.getByRole("article", { name: /^Ana, 9:01/ }))
      .toBeInTheDocument()
  })

  it("keeps a time element on continuation rows", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const row = screen.getByRole("article", { name: /^Ana, 9:01/ }).element()
    expect(row.querySelector("time")?.getAttribute("datetime")).toBe(
      thread[1]!.sentAt.toISOString()
    )
  })

  it("shows a continuation row's time when the row is tapped", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const row = screen.getByRole("article", { name: /^Ana, 9:01/ }).element()
    const time = row.querySelector("time")!
    expect(getComputedStyle(time).opacity).toBe("0")
    row.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" })
    )
    await expect.element(row).toHaveFocus()
    expect(getComputedStyle(time).opacity).toBe("1")
  })

  it("is one tab stop, moved by the arrow keys", async () => {
    const screen = await render(
      <>
        <MessageList messages={thread} />
        <button>Composer</button>
      </>
    )
    await userEvent.keyboard("{Tab}")
    const last = screen.getByRole("article", { name: /^Ben, 9:02/ })
    await expect.element(last).toHaveFocus()

    await userEvent.keyboard("{ArrowUp}")
    await expect
      .element(screen.getByRole("article", { name: /^Ana, 9:01/ }))
      .toHaveFocus()

    // The link inside isn't a tab stop until the message is entered.
    await userEvent.keyboard("{Tab}")
    await expect
      .element(screen.getByRole("button", { name: "Composer" }))
      .toHaveFocus()
  })

  it("goes into a message with Enter and back out with Escape", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const row = screen.getByRole("article", { name: /^Ana, 9:01/ })
    ;(row.element() as HTMLElement).focus()
    await userEvent.keyboard("{Enter}")
    await expect
      .element(screen.getByRole("link", { name: "the PR" }))
      .toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect.element(row).toHaveFocus()
  })

  it("enters a message when a control inside it is clicked", async () => {
    const screen = await render(
      <>
        <MessageList messages={thread} />
        <button>Composer</button>
      </>
    )
    const link = screen.getByRole("link", { name: "the PR" })
    await expect.element(link).toHaveAttribute("tabindex", "-1")
    await link.click()
    await expect.element(link).not.toHaveAttribute("tabindex")
  })

  it("locks controls that content adds after render", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const content = screen.container.querySelector(
      '[data-id="b1"] [data-slot="message-content"]'
    )!
    const late = document.createElement("button")
    late.textContent = "Late"
    content.append(late)
    await expect
      .element(screen.getByRole("button", { name: "Late" }))
      .toHaveAttribute("tabindex", "-1")
  })

  it("moves focus to a neighbour when the focused message is removed", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const middle = screen.getByRole("article", { name: /^Ana, 9:01/ })
    ;(middle.element() as HTMLElement).focus()
    await screen.rerender(
      <MessageList messages={thread.filter((m) => m.id !== "a2")} />
    )
    await expect
      .element(screen.getByRole("article", { name: /^Ben, 9:02/ }))
      .toHaveFocus()
  })

  it("leaves modified arrow keys to the browser", async () => {
    const screen = await render(<MessageList messages={thread} />)
    const last = screen.getByRole("article", { name: /^Ben, 9:02/ })
    ;(last.element() as HTMLElement).focus()
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}")
    await expect.element(last).toHaveFocus()
  })

  it("takes its name from strings", async () => {
    const screen = await render(
      <MessageList messages={thread} strings={{ list: "Mensajes" }} />
    )
    await expect
      .element(screen.getByRole("log", { name: "Mensajes" }))
      .toBeInTheDocument()
  })

  it("marks where unread messages begin, in words as well as colour", async () => {
    const screen = await render(
      <MessageList messages={thread} unreadFrom="a2" />
    )
    const divider = screen.getByRole("separator", { name: "New" })
    await expect.element(divider).toHaveAttribute("data-unread")
    await expect.element(divider).toHaveTextContent("New")
    // It breaks the group, so the message under it gets its own heading.
    await expect
      .element(screen.getByRole("article", { name: /^Ana, 9:01/ }))
      .toHaveAttribute("data-break", "divider")
  })

  it("draws one divider for a new day that is also the first unread", async () => {
    const screen = await render(
      <MessageList messages={thread} unreadFrom="a1" />
    )
    const dividers = screen.getByRole("separator").elements()
    expect(dividers).toHaveLength(1)
    expect(dividers[0]?.getAttribute("aria-label")).toBe("October 1, 2026, New")
  })

  it("draws a divider for a new day and for each label", async () => {
    const screen = await render(
      <MessageList messages={thread} dividers={{ b1: "New" }} />
    )
    await expect
      .element(screen.getByRole("separator", { name: "October 1, 2026" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("separator", { name: "New" }))
      .toBeInTheDocument()
  })
})
