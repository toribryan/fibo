// Turns packages/ui/src/components into a shadcn registry served from
// apps/registry/public/r. Sources are copied into apps/registry/registry with workspace
// imports rewritten to the aliases a host project's components.json resolves,
// then `shadcn build` produces one JSON file per component. Titles and
// descriptions come from packages/ui/components.meta.json, which also writes
// public/llms.txt so agents can see the complete list.
import { execSync } from "node:child_process"
import process from "node:process"
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const registryDir = path.resolve(import.meta.dirname, "..")
const root = path.resolve(registryDir, "../..")
const componentsDir = path.join(root, "packages/ui/src/components")
const meta = JSON.parse(
  await readFile(path.join(root, "packages/ui/components.meta.json"), "utf8")
)
const transformedDir = path.join(registryDir, "registry/ui")
const homepage = process.env.FIBO_SITE_URL || "https://fibo.toribryan.com"

const rewrites = [
  [/@workspace\/ui\/lib\/utils/g, "@/lib/utils"],
  [/@workspace\/ui\/components\//g, "@/components/ui/"],
  [/@workspace\/ui\/hooks\//g, "@/hooks/"],
]

const packageName = (spec) =>
  spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0]

// Storybook is the site, so a component's docs page is a path off the root.
const docsUrl = (name, tier) => `${homepage}/?path=/docs/${tier}-${name}--docs`

// Tokens come from globals.css so the registry can never drift from it. Each
// component ships only the roles a stock `shadcn init` lacks, so adding one to
// an existing app never overwrites that app's `--primary` and friends.
const globals = await readFile(
  path.join(root, "packages/ui/src/styles/globals.css"),
  "utf8"
)

const STOCK_TOKENS = new Set([
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
])

// The body of the `{ }` block that opens at or after `from`.
function blockBody(text, from) {
  const open = text.indexOf("{", from)
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}" && --depth === 0) return text.slice(open + 1, i)
  }
  throw new Error(`Unclosed block in globals.css at ${from}`)
}

// Prettier wraps long values over several lines; a registry wants one.
const oneLine = (value) =>
  value.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim()

function declarations(body) {
  const flat = body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "")
  return Object.fromEntries(
    [...flat.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      oneLine(value),
    ])
  )
}

// A top-level rule, so the `:root` inside `@layer base` is never matched.
function topLevel(selector) {
  const at = globals.search(
    new RegExp(`^${selector.replace(/[.:]/g, "\\$&")} \\{`, "m")
  )
  if (at === -1) throw new Error(`globals.css has no top-level ${selector}`)
  return declarations(blockBody(globals, at))
}

const light = topLevel(":root")
const dark = topLevel(".dark")
const themeBody = blockBody(globals, globals.indexOf("@theme inline"))
const themeVars = declarations(themeBody)

const keyframes = Object.fromEntries(
  [...themeBody.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)].map((match) => {
    const steps = blockBody(themeBody, match.index)
    return [
      `@keyframes ${match[1]}`,
      Object.fromEntries(
        [...steps.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, step, body]) => [
          step.trim(),
          Object.fromEntries(
            body
              .split(";")
              .map((d) => d.split(/:(.*)/s).map(oneLine))
              .filter(([property, value]) => property && value)
          ),
        ])
      ),
    ]
  })
)

const extensionTokens = Object.keys(light).filter(
  (name) => !STOCK_TOKENS.has(name)
)
for (const name of extensionTokens) {
  if (!(name in dark)) throw new Error(`--${name} has no .dark value`)
}
const animations = Object.keys(themeVars)
  .filter((name) => name.startsWith("animate-"))
  .map((name) => name.slice("animate-".length))

// The extension tokens and animations a component's classes use.
function tokensFor(source) {
  const used = (name) => new RegExp(`-${name}(?![\\w-])`).test(source)
  const tokens = extensionTokens.filter(used)
  const animationsUsed = animations.filter((name) =>
    new RegExp(`\\banimate-${name}(?![\\w-])`).test(source)
  )
  if (tokens.length === 0 && animationsUsed.length === 0) return {}
  const pick = (values) =>
    Object.fromEntries(tokens.map((name) => [name, values[name]]))
  const css = Object.fromEntries(
    animationsUsed.map((name) => {
      const frames = themeVars[`animate-${name}`].split(" ")[0]
      return [`@keyframes ${frames}`, keyframes[`@keyframes ${frames}`]]
    })
  )
  return {
    cssVars: {
      theme: Object.fromEntries([
        ...tokens.map((name) => [`color-${name}`, `var(--${name})`]),
        ...animationsUsed.map((name) => [
          `animate-${name}`,
          themeVars[`animate-${name}`],
        ]),
      ]),
      ...(tokens.length && { light: pick(light), dark: pick(dark) }),
    },
    ...(animationsUsed.length && { css }),
  }
}

await rm(transformedDir, { recursive: true, force: true })
await mkdir(transformedDir, { recursive: true })

const files = (await readdir(componentsDir))
  .filter((f) => f.endsWith(".tsx") && !/\.(stories|test)\.tsx$/.test(f))
  .sort()

const items = []
for (const file of files) {
  const name = file.replace(/\.tsx$/, "")
  const info = meta[name]
  if (!info) {
    throw new Error(
      `${name} has no entry in packages/ui/components.meta.json. Add a title, description, tier and group.`
    )
  }
  const source = await readFile(path.join(componentsDir, file), "utf8")

  const dependencies = new Set()
  const registryDependencies = new Set()
  for (const [, spec] of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    if (spec.startsWith("@workspace/ui/components/")) {
      registryDependencies.add(`${homepage}/r/${path.basename(spec)}.json`)
    } else if (spec === "@workspace/ui/lib/utils") {
      registryDependencies.add("utils")
    } else if (spec.startsWith("@workspace/") || spec.startsWith(".")) {
      continue
    } else {
      const pkg = packageName(spec)
      if (pkg !== "react" && pkg !== "react-dom") dependencies.add(pkg)
    }
  }

  const transformed = rewrites.reduce(
    (code, [pattern, replacement]) => code.replace(pattern, replacement),
    source
  )
  await writeFile(path.join(transformedDir, file), transformed)

  items.push({
    name,
    type: "registry:ui",
    title: info.title,
    description: info.description,
    categories: [info.tier, info.group.toLowerCase()],
    author: "Tori Bryan",
    docs: `Docs and live examples: ${docsUrl(name, info.tier)}`,
    meta: {
      tier: info.tier,
      group: info.group,
      docs: docsUrl(name, info.tier),
      ...(info.status && { status: info.status }),
    },
    dependencies: [...dependencies],
    registryDependencies: [...registryDependencies],
    files: [{ path: `registry/ui/${file}`, type: "registry:ui" }],
    ...tokensFor(source),
  })
}

// Opt-in: every fibo token, for an app that wants the parts to look the way
// they do in Storybook.
items.push({
  name: "theme",
  type: "registry:theme",
  title: "Theme",
  description:
    "fibo's full token set, light and dark: the achromatic roles, status colours and named -subtle, -hover and -ring roles.",
  author: "Tori Bryan",
  docs: `Token reference: ${homepage}/?path=/docs/foundations-colors--docs`,
  meta: { docs: `${homepage}/?path=/docs/foundations-colors--docs` },
  cssVars: {
    theme: Object.fromEntries(
      Object.entries(themeVars).filter(
        ([name]) => !["font-sans", "font-mono"].includes(name)
      )
    ),
    light,
    dark,
  },
  css: keyframes,
})

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "fibo",
  homepage,
  items,
}
await writeFile(
  path.join(registryDir, "registry.json"),
  JSON.stringify(registry, null, 2) + "\n"
)

execSync("pnpm exec shadcn build registry.json --output public/r", {
  cwd: registryDir,
  stdio: "inherit",
})

// llms.txt (https://llmstxt.org): the complete, installable list for agents.
const section = (tier) =>
  items
    .filter((item) => item.meta.tier === tier)
    .map(
      (item) =>
        `- [${item.title}](${item.meta.docs}): ${item.description} Install: \`pnpm dlx shadcn@latest add @fibo/${item.name}\``
    )
    .join("\n")

const llms = `# fibo

> An achromatic design system built on shadcn/ui and Base UI, distributed as a shadcn registry. Components copy into your project as source and follow your tokens.

Add the registry once to \`components.json\`:

\`\`\`json
{ "registries": { "@fibo": "${homepage}/r/{name}.json" } }
\`\`\`

Then install by name with \`pnpm dlx shadcn@latest add @fibo/<name>\`. The lists below are complete: anything not listed is not part of fibo. Base components depend on nothing beyond Base UI, class-variance-authority and lucide-react; special components may also need \`motion\`, which the CLI installs for you.

Each component brings the tokens it uses that a stock shadcn theme lacks, such as \`--primary-hover\` and \`--ring-subtle\`, and leaves your existing tokens alone. To make everything look the way it does in the docs, also add the full theme with \`pnpm dlx shadcn@latest add @fibo/theme\`.

## Base components

${section("base-components")}

## Special components

${section("special-components")}

## Docs

- [Storybook](${homepage}/): every component with live examples, usage rules and props.
- [Registry guide](${homepage}/?path=/docs/registry-guide--docs): what the registry is, how to install and update parts, and how it works, written for designers.
- [Source](https://github.com/toribryan/fibo): MIT licensed.
`
await mkdir(path.join(registryDir, "public"), { recursive: true })
await writeFile(path.join(registryDir, "public/llms.txt"), llms)

console.log(`Registry: ${items.length} items -> public/r, llms.txt`)
