import React, { useEffect, useState } from "react"
import {
  BellIcon,
  CompassIcon,
  ComponentIcon,
  ContrastIcon,
  DiamondIcon,
  FileTextIcon,
  FolderIcon,
  HashIcon,
  LayersIcon,
  LayoutGridIcon,
  MoonIcon,
  MousePointerClickIcon,
  RabbitIcon,
  SunIcon,
  TextCursorInputIcon,
  TypeIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"
import {
  SET_INDEX,
  STORY_CHANGED,
  STORY_MISSING,
} from "storybook/internal/core-events"
import { addons, types, type API } from "storybook/manager-api"

import { MOBILE_QUERY, OPEN_MENU } from "./site-nav-sync.js"
import { darkTheme, lightTheme } from "./theme.js"
import {
  readTheme,
  saveTheme,
  THEME_EVENT,
  THEME_REQUEST,
  type Theme,
} from "./theme-sync.js"

// A `new`, `beta` or `deprecated` tag on a component's meta renders as a
// pill beside its name, the way Vibe marks parts. Tags rather than title
// suffixes, so adding or dropping one never changes a docs URL.
const STATUSES = ["new", "beta", "deprecated"]

// Lucide icons stand in for Storybook's own sidebar icons, which are hidden
// in manager-head.html. They are picked to echo Figma's layers panel, so the
// tree reads like the Figma file: frames, components and their instances.
// Foundations pages get the icon for the kind of token they document; every
// other entry gets one for its type.
const ICON_BY_ID: Record<string, LucideIcon> = {
  "about-fibo--docs": RabbitIcon,
  "foundations-colors--docs": ContrastIcon,
  "foundations-typography--docs": TypeIcon,
}

// Each group inside a shelf has an icon for what its parts do.
const ICON_BY_GROUP: Record<string, LucideIcon> = {
  Actions: MousePointerClickIcon,
  Forms: TextCursorInputIcon,
  Display: LayoutGridIcon,
  Navigation: CompassIcon,
  Overlays: LayersIcon,
  Feedback: BellIcon,
  Diagrams: WorkflowIcon,
}

const ICON_BY_TYPE: Record<string, LucideIcon> = {
  root: HashIcon,
  group: FolderIcon,
  component: ComponentIcon,
  docs: FileTextIcon,
  story: DiamondIcon,
}

// Top-level pages sit on the canvas like frames; a docs page under a
// component or section is a page of that part.
function iconFor(item: {
  id: string
  name: string
  type: string
  parent?: string
}) {
  if (ICON_BY_ID[item.id]) return ICON_BY_ID[item.id]
  if (item.type === "group" && ICON_BY_GROUP[item.name])
    return ICON_BY_GROUP[item.name]
  if (item.type === "docs" && !item.parent) return HashIcon
  return ICON_BY_TYPE[item.type]
}

const initialTheme = readTheme()
document.documentElement.dataset.fiboTheme = initialTheme

addons.setConfig({
  theme: initialTheme === "dark" ? darkTheme : lightTheme,
  showToolbar: true,
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

const THEMES: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light theme", Icon: SunIcon },
  { value: "dark", label: "Dark theme", Icon: MoonIcon },
]

function ThemeTool({ api }: { api: API }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // The sidebar and toolbar switch with the docs, so the chrome never sits
  // dark around a light page.
  useEffect(() => {
    document.documentElement.dataset.fiboTheme = theme
    api.setOptions({ theme: theme === "dark" ? darkTheme : lightTheme })
    saveTheme(theme)
    api.emit(THEME_EVENT, theme)
  }, [api, theme])

  // A preview that loads after the manager asks for the current theme.
  useEffect(() => {
    const reply = () => api.emit(THEME_EVENT, theme)
    api.on(THEME_REQUEST, reply)
    return () => api.off(THEME_REQUEST, reply)
  }, [api, theme])

  return (
    <div className="fibo-theme" role="group" aria-label="Theme">
      {THEMES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className="fibo-theme-option"
          aria-label={label}
          aria-pressed={theme === value}
          title={label}
          onClick={() => setTheme(value)}
        >
          <Icon size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ))}
    </div>
  )
}

addons.register("fibo/theme", (api) => {
  addons.add("fibo/theme/tool", {
    type: types.TOOL,
    title: "Theme",
    render: () => <ThemeTool api={api} />,
  })
})

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
