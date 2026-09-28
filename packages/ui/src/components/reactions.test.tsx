import { describe, expect, it, vi } from "vitest"
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
    const panel = screen.getByRole("group", { name: "Pick a reaction" })
    await expect.element(panel).toBeVisible()
    const trigger = screen
      .getByRole("button", { name: "Add reaction" })
      .element()
      .getBoundingClientRect()
    const box = panel.element().getBoundingClientRect()
    expect(box.top).toBeGreaterThanOrEqual(trigger.bottom)
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
})
