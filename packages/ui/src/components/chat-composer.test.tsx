import { describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import {
  ChatComposerAttachButton,
  ChatComposerAttachments,
  ChatComposerDropZone,
  ChatComposerFrame,
  ChatComposerInput,
  ChatComposerProvider,
  ChatComposerSubmit,
  LocalChatComposerProvider,
  useChatComposer,
  type ChatComposerActions,
} from "./chat-composer.js"

function Composer(
  props: React.ComponentProps<typeof LocalChatComposerProvider>
) {
  return (
    <LocalChatComposerProvider {...props}>
      <ChatComposerFrame>
        <ChatComposerAttachments />
        <ChatComposerInput />
        <ChatComposerAttachButton />
        <ChatComposerSubmit />
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  )
}

describe("Chat composer", () => {
  it("throws when a part renders outside a provider", async () => {
    function Orphan() {
      useChatComposer()
      return null
    }
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(render(<Orphan />)).rejects.toThrow(/ChatComposerProvider/)
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
      <LocalChatComposerProvider defaultValue="Draft" onSubmit={onSubmit}>
        <ChatComposerInput onKeyDown={(event) => event.preventDefault()} />
      </LocalChatComposerProvider>
    )
    await page.getByRole("textbox").click()
    await userEvent.keyboard("{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("focuses the text box from a click on the frame's surface", async () => {
    await render(
      <LocalChatComposerProvider>
        <ChatComposerFrame>
          <div data-testid="surface" className="h-10" />
          <ChatComposerInput />
        </ChatComposerFrame>
      </LocalChatComposerProvider>
    )
    await page.getByTestId("surface").click()
    await expect.element(page.getByRole("textbox")).toHaveFocus()
  })

  it("runs on any state and actions passed to the provider", async () => {
    const actions: ChatComposerActions = {
      setValue: vi.fn(),
      addAttachments: vi.fn(),
      removeAttachment: vi.fn(),
      submit: vi.fn(),
    }
    await render(
      <ChatComposerProvider
        state={{ value: "From a store", attachments: [] }}
        actions={actions}
      >
        <ChatComposerInput />
        <ChatComposerSubmit />
      </ChatComposerProvider>
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
      <LocalChatComposerProvider>
        <ChatComposerFrame>
          <div data-testid="surface" className="h-10" />
          <ChatComposerInput ref={ref} />
        </ChatComposerFrame>
      </LocalChatComposerProvider>
    )
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    await page.getByTestId("surface").click()
    await expect.element(page.getByRole("textbox")).toHaveFocus()
  })

  it("keeps only dropped files that match accept", async () => {
    const screen = await render(
      <LocalChatComposerProvider>
        <ChatComposerDropZone accept="image/*, .pdf" data-testid="zone">
          <ChatComposerFrame>
            <ChatComposerAttachments />
            <ChatComposerInput />
          </ChatComposerFrame>
        </ChatComposerDropZone>
      </LocalChatComposerProvider>
    )
    const data = new DataTransfer()
    for (const [name, type] of [
      ["shot.PNG", "image/png"],
      ["spec.pdf", "application/pdf"],
      ["notes.txt", "text/plain"],
    ] as const)
      data.items.add(new File([""], name, { type }))
    const zone = screen.getByTestId("zone").element()
    zone.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, dataTransfer: data })
    )
    zone.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: data })
    )
    const list = screen.getByRole("list", { name: "Attachments" })
    await expect.element(list).toMatchTextContent("shot.PNG")
    await expect.element(list).toMatchTextContent("spec.pdf")
    expect(list.element().textContent).not.toContain("notes.txt")
  })

  it("shows sizes in the units people read", async () => {
    const sizes = [512, 1024, 1536, 482_000, 1_830_000]
    const screen = await render(
      <ChatComposerProvider
        state={{
          value: "",
          attachments: sizes.map((size, i) => ({
            id: String(i),
            name: `file-${i}`,
            size,
          })),
        }}
        actions={{
          setValue() {},
          addAttachments() {},
          removeAttachment() {},
          submit() {},
        }}
      >
        <ChatComposerAttachments />
      </ChatComposerProvider>
    )
    const text = screen
      .getByRole("list", { name: "Attachments" })
      .element().textContent
    for (const label of ["512 B", "1 KB", "1.5 KB", "471 KB", "1.7 MB"])
      expect(text).toContain(label)
  })
})
