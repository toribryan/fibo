import {
  composite,
  contrast,
  fitGamut,
  toCss,
  toHex,
  toRgb,
  type Oklch,
  type Rgb,
} from "@workspace/ui/lib/color"

/*
 * A theme is a handful of choices; everything else is derived from them the
 * way globals.css derives the semantic roles from Tailwind's ramps. With the
 * defaults, the output matches globals.css.
 */

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
type Step = (typeof STEPS)[number]
type Ramp = Record<Step, Oklch>

const NEUTRAL_PRESETS = ["neutral", "stone", "zinc", "slate", "gray"] as const
type NeutralPreset = (typeof NEUTRAL_PRESETS)[number]

const STATUS_ROLES = ["destructive", "success", "warning", "info"] as const
type StatusRole = (typeof STATUS_ROLES)[number]

const SANS_FONTS = [
  "Geist",
  "Inter",
  "IBM Plex Sans",
  "DM Sans",
  "Manrope",
  "System",
] as const
const MONO_FONTS = [
  "Geist Mono",
  "JetBrains Mono",
  "IBM Plex Mono",
  "DM Mono",
  "System",
] as const

type Theme = {
  /** A Tailwind gray, or a custom tint of neutral toward a hue. */
  neutral:
    | { preset: NeutralPreset }
    | { preset: "custom"; hue: number; amount: number }
  /** `--radius` in whole pixels. */
  radius: number
  /** A brand hue for primary, off by default: fibo has none. */
  accent: { on: boolean; hue: number }
  /** The hue of each status role, as used in light mode. */
  status: Record<StatusRole, number>
  fonts: {
    sans: (typeof SANS_FONTS)[number]
    mono: (typeof MONO_FONTS)[number]
  }
}

// Tailwind v4's values, as oklch(L% C H) with L as a fraction.
function ramp(values: [number, number, number][]): Ramp {
  return Object.fromEntries(
    STEPS.map((step, i) => {
      const [l, c, h] = values[i]!
      return [step, { l, c, h }]
    })
  ) as Ramp
}

const PRESET_RAMPS: Record<NeutralPreset, Ramp> = {
  neutral: ramp([
    [0.985, 0, 0],
    [0.97, 0, 0],
    [0.922, 0, 0],
    [0.87, 0, 0],
    [0.708, 0, 0],
    [0.556, 0, 0],
    [0.439, 0, 0],
    [0.371, 0, 0],
    [0.269, 0, 0],
    [0.205, 0, 0],
    [0.145, 0, 0],
  ]),
  stone: ramp([
    [0.985, 0.001, 106.423],
    [0.97, 0.001, 106.424],
    [0.923, 0.003, 48.717],
    [0.869, 0.005, 56.366],
    [0.709, 0.01, 56.259],
    [0.553, 0.013, 58.071],
    [0.444, 0.011, 73.639],
    [0.374, 0.01, 67.558],
    [0.268, 0.007, 34.298],
    [0.216, 0.006, 56.043],
    [0.147, 0.004, 49.25],
  ]),
  zinc: ramp([
    [0.985, 0, 0],
    [0.967, 0.001, 286.375],
    [0.92, 0.004, 286.32],
    [0.871, 0.006, 286.286],
    [0.705, 0.015, 286.067],
    [0.552, 0.016, 285.938],
    [0.442, 0.017, 285.786],
    [0.37, 0.013, 285.805],
    [0.274, 0.006, 286.033],
    [0.21, 0.006, 285.885],
    [0.141, 0.005, 285.823],
  ]),
  slate: ramp([
    [0.984, 0.003, 247.858],
    [0.968, 0.007, 247.896],
    [0.929, 0.013, 255.508],
    [0.869, 0.022, 252.894],
    [0.704, 0.04, 256.788],
    [0.554, 0.046, 257.417],
    [0.446, 0.043, 257.281],
    [0.372, 0.044, 257.287],
    [0.279, 0.041, 260.031],
    [0.208, 0.042, 265.755],
    [0.129, 0.042, 264.695],
  ]),
  gray: ramp([
    [0.985, 0.002, 247.839],
    [0.967, 0.003, 264.542],
    [0.928, 0.006, 264.531],
    [0.872, 0.01, 258.338],
    [0.707, 0.022, 261.325],
    [0.551, 0.027, 264.364],
    [0.446, 0.03, 256.802],
    [0.373, 0.034, 259.733],
    [0.278, 0.033, 256.848],
    [0.21, 0.034, 264.665],
    [0.13, 0.028, 261.692],
  ]),
}

// How much of a custom tint each step takes: slate's chroma curve, scaled
// so its peak is 1. Ends stay nearly gray, the middle carries the tint.
const TINT_CURVE = [
  0.065, 0.152, 0.283, 0.478, 0.87, 1, 0.935, 0.957, 0.891, 0.913, 0.913,
]
// The chroma a custom tint reaches at full amount: slate's peak.
const TINT_MAX = 0.046

/*
 * The step each status role uses today, 700 in light mode and 400 in dark,
 * from Tailwind's red, green, amber and blue. A new hue keeps each step's
 * lightness and chroma, and the dark step keeps its hue offset from the
 * light one, since Tailwind's ramps drift in hue as they lighten.
 *
 * Some of these sit a little outside sRGB, as Tailwind's own colors do for
 * wide-gamut screens. The CSS keeps them as they are and lets the browser
 * map them; only the sRGB math (contrast, Figma hex) fits them first.
 */
const STATUS_STEPS: Record<StatusRole, { light: Oklch; dark: Oklch }> = {
  destructive: {
    light: { l: 0.505, c: 0.213, h: 27.518 },
    dark: { l: 0.704, c: 0.191, h: 22.216 },
  },
  success: {
    light: { l: 0.527, c: 0.154, h: 150.069 },
    dark: { l: 0.792, c: 0.209, h: 151.711 },
  },
  warning: {
    light: { l: 0.555, c: 0.163, h: 48.998 },
    dark: { l: 0.828, c: 0.189, h: 84.429 },
  },
  info: {
    light: { l: 0.488, c: 0.243, h: 264.376 },
    dark: { l: 0.707, c: 0.165, h: 254.624 },
  },
}

// An accent primary sits where it holds white text in light mode and dark
// text in dark mode.
const ACCENT = {
  light: { l: 0.5, c: 0.2 },
  dark: { l: 0.78, c: 0.15 },
}

const DEFAULT_THEME: Theme = {
  neutral: { preset: "neutral" },
  radius: 8,
  accent: { on: false, hue: 264 },
  status: {
    destructive: STATUS_STEPS.destructive.light.h,
    success: STATUS_STEPS.success.light.h,
    warning: STATUS_STEPS.warning.light.h,
    info: STATUS_STEPS.info.light.h,
  },
  fonts: { sans: "Geist", mono: "Geist Mono" },
}

function neutralRamp(neutral: Theme["neutral"]): Ramp {
  if (neutral.preset !== "custom") return PRESET_RAMPS[neutral.preset]
  const base = PRESET_RAMPS.neutral
  return Object.fromEntries(
    STEPS.map((step, i) => [
      step,
      fitGamut({
        l: base[step].l,
        c: TINT_CURVE[i]! * TINT_MAX * neutral.amount,
        h: neutral.hue,
      }),
    ])
  ) as Ramp
}

function statusColor(role: StatusRole, hue: number, mode: Mode): Oklch {
  const steps = STATUS_STEPS[role]
  const offset = mode === "dark" ? steps.dark.h - steps.light.h : 0
  return { ...steps[mode], h: (hue + offset + 360) % 360 }
}

type Mode = "light" | "dark"

/** One semantic role's value: a color, and alpha when it's translucent. */
type Token = { color: Oklch; alpha?: number }

const WHITE: Oklch = { l: 1, c: 0, h: 0 }

function tokens(theme: Theme, mode: Mode): Record<string, Token> {
  const n = neutralRamp(theme.neutral)
  const solid = (color: Oklch): Token => ({ color })
  const alpha = (color: Oklch, a: number): Token => ({ color, alpha: a })
  const status = (role: StatusRole) =>
    statusColor(role, theme.status[role], mode)
  const accent = theme.accent.on
    ? { ...ACCENT[mode], h: theme.accent.hue }
    : null

  if (mode === "light") {
    const primary = accent ?? n[900]
    const statusTokens = (role: StatusRole) => {
      const color = status(role)
      const extra: Record<string, Token> =
        role === "destructive"
          ? {
              [`${role}-subtle-hover`]: alpha(color, 0.16),
              [`${role}-ring`]: alpha(color, 0.2),
            }
          : {}
      return {
        [role]: solid(color),
        [`${role}-foreground`]: solid(n[50]),
        // Matches globals.css: only destructive's red stays AA on 8%.
        [`${role}-subtle`]: alpha(color, role === "destructive" ? 0.08 : 0.06),
        ...extra,
      }
    }
    return {
      background: solid(WHITE),
      foreground: solid(n[950]),
      card: solid(WHITE),
      "card-foreground": solid(n[950]),
      popover: solid(WHITE),
      "popover-foreground": solid(n[950]),
      "popover-overlay": alpha(WHITE, 0.85),
      primary: solid(primary),
      "primary-foreground": solid(n[50]),
      "primary-hover": alpha(primary, 0.8),
      "primary-subtle": alpha(primary, 0.1),
      secondary: solid(n[100]),
      "secondary-foreground": solid(n[900]),
      "secondary-hover": solid(n[200]),
      muted: solid(n[100]),
      "muted-foreground": solid(n[500]),
      accent: solid(n[100]),
      "accent-foreground": solid(n[900]),
      ...statusTokens("destructive"),
      ...statusTokens("success"),
      ...statusTokens("warning"),
      ...statusTokens("info"),
      border: solid(n[200]),
      input: solid(n[200]),
      "input-subtle": alpha(n[200], 0.2),
      "input-subtle-hover": alpha(n[200], 0.5),
      ring: solid(n[400]),
      "ring-subtle": alpha(n[400], 0.5),
      "chart-1": solid(n[300]),
      "chart-2": solid(n[500]),
      "chart-3": solid(n[600]),
      "chart-4": solid(n[700]),
      "chart-5": solid(n[800]),
      sidebar: solid(n[50]),
      "sidebar-foreground": solid(n[950]),
      "sidebar-primary": solid(primary),
      "sidebar-primary-foreground": solid(n[50]),
      "sidebar-accent": solid(n[100]),
      "sidebar-accent-foreground": solid(n[900]),
      "sidebar-border": solid(n[200]),
      "sidebar-ring": solid(n[400]),
    }
  }

  const primary = accent ?? n[50]
  const statusTokens = (role: StatusRole) => {
    const color = status(role)
    const extra: Record<string, Token> =
      role === "destructive"
        ? {
            [`${role}-subtle-hover`]: alpha(color, 0.3),
            [`${role}-ring`]: alpha(color, 0.4),
          }
        : {}
    return {
      [role]: solid(color),
      [`${role}-foreground`]: solid(n[950]),
      [`${role}-subtle`]: alpha(color, 0.2),
      ...extra,
    }
  }
  return {
    background: solid(n[950]),
    foreground: solid(n[50]),
    card: solid(n[900]),
    "card-foreground": solid(n[50]),
    popover: solid(n[900]),
    "popover-foreground": solid(n[50]),
    "popover-overlay": alpha(n[900], 0.85),
    primary: solid(primary),
    "primary-foreground": solid(n[900]),
    "primary-hover": alpha(primary, 0.8),
    "primary-subtle": alpha(primary, 0.2),
    secondary: solid(n[800]),
    "secondary-foreground": solid(n[50]),
    "secondary-hover": solid(n[700]),
    muted: solid(n[800]),
    "muted-foreground": solid(n[400]),
    accent: solid(n[800]),
    "accent-foreground": solid(n[50]),
    ...statusTokens("destructive"),
    ...statusTokens("success"),
    ...statusTokens("warning"),
    ...statusTokens("info"),
    border: alpha(WHITE, 0.1),
    input: alpha(WHITE, 0.15),
    "input-subtle": alpha(WHITE, 0.05),
    "input-subtle-hover": alpha(WHITE, 0.1),
    ring: solid(n[500]),
    "ring-subtle": alpha(n[500], 0.5),
    "chart-1": solid(n[300]),
    "chart-2": solid(n[500]),
    "chart-3": solid(n[600]),
    "chart-4": solid(n[700]),
    "chart-5": solid(n[800]),
    sidebar: solid(n[900]),
    "sidebar-foreground": solid(n[50]),
    "sidebar-primary": solid(primary),
    "sidebar-primary-foreground": solid(n[900]),
    "sidebar-accent": solid(n[800]),
    "sidebar-accent-foreground": solid(n[50]),
    "sidebar-border": alpha(WHITE, 0.1),
    "sidebar-ring": solid(n[500]),
  }
}

const FONT_STACKS = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
}

function fontStack(font: string, kind: "sans" | "mono") {
  return font === "System"
    ? FONT_STACKS[kind]
    : `"${font}", ${FONT_STACKS[kind]}`
}

/** Every custom property a theme sets for one mode, ready for `style`. */
function cssVariables(theme: Theme, mode: Mode): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const [name, token] of Object.entries(tokens(theme, mode)))
    vars[`--${name}`] = toCss(token.color, token.alpha)
  vars["--radius"] = `${theme.radius}px`
  vars["--font-sans"] = fontStack(theme.fonts.sans, "sans")
  vars["--font-mono"] = fontStack(theme.fonts.mono, "mono")
  return vars
}

/** The `:root` and `.dark` blocks to paste over the ones in globals.css. */
function themeCss(theme: Theme) {
  const block = (selector: string, mode: Mode) => {
    const vars = cssVariables(theme, mode)
    // Radius and fonts don't change between modes.
    if (mode === "dark") {
      delete vars["--radius"]
      delete vars["--font-sans"]
      delete vars["--font-mono"]
    }
    const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`)
    return `${selector} {\n${lines.join("\n")}\n}`
  }
  return `${block(":root", "light")}\n\n${block(".dark", "dark")}\n`
}

// As the browser shows it on an sRGB screen: mapped into gamut first.
function rgba(token: Token): Rgb {
  return { ...toRgb(fitGamut(token.color)), a: token.alpha ?? 1 }
}

/*
 * W3C design tokens, one set per mode, as Figma's variables import expects:
 * each role a color in hex (with alpha where it's translucent), plus the
 * radius steps from globals.css.
 */
function figmaTokens(theme: Theme) {
  const mode = (m: Mode) => {
    const colors = Object.fromEntries(
      Object.entries(tokens(theme, m)).map(([name, token]) => [
        name,
        { $type: "color", $value: toHex(rgba(token)) },
      ])
    )
    const r = theme.radius
    const radius = Object.fromEntries(
      Object.entries({
        sm: r - 4,
        md: r - 2,
        lg: r,
        xl: r + 4,
        "2xl": r + 8,
      }).map(([name, px]) => [
        `radius-${name}`,
        { $type: "dimension", $value: `${Math.max(0, px)}px` },
      ])
    )
    return { ...colors, ...radius }
  }
  return { Light: mode("light"), Dark: mode("dark") }
}

/*
 * The pairs the system relies on, and what they must reach: 4.5:1 for text,
 * 3:1 for a filled control against the page. `owner` says which control
 * changes the pair, so a failure can be flagged beside it.
 */
type Owner = "neutral" | "accent" | StatusRole
const PAIRS: {
  label: string
  fg: string
  bg: string
  min: number
  owner: Owner
}[] = [
  {
    label: "Text on the page",
    fg: "foreground",
    bg: "background",
    min: 4.5,
    owner: "neutral",
  },
  {
    label: "Text on a card",
    fg: "card-foreground",
    bg: "card",
    min: 4.5,
    owner: "neutral",
  },
  {
    label: "Muted text on the page",
    fg: "muted-foreground",
    bg: "background",
    min: 4.5,
    owner: "neutral",
  },
  {
    label: "Muted text on a muted fill",
    fg: "muted-foreground",
    bg: "muted",
    min: 4.5,
    owner: "neutral",
  },
  {
    label: "Placeholder in an input",
    fg: "muted-foreground",
    bg: "input-subtle",
    min: 4.5,
    owner: "neutral",
  },
  {
    label: "Secondary button text",
    fg: "secondary-foreground",
    bg: "secondary",
    min: 4.5,
    owner: "neutral",
  },
  {
    label: "Primary button text",
    fg: "primary-foreground",
    bg: "primary",
    min: 4.5,
    owner: "accent",
  },
  {
    label: "Primary fill on the page",
    fg: "primary",
    bg: "background",
    min: 3,
    owner: "accent",
  },
  ...STATUS_ROLES.flatMap((role) => [
    {
      label: `Text on a solid ${role} fill`,
      fg: `${role}-foreground`,
      bg: role,
      min: 4.5,
      owner: role,
    },
    {
      label: `${role[0]!.toUpperCase()}${role.slice(1)} text on its tint`,
      fg: role,
      bg: `${role}-subtle`,
      min: 4.5,
      owner: role,
    },
  ]),
]

type Check = {
  label: string
  mode: Mode
  ratio: number
  min: number
  pass: boolean
  owner: Owner
}

/*
 * Contrast for every pair in both modes. A translucent background, such as
 * a status tint, is laid over the page first, and translucent text over
 * that, as the browser paints them.
 */
function checkContrast(theme: Theme): Check[] {
  return (["light", "dark"] as const).flatMap((mode) => {
    const t = tokens(theme, mode)
    const page = rgba(t.background!)
    return PAIRS.map((pair) => {
      const bg = composite(rgba(t[pair.bg]!), page)
      const fg = composite(rgba(t[pair.fg]!), bg)
      const ratio = contrast(fg, bg)
      return {
        label: pair.label,
        mode,
        ratio,
        min: pair.min,
        pass: ratio >= pair.min,
        owner: pair.owner,
      }
    })
  })
}

/*
 * A theme as a short, URL-safe string: its fields in a fixed order, so a
 * link stays readable and stable. Anything unreadable falls back to the
 * defaults field by field.
 */
function encodeTheme(theme: Theme) {
  const n = theme.neutral
  return [
    n.preset === "custom"
      ? `c${Math.round(n.hue)}.${Math.round(n.amount * 100)}`
      : n.preset,
    theme.radius,
    theme.accent.on ? Math.round(theme.accent.hue) : "-",
    ...STATUS_ROLES.map((role) => Math.round(theme.status[role])),
    SANS_FONTS.indexOf(theme.fonts.sans),
    MONO_FONTS.indexOf(theme.fonts.mono),
  ].join("_")
}

function decodeTheme(code: string): Theme {
  const parts = code.split("_")
  const num = (i: number, min: number, max: number, fallback: number) => {
    const value = Number(parts[i])
    return Number.isFinite(value) && value >= min && value <= max
      ? value
      : fallback
  }
  const neutralPart = parts[0] ?? ""
  const custom = /^c(\d+)\.(\d+)$/.exec(neutralPart)
  const neutral: Theme["neutral"] = custom
    ? {
        preset: "custom",
        hue: Math.min(360, Number(custom[1])),
        amount: Math.min(100, Number(custom[2])) / 100,
      }
    : (NEUTRAL_PRESETS as readonly string[]).includes(neutralPart)
      ? { preset: neutralPart as NeutralPreset }
      : DEFAULT_THEME.neutral
  const accentPart = parts[2]
  const d = DEFAULT_THEME
  return {
    neutral,
    radius: num(1, 0, 20, d.radius),
    accent:
      accentPart && accentPart !== "-"
        ? { on: true, hue: num(2, 0, 360, d.accent.hue) }
        : d.accent,
    status: Object.fromEntries(
      STATUS_ROLES.map((role, i) => [role, num(3 + i, 0, 360, d.status[role])])
    ) as Theme["status"],
    fonts: {
      sans: SANS_FONTS[num(7, 0, SANS_FONTS.length - 1, 0)]!,
      mono: MONO_FONTS[num(8, 0, MONO_FONTS.length - 1, 0)]!,
    },
  }
}

export {
  DEFAULT_THEME,
  MONO_FONTS,
  NEUTRAL_PRESETS,
  SANS_FONTS,
  STATUS_ROLES,
  checkContrast,
  cssVariables,
  decodeTheme,
  encodeTheme,
  figmaTokens,
  neutralRamp,
  themeCss,
  tokens,
}
export type { Check, Mode, NeutralPreset, Owner, StatusRole, Theme, Token }
