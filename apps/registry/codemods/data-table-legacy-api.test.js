import jscodeshift from "jscodeshift"
import { describe, expect, it, vi } from "vitest"

import transform from "./data-table-legacy-api.js"

// Runs the transform and returns what it reported. It must never change a
// file, so a non-null result fails the test.
function reports(source) {
  const report = vi.fn()
  const j = jscodeshift.withParser("tsx")
  const output = transform(
    { source, path: "members.tsx" },
    { jscodeshift: j, j, stats: () => {}, report }
  )
  expect(output).toBeNull()
  return report.mock.calls.map(([message]) => message)
}

describe("data-table-legacy-api", () => {
  it("reports each deprecated root prop with its line", () => {
    const found =
      reports(`import { DataTable } from "@/components/ui/data-table"

export const Members = () => (
  <DataTable
    rowIds={ids}
    totalCount={248}
    value={value}
    defaultValue={new Set()}
    onValueChange={setValue}
    noun={noun}
  />
)
`)
    expect(found).toEqual([
      expect.stringMatching(/^members\.tsx:5 <DataTable rowIds> is deprecated/),
      expect.stringMatching(/^members\.tsx:6 <DataTable totalCount>/),
      expect.stringMatching(/^members\.tsx:7 <DataTable value>/),
      expect.stringMatching(/^members\.tsx:8 <DataTable defaultValue>/),
      expect.stringMatching(/^members\.tsx:9 <DataTable onValueChange>/),
    ])
  })

  it("leaves a root that already has table alone", () => {
    expect(
      reports(`import { DataTable } from "@/components/ui/data-table"
const a = <DataTable table={table} noun={noun} />
`)
    ).toEqual([])
  })

  it("reports hand-written rows, cells and heads", () => {
    const found = reports(`import {
  DataTableCell,
  DataTableHead,
  DataTableRow,
} from "~/ui/data-table"
const a = <DataTableHead type="primary">Name</DataTableHead>
const b = (
  <DataTableRow id="maya">
    <DataTableCell type="primary">Maya</DataTableCell>
  </DataTableRow>
)
`)
    expect(found).toEqual([
      expect.stringContaining(
        "members.tsx:6 <DataTableHead> is a hand-written head"
      ),
      expect.stringContaining(
        "members.tsx:8 <DataTableRow> is a hand-written row"
      ),
      expect.stringContaining(
        "members.tsx:9 <DataTableCell> is a hand-written cell"
      ),
    ])
  })

  it("follows renamed imports", () => {
    const found =
      reports(`import { DataTable as Grid, DataTableRow as Row } from "@/components/ui/data-table"
const a = <Grid rowIds={ids}><Row id="a" /></Grid>
`)
    expect(found).toEqual([
      expect.stringContaining("members.tsx:2 <Grid rowIds>"),
      expect.stringContaining("members.tsx:2 <Row>"),
    ])
  })

  it("asks for a look at a spread on a root with no table", () => {
    const found =
      reports(`import { DataTable } from "@/components/ui/data-table"
const a = <DataTable {...selection} noun={noun} />
`)
    expect(found).toEqual([
      expect.stringContaining("members.tsx:2 <DataTable> has a spread"),
    ])
  })

  it("reports the selection hook and type", () => {
    const found = reports(`import {
  useDataTableSelection,
  type DataTableSelection,
} from "@/components/ui/data-table"
const selection = useDataTableSelection()
let value: DataTableSelection = "all"
`)
    expect(found).toEqual([
      expect.stringContaining(
        "members.tsx:5 useDataTableSelection() is deprecated"
      ),
      expect.stringContaining("members.tsx:6 DataTableSelection is deprecated"),
    ])
  })

  it("ignores files that don't import Data table", () => {
    expect(
      reports(`import { DataTable } from "some-other-grid"
const a = <DataTable rowIds={ids} />
`)
    ).toEqual([])
  })
})
