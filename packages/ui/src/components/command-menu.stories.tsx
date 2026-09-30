import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  CalendarIcon,
  FilePlusIcon,
  FolderIcon,
  InboxIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { useState, type ComponentProps } from "react"
import { expect, fn, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import { CommandMenu, type CommandMenuGroup } from "./command-menu.js"

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
    label: "Projects",
    items: [
      { value: "fibo", label: "fibo", icon: <FolderIcon /> },
      { value: "portfolio", label: "Portfolio", icon: <FolderIcon /> },
      {
        value: "archive",
        label: "Archive",
        icon: <FolderIcon />,
        disabled: true,
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
        value: "theme",
        label: "Toggle theme",
        icon: <MoonIcon />,
        keywords: ["dark", "light", "mode"],
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

const meta: Meta<typeof CommandMenu> = {
  title: "Base components/Command menu",
  component: CommandMenu,
  tags: ["new"],
  argTypes: {
    placeholder: { control: "text" },
    emptyText: { control: "text" },
    label: { control: "text" },
    hotkey: { control: "text" },
    hints: { control: "boolean" },
    groups: { control: false },
    trigger: { control: false },
    onSelect: { control: false },
    onOpenChange: { control: false },
  },
  args: {
    groups: GROUPS,
    placeholder: "Type a command or search…",
    emptyText: "No results found",
    label: "Command menu",
    hotkey: "k",
    hints: true,
    onSelect: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    controls: {
      exclude: ["groups", "trigger", "onSelect", "onOpenChange"],
    },
  },
}

export default meta
type Story = StoryObj<typeof CommandMenu>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // The dialog renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: /Search/ })

    // Pointer: open, search, click a result.
    await userEvent.click(trigger)
    const search = await page.findByRole("combobox", { name: "Command menu" })
    await waitFor(() => expect(search).toHaveFocus())
    await userEvent.keyboard("dark")
    await userEvent.click(
      await page.findByRole("option", { name: /Toggle theme/ })
    )
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "theme" })
    )
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())

    // Keyboard: the shortcut opens it on a fresh search, the first match is
    // highlighted, arrows move, and Enter runs.
    await userEvent.keyboard("{Control>}k{/Control}")
    const reopened = await page.findByRole("combobox", { name: "Command menu" })
    await waitFor(() => expect(reopened).toHaveValue(""))
    await userEvent.keyboard("pr")
    await waitFor(() =>
      expect(page.getByRole("option", { name: /Profile/ })).toHaveAttribute(
        "data-highlighted"
      )
    )
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: "preferences" })
    )
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())

    // Escape closes without running anything.
    await userEvent.keyboard("{Control>}k{/Control}")
    await page.findByRole("dialog")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await expect(args.onSelect).toHaveBeenCalledTimes(2)
  },
}

export const NoMatches: Story = {
  name: "No matches",
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /Search/ }))
    await page.findByRole("combobox", { name: "Command menu" })
    await userEvent.keyboard("zzz")
    await expect(await page.findByText("No results found")).toBeVisible()
  },
}

export const WithoutHints: Story = {
  name: "Without hints",
  args: { hints: false },
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
  const [last, setLast] = useState<string | null>(null)
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

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
}
