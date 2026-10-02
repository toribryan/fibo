import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import { Table, TableBody, TableCell, TableRow } from "./table.js"

function Example({ width, cellWidth }: { width: number; cellWidth: number }) {
  return (
    <div style={{ width }}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <div style={{ width: cellWidth }}>Maya Okafor</div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

describe("Table", () => {
  it("stays out of the tab order when it fits", async () => {
    const screen = await render(<Example width={400} cellWidth={100} />)
    const container = screen.container.querySelector(
      '[data-slot="table-container"]'
    )
    await expect.poll(() => container?.hasAttribute("tabindex")).toBe(false)
  })

  it("joins the tab order while it overflows", async () => {
    const screen = await render(<Example width={200} cellWidth={600} />)
    const container = screen.container.querySelector(
      '[data-slot="table-container"]'
    )
    await expect.poll(() => container?.getAttribute("tabindex")).toBe("0")
  })
})
