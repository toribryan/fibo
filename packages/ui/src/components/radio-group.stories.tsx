import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn } from "storybook/test"

import { Label } from "./label.js"
import { RadioGroup, RadioGroupItem } from "./radio-group.js"

const PLANS = [
  { value: "hobby", label: "Hobby" },
  { value: "pro", label: "Pro" },
  { value: "team", label: "Team" },
]

const meta: Meta<typeof RadioGroup> = {
  title: "Components/Radio group",
  component: RadioGroup,
  subcomponents: { RadioGroupItem },
  argTypes: {
    disabled: { control: "boolean" },
    defaultValue: { control: false },
    onValueChange: { control: false },
  },
  args: {
    defaultValue: "pro",
    disabled: false,
    "aria-label": "Plan",
    onValueChange: fn(),
  },
  parameters: { controls: { exclude: ["onValueChange", "defaultValue"] } },
  render: (args) => (
    <RadioGroup {...args} className="w-56">
      {PLANS.map((plan) => (
        <div key={plan.value} className="flex items-center gap-2">
          <RadioGroupItem value={plan.value} id={`plan-${plan.value}`} />
          <Label htmlFor={`plan-${plan.value}`}>{plan.label}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const hobby = canvas.getByRole("radio", { name: "Hobby" })
    const pro = canvas.getByRole("radio", { name: "Pro" })
    const team = canvas.getByRole("radio", { name: "Team" })
    await expect(pro).toBeChecked()

    await userEvent.click(canvas.getByText("Hobby"))
    await expect(hobby).toBeChecked()
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      "hobby",
      expect.anything()
    )

    // Arrow keys move the selection along the group, wrapping at the end.
    await userEvent.keyboard("{ArrowDown}")
    await expect(pro).toBeChecked()
    await expect(pro).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    await expect(hobby).toBeChecked()
    await userEvent.keyboard("{ArrowUp}")
    await expect(team).toBeChecked()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithDescriptions: Story = {
  name: "With descriptions",
  render: (args) => (
    <RadioGroup {...args} className="w-72 gap-4">
      {[
        ["hobby", "Hobby", "For side projects. One seat."],
        ["pro", "Pro", "For freelancers. Unlimited projects."],
        ["team", "Team", "For studios. Shared billing and roles."],
      ].map(([value, title, detail]) => (
        <div key={value} className="flex items-start gap-3">
          <RadioGroupItem
            value={value!}
            id={`described-${value}`}
            aria-describedby={`described-${value}-detail`}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor={`described-${value}`}>{title}</Label>
            <p
              id={`described-${value}-detail`}
              className="text-sm text-muted-foreground"
            >
              {detail}
            </p>
          </div>
        </div>
      ))}
    </RadioGroup>
  ),
}

export const Horizontal: Story = {
  render: (args) => (
    <RadioGroup {...args} className="flex w-auto gap-6">
      {PLANS.map((plan) => (
        <div key={plan.value} className="flex items-center gap-2">
          <RadioGroupItem value={plan.value} id={`row-${plan.value}`} />
          <Label htmlFor={`row-${plan.value}`}>{plan.label}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
}
