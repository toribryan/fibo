import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileTextIcon, SettingsIcon, UserIcon } from "lucide-react"
import * as React from "react"
import { expect, fn, waitFor } from "storybook/test"

import { CommandMenu, type CommandMenuGroup } from "./command-menu.js"
import { Field, FieldDescription, FieldLabel } from "./field.js"
import { SearchInput, SearchTrigger } from "./search-input.js"

const meta: Meta<typeof SearchInput> = {
  title: "Base components/Forms/Search input",
  component: SearchInput,
  tags: ["new"],
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    hotkey: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    onValueChange: { control: false },
  },
  args: {
    variant: "default",
    size: "default",
    hotkey: "k",
    placeholder: "Search…",
    disabled: false,
    onValueChange: fn(),
  },
  parameters: { controls: { exclude: ["onValueChange"] } },
  render: (args) => (
    <div className="w-72">
      <SearchInput {...args} />
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof SearchInput>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("searchbox", { name: "Search" })

    await userEvent.keyboard("{Control>}k{/Control}")
    await expect(input).toHaveFocus()

    await userEvent.keyboard("tabs")
    await expect(input).toHaveValue("tabs")
    await expect(args.onValueChange).toHaveBeenLastCalledWith("tabs")

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

export const Small: Story = {
  args: { size: "sm" },
}

export const NoShortcut: Story = {
  name: "Without a shortcut",
  args: { hotkey: null },
}

export const Ghost: Story = {
  name: "Ghost, in a menu",
  render: (args) => (
    <div className="w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
      <SearchInput
        {...args}
        variant="ghost"
        hotkey={null}
        aria-label="Search commands"
        placeholder="Search commands…"
        className="h-11 border-b border-border"
      />
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Recent commands show here.
      </p>
    </div>
  ),
}

export const InAField: Story = {
  name: "In a field",
  render: () => (
    <Field className="w-72" invalid>
      <FieldLabel>Find a teammate</FieldLabel>
      <SearchInput hotkey={null} defaultValue="zz" />
      <FieldDescription>No one by that name.</FieldDescription>
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("searchbox", { name: "Find a teammate" })
    await expect(input).toHaveAccessibleDescription(/No one by that name/)
    await expect(input).toHaveAttribute("aria-invalid", "true")
  },
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
        aria-label="Filter people"
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

const onTriggerClick = fn()

export const Trigger: Story = {
  name: "Search trigger",
  render: () => <SearchTrigger onClick={onTriggerClick} />,
  play: async ({ canvas, userEvent }) => {
    onTriggerClick.mockClear()
    await userEvent.click(canvas.getByRole("button", { name: "Search" }))
    await expect(onTriggerClick).toHaveBeenCalledTimes(1)
    await userEvent.keyboard("{Control>}k{/Control}")
    await expect(onTriggerClick).toHaveBeenCalledTimes(2)
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
        trigger={<SearchTrigger aria-haspopup="dialog" />}
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
