import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, fn } from "storybook/test"

import { Slider } from "./slider.js"

const meta: Meta<typeof Slider> = {
  title: "Base components/Slider",
  component: Slider,
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    defaultValue: { control: false },
    onValueChange: { control: false },
    thumbLabels: { control: false },
  },
  args: {
    defaultValue: [40],
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    orientation: "horizontal",
    "aria-label": "Volume",
    onValueChange: fn(),
  },
  parameters: {
    controls: { exclude: ["onValueChange", "defaultValue", "thumbLabels"] },
  },
  decorators: [
    (Story, { args }) => (
      <div className={args.orientation === "vertical" ? "h-48" : "w-72"}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const thumb = canvas.getByRole("slider", { name: "Volume" })
    await expect(thumb).toHaveAttribute("aria-valuenow", "40")

    await userEvent.click(thumb)
    await userEvent.keyboard("{ArrowRight}{ArrowRight}")
    await expect(thumb).toHaveAttribute("aria-valuenow", "42")
    await expect(args.onValueChange).toHaveBeenCalled()

    await userEvent.keyboard("{Home}")
    await expect(thumb).toHaveAttribute("aria-valuenow", "0")
    await userEvent.keyboard("{End}")
    await expect(thumb).toHaveAttribute("aria-valuenow", "100")
  },
}

export const Range: Story = {
  args: {
    defaultValue: [20, 80],
    "aria-label": undefined,
    thumbLabels: ["Minimum price", "Maximum price"],
  },
}

export const Steps: Story = {
  args: { defaultValue: [50], step: 10 },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Vertical: Story = {
  args: { orientation: "vertical" },
}

function WithValue() {
  const [value, setValue] = useState(60)
  return (
    <div className="flex w-72 flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Brightness</span>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {value}%
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={(next) => setValue(next as number)}
        aria-label="Brightness"
      />
    </div>
  )
}

export const WithLabelAndValue: Story = {
  name: "With label and value",
  render: () => <WithValue />,
}
