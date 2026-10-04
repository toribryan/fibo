import { afterEach, describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"
import { renderToString } from "react-dom/server"

import { CommandMenu, type CommandMenuGroup } from "./command-menu.js"

const groups: CommandMenuGroup[] = [
  {
    label: "Pages",
    items: [
      { value: "home", label: "Home" },
      { value: "settings", label: "Settings" },
    ],
  },
]

describe("CommandMenu", () => {
  afterEach(() => window.localStorage.removeItem("command-menu-test"))

  it("doesn't read storage while rendering, so hydration matches", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem")
    try {
      renderToString(
        <CommandMenu groups={groups} storageKey="command-menu-test" />
      )
      expect(getItem).not.toHaveBeenCalled()
    } finally {
      getItem.mockRestore()
    }
  })

  it("restores recents from storage once mounted", async () => {
    window.localStorage.setItem(
      "command-menu-test",
      JSON.stringify(["settings"])
    )
    await render(
      <CommandMenu groups={groups} storageKey="command-menu-test" defaultOpen />
    )
    // The dialog is portalled to the body, outside the component.
    await expect.element(page.getByText("Recent")).toBeVisible()
    await expect
      .element(page.getByRole("option", { name: "Settings" }).first())
      .toBeVisible()
  })

  it("scrolls only its list to the highlighted row, never the page", async () => {
    const many: CommandMenuGroup[] = [
      {
        label: "Pages",
        items: Array.from({ length: 30 }, (_, i) => ({
          value: `page-${i}`,
          label: `Page ${i}`,
        })),
      },
    ]
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
    try {
      await render(<CommandMenu groups={many} defaultOpen />)
      await expect
        .element(page.getByRole("option", { name: "Page 0" }))
        .toBeVisible()
      for (let i = 0; i < 20; i++) await userEvent.keyboard("{ArrowDown}")
      const list = document.querySelector<HTMLElement>(
        "[data-slot=command-menu-list]"
      )
      await expect.poll(() => list?.scrollTop ?? 0).toBeGreaterThan(0)
      expect(scrollIntoView).not.toHaveBeenCalled()
    } finally {
      scrollIntoView.mockRestore()
    }
  })
})
