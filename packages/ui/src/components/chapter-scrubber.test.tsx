import { describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
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

  it("names the focused option by focus, not an active descendant", async () => {
    const screen = await render(<ChapterScrubber chapters={chapters} />)
    const option = screen.getByRole("option", { name: "Chapter 2" })
    ;(option.element() as HTMLElement).focus()
    await expect.element(option).toHaveFocus()
    await expect
      .element(screen.getByRole("listbox"))
      .not.toHaveAttribute("aria-activedescendant")
  })

  it("narrows the card to stay on screen when neither side fits it", async () => {
    await page.viewport(360, 640)
    try {
      const screen = await render(
        <div style={{ paddingLeft: 170 }}>
          <ChapterScrubber chapters={chapters} />
        </div>
      )
      const option = screen.getByRole("option", { name: "Chapter 1" })
      ;(option.element() as HTMLElement).focus()
      const preview = () =>
        document.querySelector<HTMLElement>(
          '[data-slot="chapter-scrubber-preview"]'
        )
      await expect.poll(() => preview()?.style.width).not.toBe("248px")
      const rect = preview()!.getBoundingClientRect()
      expect(rect.left).toBeGreaterThanOrEqual(0)
      expect(rect.right).toBeLessThanOrEqual(360)
    } finally {
      await page.viewport(414, 896)
    }
  })

  it("lets go once the rail scrolls out of view", async () => {
    const onActiveChange = vi.fn()
    const screen = await render(
      <div style={{ paddingBottom: 3000 }}>
        <ChapterScrubber chapters={chapters} onActiveChange={onActiveChange} />
      </div>
    )
    const option = screen.getByRole("option", { name: "Chapter 2" })
    ;(option.element() as HTMLElement).focus()
    await expect.poll(() => onActiveChange.mock.lastCall?.[1]).toBe(1)
    window.scrollTo(0, 2000)
    try {
      await expect.poll(() => onActiveChange.mock.lastCall?.[1]).toBe(-1)
      await expect.element(option).not.toHaveFocus()
    } finally {
      window.scrollTo(0, 0)
    }
  })
})
