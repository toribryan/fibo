import { describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Reactions, type Reaction } from "./reactions.js"

const heart: Reaction = { emoji: "❤️", label: "Heart", count: 3 }

describe("Reactions", () => {
  it("shortens counts past a thousand", async () => {
    const screen = await render(
      <Reactions particles={0} defaultReactions={[{ ...heart, count: 1234 }]} />
    )
    const pill = screen.getByRole("button", { name: /^Heart/ })
    await expect.element(pill).toHaveAccessibleName("Heart, 1234 reactions")
    expect(
      pill.element().querySelector('[data-slot="reactions-pill-count"]')
        ?.textContent
    ).toBe("1.2K")
  })

  it("shortens counts in the locale it's given", async () => {
    const screen = await render(
      <Reactions
        particles={0}
        locale="fr"
        defaultReactions={[{ ...heart, count: 1234 }]}
      />
    )
    const pill = screen.getByRole("button", { name: /^Heart/ })
    expect(
      pill.element().querySelector('[data-slot="reactions-pill-count"]')
        ?.textContent
    ).toMatch(/^1,2\sk$/)
  })

  it("drops a reaction once nobody holds it", async () => {
    const screen = await render(
      <Reactions
        particles={0}
        defaultReactions={[{ ...heart, count: 1, active: true }]}
      />
    )
    await screen.getByRole("button", { name: /^Heart/ }).click()
    await expect
      .element(screen.getByRole("button", { name: /^Heart/ }))
      .not.toBeInTheDocument()
  })

  it("opens the picker below when there is no room above", async () => {
    const screen = await render(<Reactions particles={0} />)
    await screen.getByRole("button", { name: "Add reaction" }).click()
    // The panel is portalled to the body, outside the component.
    const panel = page.getByRole("dialog", { name: "Pick a reaction" })
    await expect.element(panel).toBeVisible()
    const trigger = screen
      .getByRole("button", { name: "Add reaction" })
      .element()
      .getBoundingClientRect()
    const box = panel.element().getBoundingClientRect()
    expect(box.top).toBeGreaterThanOrEqual(trigger.bottom)
  })

  it("isn't clipped by a container that hides its overflow", async () => {
    await render(
      <div style={{ overflow: "hidden", height: 48, paddingTop: 200 }}>
        <Reactions particles={0} />
      </div>
    )
    await page.getByRole("button", { name: "Add reaction" }).click()
    const panel = page.getByRole("dialog", { name: "Pick a reaction" })
    await expect.element(panel).toBeVisible()
    expect(panel.element().closest('[style*="overflow"]')).toBeNull()
  })

  it("focuses the first choice, and returns focus on Escape", async () => {
    await render(<Reactions particles={0} />)
    const trigger = page.getByRole("button", { name: "Add reaction" })
    await trigger.click()
    await expect
      .element(page.getByRole("button", { name: "Thumbs up" }))
      .toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect
      .element(page.getByRole("button", { name: "Heart" }))
      .toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect.element(trigger).toHaveFocus()
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("closes when focus tabs out of the panel", async () => {
    await render(
      <>
        <Reactions particles={0} />
        <button type="button">After</button>
      </>
    )
    const trigger = page.getByRole("button", { name: "Add reaction" })
    await trigger.click()
    await expect
      .element(page.getByRole("button", { name: "Thumbs up" }))
      .toHaveFocus()
    for (let i = 0; i < 6; i++) await userEvent.tab()
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("reports the whole list when controlled", async () => {
    const onReactionsChange = vi.fn()
    const screen = await render(
      <Reactions
        particles={0}
        reactions={[heart]}
        onReactionsChange={onReactionsChange}
      />
    )
    await screen.getByRole("button", { name: /^Heart/ }).click()
    expect(onReactionsChange).toHaveBeenCalledWith([
      expect.objectContaining({ label: "Heart", count: 4, active: true }),
    ])
  })

  it("reads out the floating total, and hides it with showCounts off", async () => {
    const screen = await render(
      <Reactions type="floating" particles={0} defaultReactions={[heart]} />
    )
    await expect
      .element(screen.getByText("3 reactions", { exact: true }))
      .toBeInTheDocument()

    await screen.getByRole("button", { name: "Add reaction" }).click()
    await page.getByRole("button", { name: "Heart" }).click()
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Added Heart, 4 reactions in total")

    screen.rerender(
      <Reactions
        type="floating"
        particles={0}
        showCounts={false}
        defaultReactions={[heart]}
      />
    )
    await expect
      .element(screen.getByText("4 reactions", { exact: true }))
      .not.toBeInTheDocument()
  })

  it("leaves counts out of pill names with showCounts off", async () => {
    const screen = await render(
      <Reactions particles={0} showCounts={false} defaultReactions={[heart]} />
    )
    await expect
      .element(screen.getByRole("button", { name: /^Heart/ }))
      .toHaveAccessibleName("Heart")
  })

  it("throws nothing more once unmounted, and clears its layer", async () => {
    const particles = () =>
      document.querySelector('[data-slot="reactions-particles"]')
        ?.childElementCount ?? 0
    const screen = await render(
      <Reactions particles={20} defaultReactions={[heart]} />
    )
    await screen.getByRole("button", { name: /^Heart/ }).click()
    await screen.unmount()
    const thrown = particles()
    await new Promise((resolve) => setTimeout(resolve, 1300))
    expect(particles()).toBeLessThanOrEqual(thrown)
    await expect
      .poll(() => document.querySelector('[data-slot="reactions-particles"]'), {
        timeout: 5000,
      })
      .toBeNull()
  })
})
