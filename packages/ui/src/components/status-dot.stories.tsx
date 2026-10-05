import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Avatar, AvatarFallback, AvatarImage } from "./avatar.js"
import { Badge } from "./badge.js"
import { StatusDot } from "./status-dot.js"
import { StickerAvatar } from "./sticker-avatar.js"
// A local image, so the stories load nothing from the network and Chromatic
// snapshots stay stable.
import bonzo from "../assets/bonzo.webp"

const STATUSES = ["present", "away", "offline"] as const
const SIZES = ["xs", "sm", "default", "lg"] as const

const meta: Meta<typeof StatusDot> = {
  title: "Base components/Display/Status dot",
  component: StatusDot,
  argTypes: {
    status: { control: "inline-radio", options: STATUSES },
    variant: { control: "inline-radio", options: ["color", "mono"] },
    size: { control: "inline-radio", options: SIZES },
    label: { control: "text" },
  },
  args: {
    status: "present",
    variant: "color",
    size: "default",
  },
}

export default meta
type Story = StoryObj<typeof StatusDot>

export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText("Present")).toBeInTheDocument()
    await expect(
      canvasElement.querySelector('[data-slot="status-dot"]')
    ).toHaveAttribute("data-status", "present")
  },
}

export const Statuses: Story = {
  name: "Status by shape",
  render: (args) => (
    <div className="flex items-center gap-6">
      {STATUSES.map((status) => (
        <span key={status} className="flex items-center gap-2 text-sm">
          <StatusDot {...args} status={status} label={null} />
          <span className="capitalize">{status}</span>
        </span>
      ))}
    </div>
  ),
}

export const Mono: Story = {
  name: "Without colour",
  args: { variant: "mono" },
  render: (args) => (
    <div className="flex items-center gap-4">
      {STATUSES.map((status) => (
        <StatusDot key={status} {...args} status={status} />
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-4">
      {SIZES.map((size) => (
        <StatusDot key={size} {...args} size={size} />
      ))}
    </div>
  ),
}

export const OnAvatars: Story = {
  name: "On avatars",
  render: () => (
    <div className="flex items-center gap-8">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarImage src={bonzo} alt="Bonzo" />
          <AvatarFallback>BO</AvatarFallback>
          <StatusDot status="present" />
        </Avatar>
      ))}
      <StickerAvatar name="Bonzo" src={bonzo} size={56}>
        <StatusDot status="away" />
      </StickerAvatar>
    </div>
  ),
}

export const InABadge: Story = {
  name: "In a badge",
  render: () => (
    <div className="flex items-center gap-3">
      {/* The badge's text already says the status, so the dot stays quiet. */}
      <Badge variant="outline">
        <StatusDot status="present" label={null} />
        Online
      </Badge>
      <Badge variant="outline">
        <StatusDot status="away" label={null} />
        Away
      </Badge>
      <Badge variant="outline">
        <StatusDot status="offline" label={null} />
        Offline
      </Badge>
    </div>
  ),
}
