import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowUpIcon, CommandIcon } from "lucide-react"

import { Kbd, KbdGroup } from "./kbd.js"

const meta: Meta<typeof Kbd> = {
  title: "Components/Kbd",
  component: Kbd,
  subcomponents: { KbdGroup },
  tags: ["new"],
  argTypes: { children: { control: "text" } },
  args: { children: "Esc" },
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {}

export const Shortcut: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>
        <CommandIcon aria-hidden="true" />
        <span className="sr-only">Command</span>
      </Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
}

export const InText: Story = {
  name: "In text",
  render: () => (
    <p className="text-sm text-muted-foreground">
      Press{" "}
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>B</Kbd>
      </KbdGroup>{" "}
      to toggle the sidebar, or <Kbd>/</Kbd> to search.
    </p>
  ),
}

export const Keys: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Kbd>Tab</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Space</Kbd>
      <Kbd>
        <ArrowUpIcon aria-hidden="true" />
        <span className="sr-only">Up arrow</span>
      </Kbd>
      <Kbd>F6</Kbd>
    </div>
  ),
}
