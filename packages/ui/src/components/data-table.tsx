"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  Columns3Icon,
  EllipsisIcon,
  ListFilterIcon,
  LockIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  createTableHookContexts,
  filterFn_arrHas,
  filterFn_equals,
  filterFn_includesString,
  FlexRender,
  functionalUpdate,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Column,
  type ColumnFiltersState,
  type Header,
  type PaginationState,
  type ReactTable,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
} from "@tanstack/react-table"
import {
  createAtom,
  shallow,
  useSelector,
  type Atom,
} from "@tanstack/react-store"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuTrigger,
} from "@workspace/ui/components/menu"
import {
  Pagination,
  type PaginationProps,
} from "@workspace/ui/components/pagination"
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
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Selected row ids, or "all" for every row that matches, across pages.
 * @deprecated Selection lives in the table from useDataTable: read
 * `table.getSelectedRowIds()`. Removed in 0.3.0.
 */
type DataTableSelection = Set<string> | "all"

type DataTableNoun = { one: string; other: string }

/** What a column holds, which sets its alignment and what the cell renders. */
type DataTableCellType =
  "primary" | "text" | "person" | "status" | "numeric" | "actions"

/** What a narrow table shows: the table, scrolling sideways, or a card per row. */
type DataTableNarrowLayout = "scroll" | "cards"

/** Which edge a column sticks to while the table scrolls sideways. */
type DataTablePinned = "none" | "start" | "end"

type DataTableAvatar = { src?: string; fallback: string }

/*
 * Method signatures on purpose: their parameters are checked both ways, so a
 * column can write `avatar: (member: Member) => ...` although the features
 * object, which types meta, can't know the row type.
 */
/** What a column tells Data table about itself, through `meta`. */
type DataTableColumnMeta = {
  /** What the column holds. Sets its alignment and how its cells render. */
  type?: DataTableCellType
  /** Its name in the Columns menu, filters and cards, when the header isn't text. */
  label?: string
  /** Classes for the column's head and cells, such as a width. */
  className?: string
  /** A second, smaller line under the value. Makes the row 52px tall. */
  secondary?(row: unknown): React.ReactNode
  /** The person's photo on a person column. Initials show while it loads. */
  avatar?(row: unknown): DataTableAvatar | undefined
  /** An icon before the value, on a primary column. */
  icon?: React.ReactNode
}

type DataTableTableMeta = {
  /** Why a row can't be selected. useDataTable sets it from `lockedReason`. */
  lockedReason?(row: unknown): React.ReactNode
}

/*
 * Only what Data table uses, so a table carries nothing else. Each row-model
 * slot comes after the feature it needs, and the registries hold just what
 * the cell types call for: words, numbers and dates to sort by, and a search,
 * one value or a list of values to filter on.
 */
const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    text: sortFn_text,
    // Sorting on "auto" picks this for words with digits in them.
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equals: filterFn_equals,
    arrHas: filterFn_arrHas,
  },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnPinningFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
  tableMeta: metaHelper<DataTableTableMeta>(),
})

type DataTableFeatures = typeof dataTableFeatures

/**
 * A table made by useDataTable, for `<DataTable table={table}>`. Whatever
 * the owner selected into `state` stays its own business.
 */
type DataTableInstance<TData extends RowData = RowData> = Omit<
  ReactTable<DataTableFeatures, TData>,
  "state"
>

type DataTableAnyTable = DataTableInstance<RowData>
type DataTableAnyRow = Row<DataTableFeatures, RowData>
type DataTableAnyColumn = Column<DataTableFeatures, RowData, unknown>

// Scoped contexts, so a Data table inside an app's own TanStack table
// never answers to the outer one's hooks.
const dataTableContexts = createTableHookContexts<DataTableFeatures>()

const dataTableHook = createTableHook({
  features: dataTableFeatures,
  tableContext: dataTableContexts.tableContext,
  cellContext: dataTableContexts.cellContext,
  headerContext: dataTableContexts.headerContext,
  // Selection is kept by id, so it survives sorting, filtering and paging.
  getRowId: (row: { id?: unknown }) => {
    if (typeof row.id === "string" || typeof row.id === "number") {
      return String(row.id)
    }
    throw new Error(
      "Data table rows need an id, or pass getRowId to useDataTable."
    )
  },
  // A checkbox's change event drops Shift, so rows pass it along themselves.
  isRowRangeSelectionEvent: (event) =>
    (event as { shiftKey?: boolean }).shiftKey === true,
})

/** A column helper bound to Data table's features, so `meta` and fns are typed. */
const createDataTableColumnHelper = dataTableHook.createAppColumnHelper

/** The table of the Data table this is inside, for parts of your own. */
const useDataTableContext = dataTableHook.useTableContext

type DataTableOptions<TData extends RowData> = Omit<
  TableOptions<DataTableFeatures, TData>,
  "features"
> & {
  /** Why a row can't be selected. Return nothing for a row that can be. */
  lockedReason?: (row: TData) => React.ReactNode
}

// Every row shows until a table asks for pages, so leaving out the footer
// never hides rows.
const EVERY_ROW: PaginationState = { pageIndex: 0, pageSize: Infinity }

const selectNothing = () => null

const hasReason = (reason: React.ReactNode) =>
  reason !== undefined && reason !== null && reason !== false

/**
 * Makes a Data table: its rows, columns and state, on Data table's features.
 * Without a selector, the component that calls it doesn't re-render on state
 * changes; the parts subscribe to what each shows.
 */
function useDataTable<TData extends RowData, TSelected = null>(
  {
    lockedReason,
    initialState,
    meta,
    enableRowSelection,
    autoResetPageIndex,
    ...options
  }: DataTableOptions<TData>,
  selector?: (state: TableState<DataTableFeatures>) => TSelected
) {
  // URL atoms restore after mount, and a filter landing then mustn't send
  // the page that came with it back to the first. Held off for one frame.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return dataTableHook.useAppTable<TData, TSelected>(
    {
      ...options,
      autoResetPageIndex: autoResetPageIndex ?? (mounted ? undefined : false),
      initialState: { pagination: EVERY_ROW, ...initialState },
      meta: { ...meta, lockedReason },
      enableRowSelection:
        enableRowSelection ??
        (lockedReason ? (row) => !hasReason(lockedReason(row.original)) : true),
    },
    selector ??
      (selectNothing as unknown as (
        state: TableState<DataTableFeatures>
      ) => TSelected)
  )
}

/** How an atom's value is written to and read from a URL search param. */
type SearchParamCodec<T> = {
  /** Reads the value from the param's text, or from null when it's absent. */
  parse: (text: string | null) => T
  /** Writes the value as text, or null to leave the param out. */
  serialize: (value: T) => string | null
}

function readSearchParam<T>(key: string, codec: SearchParamCodec<T>) {
  return codec.parse(new URLSearchParams(window.location.search).get(key))
}

/**
 * An atom kept in the URL's `key` param, for a table's sorting, filters or
 * page. It writes back with history.replaceState, so the back button isn't
 * filled with every keystroke, and follows back and forward. It starts from
 * the codec's empty value on the server and on the first client render, so
 * hydration matches; the URL's value applies after mount, before paint.
 */
function useSearchParamsAtom<T>(
  key: string,
  codec: SearchParamCodec<T>
): Atom<T> {
  // The empty value at first, on the server and the client alike, so
  // hydration matches; the URL's value lands once mounted.
  const [atom] = React.useState(() => createAtom(codec.parse(null)))
  // Codecs are often written inline; the latest one is used without
  // resubscribing.
  const codecRef = React.useRef(codec)
  React.useEffect(() => {
    codecRef.current = codec
  })

  React.useLayoutEffect(() => {
    // Read before the writer subscribes, so restoring from the URL doesn't
    // write it back.
    atom.set(readSearchParam(key, codecRef.current))
    const write = (value: T) => {
      const params = new URLSearchParams(window.location.search)
      const text = codecRef.current.serialize(value)
      if (params.get(key) === text) return
      if (text === null) params.delete(key)
      else params.set(key, text)
      const search = params.toString()
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
      )
    }
    const onPopState = () => atom.set(readSearchParam(key, codecRef.current))
    const subscription = atom.subscribe(write)
    window.addEventListener("popstate", onPopState)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener("popstate", onPopState)
    }
  }, [atom, key])

  return atom
}

/** Codecs for useSearchParamsAtom, one per slice a link usually carries. */
const dataTableCodecs = {
  /** Text, such as the search. Empty leaves the param out. */
  text: {
    parse: (text) => text ?? "",
    serialize: (value) => value || null,
  } satisfies SearchParamCodec<string>,
  /** Sorting as `column.direction` pairs: `name.asc,projects.desc`. */
  sorting: {
    parse: (text) =>
      (text ?? "")
        .split(",")
        .filter(Boolean)
        .map((pair) => {
          const at = pair.lastIndexOf(".")
          return at === -1
            ? { id: pair, desc: false }
            : { id: pair.slice(0, at), desc: pair.slice(at + 1) === "desc" }
        }),
    serialize: (value) =>
      value.map(({ id, desc }) => `${id}.${desc ? "desc" : "asc"}`).join(",") ||
      null,
  } satisfies SearchParamCodec<SortingState>,
  /** Column filters as JSON, so any filter value survives the trip. */
  columnFilters: {
    parse: (text) => {
      if (!text) return []
      try {
        const value: unknown = JSON.parse(text)
        return Array.isArray(value) ? (value as ColumnFiltersState) : []
      } catch {
        return []
      }
    },
    serialize: (value) => (value.length ? JSON.stringify(value) : null),
  } satisfies SearchParamCodec<ColumnFiltersState>,
  /** The page, counting from 1, at a fixed page size. Page 1 leaves it out. */
  pagination: (pageSize: number): SearchParamCodec<PaginationState> => ({
    parse: (text) => {
      const page = Number.parseInt(text ?? "", 10)
      return {
        pageIndex: Number.isFinite(page) && page > 1 ? page - 1 : 0,
        pageSize,
      }
    },
    serialize: (value) =>
      value.pageIndex > 0 ? String(value.pageIndex + 1) : null,
  }),
}

type LegacySelection = {
  value: DataTableSelection
  offPage: number
  total: number
  locked: ReadonlySet<string>
}

type DataTableContextValue = {
  table: DataTableAnyTable
  /** Set only for the deprecated rowIds and value props. */
  legacy: LegacySelection | null
  registerLocked?: (id: string, locked: boolean) => () => void
  noun: DataTableNoun
  clear: () => void
  selectAllMatching: () => void
  hasSelection: () => boolean
  showSelectedOnly: boolean
  onShowSelectedOnlyChange?: (showSelectedOnly: boolean) => void
  narrow: boolean
  cards: boolean
  narrowLayout: DataTableNarrowLayout
}

const DataTableContext = React.createContext<DataTableContextValue | null>(null)

function useDataTableRoot() {
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

const DEFAULT_NOUN: DataTableNoun = { one: "row", other: "rows" }

function countLabel(count: number, noun: DataTableNoun) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? noun.one : noun.other}`
}

type SelectionSummary = {
  count: number
  totalCount: number
  matchingCount: number
  pageState: "none" | "some" | "all"
  selectableOnPage: number
  isAll: boolean
  canSelectAllMatching: boolean
}

function summarize(
  table: DataTableAnyTable,
  legacy: LegacySelection | null
): SelectionSummary {
  let selectableOnPage = 0
  let selectedOnPage = 0
  for (const row of table.getRowModel().rows) {
    if (!row.getCanSelect()) continue
    selectableOnPage++
    if (row.getIsSelected()) selectedOnPage++
  }
  const pageState =
    selectedOnPage === 0
      ? "none"
      : selectedOnPage === selectableOnPage
        ? "all"
        : "some"

  let count: number
  let totalCount: number
  let matchingCount: number
  let isAll: boolean
  if (legacy) {
    totalCount = legacy.total
    // Locked rows on other pages aren't known here; totalCount should leave
    // them out if there are any.
    matchingCount = Math.max(0, legacy.total - legacy.locked.size)
    isAll = legacy.value === "all"
    count = isAll ? matchingCount : selectedOnPage + legacy.offPage
  } else {
    totalCount = table.getRowCount()
    // Loaded rows only: with manualPagination, the app selects across its
    // other pages itself.
    matchingCount = table
      .getFilteredRowModel()
      .flatRows.filter((row) => row.getCanSelect()).length
    count = Object.keys(table.atoms.rowSelection.get()).length
    isAll =
      matchingCount > selectableOnPage &&
      count > 0 &&
      table.getIsAllRowsSelected()
  }
  return {
    count,
    totalCount,
    matchingCount,
    pageState,
    selectableOnPage,
    isAll,
    canSelectAllMatching:
      !isAll && pageState === "all" && count < matchingCount,
  }
}

// Counts for the toolbar, select all and the footer. Shallow-compared, so a
// part re-renders only when a number it shows changes.
function useSelectionSummary() {
  const { table, legacy } = useDataTableRoot()
  return useSelector(table.store, () => summarize(table, legacy), {
    compare: shallow,
  })
}

function useRowSelected(id: string) {
  const { table } = useDataTableRoot()
  return useSelector(
    table.atoms.rowSelection,
    (selection) => selection[id] === true
  )
}

function toggleRow(
  table: DataTableAnyTable,
  id: string,
  checked: boolean,
  extend: boolean
) {
  const row = table.getCoreRowModel().rowsById[id]
  // Through the handler, so Shift+click selects the range from the last row
  // toggled, in the order the rows are shown.
  row?.getToggleSelectedHandler()({ target: { checked }, shiftKey: extend })
}

function shiftKeyOf(details: { event: Event }) {
  return "shiftKey" in details.event && details.event.shiftKey === true
}

function pinnedOf(column: DataTableAnyColumn): DataTablePinned {
  return column.getIsPinned() || "none"
}

function labelOf(column: DataTableAnyColumn) {
  const header = column.columnDef.header
  return (
    column.columnDef.meta?.label ??
    (typeof header === "string" ? header : column.id)
  )
}

/**
 * Selection state for a Data table, for when the parent wants to read or
 * act on it without wiring value and onValueChange by hand.
 * @deprecated Selection lives in the table from useDataTable. Read
 * `table.getSelectedRowIds()` and clear with `table.resetRowSelection()`.
 * Removed in 0.3.0.
 */
function useDataTableSelection(initial: DataTableSelection = new Set()) {
  const [value, setValue] = React.useState<DataTableSelection>(initial)
  const clear = React.useCallback(() => setValue(new Set()), [])
  return { value, onValueChange: setValue, clear }
}

type DataTableProps<TData extends RowData = RowData> = Omit<
  React.ComponentProps<"div">,
  "defaultValue"
> & {
  /** The table from useDataTable: its rows, columns and state. */
  table?: DataTableInstance<TData>
  /** What a row is, for counts and labels: { one: "member", other: "members" }. */
  noun?: DataTableNoun
  /** Whether the app is showing only the selected rows. */
  showSelectedOnly?: boolean
  /** Shows “Show selected only” while rows are selected; the app filters its rows. */
  onShowSelectedOnlyChange?: (showSelectedOnly: boolean) => void
  /** Under 32rem: keep the table and scroll it, or show DataTableCards instead. */
  narrowLayout?: DataTableNarrowLayout
  /**
   * The ids of the rows on this page, in the order they're shown.
   * @deprecated Pass `table` from useDataTable; its data sets the rows.
   * Removed in 0.3.0.
   */
  rowIds?: string[]
  /**
   * How many rows match across every page. Defaults to the rows shown.
   * @deprecated Use useDataTable with `manualPagination` and `rowCount`.
   * Removed in 0.3.0.
   */
  totalCount?: number
  /**
   * The selected rows. Pass it to control the selection.
   * @deprecated Use useDataTable's `state.rowSelection` and
   * `onRowSelectionChange`. Removed in 0.3.0.
   */
  value?: DataTableSelection
  /**
   * The rows selected at first when the selection isn't controlled.
   * @deprecated Use useDataTable's `initialState.rowSelection`. Removed in 0.3.0.
   */
  defaultValue?: DataTableSelection
  /**
   * Called with the new selection whenever it changes.
   * @deprecated Use useDataTable's `onRowSelectionChange`. Removed in 0.3.0.
   */
  onValueChange?: (value: DataTableSelection) => void
}

/**
 * The root. Give it `table` from useDataTable; it renders the rows, and its
 * parts read the table's state.
 */
function DataTable<TData extends RowData>({
  table,
  rowIds,
  totalCount,
  value,
  defaultValue,
  onValueChange,
  ...props
}: DataTableProps<TData>) {
  if (table) {
    return (
      <ModelDataTable
        table={table as unknown as DataTableAnyTable}
        {...props}
      />
    )
  }
  return (
    <LegacyDataTable
      rowIds={rowIds ?? []}
      totalCount={totalCount}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      {...props}
    />
  )
}

type RootProps = Omit<
  DataTableProps,
  "table" | "rowIds" | "totalCount" | "value" | "defaultValue" | "onValueChange"
>

function ModelDataTable({
  table,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  ...props
}: RootProps & { table: DataTableAnyTable }) {
  const clear = React.useCallback(() => table.resetRowSelection(true), [table])
  const selectAllMatching = React.useCallback(
    () => table.toggleAllRowsSelected(true),
    [table]
  )
  const hasSelection = React.useCallback(
    () => Object.keys(table.atoms.rowSelection.get()).length > 0,
    [table]
  )
  const selecting = useSelector(
    table.atoms.rowSelection,
    (selection) => Object.keys(selection).length > 0
  )

  // The app filters its own rows for Show selected only, so once nothing is
  // selected there's nothing left to show.
  React.useEffect(() => {
    if (!selecting && showSelectedOnly) onShowSelectedOnlyChange?.(false)
  }, [selecting, showSelectedOnly, onShowSelectedOnlyChange])

  return (
    <DataTableRoot
      table={table}
      legacy={null}
      clear={clear}
      selectAllMatching={selectAllMatching}
      hasSelection={hasSelection}
      showSelectedOnly={showSelectedOnly}
      onShowSelectedOnlyChange={onShowSelectedOnlyChange}
      {...props}
    />
  )
}

type LegacyRow = { id: string }

const legacyColumns = createDataTableColumnHelper<LegacyRow>().columns([])

// Ids can be any string, so they're joined on a character none can hold.
const ID_SEPARATOR = "\u0000"

/*
 * The deprecated rowIds and value props, on the same TanStack table as the
 * new API: a table of ids with selection only. Selection still comes in and
 * goes out as a Set or "all", and ids on other pages are kept.
 */
function LegacyDataTable({
  rowIds,
  totalCount,
  value: valueProp,
  defaultValue,
  onValueChange,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  ...props
}: RootProps & {
  rowIds: string[]
  totalCount?: number
  value?: DataTableSelection
  defaultValue?: DataTableSelection
  onValueChange?: (value: DataTableSelection) => void
}) {
  const [uncontrolled, setUncontrolled] = React.useState<DataTableSelection>(
    () => defaultValue ?? new Set()
  )
  const value = valueProp ?? uncontrolled
  const [locked, setLocked] = React.useState<ReadonlySet<string>>(new Set())

  // Keyed on the ids, so a parent mapping its rows inline every render
  // doesn't rebuild the rows.
  const idsKey = rowIds.join(ID_SEPARATOR)
  const data = React.useMemo<LegacyRow[]>(
    () => (idsKey ? idsKey.split(ID_SEPARATOR) : []).map((id) => ({ id })),
    [idsKey]
  )
  const onPage = React.useMemo(() => new Set(data.map((row) => row.id)), [data])
  const offPage = React.useMemo(
    () => (value === "all" ? [] : [...value].filter((id) => !onPage.has(id))),
    [value, onPage]
  )
  const rowSelection = React.useMemo(() => {
    const selection: RowSelectionState = {}
    for (const { id } of data) {
      if (locked.has(id)) continue
      if (value === "all" || value.has(id)) selection[id] = true
    }
    return selection
  }, [data, value, locked])

  const commit = React.useCallback(
    (next: DataTableSelection) => {
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
      if (next !== "all" && next.size === 0 && showSelectedOnly) {
        onShowSelectedOnlyChange?.(false)
      }
    },
    [valueProp, onValueChange, showSelectedOnly, onShowSelectedOnlyChange]
  )

  const table = useDataTable({
    data,
    columns: legacyColumns,
    state: { rowSelection },
    // Leaving "all" for a set keeps everything on this page but the change;
    // rows on other pages can't be listed without their ids.
    onRowSelectionChange: (updater) => {
      const next = functionalUpdate(updater, rowSelection)
      commit(new Set([...offPage, ...Object.keys(next)]))
    },
    enableRowSelection: (row) => !locked.has(row.id),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

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

  const legacy = React.useMemo<LegacySelection>(
    () => ({
      value,
      offPage: offPage.length,
      total: totalCount ?? rowIds.length,
      locked,
    }),
    [value, offPage, totalCount, rowIds.length, locked]
  )
  const clear = React.useCallback(() => commit(new Set()), [commit])
  const selectAllMatching = React.useCallback(() => commit("all"), [commit])
  const hasSelection = React.useCallback(
    () => value === "all" || value.size > 0,
    [value]
  )

  return (
    <DataTableRoot
      table={table as unknown as DataTableAnyTable}
      legacy={legacy}
      registerLocked={registerLocked}
      clear={clear}
      selectAllMatching={selectAllMatching}
      hasSelection={hasSelection}
      showSelectedOnly={showSelectedOnly}
      onShowSelectedOnlyChange={onShowSelectedOnlyChange}
      {...props}
    />
  )
}

function DataTableRoot({
  table,
  legacy,
  registerLocked,
  clear,
  selectAllMatching,
  hasSelection,
  className,
  noun: nounProp = DEFAULT_NOUN,
  showSelectedOnly = false,
  onShowSelectedOnlyChange,
  narrowLayout = "scroll",
  children,
  ...props
}: RootProps &
  Pick<
    DataTableContextValue,
    | "table"
    | "legacy"
    | "registerLocked"
    | "clear"
    | "selectAllMatching"
    | "hasSelection"
  >) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  // Keyed on the words, so a noun written inline keeps the context below
  // stable from one render to the next.
  const { one, other } = nounProp
  const noun = React.useMemo(() => ({ one, other }), [one, other])

  // Re-render on what can take a focused control away: the toolbar swapping,
  // Select all matching going, rows leaving the page. The parts subscribe to
  // the rest themselves, so this doesn't re-render them.
  useSelector(
    table.store,
    () => {
      const summary = summarize(table, legacy)
      return {
        selecting: summary.count > 0,
        isAll: summary.isAll,
        canSelectAllMatching: summary.canSelectAllMatching,
        rows: table.getRowModel().rows,
      }
    },
    { compare: shallow }
  )

  // A native listener, not onKeyDown: React events bubble out of portals,
  // so Escape in an open row menu would otherwise clear the selection too.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if (!hasSelection()) return
      clear()
    }
    root.addEventListener("keydown", onKeyDown)
    return () => root.removeEventListener("keydown", onKeyDown)
  }, [hasSelection, clear])

  // Narrow is the root's own width under 32rem, the same line the container
  // queries for pinning use, so a table in a sidebar is narrow on a desktop.
  const [narrow, setNarrow] = React.useState(false)
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const update = () => {
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      setNarrow(root.getBoundingClientRect().width < 32 * rem)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])
  const cards = narrow && narrowLayout === "cards"

  // When the focused control disappears (Clear, Select all matching, a row
  // hidden by Show selected only, a More menu whose trigger is gone), focus
  // would fall to the page. Send it to Clear, or to select all when idle.
  const lastFocusedRef = React.useRef<Element | null>(null)
  // Set while focus is leaving, until it turns up again somewhere in the
  // table, popups and menus it renders in portals included.
  const leavingRef = React.useRef(false)
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onFocusIn = (event: FocusEvent) => {
      lastFocusedRef.current = event.target as Element
    }
    root.addEventListener("focusin", onFocusIn)
    return () => root.removeEventListener("focusin", onFocusIn)
  }, [])
  React.useLayoutEffect(() => {
    if (!lastFocusedRef.current) return
    const restore = () => {
      const root = rootRef.current
      const last = lastFocusedRef.current
      if (!root || !last || last.isConnected) return
      const active = document.activeElement
      if (active && active !== document.body && active.isConnected) return
      const target =
        root.querySelector<HTMLElement>('[data-slot="data-table-clear"]') ??
        root.querySelector<HTMLElement>(
          '[data-slot="data-table-select-all"] [role="checkbox"]'
        )
      lastFocusedRef.current = null
      // The table and cards swapped: follow the row to its other form.
      const rowId = last.closest("[data-row-id]")?.getAttribute("data-row-id")
      const sameRow = rowId
        ? root.querySelector<HTMLElement>(
            `[data-row-id="${CSS.escape(rowId)}"] [role="checkbox"]`
          )
        : null
      ;(sameRow ?? target)?.focus()
    }
    restore()
    // A closing menu hands focus back on the next frame, to a trigger that
    // may be gone by then.
    const frame = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(frame)
  })

  // Once someone has left the table, a later refresh must not pull focus
  // back into it. React's focus events, unlike the DOM's, bubble out of the
  // portals the table's menus render in, so moving into one isn't leaving.
  const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    leavingRef.current = false
    props.onFocus?.(event)
  }
  const onBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    leavingRef.current = true
    props.onBlur?.(event)
    queueMicrotask(() => {
      if (!leavingRef.current) return
      const active = document.activeElement
      if (active && active !== document.body) {
        lastFocusedRef.current = null
        return
      }
      // Focus fell to the page, which is also how a closing menu leaves it
      // for a frame before handing it back; wait to see where it lands.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (leavingRef.current) lastFocusedRef.current = null
        })
      )
    })
  }

  const context = React.useMemo<DataTableContextValue>(
    () => ({
      table,
      legacy,
      registerLocked,
      noun,
      clear,
      selectAllMatching,
      hasSelection,
      showSelectedOnly,
      onShowSelectedOnlyChange,
      narrow,
      cards,
      narrowLayout,
    }),
    [
      table,
      legacy,
      registerLocked,
      noun,
      clear,
      selectAllMatching,
      hasSelection,
      showSelectedOnly,
      onShowSelectedOnlyChange,
      narrow,
      cards,
      narrowLayout,
    ]
  )

  return (
    <DataTableContext.Provider value={context}>
      {/* The context is typed for any feature set; this one is Data table's. */}
      <dataTableContexts.tableContext.Provider value={table as never}>
        <div
          ref={rootRef}
          data-slot="data-table"
          data-narrow={narrow || undefined}
          data-layout={cards ? "cards" : "table"}
          className={cn(
            "group/data-table @container/data-table flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background",
            className
          )}
          {...props}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {children}
          <DataTableAnnouncer />
        </div>
      </dataTableContexts.tableContext.Provider>
    </DataTableContext.Provider>
  )
}

/*
 * Announced from the selection that lands rather than the one asked for, so
 * a parent that turns a change down isn't contradicted.
 */
function DataTableAnnouncer() {
  const { table, legacy, noun } = useDataTableRoot()
  const summary = useSelectionSummary()
  const rowSelection = useSelector(table.atoms.rowSelection)
  const selection: unknown = legacy ? legacy.value : rowSelection
  const [announcement, setAnnouncement] = React.useState("")
  const previous = React.useRef({ selection, isAll: summary.isAll })

  const announce = React.useEffectEvent((wasAll: boolean) => {
    if (summary.count === 0) {
      setAnnouncement("Selection cleared")
      return
    }
    if (summary.isAll) {
      setAnnouncement(`All ${countLabel(summary.matchingCount, noun)} selected`)
      return
    }
    // Leaving "all" keeps only this page's rows, which would otherwise go
    // unsaid while the count drops from every match to a handful.
    const narrowed =
      legacy !== null &&
      wasAll &&
      summary.matchingCount > summary.selectableOnPage
    setAnnouncement(
      `${countLabel(summary.count, noun)} selected${narrowed ? ", on this page only" : ""}`
    )
  })

  React.useEffect(() => {
    const before = previous.current
    previous.current = { selection, isAll: summary.isAll }
    if (before.selection === selection) return
    announce(before.isAll)
  }, [selection, summary.isAll])

  return (
    <span role="status" className="sr-only">
      {announcement}
    </span>
  )
}

/*
 * One row for every action. A labelled group, not role="toolbar": that
 * promises arrow keys between controls, and its search field needs them.
 * Idle, it holds filters and create actions;
 * while rows are selected it swaps, in place, to the selection and bulk
 * actions. Nothing else on the page acts on the selection.
 */
function DataTableToolbar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const {
    noun,
    selectAllMatching,
    clear,
    showSelectedOnly,
    onShowSelectedOnlyChange,
    narrow,
    cards,
  } = useDataTableRoot()
  const { count, matchingCount, isAll, canSelectAllMatching } =
    useSelectionSummary()
  const selecting = count > 0

  return (
    <div
      role="group"
      aria-label={selecting ? "Bulk actions" : "Filters and actions"}
      data-slot="data-table-toolbar"
      data-selecting={selecting || undefined}
      className={cn(
        "flex min-h-12 items-center gap-2 border-b border-border px-3 py-2 data-selecting:gap-1 data-selecting:bg-muted data-selecting:pl-1",
        className
      )}
      {...props}
    >
      {cards ? (
        // Cards have no header row, so select all moves up here.
        <span data-slot="data-table-select-all" className="flex px-2">
          <SelectAllCheckbox />
        </span>
      ) : null}
      {selecting ? (
        <>
          <Button
            data-slot="data-table-clear"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear selection"
            onClick={clear}
          >
            <XIcon />
          </Button>
          <span
            data-slot="data-table-selected-label"
            className="text-sm font-medium whitespace-nowrap tabular-nums"
          >
            {isAll
              ? `All ${countLabel(count, noun)} selected`
              : `${countLabel(count, noun)} selected`}
          </span>
          {canSelectAllMatching && !narrow ? (
            <Button
              data-slot="data-table-select-all-matching"
              variant="link"
              size="sm"
              onClick={selectAllMatching}
            >
              Select all {countLabel(matchingCount, noun)}
            </Button>
          ) : null}
          {onShowSelectedOnlyChange && !narrow ? (
            <label
              data-slot="data-table-show-selected-only"
              className="ml-2 flex items-center gap-2 text-sm whitespace-nowrap text-foreground"
            >
              <Checkbox
                checked={showSelectedOnly}
                onCheckedChange={(checked) => onShowSelectedOnlyChange(checked)}
              />
              Show selected only
            </label>
          ) : null}
        </>
      ) : null}
      {children}
    </div>
  )
}

/**
 * Search, sort, group and filters, on the left while nothing is selected.
 * Narrow, the search stays and everything else moves into a Filters sheet.
 */
function DataTableFilters({
  className,
  search,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** The search field, such as DataTableSearch. It stays in the toolbar at every width. */
  search?: React.ReactNode
}) {
  const { narrow } = useDataTableRoot()
  const { count } = useSelectionSummary()
  const [open, setOpen] = React.useState(false)
  const filtersRef = React.useRef<HTMLDivElement>(null)
  const wasOpen = React.useRef(false)

  // Widening past 32rem takes the sheet away while it's open. Focus was in
  // its portal, out of the table's sight, so bring it back to the filters.
  React.useLayoutEffect(() => {
    if (!narrow && wasOpen.current) {
      setOpen(false)
      const active = document.activeElement
      if (!active || active === document.body) {
        filtersRef.current
          ?.querySelector<HTMLElement>("input, button, [role=combobox]")
          ?.focus()
      }
    }
    wasOpen.current = narrow && open
  }, [narrow, open])

  if (count > 0) return null
  const hasControls = React.Children.toArray(children).length > 0
  return (
    <div
      data-slot="data-table-filters"
      className={cn(
        "flex min-w-0 flex-1 flex-wrap items-center gap-1.5 data-narrow:flex-nowrap",
        className
      )}
      data-narrow={narrow || undefined}
      ref={filtersRef}
      {...props}
    >
      {search ? (
        <div
          data-slot="data-table-search"
          data-narrow={narrow || undefined}
          className="w-56 min-w-0 data-narrow:w-auto data-narrow:flex-1"
        >
          {search}
        </div>
      ) : null}
      {hasControls && narrow ? (
        <Sheet side="bottom" open={open} onOpenChange={setOpen}>
          <SheetTrigger
            data-slot="data-table-filters-trigger"
            render={
              <Button variant="outline" size="icon-sm" aria-label="Filters" />
            }
          >
            <SlidersHorizontalIcon />
          </SheetTrigger>
          <SheetContent keepMounted>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <SheetBody
              data-slot="data-table-filters-sheet"
              className="flex flex-col items-start gap-3 pb-6 [&>[data-slot=input]]:w-full [&>[data-slot=select-trigger]]:w-full"
            >
              {children}
            </SheetBody>
          </SheetContent>
        </Sheet>
      ) : (
        children
      )}
    </div>
  )
}

/**
 * A search field bound to the table's global filter, for the Filters
 * `search` slot. It searches every column with text or numbers in it.
 */
function DataTableSearch({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type"
>) {
  const { table } = useDataTableRoot()
  const value = useSelector(table.atoms.globalFilter, (filter) =>
    typeof filter === "string" ? filter : ""
  )
  return (
    <div data-slot="data-table-search-field" className="relative w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        size="sm"
        className={cn("pl-8", className)}
        value={value}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        {...props}
      />
    </div>
  )
}

/** One value a column holds and how many rows hold it, for a filter menu. */
type DataTableFacet = { value: unknown; count: number }

/**
 * The values a column holds and how many rows hold each, under the other
 * filters but not its own, so a filter menu keeps every choice it offers.
 */
function useDataTableFacets(columnId: string): DataTableFacet[] {
  const { table } = useDataTableRoot()
  useSelector(
    table.store,
    (state) => [state.columnFilters, state.globalFilter],
    { compare: shallow }
  )
  const facets = table.getColumn(columnId)?.getFacetedUniqueValues()
  return [...(facets ?? new Map<unknown, number>())]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => String(a.value).localeCompare(String(b.value)))
}

/**
 * A filter menu for one column, with how many rows hold each value. Give the
 * column `filterFn: "arrHas"`, so a row matches any value that's ticked.
 */
function DataTableFacetFilter({
  column: columnId,
  label,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  /** The id of the column to filter. */
  column: string
  /** The menu's name. Defaults to the column's label or header. */
  label?: string
}) {
  const { table } = useDataTableRoot()
  const facets = useDataTableFacets(columnId)
  const ticked = useSelector(table.atoms.columnFilters, (filters) => {
    const value = filters.find((filter) => filter.id === columnId)?.value
    return Array.isArray(value) ? (value as unknown[]) : []
  })
  const column = table.getColumn(columnId)
  const name = label ?? (column ? labelOf(column) : columnId)

  const toggle = (value: unknown, checked: boolean) =>
    column?.setFilterValue((old: unknown) => {
      const list = Array.isArray(old) ? (old as unknown[]) : []
      const next = checked
        ? [...list, value]
        : list.filter((item) => item !== value)
      return next.length ? next : undefined
    })

  return (
    <Menu>
      <MenuTrigger
        data-slot="data-table-facet-filter"
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("data-filtered:border-ring", className)}
            data-filtered={ticked.length > 0 || undefined}
            {...props}
          />
        }
      >
        <ListFilterIcon data-icon="inline-start" />
        {name}
        {ticked.length ? (
          <span className="rounded-sm bg-muted px-1 text-xs tabular-nums">
            <span className="sr-only">, </span>
            {ticked.length}
            <span className="sr-only"> selected</span>
          </span>
        ) : null}
      </MenuTrigger>
      <MenuContent>
        <MenuGroup>
          <MenuLabel>{name}</MenuLabel>
          {facets.map(({ value, count }) => (
            <MenuCheckboxItem
              key={String(value)}
              checked={ticked.includes(value)}
              onCheckedChange={(checked) => toggle(value, checked)}
            >
              <span className="flex-1 truncate">{String(value)}</span>{" "}
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {count}
              </span>
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
      </MenuContent>
    </Menu>
  )
}

function textOf(node: React.ReactNode): string | undefined {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) {
    const text = node
      .map((child) => textOf(child as React.ReactNode))
      .filter(Boolean)
      .join(" ")
      .trim()
    return text || undefined
  }
  return undefined
}

/**
 * A create action, such as Add member. With an icon, it shrinks to the icon
 * on a narrow table, and its label becomes the name and a tooltip.
 */
function DataTableAction({
  icon,
  children,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Button> & {
  /** Shown before the label, and alone on a narrow table. */
  icon?: React.ReactNode
}) {
  const { narrow } = useDataTableRoot()
  const label = textOf(children)
  const iconOnly = narrow && Boolean(icon) && Boolean(label)
  // One element tree at every width, so crossing 32rem doesn't remount the
  // button and drop its focus.
  return (
    <Tooltip disabled={!iconOnly}>
      <TooltipTrigger
        render={
          <Button
            data-slot="data-table-action"
            variant={variant}
            size={iconOnly ? "icon-sm" : "sm"}
            aria-label={iconOnly ? label : undefined}
            {...props}
          />
        }
      >
        {icon}
        {iconOnly ? null : children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Create actions, such as Add member, on the right while nothing is selected. */
function DataTableActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { count } = useSelectionSummary()
  if (count > 0) return null
  return (
    <div
      data-slot="data-table-actions"
      className={cn("ml-auto flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

/**
 * Shows and hides columns, from a menu of every column that can hide. It
 * goes in DataTableActions; narrow, it shrinks to its icon.
 */
function DataTableColumns({
  label = "Columns",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  /** The button's label, and its name when it shows only its icon. */
  label?: string
}) {
  const { table, narrow } = useDataTableRoot()
  const visibility = useSelector(table.atoms.columnVisibility)
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())
  return (
    <Menu>
      <MenuTrigger
        data-slot="data-table-columns"
        render={
          <Button
            variant="outline"
            size={narrow ? "icon-sm" : "sm"}
            aria-label={narrow ? label : undefined}
            {...props}
          />
        }
      >
        <Columns3Icon data-icon={narrow ? undefined : "inline-start"} />
        {narrow ? null : label}
      </MenuTrigger>
      <MenuContent align="end">
        <MenuGroup>
          <MenuLabel>Show columns</MenuLabel>
          {columns.map((column) => (
            <MenuCheckboxItem
              key={column.id}
              checked={visibility[column.id] !== false}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {labelOf(column)}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
      </MenuContent>
    </Menu>
  )
}

/*
 * The order never changes: your actions, then More, then Delete behind a
 * divider. That's what makes every table's bulk actions read the same.
 */
function DataTableBulkActions({
  className,
  children,
  moreActions,
  onDelete,
  deleteLabel = "Delete",
  ...props
}: React.ComponentProps<"div"> & {
  /** Menu items for actions that don't earn a button of their own. */
  moreActions?: React.ReactNode
  /** Shows Delete, last and destructive, and runs this when it's pressed. */
  onDelete?: () => void
  /** Delete's label, such as “Remove” or “Archive”. */
  deleteLabel?: string
}) {
  const { narrow } = useDataTableRoot()
  const { count } = useSelectionSummary()
  if (count === 0) return null
  const hasOthers =
    React.Children.toArray(children).length > 0 || Boolean(moreActions)
  return (
    <div
      data-slot="data-table-bulk-actions"
      className={cn("ml-auto flex items-center gap-1.5", className)}
      {...props}
    >
      {children}
      {moreActions ? (
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="More actions"
              />
            }
          >
            <EllipsisIcon />
          </MenuTrigger>
          <MenuContent align="end">{moreActions}</MenuContent>
        </Menu>
      ) : null}
      {onDelete ? (
        <>
          {hasOthers ? (
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          ) : null}
          {narrow ? (
            <Button
              data-slot="data-table-delete"
              variant="destructive"
              size="icon-sm"
              aria-label={deleteLabel}
              onClick={onDelete}
            >
              <Trash2Icon />
            </Button>
          ) : (
            <Button
              data-slot="data-table-delete"
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2Icon data-icon="inline-start" />
              {deleteLabel}
            </Button>
          )}
        </>
      ) : null}
    </div>
  )
}

/**
 * A bulk action button. With `single`, it only works on one row: it stays in
 * place, dimmed, while more than one is selected.
 */
function DataTableBulkAction({
  className,
  single = false,
  icon,
  disabled,
  children,
  "aria-describedby": describedBy,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** Works on one row at a time, such as Edit or Duplicate. */
  single?: boolean
  /** Shown before the label, and alone on a narrow table. */
  icon?: React.ReactNode
}) {
  const { noun, narrow } = useDataTableRoot()
  const { count } = useSelectionSummary()
  const reasonId = React.useId()
  const tooMany = single && count !== 1
  const reason = `Works on one ${noun.one} at a time`
  const label = textOf(children)
  const iconOnly = narrow && Boolean(icon) && Boolean(label)
  // Always inside the Tooltip, so crossing one selected row doesn't remount
  // the button and lose its focus.
  return (
    <Tooltip disabled={!tooMany && !iconOnly}>
      <TooltipTrigger
        render={
          <Button
            data-slot="data-table-bulk-action"
            variant="outline"
            size={iconOnly ? "icon-sm" : "sm"}
            aria-label={iconOnly ? label : undefined}
            disabled={disabled || tooMany}
            focusableWhenDisabled={single}
            aria-describedby={
              [describedBy, tooMany ? reasonId : undefined]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn("data-disabled:opacity-50", className)}
            {...props}
          />
        }
      >
        {icon}
        {iconOnly ? null : children}
      </TooltipTrigger>
      <TooltipContent>
        {iconOnly && tooMany
          ? `${label}: ${reason.toLowerCase()}`
          : tooMany
            ? reason
            : label}
      </TooltipContent>
      {tooMany ? (
        <span id={reasonId} hidden>
          {reason}
        </span>
      ) : null}
    </Tooltip>
  )
}

/**
 * The table itself. With no children it renders the header and the rows
 * from the table's columns.
 */
function DataTableContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Table>) {
  const { cards, narrowLayout } = useDataTableRoot()
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
  }, [cards])

  // Only one of the table and the cards is in the DOM, so screen readers
  // never meet every row twice.
  if (cards) return null

  return (
    <Table
      ref={tableRef}
      data-slot="data-table-content"
      className={cn(
        "table-fixed",
        // Before the first measurement, CSS keeps a narrow cards table from
        // flashing its rows.
        narrowLayout === "cards" && "@max-lg/data-table:hidden",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <DataTableHeader />
          <DataTableBody />
        </>
      )}
    </Table>
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

function SelectAllCheckbox() {
  const { table, noun } = useDataTableRoot()
  const { pageState, selectableOnPage } = useSelectionSummary()
  return (
    <Checkbox
      aria-label={`Select all ${noun.other} on this page`}
      checked={pageState === "all"}
      indeterminate={pageState === "some"}
      disabled={selectableOnPage === 0}
      onCheckedChange={() => table.toggleAllPageRowsSelected()}
    />
  )
}

/**
 * The header row, with select all first. With no children it renders a
 * head for every visible column, sortable ones as buttons.
 */
function DataTableHeader({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TableHeader>) {
  if (children === undefined) {
    return (
      <TableHeader
        data-slot="data-table-header"
        className={className}
        {...props}
      >
        <ModelHeaderRows />
      </TableHeader>
    )
  }
  return (
    <TableHeader data-slot="data-table-header" className={className} {...props}>
      <TableRow>
        <TableHead
          data-slot="data-table-select-all"
          scope="col"
          className={selectColumnClasses}
        >
          <SelectAllCheckbox />
        </TableHead>
        {children}
      </TableRow>
    </TableHeader>
  )
}

function ModelHeaderRows() {
  const { table } = useDataTableRoot()
  useSelector(
    table.store,
    (state) => [state.sorting, state.columnVisibility, state.columnPinning],
    { compare: shallow }
  )
  const groups = table.getHeaderGroups()
  return groups.map((group, index) => (
    <TableRow key={group.id}>
      {index === 0 ? (
        <TableHead
          data-slot="data-table-select-all"
          scope="col"
          rowSpan={groups.length > 1 ? groups.length : undefined}
          className={selectColumnClasses}
        >
          <SelectAllCheckbox />
        </TableHead>
      ) : null}
      {group.headers.map((header) => (
        <ModelHead key={header.id} header={header} />
      ))}
    </TableRow>
  ))
}

const sortButtonClasses =
  "-mx-1 inline-flex h-6 max-w-full items-center gap-1 rounded-sm px-1 font-medium outline-none hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring-subtle [&_svg]:size-3.5 [&_svg]:shrink-0"

/*
 * A sortable head holds a button, and only the sorted one carries aria-sort,
 * so a screen reader hears the order once, where it applies.
 */
function ModelHead({
  header,
}: {
  header: Header<DataTableFeatures, RowData, unknown>
}) {
  const column = header.column
  const meta = column.columnDef.meta
  const sorted = column.getIsSorted()
  const content = header.isPlaceholder ? null : <FlexRender header={header} />
  return (
    <HeadCell
      type={meta?.type}
      pinned={pinnedOf(column)}
      className={meta?.className}
      colSpan={header.colSpan > 1 ? header.colSpan : undefined}
      scope={header.colSpan > 1 ? "colgroup" : "col"}
      aria-sort={
        sorted === "asc"
          ? "ascending"
          : sorted === "desc"
            ? "descending"
            : undefined
      }
    >
      {!header.isPlaceholder && column.getCanSort() ? (
        <button
          type="button"
          data-slot="data-table-sort"
          className={sortButtonClasses}
          onClick={column.getToggleSortingHandler()}
        >
          <span className="truncate">{content}</span>
          {sorted === "asc" ? (
            <ArrowUpIcon aria-hidden="true" />
          ) : sorted === "desc" ? (
            <ArrowDownIcon aria-hidden="true" />
          ) : (
            <ChevronsUpDownIcon
              aria-hidden="true"
              className="text-muted-foreground"
            />
          )}
        </button>
      ) : (
        content
      )}
    </HeadCell>
  )
}

type HeadCellProps = React.ComponentProps<typeof TableHead> & {
  /** The same type as the column's cells, so the label lines up with them. */
  type?: DataTableCellType
  /** The same pinned as the column's cells. */
  pinned?: DataTablePinned
}

function HeadCell({
  className,
  type = "text",
  pinned = "none",
  ...props
}: HeadCellProps) {
  return (
    <TableHead
      data-slot="data-table-head"
      scope="col"
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

/**
 * A column header written by hand.
 * @deprecated Give useDataTable `columns`; DataTableHeader renders a head
 * for each, with `type` from the column's `meta` and `pinned` from
 * `columnPinning`. Removed in 0.3.0.
 */
function DataTableHead(props: HeadCellProps) {
  return <HeadCell {...props} />
}

/** The rows. With no children it renders the table's current page. */
function DataTableBody({
  children,
  ...props
}: React.ComponentProps<typeof TableBody>) {
  return (
    <TableBody data-slot="data-table-body" {...props}>
      {children === undefined ? <ModelRows /> : children}
    </TableBody>
  )
}

// What changes which rows show and which cells they have. Selection isn't
// here: a ticked row re-renders itself, not the body.
function useRowModelInputs() {
  const { table } = useDataTableRoot()
  return useSelector(
    table.store,
    (state) => [
      state.sorting,
      state.columnFilters,
      state.globalFilter,
      state.pagination,
      state.columnVisibility,
      state.columnPinning,
    ],
    { compare: shallow }
  )
}

function ModelRows() {
  const { table } = useDataTableRoot()
  const inputs = useRowModelInputs()
  // TanStack keeps a row's object until the data changes, so new columns or
  // a new lockedReason over the same data have to reach the memo as props.
  const columns = table.getVisibleLeafColumns()
  const lockedReason = table.options.meta?.lockedReason
  return table
    .getRowModel()
    .rows.map((row) => (
      <ModelRow
        key={row.id}
        row={row}
        inputs={inputs}
        columns={columns}
        lockedReason={lockedReason?.(row.original)}
      />
    ))
}

const ModelRow = React.memo(function ModelRow({
  row,
  lockedReason,
}: {
  row: DataTableAnyRow
  /** Changes when visibility or pinning does, so the memo lets those through. */
  inputs: unknown
  /** The visible columns, which change when the column definitions do. */
  columns: unknown
  /** Why the row can't be selected, as a value, so an inline function doesn't redraw every row. */
  lockedReason: React.ReactNode
}) {
  // Its own selection redraws its cells, so a renderer that reads
  // row.getIsSelected() follows the checkbox; other rows stay put.
  useRowSelected(row.id)
  return (
    <RowFrame id={row.id} lockedReason={lockedReason}>
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta
        return (
          <BodyCell
            key={cell.id}
            type={meta?.type}
            pinned={pinnedOf(cell.column)}
            className={meta?.className}
            secondary={meta?.secondary?.(row.original)}
            avatar={meta?.avatar?.(row.original)}
            icon={meta?.icon}
          >
            <FlexRender cell={cell} />
          </BodyCell>
        )
      })}
    </RowFrame>
  )
})

type RowFrameProps = Omit<React.ComponentProps<typeof TableRow>, "id"> & {
  /** The row's id, the same one getRowId gives it. */
  id: string
  /** Names the row's checkbox when no primary or person cell does. */
  label?: string
  /** Why the row can't be selected. Setting it locks the row. */
  lockedReason?: React.ReactNode
}

function RowFrame({
  className,
  id,
  label,
  lockedReason,
  children,
  ...props
}: RowFrameProps) {
  const { table, registerLocked } = useDataTableRoot()
  const labelId = React.useId()
  const selectId = React.useId()
  const reasonId = React.useId()
  const locked = hasReason(lockedReason)
  const selected = useRowSelected(id)

  React.useLayoutEffect(
    () => registerLocked?.(id, locked),
    [id, locked, registerLocked]
  )

  // The first primary or person cell names the row's checkbox, or `label`
  // when there's none. Only one element can carry the id, so the row hands
  // it out after render.
  const rowRef = React.useRef<HTMLTableRowElement>(null)
  const fallbackRef = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const cell = rowRef.current?.querySelector("[data-row-name]")
    const fallback = fallbackRef.current
    if (fallback) fallback.id = cell ? "" : labelId
    if (cell && cell.id !== labelId) cell.id = labelId
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
            onCheckedChange={(checked, details) =>
              toggleRow(table, id, checked, shiftKeyOf(details))
            }
          />
          <span id={selectId} hidden>
            Select
          </span>
          {label ? (
            <span ref={fallbackRef} hidden>
              {label}
            </span>
          ) : null}
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

/**
 * A row written by hand.
 * @deprecated Give useDataTable `data` and `columns`; DataTableBody renders
 * the rows, and `lockedReason` on useDataTable locks them. Removed in 0.3.0.
 */
function DataTableRow(props: RowFrameProps) {
  return <RowFrame {...props} />
}

function DataTableLock() {
  const row = React.useContext(DataTableRowContext)
  if (!row || !hasReason(row.lockedReason)) return null
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
  avatar?: DataTableAvatar
}

function BodyCell({
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

/**
 * A cell written by hand.
 * @deprecated Give the column `meta: { type }` and a `cell` renderer;
 * DataTableBody renders the cells. `secondary`, `icon` and `avatar` move to
 * `meta` too. Removed in 0.3.0.
 */
function DataTableCell(props: DataTableCellProps) {
  return <BodyCell {...props} />
}

/**
 * The rows as cards, shown instead of the table when narrowLayout is
 * "cards". With no children it renders the table's current page: the
 * primary or person column as the title, status at the end, and the other
 * columns as fields. A function child renders each row's card your way.
 */
function DataTableCards({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"ul">, "children"> & {
  /** Cards written by hand, or a function that renders one for each row. */
  children?: React.ReactNode | ((row: DataTableAnyRow) => React.ReactNode)
}) {
  const { cards } = useDataTableRoot()
  if (!cards) return null
  return (
    <ul
      data-slot="data-table-cards"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children === undefined || typeof children === "function" ? (
        <ModelCards render={children} />
      ) : (
        children
      )}
    </ul>
  )
}

function ModelCards({
  render,
}: {
  render?: (row: DataTableAnyRow) => React.ReactNode
}) {
  const { table } = useDataTableRoot()
  useRowModelInputs()
  return table
    .getRowModel()
    .rows.map((row) =>
      render ? (
        <React.Fragment key={row.id}>{render(row)}</React.Fragment>
      ) : (
        <ModelCard key={row.id} row={row} />
      )
    )
}

function ModelCard({ row }: { row: DataTableAnyRow }) {
  // As in ModelRow: a renderer that reads row.getIsSelected() follows it.
  useRowSelected(row.id)
  const cells = row.getVisibleCells()
  const typeOf = (cell: (typeof cells)[number]) =>
    cell.column.columnDef.meta?.type ?? "text"
  const title =
    cells.find((cell) => ["primary", "person"].includes(typeOf(cell))) ??
    cells[0]
  const status = cells.find((cell) => typeOf(cell) === "status")
  const fields = cells.filter(
    (cell) => cell !== title && cell !== status && typeOf(cell) !== "actions"
  )
  return (
    <DataTableCard
      id={row.id}
      title={title ? <FlexRender cell={title} /> : row.id}
      avatar={title?.column.columnDef.meta?.avatar?.(row.original)}
      status={status ? <FlexRender cell={status} /> : undefined}
      lockedReason={row.table.options.meta?.lockedReason?.(row.original)}
    >
      {fields.length
        ? fields.map((cell) => (
            <DataTableCardField key={cell.id} label={labelOf(cell.column)}>
              <FlexRender cell={cell} />
            </DataTableCardField>
          ))
        : null}
    </DataTableCard>
  )
}

function DataTableCard({
  className,
  id,
  title,
  avatar,
  status,
  lockedReason,
  children,
  ...props
}: Omit<React.ComponentProps<"li">, "id" | "title"> & {
  /** The row's id, the same one getRowId gives it. */
  id: string
  /** The row's name. It also names the card's checkbox. */
  title: React.ReactNode
  /** The person's photo, for a row that's a person. */
  avatar?: DataTableAvatar
  /** A status Badge, at the end of the heading. */
  status?: React.ReactNode
  /** Why the row can't be selected. Setting it locks the card. */
  lockedReason?: React.ReactNode
}) {
  const { table, registerLocked } = useDataTableRoot()
  const labelId = React.useId()
  const selectId = React.useId()
  const reasonId = React.useId()
  const locked = hasReason(lockedReason)
  const selected = useRowSelected(id)

  React.useLayoutEffect(
    () => registerLocked?.(id, locked),
    [id, locked, registerLocked]
  )

  const row = React.useMemo(
    () => ({ id, labelId, reasonId, lockedReason }),
    [id, labelId, reasonId, lockedReason]
  )

  return (
    <DataTableRowContext.Provider value={row}>
      <li
        data-slot="data-table-card"
        data-row-id={id}
        data-selected={selected || undefined}
        data-locked={locked || undefined}
        className={cn(
          "group/row flex gap-3 border-b border-border bg-background p-3 last:border-b-0 data-selected:bg-muted",
          className
        )}
        {...props}
      >
        <span className="flex pt-0.5">
          <Checkbox
            aria-labelledby={`${selectId} ${labelId}`}
            aria-describedby={locked ? reasonId : undefined}
            checked={selected}
            disabled={locked}
            onCheckedChange={(checked, details) =>
              toggleRow(table, id, checked, shiftKeyOf(details))
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
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-h-6 items-center gap-2">
            {avatar ? (
              <Avatar size="sm">
                {avatar.src ? <AvatarImage src={avatar.src} alt="" /> : null}
                <AvatarFallback>{avatar.fallback}</AvatarFallback>
              </Avatar>
            ) : null}
            <span id={labelId} className="truncate text-sm font-medium">
              {title}
            </span>
            <DataTableLock />
            {status ? (
              <span className="ml-auto inline-flex shrink-0 rounded-full bg-background">
                {status}
              </span>
            ) : null}
          </div>
          {children ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">{children}</dl>
          ) : null}
        </div>
      </li>
    </DataTableRowContext.Provider>
  )
}

function DataTableCardField({
  className,
  label,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** What the value is, such as “Team”. */
  label: React.ReactNode
}) {
  return (
    <div
      data-slot="data-table-card-field"
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    >
      <dt className="truncate text-xs text-muted-foreground group-data-selected/row:text-foreground">
        {label}
      </dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
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

/**
 * Pagination wired to the table's pages, for the footer. Give the table a
 * page size, in `initialState.pagination` or a pagination atom.
 */
function DataTablePagination(
  props: Omit<
    PaginationProps,
    | "page"
    | "defaultPage"
    | "pageCount"
    | "onPageChange"
    | "pageSize"
    | "totalCount"
    | "noun"
  >
) {
  const { table, noun } = useDataTableRoot()
  const { pageIndex, pageSize } = useSelector(table.atoms.pagination)
  useSelector(
    table.store,
    (state) => [state.columnFilters, state.globalFilter],
    { compare: shallow }
  )
  return (
    <Pagination
      data-slot="data-table-pagination"
      page={pageIndex + 1}
      pageCount={Math.max(1, table.getPageCount())}
      onPageChange={(page) => table.setPageIndex(page - 1)}
      pageSize={pageSize}
      totalCount={table.getRowCount()}
      noun={noun}
      {...props}
    />
  )
}

/** “2 of 6 members selected”, for a picker's footer. */
function DataTableSelectionCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { noun } = useDataTableRoot()
  const { count, totalCount } = useSelectionSummary()
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
  createDataTableColumnHelper,
  DataTable,
  DataTableAction,
  DataTableActions,
  DataTableBody,
  DataTableBulkAction,
  DataTableBulkActions,
  DataTableCard,
  DataTableCardField,
  DataTableCards,
  DataTableCell,
  DataTableColumns,
  DataTableContent,
  dataTableCodecs,
  DataTableFacetFilter,
  dataTableFeatures,
  DataTableFilters,
  DataTableFooter,
  DataTableHead,
  DataTableHeader,
  DataTablePagination,
  DataTableRow,
  DataTableSearch,
  DataTableSelectionCount,
  DataTableToolbar,
  useDataTable,
  useDataTableContext,
  useDataTableFacets,
  useDataTableSelection,
  useSearchParamsAtom,
}
export type {
  DataTableAvatar,
  DataTableCellType,
  DataTableColumnMeta,
  DataTableFacet,
  DataTableFeatures,
  DataTableInstance,
  DataTableNarrowLayout,
  DataTableNoun,
  DataTableOptions,
  DataTablePinned,
  DataTableProps,
  DataTableSelection,
  SearchParamCodec,
}
