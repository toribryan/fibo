import { describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

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

const AGENTS = [
  { id: "maya", name: "Maya Okafor" },
  { id: "priya", name: "Priya Raman" },
  { id: "jordan", name: "Jordan Alvarez" },
  {
    id: "elena",
    name: "Elena Marsh",
    lock: "Workforce admins can't be removed",
  },
  { id: "sam", name: "Sam Whitfield" },
]

function Example(props: {
  value?: DataTableSelection
  defaultValue?: DataTableSelection
  onValueChange?: (value: DataTableSelection) => void
  totalCount?: number
}) {
  return (
    <DataTable
      aria-label="Agents"
      rowIds={AGENTS.map((agent) => agent.id)}
      noun={{ one: "agent", other: "agents" }}
      {...props}
    >
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
        screen.getByRole("checkbox", { name: "Select all agents on this page" })
      )
      .toBeInTheDocument()
  })

  it("marks the header mixed when some rows are selected", async () => {
    const onValueChange = vi.fn()
    const screen = await render(<Example onValueChange={onValueChange} />)
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    expect(onValueChange).toHaveBeenLastCalledWith(new Set(["priya"]))
    await expect
      .element(screen.getByRole("checkbox", { name: /Select all/ }))
      .toHaveAttribute("aria-checked", "mixed")
    await expect
      .element(screen.getByText("1 of 5 agents selected"))
      .toBeInTheDocument()
  })

  it("selects every row but the locked one from the header", async () => {
    const onValueChange = vi.fn()
    const screen = await render(<Example onValueChange={onValueChange} />)
    const header = screen.getByRole("checkbox", { name: /Select all/ })
    await header.click()
    expect(onValueChange).toHaveBeenLastCalledWith(
      new Set(["maya", "priya", "jordan", "sam"])
    )
    await expect.element(header).toHaveAttribute("aria-checked", "true")

    await header.click()
    expect(onValueChange).toHaveBeenLastCalledWith(new Set())
  })

  it("explains a locked row and won't select it", async () => {
    const screen = await render(<Example />)
    const elena = screen.getByRole("checkbox", { name: "Select Elena Marsh" })
    await expect.element(elena).toBeDisabled()
    await expect
      .element(elena)
      .toHaveAccessibleDescription("Workforce admins can't be removed")
    await expect
      .element(screen.getByRole("button", { name: "Locked" }))
      .toHaveAccessibleDescription("Workforce admins can't be removed")
  })

  it("selects a range with Shift, skipping locked rows", async () => {
    const onValueChange = vi.fn()
    const screen = await render(<Example onValueChange={onValueChange} />)
    await screen.getByRole("checkbox", { name: "Select Priya Raman" }).click()
    await userEvent.keyboard("{Shift>}")
    await screen.getByRole("checkbox", { name: "Select Sam Whitfield" }).click()
    await userEvent.keyboard("{/Shift}")
    expect(onValueChange).toHaveBeenLastCalledWith(
      new Set(["priya", "jordan", "sam"])
    )
  })

  it("clears the selection on Escape", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Example
        defaultValue={new Set(["maya", "sam"])}
        onValueChange={onValueChange}
      />
    )
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await userEvent.keyboard("{Escape}")
    expect(onValueChange).toHaveBeenLastCalledWith(new Set())
    await expect
      .element(screen.getByText("Selection cleared"))
      .toBeInTheDocument()
  })

  it("treats all as every unlocked row, and drops to this page on a change", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Example
        defaultValue="all"
        totalCount={248}
        onValueChange={onValueChange}
      />
    )
    await expect
      .element(screen.getByText("247 of 248 agents selected"))
      .toBeInTheDocument()
    await screen
      .getByRole("checkbox", { name: "Select Jordan Alvarez" })
      .click()
    expect(onValueChange).toHaveBeenLastCalledWith(
      new Set(["maya", "priya", "sam"])
    )
  })

  it("keeps a controlled selection until the parent changes it", async () => {
    const onValueChange = vi.fn()
    const screen = await render(
      <Example value={new Set()} onValueChange={onValueChange} />
    )
    const maya = screen.getByRole("checkbox", { name: "Select Maya Okafor" })
    await maya.click()
    expect(onValueChange).toHaveBeenLastCalledWith(new Set(["maya"]))
    await expect.element(maya).toHaveAttribute("aria-checked", "false")
  })

  it("disables select all when every row is locked", async () => {
    const screen = await render(
      <DataTable aria-label="Admins" rowIds={["elena"]}>
        <DataTableContent>
          <DataTableHeader>
            <DataTableHead type="primary">Agent</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            <DataTableRow id="elena" lockedReason="Admins can't be removed">
              <DataTableCell type="primary">Elena Marsh</DataTableCell>
            </DataTableRow>
          </DataTableBody>
        </DataTableContent>
      </DataTable>
    )
    await expect
      .element(screen.getByRole("checkbox", { name: /Select all/ }))
      .toBeDisabled()
  })

  it("leaves locked rows out of what it announces", async () => {
    const screen = await render(<Example defaultValue={new Set(["elena"])} />)
    await screen.getByRole("checkbox", { name: "Select Maya Okafor" }).click()
    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("1 agent selected")
  })

  it("names the checkbox from the first name cell only", async () => {
    const screen = await render(
      <DataTable aria-label="Cases" rowIds={["case"]}>
        <DataTableContent>
          <DataTableHeader>
            <DataTableHead type="primary">Case</DataTableHead>
            <DataTableHead type="person">Owner</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            <DataTableRow id="case">
              <DataTableCell type="primary">Refund request</DataTableCell>
              <DataTableCell type="person" avatar={{ fallback: "MO" }}>
                Maya Okafor
              </DataTableCell>
            </DataTableRow>
          </DataTableBody>
        </DataTableContent>
      </DataTable>
    )
    await expect
      .element(screen.getByRole("checkbox", { name: "Select Refund request" }))
      .toBeInTheDocument()
    const named = screen.container.querySelectorAll("[data-row-name][id]")
    expect(named).toHaveLength(1)
  })
})
