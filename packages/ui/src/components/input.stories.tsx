import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input.js";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Enter text...",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Can't edit this",
  },
};
