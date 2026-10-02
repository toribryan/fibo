import { create } from "storybook/theming"

// Hex values mirror the neutral ramp in globals.css. The manager is outside
// the Tailwind build, so it cannot read those custom properties.
const fonts = {
  fontBase:
    "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontCode: "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
}

// fibo, the pixel rabbit, one unit per art pixel. On light grounds he is a
// one-pixel outline; on dark ones a solid silhouette with the inner lines
// left open, so he never reads as a thin light outline round a dark body.
const FIBO_LINE =
  "M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM8 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM8 3h1v1h-1zM10 3h1v1h-1zM1 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM4 5h3v1h-3zM9 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM1 7h1v1h-1zM11 7h1v1h-1zM0 8h1v1h-1zM11 8h1v1h-1zM0 9h1v1h-1zM2 9h1v1h-1zM7 9h1v1h-1zM11 9h1v1h-1zM0 10h1v1h-1zM2 10h1v1h-1zM7 10h1v1h-1zM11 10h4v1h-4zM0 11h1v1h-1zM4 11h2v1h-2zM10 11h1v1h-1zM15 11h1v1h-1zM1 12h2v1h-2zM8 12h2v1h-2zM16 12h1v1h-1zM2 13h1v1h-1zM12 13h1v1h-1zM17 13h1v1h-1zM2 14h1v1h-1zM11 14h1v1h-1zM17 14h3v1h-3zM2 15h1v1h-1zM6 15h1v1h-1zM10 15h1v1h-1zM17 15h1v1h-1zM19 15h1v1h-1zM2 16h1v1h-1zM6 16h1v1h-1zM9 16h1v1h-1zM17 16h1v1h-1zM19 16h1v1h-1zM2 17h1v1h-1zM6 17h1v1h-1zM9 17h1v1h-1zM17 17h2v1h-2zM1 18h2v1h-2zM5 18h2v1h-2zM8 18h2v1h-2zM16 18h1v1h-1zM1 19h16v1h-16z"
const FIBO_SOLID =
  "M1 0h3v1h-3zM7 0h3v1h-3zM0 1h5v1h-5zM6 1h5v1h-5zM0 2h2v1h-2zM3 2h2v1h-2zM6 2h2v1h-2zM9 2h2v1h-2zM0 3h2v1h-2zM3 3h2v1h-2zM6 3h2v1h-2zM9 3h2v1h-2zM1 4h4v1h-4zM6 4h2v1h-2zM9 4h2v1h-2zM1 5h9v1h-9zM2 6h9v1h-9zM1 7h11v1h-11zM0 8h12v1h-12zM0 9h2v1h-2zM3 9h4v1h-4zM8 9h4v1h-4zM0 10h2v1h-2zM3 10h4v1h-4zM8 10h7v1h-7zM0 11h4v1h-4zM6 11h4v1h-4zM11 11h5v1h-5zM1 12h7v1h-7zM10 12h7v1h-7zM2 13h10v1h-10zM13 13h5v1h-5zM2 14h9v1h-9zM12 14h8v1h-8zM2 15h4v1h-4zM7 15h3v1h-3zM11 15h6v1h-6zM18 15h2v1h-2zM2 16h4v1h-4zM7 16h2v1h-2zM10 16h7v1h-7zM18 16h2v1h-2zM2 17h4v1h-4zM7 17h2v1h-2zM10 17h9v1h-9zM1 18h4v1h-4zM7 18h1v1h-1zM10 18h7v1h-7zM1 19h16v1h-16z"

const mark = (color: string, path: string) =>
  `<span style="display:inline-flex;align-items:flex-end;gap:8px;font:500 26px/1 ${fonts.fontBase};color:${color}">` +
  `<svg width="30" height="30" viewBox="0 0 20 20" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">` +
  `<path d="${path}"/></svg>fibo</span>`

export const lightTheme = create({
  base: "light",
  ...fonts,
  brandTitle: mark("#0a0a0a", FIBO_LINE),
  brandUrl: "https://fibo.toribryan.com",
  brandTarget: "_blank",
  colorPrimary: "#171717",
  colorSecondary: "#171717",
  appBg: "#ffffff",
  appContentBg: "#ffffff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#e5e5e5",
  appBorderRadius: 8,
  textColor: "#0a0a0a",
  textMutedColor: "#737373",
  textInverseColor: "#fafafa",
  barBg: "#ffffff",
  barTextColor: "#737373",
  barSelectedColor: "#0a0a0a",
  barHoverColor: "#0a0a0a",
  inputBg: "#ffffff",
  inputBorder: "#e5e5e5",
  inputTextColor: "#0a0a0a",
  inputBorderRadius: 8,
})

export const darkTheme = create({
  base: "dark",
  ...fonts,
  brandTitle: mark("#fafafa", FIBO_SOLID),
  brandUrl: "https://fibo.toribryan.com",
  brandTarget: "_blank",
  colorPrimary: "#fafafa",
  colorSecondary: "#fafafa",
  appBg: "#0a0a0a",
  appContentBg: "#0a0a0a",
  appPreviewBg: "#0a0a0a",
  appBorderColor: "#262626",
  appBorderRadius: 8,
  textColor: "#fafafa",
  textMutedColor: "#a3a3a3",
  textInverseColor: "#0a0a0a",
  barBg: "#0a0a0a",
  barTextColor: "#a3a3a3",
  barSelectedColor: "#fafafa",
  barHoverColor: "#fafafa",
  inputBg: "#171717",
  inputBorder: "#262626",
  inputTextColor: "#fafafa",
  inputBorderRadius: 8,
})
