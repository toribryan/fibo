import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { FieldSizeContext } from "@workspace/ui/lib/field-size"

import { CommandMenu } from "./command-menu.js"
import { SearchInput } from "./search-input.js"

describe("SearchInput", () => {
  it("keeps its own query when given an onChange", async () => {
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    const screen = await render(
      <SearchInput onChange={onChange} onValueChange={onValueChange} />
    )
    const input = screen.getByRole("searchbox", { name: "Search" })
    await userEvent.type(input, "ab")
    await expect.element(input).toHaveValue("ab")
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onValueChange).toHaveBeenLastCalledWith("ab")
  })

  it("shows only the value it's given when controlled", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <SearchInput value="fixed" onValueChange={onValueChange} />
    )
    const input = screen.getByRole("searchbox", { name: "Search" })
    await userEvent.type(input, "x")
    expect(onValueChange).toHaveBeenLastCalledWith("fixedx")
    await expect.element(input).toHaveValue("fixed")
  })

  it("binds nothing and shows no hint with hotkey null", async () => {
    const screen = await render(<SearchInput hotkey={null} />)
    const input = screen.getByRole("searchbox", { name: "Search" })
    await userEvent.keyboard("{Control>}k{/Control}")
    await expect.element(input).not.toHaveFocus()
    expect(input.element()).not.toHaveAttribute("aria-keyshortcuts")
    expect(document.querySelector("[data-slot=kbd-group]")).toBeNull()
  })

  it("leaves the shortcut to the browser while disabled", async () => {
    await render(<SearchInput disabled />)
    const seen = vi.fn()
    const onKeyDown = (event: KeyboardEvent) => seen(event.defaultPrevented)
    document.addEventListener("keydown", onKeyDown)
    await userEvent.keyboard("{Control>}k{/Control}")
    document.removeEventListener("keydown", onKeyDown)
    expect(seen).toHaveBeenLastCalledWith(false)
  })

  it("keeps an Escape that only clears from reaching the page", async () => {
    const screen = await render(<SearchInput />)
    const reached = vi.fn()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") reached()
    }
    document.addEventListener("keydown", onKeyDown)
    const input = screen.getByRole("searchbox", { name: "Search" })
    await userEvent.type(input, "ab")
    await userEvent.keyboard("{Escape}")
    await expect.element(input).toHaveValue("")
    expect(reached).not.toHaveBeenCalled()
    await userEvent.keyboard("{Escape}")
    document.removeEventListener("keydown", onKeyDown)
    expect(reached).toHaveBeenCalledTimes(1)
  })

  it("keeps its slot as a Command menu's trigger", async () => {
    const screen = await render(
      <CommandMenu
        groups={[]}
        hotkey={null}
        trigger={<SearchInput type="button" />}
      />
    )
    await expect
      .element(screen.getByRole("button", { name: "Search" }))
      .toHaveAttribute("data-slot", "search-input")
  })

  it("takes the size of the field group around the button", async () => {
    const screen = await render(
      <FieldSizeContext value="sm">
        <SearchInput type="button" />
      </FieldSizeContext>
    )
    await expect
      .element(screen.getByRole("button", { name: "Search" }))
      .toHaveAttribute("data-size", "sm")
  })
})
