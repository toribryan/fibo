import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"
import { renderToString } from "react-dom/server"
import { useSelector } from "@tanstack/react-store"

import {
  createDataTableColumnHelper,
  DataTable,
  DataTableActions,
  DataTableBody,
  DataTableBulkActions,
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
  useDataTableContext,
  useDataTableFacets,
  useSearchParamsAtom,
  type DataTableOptions,
  type DataTableSelection,
} from "./data-table.js"

type Member = {
  id: string
  name: string
  team: string
  projects: number
  lock?: string
}

const MEMBERS: Member[] = [
  { id: "maya", name: "Maya Okafor", team: "Design", projects: 12 },
  { id: "priya", name: "Priya Raman", team: "Engineering", projects: 8 },
  { id: "jordan", name: "Jordan Alvarez", team: "Marketing", projects: 5 },
  {
    id: "elena",
    name: "Elena Marsh",
    team: "Operations",
    projects: 21,
    lock: "The workspace owner can't be removed",
  },
  { id: "sam", name: "Sam Whitfield", team: "Engineering", projects: 0 },
]

const NOUN = { one: "member", other: "members" }

const member = createDataTableColumnHelper<Member>()
const COLUMNS = member.columns([
  member.accessor("name", { header: "Member", meta: { type: "primary" } }),
  member.accessor("team", { header: "Team", filterFn: "arrHas" }),
  member.accessor("projects", {
    header: "Projects",
    meta: { type: "numeric" },
  }),
])

function Example({
  members = MEMBERS,
  columns = COLUMNS,
  children,
  bulk,
  onRender,
  ...options
}: Partial<DataTableOptions<Member>> & {
  members?: Member[]
  children?: React.ReactNode
  bulk?: React.ReactNode
  onRender?: () => void
}) {
  onRender?.()
  const table = useDataTable({
    data: members,
    columns,
    lockedReason: (row) => row.lock,
    ...options,
  })
  return (
    <div style={{ width: 800 }}>
      <DataTable table={table} aria-label="Members" noun={NOUN}>
        <DataTableToolbar>
          <DataTableFilters
            search={<DataTableSearch aria-label="Search members" />}
          >
            <DataTableFacetFilter column="team" />
          </DataTableFilters>
          <DataTableActions>
            <DataTableColumns />
          </DataTableActions>
          {bulk}
        </DataTableToolbar>
        <DataTableContent />
        {children}
      </DataTable>
    </div>
  )
}

const bodyNames = () =>
  [
    ...document.querySelectorAll(
      '[data-slot="data-table-row"] [data-row-name]'
    ),
  ].map((cell) => cell.textContent)

describe("DataTable on useDataTable", () => {
  it("renders a head and a row for every column and row", async () => {
    const screen = await render(<Example />)
    await expect
      .element(screen.getByRole("columnheader", { name: "Team", exact: true }))
      .toHaveAttribute("scope", "col")
    expect(bodyNames()).toEqual([
      "Maya Okafor",
      "Priya Raman",
      "Jordan Alvarez",
      "Elena Marsh",
      "Sam Whitfield",
    ])
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Maya Okafor" }))
      .toBeInTheDocument()
  })

  it("sorts from a head's button, with aria-sort on that head only", async () => {
    const screen = await render(<Example />)
    const member = screen.getByRole("columnheader", {
      name: "Member",
      exact: true,
    })
    const sort = member.getByRole("button", { name: "Member" })
    await expect.element(member).not.toHaveAttribute("aria-sort")

    await sort.click()
    await expect.element(member).toHaveAttribute("aria-sort", "ascending")
    expect(bodyNames()[0]).toBe("Elena Marsh")
    expect(screen.container.querySelectorAll("th[aria-sort]").length).toBe(1)

    await sort.click()
    await expect.element(member).toHaveAttribute("aria-sort", "descending")
    expect(bodyNames()[0]).toBe("Sam Whitfield")

    await sort.click()
    await expect.element(member).not.toHaveAttribute("aria-sort")
    expect(bodyNames()[0]).toBe("Maya Okafor")
  })

  it("searches every column from the search field", async () => {
    const screen = await render(<Example />)
    await screen
      .getByRole("searchbox", { name: "Search members" })
      .fill("engineering")
    await expect.poll(bodyNames).toEqual(["Priya Raman", "Sam Whitfield"])
  })

  it("filters a column from its facet menu, with counts", async () => {
    const screen = await render(<Example />)
    await screen
      .getByRole("group", { name: "Filters and actions" })
      .getByRole("button", { name: "Team" })
      .click()
    const engineering = page.getByRole("menuitemcheckbox", {
      name: "Engineering 2",
    })
    await expect.element(engineering).toBeInTheDocument()
    await engineering.click()
    await expect.poll(bodyNames).toEqual(["Priya Raman", "Sam Whitfield"])
    // Its own filter doesn't shrink its counts, so every choice stays.
    await expect
      .element(page.getByRole("menuitemcheckbox", { name: "Design 1" }))
      .toBeInTheDocument()
  })

  it("counts each value under the other filters", async () => {
    function TeamCounts() {
      const facets = useDataTableFacets("team")
      return (
        <output aria-label="Team counts">
          {facets.map(({ value, count }) => `${value}:${count}`).join(" ")}
        </output>
      )
    }
    const screen = await render(
      <Example>
        <TeamCounts />
      </Example>
    )
    const counts = screen.getByRole("status", { name: "Team counts" })
    await expect
      .element(counts)
      .toHaveTextContent("Design:1 Engineering:2 Marketing:1 Operations:1")
    await screen
      .getByRole("searchbox", { name: "Search members" })
      .fill("priya")
    await expect.poll(() => counts.element().textContent).toBe("Engineering:1")
  })

  it("pages the rows and wires the footer's pagination", async () => {
    const screen = await render(
      <Example initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}>
        <DataTableFooter>
          <DataTablePagination />
        </DataTableFooter>
      </Example>
    )
    expect(bodyNames()).toEqual(["Maya Okafor", "Priya Raman"])
    await expect
      .element(screen.getByText("1 to 2 of 5 members"))
      .toBeInTheDocument()
    await screen.getByRole("button", { name: "Next page" }).click()
    await expect.poll(bodyNames).toEqual(["Jordan Alvarez", "Elena Marsh"])
    await expect.element(screen.getByText("Page 2 of 3")).toBeInTheDocument()
  })

  it("shows every row when the table has no page size", async () => {
    await render(<Example members={[...MEMBERS, ...extraMembers(20)]} />)
    expect(bodyNames()).toHaveLength(25)
  })

  it("hides a column from the Columns menu", async () => {
    const screen = await render(<Example />)
    await screen.getByRole("button", { name: "Columns" }).click()
    await page.getByRole("menuitemcheckbox", { name: "Team" }).click()
    await expect
      .element(screen.getByRole("columnheader", { name: "Team", exact: true }))
      .not.toBeInTheDocument()
    expect(
      screen.container.querySelectorAll(
        '[data-slot="data-table-row"]:first-child > td'
      )
    ).toHaveLength(3)
  })

  it("pins columns from columnPinning, first at the start", async () => {
    const screen = await render(
      <Example initialState={{ columnPinning: { start: ["team"], end: [] } }} />
    )
    const heads = screen.container.querySelectorAll(
      '[data-slot="data-table-head"]'
    )
    expect(heads[0]?.textContent).toBe("Team")
    expect(heads[0]?.getAttribute("data-pinned")).toBe("start")
    expect(heads[1]?.hasAttribute("data-pinned")).toBe(false)
    const cell = screen.container.querySelector(
      '[data-slot="data-table-row"] [data-slot="data-table-cell"]'
    )
    expect(cell?.getAttribute("data-pinned")).toBe("start")
  })

  it("selects every matching row across pages, but not locked ones", async () => {
    const screen = await render(
      <Example initialState={{ pagination: { pageIndex: 0, pageSize: 2 } }}>
        <DataTableFooter>
          <DataTableSelectionCount />
        </DataTableFooter>
      </Example>
    )
    await screen
      .getByRole("checkbox", { name: "Select all members on this page" })
      .click()
    await screen.getByRole("button", { name: "Select all 4 members" }).click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("All 4 members selected")
    await expect
      .element(screen.getByText("4 of 5 members selected"))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("status").last())
      .toHaveTextContent("All 4 members selected")
  })

  it("selects a range with Shift in the order the rows are shown", async () => {
    const onRowSelectionChange = vi.fn()
    function Controlled() {
      const [rowSelection, setRowSelection] = React.useState({})
      return (
        <Example
          state={{ rowSelection }}
          onRowSelectionChange={(updater) => {
            setRowSelection(updater)
            onRowSelectionChange(updater)
          }}
          initialState={{ sorting: [{ id: "projects", desc: true }] }}
        />
      )
    }
    const screen = await render(<Controlled />)
    // Shown by projects: Elena (locked), Maya, Priya, Jordan, Sam.
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await userEvent.keyboard("{Shift>}")
    await screen
      .getByRole("checkbox", { name: "Select Jordan Alvarez" })
      .click()
    await userEvent.keyboard("{/Shift}")
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("3 members selected")
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Sam Whitfield" }))
      .not.toBeChecked()
  })

  it("explains a locked row and won't select it", async () => {
    const screen = await render(<Example />)
    const elena = screen.getByRole("checkbox", { name: "Select Elena Marsh" })
    await expect.element(elena).toBeDisabled()
    await expect
      .element(elena)
      .toHaveAccessibleDescription("The workspace owner can't be removed")
  })

  it("clears on Escape and says so", async () => {
    const screen = await render(
      <Example initialState={{ rowSelection: { maya: true, sam: true } }} />
    )
    screen
      .getByRole("checkbox", { name: "Select Maya Okafor" })
      .element()
      .focus()
    await userEvent.keyboard("{Escape}")
    await expect
      .element(screen.getByText("Selection cleared"))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("checkbox", { name: /Select all/ }))
      .toHaveAttribute("aria-checked", "false")
  })

  it("re-renders only the row a selection changes", async () => {
    const renders = new Map<string, number>()
    let ownerRenders = 0
    const counted = member.columns([
      member.accessor("name", {
        header: "Member",
        meta: { type: "primary" },
        cell: function Name({ row, getValue }) {
          renders.set(row.id, (renders.get(row.id) ?? 0) + 1)
          return getValue()
        },
      }),
    ])
    const rowRenders = () =>
      document.querySelectorAll('[data-slot="data-table-row"]').length
    const screen = await render(
      <Example columns={counted} onRender={() => ownerRenders++} />
    )
    expect(rowRenders()).toBe(5)
    const before = { ...Object.fromEntries(renders) }
    const ownerBefore = ownerRenders

    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("1 member selected")
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("2 members selected")

    expect(renders.get("jordan")).toBe(before.jordan)
    expect(renders.get("sam")).toBe(before.sam)
    expect(ownerRenders).toBe(ownerBefore)
  })

  it("redraws the body when the columns change but the data doesn't", async () => {
    const shouting = member.columns([
      member.accessor("name", {
        header: "Member",
        meta: { type: "primary" },
        cell: ({ getValue }) => getValue().toUpperCase(),
      }),
    ])
    const screen = await render(<Example />)
    expect(bodyNames()[0]).toBe("Maya Okafor")
    await screen.rerender(<Example columns={shouting} />)
    await expect.poll(() => bodyNames()[0]).toBe("MAYA OKAFOR")
    expect(
      screen.container.querySelectorAll(
        '[data-slot="data-table-row"]:first-child > td'
      )
    ).toHaveLength(2)
  })

  it("locks rows when lockedReason changes but the data doesn't", async () => {
    const screen = await render(<Example />)
    const maya = screen.getByRole("checkbox", { name: "Select Maya Okafor" })
    await expect.element(maya).toBeEnabled()
    await screen.rerender(
      <Example
        lockedReason={(row) => (row.id === "maya" ? "Maya owns it" : row.lock)}
      />
    )
    await expect.element(maya).toBeDisabled()
    await expect.element(maya).toHaveAccessibleDescription("Maya owns it")
  })

  it("redraws a cell that reads its row's selection", async () => {
    const marked = member.columns([
      member.accessor("name", {
        header: "Member",
        meta: { type: "primary" },
        cell: ({ row, getValue }) =>
          row.getIsSelected() ? `${getValue()} (selected)` : getValue(),
      }),
    ])
    const screen = await render(<Example columns={marked} />)
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await expect.poll(() => bodyNames()[0]).toBe("Maya Okafor (selected)")
    expect(bodyNames()[1]).toBe("Priya Raman")
  })
})

describe("selection after the rows change", () => {
  let ids: string[] = []
  function SelectedIds() {
    const table = useDataTableContext()
    return (
      <button type="button" onClick={() => (ids = table.getSelectedRowIds())}>
        Read selection
      </button>
    )
  }
  function ClearSearch() {
    const table = useDataTableContext()
    return (
      <button type="button" onClick={() => table.setGlobalFilter("")}>
        Clear search
      </button>
    )
  }
  function Counted({
    children,
    ...props
  }: Partial<DataTableOptions<Member>> & {
    members?: Member[]
    children?: React.ReactNode
    bulk?: React.ReactNode
  }) {
    return (
      <Example {...props}>
        <DataTableFooter>
          <DataTableSelectionCount />
          <SelectedIds />
          <ClearSearch />
          {children}
        </DataTableFooter>
      </Example>
    )
  }

  it("counts only selected rows still in the data after a refetch", async () => {
    const twelve = extraMembers(12)
    const screen = await render(<Counted members={twelve} />)
    await screen
      .getByRole("checkbox", { name: "Select all members on this page" })
      .click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("12 members selected")

    await screen.rerender(<Counted members={twelve.slice(4)} />)
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("8 members selected")
    await expect
      .element(screen.getByText("8 of 8 members selected"))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("status").last())
      .toHaveTextContent("8 members selected")
    await screen.getByRole("button", { name: "Read selection" }).click()
    expect(ids).toEqual(twelve.slice(4).map((row) => row.id))
  })

  it("keeps selected rows that a column filter hides, and says so", async () => {
    const screen = await render(
      <Counted
        initialState={{
          columnFilters: [{ id: "team", value: ["Engineering"] }],
          rowSelection: { maya: true, priya: true },
        }}
      />
    )
    expect(bodyNames()).toEqual(["Priya Raman", "Sam Whitfield"])
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("2 members selected, 1 hidden by filters")
    await expect
      .element(screen.getByText("2 of 3 members selected, 1 hidden by filters"))
      .toBeInTheDocument()

    await screen.getByRole("checkbox", { name: "Select Sam Whitfield" }).click()
    await expect
      .element(screen.getByRole("status").last())
      .toHaveTextContent("3 members selected, 1 hidden by filters")
    await screen.getByRole("button", { name: "Read selection" }).click()
    expect([...ids].sort()).toEqual(["maya", "priya", "sam"])

    // The header checkbox speaks for the page, which is all selected.
    await expect
      .element(
        screen.getByRole("checkbox", {
          name: "Select all members on this page",
        })
      )
      .toBeChecked()
  })

  it("drops the hidden count once the filter that hid them is cleared", async () => {
    const screen = await render(
      <Counted
        initialState={{
          globalFilter: "priya",
          rowSelection: { maya: true, priya: true },
        }}
      />
    )
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("2 members selected, 1 hidden by filters")
    await screen.getByRole("button", { name: "Clear search" }).click()
    expect(bodyNames()).toHaveLength(5)
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("2 members selected")
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .not.toHaveTextContent("hidden")
    await expect
      .element(screen.getByText("2 of 5 members selected"))
      .toBeInTheDocument()
  })

  it("selects every matching row and keeps the hidden ones", async () => {
    const twelve = extraMembers(12)
    const screen = await render(
      <Counted
        members={[...MEMBERS, ...twelve]}
        initialState={{
          globalFilter: "extra",
          pagination: { pageIndex: 0, pageSize: 5 },
          rowSelection: { maya: true },
        }}
      >
        <DataTablePagination />
      </Counted>
    )
    await screen
      .getByRole("checkbox", { name: "Select all members on this page" })
      .click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toMatchTextContent(/6 members selected, 1 hidden by filters/)
    await screen.getByRole("button", { name: "Select all 12 members" }).click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("13 members selected, 1 hidden by filters")
    await expect
      .element(screen.getByRole("status").last())
      .toHaveTextContent("13 members selected, 1 hidden by filters")
    await expect
      .element(
        screen.getByText("13 of 13 members selected, 1 hidden by filters")
      )
      .toBeInTheDocument()
    await screen.getByRole("button", { name: "Read selection" }).click()
    expect([...ids].sort()).toEqual(
      ["maya", ...twelve.map((row) => row.id)].sort()
    )
  })

  it("says how many rows a bulk action acts on, hidden ones included", async () => {
    const onDelete = vi.fn()
    const screen = await render(
      <Counted
        bulk={<DataTableBulkActions onDelete={onDelete} />}
        initialState={{
          globalFilter: "priya",
          rowSelection: { maya: true, priya: true },
        }}
      />
    )
    await expect
      .element(screen.getByRole("group", { name: "Actions on 2 members" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("button", { name: "Delete" }))
      .toHaveAccessibleDescription("2 members, including 1 hidden by filters")
  })
})

function extraMembers(count: number): Member[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `extra-${index}`,
    name: `Extra ${index}`,
    team: "Support",
    projects: index,
  }))
}

describe("useSearchParamsAtom", () => {
  afterEach(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("q")
    url.searchParams.delete("sort")
    url.searchParams.delete("page")
    url.searchParams.delete("filters")
    window.history.replaceState(window.history.state, "", url)
  })

  function setSearch(params: Record<string, string>) {
    const url = new URL(window.location.href)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
    window.history.replaceState(window.history.state, "", url)
  }

  function UrlExample() {
    const globalFilter = useSearchParamsAtom("q", dataTableCodecs.text)
    const sorting = useSearchParamsAtom("sort", dataTableCodecs.sorting)
    return <Example atoms={{ globalFilter, sorting }} />
  }

  it("starts from the URL", async () => {
    setSearch({ q: "priya", sort: "name.desc" })
    const screen = await render(<UrlExample />)
    await expect
      .element(screen.getByRole("searchbox", { name: "Search members" }))
      .toHaveValue("priya")
    expect(bodyNames()).toEqual(["Priya Raman"])
    await expect
      .element(
        screen.getByRole("columnheader", { name: "Member", exact: true })
      )
      .toHaveAttribute("aria-sort", "descending")
  })

  it("renders the empty value on the server, whatever the URL holds", () => {
    setSearch({ q: "priya", sort: "name.desc" })
    function Probe() {
      const query = useSearchParamsAtom("q", dataTableCodecs.text)
      return <output>[{useSelector(query)}]</output>
    }
    expect(renderToString(<Probe />)).toContain("[<!-- -->]")
    const html = renderToString(<UrlExample />)
    // Every row and no sort: the URL isn't read until the table mounts.
    for (const { name } of MEMBERS) expect(html).toContain(name)
    expect(html).not.toContain("aria-sort")
    expect(html).not.toContain('value="priya"')
  })

  it("restores the page along with the search it was on", async () => {
    setSearch({ q: "e", page: "2" })
    function Paged() {
      const globalFilter = useSearchParamsAtom("q", dataTableCodecs.text)
      const pagination = useSearchParamsAtom(
        "page",
        dataTableCodecs.pagination(2)
      )
      return <Example atoms={{ globalFilter, pagination }} />
    }
    await render(<Paged />)
    // "e" leaves Maya, Priya, Jordan, Elena and Sam; page 2 holds two.
    await expect.poll(bodyNames).toEqual(["Jordan Alvarez", "Elena Marsh"])
    expect(new URLSearchParams(window.location.search).get("page")).toBe("2")
  })

  function LatePage({ members }: { members: Member[] }) {
    const globalFilter = useSearchParamsAtom("q", dataTableCodecs.text)
    const pagination = useSearchParamsAtom(
      "page",
      dataTableCodecs.pagination(2)
    )
    return <Example members={members} atoms={{ globalFilter, pagination }} />
  }

  const settle = async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  const pageParam = () =>
    new URLSearchParams(window.location.search).get("page")

  it("keeps a restored page when the rows arrive after mount", async () => {
    setSearch({ page: "2" })
    const screen = await render(<LatePage members={[]} />)
    await settle()
    await screen.rerender(<LatePage members={MEMBERS} />)
    await expect.poll(bodyNames).toEqual(["Jordan Alvarez", "Elena Marsh"])
    expect(pageParam()).toBe("2")

    // A search is a new question, so its answer starts on the first page.
    await screen.getByRole("searchbox", { name: "Search members" }).fill("a")
    await expect.poll(pageParam).toBeNull()
    expect(bodyNames()).toEqual(["Maya Okafor", "Priya Raman"])
  })

  it("moves a page past the last one back to the last once rows load", async () => {
    setSearch({ page: "9" })
    const screen = await render(<LatePage members={[]} />)
    await settle()
    await screen.rerender(<LatePage members={MEMBERS} />)
    await expect.poll(bodyNames).toEqual(["Sam Whitfield"])
    await expect.poll(pageParam).toBe("3")
  })

  it("writes changes back without adding history entries", async () => {
    const entries = window.history.length
    const screen = await render(<UrlExample />)
    await screen.getByRole("searchbox", { name: "Search members" }).fill("sam")
    await expect
      .poll(() => new URLSearchParams(window.location.search).get("q"))
      .toBe("sam")
    await screen.getByRole("button", { name: "Member" }).click()
    await expect
      .poll(() => new URLSearchParams(window.location.search).get("sort"))
      .toBe("name.asc")
    expect(window.history.length).toBe(entries)

    // Clearing the search takes its param out of the URL.
    await screen.getByRole("searchbox", { name: "Search members" }).fill("")
    await expect
      .poll(() => new URLSearchParams(window.location.search).has("q"))
      .toBe(false)
  })

  it("follows back and forward", async () => {
    const screen = await render(<UrlExample />)
    setSearch({ q: "jordan" })
    window.dispatchEvent(new PopStateEvent("popstate"))
    await expect
      .element(screen.getByRole("searchbox", { name: "Search members" }))
      .toHaveValue("jordan")
    await expect.poll(bodyNames).toEqual(["Jordan Alvarez"])
  })

  it("round-trips sorting and pages through their codecs", () => {
    const sorting = [
      { id: "name", desc: false },
      { id: "projects", desc: true },
    ]
    const text = dataTableCodecs.sorting.serialize(sorting)
    expect(text).toBe("name.asc,projects.desc")
    expect(dataTableCodecs.sorting.parse(text)).toEqual(sorting)
    expect(dataTableCodecs.sorting.parse(null)).toEqual([])

    const pages = dataTableCodecs.pagination(25)
    expect(pages.parse("3")).toEqual({ pageIndex: 2, pageSize: 25 })
    expect(pages.parse("nonsense")).toEqual({ pageIndex: 0, pageSize: 25 })
    expect(pages.serialize({ pageIndex: 0, pageSize: 25 })).toBeNull()

    expect(dataTableCodecs.columnFilters.parse("{broken")).toEqual([])
  })

  it("drops malformed column filters from a link instead of throwing", () => {
    const { parse } = dataTableCodecs.columnFilters
    for (const text of [
      "[null]",
      '[1, "team"]',
      '[{"value":["Design"]}]',
      '[{"id":3,"value":["Design"]}]',
      '[{"id":"team"}]',
      '[{"id":"team","value":null}]',
      '[{"id":"team","value":{"nested":true}}]',
      '[{"id":"team","value":[["Design"]]}]',
      '{"id":"team","value":["Design"]}',
      "null",
    ]) {
      expect(parse(text), text).toEqual([])
    }
    expect(
      parse('[null,{"id":"team","value":["Design"]},{"id":"team","value":7}]')
    ).toEqual([{ id: "team", value: ["Design"] }])
    expect(parse('[{"id":"team","value":"Design"}]')).toEqual([
      { id: "team", value: "Design" },
    ])
  })

  it("filters on a lone value from a link as a list of one", async () => {
    setSearch({ filters: '[{"id":"team","value":"Engineering"}]' })
    function Filtered() {
      const columnFilters = useSearchParamsAtom(
        "filters",
        dataTableCodecs.columnFilters
      )
      return <Example atoms={{ columnFilters }} />
    }
    await render(<Filtered />)
    await expect.poll(bodyNames).toEqual(["Priya Raman", "Sam Whitfield"])
  })

  it("renders every row for a filters param it can't read", async () => {
    setSearch({ filters: "[null]" })
    function Filtered() {
      const columnFilters = useSearchParamsAtom(
        "filters",
        dataTableCodecs.columnFilters
      )
      return <Example atoms={{ columnFilters }} />
    }
    await render(<Filtered />)
    await expect.poll(bodyNames).toHaveLength(5)
  })

  it("reads only well-formed sorting from a link", () => {
    const { parse } = dataTableCodecs.sorting
    expect(parse(".asc,,name.sideways")).toEqual([
      { id: "name.sideways", desc: false },
    ])
    expect(parse("name.desc,name.asc,team")).toEqual([
      { id: "name", desc: true },
      { id: "team", desc: false },
    ])
  })

  it("reads only a whole, safe page number from a link", () => {
    const pages = dataTableCodecs.pagination(25)
    for (const text of [
      "-3",
      "0",
      "2.5",
      "2abc",
      "1e3",
      "NaN",
      "Infinity",
      "99999999999999999999",
      " 2",
    ]) {
      expect(pages.parse(text), text).toEqual({ pageIndex: 0, pageSize: 25 })
    }
    expect(pages.parse("12")).toEqual({ pageIndex: 11, pageSize: 25 })
    expect(pages.serialize({ pageIndex: NaN, pageSize: 25 })).toBeNull()
    expect(pages.serialize({ pageIndex: -1, pageSize: 25 })).toBeNull()
    // A size the table can't page by shows every row rather than none.
    expect(dataTableCodecs.pagination(0).parse("2").pageSize).toBe(Infinity)
    expect(dataTableCodecs.pagination(NaN).parse("2").pageSize).toBe(Infinity)
  })
})

describe("the deprecated props, on the same table", () => {
  // The same clicks through rowIds and value, and through useDataTable, end
  // in the same selection and the same words.
  async function legacyRun() {
    const onValueChange = vi.fn()
    const screen = await render(
      <div style={{ width: 800 }}>
        <DataTable
          aria-label="Members"
          rowIds={MEMBERS.map((row) => row.id)}
          noun={NOUN}
          onValueChange={onValueChange}
        >
          <DataTableToolbar />
          <DataTableContent>
            <DataTableHeader>
              <DataTableHead type="primary">Member</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              {MEMBERS.map((row) => (
                <DataTableRow key={row.id} id={row.id} lockedReason={row.lock}>
                  <DataTableCell type="primary">{row.name}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableContent>
        </DataTable>
      </div>
    )
    return { screen, selected: () => onValueChange.mock.lastCall?.[0] }
  }

  async function modelRun() {
    let last: DataTableSelection | undefined
    function Controlled() {
      const [rowSelection, setRowSelection] = React.useState({})
      const table = useDataTable({
        data: MEMBERS,
        columns: COLUMNS,
        lockedReason: (row) => row.lock,
        state: { rowSelection },
        onRowSelectionChange: (updater) =>
          setRowSelection((old) => {
            const next = typeof updater === "function" ? updater(old) : updater
            last = new Set(Object.keys(next))
            return next
          }),
      })
      return (
        <div style={{ width: 800 }}>
          <DataTable table={table} aria-label="Members" noun={NOUN}>
            <DataTableToolbar />
            <DataTableContent />
          </DataTable>
        </div>
      )
    }
    const screen = await render(<Controlled />)
    return { screen, selected: () => last }
  }

  for (const [name, run] of [
    ["rowIds and value", legacyRun],
    ["useDataTable", modelRun],
  ] as const) {
    it(`selects, ranges and clears the same way through ${name}`, async () => {
      const { screen, selected } = await run()
      const status = screen.getByRole("status")

      await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
      expect(selected()).toEqual(new Set(["priya"]))
      await expect.element(status).toHaveTextContent("1 member selected")

      await userEvent.keyboard("{Shift>}")
      await screen
        .getByRole("checkbox", { name: "Select Sam Whitfield" })
        .click()
      await userEvent.keyboard("{/Shift}")
      expect(selected()).toEqual(new Set(["priya", "jordan", "sam"]))
      await expect.element(status).toHaveTextContent("3 members selected")

      await screen.getByRole("checkbox", { name: /Select all/ }).click()
      expect(selected()).toEqual(new Set(["maya", "priya", "jordan", "sam"]))
      await expect
        .element(screen.getByRole("checkbox", { name: /Select all/ }))
        .toHaveAttribute("aria-checked", "true")

      await screen.getByRole("button", { name: "Clear selection" }).click()
      expect(selected()).toEqual(new Set())
      await expect.element(status).toHaveTextContent("Selection cleared")
      await expect
        .element(screen.getByRole("checkbox", { name: /Select all/ }))
        .toHaveFocus()
    })
  }
})
