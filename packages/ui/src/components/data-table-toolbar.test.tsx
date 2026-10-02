import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Button } from "./button.js"
import {
  DataTable,
  DataTableActions,
  DataTableBody,
  DataTableBulkAction,
  DataTableBulkActions,
  DataTableCell,
  DataTableContent,
  DataTableFilters,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableToolbar,
  type DataTableSelection,
} from "./data-table.js"
import { MenuItem } from "./menu.js"

const AGENTS = [
  { id: "maya", name: "Maya Okafor" },
  { id: "priya", name: "Priya Raman" },
  { id: "elena", name: "Elena Marsh", lock: "Admins can't be removed" },
]

function Example({
  onDelete = () => {},
  onValueChange,
  onShowSelectedOnlyChange,
  showSelectedOnly,
  totalCount,
  bulk,
  bulkActions,
}: {
  onDelete?: () => void
  onValueChange?: (value: DataTableSelection) => void
  onShowSelectedOnlyChange?: (value: boolean) => void
  showSelectedOnly?: boolean
  totalCount?: number
  bulk?: React.ReactNode
  bulkActions?: React.ReactNode
}) {
  return (
    <DataTable
      aria-label="Agents"
      rowIds={AGENTS.map((agent) => agent.id)}
      noun={{ one: "agent", other: "agents" }}
      totalCount={totalCount}
      onValueChange={onValueChange}
      showSelectedOnly={showSelectedOnly}
      onShowSelectedOnlyChange={onShowSelectedOnlyChange}
    >
      <DataTableToolbar>
        <DataTableFilters>
          <input aria-label="Search agents" />
        </DataTableFilters>
        <DataTableActions>
          <Button size="sm">Add agent</Button>
        </DataTableActions>
        {bulkActions ?? (
          <DataTableBulkActions onDelete={onDelete}>
            {bulk}
          </DataTableBulkActions>
        )}
      </DataTableToolbar>
      <DataTableContent>
        <DataTableHeader>
          <DataTableHead type="primary">Agent</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {AGENTS.map((agent) => (
            <DataTableRow
              key={agent.id}
              id={agent.id}
              lockedReason={agent.lock}
            >
              <DataTableCell type="primary">{agent.name}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTableContent>
    </DataTable>
  )
}

describe("DataTableToolbar", () => {
  it("swaps filters and actions for the selection while rows are selected", async () => {
    const screen = await render(<Example />)
    await expect
      .element(screen.getByRole("button", { name: "Add agent" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("button", { name: "Delete" }))
      .not.toBeInTheDocument()

    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("1 agent selected")
    await expect
      .element(screen.getByRole("textbox", { name: "Search agents" }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole("button", { name: "Delete" }))
      .toBeInTheDocument()
  })

  it("clears and hands focus to select all", async () => {
    const onValueChange = vi.fn()
    const screen = await render(<Example onValueChange={onValueChange} />)
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    await screen.getByRole("button", { name: "Clear selection" }).click()
    expect(onValueChange).toHaveBeenLastCalledWith(new Set())
    await expect
      .element(screen.getByRole("checkbox", { name: /Select all/ }))
      .toHaveFocus()
  })

  it("offers every matching row once the page is selected", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Example totalCount={248} onValueChange={onValueChange} />
    )
    await screen.getByRole("checkbox", { name: /Select all/ }).click()
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("2 agents selected")
    await screen.getByRole("button", { name: "Select all 247 agents" }).click()
    expect(onValueChange).toHaveBeenLastCalledWith("all")
    await expect
      .element(screen.getByRole("group", { name: "Bulk actions" }))
      .toHaveTextContent("All 247 agents selected")
    await expect
      .element(screen.getByRole("button", { name: /Select all 247/ }))
      .not.toBeInTheDocument()
    // Its button is gone, so focus moves to Clear rather than the page.
    await expect
      .element(screen.getByRole("button", { name: "Clear selection" }))
      .toHaveFocus()
  })

  it("doesn't offer every matching row when the page is all there is", async () => {
    const screen = await render(<Example />)
    await screen.getByRole("checkbox", { name: /Select all/ }).click()
    await expect
      .element(screen.getByRole("button", { name: /Select all \d/ }))
      .not.toBeInTheDocument()
  })

  it("keeps Delete last, after the other actions and More", async () => {
    const onDelete = vi.fn()
    const screen = await render(
      <Example
        onDelete={onDelete}
        bulk={
          <>
            <DataTableBulkAction>Export</DataTableBulkAction>
          </>
        }
      />
    )
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    const names = screen
      .getByRole("group", { name: "Bulk actions" })
      .element()
      .querySelectorAll('[data-slot="data-table-bulk-actions"] button')
    expect([...names].map((button) => button.textContent)).toEqual([
      "Export",
      "Delete",
    ])
    await screen.getByRole("button", { name: "Delete" }).click()
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it("dims a single-row action while more than one row is selected", async () => {
    const screen = await render(
      <Example bulk={<DataTableBulkAction single>Edit</DataTableBulkAction>} />
    )
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    const edit = screen.getByRole("button", { name: "Edit" })
    await expect.element(edit).not.toHaveAttribute("aria-disabled", "true")
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    await expect.element(edit).toHaveAttribute("aria-disabled", "true")
    await expect
      .element(edit)
      .toHaveAccessibleDescription("Works on one agent at a time")
  })

  it("puts More between the actions and Delete", async () => {
    const screen = await render(
      <Example
        bulkActions={
          <DataTableBulkActions
            moreActions={<MenuItem>Add skill</MenuItem>}
            onDelete={() => {}}
          />
        }
      />
    )
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await screen.getByRole("button", { name: "More actions" }).click()
    await expect
      .element(page.getByRole("menuitem", { name: "Add skill" }))
      .toBeVisible()
  })

  it("turns Show selected only off when the selection is cleared", async () => {
    const onShowSelectedOnlyChange = vi.fn()
    const screen = await render(
      <Example
        showSelectedOnly
        onShowSelectedOnlyChange={onShowSelectedOnlyChange}
      />
    )
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await expect
      .element(screen.getByRole("checkbox", { name: "Show selected only" }))
      .toBeChecked()
    await screen.getByRole("button", { name: "Clear selection" }).click()
    expect(onShowSelectedOnlyChange).toHaveBeenLastCalledWith(false)
  })

  it("leaves out the divider when the only other action renders nothing", async () => {
    const screen = await render(<Example bulk={false} />)
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    const divider = screen
      .getByRole("group", { name: "Bulk actions" })
      .element()
      .querySelector(
        '[data-slot="data-table-bulk-actions"] > span[aria-hidden]'
      )
    expect(divider).toBeNull()
  })

  it("keeps focus on a single-row action as the count crosses one", async () => {
    const screen = await render(
      <Example bulk={<DataTableBulkAction single>Edit</DataTableBulkAction>} />
    )
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    const edit = screen.getByRole("button", { name: "Edit" })
    edit.element().focus()
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    await expect.element(edit).not.toHaveAttribute("aria-disabled", "true")
    expect(edit.element().isConnected).toBe(true)
  })
})
