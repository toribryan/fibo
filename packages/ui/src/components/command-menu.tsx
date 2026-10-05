"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cva } from "class-variance-authority"
import { motion, useReducedMotion, type Transition } from "motion/react"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { cn } from "@workspace/ui/lib/utils"

type CommandMenuItem = {
  /** Unique across the whole menu, nested pages included. */
  value: string
  label: string
  icon?: React.ReactNode
  /** Keys shown on the right, such as `["⌘", "N"]`. Display only. */
  shortcut?: string[]
  /** Extra words a search matches, such as synonyms. */
  keywords?: string[]
  disabled?: boolean
  /** Runs when the item is picked, before the menu closes. */
  onSelect?: () => void
  /** Turns the item into a page: picking it opens these items instead. */
  items?: CommandMenuItem[]
  /** Hint in the search box while this item's page is open. */
  placeholder?: string
  /** Shown in the side pane while the item is highlighted. */
  preview?: React.ReactNode
}

type CommandMenuGroup = {
  label: string
  items: CommandMenuItem[]
}

type CommandMenuLabels = {
  /** Heads the recently run commands. */
  recent: string
  /** Heads search results. */
  results: string
  /** The back button on a page, named after where it goes. */
  back: (to: string) => string
  /** Where the first back button goes. */
  home: string
  /** Fills the preview pane when the highlighted item has none. */
  noPreview: string
  /** Announces how many results a search found. */
  count: (count: number) => string
}

const DEFAULT_LABELS: CommandMenuLabels = {
  recent: "Recent",
  results: "Results",
  back: (to) => `Back to ${to}`,
  home: "all commands",
  noPreview: "No preview",
  count: (count) => `${count} ${count === 1 ? "result" : "results"}`,
}

type CommandMenuProps = {
  /** The commands, in groups shown in order. */
  groups: CommandMenuGroup[]
  /** Called with every command run, after the item's own `onSelect`. */
  onSelect?: (item: CommandMenuItem) => void
  /** Whether the menu is open, when you control it. */
  open?: boolean
  /** Whether the menu starts open, when it keeps its own state. */
  defaultOpen?: boolean
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Values of recently run commands, newest first, when you control them. */
  recent?: string[]
  /** Recently run values to start with, when the menu keeps its own. */
  defaultRecent?: string[]
  /** Called with the new list each time a command runs. */
  onRecentChange?: (recent: string[]) => void
  /** How many recent commands to keep and show. `0` turns recents off. */
  maxRecent?: number
  /** A localStorage key that keeps recents across visits. */
  storageKey?: string
  /**
   * The letter that toggles the menu with Cmd on macOS or Ctrl elsewhere.
   * `null` turns the shortcut off.
   */
  hotkey?: string | null
  /**
   * An element that opens the menu, in place of the default search button.
   * It must forward its ref and props, as fibo's Button does. `null` renders
   * no trigger, for a menu opened only by the shortcut or from state.
   */
  trigger?: React.ReactElement | null
  /** Hint in the search box on the first page. */
  placeholder?: string
  /** Shown when a search matches nothing. */
  emptyText?: React.ReactNode
  /** Names the dialog and the search box for assistive technology. */
  label?: string
  /** Wording the menu writes for itself, for translation. */
  labels?: Partial<CommandMenuLabels>
  /** Whether to show the row of keyboard hints under the list. */
  hints?: boolean
  /**
   * `false` opens the dialog without trapping focus, locking the page's
   * scroll or moving focus into it, for a menu shown inside a card or cover
   * rather than over the page.
   */
  modal?: boolean
  /** `inset` sets the list in a card inside a muted shell that holds the search and hints. */
  variant?: "default" | "inset"
  /** Where the dialog portals to. Defaults to the body. */
  container?: DialogPrimitive.Portal.Props["container"]
  /** Classes for the trigger. */
  className?: string
  /** Classes for the dialog. */
  popupClassName?: string
}

/** One searchable command with where it lives in the menu. */
type Entry = {
  item: CommandMenuItem
  group: string
  /** Labels of the pages above it, outermost first. */
  trail: string[]
  order: number
}

type Row = { key: string; entry: Entry; context?: string }
type Section = { label: string; items: Row[] }

const commandMenuVariants = cva(
  "fixed top-[15vh] left-1/2 z-50 flex h-[min(26rem,70vh)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden border border-border text-popover-foreground shadow-lg outline-hidden transition-[max-width] duration-150 motion-reduce:animate-none motion-reduce:transition-none sm:data-preview:max-w-3xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
  {
    variants: {
      variant: {
        default: "rounded-xl bg-popover",
        // The shell is muted so the list's card reads as a layer above it,
        // lighter in light mode and darker in dark.
        inset: "rounded-2xl bg-muted p-1",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const SLIDE: Transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
const INSTANT: Transition = { duration: 0 }

function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange: ((value: T) => void) | undefined
) {
  const [own, setOwn] = React.useState(defaultValue)
  const current = value ?? own
  const set = (next: T) => {
    if (value === undefined) setOwn(next)
    onChange?.(next)
  }
  return [current, set, setOwn] as const
}

const noSubscription = () => () => {}

// The platform never changes, so there is nothing to subscribe to. The
// server snapshot keeps the first render hydration-safe.
function useIsMac() {
  return React.useSyncExternalStore(
    noSubscription,
    () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent),
    () => false
  )
}

function readStored(key: string | undefined) {
  if (!key || typeof window === "undefined") return undefined
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? "null")
    return Array.isArray(stored) ? (stored as string[]) : undefined
  } catch {
    return undefined
  }
}

function flatten(
  items: CommandMenuItem[],
  group: string,
  trail: string[],
  out: Entry[]
) {
  for (const item of items) {
    out.push({ item, group, trail, order: out.length })
    if (item.items) flatten(item.items, group, [...trail, item.label], out)
  }
  return out
}

/*
 * Ranks how well a command answers the query: the whole label, then the
 * start of it, then the start of any word, then anywhere in it, then its
 * keywords. Zero means no match.
 */
function score(item: CommandMenuItem, term: string) {
  const label = item.label.toLowerCase()
  if (label === term) return 100
  if (label.startsWith(term)) return 80
  if (label.split(/[\s\-_/]+/).some((word) => word.startsWith(term))) return 60
  if (label.includes(term)) return 40
  const keywords = (item.keywords ?? []).map((k) => k.toLowerCase())
  if (keywords.some((k) => k.startsWith(term))) return 30
  if (keywords.some((k) => k.includes(term))) return 20
  return 0
}

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-foreground">
        {text.slice(at, at + query.length)}
      </mark>
      {text.slice(at + query.length)}
    </>
  )
}

/**
 * A search dialog of grouped commands, opened with Cmd+K or Ctrl+K. Items
 * can open pages of their own, recently run commands come first, a search
 * ranks every command by how well it matches, and a side pane previews the
 * highlighted one.
 */
function CommandMenu({
  groups,
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  recent: recentProp,
  defaultRecent = [],
  onRecentChange,
  maxRecent = 5,
  storageKey,
  hotkey = "k",
  trigger,
  placeholder = "Type a command or search…",
  emptyText = "No results found",
  label = "Command menu",
  labels,
  hints = true,
  modal = true,
  variant = "default",
  container,
  className,
  popupClassName,
}: CommandMenuProps) {
  const text = { ...DEFAULT_LABELS, ...labels }
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [recent, setRecent, restoreRecent] = useControllable(
    recentProp,
    defaultRecent,
    onRecentChange
  )
  // Read after mount: the server has no storage, so reading it while
  // rendering would make the first client render differ from the server's.
  const restore = React.useEffectEvent(() => {
    const stored = readStored(storageKey)
    if (stored) restoreRecent(stored)
  })
  React.useEffect(() => restore(), [storageKey])
  const [query, setQuery] = React.useState("")
  const [path, setPath] = React.useState<CommandMenuItem[]>([])
  // Null until the first page change, so opening the menu doesn't also
  // slide the list in under the dialog's own fade.
  const [direction, setDirection] = React.useState<1 | -1 | null>(null)
  const [activeKey, setActiveKey] = React.useState<string | null>(null)
  const reduceMotion = useReducedMotion()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const mac = useIsMac()

  const toggle = React.useEffectEvent(() => setOpen(!open))

  React.useEffect(() => {
    if (!hotkey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === hotkey.toLowerCase() &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault()
        toggle()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hotkey])

  const page = path.at(-1)
  const term = query.trim().toLowerCase()
  const pageKey = path.map((p) => p.value).join("/") || "root"

  const everything = React.useMemo(
    () =>
      groups.reduce<Entry[]>(
        (out, group) => flatten(group.items, group.label, [], out),
        []
      ),
    [groups]
  )

  const sections: Section[] = React.useMemo(() => {
    const trailOf = (entry: Entry) =>
      entry.trail.length ? entry.trail.join(" › ") : undefined

    if (term) {
      // A search from the first page reaches into every page; inside a
      // page it stays there.
      const pool = page ? flatten(page.items ?? [], "", [], []) : everything
      const boost = (value: string) => {
        const at = recent.indexOf(value)
        return at < 0 ? 0 : maxRecent - at
      }
      const rows = pool
        .map((entry) => ({ entry, rank: score(entry.item, term) }))
        .filter(({ rank }) => rank > 0)
        .sort(
          (a, b) =>
            b.rank +
              boost(b.entry.item.value) -
              (a.rank + boost(a.entry.item.value)) ||
            a.entry.order - b.entry.order
        )
        .map(({ entry }) => ({
          key: `result:${entry.item.value}`,
          entry,
          context: trailOf(entry) ?? (page ? undefined : entry.group),
        }))
      return rows.length ? [{ label: text.results, items: rows }] : []
    }

    if (page)
      return [
        {
          label: page.label,
          items: (page.items ?? []).map((item, order) => ({
            key: `page:${item.value}`,
            entry: { item, group: "", trail: [], order },
          })),
        },
      ]

    const byValue = new Map(everything.map((e) => [e.item.value, e]))
    const recentRows = maxRecent
      ? recent
          .slice(0, maxRecent)
          .map((value) => byValue.get(value))
          .filter((entry): entry is Entry => Boolean(entry))
          .map((entry) => ({
            key: `recent:${entry.item.value}`,
            entry,
            context: trailOf(entry),
          }))
      : []
    return [
      ...(recentRows.length ? [{ label: text.recent, items: recentRows }] : []),
      ...groups.map((group) => ({
        label: group.label,
        items: group.items.map((item) => ({
          key: `${group.label}:${item.value}`,
          entry: byValue.get(item.value) ?? {
            item,
            group: group.label,
            trail: [],
            order: 0,
          },
        })),
      })),
    ]
  }, [
    term,
    page,
    everything,
    groups,
    recent,
    maxRecent,
    text.results,
    text.recent,
  ])

  const rows = sections.flatMap((section) => section.items)
  const active = rows.find((row) => row.key === activeKey) ?? rows[0]
  const hasPreview = rows.some((row) => row.entry.item.preview !== undefined)

  const enter = (item: CommandMenuItem) => {
    setDirection(1)
    setPath((current) => [...current, item])
    setQuery("")
    setActiveKey(null)
  }

  const back = () => {
    setDirection(-1)
    setPath((current) => current.slice(0, -1))
    setQuery("")
    setActiveKey(null)
  }

  const run = (item: CommandMenuItem) => {
    if (item.disabled) return
    if (item.items) {
      enter(item)
      // A non-modal menu never pulls focus: focusing scrolls the page to it.
      if (modal) inputRef.current?.focus()
      return
    }
    item.onSelect?.()
    onSelect?.(item)
    if (maxRecent) {
      const next = [
        item.value,
        ...recent.filter((v) => v !== item.value),
      ].slice(0, maxRecent)
      setRecent(next)
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // Storage can be full or blocked; recents still work this visit.
        }
      }
    }
    setOpen(false)
  }

  const shortcut = hotkey ? (
    <KbdGroup>
      <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>{hotkey.toUpperCase()}</Kbd>
    </KbdGroup>
  ) : null

  const slide = reduceMotion ? 0 : 16
  const parent = path.at(-2)

  return (
    <DialogPrimitive.Root
      open={open}
      modal={modal}
      onOpenChange={(next, details) => {
        // Escape steps back before it closes: first it clears the search,
        // then it leaves the open page.
        if (!next && details.reason === "escape-key" && (query || page)) {
          details.cancel()
          if (query) setQuery("")
          else back()
          return
        }
        setOpen(next)
      }}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen) return
        setQuery("")
        setPath([])
        setActiveKey(null)
        setDirection(null)
      }}
    >
      {trigger === null ? null : trigger ? (
        <DialogPrimitive.Trigger
          data-slot="command-menu-trigger"
          render={trigger}
          className={className}
        />
      ) : (
        <DialogPrimitive.Trigger
          data-slot="command-menu-trigger"
          render={<Button variant="outline" />}
          className={cn(
            "w-60 justify-start text-muted-foreground has-data-[slot=kbd-group]:pr-1.5",
            className
          )}
        >
          <SearchIcon data-icon="inline-start" aria-hidden="true" />
          <span className="flex-1 text-left">Search…</span>
          {shortcut}
        </DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Backdrop
          data-slot="command-menu-backdrop"
          className="fixed inset-0 z-50 bg-backdrop duration-150 motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          data-slot="command-menu"
          data-page={page ? page.value : undefined}
          data-preview={hasPreview || undefined}
          data-variant={variant}
          initialFocus={modal ? inputRef : false}
          className={cn(commandMenuVariants({ variant }), popupClassName)}
        >
          <DialogPrimitive.Title className="sr-only">
            {label}
          </DialogPrimitive.Title>
          <AutocompletePrimitive.Root
            inline
            open
            items={sections}
            filter={null}
            value={query}
            onValueChange={(next, details) => {
              // Picking an item would copy its label into the search box;
              // the menu runs it or opens its page instead.
              if (details.reason === "item-press") return
              setQuery(next)
              setActiveKey(null)
            }}
            onItemHighlighted={(row: Row | undefined) => {
              if (row) setActiveKey(row.key)
            }}
            itemToStringValue={(row: Row) => row.entry.item.label}
            autoHighlight="always"
            keepHighlight
          >
            <div
              data-slot="command-menu-search"
              className={cn(
                "flex h-12 shrink-0 items-center gap-2 px-3",
                variant === "default" && "border-b border-border"
              )}
            >
              {page ? (
                <>
                  <button
                    type="button"
                    data-slot="command-menu-back"
                    aria-label={text.back(parent ? parent.label : text.home)}
                    onClick={() => {
                      back()
                      inputRef.current?.focus()
                    }}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
                  >
                    <ChevronLeftIcon aria-hidden="true" className="size-4" />
                  </button>
                  <span
                    data-slot="command-menu-breadcrumb"
                    className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium"
                  >
                    {page.label}
                  </span>
                </>
              ) : (
                <SearchIcon
                  aria-hidden="true"
                  className="mx-1 size-4 shrink-0 text-muted-foreground"
                />
              )}
              <AutocompletePrimitive.Input
                ref={inputRef}
                aria-label={page ? `${label}, ${page.label}` : label}
                placeholder={page?.placeholder ?? placeholder}
                spellCheck={false}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !query && page) {
                    event.preventDefault()
                    back()
                  }
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
              />
            </div>
            <div
              data-slot="command-menu-body"
              className={cn(
                "flex min-h-0 flex-1",
                variant === "inset" &&
                  "overflow-hidden rounded-xl border border-border bg-popover shadow-xs"
              )}
            >
              <motion.div
                key={pageKey}
                initial={
                  direction === null
                    ? false
                    : { opacity: 0, x: direction * slide }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={reduceMotion ? INSTANT : SLIDE}
                className="flex min-h-0 min-w-0 flex-1 flex-col"
              >
                <AutocompletePrimitive.Empty
                  data-slot="command-menu-empty"
                  className="px-2 py-10 text-center text-sm text-muted-foreground empty:hidden empty:p-0"
                >
                  {emptyText}
                </AutocompletePrimitive.Empty>
                <AutocompletePrimitive.List
                  data-slot="command-menu-list"
                  className="min-h-0 flex-1 scroll-py-2 overflow-y-auto p-2 outline-hidden empty:hidden"
                >
                  {(section: Section) => (
                    <AutocompletePrimitive.Group
                      key={section.label}
                      items={section.items}
                      data-slot="command-menu-group"
                      className="not-first:mt-2"
                    >
                      <AutocompletePrimitive.GroupLabel
                        data-slot="command-menu-group-label"
                        className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground"
                      >
                        {section.label}
                      </AutocompletePrimitive.GroupLabel>
                      <AutocompletePrimitive.Collection>
                        {(row: Row) => (
                          <CommandMenuRow
                            key={row.key}
                            row={row}
                            query={term}
                            onRun={() => run(row.entry.item)}
                          />
                        )}
                      </AutocompletePrimitive.Collection>
                    </AutocompletePrimitive.Group>
                  )}
                </AutocompletePrimitive.List>
              </motion.div>
              {hasPreview ? (
                <div
                  data-slot="command-menu-preview"
                  aria-live="polite"
                  className="hidden w-72 shrink-0 overflow-y-auto border-l border-border p-4 text-sm sm:block"
                >
                  {active?.entry.item.preview ?? (
                    <p className="flex h-full items-center justify-center text-muted-foreground">
                      {text.noPreview}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </AutocompletePrimitive.Root>
          <span className="sr-only" aria-live="polite">
            {term ? text.count(rows.length) : ""}
          </span>
          {hints ? (
            <div
              data-slot="command-menu-hints"
              aria-hidden="true"
              className={cn(
                "flex h-10 shrink-0 items-center gap-4 text-xs text-muted-foreground",
                variant === "default" ? "border-t border-border px-4" : "px-3"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                {active?.entry.item.items ? "Open" : "Run"}
              </span>
              <span className="flex items-center gap-1.5">
                <KbdGroup>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </KbdGroup>
                Move
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd>
                {query || page ? "Back" : "Close"}
              </span>
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// The list moves its highlight into view with scrollIntoView, which also
// scrolls the page to reach a menu that is partly off screen: a menu in a
// card pulled the page to itself as its highlight moved. Each row scrolls
// only the list instead.
function scrollWithinList(node: HTMLElement | null) {
  if (!node) return
  node.scrollIntoView = () => {
    const list = node.closest<HTMLElement>("[data-slot=command-menu-list]")
    if (!list) return
    const bounds = list.getBoundingClientRect()
    const target = node.getBoundingClientRect()
    // A menu drawn inside a scaled element measures scaled on screen.
    const scale = bounds.height / list.offsetHeight || 1
    if (target.top < bounds.top) {
      list.scrollTop -= (bounds.top - target.top) / scale
    } else if (target.bottom > bounds.bottom) {
      list.scrollTop += (target.bottom - bounds.bottom) / scale
    }
  }
}

function CommandMenuRow({
  row,
  query,
  onRun,
}: {
  row: Row
  query: string
  onRun: () => void
}) {
  const { item } = row.entry
  return (
    <AutocompletePrimitive.Item
      ref={scrollWithinList}
      value={row}
      disabled={item.disabled}
      onClick={onRun}
      data-slot="command-menu-item"
      className="flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
    >
      {item.icon ? (
        <span aria-hidden="true" className="flex text-muted-foreground">
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">
        <Highlight text={item.label} query={query} />
      </span>
      {row.context ? (
        // Muted text on the highlighted row's accent fill measures 4.35:1 in
        // light mode, under AA, so it takes the row's foreground there.
        <span
          data-slot="command-menu-context"
          className="max-w-40 truncate text-xs text-muted-foreground in-data-highlighted:text-accent-foreground"
        >
          {row.context}
        </span>
      ) : null}
      {item.shortcut ? (
        <KbdGroup data-slot="command-menu-shortcut">
          {item.shortcut.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      ) : null}
      {item.items ? (
        <>
          <span className="sr-only">, opens a page</span>
          <ChevronRightIcon
            aria-hidden="true"
            className="text-muted-foreground"
          />
        </>
      ) : null}
    </AutocompletePrimitive.Item>
  )
}

export { CommandMenu, commandMenuVariants }
export type {
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuLabels,
  CommandMenuProps,
}
