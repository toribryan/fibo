import { readFileSync } from "node:fs"

// The grid lives in rabbit.js so the browser pages can load it as a script.
const RABBIT = JSON.parse(
  readFileSync(new URL("./rabbit.js", import.meta.url), "utf8")
    .replace(/^[\s\S]*?window\.RABBIT = /, "")
    .replace(/,\s*\]\s*$/, "]")
)

/** fibo as a grid of cells: 1 line, 2 fill, 0 empty. */
export function fibo({ flip = false } = {}) {
  const rows = RABBIT.map((r) => (flip ? [...r].reverse().join("") : r))
  return {
    w: rows[0].length,
    h: rows.length,
    px: rows.map((r) => [...r].map(Number)),
  }
}

/*
 * The inverse, for dark grounds: his outline and fill go light and only the
 * inner lines stay dark. Returns the same shape of grid.
 */
export function invert(g) {
  const out = { w: g.w, h: g.h, px: g.px.map((r) => [...r]) }
  const outside = g.px.map((r) => r.map(() => false))
  const stack = []
  for (let x = 0; x < g.w; x++) stack.push([x, 0], [x, g.h - 1])
  for (let y = 0; y < g.h; y++) stack.push([0, y], [g.w - 1, y])
  while (stack.length) {
    const [x, y] = stack.pop()
    if (
      x < 0 ||
      y < 0 ||
      x >= g.w ||
      y >= g.h ||
      outside[y][x] ||
      g.px[y][x] !== 0
    )
      continue
    outside[y][x] = true
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  const isOut = (x, y) =>
    x < 0 || y < 0 || x >= g.w || y >= g.h || outside[y][x]
  const touches = (x, y) =>
    [-1, 0, 1].some((dy) =>
      [-1, 0, 1].some((dx) => (dx || dy) && isOut(x + dx, y + dy))
    )
  g.px.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v === 1 && touches(x, y)) out.px[y][x] = 2
    })
  )
  return out
}

/** Inline SVG, one rect per pixel, crisp at any whole-number size. */
export function toSvg(
  g,
  { size, inkColor = "var(--ink)", paperColor = "var(--paper)" } = {}
) {
  let a = "",
    b = ""
  g.px.forEach((r, y) =>
    r.forEach((v, x) => {
      if (v === 1) a += `<rect x="${x}" y="${y}" width="1" height="1"/>`
      else if (v === 2) b += `<rect x="${x}" y="${y}" width="1" height="1"/>`
    })
  )
  const dims = size ? ` width="${g.w * size}" height="${g.h * size}"` : ""
  return `<svg viewBox="0 0 ${g.w} ${g.h}"${dims} shape-rendering="crispEdges" aria-hidden="true"><g fill="${paperColor}">${b}</g><g fill="${inkColor}">${a}</g></svg>`
}
