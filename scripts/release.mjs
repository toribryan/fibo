// Cuts a release from changes/*.md: writes the version's section in
// CHANGELOG.md, adds the entries to the Storybook changelog, bumps both
// package.json versions and deletes the fragments. Tagging stays manual.
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs"

const SECTIONS = [
  ["breaking", "Upgrade notes"],
  ["added", "Added"],
  ["changed", "Changed"],
  ["deprecated", "Deprecated"],
  ["removed", "Removed"],
  ["fixed", "Fixed"],
  ["security", "Security"],
]
const REPO = "https://github.com/toribryan/fibo"
const CHANGELOG = "CHANGELOG.md"
const STORYBOOK = "apps/storybook/src/pages/changelog.mdx"
const PACKAGES = ["package.json", "apps/registry/package.json"]

const version = process.argv[2]
const current = JSON.parse(readFileSync("package.json", "utf8")).version
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) fail("Usage: pnpm release <x.y.z>")
if (compare(version, current) <= 0)
  fail(`${version} is not newer than ${current}`)

const fragments = readFragments()
const unreleased = readUnreleased()
if (!fragments.length && !unreleased.size) fail("Nothing to release")

const date = new Date().toISOString().slice(0, 10)
writeChangelog()
writeStorybook()
for (const file of PACKAGES) {
  const json = JSON.parse(readFileSync(file, "utf8"))
  json.version = version
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`)
}
for (const { file } of fragments) unlinkSync(file)
execFileSync("pnpm", ["prettier", "--write", CHANGELOG, STORYBOOK], {
  stdio: "ignore",
})

console.log(`Released ${fragments.length} change(s) as ${version}.`)
console.log("Review the diff, merge it, then tag the merge commit:")
console.log(`  git tag v${version} && git push origin v${version}`)

function readFragments() {
  return readdirSync("changes")
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => {
      const file = `changes/${name}`
      const match = readFileSync(file, "utf8").match(
        /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
      )
      if (!match) fail(`${file} has no front matter`)
      const meta = Object.fromEntries(
        match[1].split("\n").map((line) => line.split(":").map((s) => s.trim()))
      )
      const type = meta.breaking === "true" ? "breaking" : meta.type
      if (!SECTIONS.some(([key]) => key === type)) {
        fail(`${file}: unknown type "${meta.type}"`)
      }
      return { file, type, body: match[2].trim(), added: addedAt(file) }
    })
    .sort((a, b) => a.added - b.added)
}

// Merge order, so the changelog reads in the order things landed.
function addedAt(file) {
  const out = execFileSync(
    "git",
    ["log", "--diff-filter=A", "--format=%ct", "--", file],
    { encoding: "utf8" }
  ).trim()
  return Number(out.split("\n").pop()) || Date.now() / 1000
}

// Entries written straight into [Unreleased] before fragments existed.
function readUnreleased() {
  const text = readFileSync(CHANGELOG, "utf8")
  const body = text.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[)/)?.[1] ?? ""
  const sections = new Map()
  for (const block of body.split(/^### /m).slice(1)) {
    const [heading, ...rest] = block.split("\n")
    const content = rest.join("\n").trim()
    if (content) sections.set(heading.trim(), content)
  }
  return sections
}

function bullet(body) {
  return `- ${body.replace(/\n/g, "\n  ")}`
}

function writeChangelog() {
  const parts = []
  for (const [key, heading] of SECTIONS) {
    const lines = [
      unreleased.get(heading),
      ...fragments.filter((f) => f.type === key).map((f) => bullet(f.body)),
    ].filter(Boolean)
    if (lines.length) parts.push(`### ${heading}\n\n${lines.join("\n")}`)
  }
  const section = `## [${version}] - ${date}\n\n${parts.join("\n\n")}\n`

  let text = readFileSync(CHANGELOG, "utf8")
  text = text.replace(
    /## \[Unreleased\]\n[\s\S]*?(?=\n## \[)/,
    `## [Unreleased]\n\n${section}`
  )
  text = text.replace(
    /^\[Unreleased\]: .*$/m,
    `[Unreleased]: ${REPO}/compare/v${version}...HEAD\n` +
      `[${version}]: ${REPO}/compare/v${current}...v${version}`
  )
  writeFileSync(CHANGELOG, text)
}

function writeStorybook() {
  if (!fragments.length) return
  const month = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })
  const entries = [...fragments].reverse().map((f) => bullet(f.body))
  let text = readFileSync(STORYBOOK, "utf8")
  const first = text.match(/^## (.+)$/m)
  if (first?.[1] === month) {
    text = text.replace(
      `${first[0]}\n\n`,
      `${first[0]}\n\n${entries.join("\n")}\n`
    )
  } else {
    text = text.replace(/^## /m, `## ${month}\n\n${entries.join("\n")}\n\n## `)
  }
  writeFileSync(STORYBOOK, text)
}

function compare(a, b) {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number))
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
