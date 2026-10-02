import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  CheckIcon,
  DownloadIcon,
  EllipsisIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { expect, fn, waitFor } from "storybook/test"

import { Badge } from "./badge.js"
import { Button } from "./button.js"
import {
  DataTable,
  DataTableActions,
  DataTableBulkAction,
  DataTableBulkActions,
  DataTableFilters,
  DataTableToolbar,
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
import { Input } from "./input.js"
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

function AgentsToolbar({
  children,
}: {
  /** The bulk actions shown while rows are selected. */
  children?: React.ReactNode
}) {
  return (
    <DataTableToolbar>
      <DataTableFilters>
        <div className="relative w-48">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            size="sm"
            className="pl-8"
            placeholder="Search 248 agents"
            aria-label="Search agents"
          />
        </div>
        <Button variant="ghost" size="sm">
          <PlusIcon data-icon="inline-start" />
          Add filter
        </Button>
      </DataTableFilters>
      <DataTableActions>
        <Button size="sm">
          <PlusIcon data-icon="inline-start" />
          Add agent
        </Button>
      </DataTableActions>
      {children ?? <DataTableBulkActions onDelete={() => {}} />}
    </DataTableToolbar>
  )
}

function AgentsTable({
  agents = AGENTS,
  secondary = false,
  footer,
  toolbar,
  ...props
}: Partial<React.ComponentProps<typeof DataTable>> & {
  agents?: Agent[]
  secondary?: boolean
  footer?: React.ReactNode
  toolbar?: React.ReactNode
}) {
  return (
    <DataTable
      aria-label="Agents"
      rowIds={agents.map((agent) => agent.id)}
      noun={{ one: "agent", other: "agents" }}
      {...props}
    >
      {toolbar}
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
    DataTableToolbar,
    DataTableFilters,
    DataTableActions,
    DataTableBulkActions,
    DataTableBulkAction,
  },
  tags: ["new"],
  argTypes: {
    rowIds: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    noun: { control: false },
    children: { control: false },
    showSelectedOnly: { control: false },
    onShowSelectedOnlyChange: { control: false },
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
        "showSelectedOnly",
        "onShowSelectedOnlyChange",
      ],
    },
  },
  args: { onValueChange: fn() },
  render: (args) => <AgentsTable {...args} toolbar={<AgentsToolbar />} />,
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
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("1 agent selected")
    await expect(
      canvas.queryByRole("button", { name: "Add agent" })
    ).not.toBeInTheDocument()
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

export const BulkActionPatterns: Story = {
  name: "Bulk action patterns",
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(
        [
          ["Delete only", <DataTableBulkActions key="a" onDelete={() => {}} />],
          [
            "Export",
            <DataTableBulkActions key="b" onDelete={() => {}}>
              <DataTableBulkAction>
                <DownloadIcon data-icon="inline-start" />
                Export
              </DataTableBulkAction>
            </DataTableBulkActions>,
          ],
          [
            "Several",
            <DataTableBulkActions
              key="c"
              onDelete={() => {}}
              moreActions={
                <>
                  <MenuItem>Add skill</MenuItem>
                  <MenuItem>Change shift</MenuItem>
                </>
              }
            >
              <DataTableBulkAction>Assign schedule</DataTableBulkAction>
              <DataTableBulkAction>Change team</DataTableBulkAction>
            </DataTableBulkActions>,
          ],
          [
            "One item, with two selected",
            <DataTableBulkActions key="d" onDelete={() => {}}>
              <DataTableBulkAction single>
                <PencilIcon data-icon="inline-start" />
                Edit
              </DataTableBulkAction>
            </DataTableBulkActions>,
          ],
        ] as const
      ).map(([label, bulk]) => (
        <section key={label} aria-label={label} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{label}</h3>
          <AgentsTable
            {...args}
            agents={AGENTS.slice(0, 2)}
            defaultValue={new Set(["maya", "priya"])}
            toolbar={<AgentsToolbar>{bulk}</AgentsToolbar>}
          />
        </section>
      ))}
    </div>
  ),
}

export const ReviewQueue: Story = {
  name: "Review queue",
  render: (args) => (
    <AgentsTable
      {...args}
      secondary
      defaultValue={new Set(["priya", "sam"])}
      toolbar={
        <AgentsToolbar>
          <DataTableBulkActions>
            <Button size="sm">
              <CheckIcon data-icon="inline-start" />
              Approve
            </Button>
            <Button variant="destructive" size="sm">
              <XIcon data-icon="inline-start" />
              Deny
            </Button>
          </DataTableBulkActions>
        </AgentsToolbar>
      }
    />
  ),
}

export const Directory: Story = {
  render: function Render(args) {
    const [showSelectedOnly, setShowSelectedOnly] = React.useState(false)
    const [value, setValue] = React.useState<DataTableSelection>(new Set())
    const agents = showSelectedOnly
      ? AGENTS.filter((agent) => value === "all" || value.has(agent.id))
      : AGENTS
    return (
      <AgentsTable
        {...args}
        agents={agents}
        totalCount={248}
        value={value}
        onValueChange={setValue}
        showSelectedOnly={showSelectedOnly}
        onShowSelectedOnlyChange={setShowSelectedOnly}
        toolbar={<AgentsToolbar />}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select all agents on this page" })
    )
    await userEvent.click(
      canvas.getByRole("button", { name: "Select all 247 agents" })
    )
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("All 247 agents selected")

    // By keyboard: focus landed on Clear when its neighbour went away, and
    // Enter clears and hands focus to select all.
    const clear = canvas.getByRole("button", { name: "Clear selection" })
    await expect(clear).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(
      canvas.getByRole("checkbox", { name: "Select all agents on this page" })
    ).toHaveFocus()
  },
}
