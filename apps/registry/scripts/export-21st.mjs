// Writes a self-contained copy of each Special component to apps/registry/21st
// for publishing on 21st.dev. Its CLI takes one component file and one demo,
// and rejects local imports and registry dependencies, so each copy inlines
// `cn` and any fibo component it uses. fibo's named roles (`bg-primary-subtle`)
// become the opacity modifiers a stock shadcn theme understands. Each folder
// gets a package.json because the CLI checks every import against the nearest
// one.
//
// A component is exported when it has a demo in packages/ui/src/21st. A demo
// may import only the component it shows, since 21st.dev's quality guidelines
// keep logic in the component file and the demo to props and content. Publish
// with the commands this prints; each opens a review page in the browser.
import process from "node:process"
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const registryDir = path.resolve(import.meta.dirname, "..")
const root = path.resolve(registryDir, "../..")
const uiDir = path.join(root, "packages/ui")
const componentsDir = path.join(uiDir, "src/components")
const demosDir = path.join(uiDir, "src/21st")
const outDir = path.join(registryDir, "21st")
const homepage = process.env.FIBO_SITE_URL || "https://fibo.toribryan.com"

const meta = JSON.parse(
  await readFile(path.join(uiDir, "components.meta.json"), "utf8")
)
const uiPackage = JSON.parse(
  await readFile(path.join(uiDir, "package.json"), "utf8")
)

// Each role and the strength it mixes its base color at in globals.css.
// Longer names come first so `input-subtle` never claims `input-subtle-hover`.
const roles = [
  ["destructive-subtle-hover", "destructive/15"],
  ["destructive-subtle", "destructive/10"],
  ["destructive-ring", "destructive/20"],
  ["input-subtle-hover", "input/50"],
  ["input-subtle", "input/20"],
  ["primary-hover", "primary/80"],
  ["primary-subtle", "primary/10"],
  ["secondary-hover", "secondary/80"],
  ["popover-overlay", "popover/85"],
  ["ring-subtle", "ring/50"],
]
// Tokens with no stock role to fall back on, written out as their value.
// Each sits inside an arbitrary class, so spaces are underscores.
const literals = [
  ["var(--particle-shadow)", "color-mix(in_oklch,black_18%,transparent)"],
]
const utilities =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|shadow|divide|decoration|caret|accent|placeholder"
const fiboOnly = new RegExp(
  `\\b(?:${utilities})-(?:[a-z]+-)*(?:subtle|hover|overlay|success|warning|info)(?![\\w-])|\\bdestructive-ring\\b`
)

const importPattern = /^import\s[\s\S]*?\sfrom\s+["']([^"']+)["'];?\n/gm

const packageName = (spec) =>
  spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0]

// Base parts sit in a group in Storybook's sidebar; special parts don't.
const docsUrl = (name, info) =>
  `${homepage}/?path=/docs/${info.tier}-${info.tier === "base-components" ? `${info.group.toLowerCase()}-` : ""}${name}--docs`

function mapRoles(code, file) {
  const literal = literals.reduce(
    (out, [token, value]) => out.replaceAll(token, value),
    code
  )
  const mapped = roles.reduce(
    (out, [role, replacement]) =>
      out.replace(
        new RegExp(`\\b(${utilities})-${role}(?![\\w-])`, "g"),
        (_, utility) => `${utility}-${replacement}`
      ),
    literal
  )
  const leftover = mapped.match(fiboOnly)
  if (leftover) {
    throw new Error(
      `${file} uses ${leftover[0]}, which has no stock shadcn equivalent. Add it to the roles in export-21st.mjs.`
    )
  }
  return mapped
}

// Splits a module into its import statements and the code after them.
function split(source) {
  const code = source.replace(/^["']use client["'];?\n/, "")
  const imports = [...code.matchAll(importPattern)].map((m) => ({
    text: m[0].trimEnd(),
    spec: m[1],
  }))
  const last = imports.at(-1)
  const bodyStart = last ? code.indexOf(last.text) + last.text.length : 0
  return { imports, body: code.slice(bodyStart).trim() }
}

async function inlineComponent(spec) {
  const name = path.basename(spec)
  const file = spec.startsWith("@workspace/ui/lib/")
    ? path.join(uiDir, "src/lib", `${name}.ts`)
    : path.join(componentsDir, `${name}.tsx`)
  const { imports, body } = split(await readFile(file, "utf8"))
  for (const { spec: nested } of imports) {
    if (nested.startsWith("@workspace/ui/components/")) {
      throw new Error(
        `${name} imports ${nested}. Inlining is one level deep; extend export-21st.mjs.`
      )
    }
  }
  const privateBody = body
    .replace(/^export (?:type )?\{[\s\S]*?\}\n?/gm, "")
    .replace(/^export (?=function|const|type|interface)/gm, "")
    .trim()
  return { imports, body: privateBody }
}

// Inlined files share one scope, so a name declared twice, or declared and
// imported, would not compile. Types and values are tracked apart because
// TypeScript lets a type and a function share a name.
function checkNames(file, imports, bodies) {
  const seen = { type: new Set(), value: new Set() }
  const add = (name, spaces) => {
    for (const space of spaces) {
      if (seen[space].has(name)) {
        throw new Error(
          `${file} would declare ${name} twice once inlined. Rename one of them.`
        )
      }
      seen[space].add(name)
    }
  }
  for (const text of imports) {
    const typeOnly = /^import\s+type\s/.test(text)
    const clause = text
      .replace(/^import\s+(?:type\s+)?/, "")
      .split(/\sfrom\s/)[0]
    for (const [, type, name] of clause.matchAll(
      /(?:\bas\s+|^|[{,]\s*)(type\s+)?(\w+)\s*(?=[,}]|$)/gm
    )) {
      add(name, typeOnly || type ? ["type"] : ["type", "value"])
    }
  }
  const spacesOf = {
    type: ["type"],
    interface: ["type"],
    class: ["type", "value"],
  }
  for (const body of bodies) {
    for (const [, keyword, name] of body.matchAll(
      /^(?:export\s+)?(?:async\s+)?(function|const|let|class|type|interface)\s+(\w+)/gm
    )) {
      add(name, spacesOf[keyword] ?? ["value"])
    }
  }
}

function mergeImports(statements) {
  const bySpec = new Map()
  for (const { text, spec } of statements) {
    const existing = bySpec.get(spec)
    if (existing && existing !== text) {
      throw new Error(
        `Two different imports from ${spec} would be merged. Combine them by hand in the source.`
      )
    }
    bySpec.set(spec, text)
  }
  return [...bySpec.values()]
}

function dependenciesOf(...sources) {
  const deps = {}
  for (const source of sources) {
    for (const [, spec] of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      if (spec.startsWith("@/") || spec.startsWith(".")) continue
      const pkg = packageName(spec)
      const version = uiPackage.dependencies[pkg]
      if (!version) {
        throw new Error(
          `${pkg} is not a dependency of packages/ui, so its version is unknown.`
        )
      }
      deps[pkg] = version
    }
  }
  return Object.fromEntries(Object.entries(deps).sort())
}

const cnHelper = {
  imports: [
    { text: 'import { clsx, type ClassValue } from "clsx"', spec: "clsx" },
    {
      text: 'import { twMerge } from "tailwind-merge"',
      spec: "tailwind-merge",
    },
  ],
  body: "function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}",
}

// Makes one self-contained file with `cn` copied in. A component also gets
// every fibo component it imports; a demo, identified by `own`, keeps that as
// an import of the component it shows and may import no other.
async function assemble(source, file, own) {
  const { imports, body } = split(source)
  const kept = []
  const inlined = []
  let usesCn = false
  for (const statement of imports) {
    if (statement.spec === "@workspace/ui/lib/utils") {
      usesCn = true
    } else if (statement.spec === own) {
      kept.push({
        spec: statement.spec,
        text: statement.text.replace(
          own,
          `@/components/ui/${path.basename(own)}`
        ),
      })
    } else if (own && statement.spec.startsWith("@workspace/ui/components/")) {
      throw new Error(
        `${file} imports ${statement.spec}. A demo may import only the component it shows; build the rest from plain elements.`
      )
    } else if (
      statement.spec.startsWith("@workspace/ui/components/") ||
      statement.spec.startsWith("@workspace/ui/lib/")
    ) {
      const dep = await inlineComponent(statement.spec)
      usesCn ||= dep.imports.some((i) => i.spec === "@workspace/ui/lib/utils")
      inlined.push(dep)
    } else if (statement.spec.startsWith("@workspace/")) {
      throw new Error(
        `${file} imports ${statement.spec}, which is not inlined.`
      )
    } else {
      kept.push(statement)
    }
  }
  const allImports = mergeImports([
    ...kept,
    ...inlined.flatMap((dep) =>
      dep.imports.filter((i) => !i.spec.startsWith("@workspace/"))
    ),
    ...(usesCn ? cnHelper.imports : []),
  ])
  checkNames(file, allImports, [body, ...inlined.map((dep) => dep.body)])
  return mapRoles(
    [
      '"use client"',
      allImports.join("\n"),
      ...(usesCn ? [cnHelper.body] : []),
      ...inlined.map((dep) => dep.body),
      body,
    ].join("\n\n") + "\n",
    file
  )
}

async function exportComponent(name) {
  const component = await assemble(
    await readFile(path.join(componentsDir, `${name}.tsx`), "utf8"),
    `${name}.tsx`
  )
  const demo = await assemble(
    await readFile(path.join(demosDir, `${name}.tsx`), "utf8"),
    `${name} demo`,
    `@workspace/ui/components/${name}`
  )

  const dir = path.join(outDir, name)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, `${name}.tsx`), component)
  await writeFile(path.join(dir, `${name}.demo.tsx`), demo)
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify(
      {
        name: `fibo-${name}`,
        private: true,
        dependencies: dependenciesOf(component, demo),
      },
      null,
      2
    ) + "\n"
  )
}

await rm(outDir, { recursive: true, force: true })

const demos = new Set(
  (await readdir(demosDir))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(/\.tsx$/, ""))
)
const special = Object.entries(meta)
  .filter(
    ([name, info]) => name !== "$comment" && info.tier === "special-components"
  )
  .map(([name]) => name)
  .sort()

for (const name of demos) {
  if (!special.includes(name)) {
    throw new Error(
      `packages/ui/src/21st/${name}.tsx has no Special component to go with it.`
    )
  }
}

const commands = []
for (const name of special) {
  if (!demos.has(name)) {
    console.log(`Skipped ${name}: no demo in packages/ui/src/21st`)
    continue
  }
  await exportComponent(name)
  const info = meta[name]
  const dir = path.relative(root, path.join(outDir, name))
  commands.push(
    [
      `npx @21st-dev/cli publish ${dir}/${name}.tsx`,
      `--demo ${dir}/${name}.demo.tsx`,
      `--name ${JSON.stringify(info.title)}`,
      `--slug ${name}`,
      `--description ${JSON.stringify(info.description)}`,
      `--tags ${info.group.toLowerCase()}`,
      `--website ${JSON.stringify(docsUrl(name, info))}`,
    ].join(" \\\n    ")
  )
}

console.log(`\n21st.dev: ${commands.length} components -> apps/registry/21st`)
console.log(`Publish each from the repo root:\n\n${commands.join("\n\n")}\n`)
