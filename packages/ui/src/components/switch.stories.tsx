import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn } from "storybook/test"

import { Label } from "./label.js"
import { Switch } from "./switch.js"

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
    disabled: { control: "boolean" },
    onCheckedChange: { control: false },
  },
  // The bare stories have no visible Label, so they name the switch directly.
  args: {
    size: "default",
    disabled: false,
    "aria-label": "Airplane mode",
    onCheckedChange: fn(),
  },
  parameters: { controls: { exclude: ["onCheckedChange"] } },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Airplane mode" })
    await expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    await expect(toggle).toBeChecked()
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(
      true,
      expect.anything()
    )
    await userEvent.keyboard(" ")
    await expect(toggle).not.toBeChecked()
  },
}

export const Checked: Story = {
  args: { defaultChecked: true },
}

export const Small: Story = {
  args: { size: "sm" },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithLabel: Story = {
  name: "With label",
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} id="wifi" aria-label={undefined} />
      <Label htmlFor="wifi">Wi-Fi</Label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch", { name: "Wi-Fi" })
    await userEvent.click(canvas.getByText("Wi-Fi"))
    await expect(toggle).toBeChecked()
  },
}

export const SettingsList: Story = {
  name: "Settings list",
  render: () => (
    <div className="flex w-80 flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {[
        ["Push notifications", "Alerts on this device.", true],
        ["Email digest", "A summary every Monday.", false],
        ["Read receipts", "Show when you've read a message.", true],
      ].map(([title, detail, on], index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <div className="flex flex-1 flex-col gap-0.5">
            <Label htmlFor={`setting-${index}`}>{title}</Label>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
          <Switch id={`setting-${index}`} defaultChecked={on as boolean} />
        </div>
      ))}
    </div>
  ),
}
