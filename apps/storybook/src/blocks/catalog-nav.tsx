import { useEffect, useState, type MouseEvent } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { GROUPS, sectionId } from "./catalog.js"

// One tab per base group, then one for the special shelf, which opens at
// its first group.
const TABS = [
  ...GROUPS["base-components"].map((group) => ({
    label: group,
    sections: [sectionId("base-components", group)],
  })),
  {
    label: "Special",
    sections: GROUPS["special-components"].map((group) =>
      sectionId("special-components", group)
    ),
  },
]

// The bar's height, and how far below it a section counts as being read.
const OFFSET = 64

/*
 * A row of tabs that drops in at the top once the page scrolls into the
 * catalog, marks the group being read and jumps to another. Links rather
 * than Tabs: each one goes to a place on the page, it doesn't swap a panel.
 */
function CatalogNav() {
  const [shown, setShown] = useState(false)
  const [current, setCurrent] = useState(TABS[0]!.label)
  // The docs column moves with the page width and the "On this page" list,
  // so the row reads its edges to start where the page's text does.
  const [column, setColumn] = useState<{ left: number; width: number }>()

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const content = document
        .querySelector(".sbdocs-content")
        ?.getBoundingClientRect()
      if (content) setColumn({ left: content.left, width: content.width })
      const tops = TABS.map((tab) => ({
        label: tab.label,
        top: Math.min(
          ...tab.sections.map(
            (id) =>
              document.getElementById(id)?.getBoundingClientRect().top ??
              Infinity
          )
        ),
      }))
      setShown(tops[0]!.top <= OFFSET)
      setCurrent(
        tops.filter(({ top }) => top <= OFFSET + 1).at(-1)?.label ??
          tops[0]!.label
      )
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  // The active tab stays in view as the row scrolls sideways on a phone.
  // The row's own scroll is set, as scrollIntoView could move the page too.
  useEffect(() => {
    const row = document.querySelector<HTMLElement>(".fibo-catalog-nav ul")
    const tab = row?.querySelector<HTMLElement>("[aria-current]")
    if (!row || !tab) return
    const start = tab.offsetLeft - 16
    const end = tab.offsetLeft + tab.offsetWidth + 16 - row.clientWidth
    if (start < row.scrollLeft) row.scrollLeft = start
    else if (end > row.scrollLeft) row.scrollLeft = end
  }, [current])

  const go = (event: MouseEvent, id: string) => {
    event.preventDefault()
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? "instant" : "smooth" })
  }

  return (
    <nav
      aria-label="Component groups"
      inert={!shown}
      className={cn(
        "fibo-catalog-nav fixed inset-x-0 top-0 z-40 border-b border-border bg-background transition-transform duration-200 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <ul
        className="relative m-0 flex [scrollbar-width:none] list-none gap-1 overflow-x-auto p-0 py-2.5"
        style={
          column ? { marginLeft: column.left, width: column.width } : undefined
        }
      >
        {TABS.map((tab) => (
          <li key={tab.label} className="m-0 shrink-0 p-0">
            <a
              href={`#${tab.sections[0]}`}
              aria-current={tab.label === current ? "location" : undefined}
              onClick={(event) => go(event, tab.sections[0]!)}
              className="flex h-9 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground no-underline transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle aria-[current]:bg-muted aria-[current]:text-foreground"
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { CatalogNav }
