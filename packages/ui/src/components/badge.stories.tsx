import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Badge } from "./badge.js";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
      ],
    },
  },
  args: {
    children: "Badge",
    variant: "default",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const AllVariants: Story = {
    render: (args: ComponentProps<typeof Badge>) => (
      <div className="flex flex-wrap items-center gap-3">
        {(["default", "secondary", "destructive", "outline"] as const).map((variant) => (
          <Badge key={variant} {...args} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
    ),
};