import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  ArrowUpDownIcon,
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
import { expect, fn, waitFor, within } from "storybook/test"

import { Badge } from "./badge.js"
import { Button } from "./button.js"
import {
  DataTable,
  DataTableAction,
  DataTableActions,
  DataTableCard,
  DataTableCardField,
  DataTableCards,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.js"

const STATUS = {
  Active: "success",
  Away: "warning",
  Invited: "info",
  Deactivated: "secondary",
} as const

type Member = {
  id: string
  name: string
  initials: string
  email: string
  team: string
  role: string
  status: keyof typeof STATUS
  projects: number
  lastActive: string
  lock?: string
}

const MEMBERS: Member[] = [
  {
    id: "maya",
    name: "Maya Okafor",
    initials: "MO",
    email: "maya@example.com",
    team: "Design",
    role: "Admin",
    status: "Active",
    projects: 12,
    lastActive: "Today",
  },
  {
    id: "priya",
    name: "Priya Raman",
    initials: "PR",
    email: "priya@example.com",
    team: "Engineering",
    role: "Editor",
    status: "Away",
    projects: 8,
    lastActive: "Yesterday",
  },
  {
    id: "jordan",
    name: "Jordan Alvarez",
    initials: "JA",
    email: "jordan@example.com",
    team: "Marketing",
    role: "Editor",
    status: "Active",
    projects: 5,
    lastActive: "Today",
  },
  {
    id: "sam",
    name: "Sam Whitfield",
    initials: "SW",
    email: "sam@example.com",
    team: "Support",
    role: "Viewer",
    status: "Invited",
    projects: 0,
    lastActive: "Never",
  },
  {
    id: "elena",
    name: "Elena Marsh",
    initials: "EM",
    email: "elena@example.com",
    team: "Operations",
    role: "Owner",
    status: "Active",
    projects: 21,
    lastActive: "Today",
    lock: "The workspace owner can't be removed",
  },
  {
    id: "rosa",
    name: "Rosa Delgado",
    initials: "RD",
    email: "rosa@example.com",
    team: "Engineering",
    role: "Viewer",
    status: "Deactivated",
    projects: 3,
    lastActive: "Aug 14",
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

function MembersToolbar({
  children,
}: {
  /** The bulk actions shown while rows are selected. */
  children?: React.ReactNode
}) {
  return (
    <DataTableToolbar>
      <DataTableFilters
        search={
          <div className="relative w-full">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              size="sm"
              className="pl-8"
              placeholder="Search 248 members"
              aria-label="Search members"
            />
          </div>
        }
      >
        <Select
          defaultValue="name"
          items={[
            { value: "name", label: "Name" },
            { value: "team", label: "Team" },
          ]}
        >
          <SelectTrigger size="sm" aria-label="Sort by">
            <ArrowUpDownIcon />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="team">Team</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm">
          <PlusIcon data-icon="inline-start" />
          Add filter
        </Button>
      </DataTableFilters>
      <DataTableActions>
        <DataTableAction icon={<PlusIcon data-icon="inline-start" />}>
          Add member
        </DataTableAction>
      </DataTableActions>
      {children ?? <DataTableBulkActions onDelete={() => {}} />}
    </DataTableToolbar>
  )
}

function MembersTable({
  members = MEMBERS,
  secondary = false,
  pinned = true,
  footer,
  toolbar,
  ...props
}: Partial<React.ComponentProps<typeof DataTable>> & {
  members?: Member[]
  secondary?: boolean
  pinned?: boolean
  footer?: React.ReactNode
  toolbar?: React.ReactNode
}) {
  const start = pinned ? "start" : "none"
  const end = pinned ? "end" : "none"
  return (
    <DataTable
      aria-label="Members"
      rowIds={members.map((member) => member.id)}
      noun={{ one: "member", other: "members" }}
      {...props}
    >
      {toolbar}
      <DataTableContent>
        <DataTableHeader>
          <DataTableHead type="person" pinned={start} className="w-56">
            Member
          </DataTableHead>
          <DataTableHead className="w-44">Team</DataTableHead>
          <DataTableHead className="w-32">Role</DataTableHead>
          <DataTableHead type="status">Status</DataTableHead>
          <DataTableHead type="numeric">Projects</DataTableHead>
          <DataTableHead className="w-32">Last active</DataTableHead>
          <DataTableHead type="actions" pinned={end}>
            <span className="sr-only">Actions</span>
          </DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {members.map((member) => (
            <DataTableRow
              key={member.id}
              id={member.id}
              lockedReason={member.lock}
            >
              <DataTableCell
                type="person"
                pinned={start}
                avatar={{ fallback: member.initials }}
                secondary={secondary ? member.email : undefined}
              >
                {member.name}
              </DataTableCell>
              <DataTableCell>{member.team}</DataTableCell>
              <DataTableCell>{member.role}</DataTableCell>
              <DataTableCell type="status">
                <Badge variant={STATUS[member.status]}>{member.status}</Badge>
              </DataTableCell>
              <DataTableCell type="numeric">{member.projects}</DataTableCell>
              <DataTableCell>{member.lastActive}</DataTableCell>
              <DataTableCell type="actions" pinned={end}>
                <RowActions name={member.name} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableContent>
      <DataTableCards>
        {members.map((member) => (
          <DataTableCard
            key={member.id}
            id={member.id}
            title={member.name}
            avatar={{ fallback: member.initials }}
            status={
              <Badge variant={STATUS[member.status]}>{member.status}</Badge>
            }
            lockedReason={member.lock}
          >
            <DataTableCardField label="Team">{member.team}</DataTableCardField>
            <DataTableCardField label="Last active">
              {member.lastActive}
            </DataTableCardField>
            <DataTableCardField label="Role">{member.role}</DataTableCardField>
            <DataTableCardField label="Projects">
              {member.projects}
            </DataTableCardField>
          </DataTableCard>
        ))}
      </DataTableCards>
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
    DataTableAction,
    DataTableCards,
    DataTableCard,
    DataTableCardField,
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
    narrowLayout: { control: false },
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
        "narrowLayout",
      ],
    },
  },
  args: { onValueChange: fn() },
  render: (args) => <MembersTable {...args} toolbar={<MembersToolbar />} />,
}

export default meta
type Story = StoryObj<typeof DataTable>

type BulkActionsPreset = "delete only" | "export" | "several" | "review"
type FooterPreset = "none" | "pagination" | "selection count"

type PlaygroundArgs = React.ComponentProps<typeof DataTable> & {
  previewWidth: "100%" | "640px" | "375px"
  showToolbar: boolean
  bulkActions: BulkActionsPreset
  footerContent: FooterPreset
  secondaryText: boolean
  lockedRow: boolean
  pinnedColumns: boolean
}

function bulkActionsFor(preset: BulkActionsPreset) {
  switch (preset) {
    case "export":
      return (
        <DataTableBulkActions onDelete={() => {}}>
          <DataTableBulkAction icon={<DownloadIcon data-icon="inline-start" />}>
            Export
          </DataTableBulkAction>
        </DataTableBulkActions>
      )
    case "several":
      return (
        <DataTableBulkActions
          onDelete={() => {}}
          moreActions={<MenuItem>Add to project</MenuItem>}
        >
          <DataTableBulkAction>Change role</DataTableBulkAction>
          <DataTableBulkAction
            single
            icon={<PencilIcon data-icon="inline-start" />}
          >
            Edit
          </DataTableBulkAction>
        </DataTableBulkActions>
      )
    case "review":
      return (
        <DataTableBulkActions>
          <DataTableBulkAction
            variant="default"
            icon={<CheckIcon data-icon="inline-start" />}
          >
            Approve
          </DataTableBulkAction>
          <DataTableBulkAction
            variant="destructive"
            icon={<XIcon data-icon="inline-start" />}
          >
            Deny
          </DataTableBulkAction>
        </DataTableBulkActions>
      )
    default:
      return <DataTableBulkActions onDelete={() => {}} />
  }
}

function footerFor(preset: FooterPreset, totalCount?: number) {
  if (preset === "selection count") {
    return (
      <DataTableFooter>
        <DataTableSelectionCount />
      </DataTableFooter>
    )
  }
  if (preset === "pagination") {
    const total = totalCount ?? MEMBERS.length
    return (
      <DataTableFooter className="justify-end">
        <Pagination
          pageCount={Math.max(1, Math.ceil(total / MEMBERS.length))}
          pageSize={MEMBERS.length}
          totalCount={total}
          noun="members"
        />
      </DataTableFooter>
    )
  }
  return null
}

/*
 * The playground. Its controls change what the story renders, such as the
 * width it sits in, so narrowLayout has something to act on.
 */
export const Default: StoryObj<PlaygroundArgs> = {
  args: {
    previewWidth: "100%",
    narrowLayout: "scroll",
    showToolbar: true,
    bulkActions: "delete only",
    footerContent: "none",
    secondaryText: false,
    lockedRow: true,
    pinnedColumns: true,
  },
  argTypes: {
    previewWidth: {
      name: "width",
      description: "The width the table sits in. Under 32rem it goes narrow.",
      control: "inline-radio",
      options: ["100%", "640px", "375px"],
    },
    narrowLayout: {
      control: "inline-radio",
      options: ["scroll", "cards"],
    },
    showToolbar: {
      name: "toolbar",
      description: "Shows DataTableToolbar with filters and actions.",
      control: "boolean",
    },
    bulkActions: {
      name: "bulk actions",
      description: "Which bulk actions show while rows are selected.",
      control: "inline-radio",
      options: ["delete only", "export", "several", "review"],
    },
    footerContent: {
      name: "footer",
      description: "What DataTableFooter holds, if anything.",
      control: "inline-radio",
      options: ["none", "pagination", "selection count"],
    },
    secondaryText: {
      name: "secondary text",
      description: "A second line under each name, making rows 52px.",
      control: "boolean",
    },
    lockedRow: {
      name: "locked row",
      description: "Locks Elena's row with a reason.",
      control: "boolean",
    },
    pinnedColumns: {
      name: "pinned columns",
      description: "Pins the name to the start and actions to the end.",
      control: "boolean",
    },
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
  render: ({
    previewWidth,
    showToolbar,
    bulkActions,
    footerContent,
    secondaryText,
    lockedRow,
    pinnedColumns,
    ...args
  }) => (
    <div style={{ width: previewWidth, maxWidth: "100%" }}>
      <MembersTable
        {...args}
        members={
          lockedRow
            ? MEMBERS
            : MEMBERS.map((member) => ({ ...member, lock: undefined }))
        }
        secondary={secondaryText}
        pinned={pinnedColumns}
        toolbar={
          showToolbar ? (
            <MembersToolbar>{bulkActionsFor(bulkActions)}</MembersToolbar>
          ) : undefined
        }
        footer={footerFor(footerContent, args.totalCount)}
      />
    </div>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const all = canvas.getByRole("checkbox", {
      name: "Select all members on this page",
    })
    const priya = canvas.getByRole("checkbox", { name: "Select Priya Raman" })

    await userEvent.click(priya)
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      new Set(["priya"])
    )
    await expect(all).toHaveAttribute("aria-checked", "mixed")
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("1 member selected")
    await expect(
      canvas.queryByRole("button", { name: "Add member" })
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "1 member selected"
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
  render: (args) => <MembersTable {...args} members={MEMBERS.slice(3, 6)} />,
}

export const SecondaryText: Story = {
  name: "Secondary text",
  render: (args) => (
    <MembersTable {...args} secondary defaultValue={new Set(["priya"])} />
  ),
}

export const Pinned: Story = {
  name: "Pinned columns",
  render: (args) => (
    <div className="max-w-2xl">
      <MembersTable {...args} />
    </div>
  ),
}

export const WithPagination: Story = {
  name: "With pagination",
  render: function Render(args) {
    const [page, setPage] = React.useState(1)
    return (
      <MembersTable
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
              noun="members"
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
      new Set(["onboarding", "release"])
    )
    return (
      <DataTable
        {...args}
        aria-label="Documents"
        rowIds={["onboarding", "brand", "release"]}
        noun={{ one: "document", other: "documents" }}
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
              ["onboarding", "Onboarding checklist", "Workspace"],
              ["brand", "Brand guidelines", "Public"],
              ["release", "Release notes", "Public"],
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
              <DataTableBulkAction
                icon={<DownloadIcon data-icon="inline-start" />}
              >
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
                  <MenuItem>Add to project</MenuItem>
                  <MenuItem>Resend invite</MenuItem>
                </>
              }
            >
              <DataTableBulkAction>Change role</DataTableBulkAction>
              <DataTableBulkAction>Change team</DataTableBulkAction>
            </DataTableBulkActions>,
          ],
          [
            "One item, with two selected",
            <DataTableBulkActions key="d" onDelete={() => {}}>
              <DataTableBulkAction
                single
                icon={<PencilIcon data-icon="inline-start" />}
              >
                Edit
              </DataTableBulkAction>
            </DataTableBulkActions>,
          ],
        ] as const
      ).map(([label, bulk]) => (
        <section key={label} aria-label={label} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{label}</h3>
          <MembersTable
            {...args}
            members={MEMBERS.slice(0, 2)}
            defaultValue={new Set(["maya", "priya"])}
            toolbar={<MembersToolbar>{bulk}</MembersToolbar>}
          />
        </section>
      ))}
    </div>
  ),
}

export const ReviewQueue: Story = {
  name: "Review queue",
  render: (args) => (
    <MembersTable
      {...args}
      secondary
      defaultValue={new Set(["priya", "sam"])}
      toolbar={
        <MembersToolbar>
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
        </MembersToolbar>
      }
    />
  ),
}

export const Directory: Story = {
  render: function Render(args) {
    const [showSelectedOnly, setShowSelectedOnly] = React.useState(false)
    const [value, setValue] = React.useState<DataTableSelection>(new Set())
    const members = showSelectedOnly
      ? MEMBERS.filter((member) => value === "all" || value.has(member.id))
      : MEMBERS
    return (
      <MembersTable
        {...args}
        members={members}
        totalCount={248}
        value={value}
        onValueChange={setValue}
        showSelectedOnly={showSelectedOnly}
        onShowSelectedOnlyChange={setShowSelectedOnly}
        toolbar={<MembersToolbar />}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select all members on this page" })
    )
    await userEvent.click(
      canvas.getByRole("button", { name: "Select all 247 members" })
    )
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("All 247 members selected")

    // By keyboard: focus landed on Clear when its neighbour went away, and
    // Enter clears and hands focus to select all.
    const clear = canvas.getByRole("button", { name: "Clear selection" })
    await expect(clear).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(
      canvas.getByRole("checkbox", { name: "Select all members on this page" })
    ).toHaveFocus()
  },
}

export const NarrowScroll: Story = {
  name: "Narrow, scroll",
  render: (args) => (
    <div className="w-[375px]">
      <MembersTable
        {...args}
        narrowLayout="scroll"
        toolbar={<MembersToolbar />}
      />
    </div>
  ),
}

export const NarrowCards: Story = {
  name: "Narrow, cards",
  render: (args) => (
    <div className="w-[375px]">
      <MembersTable
        {...args}
        narrowLayout="cards"
        defaultValue={new Set(["priya"])}
        toolbar={
          <MembersToolbar>
            <DataTableBulkActions onDelete={() => {}}>
              <DataTableBulkAction icon={<DownloadIcon />}>
                Export
              </DataTableBulkAction>
            </DataTableBulkActions>
          </MembersToolbar>
        }
      />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument()
    await expect(
      canvas.getByRole("checkbox", { name: "Select Priya Raman" })
    ).toBeChecked()

    // The bulk actions are icon only here, named by their labels.
    await expect(
      canvas.getByRole("button", { name: "Export" })
    ).not.toHaveTextContent("Export")

    // Filters open in a sheet once the selection is cleared.
    await userEvent.click(
      canvas.getByRole("button", { name: "Clear selection" })
    )
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }))
    const body = within(canvasElement.ownerDocument.body)
    await expect(
      await body.findByRole("dialog", { name: "Filters" })
    ).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull())
  },
}
