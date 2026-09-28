import { create } from "storybook/theming"

// Hex values mirror the neutral ramp in globals.css. The manager is outside
// the Tailwind build, so it cannot read those custom properties.
const fonts = {
  fontBase:
    "Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontCode: "'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
}

const mark = (color: string) =>
  `<span style="display:inline-flex;align-items:center;gap:10px;font:600 22px/1 ${fonts.fontBase};letter-spacing:-0.04em;color:${color}">` +
  `<svg width="26" height="16" viewBox="0 0 21 13" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true">` +
  `<rect x="0.5" y="0.5" width="12" height="12"/><rect x="12.5" y="0.5" width="8" height="8"/><rect x="15.5" y="8.5" width="5" height="4"/>` +
  `<path d="M0.5 12.5A12 12 0 0 1 12.5 0.5A8 8 0 0 1 20.5 8.5A5 4 0 0 1 15.5 12.5"/></svg>fibo</span>`

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
