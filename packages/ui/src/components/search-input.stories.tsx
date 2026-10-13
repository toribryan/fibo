import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileTextIcon, SettingsIcon, UserIcon } from "lucide-react"
import * as React from "react"
import { expect, fn, waitFor } from "storybook/test"

import { CommandMenu, type CommandMenuGroup } from "./command-menu.js"
import { SearchInput } from "./search-input.js"

const meta: Meta<typeof SearchInput> = {
  title: "Base components/Forms/Search input",
  component: SearchInput,
  tags: ["new"],
  argTypes: {
    type: { control: "inline-radio", options: ["field", "button"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    hotkey: { control: "text" },
    label: { control: "text" },
    placeholder: { control: "text" },
    onValueChange: { control: false },
    onClick: { control: false },
  },
  args: {
    type: "field",
    size: "default",
    hotkey: "k",
    label: "Search",
    placeholder: "Search…",
  },
  parameters: { controls: { exclude: ["onValueChange", "onClick"] } },
  render: (args) => (
    <div className="flex w-72 justify-center">
      <SearchInput {...args} />
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof SearchInput>

const onValueChange = fn()

export const Default: Story = {
  args: { onValueChange },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("searchbox", { name: "Search" })

    await userEvent.keyboard("{Control>}k{/Control}")
    await expect(input).toHaveFocus()

    await userEvent.keyboard("tabs")
    await expect(input).toHaveValue("tabs")
    await expect(onValueChange).toHaveBeenLastCalledWith("tabs")

    await userEvent.click(canvas.getByRole("button", { name: "Clear search" }))
    await expect(input).toHaveValue("")
    await expect(input).toHaveFocus()

    await userEvent.keyboard("menu{Escape}")
    await expect(input).toHaveValue("")
    await expect(input).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await expect(input).not.toHaveFocus()
  },
}

export const Button: Story = {
  name: "As a button",
  args: { type: "button", onClick: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Search" })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard("{Control>}k{/Control}")
    await expect(args.onClick).toHaveBeenCalledTimes(2)
  },
}

export const Small: Story = {
  args: { size: "sm" },
}

export const NoShortcut: Story = {
  name: "Without a shortcut",
  args: { hotkey: null },
}

const PEOPLE = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Katherine Johnson",
  "Margaret Hamilton",
]

function FilteredList() {
  const [query, setQuery] = React.useState("")
  const term = query.trim().toLowerCase()
  const matches = PEOPLE.filter((name) => name.toLowerCase().includes(term))
  return (
    <div className="flex w-72 flex-col gap-3">
      <SearchInput
        label="Filter people"
        placeholder="Filter people…"
        hotkey={null}
        value={query}
        onValueChange={setQuery}
      />
      <ul className="flex flex-col text-sm" aria-live="polite">
        {matches.length ? (
          matches.map((name) => (
            <li key={name} className="rounded-sm px-2 py-1.5">
              {name}
            </li>
          ))
        ) : (
          <li className="px-2 py-1.5 text-muted-foreground">No one matches</li>
        )}
      </ul>
    </div>
  )
}

export const FilterAList: Story = {
  name: "Filtering a list",
  render: () => <FilteredList />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("searchbox", { name: "Filter people" }),
      "grace"
    )
    await expect(canvas.getAllByRole("listitem")).toHaveLength(1)
  },
}

const GROUPS: CommandMenuGroup[] = [
  {
    label: "Pages",
    items: [
      { value: "docs", label: "Docs", icon: <FileTextIcon /> },
      { value: "account", label: "Account", icon: <UserIcon /> },
      { value: "settings", label: "Settings", icon: <SettingsIcon /> },
    ],
  },
]

export const InAHeader: Story = {
  name: "In a header, opening a command menu",
  render: () => (
    <header className="flex w-96 items-center justify-between rounded-lg border border-border bg-background px-4 py-2">
      <span className="text-sm font-medium">fibo</span>
      <CommandMenu
        groups={GROUPS}
        hotkey={null}
        label="Search the site"
        trigger={<SearchInput type="button" aria-haspopup="dialog" />}
      />
    </header>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Search" }))
    const doc = canvasElement.ownerDocument
    await waitFor(() =>
      expect(doc.querySelector("[role=dialog]")).toBeInTheDocument()
    )
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(doc.querySelector("[role=dialog]")).not.toBeInTheDocument()
    )
  },
}
