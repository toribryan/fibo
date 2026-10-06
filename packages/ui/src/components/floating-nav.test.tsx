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
    const list = screen.getByRole("list").element()
    expect(getComputedStyle(list).pointerEvents).toBe("none")
    screen.getByRole("link", { name: "Saved" }).element().focus()
    await expect.element(nav).not.toHaveAttribute("data-hidden")
    expect(getComputedStyle(list).pointerEvents).toBe("auto")
  })

  it("measures the current label again when it changes", async () => {
    const withIcons = (home: string) =>
      [
        { value: "home", label: home, icon: <svg />, href: "#home" },
        { value: "saved", label: "Saved", icon: <svg />, href: "#saved" },
      ] satisfies FloatingNavItem[]
    const screen = await render(
      <FloatingNav items={withIcons("Home")} value="home" />
    )
    // Past the measure that waits for fonts, which would otherwise catch
    // the new label by chance.
    await document.fonts.ready
    await new Promise((resolve) => setTimeout(resolve, 50))
    await screen.rerender(
      <FloatingNav items={withIcons("Home and everything")} value="home" />
    )
    const label = screen.getByText("Home and everything").element()
    await expect
      .poll(() => label.getBoundingClientRect().width)
      .toBeGreaterThanOrEqual(label.scrollWidth)
  })

  it("never hides without hideOnScroll", async () => {
    const screen = await render(<Page hideOnScroll={false} />)
    await scrollTo(400)
    await expect
      .element(screen.getByRole("navigation"))
      .not.toHaveAttribute("data-hidden")
  })

  it("shows every text item's label, current or not", async () => {
    const screen = await render(
      <FloatingNav
        position="static"
        defaultValue="home"
        items={[
          { value: "home", label: "Home" },
          { value: "saved", label: "Saved" },
        ]}
      />
    )
    const saved = screen.getByRole("button", { name: "Saved" })
    await expect.element(saved).not.toHaveAttribute("aria-current")
    expect(saved.element().getBoundingClientRect().width).toBeGreaterThan(40)
    expect(saved.element().querySelector("svg")).toBeNull()
  })

  it("shrinks its items with size sm", async () => {
    const screen = await render(
      <>
        <FloatingNav aria-label="Default" position="static" items={items} />
        <FloatingNav
          aria-label="Compact"
          position="static"
          size="sm"
          items={items}
        />
      </>
    )
    const height = (nav: string) =>
      screen
        .getByRole("navigation", { name: nav })
        .getByRole("link", { name: "Home" })
        .element()
        .getBoundingClientRect().height
    expect(height("Default")).toBe(44)
    expect(height("Compact")).toBe(36)
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

  it("marks a current button as current, not as a page", async () => {
    const screen = await render(
      <FloatingNav
        position="static"
        defaultValue="home"
        items={[
          { value: "home", label: "Home" },
          { value: "saved", label: "Saved" },
        ]}
      />
    )
    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toHaveAttribute("aria-current", "true")
  })

  it("keeps a colour set on an item's icon", async () => {
    const screen = await render(
      <FloatingNav
        position="static"
        defaultValue="home"
        items={[
          { value: "home", label: "Home", icon: <svg data-testid="home" /> },
          {
            value: "saved",
            label: "Saved",
            icon: <svg data-testid="saved" className="text-info" />,
          },
          { value: "inbox", label: "Inbox", icon: <svg data-testid="inbox" /> },
        ]}
      />
    )
    const colour = (id: string) =>
      getComputedStyle(screen.getByTestId(id).element()).color
    const probe = document.createElement("span")
    probe.className = "text-info"
    document.body.append(probe)
    const info = getComputedStyle(probe).color
    probe.remove()
    expect(colour("saved")).toBe(info)
    expect(colour("inbox")).not.toBe(info)
  })
})
