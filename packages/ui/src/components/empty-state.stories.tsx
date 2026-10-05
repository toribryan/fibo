import type { Meta, StoryObj } from "@storybook/react-vite"
import { InboxIcon, SearchXIcon, UsersIcon } from "lucide-react"
import { expect, fn } from "storybook/test"

import { Button } from "./button.js"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateMedia,
  EmptyStateTitle,
} from "./empty-state.js"

type PlaygroundArgs = React.ComponentProps<typeof EmptyState> & {
  onAction: () => void
}

const meta: Meta<PlaygroundArgs> = {
  title: "Base components/Feedback/Empty state",
  component: EmptyState,
  tags: ["new"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default"] },
    onAction: { control: false },
  },
  args: { size: "default", onAction: fn() },
  parameters: { controls: { exclude: ["onAction"] } },
  render: ({ onAction, ...args }) => (
    <div className="w-96 rounded-lg border border-border">
      <EmptyState {...args}>
        <EmptyStateMedia>
          <UsersIcon />
        </EmptyStateMedia>
        <EmptyStateTitle>No members yet</EmptyStateTitle>
        <EmptyStateDescription>
          Invite people to work on this project with you.
        </EmptyStateDescription>
        <EmptyStateActions>
          <Button size="sm" onClick={onAction}>
            Invite members
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  ),
}

export default meta
type Story = StoryObj<PlaygroundArgs>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Invite members" })
    )
    await expect(args.onAction).toHaveBeenCalledOnce()
    await userEvent.keyboard("{Enter}")
    await expect(args.onAction).toHaveBeenCalledTimes(2)
  },
}

export const Small: Story = {
  name: "Small, in a menu",
  render: () => (
    <div className="w-64 rounded-xl border border-border bg-popover shadow-lg">
      <EmptyState size="sm">
        <EmptyStateTitle>No matching filters</EmptyStateTitle>
      </EmptyState>
    </div>
  ),
}

export const NoMatches: Story = {
  name: "No matches",
  render: () => (
    <div className="w-96 rounded-lg border border-border">
      <EmptyState>
        <EmptyStateMedia>
          <SearchXIcon />
        </EmptyStateMedia>
        <EmptyStateTitle>No matching members</EmptyStateTitle>
        <EmptyStateDescription>
          Try another search, or clear the filters.
        </EmptyStateDescription>
        <EmptyStateActions>
          <Button variant="outline" size="sm">
            Clear filters
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  ),
}

export const TitleOnly: Story = {
  name: "Title only",
  render: () => (
    <div className="w-96 rounded-lg border border-border">
      <EmptyState>
        <EmptyStateMedia>
          <InboxIcon />
        </EmptyStateMedia>
        <EmptyStateTitle>{"You're all caught up"}</EmptyStateTitle>
      </EmptyState>
    </div>
  ),
}
