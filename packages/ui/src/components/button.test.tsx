import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"
import { PlusIcon } from "lucide-react"

import { Button } from "./button.js"

describe("Button", () => {
  it("puts the ref and aria props on the button", async () => {
    const ref = React.createRef<HTMLButtonElement>()
    const screen = await render(
      <Button ref={ref} aria-describedby="hint">
        Save
      </Button>
    )
    const button = screen.getByRole("button", { name: "Save" })
    expect(ref.current).toBe(button.element())
    await expect.element(button).toHaveAttribute("aria-describedby", "hint")
  })

  it("hides its icons from the accessible name", async () => {
    const screen = await render(<Button iconStart={PlusIcon}>New</Button>)
    await expect.element(screen.getByRole("button")).toHaveAccessibleName("New")
    expect(
      screen.getByRole("button").element().querySelector("svg")
    ).toHaveAttribute("aria-hidden", "true")
  })

  it("stays focusable but blocks presses while loading", async () => {
    const onClick = vi.fn()
    const screen = await render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    )
    const button = screen.getByRole("button", { name: "Save" })
    await expect.element(button).toHaveAttribute("aria-busy", "true")
    await expect.element(button).toHaveAttribute("aria-disabled", "true")
    await userEvent.tab()
    await expect.element(button).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(onClick).not.toHaveBeenCalled()
  })

  it("keeps an icon-only button's name while loading", async () => {
    const screen = await render(
      <Button size="icon" loading aria-label="Delete" iconStart={PlusIcon} />
    )
    await expect
      .element(screen.getByRole("button"))
      .toHaveAccessibleName("Delete")
  })
})
