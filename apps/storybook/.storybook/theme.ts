import { create } from "storybook/theming"

import { INSET_THEMES, type DesignTheme, type Theme } from "./theme-sync.js"

const fontCode =
  "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace"

// fibo, the pixel rabbit, one unit per art pixel. On light grounds he is a
// one-pixel outline; on dark ones a solid silhouette with the inner lines
// left open, so he never reads as a thin light outline round a dark body.
const FIBO_LINE =
  "M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM8 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM8 3h1v1h-1zM10 3h1v1h-1zM1 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM4 5h3v1h-3zM9 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM1 7h1v1h-1zM11 7h1v1h-1zM0 8h1v1h-1zM11 8h1v1h-1zM0 9h1v1h-1zM2 9h1v1h-1zM7 9h1v1h-1zM11 9h1v1h-1zM0 10h1v1h-1zM2 10h1v1h-1zM7 10h1v1h-1zM11 10h4v1h-4zM0 11h1v1h-1zM4 11h2v1h-2zM10 11h1v1h-1zM15 11h1v1h-1zM1 12h2v1h-2zM8 12h2v1h-2zM16 12h1v1h-1zM2 13h1v1h-1zM12 13h1v1h-1zM17 13h1v1h-1zM2 14h1v1h-1zM11 14h1v1h-1zM17 14h3v1h-3zM2 15h1v1h-1zM6 15h1v1h-1zM10 15h1v1h-1zM17 15h1v1h-1zM19 15h1v1h-1zM2 16h1v1h-1zM6 16h1v1h-1zM9 16h1v1h-1zM17 16h1v1h-1zM19 16h1v1h-1zM2 17h1v1h-1zM6 17h1v1h-1zM9 17h1v1h-1zM17 17h2v1h-2zM1 18h2v1h-2zM5 18h2v1h-2zM8 18h2v1h-2zM16 18h1v1h-1zM1 19h16v1h-16z"
const FIBO_SOLID =
  "M1 0h3v1h-3zM7 0h3v1h-3zM0 1h5v1h-5zM6 1h5v1h-5zM0 2h2v1h-2zM3 2h2v1h-2zM6 2h2v1h-2zM9 2h2v1h-2zM0 3h2v1h-2zM3 3h2v1h-2zM6 3h2v1h-2zM9 3h2v1h-2zM1 4h4v1h-4zM6 4h2v1h-2zM9 4h2v1h-2zM1 5h9v1h-9zM2 6h9v1h-9zM1 7h11v1h-11zM0 8h12v1h-12zM0 9h2v1h-2zM3 9h4v1h-4zM8 9h4v1h-4zM0 10h2v1h-2zM3 10h4v1h-4zM8 10h7v1h-7zM0 11h4v1h-4zM6 11h4v1h-4zM11 11h5v1h-5zM1 12h7v1h-7zM10 12h7v1h-7zM2 13h10v1h-10zM13 13h5v1h-5zM2 14h9v1h-9zM12 14h8v1h-8zM2 15h4v1h-4zM7 15h3v1h-3zM11 15h6v1h-6zM18 15h2v1h-2zM2 16h4v1h-4zM7 16h2v1h-2zM10 16h7v1h-7zM18 16h2v1h-2zM2 17h4v1h-4zM7 17h2v1h-2zM10 17h9v1h-9zM1 18h4v1h-4zM7 18h1v1h-1zM10 18h7v1h-7zM1 19h16v1h-16z"

const mark = (color: string, path: string, font: string) =>
  `<span style="display:inline-flex;align-items:flex-end;gap:8px;font:500 26px/1 ${font};color:${color}">` +
  `<svg width="30" height="30" viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">` +
  `<path d="${path}"/></svg>fibo</span>`

/*
 * The manager's chrome in each design theme and mode. The hex values mirror
 * the tokens in globals.css and styles/themes: the manager is outside the
 * Tailwind build, so it can't read those custom properties.
 */
type Chrome = {
  bg: string
  surface: string
  fg: string
  muted: string
  hover: string
  border: string
  input: string
}

const CHROME: Record<DesignTheme, Record<Theme, Chrome>> = {
  fibo: {
    light: {
      bg: "#fafafa",
      surface: "#ffffff",
      fg: "#0a0a0a",
      muted: "#737373",
      hover: "#f5f5f5",
      border: "#e5e5e5",
      input: "#ffffff",
    },
    dark: {
      bg: "#0a0a0a",
      surface: "#171717",
      fg: "#fafafa",
      muted: "#a3a3a3",
      hover: "#171717",
      border: "#262626",
      input: "#171717",
    },
  },
  mechanical: {
    light: {
      bg: "#ece9e3",
      surface: "#f5f3ef",
      fg: "#1b1917",
      muted: "#5e5a54",
      hover: "#e3dfd8",
      border: "#d4cfc8",
      input: "#fefdfb",
    },
    dark: {
      bg: "#191716",
      surface: "#1d1b19",
      fg: "#ece9e3",
      muted: "#a4a099",
      hover: "#282523",
      border: "#373430",
      input: "#201e1c",
    },
  },
  electrical: {
    light: {
      bg: "#f0f2ed",
      surface: "#f8f9f6",
      fg: "#141a16",
      muted: "#4f5a52",
      hover: "#dfe3dc",
      border: "#cfd5cb",
      input: "#ffffff",
    },
    dark: {
      bg: "#111512",
      surface: "#151a16",
      fg: "#e8ece6",
      muted: "#9aa49c",
      hover: "#1f2420",
      border: "#2b322c",
      input: "#181d19",
    },
  },
}

const FONTS: Record<DesignTheme, string> = {
  fibo: "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  mechanical:
    "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  electrical:
    "'Inter Tight', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
}

export function chromeColors(design: DesignTheme, mode: Theme) {
  return CHROME[design][mode]
}

export function managerTheme(design: DesignTheme, mode: Theme) {
  const c = CHROME[design][mode]
  const fontBase = FONTS[design]
  const content = INSET_THEMES.includes(design) ? c.surface : c.bg
  return create({
    base: mode,
    fontBase,
    fontCode,
    brandTitle: mark(c.fg, mode === "dark" ? FIBO_SOLID : FIBO_LINE, fontBase),
    brandUrl: "https://fibo.toribryan.com",
    brandTarget: "_blank",
    colorPrimary: c.fg,
    colorSecondary: c.fg,
    appBg: c.bg,
    appContentBg: content,
    appPreviewBg: content,
    appBorderColor: c.border,
    appBorderRadius: 8,
    textColor: c.fg,
    textMutedColor: c.muted,
    textInverseColor: c.bg,
    barBg: content,
    barTextColor: c.muted,
    barSelectedColor: c.fg,
    barHoverColor: c.fg,
    inputBg: c.input,
    inputBorder: c.border,
    inputTextColor: c.fg,
    inputBorderRadius: 8,
  })
}
