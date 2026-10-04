import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
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

  it("stacks the tiers at every width when vertical", async () => {
    const row = {
      base: "oklch(0.205 0 0)",
      primitive: "neutral-900",
      semantic: "bg-primary",
    }
    const chips = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-slot="token-flow-chip"]')].map(
        (chip) => chip.getBoundingClientRect()
      )
    await page.viewport(1024, 768)
    try {
      const screen = await render(<TokenFlow rows={[row]} />)
      const [base, , role] = chips(screen.container)
      expect(role!.left).toBeGreaterThan(base!.right)
      await screen.rerender(<TokenFlow rows={[row]} orientation="vertical" />)
      const [top, , bottom] = chips(screen.container)
      expect(bottom!.top).toBeGreaterThan(top!.bottom)
    } finally {
      await page.viewport(414, 896)
    }
  })

  it("rests off screen when given a ref, and hands the ref its root", async () => {
    const ref = React.createRef<HTMLDivElement>()
    const pulses = () =>
      screen.container.querySelectorAll("line.stroke-muted-foreground").length
    const screen = await render(
      <div style={{ marginTop: "200vh" }}>
        <TokenFlow
          ref={ref}
          rows={[
            {
              base: "oklch(0.205 0 0)",
              primitive: "neutral-900",
              semantic: "bg-primary",
            },
          ]}
        />
      </div>
    )
    const root = screen.container.querySelector('[data-slot="token-flow"]')!
    expect(ref.current).toBe(root)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(pulses()).toBe(0)
    root.scrollIntoView()
    await expect.poll(pulses).toBe(2)
  })

  it("settles on the new value when motion is turned off mid-scramble", async () => {
    // A stand-in for the reduced-motion query that the test can flip.
    const listeners = new Set<() => void>()
    let reduce = false
    const matchMedia = window.matchMedia.bind(window)
    const spy = vi.spyOn(window, "matchMedia").mockImplementation((query) =>
      query.includes("prefers-reduced-motion")
        ? ({
            get matches() {
              return reduce
            },
            addEventListener: (_: string, listener: () => void) =>
              listeners.add(listener),
            removeEventListener: (_: string, listener: () => void) =>
              listeners.delete(listener),
          } as unknown as MediaQueryList)
        : matchMedia(query)
    )
    try {
      const rows = [
        {
          base: "oklch(1 0 0)",
          primitive: "white",
          semantic: "bg-background",
          dark: { base: "oklch(0.145 0 0)", primitive: "neutral-950" },
        },
      ]
      const screen = await render(<TokenFlow rows={rows} theme="light" />)
      await screen.rerender(<TokenFlow rows={rows} theme="dark" />)
      const shown = () =>
        screen.container.querySelector(
          '[data-slot="token-flow-chip"] .absolute'
        )?.textContent
      await expect.poll(shown).not.toBe("oklch(0.145 0 0)")
      reduce = true
      listeners.forEach((listener) => listener())
      await expect.poll(shown).toBe("oklch(0.145 0 0)")
    } finally {
      spy.mockRestore()
    }
  })
})
