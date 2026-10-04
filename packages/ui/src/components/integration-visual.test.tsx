import * as React from "react"
import { DatabaseIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"
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
    expect(hub?.tagName).toBe("DIV")
  })

  it("runs its pulses and halo only while on screen", async () => {
    const pulses = (container: HTMLElement) =>
      container.querySelectorAll("path.stroke-muted-foreground").length
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <IntegrationVisual items={items(4)} />
      </div>
    )
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(pulses(screen.container)).toBe(0)
    screen.container
      .querySelector('[data-slot="integration-visual"]')!
      .scrollIntoView()
    await expect.poll(() => pulses(screen.container)).toBe(4)
  })

  it("still rests off screen when given a ref, and hands the ref its root", async () => {
    const ref = React.createRef<HTMLDivElement>()
    const pulses = (container: HTMLElement) =>
      container.querySelectorAll("path.stroke-muted-foreground").length
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <IntegrationVisual ref={ref} items={items(4)} />
      </div>
    )
    const root = screen.container.querySelector(
      '[data-slot="integration-visual"]'
    )!
    expect(ref.current).toBe(root)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(pulses(screen.container)).toBe(0)
    root.scrollIntoView()
    await expect.poll(() => pulses(screen.container)).toBe(4)
  })

  it("draws tools that share a title", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      const screen = await render(
        <IntegrationVisual
          items={[
            { title: "Sheet", icon: <DatabaseIcon /> },
            { title: "Sheet", icon: <DatabaseIcon /> },
          ]}
        />
      )
      expect(
        screen.container.querySelectorAll(
          '[data-slot="integration-visual-item"]'
        )
      ).toHaveLength(2)
      expect(error.mock.calls.flat().map(String).join(" ")).not.toContain(
        "same key"
      )
    } finally {
      error.mockRestore()
    }
  })
})
