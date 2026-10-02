import { describe, expect, it } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from "./sheet.js"

function Example({ side }: { side: SheetSide }) {
  return (
    <Sheet side={side}>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetTitle>Filters</SheetTitle>
      </SheetContent>
    </Sheet>
  )
}

describe("Sheet", () => {
  it.each([
    ["top", "up"],
    ["right", "right"],
    ["bottom", "down"],
    ["left", "left"],
  ] as const)("slides in from the %s", async (side, direction) => {
    const screen = await render(<Example side={side} />)
    await screen.getByRole("button", { name: "Open" }).click()
    const dialog = page.getByRole("dialog", { name: "Filters" })
    await expect
      .element(dialog)
      .toHaveAttribute("data-swipe-direction", direction)
  })
})
