import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  CircleDashedIcon,
  CircleDotIcon,
  SignalHighIcon,
  TagIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { expect, fn, waitFor, within } from "storybook/test"

import {
  FilterMenu,
  type FilterField,
  type FilterValue,
} from "./filter-menu.js"

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: <CircleDashedIcon />,
    options: [
      { value: "backlog", label: "Backlog" },
      { value: "todo", label: "Todo" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: <UserIcon />,
    options: [
      { value: "ada", label: "Ada Lovelace" },
      { value: "grace", label: "Grace Hopper" },
      { value: "katherine", label: "Katherine Johnson" },
    ],
  },
  {
    id: "priority",
    label: "Priority",
    icon: <SignalHighIcon />,
    options: [
      { value: "urgent", label: "Urgent" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
  },
  {
    id: "label",
    label: "Label",
    icon: <TagIcon />,
    options: [
      { value: "bug", label: "Bug" },
      { value: "urgent-fix", label: "urgent-fix" },
      { value: "design", label: "Design" },
    ],
  },
]

// Views slide and fade for about 220ms. The accessibility check runs as
// soon as a play function ends, so each one waits for the last transition
// to finish rather than being checked against text halfway faded in.
const settle = () => new Promise((resolve) => setTimeout(resolve, 400))

const meta: Meta<typeof FilterMenu> = {
  title: "Niche/Filter menu",
  component: FilterMenu,
  tags: ["new"],
  argTypes: {
    triggerLabel: { control: "text" },
    placeholder: { control: "text" },
    emptyText: { control: "text" },
    label: { control: "text" },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    fields: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
  },
  args: {
    fields: FIELDS,
    triggerLabel: "Filter",
    placeholder: "Filter by…",
    emptyText: "No matching filters",
    align: "start",
    onValueChange: fn(),
  },
  parameters: {
    controls: {
      exclude: ["fields", "value", "defaultValue", "onValueChange"],
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-96">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FilterMenu>

export const Default: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // The menu renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }))
    const search = await page.findByRole("combobox", { name: "Search filters" })
    await waitFor(() => expect(search).toHaveFocus())

    // Pointer: open a field, tick a value.
    await userEvent.click(page.getByRole("option", { name: /^Status/ }))
    await userEvent.click(await page.findByRole("option", { name: "Todo" }))
    await expect(page.getByRole("option", { name: "Todo" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await expect(args.onValueChange).toHaveBeenLastCalledWith({
      status: ["todo"],
    })

    // Escape steps back to the fields before it closes anything.
    await userEvent.keyboard("{Escape}")
    await expect(
      await page.findByRole("option", { name: /^Priority/ })
    ).toBeVisible()

    // Keyboard: typing turns the menu into a search across every field.
    await userEvent.keyboard("urg")
    await expect(
      await page.findByRole("group", { name: "Priority" })
    ).toBeVisible()
    await expect(page.getByRole("group", { name: "Label" })).toBeVisible()
    await userEvent.keyboard("{Enter}")
    await expect(args.onValueChange).toHaveBeenLastCalledWith({
      status: ["todo"],
      priority: ["urgent"],
    })

    // Escape clears the search, then closes the menu.
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(search).toHaveValue(""))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("combobox")).toBeNull())
    await expect(canvas.getByRole("button", { name: "Filter" })).toHaveFocus()
  },
}

export const KeyboardOnly: Story = {
  name: "Keyboard only",
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    canvas.getByRole("button", { name: "Filter" }).focus()
    await userEvent.keyboard("{Enter}")
    const search = await page.findByRole("combobox")
    await waitFor(() => expect(search).toHaveFocus())

    // Down to Assignee, Right to open it, Down and Enter to pick Grace.
    await userEvent.keyboard("{ArrowDown}{ArrowRight}")
    await expect(search).toHaveAttribute("placeholder", "Assignee")
    await userEvent.keyboard("{ArrowDown}{Enter}")
    await expect(args.onValueChange).toHaveBeenLastCalledWith({
      assignee: ["grace"],
    })

    // Left goes back, landing on the field it came from.
    await userEvent.keyboard("{ArrowLeft}")
    const assignee = page.getByRole("option", { name: /^Assignee/ })
    await expect(search).toHaveAttribute("aria-activedescendant", assignee.id)
    await settle()
  },
}

export const NoMatches: Story = {
  name: "No matches",
  play: async ({ canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }))
    await page.findByRole("combobox")
    await userEvent.keyboard("zzz")
    await expect(await page.findByText("No matching filters")).toBeVisible()
    await settle()
  },
}

function WithChips() {
  const [value, setValue] = useState<FilterValue>({
    status: ["todo", "in-progress"],
    priority: ["urgent"],
  })
  const labelOf = (fieldId: string, optionValue: string) =>
    FIELDS.find((f) => f.id === fieldId)?.options.find(
      (o) => o.value === optionValue
    )?.label ?? optionValue

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterMenu fields={FIELDS} value={value} onValueChange={setValue} />
      {Object.entries(value).map(([fieldId, values]) => {
        const field = FIELDS.find((f) => f.id === fieldId)
        return (
          <span
            key={fieldId}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card pr-1 pl-3 text-sm"
          >
            <span className="text-muted-foreground">{field?.label}</span>
            {values.map((v) => labelOf(fieldId, v)).join(", ")}
            <button
              type="button"
              aria-label={`Remove ${field?.label} filter`}
              onClick={() => {
                const rest = { ...value }
                delete rest[fieldId]
                setValue(rest)
              }}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
            >
              <XIcon className="size-3.5" />
            </button>
          </span>
        )
      })}
    </div>
  )
}

export const AppliedAsChips: Story = {
  name: "Applied as chips",
  render: () => <WithChips />,
}

export const WithSelections: Story = {
  name: "With selections",
  args: {
    defaultValue: { status: ["todo", "done"], label: ["bug"] },
    triggerLabel: (
      <>
        Filter
        <CircleDotIcon aria-hidden="true" className="size-3 text-info" />
      </>
    ),
  },
}
