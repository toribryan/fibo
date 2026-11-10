// Writes the semantic color blocks in globals.css from tokens/, the Tokens
// Studio sync folder (plans/017-tokens-studio.md). Style Dictionary loads and
// validates each theme's token sets; the values are written as references to
// Tailwind's ramps, never resolved hex, so the code keeps Tailwind's palette.
//
//   pnpm tokens:build          rewrite the block in globals.css
//   pnpm tokens:build --check  exit 1 if the block is out of date
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"

import * as prettier from "prettier"
import StyleDictionary from "style-dictionary"

const root = path.resolve(import.meta.dirname, "..")
const tokensDir = path.join(root, "tokens")
const globalsPath = path.join(root, "packages/ui/src/styles/globals.css")
const START = "/* tokens:start"
const END = "/* tokens:end */"

// The Color theme group is Figma's Color collection; each theme is a mode.
const SELECTORS = {
  Light: ':root,\n[data-theme="fibo"]',
  Dark: '.dark,\n.dark [data-theme="fibo"]',
}

const themes = JSON.parse(
  readFileSync(path.join(tokensDir, "$themes.json"), "utf8")
)

const blocks = []
for (const [name, selector] of Object.entries(SELECTORS)) {
  const theme = themes.find((t) => t.group === "Color" && t.name === name)
  if (!theme) throw new Error(`tokens/$themes.json has no Color/${name} theme`)
  const declarations = await declarationsFor(theme)
  if (name === "Light") declarations.push(radius())
  blocks.push(`${selector} {\n${declarations.join("\n")}\n}`)
}

const region = [
  `${START}: written by pnpm tokens:build from tokens/. Change a token in`,
  "   Tokens Studio, or in tokens/*.json, never here. */",
  blocks.join("\n\n"),
  END,
].join("\n")

const globals = readFileSync(globalsPath, "utf8")
const from = globals.indexOf(START)
const to = globals.indexOf(END)
if (from === -1 || to === -1) {
  throw new Error("globals.css is missing the tokens:start/tokens:end markers")
}
const next = await prettier.format(
  globals.slice(0, from) + region + globals.slice(to + END.length),
  { filepath: globalsPath }
)

if (process.argv.includes("--check")) {
  if (next !== globals) {
    console.error(
      "globals.css is out of date with tokens/. Run pnpm tokens:build."
    )
    process.exit(1)
  }
} else {
  writeFileSync(globalsPath, next)
}

async function declarationsFor(theme) {
  const sets = Object.entries(theme.selectedTokenSets).filter(
    ([, state]) => state !== "disabled"
  )
  const sd = new StyleDictionary({
    source: sets.map(([set]) => path.join(tokensDir, `${set}.json`)),
    usesDtcg: true,
    log: { verbosity: "silent", warnings: "disabled" },
    platforms: { css: {} },
  })
  // Throws on a reference to a token that doesn't exist.
  const { allTokens } = await sd.getPlatformTokens("css")

  const enabled = new Set(
    sets
      .filter(([, state]) => state === "enabled")
      .map(([set]) => path.join(tokensDir, `${set}.json`))
  )
  const byPath = new Map(allTokens.map((t) => [t.path.join("."), t]))
  const lines = []
  for (const token of allTokens) {
    if (!enabled.has(path.resolve(token.filePath))) continue
    const description = token.$description ?? token.original.$description
    if (description) {
      if (lines.length) lines.push("")
      lines.push(...comment(description))
    }
    lines.push(`  --${token.path.join("-")}: ${css(token, byPath)};`)
  }
  return lines
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

// A reference becomes a CSS reference: a primitive to Tailwind's
// --color-<ramp>-<step>, an alpha primitive to a color-mix of its base (the
// name says which, as alpha/<base>/<percent>), and a semantic token to its
// own custom property. Anything else is written as it is.
function css(token, byPath) {
  const value = token.original.$value
  const match = typeof value === "string" && value.match(/^\{(.+)\}$/)
  if (!match) return String(value)

  const target = byPath.get(match[1])
  if (!target) throw new Error(`${token.name}: unknown reference ${value}`)
  const [group, ...rest] = target.path
  if (!target.filePath.endsWith("primitives.json")) {
    return `var(--${target.path.join("-")})`
  }
  if (group === "base") {
    return rest[0] === "transparent" ? "transparent" : `var(--color-${rest[0]})`
  }
  if (group === "alpha") {
    const [base, percent] = rest
    return `color-mix(in oklch, var(--color-${base}) ${Number(percent)}%, transparent)`
  }
  return `var(--color-${target.path.join("-")})`
}

// Figma's corner radii are pixels; the code's whole radius scale is derived
// from --radius in rem, so only the lg step is written.
function radius() {
  const border = JSON.parse(
    readFileSync(path.join(tokensDir, "border.json"), "utf8")
  )
  return `  --radius: ${border.radius.lg.$value / 16}rem;`
}
