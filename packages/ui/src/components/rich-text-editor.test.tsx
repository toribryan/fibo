import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Field, FieldLabel } from "./field.js"
import { Label } from "./label.js"
import { RichTextEditor } from "./rich-text-editor.js"

describe("RichTextEditor", () => {
  it("reports each edit as HTML, and an empty document as an empty string", async () => {
    const onChange = vi.fn()
    const screen = await render(<RichTextEditor onChange={onChange} />)
    const area = screen.getByRole("textbox", { name: "Editor" })
    await area.click()
    await userEvent.keyboard("Plan")
    await expect.poll(() => onChange.mock.lastCall?.[0]).toBe("<p>Plan</p>")
    // Markdown shortcuts come from StarterKit.
    await userEvent.keyboard("{Enter}- one")
    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toBe("<p>Plan</p><ul><li><p>one</p></li></ul>")
    await userEvent.keyboard("{Control>}a{/Control}{Meta>}a{/Meta}{Backspace}")
    await expect.poll(() => onChange.mock.lastCall?.[0]).toBe("")
  })

  it("shows only the tools it's given, in the toolbar's order", async () => {
    const screen = await render(
      <RichTextEditor tools={["link", "bold", "italic"]} />
    )
    await expect.element(screen.getByRole("textbox")).toBeInTheDocument()
    const names = Array.from(
      screen.container.querySelectorAll("[data-slot=rich-text-editor-tool]")
    ).map((button) => button.getAttribute("aria-label"))
    expect(names).toEqual(["Bold", "Italic", "Add link"])
    expect(screen.container.querySelectorAll("[role=separator]")).toHaveLength(
      1
    )
  })

  it("hides the toolbar when read only", async () => {
    const screen = await render(
      <RichTextEditor editable={false} defaultValue="<p>Done</p>" />
    )
    const area = screen.getByRole("textbox", { name: "Editor" })
    await expect.element(area).toHaveAttribute("aria-readonly", "true")
    await expect.element(area).toHaveAttribute("contenteditable", "false")
    expect(screen.container.querySelector("[role=toolbar]")).toBeNull()
  })

  it("stops at maxLength and counts down from 80%", async () => {
    const onChange = vi.fn()
    const screen = await render(
      <RichTextEditor maxLength={10} onChange={onChange} />
    )
    const area = screen.getByRole("textbox", { name: "Editor" })
    const count = () =>
      screen.container.querySelector("[data-slot=rich-text-editor-count]")
    await area.click()
    await userEvent.keyboard("abcdefg")
    expect(count()?.textContent).toBe("")
    await userEvent.keyboard("h")
    await expect.poll(() => count()?.textContent).toBe("2 left")
    await userEvent.keyboard("ijklmnop")
    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toBe("<p>abcdefghij</p>")
    expect(area.element().textContent).toBe("abcdefghij")
    await expect.poll(() => count()?.textContent).toBe("0 left")
    expect(count()).toHaveAttribute("data-limit")
  })

  it("announces the count at thresholds, not on every keystroke", async () => {
    const screen = await render(<RichTextEditor maxLength={50} />)
    const area = screen.getByRole("textbox", { name: "Editor" })
    const live = () =>
      screen.container.querySelector("[aria-live=polite]")?.textContent
    expect(
      screen.container.querySelector("[data-slot=rich-text-editor-count]")
    ).toHaveAttribute("aria-hidden", "true")
    await area.click()
    await userEvent.keyboard("a".repeat(39))
    expect(live()).toBe("")
    await userEvent.keyboard("a")
    await expect.poll(live).toBe("10 characters left")
    // Inside the same ten, the announcement holds still.
    await userEvent.keyboard("aaaa")
    expect(live()).toBe("10 characters left")
    await userEvent.keyboard("aaaaaa")
    await expect.poll(live).toBe("Character limit reached")
    await userEvent.keyboard("{Backspace}")
    await expect.poll(live).toBe("1 character left")
  })

  it("puts id, labelling and invalid state on the writing area", async () => {
    const screen = await render(
      <div>
        <Label id="note-label">Note</Label>
        <p id="note-hint">Markdown shortcuts work.</p>
        <RichTextEditor
          id="note"
          aria-labelledby="note-label"
          aria-describedby="note-hint"
          aria-invalid
        />
      </div>
    )
    const area = screen.getByRole("textbox", { name: "Note" })
    await expect.element(area).toHaveAttribute("id", "note")
    await expect
      .element(area)
      .toHaveAccessibleDescription("Markdown shortcuts work.")
    await expect.element(area).toHaveAttribute("aria-invalid", "true")
    await expect.element(area).not.toHaveAttribute("aria-label")
    const frame = screen.container.querySelector("[data-slot=rich-text-editor]")
    expect(frame).not.toHaveAttribute("id")
    expect(frame).toHaveAttribute("data-invalid")
  })

  it("names the writing area from a FieldLabel by id", async () => {
    const screen = await render(
      <Field>
        <FieldLabel id="summary-label">Summary</FieldLabel>
        <RichTextEditor aria-labelledby="summary-label" />
      </Field>
    )
    await expect
      .element(screen.getByRole("textbox", { name: "Summary" }))
      .toBeInTheDocument()
  })

  it("takes a relative link, and closes on a bare https://", async () => {
    const onChange = vi.fn()
    const screen = await render(<RichTextEditor onChange={onChange} />)
    const area = screen.getByRole("textbox", { name: "Editor" })
    await area.click()
    await userEvent.keyboard("See docs")
    await userEvent.keyboard(
      "{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}"
    )
    await screen.getByRole("button", { name: "Add link" }).click()
    // Native URL validation would reject both of these and keep the row open.
    await screen.getByRole("textbox", { name: "Link address" }).fill("/docs")
    await userEvent.keyboard("{Enter}")
    await expect
      .poll(() => onChange.mock.lastCall?.[0])
      .toMatch(/<a [^>]*href="\/docs"[^>]*>docs<\/a>/)
    expect(
      screen.container.querySelector("[data-slot=rich-text-editor-link-row]")
    ).toBeNull()

    await userEvent.keyboard("{End} and")
    await screen.getByRole("button", { name: "Add link" }).click()
    await expect
      .element(screen.getByRole("textbox", { name: "Link address" }))
      .toHaveValue("https://")
    await userEvent.keyboard("{Enter}")
    await expect
      .poll(() =>
        screen.container.querySelector("[data-slot=rich-text-editor-link-row]")
      )
      .toBeNull()
    expect(area.element().querySelectorAll("a")).toHaveLength(1)
  })
})
