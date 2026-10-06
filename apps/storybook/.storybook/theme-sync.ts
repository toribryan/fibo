/*
 * The theme is not a Storybook global. Changing a global re-renders every
 * docs page under a fresh React key, so each component would mount already
 * in the new theme and never see the change. Instead the sidebar sends an
 * event and the preview flips `.dark` on the document, the way next-themes
 * does in a real app. Manager and preview share an origin, so both read the
 * saved choice from the same storage key on load.
 */
export const THEME_EVENT = "fibo/theme"
export const THEME_REQUEST = "fibo/theme-request"

export type Theme = "light" | "dark"

const KEY = "fibo-theme"

export function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved === "light" || saved === "dark") return saved
  } catch {
    // Storage can be blocked; fall back to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function saveTheme(theme: Theme) {
  try {
    window.localStorage.setItem(KEY, theme)
  } catch {
    // Not saving only costs the choice on the next reload.
  }
}

/*
 * The design theme is a second, independent choice: fibo's own look or one
 * of the themes in packages/ui/src/styles/themes. It travels the same way
 * as light and dark, and the preview sets it as `data-theme` on <html>.
 */
export const DESIGN_THEME_EVENT = "fibo/design-theme"
export const DESIGN_THEME_REQUEST = "fibo/design-theme-request"

export const DESIGN_THEMES = ["fibo", "mechanical", "electrical"] as const
export type DesignTheme = (typeof DESIGN_THEMES)[number]

/*
 * Each theme lays out Storybook's chrome its own way (manager-head.html):
 * fibo floats the sidebar as a card over the page, Electrical keeps it flat
 * beside the page, and these themes inset the page in a surface panel.
 */
export const INSET_THEMES: readonly DesignTheme[] = ["mechanical"]

const DESIGN_KEY = "fibo-design-theme"

const isDesignTheme = (value: unknown): value is DesignTheme =>
  DESIGN_THEMES.includes(value as DesignTheme)

export function readDesignTheme(): DesignTheme {
  try {
    const saved = window.localStorage.getItem(DESIGN_KEY)
    if (isDesignTheme(saved)) return saved
  } catch {
    // Storage can be blocked; fall back to fibo's own look.
  }
  return "fibo"
}

export function saveDesignTheme(theme: DesignTheme) {
  try {
    window.localStorage.setItem(DESIGN_KEY, theme)
  } catch {
    // Not saving only costs the choice on the next reload.
  }
}
