import { describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import {
  ComposerAttachButton,
  ComposerAttachments,
  ComposerFrame,
  ComposerInput,
  ComposerProvider,
  ComposerSubmit,
  LocalComposerProvider,
  formatBytes,
  matchesAccept,
  useComposer,
  type ComposerActions,
} from "./chat-composer.js"

function Composer(props: React.ComponentProps<typeof LocalComposerProvider>) {
  return (
    <LocalComposerProvider {...props}>
      <ComposerFrame>
        <ComposerAttachments />
        <ComposerInput />
        <ComposerAttachButton />
        <ComposerSubmit />
      </ComposerFrame>
    </LocalComposerProvider>
  )
}

describe("Chat composer", () => {
  it("throws when a part renders outside a provider", async () => {
    function Orphan() {
      useComposer()
      return null
    }
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(render(<Orphan />)).rejects.toThrow(/ComposerProvider/)
    error.mockRestore()
  })

  it("keeps the draft when a send fails", async () => {
    const onSubmit = vi.fn(() => Promise.reject(new Error("offline")))
    await render(
      <Composer defaultValue="Hold on to this" onSubmit={onSubmit} />
    )
    await page.getByRole("button", { name: "Send" }).click()
    expect(onSubmit).toHaveBeenCalledOnce()
    await expect
      .element(page.getByRole("button", { name: "Send" }))
      .toBeEnabled()
    await expect
      .element(page.getByRole("textbox", { name: "Message" }))
      .toHaveValue("Hold on to this")
  })

  it("holds the send button busy until a send settles", async () => {
    let resolve = () => {}
    const onSubmit = vi.fn(
      () => new Promise<void>((done) => (resolve = () => done()))
    )
    await render(<Composer defaultValue="Wait" onSubmit={onSubmit} />)
    const send = page.getByRole("button", { name: "Send" })
    await send.click()
    await expect.element(send).toHaveAttribute("aria-busy", "true")
    await expect.element(send).toBeDisabled()
    resolve()
    await expect
      .element(page.getByRole("textbox", { name: "Message" }))
      .toHaveValue("")
    await expect.element(send).not.toHaveAttribute("aria-busy")
  })

  it("sends attachments without text, then clears them", async () => {
    const onSubmit = vi.fn()
    await render(<Composer onSubmit={onSubmit} />)
    const input = page
      .getByRole("button", { name: "Attach files" })
      .element()
      .parentElement!.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(["hello"], "notes.txt", { type: "text/plain" })
    await userEvent.upload(input, file)
    await expect
      .element(page.getByRole("button", { name: "Remove notes.txt" }))
      .toBeVisible()
    await page.getByRole("button", { name: "Send" }).click()
    expect(onSubmit).toHaveBeenCalledWith({
      value: "",
      attachments: [expect.objectContaining({ name: "notes.txt", size: 5 })],
    })
    await expect
      .element(page.getByRole("list", { name: "Attachments" }))
      .not.toBeInTheDocument()
  })

  it("removes an attachment", async () => {
    await render(
      <Composer
        defaultAttachments={[
          { id: "a", name: "a.png" },
          { id: "b", name: "b.png" },
        ]}
      />
    )
    await page.getByRole("button", { name: "Remove a.png" }).click()
    await expect.element(page.getByRole("listitem")).toHaveTextContent("b.png")
  })

  it("sends an empty draft when the provider allows it", async () => {
    const onSubmit = vi.fn()
    await render(<Composer canSubmit={() => true} onSubmit={onSubmit} />)
    await page.getByRole("button", { name: "Send" }).click()
    expect(onSubmit).toHaveBeenCalledWith({ value: "", attachments: [] })
  })

  it("holds back a draft the provider rejects", async () => {
    await render(
      <Composer defaultValue="hi" canSubmit={({ value }) => value.length > 3} />
    )
    await expect
      .element(page.getByRole("button", { name: "Send" }))
      .toBeDisabled()
  })

  it("leaves Enter alone when a handler prevents it", async () => {
    const onSubmit = vi.fn()
    await render(
      <LocalComposerProvider defaultValue="Draft" onSubmit={onSubmit}>
        <ComposerInput onKeyDown={(event) => event.preventDefault()} />
      </LocalComposerProvider>
    )
    await page.getByRole("textbox").click()
    await userEvent.keyboard("{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("focuses the text box from a click on the frame's surface", async () => {
    await render(
      <LocalComposerProvider>
        <ComposerFrame>
          <div data-testid="surface" className="h-10" />
          <ComposerInput />
        </ComposerFrame>
      </LocalComposerProvider>
    )
    await page.getByTestId("surface").click()
    await expect.element(page.getByRole("textbox")).toHaveFocus()
  })

  it("runs on any state and actions passed to the provider", async () => {
    const actions: ComposerActions = {
      setValue: vi.fn(),
      addAttachments: vi.fn(),
      removeAttachment: vi.fn(),
      submit: vi.fn(),
    }
    await render(
      <ComposerProvider
        state={{ value: "From a store", attachments: [] }}
        actions={actions}
      >
        <ComposerInput />
        <ComposerSubmit />
      </ComposerProvider>
    )
    const input = page.getByRole("textbox")
    await expect.element(input).toHaveValue("From a store")
    await input.click()
    await userEvent.keyboard("!")
    expect(actions.setValue).toHaveBeenLastCalledWith("From a store!")
    await page.getByRole("button", { name: "Send" }).click()
    expect(actions.submit).toHaveBeenCalledOnce()
  })

  it("keeps what was typed while a slow send was in flight", async () => {
    let resolve = () => {}
    const onSubmit = vi.fn(
      () => new Promise<void>((done) => (resolve = () => done()))
    )
    await render(<Composer defaultValue="First" onSubmit={onSubmit} />)
    const input = page.getByRole("textbox", { name: "Message" })
    await page.getByRole("button", { name: "Send" }).click()
    await input.fill("Second")
    resolve()
    await expect
      .element(page.getByRole("button", { name: "Send" }))
      .not.toHaveAttribute("aria-busy")
    await expect.element(input).toHaveValue("Second")
  })

  it("keeps the composer's ref when the caller passes one", async () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    await render(
      <LocalComposerProvider>
        <ComposerFrame>
          <div data-testid="surface" className="h-10" />
          <ComposerInput ref={ref} />
        </ComposerFrame>
      </LocalComposerProvider>
    )
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    await page.getByTestId("surface").click()
    await expect.element(page.getByRole("textbox")).toHaveFocus()
  })

  it("matches files against an accept string", () => {
    const png = new File([""], "shot.PNG", { type: "image/png" })
    const pdf = new File([""], "spec.pdf", { type: "application/pdf" })
    expect(matchesAccept(png, undefined)).toBe(true)
    expect(matchesAccept(png, "image/*")).toBe(true)
    expect(matchesAccept(png, ".png")).toBe(true)
    expect(matchesAccept(pdf, "image/*")).toBe(false)
    expect(matchesAccept(pdf, "image/*, application/pdf")).toBe(true)
  })

  it("formats sizes in the units people read", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1024)).toBe("1 KB")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(482_000)).toBe("471 KB")
    expect(formatBytes(1_830_000)).toBe("1.7 MB")
  })
})
