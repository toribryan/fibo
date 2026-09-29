import { create } from "storybook/theming"

// Hex values mirror the neutral ramp in globals.css. The manager is outside
// the Tailwind build, so it cannot read those custom properties.
const fonts = {
  fontBase:
    "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontCode: "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
}

// fibo's resting frame from the pixel snail, one unit per art pixel.
const FIBO =
  "M13 0h2v1h-2zM18 0h2v1h-2zM4 1h5v1h-5zM12 1h1v1h-1zM15 1h1v1h-1zM17 1h1v1h-1zM20 1h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h3v1h-3zM12 2h1v1h-1zM14 2h2v1h-2zM17 2h1v1h-1zM19 2h2v1h-2zM2 3h1v1h-1zM4 3h2v1h-2zM8 3h1v1h-1zM10 3h1v1h-1zM13 3h2v1h-2zM18 3h2v1h-2zM1 4h4v1h-4zM9 4h3v1h-3zM14 4h1v1h-1zM18 4h1v1h-1zM1 5h1v1h-1zM3 5h1v1h-1zM6 5h2v1h-2zM11 5h1v1h-1zM15 5h1v1h-1zM17 5h1v1h-1zM1 6h1v1h-1zM3 6h2v1h-2zM7 6h1v1h-1zM11 6h1v1h-1zM15 6h3v1h-3zM1 7h2v1h-2zM4 7h4v1h-4zM10 7h2v1h-2zM14 7h4v1h-4zM2 8h1v1h-1zM10 8h1v1h-1zM14 8h4v1h-4zM2 9h3v1h-3zM8 9h3v1h-3zM14 9h3v1h-3zM4 10h5v1h-5zM13 10h4v1h-4zM1 11h17v1h-17zM0 12h19v1h-19z"

const mark = (color: string) =>
  `<span style="display:inline-flex;align-items:center;gap:6px;font:500 26px/1 ${fonts.fontBase};letter-spacing:-0.04em;color:${color}">` +
  `<svg width="42" height="26" viewBox="0 0 21 13" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">` +
  `<path d="${FIBO}"/></svg>fibo</span>`

export const lightTheme = create({
  base: "light",
  ...fonts,
  brandTitle: mark("#0a0a0a"),
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
  brandTitle: mark("#fafafa"),
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
