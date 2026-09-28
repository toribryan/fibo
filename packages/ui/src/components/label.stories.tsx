import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Input } from "./input.js"
import { Label } from "./label.js"

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  args: {
    children: "Email",
  },
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {}

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("Email"))
    await expect(canvas.getByLabelText("Email")).toHaveFocus()
  },
}
