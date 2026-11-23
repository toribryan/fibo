import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn } from "storybook/test"
import type { ComponentProps } from "react"
import { ArrowRightIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "./button.js"

const meta: Meta<typeof Button> = {
  title: "Base components/Actions/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: [
        "xs",
        "sm",
        "default",
        "lg",
        "icon-xs",
        "icon-sm",
        "icon",
        "icon-lg",
      ],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fillWidth: { control: "boolean" },
    iconStart: { control: false },
    iconEnd: { control: false },
  },
  parameters: { controls: { exclude: ["iconStart", "iconEnd", "onClick"] } },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    onClick: fn(),
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Button" })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard("{Enter}")
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

export const AllVariants: Story = {
  render: (args: ComponentProps<typeof Button>) => (
    <div className="flex flex-wrap items-center gap-3">
      {(
        [
          "default",
          "outline",
          "secondary",
          "ghost",
          "destructive",
          "link",
        ] as const
      ).map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const AllSizes: Story = {
  render: (args: ComponentProps<typeof Button>) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Button" })
    await expect(button).toBeDisabled()
    button.click()
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const Focused: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab()
    await expect(canvas.getByRole("button", { name: "Button" })).toHaveFocus()
  },
}

export const Loading: Story = {
  args: { loading: true, children: "Saving" },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Saving" })
    await expect(button).toHaveAttribute("aria-busy", "true")
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await userEvent.click(button)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}

export const WithIcon: Story = {
  render: (args: ComponentProps<typeof Button>) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} iconStart={PlusIcon}>
        New project
      </Button>
      <Button {...args} variant="outline" iconEnd={ArrowRightIcon}>
        Continue
      </Button>
    </div>
  ),
}

export const FillWidth: Story = {
  args: { fillWidth: true, children: "Sign in" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
}

export const IconOnly: Story = {
  render: (args: ComponentProps<typeof Button>) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((size) => (
        <Button
          key={size}
          {...args}
          variant="outline"
          size={size}
          aria-label="Delete"
        >
          <Trash2Icon />
        </Button>
      ))}
    </div>
  ),
}
