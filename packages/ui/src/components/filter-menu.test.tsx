import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { FilterMenu, type FilterField } from "./filter-menu.js"

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { value: "in progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
  },
  {
    id: "priority",
    label: "Priority",
    options: [
      { value: "urgent", label: "Urgent" },
      { value: "low", label: "Low" },
    ],
  },
]

async function openMenu(ui: React.ReactElement) {
  const screen = await render(ui)
  await userEvent.click(screen.getByRole("button", { name: "Filter" }))
  return screen
}

describe("FilterMenu", () => {
  it("leaves a controlled value alone and reports the change", async () => {
    const onValueChange = vi.fn()
    const screen = await openMenu(
      <FilterMenu fields={fields} value={{}} onValueChange={onValueChange} />
    )
    await userEvent.click(screen.getByRole("option", { name: /^Priority/ }))
    await userEvent.click(screen.getByRole("option", { name: "Urgent" }))
    expect(onValueChange).toHaveBeenLastCalledWith({ priority: ["urgent"] })
    await expect
      .element(screen.getByRole("option", { name: "Urgent" }))
      .toHaveAttribute("aria-selected", "false")
  })

  it("drops a field's key when its last value is unticked", async () => {
    const onValueChange = vi.fn()
    const screen = await openMenu(
      <FilterMenu
        fields={fields}
        defaultValue={{ priority: ["urgent"], status: ["done"] }}
        onValueChange={onValueChange}
      />
    )
    await userEvent.click(screen.getByRole("option", { name: /^Priority/ }))
    await userEvent.click(screen.getByRole("option", { name: "Urgent" }))
    expect(onValueChange).toHaveBeenLastCalledWith({ status: ["done"] })
  })

  it("brings every value of a field whose name matches the search", async () => {
    const screen = await openMenu(<FilterMenu fields={fields} />)
    await userEvent.keyboard("prio")
    const group = screen.getByRole("group", { name: "Priority" })
    await expect
      .element(group.getByRole("option", { name: "Urgent" }))
      .toBeVisible()
    await expect
      .element(group.getByRole("option", { name: "Low" }))
      .toBeVisible()
    expect(screen.getByRole("group", { name: "Status" }).query()).toBeNull()
  })

  it("keeps a search inside the open field", async () => {
    const screen = await openMenu(<FilterMenu fields={fields} />)
    await userEvent.click(screen.getByRole("option", { name: /^Status/ }))
    await userEvent.keyboard("o")
    await expect
      .element(screen.getByRole("option", { name: "Done" }))
      .toBeVisible()
    expect(screen.getByRole("option", { name: "Low" }).query()).toBeNull()
  })

  it("ignores a query of only spaces", async () => {
    const screen = await openMenu(<FilterMenu fields={fields} />)
    await userEvent.keyboard("   ")
    await expect
      .element(screen.getByRole("option", { name: /^Status/ }))
      .toBeVisible()
  })

  it("points aria-activedescendant at a real row when values hold spaces", async () => {
    const screen = await openMenu(
      <FilterMenu fields={fields} search="inline" />
    )
    await userEvent.keyboard("{Enter}")
    const search = screen.getByRole("combobox").element()
    const target = search.getAttribute("aria-activedescendant")
    expect(target).not.toContain(" ")
    expect(document.getElementById(target!)?.textContent).toContain(
      "In progress"
    )
  })

  describe("with a search button", () => {
    it("slides into search and back", async () => {
      const screen = await openMenu(
        <FilterMenu fields={fields} search="button" />
      )
      expect(screen.getByRole("combobox").query()).toBeNull()
      await userEvent.click(
        screen.getByRole("button", { name: "Search filters" })
      )
      await expect.element(screen.getByRole("combobox")).toHaveFocus()
      await userEvent.click(
        screen.getByRole("button", { name: "Back to filters" })
      )
      await expect
        .element(screen.getByRole("button", { name: "Search filters" }))
        .toBeVisible()
    })

    it("returns to the open field when a search inside it ends", async () => {
      const screen = await openMenu(<FilterMenu fields={fields} />)
      await userEvent.click(screen.getByRole("option", { name: /^Status/ }))
      await userEvent.keyboard("d")
      await expect.element(screen.getByRole("combobox")).toHaveValue("d")
      await userEvent.click(
        screen.getByRole("button", { name: "Back to Status" })
      )
      await expect
        .element(screen.getByRole("listbox", { name: "Status" }))
        .toBeVisible()
      expect(screen.getByRole("combobox").query()).toBeNull()
    })

    it("starts a search from a letter typed on the list", async () => {
      const screen = await openMenu(
        <FilterMenu fields={fields} search="button" />
      )
      await expect.element(screen.getByRole("listbox")).toHaveFocus()
      await userEvent.keyboard("l")
      await expect.element(screen.getByRole("combobox")).toHaveValue("l")
      await expect
        .element(screen.getByRole("option", { name: "Low" }))
        .toBeVisible()
    })
  })

  it("opens and closes under control", async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <FilterMenu fields={fields} open onOpenChange={onOpenChange} />
    )
    const menu = page.getByRole("dialog", { name: "Filters" })
    await expect.element(menu).toBeVisible()
    await userEvent.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    // Still open until the owner says otherwise.
    await expect.element(menu).toBeVisible()
    screen.rerender(
      <FilterMenu fields={fields} open={false} onOpenChange={onOpenChange} />
    )
    await expect.element(menu).not.toBeInTheDocument()
  })

  it("takes a custom trigger, popup classes and labels", async () => {
    const screen = await render(
      <FilterMenu
        fields={fields}
        trigger={<button type="button">Refine</button>}
        popupClassName="w-80"
        labels={{ backToFields: "Zurück" }}
      />
    )
    await screen.getByRole("button", { name: "Refine" }).click()
    const menu = page.getByRole("dialog", { name: "Filters" })
    await expect.element(menu).toHaveClass("w-80")
    await page.getByRole("option", { name: /^Status/ }).click()
    await expect
      .element(page.getByRole("button", { name: "Zurück" }))
      .toBeInTheDocument()
  })

  it("portals into a given container", async () => {
    function InContainer() {
      const [node, setNode] = React.useState<HTMLDivElement | null>(null)
      return (
        <>
          <FilterMenu fields={fields} defaultOpen container={node} />
          <div ref={setNode} data-testid="host" />
        </>
      )
    }
    const screen = await render(<InContainer />)
    await expect
      .element(
        screen.getByTestId("host").getByRole("dialog", { name: "Filters" })
      )
      .toBeInTheDocument()
  })

  it("scrolls the list, not the page, to the highlighted row", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
    const many: FilterField[] = [
      {
        id: "owner",
        label: "Owner",
        options: Array.from({ length: 30 }, (_, i) => ({
          value: `person-${i}`,
          label: `Person ${i + 1}`,
        })),
      },
    ]
    try {
      const screen = await openMenu(<FilterMenu fields={many} />)
      await userEvent.click(screen.getByRole("option", { name: /^Owner/ }))
      const list = page.getByRole("listbox").element() as HTMLElement
      await userEvent.keyboard("{End}")
      await expect.poll(() => list.scrollTop).toBeGreaterThan(0)
      const row = page
        .getByRole("option", { name: "Person 30" })
        .element()
        .getBoundingClientRect()
      const bounds = list.getBoundingClientRect()
      expect(row.bottom).toBeLessThanOrEqual(bounds.bottom + 1)
      expect(scrollIntoView).not.toHaveBeenCalled()
    } finally {
      scrollIntoView.mockRestore()
    }
  })
})
