/*
 * Colour maths for the theme creator: OKLCH to sRGB, fitting a colour into
 * the sRGB gamut, compositing alpha over a surface, and WCAG contrast. The
 * matrices are Björn Ottosson's OKLab reference values.
 */

/** A colour in OKLCH: lightness 0–1, chroma, hue in degrees. */
type Oklch = { l: number; c: number; h: number }

/** A colour in sRGB, each channel 0–1, with an optional alpha. */
type Rgb = { r: number; g: number; b: number; a?: number }

function linearFromOklch({ l, c, h }: Oklch): [number, number, number] {
  const hue = (h * Math.PI) / 180
  const a = c * Math.cos(hue)
  const b = c * Math.sin(hue)
  const l1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m1 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s1 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1,
    -1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1,
    -0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1,
  ]
}

function encode(x: number) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
}

function decode(x: number) {
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}

// Channels a hair outside 0–1 are rounding noise, not out of gamut.
const EPSILON = 0.0005

function inGamut(color: Oklch) {
  return linearFromOklch(color).every((x) => x >= -EPSILON && x <= 1 + EPSILON)
}

/**
 * Pulls chroma in until the colour fits sRGB, keeping its lightness and
 * hue, so a vivid hue at a fixed lightness still renders as itself.
 */
function fitGamut(color: Oklch): Oklch {
  if (inGamut(color)) return color
  let low = 0
  let high = color.c
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (inGamut({ ...color, c: mid })) low = mid
    else high = mid
  }
  return { ...color, c: low }
}

function toRgb(color: Oklch): Rgb {
  const [r, g, b] = linearFromOklch(color).map((x) =>
    Math.min(1, Math.max(0, encode(x)))
  ) as [number, number, number]
  return { r, g, b }
}

/** Lays a translucent colour over an opaque one, as the browser paints it. */
function composite(top: Rgb, under: Rgb): Rgb {
  const a = top.a ?? 1
  return {
    r: top.r * a + under.r * (1 - a),
    g: top.g * a + under.g * (1 - a),
    b: top.b * a + under.b * (1 - a),
  }
}

function luminance({ r, g, b }: Rgb) {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b)
}

/** The WCAG 2 contrast ratio between two opaque colours, 1 to 21. */
function contrast(one: Rgb, two: Rgb) {
  const [light, dark] = [luminance(one), luminance(two)].sort((x, y) => y - x)
  return (light! + 0.05) / (dark! + 0.05)
}

/** `#rrggbb`, or `#rrggbbaa` when the colour has alpha. */
function toHex({ r, g, b, a }: Rgb) {
  const byte = (x: number) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${byte(r)}${byte(g)}${byte(b)}${a === undefined || a >= 1 ? "" : byte(a)}`
}

/** CSS `oklch()`, trimmed to the precision Tailwind's own theme uses. */
function toCss({ l, c, h }: Oklch, alpha = 1) {
  const round = (x: number, places: number) => Number(x.toFixed(places))
  const body = `${round(l * 100, 1)}% ${round(c, 3)} ${round(c === 0 ? 0 : h, 3)}`
  return alpha < 1
    ? `oklch(${body} / ${round(alpha * 100, 1)}%)`
    : `oklch(${body})`
}

export { composite, contrast, fitGamut, inGamut, toCss, toHex, toRgb }
export type { Oklch, Rgb }
