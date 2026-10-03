import { afterEach, describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
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
})
