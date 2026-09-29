import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useState } from "react"
import { expect } from "storybook/test"

import { Button } from "./button.js"
import { Progress, ProgressLabel, ProgressValue } from "./progress.js"

type Args = { value: number | null; label: string }

const meta: Meta<Args> = {
  title: "Base components/Progress",
  component: Progress,
  subcomponents: { ProgressLabel, ProgressValue },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    label: {
      control: "text",
      description: "The ProgressLabel's text.",
      table: { category: "ProgressLabel" },
    },
  },
  args: { value: 60, label: "Uploading photos" },
  parameters: {
    controls: {
      exclude: ["format", "getAriaValueText", "locale", "children"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: ({ value, label }) => (
    <Progress value={value}>
      <ProgressLabel>{label}</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", { name: "Uploading photos" })
    await expect(bar).toHaveAttribute("aria-valuenow", "60")
    await expect(canvas.getByText("60%")).toBeVisible()
  },
}

export const Indeterminate: Story = {
  args: { value: null, label: "Connecting" },
}

export const Complete: Story = {
  args: { value: 100, label: "Upload complete" },
}

export const WithoutLabel: Story = {
  name: "Without label",
  render: ({ value }) => <Progress value={value} aria-label="Storage used" />,
}

function Simulated() {
  const [value, setValue] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(
      () =>
        setValue((current) => {
          const next = Math.min(100, current + 7)
          if (next === 100) setRunning(false)
          return next
        }),
      300
    )
    return () => window.clearInterval(id)
  }, [running])
  return (
    <div className="flex flex-col gap-4">
      <Progress value={value}>
        <ProgressLabel>
          {value === 100 ? "Export ready" : "Exporting report"}
        </ProgressLabel>
        <ProgressValue />
      </Progress>
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => {
          setValue(0)
          setRunning(true)
        }}
      >
        {value === 0 ? "Start export" : "Export again"}
      </Button>
    </div>
  )
}

export const Live: Story = {
  render: () => <Simulated />,
}
