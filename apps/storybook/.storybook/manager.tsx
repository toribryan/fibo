import React from "react"
import {
  SET_INDEX,
  STORY_CHANGED,
  STORY_MISSING,
} from "storybook/internal/core-events"
import { addons, type API } from "storybook/manager-api"

import { BRIDGE_READY } from "./manager-bridge.js"
import { iconFor } from "./sidebar-icons.js"
import { MOBILE_QUERY, OPEN_MENU } from "./site-nav-sync.js"
import { chromeColors, managerTheme } from "./theme.js"
import {
  DESIGN_THEME_EVENT,
  DESIGN_THEME_REQUEST,
  DESIGN_THEMES,
  readDesignTheme,
  readTheme,
  saveDesignTheme,
  saveTheme,
  THEME_EVENT,
  THEME_REQUEST,
  type DesignTheme,
  type Theme,
} from "./theme-sync.js"

// A `new`, `beta` or `deprecated` tag on a component's meta renders as a
// pill beside its name, the way Vibe marks parts. Tags rather than title
// suffixes, so adding or dropping one never changes a docs URL.
const STATUSES = ["new", "beta", "deprecated"]

let mode = readTheme()
let designTheme = readDesignTheme()

/*
 * The manager's chrome takes both choices: the sidebar switches with the
 * docs, so it never sits in one theme around a page in another. fibo's
 * parts in the sidebar read `.dark` and `data-theme` like the preview
 * does, and manager-head.html's own rules read the --fibo-* colours.
 */
function paintChrome(mode: Theme, design: DesignTheme) {
  const root = document.documentElement
  root.dataset.fiboTheme = mode
  root.classList.toggle("dark", mode === "dark")
  if (design === "fibo") delete root.dataset.theme
  else root.dataset.theme = design
  for (const [name, value] of Object.entries(chromeColors(design, mode)))
    root.style.setProperty(`--fibo-${name}`, value)
}

paintChrome(mode, designTheme)

addons.setConfig({
  theme: managerTheme(designTheme, mode),
  // Light, dark and the design theme live in the sidebar, and nothing else
  // in the toolbar earns its row.
  showToolbar: false,
  sidebar: {
    showRoots: true,
    renderLabel: (item) => {
      const status =
        item.type === "component"
          ? STATUSES.find((tag) => item.tags.includes(tag))
          : undefined
      const Icon = iconFor(item)
      return (
        <span className="fibo-label">
          {Icon ? (
            <Icon className="fibo-icon" size={16} strokeWidth={1.5} />
          ) : null}
          {item.name}
          {status ? (
            <span className={`fibo-status fibo-status--${status}`}>
              {status}
            </span>
          ) : null}
        </span>
      )
    },
  },
})

/*
 * Both choices are picked in the sidebar, light or dark with the toggle in
 * its header (manager-ui/mode-toggle.tsx) and the design theme from the
 * theme menu (manager-ui/theme-menu.tsx), and held here, where the
 * channel to the preview is. A preview that loads after the manager asks for
 * each on load.
 */
const modeListeners = new Set<(mode: Theme) => void>()
const designListeners = new Set<(theme: DesignTheme) => void>()

function themeBridge(api: API) {
  api.on(THEME_REQUEST, () => api.emit(THEME_EVENT, mode))
  api.on(DESIGN_THEME_REQUEST, () => api.emit(DESIGN_THEME_EVENT, designTheme))
  api.emit(THEME_EVENT, mode)
  api.emit(DESIGN_THEME_EVENT, designTheme)
  const repaint = () => {
    paintChrome(mode, designTheme)
    api.setOptions({ theme: managerTheme(designTheme, mode) })
  }
  return {
    getMode: () => mode,
    setMode: (next: Theme) => {
      if (next === mode) return
      mode = next
      saveTheme(next)
      repaint()
      api.emit(THEME_EVENT, next)
      modeListeners.forEach((listener) => listener(next))
    },
    onMode: (listener: (mode: Theme) => void) => {
      modeListeners.add(listener)
      return () => void modeListeners.delete(listener)
    },
    getDesignTheme: () => designTheme,
    setDesignTheme: (theme: DesignTheme) => {
      if (!DESIGN_THEMES.includes(theme) || theme === designTheme) return
      designTheme = theme
      saveDesignTheme(theme)
      repaint()
      api.emit(DESIGN_THEME_EVENT, theme)
      designListeners.forEach((listener) => listener(theme))
    },
    onDesignTheme: (listener: (theme: DesignTheme) => void) => {
      designListeners.add(listener)
      return () => void designListeners.delete(listener)
    },
  }
}

// Docs pages carry the floating nav on phones, so Storybook's bottom bar is
// hidden there (manager-head.html) and only returns for a story's canvas.
function syncView() {
  const path = new URL(window.location.href).searchParams.get("path") ?? ""
  document.documentElement.dataset.fiboView = path.startsWith("/story/")
    ? "story"
    : "docs"
}

syncView()

addons.register("fibo/site-nav", (api) => {
  api.on(STORY_CHANGED, syncView)
  // On a phone the menu lists a component without its own rows, so a tap on
  // it opens the component's docs and closes the menu, instead of expanding
  // rows that are hidden.
  const phone = window.matchMedia(MOBILE_QUERY)
  document.addEventListener(
    "click",
    (event) => {
      if (!phone.matches || !event.isTrusted) return
      const row = (event.target as Element | null)?.closest?.<HTMLElement>(
        '#storybook-explorer-menu [data-nodetype="component"]'
      )
      const id = row?.dataset.itemId
      if (!id) return
      event.preventDefault()
      event.stopPropagation()
      api.selectStory(id)
      document
        .querySelector<HTMLButtonElement>('button[aria-label="Close menu"]')
        ?.click()
    },
    true
  )
  // Storybook keeps the mobile menu's state to itself, so the nav's Menu
  // item presses the hidden bar's own button.
  api.on(OPEN_MENU, () => {
    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Open navigation menu"]'
      )
      ?.click()
    // On a phone the menu hides a component's own rows, so Storybook can't
    // scroll to the open page; bring its component (or the page) into view.
    requestAnimationFrame(() => {
      const selected = document.querySelector<HTMLElement>(
        '#storybook-explorer-menu [data-selected="true"]'
      )
      // Hidden rows have no offset parent; step back to the nearest shown one.
      let row: Element | null = selected
      while (row instanceof HTMLElement && row.offsetParent === null)
        row = row.previousElementSibling
      row?.scrollIntoView({ block: "center" })
    })
  })
})

/*
 * Links from before the sidebar's last change have the wrong shape for their
 * shelf. Base parts gained a group (base-components-input--docs is now
 * base-components-forms-input--docs); special parts had one for a while and
 * lost it (special-components-display-map-pin--docs is now
 * special-components-map-pin--docs). A missing id of either shape opens the
 * entry with the same shelf and name.
 */
function openMovedPart(api: API) {
  const { storyId, viewMode } = api.getUrlState()
  if (!storyId || api.resolveStory(storyId)) return false
  const old = /^(base|special)-components-(.+)$/.exec(storyId)
  const entries = api.getIndex()?.entries
  const [, shelf, rest] = old ?? []
  if (!shelf || !rest || !entries) return false
  const prefix = `${shelf}-components-`
  const ids = Object.keys(entries)
  // One group segment too few: find the entry with one more.
  const grouped = ids.find(
    (id) =>
      id.startsWith(prefix) &&
      id.endsWith(`-${rest}`) &&
      !id.slice(prefix.length, -rest.length - 1).includes("-")
  )
  // One group segment too many: drop it.
  const flat = `${prefix}${rest.slice(rest.indexOf("-") + 1)}`
  const moved =
    grouped ?? (shelf === "special" && entries[flat] ? flat : undefined)
  if (moved) api.navigate(`/${viewMode ?? "docs"}/${moved}`)
  return Boolean(moved)
}

addons.register("fibo/manager-bridge", (api) => {
  window.__FIBO_MANAGER__ = {
    getIndex: () => api.getIndex()?.entries ?? {},
    onIndex: (listener) => {
      api.on(SET_INDEX, listener)
      return () => api.off(SET_INDEX, listener)
    },
    navigate: (path) => api.navigate(path),
    ...themeBridge(api),
  }
  window.dispatchEvent(new Event(BRIDGE_READY))
})

addons.register("fibo/moved-parts", (api) => {
  api.on(SET_INDEX, () => openMovedPart(api))
  api.on(STORY_MISSING, () => openMovedPart(api))
})

/*
 * The shelves are headings, not folders, so they always stay open. Storybook
 * renders each one as a collapse button named "Collapse", so it becomes a
 * level-two heading named by its text instead: out of the tab order, its
 * clicks and Enter or Space stopped before Storybook sees them, and opened
 * again if it was collapsed before (or by "Collapse all").
 */
const SHELF_TOGGLE = 'button[data-action="collapse-root"]'

for (const type of ["click", "keydown"] as const) {
  document.addEventListener(
    type,
    (event) => {
      if (!event.isTrusted) return
      if (!(event.target as Element | null)?.closest?.(SHELF_TOGGLE)) return
      if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key))
        return
      event.preventDefault()
      event.stopPropagation()
    },
    true
  )
}

function settleShelf(toggle: HTMLButtonElement) {
  if (toggle.getAttribute("aria-expanded") === "false") toggle.click()
  if (toggle.tabIndex !== -1) toggle.tabIndex = -1
  if (toggle.getAttribute("role") !== "heading")
    toggle.setAttribute("role", "heading")
  if (toggle.getAttribute("aria-level") !== "2")
    toggle.setAttribute("aria-level", "2")
  toggle.removeAttribute("aria-label")
  toggle.removeAttribute("aria-expanded")
}

new MutationObserver(() => {
  document
    .querySelectorAll<HTMLButtonElement>(SHELF_TOGGLE)
    .forEach(settleShelf)
}).observe(document.body, {
  childList: true,
  subtree: true,
  attributeFilter: ["aria-expanded", "aria-label", "role", "tabindex"],
})
