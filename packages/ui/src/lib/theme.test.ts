import { describe, expect, it } from "vitest"

import { contrast, fitGamut, inGamut, toHex, toRgb } from "./color.js"
import {
  DEFAULT_THEME,
  checkContrast,
  cssVariables,
  decodeTheme,
  encodeTheme,
  figmaTokens,
  themeCss,
  type Theme,
} from "./theme.js"

describe("color", () => {
  it("measures black on white at 21:1", () => {
    expect(contrast({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 })).toBeCloseTo(21)
  })

  it("converts OKLCH white and a known Tailwind colour to sRGB", () => {
    expect(toHex(toRgb({ l: 1, c: 0, h: 0 }))).toBe("#ffffff")
    // Tailwind's red-700 is #c10007.
    expect(toHex(toRgb({ l: 0.505, c: 0.213, h: 27.518 }))).toBe("#c10007")
  })

  it("pulls an out-of-gamut colour in without moving its lightness or hue", () => {
    const vivid = { l: 0.5, c: 0.4, h: 150 }
    expect(inGamut(vivid)).toBe(false)
    const fitted = fitGamut(vivid)
    expect(inGamut(fitted)).toBe(true)
    expect(fitted.l).toBe(vivid.l)
    expect(fitted.h).toBe(vivid.h)
    expect(fitted.c).toBeLessThan(vivid.c)
  })
})

describe("theme", () => {
  it("reproduces globals.css with the defaults", () => {
    const light = cssVariables(DEFAULT_THEME, "light")
    expect(light["--primary"]).toBe("oklch(20.5% 0 0)")
    expect(light["--muted-foreground"]).toBe("oklch(55.6% 0 0)")
    expect(light["--destructive"]).toBe("oklch(50.5% 0.213 27.518)")
    expect(light["--input-subtle"]).toBe("oklch(92.2% 0 0 / 20%)")
    expect(light["--radius"]).toBe("8px")
    const dark = cssVariables(DEFAULT_THEME, "dark")
    expect(dark["--background"]).toBe("oklch(14.5% 0 0)")
    expect(dark["--warning"]).toBe("oklch(82.8% 0.189 84.429)")
    expect(dark["--border"]).toBe("oklch(100% 0 0 / 10%)")
  })

  it("defines the property tokens globals.css's @theme block reads", () => {
    for (const mode of ["light", "dark"] as const) {
      const vars = cssVariables(DEFAULT_THEME, mode)
      for (const role of ["destructive", "success", "warning", "info"]) {
        for (const property of ["text", "border", "icon"]) {
          expect(
            vars[`--${role}-${property}`],
            `${mode} ${role}-${property}`
          ).toBe(vars[`--${role}`])
        }
      }
    }
    expect(figmaTokens(DEFAULT_THEME).Light).not.toHaveProperty("success-text")
  })

  it("finds only the one known gap in fibo's own theme", () => {
    // Muted text on the muted fill, just under 4.5:1 in light mode. Parts use
    // full-strength text there instead.
    const failures = checkContrast(DEFAULT_THEME)
      .filter((c) => !c.pass)
      .map((c) => `${c.mode}: ${c.label}`)
    expect(failures).toEqual(["light: Muted text on a muted fill"])
  })

  it("keeps a status role's dark hue offset when its hue moves", () => {
    const theme: Theme = {
      ...DEFAULT_THEME,
      status: { ...DEFAULT_THEME.status, warning: 100 },
    }
    const dark = cssVariables(theme, "dark")["--warning"]!
    // Amber's 400 sits 35.4° past its 700.
    expect(dark).toContain(" 135.431)")
  })

  it("tints every neutral step toward a custom hue", () => {
    const theme: Theme = {
      ...DEFAULT_THEME,
      neutral: { preset: "custom", hue: 30, amount: 1 },
    }
    expect(cssVariables(theme, "light")["--muted-foreground"]).toMatch(
      /^oklch\(55\.6% 0\.046 30\)$/
    )
  })

  it("writes :root and .dark blocks, with radius and fonts only once", () => {
    const css = themeCss(DEFAULT_THEME)
    expect(css).toMatch(/^:root \{\n {2}--background: /)
    expect(css).toContain("\n.dark {\n")
    expect(css.match(/--radius:/g)).toHaveLength(1)
    expect(css.match(/--font-sans:/g)).toHaveLength(1)
  })

  it("exports Figma tokens per mode, in hex with alpha", () => {
    const figma = figmaTokens(DEFAULT_THEME)
    expect(figma.Light.background).toEqual({
      $type: "color",
      $value: "#ffffff",
    })
    expect(figma.Dark.border?.$value).toBe("#ffffff1a")
    expect(figma.Light["radius-sm"]).toEqual({
      $type: "dimension",
      $value: "4px",
    })
  })

  it("round-trips a theme through its link code", () => {
    const theme: Theme = {
      neutral: { preset: "custom", hue: 210, amount: 0.6 },
      radius: 12,
      accent: { on: true, hue: 145 },
      status: { destructive: 10, success: 140, warning: 60, info: 230 },
      fonts: { sans: "Inter", mono: "JetBrains Mono" },
    }
    expect(decodeTheme(encodeTheme(theme))).toEqual(theme)
    expect(decodeTheme(encodeTheme(DEFAULT_THEME))).toEqual({
      ...DEFAULT_THEME,
      status: {
        destructive: 28,
        success: 150,
        warning: 49,
        info: 264,
      },
    })
  })

  it("falls back to the defaults for anything it can't read", () => {
    expect(decodeTheme("nonsense")).toEqual(DEFAULT_THEME)
    expect(decodeTheme("stone_99_x").neutral).toEqual({ preset: "stone" })
    expect(decodeTheme("stone_99_x").radius).toBe(DEFAULT_THEME.radius)
  })
})
