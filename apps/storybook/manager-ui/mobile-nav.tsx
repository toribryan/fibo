import { useEffect, useState, type MouseEvent, type ReactNode } from "react"
import { createRoot } from "react-dom/client"

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import type {
  FiboManagerBridge,
  IndexEntry,
} from "../.storybook/manager-bridge.js"
import { iconFor } from "../.storybook/sidebar-icons.js"
import { MOBILE_QUERY } from "../.storybook/site-nav-sync.js"
import { SearchTrigger } from "./command-search.js"
import { ModeToggle } from "./mode-toggle.js"
import { ThemeMenu } from "./theme-menu.js"

const STATUSES = ["new", "beta", "deprecated"]

type Place = { id: string; name: string; icon: ReactNode; status?: string }
type Section = {
  heading?: string
  groups: { name?: string; icon: ReactNode; places: Place[] }[]
}

function iconOf(item: Parameters<typeof iconFor>[0]) {
  const Icon = iconFor(item)
  return Icon ? (
    <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
  ) : null
}

/*
 * The menu on a phone lists places, not stories: the pages, then each shelf
 * with its docs pages, base parts under their groups. A component opens its
 * docs, which show every story. The index arrives in the sidebar's order.
 */
function sectionsFrom(entries: IndexEntry[]): Section[] {
  const sections: Section[] = []
  const section = (heading?: string) => {
    let found = sections.find((s) => s.heading === heading)
    if (!found) sections.push((found = { heading, groups: [] }))
    return found
  }
  for (const entry of entries) {
    if (entry.type !== "docs") continue
    const path = entry.title.split("/")
    const grouped = path[0] === "Base components" && path.length > 2
    const { groups } = section(path.length > 1 ? path[0] : undefined)
    const name = grouped ? path[1] : undefined
    let group = groups.find((g) => g.name === name)
    if (!group) {
      const icon = name ? iconOf({ id: "", name, type: "group" }) : null
      groups.push((group = { name, icon, places: [] }))
    }
    group.places.push({
      id: entry.id,
      name: path[path.length - 1]!,
      // A shelf's part shows the component icon; pages show their own.
      icon: iconOf({
        id: entry.id,
        name: path[path.length - 1]!,
        type:
          path.length > 1 && path[0] !== "Foundations" ? "component" : "docs",
      }),
      status: STATUSES.find((tag) => entry.tags?.includes(tag)),
    })
  }
  return sections
}

// The docs page that holds what's open: itself, or a story's own docs.
function currentDocs(entries: Record<string, IndexEntry>) {
  const path = new URL(window.location.href).searchParams.get("path") ?? ""
  const open = entries[path.replace(/^\/(docs|story)\//, "")]
  if (!open || open.type === "docs") return open?.id
  return Object.values(entries).find(
    (entry) => entry.type === "docs" && entry.title === open.title
  )?.id
}

function PlaceLink({
  place,
  current,
  onOpen,
}: {
  place: Place
  current: boolean
  onOpen: (event: MouseEvent, id: string) => void
}) {
  return (
    <a
      href={`./?path=/docs/${place.id}`}
      aria-current={current ? "page" : undefined}
      onClick={(event) => onOpen(event, place.id)}
      className="flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
    >
      {place.icon}
      <span className="truncate">{place.name}</span>
      {place.status ? (
        <span className={`fibo-status fibo-status--${place.status}`}>
          {place.status}
        </span>
      ) : null}
    </a>
  )
}

function MobileNav({ bridge }: { bridge: FiboManagerBridge }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState(bridge.getIndex)
  const [current, setCurrent] = useState<string>()

  useEffect(
    () =>
      bridge.onOpenMenu(() => {
        const next = bridge.getIndex()
        setEntries(next)
        setCurrent(currentDocs(next))
        setOpen(true)
      }),
    [bridge]
  )

  // A phone turned to landscape can cross into the desktop layout, which
  // has its own sidebar.
  useEffect(() => {
    const phone = window.matchMedia(MOBILE_QUERY)
    const onChange = () => !phone.matches && setOpen(false)
    phone.addEventListener("change", onChange)
    return () => phone.removeEventListener("change", onChange)
  }, [])

  // The current page sits in view as the drawer opens.
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() =>
      document
        .querySelector(".fibo-mobile-nav [aria-current=page]")
        ?.scrollIntoView({ block: "center" })
    )
    return () => cancelAnimationFrame(frame)
  }, [open])

  const onOpen = (event: MouseEvent, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    bridge.navigate(`/docs/${id}`)
    setOpen(false)
  }

  return (
    <Sheet side="left" open={open} onOpenChange={setOpen}>
      <SheetContent className="fibo-mobile-nav w-[85%] gap-0">
        <SheetHeader className="gap-3">
          <SheetTitle>fibo</SheetTitle>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchTrigger onBeforeOpen={() => setOpen(false)} />
            </div>
            <ThemeMenu bridge={bridge} />
            <ModeToggle bridge={bridge} />
          </div>
        </SheetHeader>
        {/* Storybook's own reset zeroes headings' padding outside any layer,
            so theirs is marked important to win over it. */}
        <SheetBody render={<nav aria-label="Pages" />} className="px-2 pb-4">
          {sectionsFrom(Object.values(entries)).map((section) => (
            <section key={section.heading ?? ""} className="mt-4 first:mt-0">
              {section.heading ? (
                <h2 className="px-3! pb-1 text-xs font-medium text-muted-foreground">
                  {section.heading}
                </h2>
              ) : null}
              {section.groups.map((group) => {
                return (
                  <div key={group.name ?? ""}>
                    {group.name ? (
                      <h3 className="flex min-h-9 items-center gap-3 px-3! text-sm text-foreground">
                        {group.icon}
                        {group.name}
                      </h3>
                    ) : null}
                    <ul className={group.name ? "pl-4" : undefined}>
                      {group.places.map((place) => (
                        <li key={place.id}>
                          <PlaceLink
                            place={place}
                            current={place.id === current}
                            onOpen={onOpen}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </section>
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

// Renders once, in a `.fibo-ui` layer at the end of the body; the drawer
// portals beside it, where fibo-manager.css applies fibo's reset.
function mountMobileNav(bridge: FiboManagerBridge) {
  const layer = document.createElement("div")
  layer.className = "fibo-ui fibo-ui-layer"
  document.body.append(layer)
  createRoot(layer).render(<MobileNav bridge={bridge} />)
}

export { mountMobileNav }
