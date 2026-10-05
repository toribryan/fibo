import type { Meta, StoryObj } from "@storybook/react-vite"
import { CheckIcon } from "lucide-react"

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar.js"
import { Count } from "./count.js"
import { StatusDot } from "./status-dot.js"
// A local image, so the stories load nothing from the network and Chromatic
// snapshots stay stable.
import bonzo from "../assets/bonzo.webp"

const meta: Meta<typeof Avatar> = {
  title: "Base components/Display/Avatar",
  component: Avatar,
  subcomponents: {
    AvatarImage,
    AvatarFallback,
    AvatarBadge,
    AvatarGroup,
    AvatarGroupCount,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
  },
  args: { size: "default" },
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={bonzo} alt="Bonzo" />
      <AvatarFallback>BO</AvatarFallback>
    </Avatar>
  ),
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {}

export const Fallback: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="/missing-avatar.png" alt="Grace Hopper" />
      <AvatarFallback>GH</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarImage src={bonzo} alt="Bonzo" />
          <AvatarFallback>BO</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
}

export const WithStatus: Story = {
  name: "With status",
  render: (args) => (
    <Avatar {...args} size="lg">
      <AvatarImage src={bonzo} alt="Bonzo" />
      <AvatarFallback>BO</AvatarFallback>
      <StatusDot status="present" />
    </Avatar>
  ),
}

export const WithBadge: Story = {
  name: "With badge",
  render: (args) => (
    <Avatar {...args} size="lg">
      <AvatarImage src={bonzo} alt="Bonzo, verified" />
      <AvatarFallback>BO</AvatarFallback>
      <AvatarBadge>
        <CheckIcon />
      </AvatarBadge>
    </Avatar>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src={bonzo} alt="Bonzo" />
        <AvatarFallback>BO</AvatarFallback>
      </Avatar>
      {["GH", "KJ"].map((initials) => (
        <Avatar key={initials}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>
        <Count value={4} plus label={(n) => `${n} more`} />
      </AvatarGroupCount>
    </AvatarGroup>
  ),
}
