import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import {
  createDataTableColumnHelper,
  DataTable,
  DataTableContent,
  DataTableFooter,
  DataTableSelectionCount,
  useDataTable,
} from "./data-table.js"

type Member = { id: string; name: string; lock?: string }

const MEMBERS: Member[] = [
  { id: "maya", name: "Maya Okafor" },
  { id: "priya", name: "Priya Raman" },
  { id: "jordan", name: "Jordan Alvarez" },
  {
    id: "elena",
    name: "Elena Marsh",
    lock: "The workspace owner can't be removed",
  },
  { id: "sam", name: "Sam Whitfield" },
]

const member = createDataTableColumnHelper<Member>()
const COLUMNS = member.columns([
  member.accessor("name", { header: "Member", meta: { type: "primary" } }),
])

function Example({ members = MEMBERS }: { members?: Member[] }) {
  const table = useDataTable({
    data: members,
    columns: COLUMNS,
    lockedReason: (row) => row.lock,
  })
  return (
    <DataTable
      aria-label="Members"
      table={table}
      noun={{ one: "member", other: "members" }}
    >
      <DataTableContent />
      <DataTableFooter>
        <DataTableSelectionCount />
      </DataTableFooter>
    </DataTable>
  )
}

describe("DataTable", () => {
  it("names each row checkbox after its primary cell", async () => {
    const screen = await render(<Example />)
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Maya Okafor" }))
      .toBeInTheDocument()
    await expect
      .element(
        screen.getByRole("checkbox", {
          name: "Select all members on this page",
        })
      )
      .toBeInTheDocument()
  })

  it("marks the header mixed when some rows are selected", async () => {
    const screen = await render(<Example />)
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    await expect
      .element(screen.getByRole("checkbox", { name: /Select all/ }))
      .toHaveAttribute("aria-checked", "mixed")
    await expect
      .element(screen.getByText("1 of 5 members selected"))
      .toBeInTheDocument()
  })

  it("selects every row but the locked one from the header", async () => {
    const screen = await render(<Example />)
    const header = screen.getByRole("checkbox", { name: /Select all/ })
    await header.click()
    await expect.element(header).toHaveAttribute("aria-checked", "true")
    await expect
      .element(screen.getByText("4 of 5 members selected"))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Elena Marsh" }))
      .not.toBeChecked()

    await header.click()
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Maya Okafor" }))
      .not.toBeChecked()
  })

  it("disables select all when every row is locked", async () => {
    const screen = await render(<Example members={MEMBERS.slice(3, 4)} />)
    await expect
      .element(screen.getByRole("checkbox", { name: /Select all/ }))
      .toBeDisabled()
  })

  it("names the checkbox from the first name cell only", async () => {
    type Task = { id: string; title: string; owner: string }
    const task = createDataTableColumnHelper<Task>()
    const columns = task.columns([
      task.accessor("title", { header: "Task", meta: { type: "primary" } }),
      task.accessor("owner", {
        header: "Owner",
        meta: { type: "person", avatar: () => ({ fallback: "MO" }) },
      }),
    ])
    function Tasks() {
      const table = useDataTable({
        data: [{ id: "task", title: "Design review", owner: "Maya Okafor" }],
        columns,
      })
      return (
        <DataTable aria-label="Tasks" table={table}>
          <DataTableContent />
        </DataTable>
      )
    }
    const screen = await render(<Tasks />)
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Design review" }))
      .toBeInTheDocument()
    const named = screen.container.querySelectorAll("[data-row-name][id]")
    expect(named).toHaveLength(1)
  })

  it("moves focus on when the focused row goes", async () => {
    const screen = await render(<Example />)
    screen
      .getByRole("checkbox", { name: "Select Maya Okafor" })
      .element()
      .focus()
    await screen.rerender(<Example members={MEMBERS.slice(1)} />)
    await expect
      .element(
        screen.getByRole("checkbox", {
          name: "Select all members on this page",
        })
      )
      .toHaveFocus()
  })

  it("doesn't pull focus back once someone has left the table", async () => {
    // Long enough for the frames a closing menu is given to hand focus back.
    const frames = () => new Promise((resolve) => setTimeout(resolve, 100))
    const screen = await render(<Example />)
    const box = screen
      .getByRole("checkbox", { name: "Select Maya Okafor" })
      .element() as HTMLElement
    box.focus()
    box.blur()
    await frames()
    await screen.rerender(<Example members={MEMBERS.slice(1)} />)
    await frames()
    expect(document.activeElement).toBe(document.body)
  })
})
