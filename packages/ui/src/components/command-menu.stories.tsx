import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  BugIcon,
  CalendarIcon,
  ChartColumnIcon,
  CirclePlayIcon,
  FileTextIcon,
  FilePlusIcon,
  GlobeIcon,
  InboxIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react"
import { useState, type ComponentProps, type ReactNode } from "react"
import { expect, fn, waitFor, within } from "storybook/test"

import { Avatar, AvatarFallback } from "./avatar.js"
import { Button } from "./button.js"
import { CommandMenu, type CommandMenuGroup } from "./command-menu.js"

function FilePreview({
  title,
  edited,
  body,
}: {
  title: string
  edited: string
  body: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-border bg-muted">
        <FileTextIcon
          aria-hidden="true"
          className="size-8 text-muted-foreground"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">Edited {edited}</span>
      </div>
      <p className="text-muted-foreground">{body}</p>
    </div>
  )
}

function PersonPreview({
  name,
  initials,
  role,
}: {
  name: string
  initials: string
  role: string
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Avatar className="size-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  )
}

const person = (
  value: string,
  name: string,
  initials: string,
  role: string
) => ({
  value,
  label: name,
  icon: <UserIcon />,
  preview: <PersonPreview name={name} initials={initials} role={role} />,
})

const GROUPS: CommandMenuGroup[] = [
  {
    label: "Suggestions",
    items: [
      {
        value: "new-file",
        label: "New file",
        icon: <FilePlusIcon />,
        shortcut: ["⌘", "N"],
        keywords: ["create", "document"],
      },
      { value: "inbox", label: "Go to inbox", icon: <InboxIcon /> },
      { value: "calendar", label: "Open calendar", icon: <CalendarIcon /> },
    ],
  },
  {
    label: "Actions",
    items: [
      {
        value: "theme",
        label: "Change theme",
        icon: <PaletteIcon />,
        keywords: ["appearance", "mode"],
        placeholder: "Pick a theme…",
        items: [
          { value: "theme-light", label: "Light", icon: <SunIcon /> },
          { value: "theme-dark", label: "Dark", icon: <MoonIcon /> },
          { value: "theme-system", label: "System", icon: <LaptopIcon /> },
        ],
      },
      {
        value: "assign",
        label: "Assign to",
        icon: <UserPlusIcon />,
        placeholder: "Search people…",
        items: [
          person("ada", "Ada Lovelace", "AL", "Engineering"),
          person("grace", "Grace Hopper", "GH", "Platform"),
          person("katherine", "Katherine Johnson", "KJ", "Research"),
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        value: "profile",
        label: "Profile",
        icon: <UserIcon />,
        shortcut: ["⌘", "P"],
      },
      {
        value: "preferences",
        label: "Preferences",
        icon: <SettingsIcon />,
        shortcut: ["⌘", ","],
      },
      { value: "sign-out", label: "Sign out", icon: <LogOutIcon /> },
    ],
  },
]

const FILES: CommandMenuGroup[] = [
  {
    label: "Files",
    items: [
      {
        value: "roadmap",
        label: "Roadmap 2027",
        icon: <FileTextIcon />,
        preview: (
          <FilePreview
            title="Roadmap 2027"
            edited="2 hours ago"
            body="Themes for next year: a faster editor, shared libraries and offline mode."
          />
        ),
      },
      {
        value: "research",
        label: "Research notes",
        icon: <FileTextIcon />,
        preview: (
          <FilePreview
            title="Research notes"
            edited="yesterday"
            body="Twelve interviews on how teams hand designs to engineering."
          />
        ),
      },
      {
        value: "launch",
        label: "Launch checklist",
        icon: <FileTextIcon />,
        preview: (
          <FilePreview
            title="Launch checklist"
            edited="last week"
            body="Docs, changelog, social posts and the support macro."
          />
        ),
      },
    ],
  },
  {
    label: "People",
    items: [
      person("ada", "Ada Lovelace", "AL", "Engineering"),
      person("grace", "Grace Hopper", "GH", "Platform"),
    ],
  },
  {
    label: "Actions",
    items: [{ value: "new-file", label: "New file", icon: <FilePlusIcon /> }],
  },
]

const meta: Meta<typeof CommandMenu> = {
  title: "Special components/Command menu",
  component: CommandMenu,
  argTypes: {
    placeholder: { control: "text" },
    emptyText: { control: "text" },
    label: { control: "text" },
    hotkey: { control: "text" },
    hints: { control: "boolean" },
    modal: { control: "boolean" },
    variant: { control: "inline-radio", options: ["default", "inset"] },
    maxRecent: { control: { type: "range", min: 0, max: 10, step: 1 } },
    groups: { control: false },
    trigger: { control: false },
    recent: { control: false },
    defaultRecent: { control: false },
    labels: { control: false },
    onSelect: { control: false },
    onOpenChange: { control: false },
    onRecentChange: { control: false },
  },
  args: {
    groups: GROUPS,
    placeholder: "Type a command or search…",
    emptyText: "No results found",
    label: "Command menu",
    hotkey: "k",
    hints: true,
    modal: true,
    variant: "default",
    maxRecent: 5,
    onSelect: fn(),
    onOpenChange: fn(),
    onRecentChange: fn(),
  },
  parameters: {
    controls: {
      exclude: [
        "groups",
        "trigger",
        "recent",
        "defaultRecent",
        "labels",
        "onSelect",
        "onOpenChange",
        "onRecentChange",
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof CommandMenu>

// The dialog fades in and pages slide in for about 200ms; checks wait it out.
const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // The dialog renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: /Search/ })

    // Pointer: a page opens in place, and picking from it runs the command.
    await userEvent.click(trigger)
    const search = await page.findByRole("combobox", { name: "Command menu" })
    await waitFor(() => expect(search).toHaveFocus())
    await userEvent.click(page.getByRole("option", { name: /Change theme/ }))
    await expect(
      await page.findByRole("combobox", { name: "Command menu, Change theme" })
    ).toHaveFocus()
    await settle()
    await userEvent.click(page.getByRole("option", { name: "Dark" }))
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "theme-dark" })
    )
    await expect(args.onRecentChange).toHaveBeenLastCalledWith(["theme-dark"])
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())

    // The shortcut reopens it on the first page, with the command just run
    // at the top under Recent, labeled with the page it lives on.
    await userEvent.keyboard("{Control>}k{/Control}")
    const recent = await page.findByRole("group", { name: "Recent" })
    await expect(within(recent).getByRole("option")).toHaveTextContent(
      "DarkChange theme"
    )

    // A search ranks matches across every page: "pr" starts Profile and
    // Preferences, so they come before labels that only contain it.
    await userEvent.keyboard("pr")
    const results = await page.findByRole("group", { name: "Results" })
    const found = within(results).getAllByRole("option")
    await expect(found[0]).toHaveTextContent(/^Profile/)
    await expect(found[0]).toHaveAttribute("data-highlighted")
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "preferences" })
    )
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())

    // Keyboard into a page, then Escape steps back one level at a time.
    await userEvent.keyboard("{Control>}k{/Control}")
    await page.findByRole("dialog")
    await userEvent.keyboard("assign{Enter}")
    const people = await page.findByRole("combobox", {
      name: "Command menu, Assign to",
    })
    await waitFor(() => expect(people).toHaveValue(""))
    await userEvent.keyboard("gr")
    await waitFor(() => expect(people).toHaveValue("gr"))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(people).toHaveValue(""))
    await userEvent.keyboard("{Escape}")
    await expect(
      await page.findByRole("combobox", { name: "Command menu" })
    ).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await expect(args.onSelect).toHaveBeenCalledTimes(2)
  },
}

export const WithPreview: Story = {
  name: "With preview",
  args: { groups: FILES, placeholder: "Search files, people and actions…" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /Search/ }))
    await page.findByRole("combobox", { name: "Command menu" })
    const pane = canvasElement.ownerDocument.querySelector(
      '[data-slot="command-menu-preview"]'
    )
    await waitFor(() => expect(pane).toHaveTextContent("Edited 2 hours ago"))
    await userEvent.keyboard("{ArrowDown}")
    await waitFor(() => expect(pane).toHaveTextContent("Edited yesterday"))
    await userEvent.keyboard("grace")
    await waitFor(() => expect(pane).toHaveTextContent("Platform"))
    await settle()
  },
}

export const Inset: Story = {
  args: { variant: "inset" },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /Search/ }))
    await page.findByRole("combobox", { name: "Command menu" })
    const popup = canvasElement.ownerDocument.querySelector(
      '[data-slot="command-menu"]'
    )
    await expect(popup).toHaveAttribute("data-variant", "inset")
    await settle()
  },
}

export const WithRecents: Story = {
  name: "With recents",
  args: { defaultRecent: ["theme-dark", "calendar", "profile"] },
}

export const NoMatches: Story = {
  name: "No matches",
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /Search/ }))
    await page.findByRole("combobox", { name: "Command menu" })
    await userEvent.keyboard("zzz")
    await expect(await page.findByText("No results found")).toBeVisible()
    // The accessibility check runs as the play ends; let the dialog finish
    // fading in first.
    await settle()
  },
}

export const CustomTrigger: Story = {
  name: "Custom trigger",
  render: (args) => (
    <CommandMenu
      {...args}
      trigger={
        <Button variant="ghost" size="sm">
          Commands
        </Button>
      }
    />
  ),
}

function ControlledExample(args: ComponentProps<typeof CommandMenu>) {
  const [open, setOpen] = useState(false)
  const [last, setLast] = useState<ReactNode>(null)
  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <p className="text-muted-foreground">
        Press Cmd+K or Ctrl+K, or use the button.
      </p>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open commands
      </Button>
      <p>
        Last command: <span className="font-medium">{last ?? "none"}</span>
      </p>
      <CommandMenu
        {...args}
        trigger={null}
        open={open}
        onOpenChange={setOpen}
        onSelect={(item) => setLast(item.label)}
      />
    </div>
  )
}

export const NonModal: Story = {
  name: "Non-modal",
  args: { modal: false },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: /Search/ })
    await userEvent.click(trigger)
    const search = await page.findByRole("combobox", { name: "Command menu" })
    await settle()
    // Focus stays where it was until someone moves it in.
    await expect(trigger).toHaveFocus()
    await userEvent.click(search)
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
  },
}

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
}

/*
 * An icon keeps a color you give it, so destinations read apart at a
 * glance. Icons without one stay muted. The chart tokens are grays in fibo's
 * own theme and saturated in Mechanical.
 */
export const ColoredIcons: Story = {
  name: "Colored icons",
  args: {
    variant: "inset",
    placeholder: "Go to…",
    groups: [
      {
        label: "Products",
        items: [
          {
            value: "product-analytics",
            label: "Product analytics",
            icon: <ChartColumnIcon className="text-chart-1" />,
          },
          {
            value: "web-analytics",
            label: "Web analytics",
            icon: <GlobeIcon className="text-chart-2" />,
          },
          {
            value: "assistant",
            label: "Assistant",
            icon: <SparklesIcon className="text-chart-3" />,
          },
          {
            value: "session-replay",
            label: "Session replay",
            icon: <CirclePlayIcon className="text-chart-4" />,
          },
          {
            value: "error-tracking",
            label: "Error tracking",
            icon: <BugIcon className="text-chart-5" />,
          },
        ],
      },
      {
        label: "Account",
        items: [
          { value: "settings", label: "Settings", icon: <SettingsIcon /> },
        ],
      },
    ],
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /Search/ }))
    await page.findByRole("combobox", { name: "Command menu" })
    const color = (name: string) =>
      getComputedStyle(page.getByRole("option", { name }).querySelector("svg")!)
        .color
    await expect(color("Product analytics")).not.toBe(color("Settings"))
    await expect(color("Product analytics")).not.toBe(color("Web analytics"))
    await settle()
  },
}
