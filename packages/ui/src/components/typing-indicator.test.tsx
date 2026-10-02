import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import {
  TypingIndicator,
  formatTyping,
  type TypingPerson,
} from "./typing-indicator.js"

const people: TypingPerson[] = ["Ana", "Ben", "Cy", "Dara"].map((name) => ({
  id: name.toLowerCase(),
  name,
}))

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-slot="typing-indicator"]')!
}

describe("formatTyping", () => {
  it("says nothing when nobody is typing", () => {
    expect(formatTyping({ count: 0, names: [], list: "" })).toBe("")
  })

  it("agrees the verb with the count", () => {
    expect(formatTyping({ count: 1, names: ["Ana"], list: "Ana" })).toBe(
      "Ana is typing…"
    )
    expect(
      formatTyping({ count: 2, names: ["Ana", "Ben"], list: "Ana and Ben" })
    ).toBe("Ana and Ben are typing…")
  })

  it("stops naming people when there are no names to show", () => {
    expect(formatTyping({ count: 4, names: [], list: "" })).toBe(
      "Several people are typing…"
    )
  })
})

describe("TypingIndicator", () => {
  it("leaves out the current person", async () => {
    const screen = await render(
      <TypingIndicator people={people.slice(0, 2)} currentUserId="ana" />
    )
    await expect.element(screen.getByText("Ben is typing…")).toBeVisible()
  })

  it("names three people, then switches to several", async () => {
    const screen = await render(<TypingIndicator people={people.slice(0, 3)} />)
    await expect
      .element(screen.getByText("Ana, Ben, and Cy are typing…"))
      .toBeVisible()
    await screen.rerender(<TypingIndicator people={people} />)
    await expect
      .element(screen.getByText("Several people are typing…"))
      .toBeVisible()
  })

  it("joins names for the locale it's given", async () => {
    const format = vi.fn(({ list }: { list: string }) => list)
    const screen = await render(
      <TypingIndicator
        people={people.slice(0, 3)}
        locale="es"
        format={format}
      />
    )
    await expect.element(screen.getByText("Ana, Ben y Cy")).toBeVisible()
    expect(format).toHaveBeenCalledWith({
      count: 3,
      names: ["Ana", "Ben", "Cy"],
      list: "Ana, Ben y Cy",
    })
  })

  it("cuts long names short on screen but announces them whole", async () => {
    const name = "Maximiliana Cordelia Featherstonehaugh"
    const screen = await render(
      <TypingIndicator
        people={[{ id: "m", name }]}
        maxNameLength={12}
        announceDelay={0}
      />
    )
    await expect
      .element(screen.getByText("Maximiliana… is typing…"))
      .toBeVisible()
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent(`${name} is typing…`)
  })

  it("waits for the sentence to settle before announcing it", async () => {
    const screen = await render(
      <TypingIndicator people={people.slice(0, 1)} announceDelay={300} />
    )
    const status = screen.getByRole("status")
    expect(status.element().textContent).toBe("")

    await screen.rerender(
      <TypingIndicator people={people.slice(0, 2)} announceDelay={300} />
    )
    expect(status.element().textContent).toBe("")
    await expect.element(status).toHaveTextContent("Ana and Ben are typing…")
  })

  it("clears the announcement at once when everyone stops", async () => {
    const screen = await render(
      <TypingIndicator people={people.slice(0, 1)} announceDelay={0} />
    )
    const status = screen.getByRole("status")
    await expect.element(status).toHaveTextContent("Ana is typing…")
    await screen.rerender(<TypingIndicator people={[]} announceDelay={0} />)
    expect(status.element().textContent).toBe("")
  })

  it("keeps its height and status region when nobody is typing", async () => {
    const screen = await render(<TypingIndicator people={[]} />)
    const el = root(screen.container)
    expect(el.getBoundingClientRect().height).toBeGreaterThan(0)
    expect(el.hasAttribute("data-active")).toBe(false)
    await expect.element(screen.getByRole("status")).toBeInTheDocument()
  })

  it("names someone once when they type from two devices", async () => {
    const screen = await render(
      <TypingIndicator people={[people[0]!, people[0]!]} />
    )
    await expect.element(screen.getByText("Ana is typing…")).toBeVisible()
  })

  it("shows a custom indicator only while one person is typing", async () => {
    const ana = {
      ...people[0]!,
      indicator: <span data-testid="custom">pen</span>,
    }
    const one = await render(<TypingIndicator people={[ana]} />)
    await expect.element(one.getByTestId("custom")).toBeInTheDocument()
    await one.rerender(<TypingIndicator people={[ana, people[1]!]} />)
    await expect.element(one.getByTestId("custom")).not.toBeInTheDocument()
  })
})
