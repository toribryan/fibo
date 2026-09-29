import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Textarea } from "./textarea.js"

const meta: Meta<typeof Textarea> = {
  title: "Base components/Textarea",
  component: Textarea,
  args: {
    placeholder: "Type your message here...",
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByPlaceholderText("Type your message here...")
    const start = textarea.getBoundingClientRect().height
    await userEvent.type(
      textarea,
      "One{Enter}Two{Enter}Three{Enter}Four{Enter}Five"
    )
    await expect(textarea.getBoundingClientRect().height).toBeGreaterThan(start)
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
    defaultValue: "Too short",
  },
}
