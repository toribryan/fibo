import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button.js"
import { PixelSnail } from "./pixel-snail.js"

const meta: Meta<typeof PixelSnail> = {
  title: "Niche/Pixel snail",
  component: PixelSnail,
  tags: ["new"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    pace: { control: "inline-radio", options: ["slow", "default", "fast"] },
    travel: { control: "boolean" },
    ground: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    size: "default",
    pace: "default",
    travel: false,
    ground: true,
    label: "Loading",
  },
}

export default meta
type Story = StoryObj<typeof PixelSnail>

export const Default: Story = {}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <PixelSnail {...args} size="sm" />
      <PixelSnail {...args} size="default" />
      <PixelSnail {...args} size="lg" />
    </div>
  ),
}

export const Travel: Story = {
  args: { travel: true, size: "lg" },
  render: (args) => (
    <div className="w-96">
      <PixelSnail {...args} />
    </div>
  ),
}

export const LoadingPanel: Story = {
  name: "Loading panel",
  render: (args) => (
    <div className="flex w-80 flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <PixelSnail {...args} label="Loading your projects" />
      <p className="text-sm text-muted-foreground">Fetching your projects</p>
      <Button size="sm" variant="outline">
        Cancel
      </Button>
    </div>
  ),
}
