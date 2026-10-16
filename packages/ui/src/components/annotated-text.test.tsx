import * as React from "react"
import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"
import { userEvent } from "vitest/browser"

import { AnnotatedText, AnnotatedTextCycle } from "./annotated-text.js"

const paths = (root: Element) =>
  [...root.querySelectorAll('[data-slot="annotated-text-mark"] path')].map(
    (path) => path.getAttribute("d")
  )

describe("AnnotatedText", () => {
  it("draws one path per stroke, hidden from assistive technology", async () => {
    const screen = await render(
      <AnnotatedText variant="cross">not this</AnnotatedText>
    )
    await expect.poll(() => paths(screen.container).length).toBe(2)
    expect(
      screen.container.querySelector('[data-slot="annotated-text-mark"]')
    ).toHaveAttribute("aria-hidden", "true")
  })

  it("wobbles the same way for the same text, and differently for other text", async () => {
    const first = await render(<AnnotatedText>same words</AnnotatedText>)
    await expect.poll(() => paths(first.container).length).toBe(1)
    const marks = paths(first.container)

    const again = await render(<AnnotatedText>same words</AnnotatedText>)
    await expect.poll(() => paths(again.container)).toEqual(marks)

    const other = await render(<AnnotatedText>other words</AnnotatedText>)
    await expect.poll(() => paths(other.container).length).toBe(1)
    expect(paths(other.container)).not.toEqual(marks)
  })

  it("keeps the mark to the glyphs under loose leading", async () => {
    const screen = await render(
      <p style={{ fontSize: 20, lineHeight: 3 }}>
        <AnnotatedText>spaced out</AnnotatedText>
      </p>
    )
    const svg = () =>
      screen.container.querySelector<SVGSVGElement>(
        '[data-slot="annotated-text-mark"]'
      )
    await expect.poll(svg).not.toBeNull()
    expect(svg()!.getAttribute("height")).toBe("24")
  })

  it("waits to draw in until it is in view", async () => {
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <AnnotatedText animate>later</AnnotatedText>
      </div>
    )
    const root = screen.container.querySelector('[data-slot="annotated-text"]')!
    expect(root).not.toHaveAttribute("data-drawn")
    root.scrollIntoView()
    await expect.poll(() => root.hasAttribute("data-drawn")).toBe(true)
  })
})

describe("AnnotatedTextCycle", () => {
  const items = [{ label: "one" }, { label: "two" }, { label: "three" }]

  it("runs through once and settles on the last item", async () => {
    const screen = await render(
      <AnnotatedTextCycle items={items} interval={60} />
    )
    const root = screen.container.querySelector(
      '[data-slot="annotated-text-cycle"]'
    )!
    await expect.poll(() => root.getAttribute("data-index")).toBe("2")
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(root.getAttribute("data-index")).toBe("2")
  })

  it("holds while paused", async () => {
    const screen = await render(
      <AnnotatedTextCycle items={items} interval={60} paused />
    )
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(
      screen.container
        .querySelector('[data-slot="annotated-text-cycle"]')!
        .getAttribute("data-index")
    ).toBe("0")
  })

  it("still pauses on hover when given its own pointer handlers", async () => {
    let entered = 0
    const screen = await render(
      <AnnotatedTextCycle
        items={items}
        interval={60}
        onPointerEnter={() => entered++}
      />
    )
    const root = screen.container.querySelector<HTMLElement>(
      '[data-slot="annotated-text-cycle"]'
    )!
    await userEvent.hover(root)
    const held = root.dataset.index
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(root.dataset.index).toBe(held)
    expect(entered).toBe(1)
  })

  it("gives screen readers one fixed word", async () => {
    const screen = await render(
      <AnnotatedTextCycle items={items} label="numbers" />
    )
    await expect.element(screen.getByText("numbers")).toBeInTheDocument()
  })
})
