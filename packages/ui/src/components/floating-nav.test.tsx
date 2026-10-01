import { afterEach, describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import {
  FloatingNav,
  type FloatingNavItem,
  type FloatingNavProps,
} from "./floating-nav.js"

const items: FloatingNavItem[] = [
  { value: "home", label: "Home", icon: null, href: "#home" },
  { value: "saved", label: "Saved", icon: null, href: "#saved" },
]

function Page({ hideOnScroll = true }: { hideOnScroll?: boolean }) {
  return (
    <>
      <div style={{ height: 4000 }} />
      <FloatingNav
        items={items}
        defaultValue="home"
        hideOnScroll={hideOnScroll}
      />
    </>
  )
}

async function scrollTo(y: number) {
  window.scrollTo(0, y)
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

describe("FloatingNav", () => {
  afterEach(() => window.scrollTo(0, 0))

  it("hides while scrolling down and returns on the way up", async () => {
    const screen = await render(<Page />)
    const nav = screen.getByRole("navigation")
    await scrollTo(400)
    await expect.element(nav).toHaveAttribute("data-hidden")
    await scrollTo(300)
    await expect.element(nav).not.toHaveAttribute("data-hidden")
  })

  it("stays put near the top and for small nudges", async () => {
    const screen = await render(<Page />)
    const nav = screen.getByRole("navigation")
    await scrollTo(40)
    await expect.element(nav).not.toHaveAttribute("data-hidden")
    await scrollTo(400)
    await expect.element(nav).toHaveAttribute("data-hidden")
    await scrollTo(395)
    await expect.element(nav).toHaveAttribute("data-hidden")
  })

  it("comes back when it takes focus", async () => {
    const screen = await render(<Page />)
    const nav = screen.getByRole("navigation")
    await scrollTo(400)
    await expect.element(nav).toHaveAttribute("data-hidden")
    screen.getByRole("link", { name: "Saved" }).element().focus()
    await expect.element(nav).not.toHaveAttribute("data-hidden")
  })

  it("never hides without hideOnScroll", async () => {
    const screen = await render(<Page hideOnScroll={false} />)
    await scrollTo(400)
    await expect
      .element(screen.getByRole("navigation"))
      .not.toHaveAttribute("data-hidden")
  })

  it("leaves a controlled value to its owner and hands over the click", async () => {
    const onValueChange = vi.fn<NonNullable<FloatingNavProps["onValueChange"]>>(
      (_value, event) => event.preventDefault()
    )
    const screen = await render(
      <FloatingNav items={items} value="home" onValueChange={onValueChange} />
    )
    await screen.getByRole("link", { name: "Saved" }).click()
    expect(onValueChange).toHaveBeenCalledWith("saved", expect.anything())
    expect(onValueChange.mock.calls[0]![1].defaultPrevented).toBe(true)
    expect(window.location.hash).not.toBe("#saved")
    await expect
      .element(screen.getByRole("link", { name: "Home" }))
      .toHaveAttribute("aria-current", "page")
    await expect
      .element(screen.getByRole("link", { name: "Saved" }))
      .not.toHaveAttribute("aria-current")
  })
})
