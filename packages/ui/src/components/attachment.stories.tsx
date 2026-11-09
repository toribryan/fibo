import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, fn } from "storybook/test"

import bonzo from "../assets/bonzo.webp"
import { Attachment } from "./attachment.js"

const meta: Meta<typeof Attachment> = {
  title: "Base components/Forms/Attachment",
  component: Attachment,
  tags: ["new"],
  argTypes: {
    type: { control: "inline-radio", options: ["file", "image"] },
    status: { control: "inline-radio", options: ["ready", "loading", "error"] },
    name: { control: "text" },
    size: { control: "number" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    src: { control: false },
    onRemove: { control: false },
    onRetry: { control: false },
  },
  args: {
    type: "file",
    status: "ready",
    name: "token-audit.pdf",
    size: 482_000,
    src: bonzo,
    onRemove: fn(),
    onRetry: fn(),
  },
  parameters: { controls: { exclude: ["src", "onRemove", "onRetry"] } },
}

export default meta
type Story = StoryObj<typeof Attachment>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const remove = canvas.getByRole("button", {
      name: "Remove token-audit.pdf",
    })
    await userEvent.click(remove)
    await expect(args.onRemove).toHaveBeenCalledTimes(1)
    await expect(remove).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onRemove).toHaveBeenCalledTimes(2)
  },
}

export const Statuses: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(["ready", "loading", "error"] as const).map((status) => (
        <div key={status} className="flex items-center gap-3">
          <Attachment {...args} type="file" status={status} />
          <Attachment {...args} type="image" status={status} />
        </div>
      ))}
    </div>
  ),
}

export const Image: Story = {
  args: { type: "image", name: "bonzo.webp" },
}

export const Failed: Story = {
  args: { status: "error", name: "drift-report.csv", error: "Too large" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Retry drift-report.csv" })
    )
    await expect(args.onRetry).toHaveBeenCalledTimes(1)
  },
}

type Upload = {
  id: number
  name: string
  size: number
  image: boolean
  status: "ready" | "loading" | "error"
}

function UploadDemo() {
  const [files, setFiles] = useState<Upload[]>([
    { id: 1, name: "bonzo.webp", size: 48_000, image: true, status: "ready" },
    {
      id: 2,
      name: "token-audit.pdf",
      size: 482_000,
      image: false,
      status: "loading",
    },
    {
      id: 3,
      name: "drift-report.csv",
      size: 38_000,
      image: false,
      status: "error",
    },
  ])
  const update = (id: number, status: Upload["status"]) =>
    setFiles((all) => all.map((f) => (f.id === id ? { ...f, status } : f)))
  return (
    <ul aria-label="Attachments" className="flex flex-wrap items-center gap-2">
      {files.map((file) => (
        <li key={file.id}>
          <Attachment
            type={file.image ? "image" : "file"}
            status={file.status}
            name={file.name}
            size={file.size}
            src={file.image ? bonzo : undefined}
            onRemove={() => setFiles((all) => all.filter((f) => f !== file))}
            onRetry={() => {
              update(file.id, "loading")
              setTimeout(() => update(file.id, "ready"), 800)
            }}
          />
        </li>
      ))}
    </ul>
  )
}

export const InAList: Story = {
  name: "In a list",
  render: () => <UploadDemo />,
}
