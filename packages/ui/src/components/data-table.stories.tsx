import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  CheckIcon,
  DownloadIcon,
  EllipsisIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useCreateAtom, useSelector } from "@tanstack/react-store"
import { expect, fn, waitFor, within } from "storybook/test"

import { Badge } from "./badge.js"
import { Button } from "./button.js"
import {
  createDataTableColumnHelper,
  DataTable,
  DataTableAction,
  DataTableActions,
  DataTableBody,
  DataTableBulkAction,
  DataTableBulkActions,
  DataTableCard,
  DataTableCardField,
  DataTableCards,
  DataTableCell,
  DataTableColumns,
  DataTableContent,
  dataTableCodecs,
  DataTableFacetFilter,
  DataTableFilters,
  DataTableFooter,
  DataTableHead,
  DataTableHeader,
  DataTablePagination,
  DataTableRow,
  DataTableSearch,
  DataTableSelectionCount,
  DataTableToolbar,
  useDataTable,
  useSearchParamsAtom,
  type DataTableNarrowLayout,
  type DataTableOptions,
} from "./data-table.js"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "./menu.js"

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

const MEMBER_NOUN = { one: "member", other: "members" }

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

const member = createDataTableColumnHelper<Member>()

// Columns live outside the component, so the table's models aren't rebuilt
// on every render.
function memberColumns({ secondary }: { secondary: boolean }) {
  return member.columns([
    member.accessor("name", {
      header: "Member",
      meta: {
        type: "person",
        className: "w-56",
        avatar: (row: Member) => ({ fallback: row.initials }),
        secondary: secondary ? (row: Member) => row.email : undefined,
      },
    }),
    member.accessor("team", {
      header: "Team",
      filterFn: "arrHas",
      meta: { className: "w-44" },
    }),
    member.accessor("role", {
      header: "Role",
      filterFn: "arrHas",
      meta: { className: "w-32" },
    }),
    member.accessor("status", {
      header: "Status",
      filterFn: "arrHas",
      meta: { type: "status" },
      cell: ({ getValue }) => (
        <Badge variant={STATUS[getValue()]}>{getValue()}</Badge>
      ),
    }),
    member.accessor("projects", {
      header: "Projects",
      meta: { type: "numeric" },
    }),
    member.accessor("lastActive", {
      header: "Last active",
      enableSorting: false,
      meta: { className: "w-32" },
    }),
    member.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      meta: { type: "actions", label: "Actions" },
      cell: ({ row }) => <RowActions name={row.original.name} />,
    }),
  ])
}

const COLUMNS = memberColumns({ secondary: false })
const COLUMNS_WITH_EMAIL = memberColumns({ secondary: true })

const PINNED = { start: ["name"], end: ["actions"] }
const UNPINNED = { start: [], end: [] }

function selection(ids: string[]) {
  return Object.fromEntries(ids.map((id) => [id, true as const]))
}

type MembersTableProps = Omit<
  React.ComponentProps<typeof DataTable>,
  "table" | "children"
> & {
  members?: Member[]
  columns?: typeof COLUMNS
  pageSize?: number
  pinned?: boolean
  initialSelection?: string[]
  hiddenColumns?: string[]
  atoms?: DataTableOptions<Member>["atoms"]
  toolbar?: React.ReactNode
  footer?: React.ReactNode
}

function MembersTable({
  members = MEMBERS,
  columns = COLUMNS,
  pageSize,
  pinned = true,
  initialSelection = [],
  hiddenColumns = [],
  atoms,
  toolbar,
  footer,
  ...props
}: MembersTableProps) {
  const table = useDataTable({
    data: members,
    columns,
    atoms,
    lockedReason: (row) => row.lock,
    initialState: {
      columnPinning: pinned ? PINNED : UNPINNED,
      columnVisibility: Object.fromEntries(
        hiddenColumns.map((id) => [id, false])
      ),
      rowSelection: selection(initialSelection),
      ...(pageSize ? { pagination: { pageIndex: 0, pageSize } } : {}),
    },
  })
  return (
    <DataTable table={table} aria-label="Members" noun={MEMBER_NOUN} {...props}>
      {toolbar}
      <DataTableContent />
      <DataTableCards />
      {footer}
    </DataTable>
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
          <DataTableSearch
            placeholder="Search members"
            aria-label="Search members"
          />
        }
      >
        <DataTableFacetFilter column="status" />
        <DataTableFacetFilter column="team" />
      </DataTableFilters>
      <DataTableActions>
        <DataTableColumns />
        <DataTableAction icon={<PlusIcon data-icon="inline-start" />}>
          Add member
        </DataTableAction>
      </DataTableActions>
      {children ?? <DataTableBulkActions onDelete={() => {}} />}
    </DataTableToolbar>
  )
}

const pagination = (
  <DataTableFooter className="justify-end">
    <DataTablePagination />
  </DataTableFooter>
)

const meta: Meta<typeof DataTable> = {
  title: "Base components/Display/Data table",
  component: DataTable,
  subcomponents: {
    DataTableToolbar,
    DataTableFilters,
    DataTableSearch,
    DataTableFacetFilter,
    DataTableActions,
    DataTableAction,
    DataTableColumns,
    DataTableBulkActions,
    DataTableBulkAction,
    DataTableContent,
    DataTableHeader,
    DataTableBody,
    DataTableCards,
    DataTableCard,
    DataTableCardField,
    DataTableFooter,
    DataTablePagination,
    DataTableSelectionCount,
  },
  argTypes: {
    table: { control: false },
    noun: { control: false },
    children: { control: false },
    showSelectedOnly: { control: false },
    onShowSelectedOnlyChange: { control: false },
    narrowLayout: { control: "inline-radio", options: ["scroll", "cards"] },
    rowIds: { control: false },
    totalCount: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
  },
  parameters: {
    controls: {
      exclude: [
        "table",
        "noun",
        "children",
        "showSelectedOnly",
        "onShowSelectedOnlyChange",
        "rowIds",
        "totalCount",
        "value",
        "defaultValue",
        "onValueChange",
      ],
    },
  },
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

function footerFor(preset: FooterPreset) {
  if (preset === "selection count") {
    return (
      <DataTableFooter>
        <DataTableSelectionCount />
      </DataTableFooter>
    )
  }
  if (preset === "pagination") return pagination
  return null
}

const UNLOCKED = MEMBERS.map((row) => ({ ...row, lock: undefined }))

/*
 * The playground. Its controls change what the story renders, such as the
 * width it sits in, so narrowLayout has something to act on. Pages hold five
 * rows, so Select all matching has a sixth to offer.
 */
export const Default: StoryObj<PlaygroundArgs> = {
  args: {
    previewWidth: "100%",
    narrowLayout: "scroll",
    showToolbar: true,
    bulkActions: "delete only",
    footerContent: "pagination",
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
    showToolbar: {
      name: "toolbar",
      description:
        "Shows DataTableToolbar with search, filters, columns and actions.",
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
        // Page size and pinning are where a table starts, so a new choice
        // starts a new table.
        key={`${footerContent}-${pinnedColumns}`}
        {...args}
        members={lockedRow ? MEMBERS : UNLOCKED}
        columns={secondaryText ? COLUMNS_WITH_EMAIL : COLUMNS}
        pinned={pinnedColumns}
        pageSize={footerContent === "pagination" ? 5 : undefined}
        toolbar={
          showToolbar ? (
            <MembersToolbar>{bulkActionsFor(bulkActions)}</MembersToolbar>
          ) : undefined
        }
        footer={footerFor(footerContent)}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body)

    // Sort by pointer, then by keyboard; only the sorted head has aria-sort.
    const memberHead = canvas.getByRole("columnheader", { name: /Member/ })
    await userEvent.click(
      within(memberHead).getByRole("button", { name: "Member" })
    )
    await expect(memberHead).toHaveAttribute("aria-sort", "ascending")
    const projectsHead = canvas.getByRole("columnheader", { name: /Projects/ })
    within(projectsHead).getByRole("button", { name: "Projects" }).focus()
    await userEvent.keyboard("{Enter}")
    await expect(projectsHead).toHaveAttribute("aria-sort")
    await expect(memberHead).not.toHaveAttribute("aria-sort")

    // The search filters every page.
    const search = canvas.getByRole("searchbox", { name: "Search members" })
    await userEvent.type(search, "priya")
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(2))
    await userEvent.clear(search)

    // Hide a column from the Columns menu.
    await userEvent.click(canvas.getByRole("button", { name: "Columns" }))
    await userEvent.click(
      await body.findByRole("menuitemcheckbox", { name: "Team" })
    )
    await expect(
      canvas.queryByRole("columnheader", { name: "Team" })
    ).not.toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull())

    // Select by pointer, then by keyboard.
    const all = canvas.getByRole("checkbox", {
      name: "Select all members on this page",
    })
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select Priya Raman" })
    )
    await expect(all).toHaveAttribute("aria-checked", "mixed")
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("1 member selected")
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "1 member selected"
    )
    canvas.getByRole("checkbox", { name: "Select Maya Okafor" }).focus()
    await userEvent.keyboard(" ")
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "2 members selected"
    )

    // Select the page, which skips Elena's locked row, then every match.
    await userEvent.click(all)
    await expect(all).toHaveAttribute("aria-checked", "true")
    await expect(
      canvas.getByRole("checkbox", { name: "Select Elena Marsh" })
    ).not.toBeChecked()
    await userEvent.click(
      canvas.getByRole("button", { name: "Select all 5 members" })
    )
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("All 5 members selected")

    // Focus moved to Clear when Select all went; Escape clears.
    await expect(
      canvas.getByRole("button", { name: "Clear selection" })
    ).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent("Selection cleared")
    )
    await expect(all).toHaveAttribute("aria-checked", "false")
  },
}

const URL_KEYS = ["sort", "q", "filters", "page"]
const PAGE_OF_FOUR = dataTableCodecs.pagination(4)

function UrlState() {
  const sorting = useSearchParamsAtom("sort", dataTableCodecs.sorting)
  const globalFilter = useSearchParamsAtom("q", dataTableCodecs.text)
  const columnFilters = useSearchParamsAtom(
    "filters",
    dataTableCodecs.columnFilters
  )
  const page = useSearchParamsAtom("page", PAGE_OF_FOUR)
  // Re-render when any of them changes, so the panel shows the new URL.
  useSelector(sorting)
  useSelector(globalFilter)
  useSelector(columnFilters)
  useSelector(page)
  const params = new URLSearchParams(window.location.search)
  const shown = URL_KEYS.flatMap((key) => {
    const value = params.get(key)
    return value === null ? [] : [`${key}=${value}`]
  })
  return (
    <div className="flex flex-col gap-3">
      <MembersTable
        atoms={{ sorting, globalFilter, columnFilters, pagination: page }}
        toolbar={<MembersToolbar />}
        footer={pagination}
      />
      <output
        aria-label="Search params"
        className="rounded-md border border-border px-3 py-2 font-mono text-xs break-all text-muted-foreground"
      >
        {shown.length ? `?${shown.join("&")}` : "No search params yet"}
      </output>
    </div>
  )
}

function clearUrlKeys() {
  const url = new URL(window.location.href)
  for (const key of URL_KEYS) url.searchParams.delete(key)
  window.history.replaceState(window.history.state, "", url)
}

export const UrlSynced: Story = {
  name: "URL-synced state",
  beforeEach: () => {
    clearUrlKeys()
    return clearUrlKeys
  },
  render: () => <UrlState />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const params = canvas.getByRole("status", { name: "Search params" })
    await userEvent.click(
      within(canvas.getByRole("columnheader", { name: /Member/ })).getByRole(
        "button"
      )
    )
    await waitFor(() => expect(params).toHaveTextContent("sort=name.asc"))
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }))
    await waitFor(() => expect(params).toHaveTextContent("page=2"))
    await userEvent.type(
      canvas.getByRole("searchbox", { name: "Search members" }),
      "a"
    )
    // A new search starts on the first page again.
    await waitFor(() => expect(params).toHaveTextContent("q=a"))
    await waitFor(() => expect(params).not.toHaveTextContent("page="))

    await userEvent.click(
      within(
        canvas.getByRole("group", { name: "Filters and actions" })
      ).getByRole("button", { name: "Status" })
    )
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      await body.findByRole("menuitemcheckbox", { name: /Active/ })
    )
    await waitFor(() => expect(params).toHaveTextContent("filters="))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull())
  },
}

export const FacetedFilters: Story = {
  name: "Faceted filters",
  render: (args) => <MembersTable {...args} toolbar={<MembersToolbar />} />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body)
    const toolbar = within(
      canvas.getByRole("group", { name: "Filters and actions" })
    )
    await userEvent.click(toolbar.getByRole("button", { name: "Status" }))
    const active = await body.findByRole("menuitemcheckbox", {
      name: "Active 3",
    })
    await userEvent.click(active)
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(4))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull())

    // Team's counts follow the Status filter, not its own.
    await userEvent.click(toolbar.getByRole("button", { name: "Team" }))
    await expect(
      await body.findByRole("menuitemcheckbox", { name: "Design 1" })
    ).toBeInTheDocument()
    await expect(
      body.queryByRole("menuitemcheckbox", { name: /Support/ })
    ).toBeNull()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull())
  },
}

export const ColumnVisibility: Story = {
  name: "Column visibility and pinning",
  render: (args) => (
    <div className="max-w-2xl">
      <MembersTable
        {...args}
        hiddenColumns={["lastActive"]}
        toolbar={<MembersToolbar />}
      />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(
      canvas.queryByRole("columnheader", { name: "Last active" })
    ).not.toBeInTheDocument()
    const columns = canvas.getByRole("button", { name: "Columns" })
    columns.focus()
    await userEvent.keyboard("{Enter}")
    const body = within(canvasElement.ownerDocument.body)
    await body.findByRole("menuitemcheckbox", { name: "Last active" })
    await userEvent.keyboard("{End}")
    await userEvent.keyboard(" ")
    await expect(
      canvas.getByRole("columnheader", { name: "Last active" })
    ).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull())
  },
}

export const Locked: Story = {
  name: "Locked row",
  render: (args) => <MembersTable {...args} members={MEMBERS.slice(3, 6)} />,
}

export const SecondaryText: Story = {
  name: "Secondary text",
  render: (args) => (
    <MembersTable
      {...args}
      columns={COLUMNS_WITH_EMAIL}
      initialSelection={["priya"]}
    />
  ),
}

export const WithPagination: Story = {
  name: "With pagination",
  render: (args) => (
    <MembersTable
      {...args}
      pageSize={4}
      toolbar={<MembersToolbar />}
      footer={pagination}
    />
  ),
}

type Document = { id: string; title: string; access: string }

const DOCUMENTS: Document[] = [
  { id: "onboarding", title: "Onboarding checklist", access: "Workspace" },
  { id: "brand", title: "Brand guidelines", access: "Public" },
  { id: "release", title: "Release notes", access: "Public" },
]

const doc = createDataTableColumnHelper<Document>()
const DOCUMENT_COLUMNS = doc.columns([
  doc.accessor("title", {
    header: "Title",
    meta: { type: "primary", icon: <FileTextIcon /> },
  }),
  doc.accessor("access", { header: "Access" }),
])

export const Picker: Story = {
  render: function Render(args) {
    const table = useDataTable({
      data: DOCUMENTS,
      columns: DOCUMENT_COLUMNS,
      initialState: { rowSelection: selection(["onboarding", "release"]) },
    })
    return (
      <DataTable
        {...args}
        table={table}
        aria-label="Documents"
        noun={{ one: "document", other: "documents" }}
      >
        <DataTableContent />
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
            initialSelection={["maya", "priya"]}
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
      columns={COLUMNS_WITH_EMAIL}
      initialSelection={["priya", "sam"]}
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

/*
 * The app owns Show selected only: it keeps the selection in an atom it
 * reads, and passes the table only the selected rows.
 */
export const Directory: Story = {
  render: function Render(args) {
    const [showSelectedOnly, setShowSelectedOnly] = React.useState(false)
    const rowSelection = useCreateAtom<Record<string, true>>({})
    const selected = useSelector(rowSelection)
    const members = React.useMemo(
      () =>
        showSelectedOnly ? MEMBERS.filter((row) => selected[row.id]) : MEMBERS,
      [showSelectedOnly, selected]
    )
    return (
      <MembersTable
        {...args}
        members={members}
        pageSize={5}
        atoms={{ rowSelection }}
        showSelectedOnly={showSelectedOnly}
        onShowSelectedOnlyChange={setShowSelectedOnly}
        toolbar={<MembersToolbar />}
        footer={pagination}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select all members on this page" })
    )
    await userEvent.click(
      canvas.getByRole("button", { name: "Select all 5 members" })
    )
    await expect(
      canvas.getByRole("group", { name: "Bulk actions" })
    ).toHaveTextContent("All 5 members selected")

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
        initialSelection={["priya"]}
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

    // Cards read the same rows as the table, so the search filters them.
    await userEvent.click(
      canvas.getByRole("button", { name: "Clear selection" })
    )
    await userEvent.type(
      canvas.getByRole("searchbox", { name: "Search members" }),
      "rosa"
    )
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(1))

    // Filters open in a sheet.
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }))
    const body = within(canvasElement.ownerDocument.body)
    await expect(
      await body.findByRole("dialog", { name: "Filters" })
    ).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull())
  },
}

/*
 * The props and hand-written rows Data table had before useDataTable. They
 * keep working until 0.3.0, on the same table underneath.
 */
function LegacyMembersTable(
  props: Partial<React.ComponentProps<typeof DataTable>> & {
    narrowLayout?: DataTableNarrowLayout
  }
) {
  return (
    <DataTable
      aria-label="Members"
      rowIds={MEMBERS.map((row) => row.id)}
      noun={MEMBER_NOUN}
      {...props}
    >
      <DataTableToolbar>
        <DataTableFilters>
          <Button variant="ghost" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add filter
          </Button>
        </DataTableFilters>
        <DataTableBulkActions onDelete={() => {}} />
      </DataTableToolbar>
      <DataTableContent>
        <DataTableHeader>
          <DataTableHead type="person" pinned="start" className="w-56">
            Member
          </DataTableHead>
          <DataTableHead className="w-44">Team</DataTableHead>
          <DataTableHead type="status">Status</DataTableHead>
          <DataTableHead type="actions" pinned="end">
            <span className="sr-only">Actions</span>
          </DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {MEMBERS.map((row) => (
            <DataTableRow key={row.id} id={row.id} lockedReason={row.lock}>
              <DataTableCell
                type="person"
                pinned="start"
                avatar={{ fallback: row.initials }}
              >
                {row.name}
              </DataTableCell>
              <DataTableCell>{row.team}</DataTableCell>
              <DataTableCell type="status">
                <Badge variant={STATUS[row.status]}>{row.status}</Badge>
              </DataTableCell>
              <DataTableCell type="actions" pinned="end">
                <RowActions name={row.name} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableContent>
      <DataTableCards>
        {MEMBERS.map((row) => (
          <DataTableCard
            key={row.id}
            id={row.id}
            title={row.name}
            avatar={{ fallback: row.initials }}
            lockedReason={row.lock}
          >
            <DataTableCardField label="Team">{row.team}</DataTableCardField>
          </DataTableCard>
        ))}
      </DataTableCards>
      <DataTableFooter>
        <DataTableSelectionCount />
      </DataTableFooter>
    </DataTable>
  )
}

export const LegacyApi: Story = {
  name: "Legacy API",
  args: { onValueChange: fn(), totalCount: 248 },
  render: (args) => <LegacyMembersTable {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select Priya Raman" })
    )
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      new Set(["priya"])
    )
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select all members on this page" })
    )
    await userEvent.click(
      canvas.getByRole("button", { name: "Select all 247 members" })
    )
    await expect(args.onValueChange).toHaveBeenLastCalledWith("all")
    await expect(canvas.getByText("247 of 248 members selected")).toBeVisible()
  },
}
