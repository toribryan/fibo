import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor } from "storybook/test"

import { Avatar, AvatarFallback } from "./avatar.js"
import { DropZone } from "./drop-zone.js"

const meta: Meta<typeof DropZone> = {
  title: "Base components/Forms/Drop zone",
  component: DropZone,
  tags: ["new"],
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
    accept: { control: "text" },
    disabled: { control: "boolean" },
    onDropFiles: { control: false },
    onRejectFiles: { control: false },
    children: { control: false },
  },
  args: {
    label: "Drop files to attach",
    description: "Images, PDFs and CSV files up to 25 MB",
    accept: "image/*,.pdf,.csv",
    disabled: false,
    onDropFiles: fn(),
    onRejectFiles: fn(),
  },
  parameters: {
    controls: { exclude: ["onDropFiles", "onRejectFiles", "children"] },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof DropZone>

const MESSAGES = [
  { author: "Ada Lovelace", text: "Can you send the audit?" },
  { author: "Grace Hopper", text: "Dropping it in now." },
]

function Conversation() {
  return (
    <ol aria-label="Messages" className="flex flex-col gap-3 p-4">
      {MESSAGES.map((message) => (
        <li key={message.text} className="flex items-start gap-2.5 text-sm">
          <Avatar size="sm">
            <AvatarFallback>
              {message.author
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{message.author}</span>
            <span className="text-muted-foreground">{message.text}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

export const Default: Story = {
  render: (args) => (
    <DropZone
      {...args}
      data-testid="zone"
      className="rounded-xl border border-border bg-background"
    >
      <Conversation />
      <p className="px-4 pb-4 text-xs text-muted-foreground">
        Drag files from your desktop over this panel.
      </p>
    </DropZone>
  ),
  play: async ({ args, canvas }) => {
    const zone = canvas.getByTestId("zone")
    const data = new DataTransfer()
    data.items.add(new File([""], "audit.pdf", { type: "application/pdf" }))
    data.items.add(new File([""], "notes.txt", { type: "text/plain" }))
    zone.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, dataTransfer: data })
    )
    await waitFor(() =>
      expect(canvas.getByText("Drop files to attach")).toBeVisible()
    )
    zone.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer: data })
    )
    await expect(args.onDropFiles).toHaveBeenCalledTimes(1)
    await expect(args.onRejectFiles).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(canvas.queryByText("Drop files to attach")).toBeNull()
    )
  },
}

function Dragging(args: Story["args"]) {
  // A real drag can't be held still for a screenshot, so this starts one.
  return (
    <DropZone
      {...args}
      ref={(node) => {
        if (!node || node.dataset.dragging !== undefined) return
        const data = new DataTransfer()
        data.items.add(new File([""], "shot.png", { type: "image/png" }))
        node.dispatchEvent(
          new DragEvent("dragenter", { bubbles: true, dataTransfer: data })
        )
      }}
      className="rounded-xl border border-border bg-background"
    >
      <Conversation />
    </DropZone>
  )
}

export const WhileDragging: Story = {
  name: "While dragging",
  render: (args) => <Dragging {...args} />,
}
