import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Checkbox } from "./checkbox.js"
import { Label } from "./label.js"

const meta: Meta<typeof Checkbox> = {
  title: "Base components/Forms/Checkbox",
  component: Checkbox,
  // The bare stories have no visible Label, so they name the box directly.
  args: {
    "aria-label": "Accept terms and conditions",
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "mixed"
    )
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", {
      name: "Accept terms and conditions",
    })
    await expect(box).not.toBeChecked()
    await userEvent.click(canvas.getByText("Accept terms and conditions"))
    await expect(box).toBeChecked()
    await userEvent.keyboard(" ")
    await expect(box).not.toBeChecked()
  },
}
