import { DatabaseIcon } from "lucide-react"
import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import {
  IntegrationVisual,
  type IntegrationItem,
} from "./integration-visual.js"

const items = (n: number): IntegrationItem[] =>
  Array.from({ length: n }, (_, i) => ({
    title: `Tool ${i + 1}`,
    icon: <DatabaseIcon />,
  }))

describe("IntegrationVisual", () => {
  it("draws no more tools than the layout holds", async () => {
    const screen = await render(<IntegrationVisual items={items(6)} />)
    expect(
      screen.container.querySelectorAll('[data-slot="integration-visual-item"]')
    ).toHaveLength(4)
  })

  it("names idle tools for screen readers", async () => {
    const screen = await render(
      <IntegrationVisual
        layout="orbit"
        items={[{ title: "Email", icon: <DatabaseIcon />, status: "idle" }]}
      />
    )
    await expect.element(screen.getByText("Email, idle")).toBeInTheDocument()
  })

  it("keeps the hub out of the tab order without a preview", async () => {
    const screen = await render(<IntegrationVisual items={items(2)} />)
    const hub = screen.container.querySelector(
      '[data-slot="integration-visual-hub"]'
    )
    expect(hub?.hasAttribute("tabindex")).toBe(false)
  })
})
