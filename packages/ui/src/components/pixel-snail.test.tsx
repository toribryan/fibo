import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { PixelSnail, PixelSnailSprite } from "./pixel-snail.js"

describe("PixelSnail", () => {
  it("puts its label in the status region as text", async () => {
    const screen = await render(<PixelSnail label="Loading your projects" />)
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Loading your projects")
  })

  it("stops crawling while off screen", async () => {
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <PixelSnail />
      </div>
    )
    const art = () =>
      screen.container.querySelector('[data-slot="pixel-snail"] svg')!.innerHTML
    const before = art()
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(art()).toBe(before)
    screen.container
      .querySelector('[data-slot="pixel-snail"]')!
      .scrollIntoView()
    await expect.poll(art).not.toBe(before)
  })

  it("keeps resting off screen when given a ref, and hands the ref its root", async () => {
    const ref = React.createRef<HTMLDivElement>()
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <PixelSnail ref={ref} />
      </div>
    )
    const root = screen.container.querySelector('[data-slot="pixel-snail"]')!
    expect(ref.current).toBe(root)
    const art = () => root.querySelector("svg")!.innerHTML
    const before = art()
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(art()).toBe(before)
    root.scrollIntoView()
    await expect.poll(art).not.toBe(before)
  })

  it("keeps the sprite resting off screen when given a ref", async () => {
    const ref = React.createRef<SVGGElement>()
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <svg viewBox="-20 -20 40 40" width={40} height={40}>
          <PixelSnailSprite ref={ref} />
        </svg>
      </div>
    )
    const sprite = screen.container.querySelector(
      '[data-slot="pixel-snail-sprite"]'
    )!
    expect(ref.current).toBe(sprite)
    const art = () => sprite.innerHTML
    const before = art()
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(art()).toBe(before)
    sprite.closest("svg")!.scrollIntoView()
    await expect.poll(art).not.toBe(before)
  })

  it("does not tick while waiting to assemble", async () => {
    const tick = vi.spyOn(window, "setInterval")
    try {
      await render(
        <svg viewBox="-20 -20 40 40">
          <PixelSnailSprite mode="rest" assembleDelay={1000} />
        </svg>
      )
      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(tick).not.toHaveBeenCalled()
    } finally {
      tick.mockRestore()
    }
  })
})
