import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { VoiceMemo, formatElapsed } from "./voice-memo.js"

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-slot="voice-memo"]')!
}

describe("formatElapsed", () => {
  it("shows minutes, seconds and hundredths", () => {
    expect(formatElapsed(0)).toBe("00:00.00")
    expect(formatElapsed(22_330)).toBe("00:22.33")
    expect(formatElapsed(61_005)).toBe("01:01.00")
  })

  it("never goes below zero", () => {
    expect(formatElapsed(-50)).toBe("00:00.00")
  })
})

describe("VoiceMemo", () => {
  it("follows a controlled state and only asks to change it", async () => {
    const onStateChange = vi.fn()
    const screen = await render(
      <VoiceMemo state="recording" onStateChange={onStateChange} />
    )
    await screen.getByRole("button", { name: "Pause recording" }).click()
    expect(onStateChange).toHaveBeenLastCalledWith("paused")
    // Still recording: the owner hasn't passed the new state down.
    expect(root(screen.container).dataset.state).toBe("recording")
  })

  it("keeps time across a pause and leaves the pause out", async () => {
    const onStop = vi.fn()
    const screen = await render(
      <VoiceMemo defaultState="recording" simulate={false} onStop={onStop} />
    )
    await new Promise((resolve) => setTimeout(resolve, 200))
    await screen.getByRole("button", { name: "Pause recording" }).click()
    await new Promise((resolve) => setTimeout(resolve, 300))
    await screen.getByRole("button", { name: "Stop and save" }).click()
    const { duration } = onStop.mock.calls[0]![0]
    expect(duration).toBeGreaterThanOrEqual(150)
    expect(duration).toBeLessThan(450)
  })

  it("draws the level it's given", async () => {
    const screen = await render(
      <VoiceMemo defaultState="recording" level={1} />
    )
    await expect
      .poll(
        () =>
          Array.from(
            root(screen.container).querySelectorAll<HTMLElement>(
              '[data-slot="voice-memo-bar"]'
            )
          ).at(-1)?.style.height
      )
      .toBe("100%")
  })

  it("hides the status line until a connection is given", async () => {
    const screen = await render(<VoiceMemo />)
    expect(
      root(screen.container).querySelector('[data-slot="voice-memo-status"]')
    ).toBeNull()
    await screen.rerender(<VoiceMemo connection="connected" battery={75} />)
    await expect.element(screen.getByText("Connected")).toBeVisible()
    expect(
      root(screen.container).querySelector('[data-slot="voice-memo-status"]')
        ?.textContent
    ).toBe("Connected·75%battery")
  })
})
