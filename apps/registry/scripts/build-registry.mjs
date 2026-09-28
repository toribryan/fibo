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
  })
}

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

Then install by name with \`pnpm dlx shadcn@latest add @fibo/<name>\`. The lists below are complete: anything not listed is not part of fibo. Components depend on nothing beyond Base UI, class-variance-authority and lucide-react; Niche parts may also need \`motion\`, which the CLI installs for you.

## Components

${section("components")}

## Niche

${section("niche")}

## Docs

- [Storybook](${homepage}/): every component with live examples, usage rules and props.
- [Source](https://github.com/toribryan/fibo): MIT licensed.
`
await mkdir(path.join(registryDir, "public"), { recursive: true })
await writeFile(path.join(registryDir, "public/llms.txt"), llms)

console.log(`Registry: ${items.length} items -> public/r, llms.txt`)
