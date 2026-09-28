import type { Decorator, Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor } from "storybook/test"
import { useState } from "react"

import { Reactions, type Reaction } from "./reactions.js"

const seeded: Reaction[] = [
  { emoji: "👍", label: "Thumbs up", count: 5 },
  { emoji: "❤️", label: "Heart", count: 3, active: true },
  { emoji: "😂", label: "Laughing", count: 1 },
]

// The floating bar is fixed to the viewport. On a docs page a
// transformed wrapper becomes their containing block, so each bar pins to
// its own canvas instead of the whole page.
const containInDocs: Decorator = (Story, context) =>
  context.viewMode === "docs" ? (
    <div className="relative [transform:translateZ(0)]">
      <Story />
    </div>
  ) : (
    <Story />
  )

const pinned = {
  parameters: { layout: "fullscreen" },
  decorators: [containInDocs],
}

const meta: Meta<typeof Reactions> = {
  title: "Niche/Reactions",
  component: Reactions,
  tags: ["new"],
  parameters: {
    // Data and callbacks stay in the props table; the playground shows the
    // choices a person can actually toggle.
    controls: {
      exclude: [
        "reactions",
        "defaultReactions",
        "choices",
        "onReactionsChange",
        "onReact",
      ],
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["inline", "floating"],
    },
    position: {
      control: "select",
      options: ["bottom-right", "bottom-left", "top-right", "top-left"],
      description: "Viewport corner. Applies to the floating variant only.",
    },
    showCounts: { control: "boolean" },
    particles: { control: { type: "range", min: 0, max: 20, step: 1 } },
    triggerLabel: { control: "text", table: { category: "Labels" } },
    panelLabel: { control: "text", table: { category: "Labels" } },
    reactions: { control: false },
    defaultReactions: { control: false },
    choices: { control: false },
  },
  args: {
    variant: "inline",
    defaultReactions: seeded,
    showCounts: true,
    particles: 7,
  },
}

export default meta
type Story = StoryObj<typeof Reactions>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const thumbs = canvas.getByRole("button", { name: /^Thumbs up/ })
    await expect(thumbs).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(thumbs)
    await expect(thumbs).toHaveAttribute("aria-pressed", "true")
    await expect(thumbs).toHaveAccessibleName(/6 reactions/)
    await userEvent.click(thumbs)
    await expect(thumbs).toHaveAccessibleName(/5 reactions/)

    const trigger = canvas.getByRole("button", { name: "Add reaction" })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await waitFor(() =>
      expect(
        canvas.getByRole("group", { name: "Pick a reaction" })
      ).toBeVisible()
    )
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "false")
    )
    await expect(trigger).toHaveFocus()
  },
}

export const Empty: Story = {
  name: "No reactions yet",
  args: {
    defaultReactions: [],
  },
}

export const BusyPost: Story = {
  name: "Busy post",
  args: {
    defaultReactions: [
      { emoji: "👍", label: "Thumbs up", count: 12_847 },
      { emoji: "❤️", label: "Heart", count: 3_420, active: true },
      { emoji: "😂", label: "Laughing", count: 961 },
      { emoji: "🎉", label: "Celebrate", count: 1_205 },
    ],
  },
}

export const WithoutCounts: Story = {
  args: {
    showCounts: false,
  },
}

export const Floating: Story = {
  args: {
    variant: "floating",
  },
  ...pinned,
  render: (args) => (
    <div className="min-h-[28rem] p-8">
      <p className="max-w-prose text-base text-muted-foreground">
        The floating variant is fixed to a corner of the viewport and stays put
        as the page scrolls. It sits on the same translucent bar the site nav
        uses, clears the safe area on a notched phone, and counts every reaction
        on the item beside its trigger. Particles rise from the bar itself
        rather than from the emoji that was picked.
      </p>
      <Reactions {...args} />
    </div>
  ),
}

export const InMessage: Story = {
  name: "In a message",
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-content-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          TB
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-card-foreground">
            Tori Bryan
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            12:45 PM
          </span>
        </div>
      </div>
      <p className="mt-3 mb-3 text-sm text-card-foreground">
        Just shipped the reactions component. Picking one turns a click into a
        small celebration, which is the whole point.
      </p>
      <Reactions {...args} />
    </div>
  ),
}

export const Controlled: Story = {
  render: (args) => {
    const ControlledDemo = () => {
      const [reactions, setReactions] = useState<Reaction[]>(seeded)
      const total = reactions.reduce((sum, item) => sum + (item.count ?? 0), 0)

      return (
        <div className="flex flex-col gap-4">
          <Reactions
            {...args}
            reactions={reactions}
            onReactionsChange={setReactions}
          />
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            {total} {total === 1 ? "reaction" : "reactions"} across{" "}
            {reactions.length} {reactions.length === 1 ? "kind" : "kinds"}
          </p>
        </div>
      )
    }

    return <ControlledDemo />
  },
}
