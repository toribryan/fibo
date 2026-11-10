// Writes the semantic color blocks in globals.css from Figma's Color
// collection, as last read into figma/snapshot.json by the figma-drift skill.
// Figma is the source; the block between tokens:start and tokens:end is
// never edited by hand. Values are written as references to Tailwind's
// ramps, the same way the drift check reads them back.
//
//   pnpm tokens:build          rewrite the block in globals.css
//   pnpm tokens:build --check  exit 1 if the block is out of date
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

import * as prettier from "prettier"

const root = path.resolve(import.meta.dirname, "..")
const globalsPath = path.join(root, "packages/ui/src/styles/globals.css")
const snapshot = JSON.parse(
  readFileSync(path.join(root, "figma/snapshot.json"), "utf8")
)
const color = snapshot.variables.Color
const descriptions = snapshot.variables.ColorDescriptions ?? {}
const START = "/* tokens:start"
const END = "/* tokens:end */"

const MODES = {
  Light: ':root,\n[data-theme="fibo"]',
  Dark: '.dark,\n.dark [data-theme="fibo"]',
}

const globals = readFileSync(globalsPath, "utf8")
const from = globals.indexOf(START)
const to = globals.indexOf(END)
if (from === -1 || to === -1) {
  throw new Error("globals.css is missing the tokens:start/tokens:end markers")
}

// Keep the order the block already has, so a sync only shows what changed.
// Variables new to Figma go at the end, in Figma's order.
const existing = [
  ...globals.slice(from, to).matchAll(/^ {2}--([\w-]+):/gm),
].map(([, name]) => name)
const order = [...new Set(existing)]
for (const name of Object.keys(color))
  if (!order.includes(name)) order.push(name)
if (!order.includes("radius")) order.push("radius")

const blocks = Object.entries(MODES).map(([mode, selector]) => {
  const lines = []
  for (const name of order) {
    if (name === "radius") {
      if (mode === "Light") lines.push(radius())
      continue
    }
    if (!color[name]) continue
    if (mode === "Light" && descriptions[name]) {
      if (lines.length) lines.push("")
      lines.push(...comment(descriptions[name]))
    }
    lines.push(`  --${name}: ${css(color[name][mode], name)};`)
  }
  return `${selector} {\n${lines.join("\n")}\n}`
})

const region = [
  `${START}: written by pnpm tokens:build from Figma's Color collection`,
  "   (figma/snapshot.json). Change the variable in Figma, never here. */",
  blocks.join("\n\n"),
  END,
].join("\n")

const next = await prettier.format(
  globals.slice(0, from) + region + globals.slice(to + END.length),
  { filepath: globalsPath }
)

if (process.argv.includes("--check")) {
  if (next !== globals) {
    console.error(
      "globals.css is out of date with figma/snapshot.json. Run pnpm tokens:build."
    )
    process.exit(1)
  }
} else {
  writeFileSync(globalsPath, next)
}

// A Figma alias becomes a CSS reference: another Color variable to its own
// custom property, a ramp step to Tailwind's --color-<ramp>-<step>, and an
// alpha primitive, named alpha/<base>/<percent>, to a color-mix of its base.
function css(value, name) {
  if (typeof value === "number") return `${value}px`
  if (color[value]) return `var(--${value})`
  if (value === "base/transparent") return "transparent"
  let m = value.match(/^base\/(\w+)$/)
  if (m) return `var(--color-${m[1]})`
  m = value.match(/^alpha\/([\w-]+)\/(\d+)$/)
  if (m) {
    const percent = Number(m[2])
    return percent === 100
      ? `var(--color-${m[1]})`
      : `color-mix(in oklch, var(--color-${m[1]}) ${percent}%, transparent)`
  }
  m = value.match(/^([a-z]+)\/(\d+)$/)
  if (m) return `var(--color-${m[1]}-${m[2]})`
  throw new Error(`${name}: can't write Figma value ${JSON.stringify(value)}`)
}

// Figma's corner radii are pixels; the code derives its whole radius scale
// from --radius in rem, so only the lg step is written.
function radius() {
  const lg = snapshot.variables.Border["radius/lg"]
  return `  --radius: ${lg / 16}rem;`
}

// Prettier leaves comments alone, so wrap them here, in the file's style.
function comment(text) {
  if (text.length <= 74) return [`  /* ${text} */`]
  const lines = []
  let line = ""
  for (const word of text.split(" ")) {
    if (line && line.length + word.length + 1 > 73) {
      lines.push(`   * ${line}`)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  lines.push(`   * ${line}`)
  return ["  /*", ...lines, "   */"]
}
