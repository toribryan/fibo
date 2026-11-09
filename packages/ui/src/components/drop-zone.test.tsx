import { describe, expect, it, vi } from "vitest"
import { render } from "vitest-browser-react"

import { DropZone } from "./drop-zone.js"

function files(...list: [string, string][]) {
  const data = new DataTransfer()
  for (const [name, type] of list)
    data.items.add(new File([""], name, { type }))
  return data
}

function drag(zone: Element, type: string, dataTransfer: DataTransfer) {
  zone.dispatchEvent(new DragEvent(type, { bubbles: true, dataTransfer }))
}

describe("DropZone", () => {
  it("splits dropped files by accept", async () => {
    const onDropFiles = vi.fn()
    const onRejectFiles = vi.fn()
    const screen = await render(
      <DropZone
        accept="image/*, .pdf"
        onDropFiles={onDropFiles}
        onRejectFiles={onRejectFiles}
        data-testid="zone"
      >
        <div className="h-20" />
      </DropZone>
    )
    const data = files(
      ["shot.PNG", "image/png"],
      ["spec.pdf", "application/pdf"],
      ["notes.txt", "text/plain"]
    )
    const zone = screen.getByTestId("zone").element()
    drag(zone, "dragenter", data)
    drag(zone, "drop", data)
    expect(onDropFiles.mock.calls[0]![0].map((f: File) => f.name)).toEqual([
      "shot.PNG",
      "spec.pdf",
    ])
    expect(onRejectFiles.mock.calls[0]![0].map((f: File) => f.name)).toEqual([
      "notes.txt",
    ])
  })

  it("shows the overlay only while files are over it", async () => {
    const screen = await render(
      <DropZone description="Up to 25 MB" data-testid="zone">
        <p>Messages</p>
      </DropZone>
    )
    const zone = screen.getByTestId("zone").element()
    const data = files(["a.png", "image/png"])
    drag(zone, "dragenter", data)
    await expect.element(screen.getByText("Drop files to attach")).toBeVisible()
    expect(zone).toHaveAttribute("data-dragging")
    // Crossing into a child fires a second enter before the first leave.
    drag(zone.querySelector("p")!, "dragenter", data)
    drag(zone, "dragleave", data)
    expect(zone).toHaveAttribute("data-dragging")
    drag(zone.querySelector("p")!, "dragleave", data)
    await expect
      .element(screen.getByText("Drop files to attach"))
      .not.toBeInTheDocument()
  })

  it("ignores drags while disabled", async () => {
    const onDropFiles = vi.fn()
    const screen = await render(
      <DropZone disabled onDropFiles={onDropFiles} data-testid="zone">
        <div className="h-20" />
      </DropZone>
    )
    const zone = screen.getByTestId("zone").element()
    const data = files(["a.png", "image/png"])
    drag(zone, "dragenter", data)
    drag(zone, "drop", data)
    expect(zone).not.toHaveAttribute("data-dragging")
    expect(onDropFiles).not.toHaveBeenCalled()
  })
})
