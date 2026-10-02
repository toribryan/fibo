// Compares the Figma library, as last read into figma/snapshot.json, with
// the code: Color variables against the :root and .dark blocks in
// globals.css, Border radii against the radius scale, and each Figma
// component's variant properties against the matching component's cva
// variants and string-union props.
//
//   pnpm figma:drift          report, exit 1 on any error
//   pnpm figma:drift --json   the same findings as JSON
//
// Both sides are compared by name, not by computed colour: Figma aliases
// `neutral/900` or `alpha/red-700/8`, and code says `var(--color-neutral-900)`
// or `color-mix(in oklch, var(--color-red-700) 8%, transparent)`, so a match
// means the two point at the same primitive, which is the contract.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

import ts from "typescript"

const root = path.resolve(import.meta.dirname, "..")
const read = (file) => readFileSync(path.join(root, file), "utf8")
const snapshot = JSON.parse(read("figma/snapshot.json"))
const config = JSON.parse(read("figma/drift.config.json"))
const globals = read("packages/ui/src/styles/globals.css")
const componentsDir = path.join(root, "packages/ui/src/components")

const findings = []
const add = (severity, area, subject, message) =>
  findings.push({ severity, area, subject, message })

// --- Tokens ---------------------------------------------------------------

// The body of the top-level `selector { }` block.
function block(selector) {
  const at = globals.search(
    new RegExp(`^${selector.replace(/[.:]/g, "\\$&")} \\{`, "m")
  )
  if (at === -1) throw new Error(`globals.css has no top-level ${selector}`)
  const open = globals.indexOf("{", at)
  let depth = 0
  for (let i = open; i < globals.length; i++) {
    if (globals[i] === "{") depth++
    else if (globals[i] === "}" && --depth === 0) {
      return globals.slice(open + 1, i)
    }
  }
  throw new Error(`Unclosed ${selector} block`)
}

function declarations(body) {
  const flat = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")
  return Object.fromEntries(
    [...flat.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, n, v]) => [
      n,
      v.trim().replace(/\(\s+/g, "(").replace(/\s+\)/g, ")"),
    ])
  )
}

// One spelling for both sides: `neutral-900`, `white`, or `red-700@8` for a
// primitive at 8% opacity. Anything else is returned as written, so it shows
// up as a mismatch rather than being silently skipped.
const canonical = (base, percent) =>
  percent === undefined || Number(percent) === 100
    ? base
    : `${base}@${Number(percent)}`

function fromCode(value) {
  let m = value.match(/^var\(--color-([\w-]+)\)$/)
  if (m) return canonical(m[1])
  m = value.match(
    /^color-mix\(in oklch,\s*var\(--color-([\w-]+)\)\s+([\d.]+)%,\s*transparent\s*\)$/
  )
  if (m) return canonical(m[1], m[2])
  m = value.match(/^oklch\(1 0 0 \/ ([\d.]+)%\)$/)
  if (m) return canonical("white", m[1])
  m = value.match(/^oklch\(0 0 0 \/ ([\d.]+)%\)$/)
  if (m) return canonical("black", m[1])
  return value
}

function fromFigma(alias) {
  let m = alias.match(/^base\/(\w+)$/)
  if (m) return canonical(m[1])
  m = alias.match(/^alpha\/([\w-]+)\/(\d+)$/)
  if (m) return canonical(m[1], m[2])
  m = alias.match(/^([a-z]+)\/(\d+)$/)
  if (m) return canonical(`${m[1]}-${m[2]}`)
  return alias
}

const modes = {
  Light: declarations(block(":root")),
  Dark: declarations(block(".dark")),
}
const codeTokens = new Set(
  Object.keys(modes.Light).filter((name) => !config.codeOnlyTokens[name])
)
const figmaColor = snapshot.variables.Color

for (const [name, values] of Object.entries(figmaColor)) {
  if (config.figmaOnlyTokens[name]) continue
  if (!codeTokens.has(name)) {
    add(
      "error",
      "tokens",
      name,
      `in Figma's Color collection but not in globals.css`
    )
    continue
  }
  for (const [mode, alias] of Object.entries(values)) {
    const code = modes[mode][name] ?? modes.Light[name]
    const figma = fromFigma(alias)
    const ours = fromCode(code)
    if (figma !== ours) {
      add(
        "error",
        "tokens",
        `${name} (${mode})`,
        `Figma ${alias} is ${figma}, code ${code} is ${ours}`
      )
    }
  }
}
for (const name of codeTokens) {
  if (name === "radius") continue
  if (!figmaColor[name]) {
    add("error", "tokens", name, "in globals.css but not in Figma")
  }
}

// The code derives every radius from one `--radius` knob.
const rem = Number(modes.Light.radius?.match(/^([\d.]+)rem$/)?.[1])
const base = rem * 16
const radiusSteps = {
  sm: -4,
  md: -2,
  lg: 0,
  xl: 4,
  "2xl": 8,
  "3xl": 12,
  "4xl": 16,
}
for (const [step, offset] of Object.entries(radiusSteps)) {
  const figma = snapshot.variables.Border?.[`radius/${step}`]
  if (figma === undefined) {
    add("warn", "tokens", `radius/${step}`, "not in Figma's Border collection")
  } else if (figma !== base + offset) {
    add(
      "error",
      "tokens",
      `radius/${step}`,
      `Figma ${figma}px, code ${base + offset}px`
    )
  }
}

// --- Components -----------------------------------------------------------

const literal = (node) =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : ts.isIdentifier(node) || ts.isNumericLiteral(node)
      ? node.text
      : undefined

// Props a Figma property can be held against, by name: cva variants, then
// string-literal unions and booleans declared in the file.
function codeProps(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const aliases = new Map()
  const props = new Map()
  const variants = new Map()

  const unionOf = (type) => {
    if (ts.isTypeReferenceNode(type)) {
      const target = aliases.get(type.typeName.getText(source))
      return target ? unionOf(target) : undefined
    }
    if (type.kind === ts.SyntaxKind.BooleanKeyword) return "BOOLEAN"
    const parts = ts.isUnionTypeNode(type) ? type.types : [type]
    const options = []
    for (const part of parts) {
      if (ts.isLiteralTypeNode(part) && ts.isStringLiteral(part.literal)) {
        options.push(part.literal.text)
      } else if (part.kind !== ts.SyntaxKind.UndefinedKeyword) {
        return undefined
      }
    }
    return options.length > 1 ? options : undefined
  }

  const visit = (node) => {
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type)
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "cva"
    ) {
      const options = node.arguments[1]
      const list =
        options && ts.isObjectLiteralExpression(options)
          ? options.properties.find(
              (p) => p.name?.getText(source) === "variants"
            )
          : undefined
      if (list && ts.isObjectLiteralExpression(list.initializer)) {
        for (const prop of list.initializer.properties) {
          if (!ts.isObjectLiteralExpression(prop.initializer)) continue
          variants.set(
            literal(prop.name),
            prop.initializer.properties.map((p) => literal(p.name))
          )
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)

  const collect = (node) => {
    if (ts.isPropertySignature(node) && node.type && node.name) {
      const options = unionOf(node.type)
      const name = literal(node.name)
      if (options && name && !props.has(name)) props.set(name, options)
    }
    ts.forEachChild(node, collect)
  }
  collect(source)

  return { variants, props }
}

const sameSet = (a, b) =>
  a.length === b.length && a.every((option) => b.includes(option))
const kebab = (name) => name.trim().toLowerCase().replace(/\s+/g, "-")
const files = new Set(
  readdirSync(componentsDir)
    .filter(
      (f) =>
        f.endsWith(".tsx") && !f.includes(".stories") && !f.includes(".test")
    )
    .map((f) => f.replace(/\.tsx$/, ""))
)
// A file can back several Figma components (Integration visual, tile, hub),
// so the props Figma covers are pooled per file.
const seenByFile = new Map()

for (const [component, properties] of Object.entries(snapshot.components)) {
  const name = config.componentFiles[component] ?? kebab(component)
  if (name === null || component.startsWith("_")) continue
  if (!files.has(name)) {
    add("info", "components", component, "in Figma with no component in code")
    continue
  }
  const file = path.join(componentsDir, `${name}.tsx`)
  if (!existsSync(file)) continue
  const { variants, props } = codeProps(file)
  if (!seenByFile.has(name)) seenByFile.set(name, { variants, seen: new Set() })
  const { seen } = seenByFile.get(name)

  for (const [prop, definition] of Object.entries(properties)) {
    if (!Array.isArray(definition)) continue
    const key = `${component}.${prop}`
    if (config.ignoredProps.includes(prop) || config.figmaOnlyProps[key]) {
      continue
    }
    seen.add(prop)
    const code = variants.get(prop) ?? props.get(prop)
    if (!code) {
      add(
        "warn",
        "components",
        key,
        `Figma variant property with no ${name}.tsx prop`
      )
    } else if (code === "BOOLEAN") {
      if (!sameSet(definition, ["false", "true"])) {
        add(
          "error",
          "components",
          key,
          `Figma [${definition.join(", ")}], code boolean`
        )
      }
    } else if (!sameSet(definition, code)) {
      const missing = code.filter((o) => !definition.includes(o))
      const extra = definition.filter((o) => !code.includes(o))
      add(
        "error",
        "components",
        key,
        [
          missing.length && `missing in Figma: ${missing.join(", ")}`,
          extra.length && `missing in code: ${extra.join(", ")}`,
        ]
          .filter(Boolean)
          .join("; ") || "options differ"
      )
    }
  }
}

for (const [name, { variants, seen }] of seenByFile) {
  for (const variant of variants.keys()) {
    if (!seen.has(variant) && !config.codeOnlyProps[`${name}.${variant}`]) {
      add(
        "warn",
        "components",
        `${name}.${variant}`,
        "cva variant with no Figma property"
      )
    }
  }
}

const meta = JSON.parse(read("packages/ui/components.meta.json"))
for (const name of files) {
  if (!seenByFile.has(name) && !config.codeOnlyComponents[name] && meta[name]) {
    add(
      "info",
      "components",
      meta[name].title,
      "in code with no Figma component"
    )
  }
}

// --- Conventions ----------------------------------------------------------

// One size scale on both sides, written smallest first, so `sm` means the
// same step on every part and a picker always reads small to large. Icon-only
// sizes follow the text sizes as `icon` or `icon-<step>`.
const SIZES = ["xs", "sm", "default", "lg", "xl"]
const rank = (option) => {
  const icon = option.match(/^icon(?:-(\w+))?$/)
  const step = icon ? (icon[1] ?? "default") : option
  const at = SIZES.indexOf(step)
  return at === -1 ? -1 : at + (icon ? SIZES.length : 0)
}

function checkSizes(subject, options, { orderSeverity = "error" } = {}) {
  const off = options.filter((option) => rank(option) === -1)
  if (off.length > 0) {
    add(
      "error",
      "conventions",
      subject,
      `size options off the scale: ${off.join(", ")} (use ${SIZES.join(", ")})`
    )
    return
  }
  const sorted = [...options].sort((a, b) => rank(a) - rank(b))
  if (sorted.join() !== options.join()) {
    add(
      orderSeverity,
      "conventions",
      subject,
      `size options out of order: ${options.join(", ")} (want ${sorted.join(", ")})`
    )
  }
}

for (const [component, properties] of Object.entries(snapshot.components)) {
  if (Array.isArray(properties.size)) {
    // The Plugin API can't reorder variant options, so this one is a warning
    // for a person to fix by dragging the values in the properties panel.
    checkSizes(`Figma ${component}.size`, properties.size, {
      orderSeverity: "warn",
    })
  }
}
for (const name of files) {
  const { variants, props } = codeProps(path.join(componentsDir, `${name}.tsx`))
  const size = variants.get("size") ?? props.get("size")
  if (Array.isArray(size)) checkSizes(`${name}.tsx size`, size)
}

// --- Report ---------------------------------------------------------------

const order = { error: 0, warn: 1, info: 2 }
findings.sort(
  (a, b) =>
    order[a.severity] - order[b.severity] || a.area.localeCompare(b.area)
)
const count = (severity) =>
  findings.filter((f) => f.severity === severity).length

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ readAt: snapshot.readAt, findings }, null, 2))
} else {
  console.log(
    `Figma snapshot read ${snapshot.readAt} from ${snapshot.file.name}\n`
  )
  for (const f of findings) {
    console.log(
      `${f.severity.padEnd(5)}  ${f.area.padEnd(10)}  ${f.subject}: ${f.message}`
    )
  }
  console.log(
    `\n${count("error")} errors, ${count("warn")} warnings, ${count("info")} notes`
  )
}
process.exitCode = count("error") > 0 ? 1 : 0
