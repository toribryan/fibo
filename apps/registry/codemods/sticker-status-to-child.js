// Moves Sticker avatar's deprecated status props onto a StatusDot child.
//
//   <StickerAvatar name="Ana" status="away" statusLabel="Ausente" />
//   <StickerAvatar name="Ana"><StatusDot status="away" label="Ausente" /></StickerAvatar>
//
//   pnpm dlx jscodeshift --parser tsx \
//     -t https://fibo.toribryan.com/codemods/sticker-status-to-child.js src
//
// Self-contained on purpose: jscodeshift downloads a remote transform to a
// temp file, so it cannot import anything beside it.

const PROPS = ["status", "statusLabel", "statusColor"]

export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  const report = (node, message) =>
    api.report(`${file.path}:${node.loc?.start.line ?? "?"} ${message}`)
  let changed = false

  root
    .find(j.ImportDeclaration)
    .filter((path) => /(^|\/)sticker-avatar$/.test(path.node.source.value))
    .forEach((importPath) => {
      const specifier = importPath.node.specifiers.find(
        (s) =>
          s.type === "ImportSpecifier" && s.imported.name === "StickerAvatar"
      )
      if (!specifier) return
      const local = specifier.local.name
      const source = importPath.node.source.value.replace(
        /sticker-avatar$/,
        "status-dot"
      )
      let dotLocal = null

      root
        .find(j.JSXElement)
        .filter((path) => path.node.openingElement.name.name === local)
        .forEach((path) => {
          const opening = path.node.openingElement
          const found = {}
          for (const attribute of opening.attributes) {
            if (
              attribute.type === "JSXAttribute" &&
              PROPS.includes(attribute.name.name)
            ) {
              found[attribute.name.name] = attribute
            }
          }
          if (!found.status) {
            if (
              opening.attributes.some((a) => a.type === "JSXSpreadAttribute")
            ) {
              report(
                opening,
                "check the spread props for status; move it by hand"
              )
            }
            return
          }

          dotLocal ??= ensureImport(j, root, importPath, source)
          if (!dotLocal) {
            report(
              opening,
              "StatusDot is already bound to something else; move it by hand"
            )
            return
          }

          const status = found.status.value
          const dotAttributes = [
            j.jsxAttribute(j.jsxIdentifier("status"), status),
          ]
          if (found.statusLabel) {
            dotAttributes.push(
              j.jsxAttribute(j.jsxIdentifier("label"), found.statusLabel.value)
            )
          }
          const variant = variantFor(j, found.statusColor)
          if (variant) {
            dotAttributes.push(
              j.jsxAttribute(j.jsxIdentifier("variant"), variant)
            )
          }
          const dot = j.jsxElement(
            j.jsxOpeningElement(j.jsxIdentifier(dotLocal), dotAttributes, true),
            null,
            []
          )

          // A status from an expression could be undefined, which used to
          // mean no dot, so the dot only renders when there is one.
          const child =
            status.type === "StringLiteral" || status.type === "Literal"
              ? dot
              : j.jsxExpressionContainer(
                  j.conditionalExpression(
                    status.expression,
                    dot,
                    j.literal(null)
                  )
                )

          opening.attributes = opening.attributes.filter(
            (a) => !(a.type === "JSXAttribute" && PROPS.includes(a.name.name))
          )
          if (opening.selfClosing) {
            opening.selfClosing = false
            path.node.closingElement = j.jsxClosingElement(
              j.jsxIdentifier(local)
            )
            path.node.children = [child]
          } else {
            path.node.children = [child, ...path.node.children]
          }
          changed = true
        })
    })

  return changed ? root.toSource({ quote: "double" }) : null
}

// statusColor defaulted to true, so only an explicit false or an expression
// needs a variant.
function variantFor(j, attribute) {
  if (!attribute) return null
  const value = attribute.value
  if (value === null) return null
  const expression =
    value.type === "JSXExpressionContainer" ? value.expression : value
  if (
    expression.type === "BooleanLiteral" ||
    (expression.type === "Literal" && typeof expression.value === "boolean")
  ) {
    return expression.value ? null : j.literal("mono")
  }
  return j.jsxExpressionContainer(
    j.conditionalExpression(expression, j.literal("color"), j.literal("mono"))
  )
}

// Returns the local name StatusDot is imported as, adding the import next to
// the Sticker avatar one if the file has none.
function ensureImport(j, root, stickerImport, source) {
  const existing = root.find(j.ImportDeclaration, { source: { value: source } })
  if (existing.size() > 0) {
    const declaration = existing.get().node
    const found = declaration.specifiers.find(
      (s) => s.type === "ImportSpecifier" && s.imported.name === "StatusDot"
    )
    if (found) return found.local.name
    if (isBound(j, root, "StatusDot")) return null
    declaration.specifiers.push(j.importSpecifier(j.identifier("StatusDot")))
    return "StatusDot"
  }
  if (isBound(j, root, "StatusDot")) return null
  j(stickerImport).insertAfter(
    j.importDeclaration(
      [j.importSpecifier(j.identifier("StatusDot"))],
      j.literal(source)
    )
  )
  return "StatusDot"
}

function isBound(j, root, name) {
  return (
    root.find(j.ImportSpecifier, { local: { name } }).size() > 0 ||
    root.find(j.VariableDeclarator, { id: { name } }).size() > 0 ||
    root.find(j.FunctionDeclaration, { id: { name } }).size() > 0
  )
}
