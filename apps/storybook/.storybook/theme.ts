import { create } from "storybook/theming"

// Hex values mirror the neutral ramp in globals.css. The manager is outside
// the Tailwind build, so it cannot read those custom properties.
const fonts = {
  fontBase:
    "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontCode: "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
}

// The resting frame of the pixel snail in packages/ui, one unit per art pixel.
const PIXEL_SNAIL =
  "M3 0h5v1h-5zM2 1h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM15 1h1v1h-1zM1 2h1v1h-1zM4 2h3v1h-3zM9 2h1v1h-1zM11 2h1v1h-1zM15 2h1v1h-1zM1 3h1v1h-1zM3 3h1v1h-1zM7 3h1v1h-1zM9 3h1v1h-1zM12 3h1v1h-1zM14 3h1v1h-1zM1 4h1v1h-1zM3 4h1v1h-1zM5 4h1v1h-1zM7 4h1v1h-1zM9 4h1v1h-1zM12 4h3v1h-3zM1 5h1v1h-1zM3 5h1v1h-1zM6 5h1v1h-1zM9 5h1v1h-1zM11 5h4v1h-4zM1 6h1v1h-1zM4 6h2v1h-2zM9 6h1v1h-1zM11 6h4v1h-4zM2 7h1v1h-1zM8 7h1v1h-1zM11 7h3v1h-3zM3 8h5v1h-5zM10 8h4v1h-4zM1 9h14v1h-14zM0 10h16v1h-16z"

const mark = (color: string) =>
  `<span style="display:inline-flex;align-items:center;gap:10px;font:600 22px/1 ${fonts.fontBase};letter-spacing:-0.04em;color:${color}">` +
  `<svg width="32" height="22" viewBox="0 0 16 11" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">` +
  `<path d="${PIXEL_SNAIL}"/></svg>fibo</span>`

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
