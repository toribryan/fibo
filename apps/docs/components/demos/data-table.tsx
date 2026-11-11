"use client"

import * as React from "react"
import {
  EllipsisIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  createDataTableColumnHelper,
  DataTable,
  DataTableAction,
  DataTableActions,
  DataTableBulkActions,
  DataTableCards,
  DataTableColumns,
  DataTableContent,
  DataTableFacetFilter,
  DataTableFilters,
  DataTableFooter,
  DataTablePagination,
  DataTableSearch,
  DataTableSelectionCount,
  DataTableToolbar,
  useDataTable,
} from "@workspace/ui/components/data-table"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@workspace/ui/components/menu"

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
    team: "Engineering",
    role: "Viewer",
    status: "Deactivated",
    projects: 3,
    lastActive: "Aug 14",
  },
  {
    id: "kenji",
    name: "Kenji Sato",
    initials: "KS",
    team: "Design",
    role: "Editor",
    status: "Active",
    projects: 7,
    lastActive: "Today",
  },
  {
    id: "amara",
    name: "Amara Nwosu",
    initials: "AN",
    team: "Support",
    role: "Editor",
    status: "Away",
    projects: 4,
    lastActive: "Oct 30",
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

// Columns live outside the components, so the table's models aren't rebuilt
// on every render.
const member = createDataTableColumnHelper<Member>()
const COLUMNS = member.columns([
  member.accessor("name", {
    header: "Member",
    meta: {
      type: "person",
      className: "w-56",
      avatar: (row: Member) => ({ fallback: row.initials }),
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

const PINNED = { start: ["name"], end: ["actions"] }

function MembersToolbar() {
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
      <DataTableBulkActions onDelete={() => {}} />
    </DataTableToolbar>
  )
}

/*
 * Pages of five over eight rows, so selecting the page offers Select all
 * matching for the rest.
 */
export function DataTableDemo() {
  const table = useDataTable({
    data: MEMBERS,
    columns: COLUMNS,
    lockedReason: (row) => row.lock,
    initialState: {
      columnPinning: PINNED,
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  })
  return (
    <DataTable table={table} aria-label="Members" noun={MEMBER_NOUN}>
      <MembersToolbar />
      <DataTableContent />
      <DataTableCards />
      <DataTableFooter className="justify-end">
        <DataTablePagination />
      </DataTableFooter>
    </DataTable>
  )
}

const LOCKED_MEMBERS = MEMBERS.slice(3, 6)

export function DataTableLockedDemo() {
  const table = useDataTable({
    data: LOCKED_MEMBERS,
    columns: COLUMNS,
    lockedReason: (row) => row.lock,
    initialState: { columnPinning: PINNED },
  })
  return (
    <DataTable table={table} aria-label="Members" noun={MEMBER_NOUN}>
      <DataTableContent />
    </DataTable>
  )
}

const NO_MEMBERS: Member[] = []

export function DataTableEmptyDemo() {
  const empty = useDataTable({
    data: NO_MEMBERS,
    columns: COLUMNS,
    initialState: { columnPinning: PINNED },
  })
  const filtered = useDataTable({
    data: MEMBERS,
    columns: COLUMNS,
    lockedReason: (row) => row.lock,
    initialState: {
      columnPinning: PINNED,
      globalFilter: "zzz",
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  })
  return (
    <div className="flex flex-col gap-6">
      <DataTable table={empty} aria-label="Invited members" noun={MEMBER_NOUN}>
        <DataTableContent />
      </DataTable>
      <DataTable table={filtered} aria-label="Members" noun={MEMBER_NOUN}>
        <MembersToolbar />
        <DataTableContent />
      </DataTable>
    </div>
  )
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

export function DataTablePickerDemo() {
  const table = useDataTable({
    data: DOCUMENTS,
    columns: DOCUMENT_COLUMNS,
    initialState: { rowSelection: { onboarding: true, release: true } },
  })
  return (
    <DataTable
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
}
