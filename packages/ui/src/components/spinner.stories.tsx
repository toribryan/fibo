import type { Meta, StoryObj } from "@storybook/react-vite"

import { Progress, ProgressLabel } from "./progress.js"
import { Spinner } from "./spinner.js"

const meta: Meta<typeof Spinner> = {
  title: "Base components/Feedback/Spinner",
  component: Spinner,
  tags: ["deprecated"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    label: { control: "text" },
  },
  args: { size: "default", label: "Loading" },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" label="Loading small" />
      <Spinner label="Loading default" />
      <Spinner size="lg" label="Loading large" />
    </div>
  ),
}

// What the codemod writes for each Spinner above.
export const Replacement: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <div className="flex items-center gap-4">
        <Progress type="circle" size="xs" value={null} aria-label="Loading" />
        <Progress type="circle" size="sm" value={null} aria-label="Loading" />
        <Progress type="circle" size="lg" value={null} aria-label="Loading" />
      </div>
      <Progress value={null}>
        <ProgressLabel>Loading comments</ProgressLabel>
      </Progress>
    </div>
  ),
}
