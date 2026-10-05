import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "./avatar.js"
import { Badge } from "./badge.js"
import { Count } from "./count.js"

const meta: Meta<typeof Count> = {
  title: "Base components/Display/Count",
  component: Count,
  argTypes: {
    value: { control: { type: "number", min: 0, step: 1 } },
    max: { control: { type: "number", min: 1, step: 1 } },
    notation: { control: "inline-radio", options: ["standard", "compact"] },
    plus: { control: "boolean" },
    locale: { control: "text" },
    label: { control: false },
  },
  args: {
    value: 128,
    max: 99,
    notation: "standard",
    plus: false,
    locale: "en-US",
  },
  render: (args) => <Count {...args} className="text-sm font-medium" />,
}

export default meta
type Story = StoryObj<typeof Count>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("99+")).toHaveAttribute("aria-hidden", "true")
    await expect(canvas.getByText("128")).toBeInTheDocument()
  },
}

export const Formats: Story = {
  render: () => (
    <dl className="grid grid-cols-[auto_auto] items-center gap-x-8 gap-y-3 text-sm">
      <dt className="text-muted-foreground">Plain</dt>
      <dd>
        <Count value={42} />
      </dd>
      <dt className="text-muted-foreground">Capped at 99</dt>
      <dd>
        <Count value={128} max={99} />
      </dd>
      <dt className="text-muted-foreground">Compact</dt>
      <dd>
        <Count value={12_345} notation="compact" locale="en-US" />
      </dd>
      <dt className="text-muted-foreground">Not shown</dt>
      <dd>
        <Count value={4} plus label={(n) => `${n} more`} />
      </dd>
    </dl>
  ),
}

export const InContext: Story = {
  name: "In other parts",
  render: () => (
    <div className="flex items-center gap-6">
      <Badge variant="secondary">
        <Count value={128} max={99} label={(n) => `${n} unread`} />
      </Badge>
      <AvatarGroup>
        {["AL", "GH", "KJ"].map((initials) => (
          <Avatar key={initials}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount>
          <Count value={9} plus label={(n) => `${n} more`} />
        </AvatarGroupCount>
      </AvatarGroup>
    </div>
  ),
}
