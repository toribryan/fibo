import { PlusIcon } from "lucide-react"
import { describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Button } from "./button.js"
import {
  DataTable,
  DataTableAction,
  DataTableActions,
  DataTableBody,
  DataTableBulkActions,
  DataTableCard,
  DataTableCardField,
  DataTableCards,
  DataTableCell,
  DataTableContent,
  DataTableFilters,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableToolbar,
  type DataTableNarrowLayout,
  type DataTableSelection,
} from "./data-table.js"

const MEMBERS = [
  { id: "maya", name: "Maya Okafor", team: "Design" },
  { id: "priya", name: "Priya Raman", team: "Engineering" },
  {
    id: "elena",
    name: "Elena Marsh",
    team: "Operations",
    lock: "The workspace owner can't be removed",
  },
]

function Example({
  width,
  narrowLayout,
  onValueChange,
}: {
  width: number
  narrowLayout?: DataTableNarrowLayout
  onValueChange?: (value: DataTableSelection) => void
}) {
  return (
    <div style={{ width }}>
      <DataTable
        aria-label="Members"
        rowIds={MEMBERS.map((member) => member.id)}
        noun={{ one: "member", other: "members" }}
        narrowLayout={narrowLayout}
        onValueChange={onValueChange}
      >
        <DataTableToolbar>
          <DataTableFilters search={<input aria-label="Search members" />}>
            <Button size="sm">Sort</Button>
          </DataTableFilters>
          <DataTableActions>
            <DataTableAction icon={<PlusIcon />}>Add member</DataTableAction>
          </DataTableActions>
          <DataTableBulkActions onDelete={() => {}} />
        </DataTableToolbar>
        <DataTableContent>
          <DataTableHeader>
            <DataTableHead type="primary">Member</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {MEMBERS.map((member) => (
              <DataTableRow
                key={member.id}
                id={member.id}
                lockedReason={member.lock}
              >
                <DataTableCell type="primary">{member.name}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTableContent>
        <DataTableCards>
          {MEMBERS.map((member) => (
            <DataTableCard
              key={member.id}
              id={member.id}
              title={member.name}
              lockedReason={member.lock}
            >
              <DataTableCardField label="Team">
                {member.team}
              </DataTableCardField>
            </DataTableCard>
          ))}
        </DataTableCards>
      </DataTable>
    </div>
  )
}

describe("DataTable at narrow widths", () => {
  it("keeps everything inline when it's wide", async () => {
    const screen = await render(<Example width={800} narrowLayout="cards" />)
    await expect
      .element(screen.getByRole("button", { name: "Sort" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("button", { name: "Add member" }))
      .toHaveTextContent("Add member")
    await expect.element(screen.getByRole("table")).toBeInTheDocument()
    await expect.element(screen.getByRole("list")).not.toBeInTheDocument()
  })

  it("moves filters into a sheet and keeps the search", async () => {
    const screen = await render(<Example width={360} />)
    await expect
      .element(screen.getByRole("textbox", { name: "Search members" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("button", { name: "Sort" }))
      .not.toBeInTheDocument()
    await screen.getByRole("button", { name: "Filters" }).click()
    const sheet = page.getByRole("dialog", { name: "Filters" })
    await expect.element(sheet).toBeVisible()
    await expect
      .element(sheet.getByRole("button", { name: "Sort" }))
      .toBeVisible()
  })

  it("shrinks actions to their icons, named by their labels", async () => {
    const screen = await render(<Example width={360} />)
    const add = screen.getByRole("button", { name: "Add member" })
    await expect.element(add).toBeInTheDocument()
    await expect.element(add).not.toHaveTextContent("Add member")

    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    const remove = screen.getByRole("button", { name: "Delete" })
    await expect.element(remove).not.toHaveTextContent("Delete")
  })

  it("keeps the table, scrolling, by default", async () => {
    const screen = await render(<Example width={360} />)
    await expect.element(screen.getByRole("table")).toBeInTheDocument()
    await expect.element(screen.getByRole("list")).not.toBeInTheDocument()
  })

  it("swaps rows for cards, with select all in the toolbar", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Example width={360} narrowLayout="cards" onValueChange={onValueChange} />
    )
    await expect.element(screen.getByRole("table")).not.toBeInTheDocument()
    await expect.element(screen.getByRole("list")).toBeInTheDocument()
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Elena Marsh" }))
      .toBeDisabled()

    await screen
      .getByRole("checkbox", { name: "Select all members on this page" })
      .click()
    expect(onValueChange).toHaveBeenLastCalledWith(new Set(["maya", "priya"]))
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Maya Okafor" }))
      .toBeChecked()
  })

  it("follows a focused row to its card when the table narrows", async () => {
    const screen = await render(<Example width={800} narrowLayout="cards" />)
    const maya = screen.getByRole("checkbox", { name: "Select Maya Okafor" })
    maya.element().focus()
    await screen.rerender(<Example width={360} narrowLayout="cards" />)
    await expect.element(screen.getByRole("list")).toBeInTheDocument()
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Maya Okafor" }))
      .toHaveFocus()
  })

  it("keeps the Filters sheet's controls mounted after it closes", async () => {
    const screen = await render(<Example width={360} />)
    await screen.getByRole("button", { name: "Filters" }).click()
    await expect
      .element(page.getByRole("dialog", { name: "Filters" }))
      .toBeVisible()
    await page.getByRole("button", { name: "Close" }).click()
    await expect
      .element(page.getByRole("dialog", { name: "Filters" }))
      .not.toBeInTheDocument()
    expect(
      document.querySelector('[data-slot="data-table-filters-sheet"]')
    ).not.toBeNull()
  })
})
