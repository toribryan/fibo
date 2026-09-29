import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import { PixelSnail } from "./pixel-snail.js"

describe("PixelSnail", () => {
  it("puts its label in the status region as text", async () => {
    const screen = await render(<PixelSnail label="Loading your projects" />)
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Loading your projects")
  })
})
