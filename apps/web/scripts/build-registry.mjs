// Turns packages/ui/src/components into a shadcn registry served from
// apps/web/public/r. Sources are copied into apps/web/registry with workspace
// imports rewritten to the aliases a host project's components.json resolves,
// then `shadcn build` produces one JSON file per component.
import { execSync } from "node:child_process"
import process from "node:process"
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const web = path.resolve(import.meta.dirname, "..")
const root = path.resolve(web, "../..")
const componentsDir = path.join(root, "packages/ui/src/components")
const transformedDir = path.join(web, "registry/ui")
const homepage = process.env.NEXT_PUBLIC_APP_URL || "https://fibo.toribryan.com"

const rewrites = [
  [/@workspace\/ui\/lib\/utils/g, "@/lib/utils"],
  [/@workspace\/ui\/components\//g, "@/components/ui/"],
  [/@workspace\/ui\/hooks\//g, "@/hooks/"],
]

const packageName = (spec) =>
  spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0]

const titleCase = (name) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")

await rm(transformedDir, { recursive: true, force: true })
await mkdir(transformedDir, { recursive: true })

const files = (await readdir(componentsDir))
  .filter((f) => f.endsWith(".tsx") && !f.endsWith(".stories.tsx"))
  .sort()

const items = []
for (const file of files) {
  const name = file.replace(/\.tsx$/, "")
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
    title: titleCase(name),
    description: `${titleCase(name)} from fibo.`,
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
  path.join(web, "registry.json"),
  JSON.stringify(registry, null, 2) + "\n"
)

execSync("pnpm exec shadcn build registry.json --output public/r", {
  cwd: web,
  stdio: "inherit",
})
console.log(`Registry: ${items.length} items -> public/r`)
