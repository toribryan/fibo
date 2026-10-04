# 005 Data table on TanStack Table

## What is changing

Data table's state and row processing move to TanStack Table v9. The parts
that draw it stay: Toolbar, Filters, Actions, Bulk actions, Head and Cell
types, the lock, Cards, Footer and the selection count keep their names,
slots and markup. What changes is where rows and state come from:

- A stable feature set, `dataTableFeatures`, registers only what the product
  uses (below), with its row-model slots and function registries.
- A `useDataTable` hook, made once with `createTableHook`, binds those
  features, `getRowId` and fibo's defaults. Each table passes its own
  `data`, `columns` and any state it owns. The hook uses its own contexts
  from `createTableHookContexts`, so a Data table inside an app's own
  TanStack table never answers to the outer one.
- `<DataTable table={table}>` renders the body from the table's row model,
  through `table.FlexRender`, into the same semantic `<table>`, `<thead>`,
  `<tbody>`, `<th>` and `<td>` elements as now.
- Sorting, filters and pagination can be passed in as external atoms, and a
  small `useSearchParamsAtom` helper keeps an atom in the URL.

This amends plan 003, which kept TanStack out.

## Why now

Plan 003 kept TanStack out because base parts may only depend on Base UI,
`class-variance-authority` and `lucide-react`, and because the app owned its
rows. In use, apps rebuild the same things around the table every time: client
sorting and filtering, page slicing, counts per filter value, which columns
show. Each copy drifts from the next, which is the problem Data table exists
to solve. TanStack v9 is now stable (9.2.6). Its tree-shaken feature
registration means a table carries only the features it registers, which
answers most of the weight concern behind the original rule.

## Options and choices

**Dependency.** Keep the rule and build a separate `data-grid` part, rebuild
Data table, or build it in one app only. Chosen: rebuild Data table, and
allow `@tanstack/react-table` as a fourth dependency for this part only.
AGENTS.md names the exception. One table keeps one vocabulary, and two parts
with overlapping selection logic would drift.

**Features.** Only these are registered, in `dataTableFeatures`. Each
row-model factory goes in its slot (`sortedRowModel`, `filteredRowModel`,
`facetedRowModel`, `facetedUniqueValues`, `paginatedRowModel`) after the
feature it needs:

| Need                          | Feature                                            | Row model / registry                                 |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Sort by a header              | `rowSortingFeature`                                | `createSortedRowModel`, `sortFns`                    |
| Search and per-column filters | `columnFilteringFeature`, `globalFilteringFeature` | `createFilteredRowModel`, `filterFns`                |
| Counts in the filter menu     | `columnFacetingFeature`                            | `createFacetedRowModel`, `createFacetedUniqueValues` |
| Pages                         | `rowPaginationFeature`                             | `createPaginatedRowModel`                            |
| Selection and bulk actions    | `rowSelectionFeature`                              | none                                                 |
| Show and hide columns         | `columnVisibilityFeature`                          | none                                                 |
| Pinned first and last columns | `columnPinningFeature`                             | none                                                 |

Grouping, expanding, resizing, ordering, row pinning and cell selection are
left out until a product needs them. `sortFns` and `filterFns` hold only the
functions fibo's cell types use, all TanStack built-ins: `sortFn_text`,
`sortFn_alphanumeric` (what `"auto"` picks for words with digits),
`sortFn_basic` for numbers and `sortFn_datetime` for dates; and
`filterFn_includesString`, `filterFn_equals` and `filterFn_arrHas`, the
in-list filter, where a row matches any of the ticked values. Column `meta`
and table `meta` are typed through the `columnMeta` and `tableMeta` slots
with `metaHelper`, not by merging TanStack's global interfaces.

**State ownership.** All in the table's Store, external atoms for every
slice, or a mix. Chosen: a mix. Sorting, column filters, the global filter
and pagination are what a person would want in a shared link, so an app can
pass them as atoms (`atoms.sorting` and so on) and sync them to the URL.
Selection, column visibility and pinning stay in the table's Store. Reads go
through `table.Subscribe` or `useSelector` with narrow selectors, so ticking
a row re-renders that row and the toolbar, not the whole body. `useSelector`
and the atoms come from `@tanstack/react-store`, which `@tanstack/react-table`
depends on; Data table imports it directly, so the exception covers both.
`useDataTable` passes a selector that selects nothing unless the caller
gives one, since `useTable`'s default re-renders its caller on every change.

**URL sync.** In the component, in a helper, or left to each app. Chosen: a
framework-free helper, `useSearchParamsAtom(key, codec)`. It reads the
initial value from `location.search` and writes with
`history.replaceState`, which Next's App Router and most routers observe.
The table never touches the URL itself; an app opts in per slice. Server
sync is out of scope. `manualSorting`, `manualFiltering` and
`manualPagination` stay available for apps that page on a server. TanStack's
default page size is 10, so `useDataTable` starts at `Infinity`, every row
on one page, until a table asks for pages.

**Selection semantics.** Plan 003's `"all"` meant every matching row across
pages. With the row model in hand, that becomes `toggleAllRowsSelected`
over the filtered rows, and the page checkbox becomes
`toggleAllPageRowsSelected`. Both reach loaded rows only: with
`manualPagination`, selecting rows on unloaded pages stays with the app.
Locked rows stay out through `enableRowSelection`, which `useDataTable` sets
from a `lockedReason` option. Shift ranges go through
`row.getToggleSelectedHandler()`, which only extends a range when
`isRowRangeSelectionEvent` recognises the event, so the hook passes one that
reads `shiftKey`. The announcements, Escape to clear, Shift+click ranges and
focus return keep their current behaviour and tests.

**Rows a filter hides.** Pruning the selection to the filtered rows, or
keeping hidden rows selected. Chosen, by the owner: they stay selected. The
one source is the selected rows still in the data (`getSelectedRowModel`);
ids a refetch drops are pruned, so `getSelectedRowIds()` never lists a row
that's gone. The hidden count is the selected rows the filtered model
leaves out, and the toolbar, the announcement and the footer count all say
it: “5 members selected, 2 hidden by filters”. The footer's total is the
matching rows plus those hidden selected ones, so the count never runs past
it. The page checkbox reflects the page only. Select all matching adds the
filtered rows and keeps the hidden ones, since `toggleAllRowsSelected`
spreads the old selection; Clear and Escape clear everything. Bulk actions
act on every selected row, hidden ones included, so the bulk actions group
is labelled with the count, and Delete's description repeats it with how
many are hidden. Someone filtering to find more rows to add shouldn't lose
the ones they already picked, and saying the hidden count keeps a bulk
delete from reaching rows nobody mentioned.

**Semantics.** Unchanged from plan 003: a native `<table>`, not
`role="grid"`, with `aria-sort` on the sorted `<th>` only.

**Migration.** Plan 002 gives a replaced API one minor release. The current
root props (`rowIds`, `value` and `defaultValue` as `Set<string> | "all"`,
`onValueChange`, `totalCount`), `useDataTableSelection`, and hand-written
`DataTableRow`, `DataTableCell` and `DataTableHead` children keep working for
that release. Plan 003's `sort`/`onSortChange` never shipped, so there is
nothing to migrate there. Without a `table`
prop, the root builds an internal TanStack table from `rowIds` with selection
only, so one implementation backs both APIs. The old props carry
`@deprecated` JSDoc. The docs page gets a migration section, and a codemod in
`apps/registry/codemods/` reports each old-API use with file and line; it
can't safely write column definitions for you. The old path is removed in
the next minor. Only an API is deprecated, not the part, so there is no
`deprecated` entry in `components.meta.json`; the changelog says it.

**Narrow layouts.** The cards layout reads the same row model, so search,
sort and pages work the same on a phone.
