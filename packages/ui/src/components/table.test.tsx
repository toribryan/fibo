import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import { Table, TableBody, TableCaption, TableCell, TableRow } from "./table.js"

function Example({
  width,
  cellWidth,
  label,
  caption,
}: {
  width: number
  cellWidth: number
  label?: string
  caption?: string
}) {
  return (
    <div style={{ width }}>
      <Table aria-label={label}>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
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

  it("names the region or the table with its label, never both", async () => {
    const screen = await render(
      <Example width={200} cellWidth={600} label="Members" />
    )
    await expect
      .element(screen.getByRole("region", { name: "Members" }))
      .toBeInTheDocument()
    expect(
      screen.container.querySelector("table")?.hasAttribute("aria-label")
    ).toBe(false)
    await screen.rerender(
      <Example width={400} cellWidth={100} label="Members" />
    )
    await expect
      .element(screen.getByRole("table", { name: "Members" }))
      .toBeInTheDocument()
  })

  it("names an overflowing region after its caption", async () => {
    const screen = await render(
      <Example width={200} cellWidth={600} caption="Members of Acme." />
    )
    await expect
      .element(screen.getByRole("region", { name: "Members of Acme." }))
      .toBeInTheDocument()
  })
})
