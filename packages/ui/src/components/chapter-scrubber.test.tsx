import { describe, expect, it } from "vitest"
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
})
