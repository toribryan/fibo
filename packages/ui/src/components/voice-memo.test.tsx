import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { VoiceMemo, formatElapsed } from "./voice-memo.js"

describe("formatElapsed", () => {
  it("shows minutes and seconds", () => {
    expect(formatElapsed(0)).toBe("00:00")
    expect(formatElapsed(22_330)).toBe("00:22")
    expect(formatElapsed(61_005)).toBe("01:01")
  })

  it("never goes below zero", () => {
    expect(formatElapsed(-50)).toBe("00:00")
  })
})

describe("VoiceMemo", () => {
  it("follows a controlled recording and only asks to change it", async () => {
    const onRecordingChange = vi.fn()
    const screen = await render(
      <VoiceMemo
        recording
        transcript=""
        onRecordingChange={onRecordingChange}
      />
    )
    const device = screen.getByRole("button", { name: "Transcribe" })
    await device.click()
    expect(onRecordingChange).toHaveBeenLastCalledWith(false)
    await expect.element(device).toHaveAttribute("aria-pressed", "true")
  })

  it("shows text from your own service, the guess fainter", async () => {
    const screen = await render(
      <VoiceMemo recording transcript="Ship it" interim="on Friday" />
    )
    const text = screen.getByRole("log")
    await expect.element(text).toHaveTextContent("Ship it on Friday")
    await expect
      .element(screen.getByText("on Friday"))
      .toHaveClass("text-muted-foreground")
  })

  it("keeps the unsettled words when it stops", async () => {
    const onComplete = vi.fn()
    const screen = await render(
      <VoiceMemo
        defaultRecording
        transcript="Ship it"
        interim="on Friday"
        onComplete={onComplete}
      />
    )
    await screen.getByRole("button", { name: "Transcribe" }).click()
    expect(onComplete).toHaveBeenCalledWith("Ship it on Friday")
  })

  it("settles a simulated script a word at a time", async () => {
    const onTranscriptChange = vi.fn()
    const screen = await render(
      <VoiceMemo
        defaultRecording
        simulate="one two three"
        onTranscriptChange={onTranscriptChange}
      />
    )
    await expect
      .element(screen.getByRole("log"))
      .toHaveTextContent("one two three")
    await expect
      .poll(() => onTranscriptChange.mock.lastCall?.[0])
      .toBe("one two")
  })

  it("keeps the transcript after stopping, until it's closed", async () => {
    const screen = await render(
      <VoiceMemo defaultRecording transcript="Hello" />
    )
    await screen.getByRole("button", { name: "Transcribe" }).click()
    await expect.element(screen.getByRole("log")).toHaveTextContent("Hello")
    await screen.getByRole("button", { name: "Close transcript" }).click()
    await expect.element(screen.getByRole("log")).not.toBeInTheDocument()
  })
})
