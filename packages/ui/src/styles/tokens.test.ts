import { afterEach, describe, expect, it } from "vitest"

/*
 * Every status token, in both themes, against every surface it is meant to
 * sit on. Text needs 4.5:1 (WCAG 1.4.3), icons and borders 3:1 (1.4.11).
 * Colors are read from the real utility classes, so this also checks that
 * each class resolves to its property token.
 */

const STATUSES = ["destructive", "success", "warning", "info"] as const
type Status = (typeof STATUSES)[number]

// Written out in full so Tailwind generates every class.
const CLASSES: Record<
  Status,
  {
    text: string
    icon: string
    border: string
    solid: string
    onSolid: string
    subtle: string
  }
> = {
  destructive: {
    text: "text-destructive",
    icon: "fill-destructive",
    border: "border-destructive",
    solid: "bg-destructive",
    onSolid: "text-destructive-foreground",
    subtle: "bg-destructive-subtle",
  },
  success: {
    text: "text-success",
    icon: "fill-success",
    border: "border-success",
    solid: "bg-success",
    onSolid: "text-success-foreground",
    subtle: "bg-success-subtle",
  },
  warning: {
    text: "text-warning",
    icon: "fill-warning",
    border: "border-warning",
    solid: "bg-warning",
    onSolid: "text-warning-foreground",
    subtle: "bg-warning-subtle",
  },
  info: {
    text: "text-info",
    icon: "fill-info",
    border: "border-info",
    solid: "bg-info",
    onSolid: "text-info-foreground",
    subtle: "bg-info-subtle",
  },
}

const SURFACES = ["bg-background", "bg-card", "bg-popover", "bg-muted"]

function read(
  className: string,
  property: "color" | "backgroundColor" | "borderColor" | "fill"
) {
  const el =
    property === "fill"
      ? document.createElementNS("http://www.w3.org/2000/svg", "rect")
      : document.createElement("div")
  el.setAttribute("class", `border ${className}`)
  document.body.append(el)
  const value = getComputedStyle(el)[property]
  el.remove()
  return value
}

// The browser's own color conversion: paint the layers onto a canvas and
// read back the sRGB pixel the screen would show.
function paint(...layers: string[]) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  for (const color of layers) {
    ctx.fillStyle = color
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

function contrast(
  fore: readonly [number, number, number],
  back: readonly [number, number, number]
) {
  const [hi, lo] = [luminance(fore), luminance(back)].sort((a, b) => b - a)
  return Math.round(((hi! + 0.05) / (lo! + 0.05)) * 100) / 100
}

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
  afterEach(() => document.documentElement.classList.remove("dark"))

  const setTheme = () =>
    document.documentElement.classList.toggle("dark", theme === "dark")

  describe.each(STATUSES)("%s", (status) => {
    const c = CLASSES[status]

    it("text clears 4.5:1 on every surface and on its own tint", () => {
      setTheme()
      const text = paint(read(c.text, "color"))
      const page = read("bg-background", "backgroundColor")
      const results = Object.fromEntries([
        ...SURFACES.map((s) => [
          s,
          contrast(text, paint(read(s, "backgroundColor"))),
        ]),
        [
          c.subtle,
          contrast(text, paint(page, read(c.subtle, "backgroundColor"))),
        ],
      ])
      for (const [surface, ratio] of Object.entries(results)) {
        expect(ratio, `${c.text} on ${surface}`).toBeGreaterThanOrEqual(4.5)
      }
    })

    it("icons and borders clear 3:1 on every surface", () => {
      setTheme()
      const icon = paint(read(c.icon, "fill"))
      const border = paint(read(c.border, "borderColor"))
      for (const s of SURFACES) {
        const surface = paint(read(s, "backgroundColor"))
        expect(
          contrast(icon, surface),
          `${c.icon} on ${s}`
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrast(border, surface),
          `${c.border} on ${s}`
        ).toBeGreaterThanOrEqual(3)
      }
    })

    it("its foreground clears 4.5:1 on the solid fill", () => {
      setTheme()
      const ratio = contrast(
        paint(read(c.onSolid, "color")),
        paint(read(c.solid, "backgroundColor"))
      )
      expect(ratio, `${c.onSolid} on ${c.solid}`).toBeGreaterThanOrEqual(4.5)
    })
  })
})
