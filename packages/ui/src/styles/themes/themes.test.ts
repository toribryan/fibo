import { afterEach, describe, expect, it } from "vitest"

import "./mechanical.css"
import "./sage.css"

/*
 * Each theme's pairs, in both modes, read from the real utility classes with
 * the theme on <html>: text needs 4.5:1 (WCAG 1.4.3), icons 3:1 (1.4.11).
 */

const SURFACES = [
  "bg-background",
  "bg-card",
  "bg-popover",
  "bg-muted",
  "bg-accent",
]

function read(className: string, property: "color" | "backgroundColor") {
  const el = document.createElement("div")
  el.className = className
  document.body.append(el)
  const value = getComputedStyle(el)[property]
  el.remove()
  return value
}

// The browser's own colour conversion: paint the layers onto a canvas and
// read back the sRGB pixel the screen would show.
function paint(...layers: string[]) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  for (const colour of layers) {
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, 1, 1)
  }
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r!, g!, b!] as const
}

function luminance([r, g, b]: readonly [number, number, number]) {
  const linear = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrast(fore: string, back: string) {
  const [hi, lo] = [luminance(paint(fore)), luminance(paint(back))].sort(
    (a, b) => b - a
  )
  return Math.round(((hi! + 0.05) / (lo! + 0.05)) * 100) / 100
}

// Only themes that colour their chart tokens promise coloured icons.
const THEMES = [
  { theme: "mechanical", colourIcons: true },
  { theme: "sage", colourIcons: false },
]

const CASES = THEMES.flatMap((entry) =>
  (["light", "dark"] as const).map((mode) => ({ ...entry, mode }))
)

describe.each(CASES)("$theme, $mode", ({ theme, colourIcons, mode }) => {
  const setTheme = () => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle("dark", mode === "dark")
  }
  afterEach(() => {
    delete document.documentElement.dataset.theme
    document.documentElement.classList.remove("dark")
  })

  it("text clears 4.5:1 on every surface", () => {
    setTheme()
    for (const text of [
      "text-foreground",
      "text-muted-foreground",
      "text-destructive",
      "text-success",
      "text-warning",
      "text-info",
    ]) {
      for (const surface of SURFACES) {
        expect
          .soft(
            contrast(read(text, "color"), read(surface, "backgroundColor")),
            `${text} on ${surface}`
          )
          .toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it("labels clear 4.5:1 on their own fills", () => {
    setTheme()
    for (const [text, fill] of [
      ["text-primary-foreground", "bg-primary"],
      ["text-primary-foreground", "bg-primary-hover"],
      ["text-secondary-foreground", "bg-secondary"],
      ["text-secondary-foreground", "bg-secondary-hover"],
      ["text-accent-foreground", "bg-accent"],
    ] as const) {
      expect
        .soft(
          contrast(read(text, "color"), read(fill, "backgroundColor")),
          `${text} on ${fill}`
        )
        .toBeGreaterThanOrEqual(4.5)
    }
  })

  it.runIf(colourIcons)(
    "chart colours clear 3:1 as icons on menus and the page",
    () => {
      setTheme()
      for (const chart of [1, 2, 3, 4, 5]) {
        for (const surface of ["bg-background", "bg-popover", "bg-accent"]) {
          expect
            .soft(
              contrast(
                read(`text-chart-${chart}`, "color"),
                read(surface, "backgroundColor")
              ),
              `text-chart-${chart} on ${surface}`
            )
            .toBeGreaterThanOrEqual(3)
        }
      }
    }
  )

  it.runIf(theme === "sage")("ink clears 4.5:1 on the highlight", () => {
    setTheme()
    const highlight = getComputedStyle(document.documentElement)
      .getPropertyValue("--highlight")
      .trim()
    expect(
      contrast(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--highlight-foreground")
          .trim(),
        highlight
      )
    ).toBeGreaterThanOrEqual(4.5)
  })
})
