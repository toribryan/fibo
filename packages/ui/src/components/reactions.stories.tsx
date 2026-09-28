import type { Decorator, Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Reactions, ReactionsMenuItem, type Reaction } from "./reactions.js"

const palette: Reaction[] = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Laughing" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "😮", label: "Surprised" },
]

const seeded: Reaction[] = [
  { emoji: "👍", label: "Thumbs up", count: 5 },
  { emoji: "❤️", label: "Heart", count: 3, active: true },
  { emoji: "😂", label: "Laughing", count: 1 },
]

// Floating and menu bars are fixed to the viewport. On a docs page a
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
  title: "Components/Reactions",
  component: Reactions,
  tags: ["new"],
  parameters: {
    docs: {
      description: {
        component:
          "A reaction control in three shapes. Inline sits with the content it belongs to and shows a pill per reaction; floating pins a translucent bar to a corner of the viewport with the running total beside its trigger; menu starts as a single button and rolls an emoji rail out along the x axis with a menu above it. All three share the choices, the pill motion and the particle burst.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["inline", "floating", "menu"],
    },
    position: {
      control: "select",
      options: ["bottom-right", "bottom-left", "top-right", "top-left"],
      description: "Viewport corner. Applies to the floating variant only.",
    },
    showCounts: { control: "boolean" },
    particles: { control: { type: "range", min: 0, max: 20, step: 1 } },
  },
  args: {
    variant: "inline",
    defaultReactions: seeded,
    choices: palette,
    showCounts: true,
    particles: 7,
  },
}

export default meta
type Story = StoryObj<typeof Reactions>

export const Default: Story = {}

export const Empty: Story = {
  name: "No reactions yet",
  args: {
    defaultReactions: [],
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

export const Menu: Story = {
  args: {
    variant: "menu",
    menu: (
      <>
        <ReactionsMenuItem active>Home</ReactionsMenuItem>
        <ReactionsMenuItem>Work</ReactionsMenuItem>
        <ReactionsMenuItem>Writing</ReactionsMenuItem>
        <ReactionsMenuItem render={<a href="#about" />}>
          About
        </ReactionsMenuItem>
      </>
    ),
  },
  ...pinned,
  render: (args) => (
    <div className="min-h-[28rem] p-8">
      <p className="max-w-prose text-base text-muted-foreground">
        The menu variant starts as a single menu button. Opening it rolls the
        emoji rail out along the x axis, away from the edge the bar is pinned
        to, leaves the close control on the end nearest that edge, and puts the
        menu above the trigger. Items come from the `menu` prop, so they can be
        navigation, actions, or anything else. Picking an emoji does not close
        the rail.
      </p>
      <Reactions {...args} />
    </div>
  ),
}

export const MenuOnTheLeft: Story = {
  name: "Menu, left edge",
  args: {
    variant: "menu",
    position: "bottom-left",
    menu: (
      <>
        <ReactionsMenuItem active>Home</ReactionsMenuItem>
        <ReactionsMenuItem>Work</ReactionsMenuItem>
        <ReactionsMenuItem>Writing</ReactionsMenuItem>
      </>
    ),
  },
  ...pinned,
  render: (args) => (
    <div className="min-h-[28rem] p-8">
      <p className="max-w-prose text-base text-muted-foreground">
        Pinned to the left edge the rail runs the other way, so it still opens
        into the page rather than off it. The close control and the menu stay
        with the trigger.
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
            {total} reactions across {reactions.length} kinds
          </p>
        </div>
      )
    }

    return <ControlledDemo />
  },
}
