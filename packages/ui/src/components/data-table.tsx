"use client"

import * as React from "react"
import { LockIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/** Selected row ids, or "all" for every row that matches, across pages. */
type DataTableSelection = Set<string> | "all"

type DataTableNoun = { one: string; other: string }

/** What a column holds, which sets its alignment and what the cell renders. */
type DataTableCellType =
  | "primary"
  | "text"
  | "person"
  | "status"
  | "numeric"
  | "actions"

/** Which edge a column sticks to while the table scrolls sideways. */
type DataTablePinned = "none" | "start" | "end"

type DataTableContextValue = {
  isSelected: (id: string) => boolean
  isLocked: (id: string) => boolean
  toggle: (id: string, extend: boolean) => void
  toggleAll: () => void
  pageState: "none" | "some" | "all"
  hasSelectable: boolean
  count: number
  totalCount: number
  noun: DataTableNoun
  registerLocked: (id: string, locked: boolean) => () => void
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null)

function useDataTable() {
  const context = React.useContext(DataTableContext)
  if (!context) {
    throw new Error("Data table parts must be inside a DataTable.")
  }
  return context
}

type DataTableRowContextValue = {
  id: string
  labelId: string
  reasonId: string
  lockedReason?: React.ReactNode
}

const DataTableRowContext =
  React.createContext<DataTableRowContextValue | null>(null)

function countLabel(count: number, noun: DataTableNoun) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? noun.one : noun.other}`
}

/**
 * Selection state for a Data table, for when the parent wants to read or
 * act on it without wiring value and onValueChange by hand.
 */
function useDataTableSelection(initial: DataTableSelection = new Set()) {
  const [value, setValue] = React.useState<DataTableSelection>(initial)
  const clear = React.useCallback(() => setValue(new Set()), [])
  return { value, onValueChange: setValue, clear }
}

type DataTableProps = Omit<React.ComponentProps<"div">, "defaultValue"> & {
  /** The ids of the rows on this page, in the order they're shown. */
  rowIds: string[]
  /** How many rows match across every page. Defaults to the rows shown. */
  totalCount?: number
  /** What a row is, for counts and labels: { one: "agent", other: "agents" }. */
  noun?: DataTableNoun
  /** The selected rows. Pass it to control the selection. */
  value?: DataTableSelection
  /** The rows selected at first when the selection isn't controlled. */
  defaultValue?: DataTableSelection
  /** Called with the new selection whenever it changes. */
  onValueChange?: (value: DataTableSelection) => void
}

function DataTable({
  className,
  rowIds,
  totalCount,
  noun = { one: "row", other: "rows" },
  value: valueProp,
  defaultValue,
  onValueChange,
  children,
  ...props
}: DataTableProps) {
  const [uncontrolled, setUncontrolled] = React.useState<DataTableSelection>(
    () => defaultValue ?? new Set()
  )
  const value = valueProp ?? uncontrolled
  const [locked, setLocked] = React.useState<ReadonlySet<string>>(new Set())
  const [announcement, setAnnouncement] = React.useState("")
  const anchorRef = React.useRef<string | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const total = totalCount ?? rowIds.length

  const selectable = React.useMemo(
    () => rowIds.filter((id) => !locked.has(id)),
    [rowIds, locked]
  )

  const isSelected = React.useCallback(
    (id: string) =>
      value === "all" ? !locked.has(id) : value.has(id) && !locked.has(id),
    [value, locked]
  )

  const count =
    value === "all"
      ? total - locked.size
      : rowIds.filter((id) => value.has(id) && !locked.has(id)).length +
        [...value].filter((id) => !rowIds.includes(id)).length

  const selectedOnPage = selectable.filter(isSelected).length
  const pageState =
    selectedOnPage === 0
      ? "none"
      : selectedOnPage === selectable.length
        ? "all"
        : "some"

  const commit = React.useCallback(
    (next: DataTableSelection) => {
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
      if (next === "all") {
        setAnnouncement(`All ${countLabel(total - locked.size, noun)} selected`)
      } else if (next.size === 0) {
        setAnnouncement("Selection cleared")
      } else {
        const selected = [...next].filter((id) => !locked.has(id)).length
        setAnnouncement(`${countLabel(selected, noun)} selected`)
      }
    },
    [valueProp, onValueChange, total, locked, noun]
  )

  // Leaving "all" for a set keeps everything on this page but the change;
  // rows on other pages can't be listed without their ids.
  const asSet = React.useCallback(
    (): Set<string> => (value === "all" ? new Set(selectable) : new Set(value)),
    [value, selectable]
  )

  const toggle = React.useCallback(
    (id: string, extend: boolean) => {
      if (locked.has(id)) return
      const next = asSet()
      const turnOn = !isSelected(id)
      const anchor = anchorRef.current
      const from = anchor === null ? -1 : rowIds.indexOf(anchor)
      const to = rowIds.indexOf(id)
      if (extend && from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from]
        for (const rowId of rowIds.slice(start, end + 1)) {
          if (locked.has(rowId)) continue
          if (turnOn) next.add(rowId)
          else next.delete(rowId)
        }
      } else if (turnOn) {
        next.add(id)
      } else {
        next.delete(id)
      }
      anchorRef.current = id
      commit(next)
    },
    [locked, asSet, isSelected, rowIds, commit]
  )

  const toggleAll = React.useCallback(() => {
    const next = asSet()
    if (pageState === "all") {
      for (const id of selectable) next.delete(id)
    } else {
      for (const id of selectable) next.add(id)
    }
    commit(next)
  }, [asSet, pageState, selectable, commit])

  const registerLocked = React.useCallback((id: string, isLocked: boolean) => {
    if (!isLocked) return () => {}
    setLocked((current) => new Set(current).add(id))
    return () =>
      setLocked((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
  }, [])

  // A native listener, not onKeyDown: React events bubble out of portals,
  // so Escape in an open row menu would otherwise clear the selection too.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if (value !== "all" && value.size === 0) return
      commit(new Set())
    }
    root.addEventListener("keydown", onKeyDown)
    return () => root.removeEventListener("keydown", onKeyDown)
  }, [value, commit])

  const context = React.useMemo<DataTableContextValue>(
    () => ({
      isSelected,
      isLocked: (id) => locked.has(id),
      toggle,
      toggleAll,
      pageState,
      hasSelectable: selectable.length > 0,
      count,
      totalCount: total,
      noun,
      registerLocked,
    }),
    [
      isSelected,
      locked,
      toggle,
      toggleAll,
      pageState,
      selectable,
      count,
      total,
      noun,
      registerLocked,
    ]
  )

  return (
    <DataTableContext.Provider value={context}>
      <div
        ref={rootRef}
        data-slot="data-table"
        className={cn(
          "group/data-table @container/data-table flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background",
          className
        )}
        {...props}
      >
        {children}
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </div>
    </DataTableContext.Provider>
  )
}

function DataTableContent({
  className,
  ...props
}: React.ComponentProps<typeof Table>) {
  const tableRef = React.useRef<HTMLTableElement>(null)

  // Scroll shadows: mark the edges a pinned column covers while there's more
  // table under them. It lives here so a table that mounts late still gets it.
  React.useEffect(() => {
    const table = tableRef.current
    const scroller = table?.parentElement
    const root = table?.closest<HTMLElement>('[data-slot="data-table"]')
    if (!table || !scroller || !root) return
    const update = () => {
      const left = Math.abs(scroller.scrollLeft)
      const max = scroller.scrollWidth - scroller.clientWidth
      root.toggleAttribute("data-scroll-start", left > 0)
      root.toggleAttribute("data-scroll-end", max - left > 1)
    }
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observer.observe(table)
    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
      root.removeAttribute("data-scroll-start")
      root.removeAttribute("data-scroll-end")
    }
  }, [])

  return (
    <Table
      ref={tableRef}
      data-slot="data-table-content"
      className={cn("table-fixed", className)}
      {...props}
    />
  )
}

/*
 * Pinning switches off under 32rem, the container's @lg size, where a pinned
 * column would leave no room for the rest.
 */
const pinnedClasses: Record<DataTablePinned, string> = {
  none: "",
  start:
    "@lg/data-table:sticky @lg/data-table:left-9 @lg/data-table:z-10 @lg/data-table:border-r after:pointer-events-none after:absolute after:inset-y-0 after:-right-3 after:w-3 after:bg-linear-to-r after:from-border after:to-transparent after:opacity-0 after:transition-opacity @lg/data-table:group-data-scroll-start/data-table:after:opacity-100",
  end: "@lg/data-table:sticky @lg/data-table:right-0 @lg/data-table:z-10 @lg/data-table:border-l before:pointer-events-none before:absolute before:inset-y-0 before:-left-3 before:w-3 before:bg-linear-to-l before:from-border before:to-transparent before:opacity-0 before:transition-opacity @lg/data-table:group-data-scroll-end/data-table:before:opacity-100",
}

const selectColumnClasses =
  "w-9 pr-0 pl-3 @lg/data-table:sticky @lg/data-table:left-0 @lg/data-table:z-10"

function DataTableHeader({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableHeader>) {
  const { pageState, hasSelectable, toggleAll, noun } = useDataTable()
  return (
    <TableHeader data-slot="data-table-header" className={className} {...props}>
      <TableRow>
        <TableHead
          data-slot="data-table-select-all"
          className={selectColumnClasses}
        >
          <Checkbox
            aria-label={`Select all ${noun.other} on this page`}
            checked={pageState === "all"}
            indeterminate={pageState === "some"}
            disabled={!hasSelectable}
            onCheckedChange={() => toggleAll()}
          />
        </TableHead>
        {children}
      </TableRow>
    </TableHeader>
  )
}

function DataTableHead({
  className,
  type = "text",
  pinned = "none",
  ...props
}: React.ComponentProps<typeof TableHead> & {
  /** The same type as the column's cells, so the label lines up with them. */
  type?: DataTableCellType
  /** The same pinned as the column's cells. */
  pinned?: DataTablePinned
}) {
  return (
    <TableHead
      data-slot="data-table-head"
      data-type={type}
      data-pinned={pinned === "none" ? undefined : pinned}
      className={cn(
        "data-[type=actions]:w-14 data-[type=numeric]:w-28 data-[type=numeric]:text-right data-[type=status]:w-28",
        pinnedClasses[pinned],
        className
      )}
      {...props}
    />
  )
}

function DataTableBody(props: React.ComponentProps<typeof TableBody>) {
  return <TableBody data-slot="data-table-body" {...props} />
}

function DataTableRow({
  className,
  id,
  lockedReason,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TableRow>, "id"> & {
  /** The row's id, the same one it has in rowIds and the selection. */
  id: string
  /** Why the row can't be selected. Setting it locks the row. */
  lockedReason?: React.ReactNode
}) {
  const { isSelected, toggle, registerLocked } = useDataTable()
  const labelId = React.useId()
  const selectId = React.useId()
  const reasonId = React.useId()
  const locked = lockedReason !== undefined && lockedReason !== null
  const selected = isSelected(id)

  React.useLayoutEffect(
    () => registerLocked(id, locked),
    [id, locked, registerLocked]
  )

  // The first primary or person cell names the row's checkbox. Only one
  // element can carry the id, so the row hands it out after render.
  const rowRef = React.useRef<HTMLTableRowElement>(null)
  React.useLayoutEffect(() => {
    const name = rowRef.current?.querySelector("[data-row-name]")
    if (name && name.id !== labelId) name.id = labelId
  })

  const row = React.useMemo(
    () => ({ id, labelId, reasonId, lockedReason }),
    [id, labelId, reasonId, lockedReason]
  )

  return (
    <DataTableRowContext.Provider value={row}>
      <TableRow
        ref={rowRef}
        data-slot="data-table-row"
        data-row-id={id}
        data-selected={selected || undefined}
        data-locked={locked || undefined}
        className={cn("group/row", className)}
        {...props}
      >
        <TableCell
          data-slot="data-table-select"
          className={selectColumnClasses}
        >
          <Checkbox
            aria-labelledby={`${selectId} ${labelId}`}
            aria-describedby={locked ? reasonId : undefined}
            checked={selected}
            disabled={locked}
            onCheckedChange={(_checked, details) =>
              toggle(
                id,
                "shiftKey" in details.event && details.event.shiftKey === true
              )
            }
          />
          <span id={selectId} hidden>
            Select
          </span>
          {locked ? (
            <span id={reasonId} hidden>
              {lockedReason}
            </span>
          ) : null}
        </TableCell>
        {children}
      </TableRow>
    </DataTableRowContext.Provider>
  )
}

function DataTableLock() {
  const row = React.useContext(DataTableRowContext)
  if (!row || row.lockedReason === undefined || row.lockedReason === null) {
    return null
  }
  return (
    <Tooltip>
      <TooltipTrigger
        data-slot="data-table-lock"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
        aria-label="Locked"
        aria-describedby={row.reasonId}
      >
        <LockIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{row.lockedReason}</TooltipContent>
    </Tooltip>
  )
}

type DataTableCellProps = React.ComponentProps<typeof TableCell> & {
  /** What the column holds. The same type as its header. */
  type?: DataTableCellType
  /** Which edge the column sticks to. The same pinned as its header. */
  pinned?: DataTablePinned
  /** A second, smaller line under the value. Makes the row 52px tall. */
  secondary?: React.ReactNode
  /** An icon before the value, on a primary cell. */
  icon?: React.ReactNode
  /** The person's photo on a person cell. Initials show while it loads. */
  avatar?: { src?: string; fallback: string }
}

function DataTableCell({
  className,
  type = "text",
  pinned = "none",
  secondary,
  icon,
  avatar,
  children,
  ...props
}: DataTableCellProps) {
  const names = type === "primary" || type === "person"

  const value =
    type === "actions" ? (
      children
    ) : type === "status" ? (
      // Badge tints are translucent; over a selected row's muted fill the
      // warning tint drops under AA, so the badge sits on the background.
      <span className="inline-flex rounded-full bg-background">{children}</span>
    ) : (
      <span className="flex min-w-0 flex-col">
        <span
          data-row-name={names || undefined}
          className={cn(
            "truncate",
            names && "font-medium",
            type === "numeric" &&
              "text-muted-foreground tabular-nums group-hover/row:text-foreground group-data-selected/row:text-foreground"
          )}
        >
          {children}
        </span>
        {secondary ? (
          <span
            data-slot="data-table-secondary"
            className="truncate text-xs text-muted-foreground group-hover/row:text-foreground group-data-selected/row:text-foreground"
          >
            {secondary}
          </span>
        ) : null}
      </span>
    )

  return (
    <TableCell
      data-slot="data-table-cell"
      data-type={type}
      data-pinned={pinned === "none" ? undefined : pinned}
      className={cn(
        "data-[type=actions]:pr-3 data-[type=actions]:text-right data-[type=numeric]:text-right",
        pinnedClasses[pinned],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          (type === "numeric" || type === "actions") && "justify-end"
        )}
      >
        {type === "primary" && icon ? (
          <span className="shrink-0 text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
        {type === "person" && avatar ? (
          <Avatar size="sm">
            {avatar.src ? <AvatarImage src={avatar.src} alt="" /> : null}
            <AvatarFallback>{avatar.fallback}</AvatarFallback>
          </Avatar>
        ) : null}
        {value}
        {names ? <DataTableLock /> : null}
      </div>
    </TableCell>
  )
}

function DataTableFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-footer"
      className={cn(
        "flex min-h-11 items-center justify-between gap-4 border-t border-border px-3 py-1.5 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** “2 of 6 agents selected”, for a picker's footer. */
function DataTableSelectionCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { count, totalCount, noun } = useDataTable()
  return (
    <span
      data-slot="data-table-selection-count"
      className={cn("tabular-nums", className)}
      {...props}
    >
      {count.toLocaleString("en-US")} of {countLabel(totalCount, noun)} selected
    </span>
  )
}

export {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContent,
  DataTableFooter,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableSelectionCount,
  useDataTableSelection,
}
export type {
  DataTableCellType,
  DataTableNoun,
  DataTablePinned,
  DataTableProps,
  DataTableSelection,
}
