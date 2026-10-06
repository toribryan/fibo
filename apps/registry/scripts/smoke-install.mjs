// Installs every registry item into a fresh `shadcn init` app and proves it
// renders as designed there. A component that uses a token the app lacks still
// installs and typechecks, because Tailwind silently drops utilities for
// unknown colours, so this checks the compiled CSS for each token instead.
//
// Builds the registry against a local server, so the registry dependency URLs
// resolve to this checkout, then rebuilds it for production at the end.
// KEEP_SMOKE_APP=1 leaves the app in place for a look with `next start`.
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"

const registryDir = path.resolve(import.meta.dirname, "..")
const publicDir = path.join(registryDir, "public")
const shadcn = path.join(registryDir, "node_modules/.bin/shadcn")

// Async on purpose: the registry server runs in this process, and a blocking
// child would stop it answering the CLI it is serving.
const run = (command, args, cwd, env = {}) =>
  new Promise((resolve, reject) => {
    spawn(command, args, {
      cwd,
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...process.env, CI: "true", ...env },
    })
      .on("error", reject)
      .on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`${command} ${args.join(" ")} exited ${code}`))
      )
  })

const buildRegistry = (env) =>
  run("node", ["scripts/build-registry.mjs"], registryDir, env)

async function compiledCss(appDir) {
  const staticDir = path.join(appDir, ".next/static")
  const files = await readdir(staticDir, { recursive: true })
  const css = await Promise.all(
    files
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFile(path.join(staticDir, file), "utf8"))
  )
  if (css.length === 0) throw new Error("next build produced no CSS")
  return css.join("\n")
}

// Every token must be defined for light and dark. With `used`, a utility must
// also read it, which proves Tailwind generated the class. Every palette step
// a value mixes from must be defined too, or it resolves to nothing.
function check(css, item, { used }) {
  const failures = []
  const { light = {}, dark = {} } = item.cssVars ?? {}
  for (const [name, value] of Object.entries(light)) {
    const definitions = css.split(`--${name}:`).length - 1
    const expected = name in dark ? 2 : 1
    if (definitions < expected) {
      failures.push(
        `--${name} is defined ${definitions}x, expected ${expected}`
      )
    }
    if (used && !css.includes(`var(--${name})`)) {
      failures.push(`no utility reads --${name}`)
    }
    for (const value_ of [value, dark[name]].filter(Boolean)) {
      for (const [, ref] of value_.matchAll(/var\(--(color-[\w-]+)\)/g)) {
        if (!css.includes(`--${ref}:`)) {
          failures.push(`--${name} mixes --${ref}, which is not defined`)
        }
      }
    }
  }
  for (const frames of Object.keys(item.css ?? {})) {
    if (!css.includes(frames)) failures.push(`${frames} is missing`)
  }
  return failures.map((failure) => `${item.name}: ${failure}`)
}

const utilities =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|shadow|divide|decoration|caret|accent|placeholder"

// Independent of what the registry chose to ship: every fibo token a class in
// an installed file names must be read by some generated utility.
async function checkInstalledClasses(css, tokens) {
  const uiDir = path.join(appDir, "components/ui")
  const failures = []
  for (const file of await readdir(uiDir)) {
    const source = await readFile(path.join(uiDir, file), "utf8")
    for (const token of tokens) {
      const pattern = new RegExp(`\\b(?:${utilities})-${token}(?![\\w-])`)
      const match = source.match(pattern)
      if (match && !css.includes(`var(--${token})`)) {
        failures.push(`${file}: ${match[0]} compiled to nothing`)
      }
    }
  }
  return failures
}

async function buildAndCheck(items, tokens, options) {
  await run("pnpm", ["exec", "tsc", "--noEmit"], appDir)
  await run("pnpm", ["run", "build"], appDir)
  const css = await compiledCss(appDir)
  return [
    ...(await checkInstalledClasses(css, tokens)),
    ...items.flatMap((item) => check(css, item, options)),
  ]
}

const server = createServer(async (request, response) => {
  try {
    const file = path.join(publicDir, path.normalize(request.url))
    if (!file.startsWith(publicDir)) throw new Error("outside public")
    const body = await readFile(file)
    response.writeHead(200, { "content-type": "application/json" })
    response.end(body)
  } catch {
    response.writeHead(404).end()
  }
})

const tmp = await mkdtemp(path.join(os.tmpdir(), "fibo-smoke-"))
const appDir = path.join(tmp, "smoke")
let failures

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const local = `http://127.0.0.1:${server.address().port}`
  await buildRegistry({ FIBO_SITE_URL: local })

  const { items } = JSON.parse(
    await readFile(path.join(registryDir, "registry.json"), "utf8")
  )
  const isTheme = (item) =>
    item.name === "theme" || item.name.startsWith("theme-")
  const components = items.filter((item) => !isTheme(item))
  const theme = items.find((item) => item.name === "theme")
  const scopedThemes = items.filter((item) => item.name.startsWith("theme-"))

  await run(
    shadcn,
    ["init", "-t", "next", "-b", "base", "-d", "-y", "--name", "smoke"],
    tmp
  )
  const configPath = path.join(appDir, "components.json")
  const config = JSON.parse(await readFile(configPath, "utf8"))
  config.registries = { "@fibo": `${local}/r/{name}.json` }
  await writeFile(configPath, JSON.stringify(config, null, 2))

  await run(
    shadcn,
    ["add", ...components.map((item) => `@fibo/${item.name}`), "-y", "-o"],
    appDir
  )
  const tokens = Object.keys(theme.cssVars.light)
  failures = await buildAndCheck(components, tokens, { used: true })

  if (failures.length === 0) {
    await run(shadcn, ["add", "@fibo/theme", "-y", "-o"], appDir)
    failures = await buildAndCheck([...components, theme], tokens, {
      used: false,
    })
  }

  // Scoped themes go on last, over the full theme, the way an app would add
  // one. Their rules are matched by the custom properties they set, since a
  // minifier rewrites selectors.
  if (failures.length === 0 && scopedThemes.length) {
    await run(
      shadcn,
      ["add", ...scopedThemes.map((item) => `@fibo/${item.name}`), "-y", "-o"],
      appDir
    )
    failures = await buildAndCheck([...components, theme], tokens, {
      used: false,
    })
    const css = await compiledCss(appDir)
    for (const item of scopedThemes) {
      for (const declarations of Object.values(item.css)) {
        for (const [property, value] of Object.entries(declarations)) {
          if (property.startsWith("--") && !css.includes(`${property}:`)) {
            failures.push(`${item.name}: ${property} is missing`)
          }
          // A literal colour only the theme sets proves its value landed.
          if (/^#[0-9a-f]{6}$/.test(value) && !css.includes(value)) {
            failures.push(`${item.name}: ${property} ${value} is missing`)
          }
        }
      }
    }
  }
} finally {
  server.close()
  await buildRegistry({ FIBO_SITE_URL: "" })
  if (process.env.KEEP_SMOKE_APP) console.log(`Smoke app kept at ${appDir}`)
  else await rm(tmp, { recursive: true, force: true })
}

if (failures.length) {
  console.error(
    `\n${failures.length} install problems:\n${failures.join("\n")}`
  )
  process.exit(1)
}
console.log("\nEvery registry item installs, builds and has its tokens.")
