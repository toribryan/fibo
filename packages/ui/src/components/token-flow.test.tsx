import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import { TokenFlow } from "./token-flow.js"

describe("TokenFlow", () => {
  it("renders a value, a primitive and a role for each row", async () => {
    const screen = await render(
      <TokenFlow
        rows={[
          {
            base: "oklch(0.205 0 0)",
            primitive: "neutral-900",
            semantic: "bg-primary",
          },
          {
            base: "oklch(0.505 0.213 27.518)",
            primitive: "red-700",
            semantic: "text-destructive",
          },
        ]}
      />
    )
    expect(
      screen.container.querySelectorAll('[data-slot="token-flow-chip"]')
    ).toHaveLength(6)
    await expect
      .element(screen.getByText("bg-primary", { exact: false }))
      .toBeInTheDocument()
  })

  it("tells screen readers which tier each chip is", async () => {
    const screen = await render(
      <TokenFlow
        rows={[
          {
            base: "oklch(0.205 0 0)",
            primitive: "neutral-900",
            semantic: "bg-primary",
          },
        ]}
      />
    )
    const chips = screen.container.querySelectorAll(
      '[data-slot="token-flow-chip"]'
    )
    expect(chips[2]?.textContent).toContain("Semantic")
  })
})
