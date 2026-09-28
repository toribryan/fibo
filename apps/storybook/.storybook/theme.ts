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
  "M4 0h5v1h-5zM2 1h3v1h-3zM6 1h1v1h-1zM8 1h3v1h-3zM2 2h1v1h-1zM4 2h2v1h-2zM8 2h1v1h-1zM10 2h1v1h-1zM13 2h1v1h-1zM17 2h1v1h-1zM1 3h4v1h-4zM9 3h3v1h-3zM13 3h1v1h-1zM17 3h1v1h-1zM1 4h1v1h-1zM3 4h1v1h-1zM6 4h2v1h-2zM11 4h1v1h-1zM14 4h1v1h-1zM16 4h1v1h-1zM1 5h1v1h-1zM3 5h2v1h-2zM7 5h1v1h-1zM11 5h1v1h-1zM14 5h3v1h-3zM1 6h2v1h-2zM4 6h4v1h-4zM10 6h2v1h-2zM13 6h4v1h-4zM2 7h1v1h-1zM10 7h1v1h-1zM13 7h4v1h-4zM2 8h3v1h-3zM8 8h3v1h-3zM13 8h3v1h-3zM4 9h5v1h-5zM12 9h4v1h-4zM1 10h16v1h-16zM0 11h18v1h-18z"

const mark = (color: string) =>
  `<span style="display:inline-flex;align-items:center;gap:10px;font:600 22px/1 ${fonts.fontBase};letter-spacing:-0.04em;color:${color}">` +
  `<svg width="36" height="24" viewBox="0 0 18 12" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">` +
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
