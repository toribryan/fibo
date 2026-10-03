import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor } from "storybook/test"
import { useState, type ReactNode } from "react"
import {
  BookmarkIcon,
  CompassIcon,
  HouseIcon,
  RabbitIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react"

import { FloatingNav, type FloatingNavItem } from "./floating-nav.js"

const items: FloatingNavItem[] = [
  { value: "home", label: "Home", icon: <HouseIcon /> },
  { value: "explore", label: "Explore", icon: <CompassIcon /> },
  { value: "saved", label: "Saved", icon: <BookmarkIcon /> },
  { value: "profile", label: "Profile", icon: <UserIcon /> },
]

// A transform makes the frame the containing block for fixed children, so a
// `fixed` bar floats at the bottom of the phone instead of the page.
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[34rem] w-[min(22rem,calc(100vw-3rem))] transform-gpu overflow-hidden rounded-[2.5rem] border border-border bg-background">
      {children}
    </div>
  )
}

function Feed() {
  return (
    <div className="flex flex-col gap-4 p-5 pt-8">
      <span className="text-lg font-semibold">Today</span>
      {["Golden section", "Seed heads", "Pixel rabbits"].map((title) => (
        <div
          key={title}
          className="flex flex-col gap-2 rounded-2xl border border-border p-4"
        >
          <span className="h-24 rounded-xl bg-muted" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      ))}
    </div>
  )
}

const meta: Meta<typeof FloatingNav> = {
  title: "Special components/Floating nav",
  component: FloatingNav,
  parameters: {
    layout: "centered",
    controls: { exclude: ["items", "value", "onValueChange"] },
  },
  argTypes: {
    labels: { control: "inline-radio", options: ["active", "always"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    position: { control: "inline-radio", options: ["fixed", "static"] },
    hideOnScroll: { control: "boolean" },
    defaultValue: {
      control: "select",
      options: items.map((item) => item.value),
    },
    items: { control: false },
    value: { control: false },
    onValueChange: { control: false },
  },
  args: {
    items,
    labels: "active",
    size: "default",
    position: "fixed",
    hideOnScroll: false,
    defaultValue: "home",
    onValueChange: fn(),
  },
  // Uncontrolled state reads defaultValue once, so the control remounts it.
  render: (args) => <FloatingNav key={args.defaultValue} {...args} />,
  decorators: [
    (Story, { parameters }) => {
      if (parameters.frame === "none") return <Story />
      return (
        <Phone>
          {parameters.frame === "empty" ? null : <Feed />}
          <Story />
        </Phone>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof FloatingNav>

export const Default: Story = {
  play: async ({ canvas, args, step }) => {
    await step("Pointer", async () => {
      const explore = canvas.getByRole("button", { name: "Explore" })
      await userEvent.click(explore)
      await expect(explore).toHaveAttribute("aria-current", "page")
      await expect(args.onValueChange).toHaveBeenCalledWith(
        "explore",
        expect.anything()
      )
      await expect(
        canvas.getByRole("button", { name: "Home" })
      ).not.toHaveAttribute("aria-current")
    })

    await step("Keyboard", async () => {
      canvas.getByRole("button", { name: "Explore" }).focus()
      await userEvent.tab()
      const saved = canvas.getByRole("button", { name: "Saved" })
      await expect(saved).toHaveFocus()
      await userEvent.keyboard("{Enter}")
      await waitFor(() => expect(saved).toHaveAttribute("aria-current", "page"))
    })
  },
}

export const AlwaysLabelled: Story = {
  name: "Labels always shown",
  args: { labels: "always" },
}

export const Compact: Story = {
  args: { size: "sm" },
}

export const TextItems: Story = {
  name: "Text items",
  args: {
    size: "sm",
    items: items.slice(0, 3).map(({ value, label }) => ({ value, label })),
  },
}

export const Static: Story = {
  args: { position: "static" },
  parameters: { frame: "none" },
}

function ControlledNav() {
  const [value, setValue] = useState("search")
  const nav: FloatingNavItem[] = [
    { value: "home", label: "Home", icon: <HouseIcon />, href: "#home" },
    { value: "search", label: "Search", icon: <SearchIcon />, href: "#search" },
    { value: "about", label: "About", icon: <RabbitIcon />, href: "#about" },
  ]
  return (
    <>
      <div className="flex flex-col gap-2 p-5 pt-8">
        <span className="text-lg font-semibold">
          {nav.find((item) => item.value === value)?.label}
        </span>
        <span className="text-sm text-muted-foreground">
          Links route through the app&apos;s own router, so the page never
          reloads.
        </span>
      </div>
      <FloatingNav
        aria-label="Sections"
        items={nav}
        value={value}
        onValueChange={(next, event) => {
          event.preventDefault()
          setValue(next)
        }}
      />
    </>
  )
}

export const ControlledLinks: Story = {
  name: "Controlled links",
  parameters: { frame: "empty" },
  render: () => <ControlledNav />,
}
