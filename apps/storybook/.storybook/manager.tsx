import React, { useEffect, useState } from "react"
import {
  ComponentIcon,
  ContrastIcon,
  DiamondIcon,
  FileTextIcon,
  FolderIcon,
  HashIcon,
  MoonIcon,
  RabbitIcon,
  SunIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react"
import { IconButton } from "storybook/internal/components"
import {
  SET_INDEX,
  STORY_CHANGED,
  STORY_MISSING,
} from "storybook/internal/core-events"
import { addons, types, type API } from "storybook/manager-api"

import { OPEN_MENU } from "./site-nav-sync.js"
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
  "foundations-typography": TypeIcon,
}

// Shelves are section headings, so they take no icon; the groups inside them
// are folders.
const ICON_BY_TYPE: Record<string, LucideIcon> = {
  group: FolderIcon,
  component: ComponentIcon,
  docs: FileTextIcon,
  story: DiamondIcon,
}

// Top-level pages sit on the canvas like frames; a docs page under a
// component or section is a page of that part.
function iconFor(item: { id: string; type: string; parent?: string }) {
  if (ICON_BY_ID[item.id]) return ICON_BY_ID[item.id]
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

  const next = theme === "dark" ? "light" : "dark"
  return (
    <IconButton
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
    >
      {theme === "dark" ? <MoonIcon size={14} /> : <SunIcon size={14} />}
      {theme === "dark" ? "Dark" : "Light"}
    </IconButton>
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
  // Storybook keeps the mobile menu's state to itself, so the nav's Menu
  // item presses the hidden bar's own button.
  api.on(OPEN_MENU, () => {
    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Open navigation menu"]'
      )
      ?.click()
  })
})

/*
 * Parts sat straight under their shelf until the sidebar grouped them, so
 * links from before (the portfolio, llms.txt, shared URLs) have no group in
 * their id: base-components-input--docs is now base-components-forms-input--docs.
 * A missing id of the old shape opens the entry with the same shelf and name.
 */
function openMovedPart(api: API) {
  const { storyId, viewMode } = api.getUrlState()
  if (!storyId || api.resolveStory(storyId)) return false
  const old = /^(base|special)-components-(.+)$/.exec(storyId)
  const entries = api.getIndex()?.entries
  const [, shelf, rest] = old ?? []
  if (!shelf || !rest || !entries) return false
  const moved = Object.keys(entries).find(
    (id) =>
      id.startsWith(`${shelf}-components-`) &&
      id.endsWith(`-${rest}`) &&
      // Exactly one group segment between the shelf and the old name.
      !id.slice(`${shelf}-components-`.length, -rest.length - 1).includes("-")
  )
  if (moved) api.navigate(`/${viewMode ?? "docs"}/${moved}`)
  return Boolean(moved)
}

addons.register("fibo/moved-parts", (api) => {
  api.on(SET_INDEX, () => openMovedPart(api))
  api.on(STORY_MISSING, () => openMovedPart(api))
})
