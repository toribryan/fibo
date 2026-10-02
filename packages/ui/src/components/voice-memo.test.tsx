import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { VoiceMemo, formatElapsed, transcriptToMarkdown } from "./voice-memo.js"

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

describe("transcriptToMarkdown", () => {
  const startedAt = new Date(2026, 9, 2, 14, 5)

  it("writes a heading, a summary line and a timed paragraph per phrase", () => {
    expect(
      transcriptToMarkdown({
        title: "Design review",
        startedAt,
        duration: 83_000,
        segments: [
          { at: 1200, text: "Quick note for the design review." },
          { at: 4800, text: "The drift check passes." },
        ],
      })
    ).toBe(
      "# Design review\n\nOctober 2, 2026 at 2:05 PM · 01:23 · 10 words\n\n**00:01** Quick note for the design review.\n\n**00:04** The drift check passes.\n"
    )
  })

  it("leaves the time off a phrase when it isn't known", () => {
    const markdown = transcriptToMarkdown({
      title: "Memo",
      startedAt,
      duration: 1000,
      segments: [{ text: "From elsewhere." }],
    })
    expect(markdown.endsWith("\n\nFrom elsewhere.\n")).toBe(true)
  })

  it("says so when nothing was heard", () => {
    expect(
      transcriptToMarkdown({
        title: "Memo",
        startedAt,
        duration: 0,
        segments: [],
      })
    ).toContain("_Nothing was heard._")
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
    expect(onComplete.mock.lastCall?.[0]).toBe("Ship it on Friday")
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

  it("hands back the memo as Markdown, and downloads it", async () => {
    const onComplete = vi.fn()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})
    const screen = await render(
      <VoiceMemo
        title="Standup"
        defaultRecording
        transcript="Ship it on Friday."
        onComplete={onComplete}
      />
    )
    await screen.getByRole("button", { name: "Transcribe" }).click()
    const memo = onComplete.mock.lastCall![1]
    expect(memo.markdown).toMatch(/^# Standup\n/)
    expect(memo.markdown).toMatch(/\n\nShip it on Friday\.\n$/)
    expect(memo.filename).toMatch(/^standup-\d{4}-\d{2}-\d{2}-\d{4}\.md$/)

    await screen.getByRole("button", { name: "Download as Markdown" }).click()
    expect(click).toHaveBeenCalledOnce()
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe(memo.filename)
    expect(link.href).toMatch(/^blob:/)
    click.mockRestore()
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
