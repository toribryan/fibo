"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import {
  AnimatePresence,
  motion,
  animate,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from "motion/react"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListFilterIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type FilterOption = {
  value: string
  label: string
  icon?: React.ReactNode
}

type FilterField = {
  id: string
  label: string
  icon?: React.ReactNode
  options: FilterOption[]
}

/** The chosen values for each field, keyed by field id. */
type FilterValue = Record<string, string[]>

type Row =
  | { kind: "field"; key: string; field: FilterField }
  | { kind: "option"; key: string; field: FilterField; option: FilterOption }

type Group = { field: FilterField | null; rows: Row[] }

/*
 * Which of three views the popup shows. With no query it's a menu of
 * fields, or one field's values once a field is open. Any text turns it
 * into a search: across every field from the menu, or within the open
 * field.
 */
type View = "fields" | "values" | "search"

const MOVE: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
const INSTANT: Transition = { duration: 0 }

function matches(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase())
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
  return [current, set] as const
}

/*
 * The popup's height follows its content, so views of different lengths
 * grow and shrink into each other instead of jumping. The content only
 * changes size when what it shows changes, which `shape` sums up, so it's
 * measured then rather than watched with a ResizeObserver, which would
 * fight the popover's own observer as the height animates. The height
 * lives in a motion value, so it animates without re-rendering.
 */
function useHeight(shape: string, transition: Transition) {
  // A callback ref, so the content mounting (a render after the popup
  // opens) also triggers a measurement.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const height = useMotionValue<number | "auto">("auto")
  React.useLayoutEffect(() => {
    if (!node) return height.set("auto")
    const next = node.offsetHeight
    // The first measurement after opening sets the height without
    // animating; later ones grow or shrink to it.
    if (height.get() === "auto") return height.set(next)
    const controls = animate(height, next, transition)
    return () => controls.stop()
  }, [node, shape, height, transition])
  return [setNode, height] as const
}

// A view on its way out stays in the DOM while it fades, so it's made inert
// and hidden: its rows can't be clicked or read, or answer to an id.
function View(props: HTMLMotionProps<"div">) {
  const present = useIsPresent()
  return (
    <motion.div
      {...props}
      inert={!present || undefined}
      aria-hidden={!present || undefined}
    />
  )
}

type FilterMenuLabels = {
  /** The back button in a field's values. */
  backToFields: string
  /** The back button that leaves a search started from the field menu. */
  backToFilters: string
  /** The back button that leaves a search started inside a field. */
  backToField: (field: string) => string
  /** Announces how many rows a search found. */
  results: (count: number) => string
}

const DEFAULT_LABELS: FilterMenuLabels = {
  backToFields: "Back to fields",
  backToFilters: "Back to filters",
  backToField: (field) => `Back to ${field}`,
  results: (count) => `${count} ${count === 1 ? "result" : "results"}`,
}

type FilterMenuProps = {
  /** The fields people can filter by, each with the values it offers. */
  fields: FilterField[]
  /** The chosen values, keyed by field id, when you control the state. */
  value?: FilterValue
  /** The chosen values to start with, when the menu keeps its own state. */
  defaultValue?: FilterValue
  /** Called with every field's chosen values each time one is toggled. */
  onValueChange?: (value: FilterValue) => void
  /** What the trigger button says. */
  triggerLabel?: React.ReactNode
  /** Hint in the inline search box while the field menu is showing. */
  placeholder?: string
  /** Shown when a search matches nothing. */
  emptyText?: React.ReactNode
  /** Names the popup for assistive technology. */
  label?: string
  /** Names the search box for assistive technology. */
  searchLabel?: string
  /** Wording the menu writes for itself, for translation. */
  labels?: Partial<FilterMenuLabels>
  /** Whether the menu is open, when you control it. */
  open?: boolean
  /** Whether the menu starts open, when it keeps its own state. */
  defaultOpen?: boolean
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Which side of the trigger the popup opens on. Flips when there's no room. */
  side?: PopoverPrimitive.Positioner.Props["side"]
  /** Which edge of the trigger the popup lines up with. */
  align?: "start" | "center" | "end"
  /** Where the popup portals to. Defaults to the body. */
  container?: PopoverPrimitive.Portal.Props["container"]
  /**
   * An element to use as the trigger instead of the default button. It must
   * forward its ref and props, as fibo's Button does.
   */
  trigger?: React.ReactElement
  /**
   * How search starts. `button`, the default, shows a Search filters button
   * at the top, and the menu slides over to its search state when it's
   * used. `inline` keeps a search box there instead, and typing turns the
   * menu into results.
   */
  search?: "inline" | "button"
  /** Classes for the trigger button. */
  className?: string
  /** Classes for the popup. */
  popupClassName?: string
}

/**
 * A filter button whose menu lists fields, then each field's values, and
 * turns into a search across all of them as soon as you type. It only picks
 * filters; showing the applied ones is up to the app.
 */
function FilterMenu({
  fields,
  value,
  defaultValue = {},
  onValueChange,
  triggerLabel = "Filter",
  placeholder = "Filter by…",
  emptyText = "No matching filters",
  label = "Filters",
  searchLabel = "Search filters",
  labels,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "start",
  container,
  trigger,
  search = "button",
  className,
  popupClassName,
}: FilterMenuProps) {
  const [selected, setSelected] = useControllable(
    value,
    defaultValue,
    onValueChange
  )
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const text = { ...DEFAULT_LABELS, ...labels }
  const [query, setQuery] = React.useState("")
  const [fieldId, setFieldId] = React.useState<string | null>(null)
  const [highlight, setHighlight] = React.useState(0)
  // Only the button style has a search state of its own; inline, any text
  // is a search.
  const [searching, setSearching] = React.useState(false)
  // Which way the next view slides: in from the right going deeper, from
  // the left coming back, and not at all into or out of a search.
  const [direction, setDirection] = React.useState<1 | -1 | 0>(1)
  const reduceMotion = useReducedMotion()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  const field = fields.find((f) => f.id === fieldId) ?? null
  const term = query.trim()
  const inSearch = search === "button" ? searching : Boolean(term)
  const view: View = inSearch ? "search" : field ? "values" : "fields"
  // Where focus lives: the search box whenever there is one, otherwise the
  // list itself, which then carries aria-activedescendant.
  const usesInput = search === "inline" || inSearch
  const home = usesInput ? inputRef : listRef
  // Row ids come from positions, not from app data that may hold spaces,
  // and carry the view so an outgoing view never shares an id with the
  // incoming one.
  const viewKey =
    view === "search"
      ? "search"
      : field
        ? `field-${fields.indexOf(field)}`
        : "fields"

  // The open field can vanish if `fields` changes while the menu is open;
  // the menu then falls back to the field list for good.
  if (fieldId && !field) setFieldId(null)

  const groups: Group[] = React.useMemo(() => {
    const option = (f: FilterField, o: FilterOption): Row => ({
      kind: "option",
      key: `${f.id}:${o.value}`,
      field: f,
      option: o,
    })
    if (view === "fields")
      return [
        {
          field: null,
          rows: fields.map((f) => ({ kind: "field", key: f.id, field: f })),
        },
      ]
    if (view === "values" && field)
      return [{ field: null, rows: field.options.map((o) => option(field, o)) }]
    // A search inside an open field stays within it; from the menu it
    // covers every field, and a field whose name matches brings all of
    // its values.
    return (field ? [field] : fields)
      .map((f) => ({
        field: field ? null : f,
        rows: f.options
          .filter((o) => matches(o.label, term) || matches(f.label, term))
          .map((o) => option(f, o)),
      }))
      .filter((group) => group.rows.length > 0)
  }, [view, fields, field, term])

  const rows = groups.flatMap((group) => group.rows)
  const active = rows[Math.min(highlight, rows.length - 1)]
  const ids = new Map(
    groups.flatMap((group, g) =>
      group.rows.map((row, r) => [row, `${id}-${viewKey}-${g}-${r}`] as const)
    )
  )
  const rowId = (row: Row) => ids.get(row) ?? ""
  const transition = reduceMotion ? INSTANT : MOVE
  const [contentRef, height] = useHeight(
    `${open}:${viewKey}:${groups.length}:${rows.length}`,
    transition
  )

  // Views mount and unmount the search box, so focus follows each change.
  React.useEffect(() => {
    if (open) home.current?.focus({ preventScroll: true })
  }, [open, view, home])

  React.useEffect(() => {
    if (!active) return
    listRef.current
      ?.querySelector(`[id="${CSS.escape(rowId(active))}"]`)
      ?.scrollIntoView({ block: "nearest" })
  })

  const reset = () => {
    setQuery("")
    setFieldId(null)
    setSearching(false)
    setHighlight(0)
  }

  // A search started inside a field stays within it, as it does inline,
  // and leaving the search goes back to that field.
  const enterSearch = (initial = "") => {
    setDirection(1)
    setSearching(true)
    setQuery(initial)
    setHighlight(0)
  }

  const exitSearch = () => {
    setDirection(-1)
    setSearching(false)
    setQuery("")
    setHighlight(0)
  }

  const openField = (next: FilterField) => {
    setDirection(1)
    setFieldId(next.id)
    setQuery("")
    setHighlight(0)
  }

  const back = () => {
    setDirection(-1)
    const index = fields.findIndex((f) => f.id === fieldId)
    setFieldId(null)
    setHighlight(Math.max(0, index))
  }

  const toggle = (f: FilterField, option: FilterOption) => {
    const current = selected[f.id] ?? []
    const next = current.includes(option.value)
      ? current.filter((v) => v !== option.value)
      : [...current, option.value]
    const rest = { ...selected }
    if (next.length) rest[f.id] = next
    else delete rest[f.id]
    setSelected(rest)
  }

  const activate = (row: Row) => {
    if (row.kind === "field") openField(row.field)
    else toggle(row.field, row.option)
    home.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const count = rows.length
    // With the button style, typing on the list starts a search with that
    // letter, so the keyboard path doesn't need the button.
    if (
      !usesInput &&
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      event.key !== " "
    ) {
      event.preventDefault()
      enterSearch(event.key)
      return
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        if (count) setHighlight((h) => (Math.min(h, count - 1) + 1) % count)
        break
      case "ArrowUp":
        event.preventDefault()
        if (count)
          setHighlight((h) => (Math.min(h, count - 1) - 1 + count) % count)
        break
      case "Home":
        if (query) break
        event.preventDefault()
        setHighlight(0)
        break
      case "End":
        if (query) break
        event.preventDefault()
        setHighlight(Math.max(0, count - 1))
        break
      case "Enter":
        event.preventDefault()
        if (active) activate(active)
        break
      case "ArrowRight":
        if (!query && active?.kind === "field") {
          event.preventDefault()
          openField(active.field)
        }
        break
      case "ArrowLeft":
      case "Backspace":
        if (query) break
        if (field) {
          event.preventDefault()
          back()
        } else if (search === "button" && searching) {
          event.preventDefault()
          exitSearch()
        }
        break
    }
  }

  const slide = reduceMotion ? 0 : 16
  const count = rows.length

  const slides = {
    custom: direction,
    variants: {
      enter: (d: number) => ({ opacity: 0, x: d * slide }),
      center: { opacity: 1, x: 0 },
      // The old view leaves faster than the new one arrives, so two lists
      // never blur into each other.
      exit: (d: number) => ({
        opacity: 0,
        x: d * -slide,
        transition: { ...transition, duration: reduceMotion ? 0 : 0.1 },
      }),
    },
    initial: "enter",
    animate: "center",
    exit: "exit",
    transition,
  }

  const backButton = (onBack: () => void, name: string) => (
    <button
      type="button"
      aria-label={name}
      onClick={() => {
        onBack()
        home.current?.focus()
      }}
      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
    >
      <ChevronLeftIcon className="size-4" />
    </button>
  )

  const searchInput = (
    <input
      ref={inputRef}
      role="combobox"
      aria-label={searchLabel}
      aria-expanded="true"
      aria-controls={`${id}-list`}
      aria-autocomplete="list"
      aria-activedescendant={active ? rowId(active) : undefined}
      autoComplete="off"
      spellCheck={false}
      value={query}
      placeholder={
        field
          ? field.label
          : search === "button"
            ? `${searchLabel}…`
            : placeholder
      }
      onChange={(event) => {
        // Inline, text is what makes a search, so the views crossfade;
        // the button style is already in its search state.
        if (search === "inline") setDirection(0)
        setQuery(event.target.value)
        setHighlight(0)
      }}
      onKeyDown={onKeyDown}
      className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
    />
  )

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next, details) => {
        // Escape steps back before it closes: first it clears the search,
        // then it leaves the open field.
        const buttonSearch = search === "button" && searching
        if (
          !next &&
          details.reason === "escape-key" &&
          (query || field || buttonSearch)
        ) {
          details.cancel()
          if (query) {
            if (search === "inline") setDirection(0)
            setQuery("")
            setHighlight(0)
          } else if (buttonSearch) exitSearch()
          else back()
          home.current?.focus()
          return
        }
        setOpen(next)
      }}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) reset()
      }}
    >
      {trigger ? (
        <PopoverPrimitive.Trigger
          data-slot="filter-menu-trigger"
          render={trigger}
          className={className}
        />
      ) : (
        <PopoverPrimitive.Trigger
          data-slot="filter-menu-trigger"
          render={<Button variant="outline" size="sm" />}
          className={className}
        >
          <ListFilterIcon data-icon="inline-start" aria-hidden="true" />
          {triggerLabel}
        </PopoverPrimitive.Trigger>
      )}
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={6}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="filter-menu"
            data-view={view}
            aria-label={label}
            data-search={search}
            initialFocus={home}
            className={cn(
              "w-64 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              popupClassName
            )}
          >
            <motion.div style={{ height }}>
              <div ref={contentRef}>
                <div
                  data-slot="filter-menu-search"
                  className="relative flex h-10 items-center overflow-hidden border-b border-border"
                >
                  {search === "inline" ? (
                    <div className="flex w-full items-center gap-2 px-2">
                      <AnimatePresence initial={false} mode="popLayout">
                        {view === "values" ? (
                          <motion.span
                            key="back"
                            initial={{ opacity: 0, x: slide }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: slide }}
                            transition={transition}
                          >
                            {backButton(back, text.backToFields)}
                          </motion.span>
                        ) : (
                          <motion.span
                            key={view === "search" ? "search" : "filter"}
                            aria-hidden="true"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={transition}
                            className="flex size-6 shrink-0 items-center justify-center text-muted-foreground"
                          >
                            {view === "search" ? (
                              <SearchIcon className="size-4" />
                            ) : (
                              <ListFilterIcon className="size-4" />
                            )}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {searchInput}
                    </div>
                  ) : (
                    // The header slides with the body: the Search filters
                    // button, a field's name, or the search box.
                    <AnimatePresence
                      initial={false}
                      mode="popLayout"
                      custom={direction}
                    >
                      <View
                        key={view}
                        {...slides}
                        className="flex w-full items-center gap-2 px-2"
                      >
                        {view === "fields" ? (
                          <button
                            type="button"
                            data-slot="filter-menu-search-button"
                            onClick={() => enterSearch()}
                            className="-mx-1 flex h-8 flex-1 items-center gap-2 rounded-md px-1 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center">
                              <SearchIcon
                                aria-hidden="true"
                                className="size-4"
                              />
                            </span>
                            {searchLabel}
                          </button>
                        ) : view === "values" ? (
                          <>
                            {backButton(back, text.backToFields)}
                            <span className="truncate text-sm font-medium">
                              {field?.label}
                            </span>
                          </>
                        ) : (
                          <>
                            {backButton(
                              exitSearch,
                              field
                                ? text.backToField(field.label)
                                : text.backToFilters
                            )}
                            {searchInput}
                          </>
                        )}
                      </View>
                    </AnimatePresence>
                  )}
                </div>
                <div
                  ref={listRef}
                  id={`${id}-list`}
                  // Without a search box, the list itself takes focus and
                  // points at the highlighted row.
                  tabIndex={usesInput ? undefined : 0}
                  aria-activedescendant={
                    !usesInput && active ? rowId(active) : undefined
                  }
                  onKeyDown={usesInput ? undefined : onKeyDown}
                  // An empty search leaves no options, and a listbox without
                  // any is invalid, so the empty message stands on its own.
                  role={count ? "listbox" : undefined}
                  aria-label={
                    count ? (field ? field.label : searchLabel) : undefined
                  }
                  aria-multiselectable={
                    (count && view !== "fields") || undefined
                  }
                  className="relative max-h-72 overflow-x-hidden overflow-y-auto p-1 outline-none"
                >
                  <AnimatePresence
                    initial={false}
                    mode="popLayout"
                    custom={direction}
                  >
                    <View key={viewKey} {...slides}>
                      {count === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                          {emptyText}
                        </p>
                      ) : (
                        groups.map((group, index) => (
                          <div
                            key={group.field?.id ?? index}
                            role={group.field ? "group" : undefined}
                            aria-labelledby={
                              group.field
                                ? `${id}-${viewKey}-group-${index}`
                                : undefined
                            }
                          >
                            {group.field ? (
                              <div
                                id={`${id}-${viewKey}-group-${index}`}
                                data-slot="filter-menu-group-label"
                                className="px-2 pt-2 pb-1 text-xs text-muted-foreground"
                              >
                                {group.field.label}
                              </div>
                            ) : null}
                            {group.rows.map((row) => (
                              <FilterMenuRow
                                key={row.key}
                                id={rowId(row)}
                                row={row}
                                query={term}
                                highlighted={row === active}
                                selected={selected}
                                onHover={() => setHighlight(rows.indexOf(row))}
                                onActivate={() => activate(row)}
                              />
                            ))}
                          </div>
                        ))
                      )}
                    </View>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
            <span className="sr-only" aria-live="polite">
              {view === "search" ? text.results(count) : ""}
            </span>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function FilterMenuRow({
  id,
  row,
  query,
  highlighted,
  selected,
  onHover,
  onActivate,
}: {
  id: string
  row: Row
  query: string
  highlighted: boolean
  selected: FilterValue
  onHover: () => void
  onActivate: () => void
}) {
  const chosen = selected[row.field.id] ?? []
  const checked = row.kind === "option" && chosen.includes(row.option.value)
  const icon = row.kind === "field" ? row.field.icon : row.option.icon
  return (
    <div
      id={id}
      role="option"
      data-slot={
        row.kind === "field" ? "filter-menu-field" : "filter-menu-option"
      }
      data-highlighted={highlighted || undefined}
      data-checked={checked || undefined}
      aria-selected={row.kind === "option" ? checked : false}
      // Focus stays in the search box; rows are picked with the pointer or
      // through aria-activedescendant.
      onMouseDown={(event) => event.preventDefault()}
      onPointerMove={onHover}
      onClick={onActivate}
      className="flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
    >
      {row.kind === "option" ? (
        <span
          aria-hidden="true"
          data-checked={checked || undefined}
          className="flex size-4 items-center justify-center rounded-sm border border-input bg-input-subtle text-primary-foreground data-checked:border-primary data-checked:bg-primary"
        >
          {checked ? <CheckIcon className="size-3" /> : null}
        </span>
      ) : null}
      {icon ? (
        <span aria-hidden="true" className="text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 truncate">
        {row.kind === "field" ? (
          row.field.label
        ) : (
          <Highlight text={row.option.label} query={query} />
        )}
      </span>
      {row.kind === "field" ? (
        <>
          {chosen.length ? (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {chosen.length}
              <span className="sr-only"> selected</span>
            </span>
          ) : null}
          <span className="sr-only">, opens values</span>
          <ChevronRightIcon
            aria-hidden="true"
            className="text-muted-foreground"
          />
        </>
      ) : null}
    </div>
  )
}

export { FilterMenu }
export type {
  FilterField,
  FilterMenuLabels,
  FilterMenuProps,
  FilterOption,
  FilterValue,
}
