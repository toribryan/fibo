import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, fn, waitFor } from "storybook/test"

import { Avatar, AvatarFallback } from "./avatar.js"
import { Button } from "./button.js"
import { Label } from "./label.js"
import { RichTextEditor, type RichTextEditorTool } from "./rich-text-editor.js"

const meta: Meta<typeof RichTextEditor> = {
  title: "Base components/Forms/Rich text editor",
  component: RichTextEditor,
  argTypes: {
    placeholder: { control: "text" },
    label: { control: "text" },
    editable: { control: "boolean" },
    maxLength: { control: { type: "number", min: 10, max: 2000, step: 10 } },
    minHeight: { control: { type: "range", min: 60, max: 400, step: 20 } },
    tools: {
      control: "check",
      options: [
        "heading",
        "bold",
        "italic",
        "strike",
        "code",
        "bullet",
        "ordered",
        "quote",
        "link",
        "history",
      ] satisfies RichTextEditorTool[],
    },
    defaultValue: { control: false },
    onChange: { control: false },
  },
  args: {
    placeholder: "Write something…",
    label: "Editor",
    editable: true,
    minHeight: 140,
    onChange: fn(),
  },
  parameters: {
    controls: { exclude: ["defaultValue", "onChange"] },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof RichTextEditor>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const area = await canvas.findByRole("textbox", { name: "Editor" })
    const toolbar = canvas.getByRole("toolbar", { name: "Formatting" })
    const bold = canvas.getByRole("button", { name: "Bold" })
    const italic = canvas.getByRole("button", { name: "Italic" })
    await expect(bold).toHaveAttribute("aria-pressed", "false")

    // Pointer: Bold from the toolbar keeps the caret in the writing area.
    await userEvent.click(area)
    await userEvent.click(bold)
    await waitFor(() => expect(bold).toHaveAttribute("aria-pressed", "true"))
    await expect(area).toHaveFocus()
    await userEvent.keyboard("Ship")
    await expect(area.querySelector("strong")).toHaveTextContent("Ship")

    // Keyboard: the shortcut turns it off again, and the button follows.
    const mod = /mac/i.test(navigator.platform) ? "Meta" : "Control"
    await userEvent.keyboard(`{${mod}>}b{/${mod}}`)
    await waitFor(() => expect(bold).toHaveAttribute("aria-pressed", "false"))
    await userEvent.keyboard(" the tokens")
    await expect(args.onChange).toHaveBeenLastCalledWith(
      "<p><strong>Ship</strong> the tokens</p>",
      expect.anything()
    )

    // The toolbar is one tab stop; arrows, Home and End move inside it.
    bold.focus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(italic).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    await expect(canvas.getByRole("button", { name: "Heading" })).toHaveFocus()
    await userEvent.keyboard("{End}")
    await expect(canvas.getByRole("button", { name: "Redo" })).toHaveFocus()
    await userEvent.keyboard("{Home}")
    await expect(canvas.getByRole("button", { name: "Heading" })).toHaveFocus()
    await expect(
      toolbar.querySelectorAll('[tabindex="0"]').length
    ).toBeLessThanOrEqual(1)

    // Link: select a word, open the inline row, type an address, Enter.
    await userEvent.dblClick(area.querySelector("strong")!)
    await userEvent.click(canvas.getByRole("button", { name: "Add link" }))
    const address = await canvas.findByRole("textbox", {
      name: "Link address",
    })
    await waitFor(() => expect(address).toHaveFocus())
    await userEvent.keyboard("fibo.toribryan.com{Enter}")
    await waitFor(() =>
      expect(area.querySelector("a")).toHaveAttribute(
        "href",
        "https://fibo.toribryan.com"
      )
    )
    await expect(
      canvasElement.querySelector("[data-slot=rich-text-editor-link-row]")
    ).toBeNull()
    await expect(
      canvas.getByRole("button", { name: "Remove link" })
    ).toBeInTheDocument()
  },
}

export const WithLimit: Story = {
  args: {
    maxLength: 120,
    defaultValue:
      "<p>Keep release notes short: what changed, who it affects, and what to do next. Link the pull request, not the diff.</p>",
  },
}

export const MinimalTools: Story = {
  args: {
    tools: ["bold", "italic", "link"],
    minHeight: 80,
    placeholder: "Add a comment…",
    label: "Comment",
  },
}

export const ReadOnly: Story = {
  args: {
    editable: false,
    minHeight: 0,
    label: "Release note",
    defaultValue:
      "<h2>Tokens 2.0</h2><p>Every part now reads <strong>semantic tokens</strong> only. Named roles replace opacity modifiers:</p><ul><li><p><code>-subtle</code> for tints</p></li><li><p><code>-hover</code> for pointer states</p></li></ul><blockquote><p>Figma and code use the same name.</p></blockquote>",
  },
}

function ProposalReply() {
  const [html, setHtml] = useState("")
  const [sent, setSent] = useState<string[]>([])
  const [round, setRound] = useState(0)
  return (
    <div className="flex flex-col gap-4">
      {sent.map((message, index) => (
        <div key={index} className="flex gap-3">
          <Avatar size="sm">
            <AvatarFallback>TB</AvatarFallback>
          </Avatar>
          <div
            className="min-w-0 flex-1 text-sm text-foreground [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Label id="proposal-reply-label">Reply to the proposal</Label>
        <p id="proposal-reply-hint" className="text-sm text-muted-foreground">
          Up to 500 characters. The team sees it in the proposal thread.
        </p>
        <RichTextEditor
          key={round}
          aria-labelledby="proposal-reply-label"
          aria-describedby="proposal-reply-hint"
          placeholder="Share what works and what you'd change…"
          tools={["bold", "italic", "bullet", "link"]}
          minHeight={96}
          maxLength={500}
          onChange={(value) => setHtml(value)}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!html}
            onClick={() => {
              setHtml("")
              setRound((value) => value + 1)
            }}
          >
            Discard
          </Button>
          <Button
            size="sm"
            disabled={!html}
            onClick={() => {
              setSent((current) => [...current, html])
              setHtml("")
              setRound((value) => value + 1)
            }}
          >
            Send reply
          </Button>
        </div>
      </div>
    </div>
  )
}

export const ProposalReplyBox: Story = {
  name: "Proposal reply",
  render: () => <ProposalReply />,
  play: async ({ canvas, userEvent }) => {
    // The visible label names the writing area, and the hint describes it.
    const area = await canvas.findByRole("textbox", {
      name: "Reply to the proposal",
    })
    await expect(area).toHaveAccessibleDescription(
      "Up to 500 characters. The team sees it in the proposal thread."
    )
    await expect(area).not.toHaveAttribute("aria-label")

    const send = canvas.getByRole("button", { name: "Send reply" })
    await expect(send).toBeDisabled()
    await userEvent.click(area)
    await userEvent.keyboard("Looks good")
    await userEvent.click(send)
    await expect(await canvas.findByText("Looks good")).toBeInTheDocument()
  },
}
