import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Input } from "./input.js"
import { Label } from "./label.js"

const meta: Meta<typeof Input> = {
  title: "Base components/Input",
  component: Input,
  args: {
    placeholder: "Enter text...",
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Can't edit this",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "not-an-email",
  },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex max-w-xs flex-col gap-2">
      <Label htmlFor="work-email">Work email</Label>
      <Input id="work-email" type="email" {...args} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Work email")
    await userEvent.click(canvas.getByText("Work email"))
    await expect(input).toHaveFocus()
    await userEvent.type(input, "tori@example.com")
    await expect(input).toHaveValue("tori@example.com")
  },
}
