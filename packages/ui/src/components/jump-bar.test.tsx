import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { JumpBar, jumpTo, useAtBottom } from "./jump-bar.js"

describe("JumpBar", () => {
  it("caps the count on screen and reads it out in full", async () => {
    const screen = await render(<JumpBar type="new-below" count={250} />)
    // The visible words stay in the name, with the full count after them.
    await expect
      .element(screen.getByRole("button", { name: "99+ new messages (250)" }))
      .toBeInTheDocument()
  })

  it("agrees the noun with the count", async () => {
    const screen = await render(<JumpBar type="new-below" count={1} />)
    await expect
      .element(screen.getByRole("button", { name: "1 new message" }))
      .toBeInTheDocument()
  })

  it("says when the unread messages began", async () => {
    const screen = await render(
      <JumpBar
        type="unread-above"
        count={4}
        since={new Date(2026, 9, 1, 15, 42)}
      />
    )
    await expect
      .element(
        screen.getByRole("button", { name: /^4 new messages since 3:42/ })
      )
      .toBeInTheDocument()
  })

  it("leaves out the time when there isn't one", async () => {
    const screen = await render(<JumpBar type="unread-above" count={4} />)
    await expect
      .element(screen.getByRole("button", { name: "4 new messages" }))
      .toBeInTheDocument()
  })

  it("calls the right handler for each button", async () => {
    const onJump = vi.fn()
    const onMarkRead = vi.fn()
    const screen = await render(
      <JumpBar
        type="unread-above"
        count={2}
        onJump={onJump}
        onMarkRead={onMarkRead}
      />
    )
    await screen.getByRole("button", { name: "Mark as read" }).click()
    expect(onMarkRead).toHaveBeenCalledOnce()
    expect(onJump).not.toHaveBeenCalled()
  })

  it("takes its copy from strings", async () => {
    const screen = await render(
      <JumpBar
        type="history"
        strings={{
          history: "Estás viendo mensajes antiguos",
          jumpToPresent: "Ir al presente",
        }}
      />
    )
    await expect
      .element(screen.getByText("Estás viendo mensajes antiguos"))
      .toBeVisible()
    await expect
      .element(screen.getByRole("button", { name: "Ir al presente" }))
      .toBeVisible()
  })
})

describe("jumpTo", () => {
  it("focuses the target", async () => {
    const screen = await render(
      <div style={{ height: 100, overflow: "auto" }}>
        <div style={{ height: 1000 }} />
        <article tabIndex={-1}>Target</article>
      </div>
    )
    const target = screen.getByRole("article").element() as HTMLElement
    jumpTo(target)
    expect(document.activeElement).toBe(target)
  })

  it("jumps instantly when the target is far away", async () => {
    const screen = await render(
      <div data-testid="box" style={{ height: 100, overflow: "auto" }}>
        <div style={{ height: 1000 }} />
        <article tabIndex={-1}>Target</article>
      </div>
    )
    const box = screen.getByTestId("box").element() as HTMLElement
    const target = screen.getByRole("article").element() as HTMLElement
    const scroll = vi.spyOn(target, "scrollIntoView")
    jumpTo(target, { container: box })
    expect(scroll).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" })
    )
  })
})

function Probe() {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const atBottom = useAtBottom(box, 50)
  return (
    <>
      <div
        ref={setBox}
        data-testid="box"
        style={{ height: 100, overflow: "auto" }}
      >
        <div style={{ height: 1000 }} />
      </div>
      <output>{atBottom ? "bottom" : "away"}</output>
    </>
  )
}

describe("useAtBottom", () => {
  it("tracks whether the container is scrolled to its end", async () => {
    const screen = await render(<Probe />)
    const box = screen.getByTestId("box").element() as HTMLElement
    await expect.element(screen.getByText("away")).toBeInTheDocument()
    box.scrollTop = box.scrollHeight
    await expect.element(screen.getByText("bottom")).toBeInTheDocument()
  })
})
