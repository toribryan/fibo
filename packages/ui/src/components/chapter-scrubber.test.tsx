import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { ChapterScrubber, type Chapter } from "./chapter-scrubber.js"

const chapters: Chapter[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  title: `Chapter ${i + 1}`,
}))

describe("ChapterScrubber", () => {
  it("marks the controlled chapter as selected", async () => {
    const screen = await render(
      <ChapterScrubber chapters={chapters} currentIndex={5} />
    )
    await expect
      .element(screen.getByRole("option", { name: "Chapter 6" }))
      .toHaveAttribute("aria-selected", "true")
  })

  it("keeps exactly one option in the tab order", async () => {
    const screen = await render(<ChapterScrubber chapters={chapters} />)
    const tabbable = screen.container.querySelectorAll(
      '[role="option"][tabindex="0"]'
    )
    expect(tabbable).toHaveLength(1)
  })

  it("reports the active chapter only when it changes", async () => {
    const onActiveChange = vi.fn()
    const screen = await render(
      <ChapterScrubber
        chapters={chapters}
        onActiveChange={(chapter, index) => onActiveChange(chapter, index)}
      />
    )
    await screen.rerender(
      <ChapterScrubber
        chapters={chapters}
        onActiveChange={(chapter, index) => onActiveChange(chapter, index)}
      />
    )
    expect(onActiveChange).not.toHaveBeenCalled()

    const option = screen.getByRole("option", { name: "Chapter 3" })
    ;(option.element() as HTMLElement).focus()
    await expect.poll(() => onActiveChange.mock.calls.length).toBe(1)
    expect(onActiveChange).toHaveBeenLastCalledWith(chapters[2], 2)

    await screen.rerender(
      <ChapterScrubber
        chapters={chapters}
        onActiveChange={(chapter, index) => onActiveChange(chapter, index)}
      />
    )
    expect(onActiveChange).toHaveBeenCalledOnce()
  })
})
