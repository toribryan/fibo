// Lists every use of Data table's deprecated API, with file and line, so the
// move to useDataTable can be planned. It changes nothing: turning rowIds
// and hand-written rows into column definitions needs a person.
//
//   pnpm dlx jscodeshift --parser tsx --dry \
//     -t https://fibo.toribryan.com/codemods/data-table-legacy-api.js src
//
// Self-contained on purpose: jscodeshift downloads a remote transform to a
// temp file, so it cannot import anything beside it.

const ROOT_PROPS = {
  rowIds: "pass `table` from useDataTable; its `data` sets the rows",
  totalCount: "use useDataTable's `manualPagination` with `rowCount`",
  value: "use useDataTable's `state.rowSelection` with `onRowSelectionChange`",
  defaultValue: "use useDataTable's `initialState.rowSelection`",
  onValueChange: "use useDataTable's `onRowSelectionChange`",
}

const PARTS = {
  DataTableRow:
    "a hand-written row; give useDataTable `data` and `columns` and let DataTableBody render them",
  DataTableCell:
    "a hand-written cell; give the column `meta: { type }` and a `cell` renderer",
  DataTableHead:
    "a hand-written head; give the column a `header` and `meta: { type }`, and pin it with `columnPinning`",
}

export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  const report = (node, message) =>
    api.report(`${file.path}:${node.loc?.start.line ?? "?"} ${message}`)

  // Local name -> exported name, for every import from a data-table module.
  const locals = new Map()
  root
    .find(j.ImportDeclaration)
    .filter((path) => /(^|\/)data-table(\.js)?$/.test(path.node.source.value))
    .forEach((path) => {
      for (const specifier of path.node.specifiers ?? []) {
        if (specifier.type === "ImportSpecifier") {
          locals.set(specifier.local.name, specifier.imported.name)
        }
      }
    })
  if (locals.size === 0) return null

  root.find(j.JSXOpeningElement).forEach((path) => {
    const name = path.node.name.type === "JSXIdentifier" && path.node.name.name
    const exported = name && locals.get(name)
    if (!exported) return

    if (exported === "DataTable") {
      const attributes = path.node.attributes ?? []
      const named = (attribute) =>
        attribute.type === "JSXAttribute" ? attribute.name.name : null
      if (attributes.some((attribute) => named(attribute) === "table")) return
      for (const attribute of attributes) {
        const prop = named(attribute)
        if (prop && ROOT_PROPS[prop]) {
          report(
            attribute,
            `<${name} ${prop}> is deprecated: ${ROOT_PROPS[prop]}`
          )
        } else if (attribute.type === "JSXSpreadAttribute") {
          report(
            attribute,
            `<${name}> has a spread with no table; check it for rowIds or value`
          )
        }
      }
      return
    }

    if (PARTS[exported]) {
      report(path.node, `<${name}> is ${PARTS[exported]}`)
    }
  })

  for (const [local, exported] of locals) {
    if (exported === "useDataTableSelection") {
      root
        .find(j.CallExpression, { callee: { name: local } })
        .forEach((path) =>
          report(
            path.node,
            `${local}() is deprecated: selection lives in the table; read table.getSelectedRowIds()`
          )
        )
    }
    if (exported === "DataTableSelection") {
      root
        .find(j.TSTypeReference, { typeName: { name: local } })
        .forEach((path) =>
          report(
            path.node,
            `${local} is deprecated: selection is RowSelectionState, a record of ids`
          )
        )
    }
  }

  return null
}
