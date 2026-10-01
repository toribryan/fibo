import { useEffect, useState, useSyncExternalStore } from "react"
import {
  BoxesIcon,
  HouseIcon,
  MenuIcon,
  RabbitIcon,
  TerminalIcon,
} from "lucide-react"
import { DOCS_RENDERED, SELECT_STORY } from "storybook/internal/core-events"
import { addons } from "storybook/preview-api"

import {
  FloatingNav,
  type FloatingNavItem,
} from "@workspace/ui/components/floating-nav"

import { MOBILE_QUERY, OPEN_MENU } from "../../.storybook/site-nav-sync.js"

const MENU = "menu"

const ITEMS: FloatingNavItem[] = [
  { value: "welcome--docs", label: "Home", icon: <HouseIcon /> },
  { value: "getting-started--docs", label: "Start", icon: <TerminalIcon /> },
  { value: "catalog--docs", label: "Components", icon: <BoxesIcon /> },
  { value: "about-fibo--docs", label: "About", icon: <RabbitIcon /> },
  { value: MENU, label: "Menu", icon: <MenuIcon /> },
].map((item) =>
  item.value === MENU ? item : { ...item, href: `./?path=/docs/${item.value}` }
)

// A component's docs page belongs to the catalog that lists it.
function itemFor(id: string | undefined) {
  if (!id) return undefined
  if (/^(base|special)-components-/.test(id)) return "catalog--docs"
  return ITEMS.some((item) => item.value === id) ? id : undefined
}

// The docs context has no id for an MDX page, so read it from the manager's
// address, which shares this origin.
function idFromAddress() {
  try {
    const path = new URL(window.top!.location.href).searchParams.get("path")
    return path?.match(/^\/docs\/(.+)$/)?.[1]
  } catch {
    return undefined
  }
}

function subscribeToQuery(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

// Storybook rebuilds the docs page, and this nav with it, on every
// navigation, but the preview window stays. Remembering what the last nav
// showed lets the new one start there and slide across, the way a nav that
// never left would.
let lastShown: string | undefined

function SiteNav() {
  const mobile = useSyncExternalStore(
    subscribeToQuery,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
  const [current, setCurrent] = useState(idFromAddress)

  useEffect(() => {
    const channel = addons.getChannel()
    const onRendered = (id: string) => setCurrent(id)
    channel.on(DOCS_RENDERED, onRendered)
    return () => channel.off(DOCS_RENDERED, onRendered)
  }, [])

  const target = itemFor(current) ?? ""
  const [shown, setShown] = useState(() => lastShown ?? target)

  // A frame on the old value first, so there's a layout to animate from.
  useEffect(() => {
    lastShown = target
    const frame = requestAnimationFrame(() => setShown(target))
    return () => cancelAnimationFrame(frame)
  }, [target])

  if (!mobile) return null

  return (
    <FloatingNav
      aria-label="Site"
      items={ITEMS}
      value={shown}
      hideOnScroll
      onValueChange={(value, event) => {
        if (event.metaKey || event.ctrlKey) return
        event.preventDefault()
        const channel = addons.getChannel()
        if (value === MENU) channel.emit(OPEN_MENU)
        else channel.emit(SELECT_STORY, { storyId: value })
      }}
    />
  )
}

export { SiteNav }
