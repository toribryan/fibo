import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Separator } from "./separator.js"

const meta: Meta<typeof Separator> = {
  title: "Base components/Display/Separator",
  component: Separator,
  tags: ["new"],
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
  args: { orientation: "horizontal" },
  render: (args) => (
    <div className="flex h-24 w-72 items-center justify-center">
      <Separator {...args} />
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof Separator>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal"
    )
  },
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Edit</span>
      <Separator orientation="vertical" />
      <span>Share</span>
      <Separator orientation="vertical" />
      <span>Delete</span>
    </div>
  ),
}

export const WithLabel: Story = {
  name: "With a label",
  render: () => (
    <div className="w-72">
      <Separator>Today</Separator>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("separator", { name: "Today" })
    ).toBeInTheDocument()
  },
}

export const InAList: Story = {
  name: "In a list",
  render: () => (
    <div className="flex w-72 flex-col gap-3 text-sm">
      <span>Profile</span>
      <span>Settings</span>
      <Separator />
      <span className="text-destructive">Sign out</span>
    </div>
  ),
}
