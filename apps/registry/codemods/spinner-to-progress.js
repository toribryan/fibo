// Rewrites fibo's deprecated Spinner to an indeterminate Progress.
//
//   pnpm dlx jscodeshift --parser tsx \
//     -t https://fibo.toribryan.com/codemods/spinner-to-progress.js src
//
// Self-contained on purpose: jscodeshift downloads a remote transform to a
// temp file, so it cannot import anything beside it.

const DEFAULT_LABEL = "Loading"

export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  const report = (node, message) =>
    api.report(`${file.path}:${node.loc?.start.line ?? "?"} ${message}`)
  let changed = false

  root
    .find(j.ImportDeclaration)
    .filter((path) => /(^|\/)spinner$/.test(path.node.source.value))
    .forEach((importPath) => {
      const spinnerSource = importPath.node.source.value
      const progressSource = spinnerSource.replace(/spinner$/, "progress")
      const specifier = importPath.node.specifiers.find(
        (s) => s.type === "ImportSpecifier" && s.imported.name === "Spinner"
      )
      if (!specifier) return
      const local = specifier.local.name

      // Anything but a JSX tag, such as icon={Spinner}, cannot be rewritten
      // safely, so the file keeps its Spinner import for a person to finish.
      const valueUses = root
        .find(j.Identifier, { name: local })
        .filter(
          (path) =>
            path.node.type === "Identifier" &&
            path.parent.node.type !== "ImportSpecifier"
        )
      if (valueUses.size() > 0) {
        valueUses.forEach((path) =>
          report(path.node, `${local} is used as a value; migrate it by hand`)
        )
        return
      }

      // Spinner alone in its import: point that import at progress in place,
      // so the file keeps its own quotes and semicolons.
      const inPlace =
        importPath.node.specifiers.length === 1 &&
        root
          .find(j.ImportDeclaration, { source: { value: progressSource } })
          .size() === 0 &&
        !isBound(j, root, "Progress", specifier)
      const progressLocal = inPlace
        ? "Progress"
        : ensureProgressImport(j, root, importPath, progressSource)
      if (!progressLocal) {
        report(
          importPath.node,
          "Progress is already bound to something else; migrate it by hand"
        )
        return
      }

      root
        .find(j.JSXElement)
        .filter((path) => path.node.openingElement.name.name === local)
        .forEach((path) => {
          rewriteElement(j, path.node, progressLocal, report)
        })

      if (inPlace) {
        importPath.node.source.value = progressSource
        importPath.node.specifiers = [
          j.importSpecifier(j.identifier("Progress")),
        ]
        changed = true
        return
      }
      importPath.node.specifiers = importPath.node.specifiers.filter(
        (s) => s !== specifier
      )
      if (importPath.node.specifiers.length === 0) {
        j(importPath).remove()
      } else {
        report(
          importPath.node,
          `${spinnerSource} still has other imports; remove them before deleting spinner.tsx`
        )
      }
      changed = true
    })

  return changed ? root.toSource({ quote: "double" }) : null
}

// Returns the local name Progress is imported as, adding the import next to
// the Spinner one if the file has none.
function ensureProgressImport(j, root, spinnerImport, source) {
  const existing = root.find(j.ImportDeclaration, { source: { value: source } })
  if (existing.size() > 0) {
    const declaration = existing.get().node
    const found = declaration.specifiers.find(
      (s) => s.type === "ImportSpecifier" && s.imported.name === "Progress"
    )
    if (found) return found.local.name
    if (isBound(j, root, "Progress")) return null
    declaration.specifiers.push(j.importSpecifier(j.identifier("Progress")))
    return "Progress"
  }
  if (isBound(j, root, "Progress")) return null
  j(spinnerImport).insertAfter(
    j.importDeclaration(
      [j.importSpecifier(j.identifier("Progress"))],
      j.literal(source)
    )
  )
  return "Progress"
}

function isBound(j, root, name, except) {
  return (
    root
      .find(j.ImportSpecifier)
      .filter((path) => path.node !== except && path.node.local.name === name)
      .size() > 0 ||
    root.find(j.VariableDeclarator, { id: { name } }).size() > 0 ||
    root.find(j.FunctionDeclaration, { id: { name } }).size() > 0
  )
}

function rewriteElement(j, element, progressLocal, report) {
  const opening = element.openingElement
  const attributes = []
  let named = false
  let hasValue = false

  for (const attribute of opening.attributes) {
    if (attribute.type !== "JSXAttribute") {
      attributes.push(attribute)
      continue
    }
    const name = attribute.name.name
    if (name === "size") continue
    if (name === "label") {
      attribute.name = j.jsxIdentifier("aria-label")
      named = true
    } else if (name === "aria-label" || name === "aria-labelledby") {
      named = true
    } else if (name === "value") {
      hasValue = true
    }
    attributes.push(attribute)
  }

  if (!hasValue) {
    attributes.unshift(
      j.jsxAttribute(
        j.jsxIdentifier("value"),
        j.jsxExpressionContainer(j.literal(null))
      )
    )
  }
  // A spread may carry a label, but nothing here can see into it.
  if (!named && !attributes.some((a) => a.type === "JSXSpreadAttribute")) {
    attributes.push(
      j.jsxAttribute(j.jsxIdentifier("aria-label"), j.literal(DEFAULT_LABEL))
    )
  } else if (!named) {
    report(opening, "check the spread props pass a label as aria-label")
  }

  opening.name = j.jsxIdentifier(progressLocal)
  opening.attributes = attributes
  if (element.closingElement) {
    element.closingElement.name = j.jsxIdentifier(progressLocal)
  }
}
