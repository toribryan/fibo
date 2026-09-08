import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

import { Button } from "./button.js"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
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
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
    },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

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
}
