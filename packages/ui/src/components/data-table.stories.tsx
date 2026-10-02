import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  EllipsisIcon,
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { expect, fn, waitFor } from "storybook/test"

import { Badge } from "./badge.js"
import { Button } from "./button.js"
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContent,
  DataTableFooter,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableSelectionCount,
  type DataTableSelection,
} from "./data-table.js"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "./menu.js"
import { Pagination } from "./pagination.js"

const STATUS = {
  "On shift": "success",
  "On break": "warning",
  "Time off": "info",
  Offline: "secondary",
} as const

type Agent = {
  id: string
  name: string
  initials: string
  email: string
  team: string
  channels: string
  status: keyof typeof STATUS
  adherence: number
  shift: string
  lock?: string
}

const AGENTS: Agent[] = [
  {
    id: "maya",
    name: "Maya Okafor",
    initials: "MO",
    email: "maya@example.com",
    team: "Tier 1 Support",
    channels: "Chat, Email",
    status: "On shift",
    adherence: 97,
    shift: "8:00 to 16:30",
  },
  {
    id: "priya",
    name: "Priya Raman",
    initials: "PR",
    email: "priya@example.com",
    team: "Billing",
    channels: "Email",
    status: "On break",
    adherence: 91,
    shift: "9:00 to 17:30",
  },
  {
    id: "jordan",
    name: "Jordan Alvarez",
    initials: "JA",
    email: "jordan@example.com",
    team: "Tier 2 Escalations",
    channels: "Phone, Chat",
    status: "On shift",
    adherence: 88,
    shift: "7:00 to 15:30",
  },
  {
    id: "sam",
    name: "Sam Whitfield",
    initials: "SW",
    email: "sam@example.com",
    team: "Chat",
    channels: "Chat",
    status: "Time off",
    adherence: 94,
    shift: "None",
  },
  {
    id: "elena",
    name: "Elena Marsh",
    initials: "EM",
    email: "elena@example.com",
    team: "Workforce Ops",
    channels: "Chat, Email",
    status: "On shift",
    adherence: 99,
    shift: "8:00 to 16:30",
    lock: "Workforce admins can't be removed",
  },
  {
    id: "rosa",
    name: "Rosa Delgado",
    initials: "RD",
    email: "rosa@example.com",
    team: "Phone",
    channels: "Phone",
    status: "Offline",
    adherence: 90,
    shift: "14:00 to 22:30",
  },
]

function RowActions({ name }: { name: string }) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${name}`}
          />
        }
      >
        <EllipsisIcon />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem>
          <PencilIcon />
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <Trash2Icon />
          Remove
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

function AgentsTable({
  agents = AGENTS,
  secondary = false,
  footer,
  ...props
}: Partial<React.ComponentProps<typeof DataTable>> & {
  agents?: Agent[]
  secondary?: boolean
  footer?: React.ReactNode
}) {
  return (
    <DataTable
      aria-label="Agents"
      rowIds={agents.map((agent) => agent.id)}
      noun={{ one: "agent", other: "agents" }}
      {...props}
    >
      <DataTableContent>
        <DataTableHeader>
          <DataTableHead type="person" pinned="start" className="w-56">
            Agent
          </DataTableHead>
          <DataTableHead className="w-44">Team</DataTableHead>
          <DataTableHead className="w-32">Channels</DataTableHead>
          <DataTableHead type="status">Status</DataTableHead>
          <DataTableHead type="numeric">Adherence</DataTableHead>
          <DataTableHead className="w-32">Shift</DataTableHead>
          <DataTableHead type="actions" pinned="end">
            <span className="sr-only">Actions</span>
          </DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {agents.map((agent) => (
            <DataTableRow
              key={agent.id}
              id={agent.id}
              lockedReason={agent.lock}
            >
              <DataTableCell
                type="person"
                pinned="start"
                avatar={{ fallback: agent.initials }}
                secondary={secondary ? agent.email : undefined}
              >
                {agent.name}
              </DataTableCell>
              <DataTableCell>{agent.team}</DataTableCell>
              <DataTableCell>{agent.channels}</DataTableCell>
              <DataTableCell type="status">
                <Badge variant={STATUS[agent.status]}>{agent.status}</Badge>
              </DataTableCell>
              <DataTableCell type="numeric">{agent.adherence}%</DataTableCell>
              <DataTableCell>{agent.shift}</DataTableCell>
              <DataTableCell type="actions" pinned="end">
                <RowActions name={agent.name} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableContent>
      {footer}
    </DataTable>
  )
}

const meta: Meta<typeof DataTable> = {
  title: "Base components/Data table",
  component: DataTable,
  subcomponents: {
    DataTableContent,
    DataTableHeader,
    DataTableHead,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableFooter,
    DataTableSelectionCount,
  },
  tags: ["new"],
  argTypes: {
    rowIds: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    noun: { control: false },
    children: { control: false },
    totalCount: { control: { type: "number", min: 0 } },
  },
  parameters: {
    controls: {
      exclude: [
        "rowIds",
        "value",
        "defaultValue",
        "onValueChange",
        "noun",
        "children",
      ],
    },
  },
  args: { onValueChange: fn() },
  render: (args) => <AgentsTable {...args} />,
}

export default meta
type Story = StoryObj<typeof DataTable>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const all = canvas.getByRole("checkbox", {
      name: "Select all agents on this page",
    })
    const priya = canvas.getByRole("checkbox", { name: "Select Priya Raman" })

    await userEvent.click(priya)
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      new Set(["priya"])
    )
    await expect(all).toHaveAttribute("aria-checked", "mixed")
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "1 agent selected"
    )

    // Select all skips Elena, whose row is locked.
    await userEvent.click(all)
    await expect(all).toHaveAttribute("aria-checked", "true")
    await expect(
      canvas.getByRole("checkbox", { name: "Select Elena Marsh" })
    ).not.toBeChecked()

    // By keyboard: Space on a focused row checkbox, then Escape clears.
    priya.focus()
    await userEvent.keyboard(" ")
    await expect(priya).not.toBeChecked()
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent("Selection cleared")
    )
    await expect(all).toHaveAttribute("aria-checked", "false")
  },
}

export const Locked: Story = {
  name: "Locked row",
  render: (args) => <AgentsTable {...args} agents={AGENTS.slice(3, 6)} />,
}

export const SecondaryText: Story = {
  name: "Secondary text",
  render: (args) => (
    <AgentsTable {...args} secondary defaultValue={new Set(["priya"])} />
  ),
}

export const Pinned: Story = {
  name: "Pinned columns",
  render: (args) => (
    <div className="max-w-2xl">
      <AgentsTable {...args} />
    </div>
  ),
}

export const WithPagination: Story = {
  name: "With pagination",
  render: function Render(args) {
    const [page, setPage] = React.useState(1)
    return (
      <AgentsTable
        {...args}
        totalCount={248}
        footer={
          <DataTableFooter className="justify-end">
            <Pagination
              page={page}
              onPageChange={setPage}
              pageCount={42}
              pageSize={6}
              totalCount={248}
              noun="agents"
            />
          </DataTableFooter>
        }
      />
    )
  },
}

export const Picker: Story = {
  render: function Render(args) {
    const [value, setValue] = React.useState<DataTableSelection>(
      new Set(["refund", "shipping"])
    )
    return (
      <DataTable
        {...args}
        aria-label="Articles"
        rowIds={["refund", "outage", "shipping"]}
        noun={{ one: "article", other: "articles" }}
        value={value}
        onValueChange={setValue}
      >
        <DataTableContent>
          <DataTableHeader>
            <DataTableHead type="primary">Title</DataTableHead>
            <DataTableHead>Access</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {[
              ["refund", "How to process a refund", "Internal"],
              ["outage", "Escalation policy for outages", "External"],
              ["shipping", "Shipping delays FAQ", "External"],
            ].map(([id, title, access]) => (
              <DataTableRow key={id} id={id!}>
                <DataTableCell type="primary" icon={<FileTextIcon />}>
                  {title}
                </DataTableCell>
                <DataTableCell>{access}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTableContent>
        <DataTableFooter>
          <DataTableSelectionCount />
        </DataTableFooter>
      </DataTable>
    )
  },
}
