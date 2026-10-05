import { useCallback, useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { createRoot, type Root } from "react-dom/client"

import { Button } from "@workspace/ui/components/button"

import {
  CommandMenu,
  type CommandMenuGroup,
} from "@workspace/ui/components/command-menu"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"

import type { FiboManagerBridge } from "../.storybook/manager-bridge.js"
import { iconFor } from "../.storybook/sidebar-icons.js"

/*
 * One item per docs page, grouped the way the sidebar is: the pages at the
 * top, Foundations, each base group, then the special parts. A part's story
 * names are its keywords, so searching for a story finds the part.
 */
function groupsFrom(bridge: FiboManagerBridge): CommandMenuGroup[] {
  const entries = Object.values(bridge.getIndex())
  const stories = new Map<string, string[]>()
  for (const entry of entries) {
    if (entry.type !== "story") continue
    stories.set(entry.title, [...(stories.get(entry.title) ?? []), entry.name])
  }

  const groups = new Map<string, CommandMenuGroup>()
  for (const entry of entries) {
    if (entry.type !== "docs") continue
    const path = entry.title.split("/")
    const name = path[path.length - 1]!
    const label =
      path.length === 1
        ? "Pages"
        : path[0] === "Base components" && path.length > 2
          ? path[1]!
          : path[0]!
    const Icon =
      path.length > 1 && path[0] !== "Foundations"
        ? iconFor({ id: entry.id, name: label, type: "group" })
        : iconFor({ id: entry.id, name, type: "docs" })
    const group = groups.get(label) ?? { label, items: [] }
    group.items.push({
      value: entry.id,
      label: name,
      icon: Icon ? <Icon strokeWidth={1.5} /> : undefined,
      keywords: [...path.slice(0, -1), ...(stories.get(entry.title) ?? [])],
      onSelect: () => bridge.navigate(`/docs/${entry.id}`),
    })
    groups.set(label, group)
  }
  return [...groups.values()]
}

// One menu for the page, opened from a trigger in each sidebar.
const openListeners = new Set<(open: boolean) => void>()
const setMenuOpen = (open: boolean) =>
  openListeners.forEach((listener) => listener(open))

function CommandSearch({ bridge }: { bridge: FiboManagerBridge }) {
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState(() => groupsFrom(bridge))

  // The index can land after the menu mounts, so the list is read again
  // each time it opens.
  const show = useCallback(
    (next: boolean) => {
      if (next) setGroups(groupsFrom(bridge))
      setOpen(next)
    },
    [bridge]
  )

  useEffect(() => {
    openListeners.add(show)
    return () => void openListeners.delete(show)
  }, [show])

  useEffect(() => bridge.onIndex(() => setGroups(groupsFrom(bridge))), [bridge])

  return (
    <CommandMenu
      groups={groups}
      open={open}
      onOpenChange={show}
      trigger={null}
      label="Search fibo"
      placeholder="Search components and pages…"
      storageKey="fibo-storybook-recent"
    />
  )
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

function SearchTrigger() {
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-muted-foreground has-data-[slot=kbd-group]:pr-1.5"
      onClick={() => {
        // On a phone the sidebar is Storybook's own modal sheet, which would
        // sit over the menu and hold focus, so it closes first.
        const close = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Close menu"]'
        )
        if (!close) return setMenuOpen(true)
        close.click()
        requestAnimationFrame(() => setMenuOpen(true))
      }}
    >
      <SearchIcon data-icon="inline-start" aria-hidden="true" />
      <span className="flex-1 text-left">Search…</span>
      <KbdGroup className="max-sm:hidden">
        <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}

/*
 * Storybook gives addons no slot in the sidebar, so a trigger mounts beside
 * its search field, which manager-head.html hides. The sidebar remounts on
 * phones and when the layout changes, so each new field gets its own
 * trigger. The menu itself renders once, in a `.fibo-ui` layer at the end
 * of the body, which is where fibo-manager.css applies fibo's reset.
 */
function mountCommandSearch(bridge: FiboManagerBridge) {
  const layer = document.createElement("div")
  layer.className = "fibo-ui fibo-ui-layer"
  document.body.append(layer)
  createRoot(layer).render(<CommandSearch bridge={bridge} />)

  const mounted = new Map<Element, { host: HTMLElement; root: Root }>()
  const sync = () => {
    for (const field of document.querySelectorAll(".search-field")) {
      if (mounted.has(field)) continue
      const host = document.createElement("div")
      host.className = "fibo-ui fibo-search"
      field.before(host)
      const root = createRoot(host)
      root.render(<SearchTrigger />)
      mounted.set(field, { host, root })
    }
    for (const [field, { host, root }] of mounted) {
      if (field.isConnected) continue
      root.unmount()
      host.remove()
      mounted.delete(field)
    }
  }
  new MutationObserver(sync).observe(document.body, {
    childList: true,
    subtree: true,
  })
  sync()
}

export { mountCommandSearch }
