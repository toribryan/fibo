# 003 Data table

## What is changing

fibo gets the table the Figma library already has. It lands as two registry
parts and four supporting ones, over several pull requests:

- `@fibo/table`: styled native table parts, the shadcn shape (`Table`,
  `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`,
  `TableCell`, `TableCaption`), at the Figma density.
- `@fibo/data-table`: the bulk selection pattern from the Figma Table page,
  built on `@fibo/table`.
- `@fibo/tooltip`, `@fibo/menu`, `@fibo/sheet`, `@fibo/pagination`: base
  components Data table needs and fibo lacks. Each ships on its own first.

## Why now

The Figma file documents one table for every list in a product, drawn from
an audit of 15 tables and 44 screens. It found five places for bulk actions,
five ways to word a count, rows from 33 to 110px, and select all that stopped
at the page. The Figma page settles each of those once. Until the code does
too, every team rebuilds the table and the inconsistencies come back.
`pnpm figma:drift` already reports Data table as in Figma with no component
in code.

## Options and choices

**One part or two.** Data table only, matching Figma, or a plain Table
underneath it. Chosen: two. Most tables are static and need none of the
selection machinery, and shadcn users expect `table` to be the plain parts.
Data table imports Table, so they cannot drift apart.

**Dependencies.** shadcn's data table guide is built on TanStack Table.
Base components may only depend on Base UI, `class-variance-authority` and
`lucide-react`, so it is out. Base UI has no table or grid primitive.
Selection, the select all state and pinning are written by hand; the app
owns its rows, so none of TanStack's row model is needed.

**Missing parts.** Build the tooltip, menu, sheet and pagination inside
`data-table.tsx`, or ship each as a base component first. Chosen: standalone
first. The unselectable row needs a Tooltip, More actions and row actions
need a Menu, the narrow Filters sheet needs a Sheet (Base UI Drawer), and the
footer needs Pagination. All four are useful well beyond the table.

**Composition or config.** A `columns` array (Primer, Atlassian), or JSX
parts (Polaris rows, React Aria, shadcn). Chosen: JSX parts, named after the
Figma layers so the docs and the file use one vocabulary. A columns array
would rebuild TanStack's surface and fights the copy-and-own registry model.

```tsx
<DataTable
  value={selected}
  onValueChange={setSelected}
  rowIds={page.map((a) => a.id)}
  totalCount={248}
  noun={{ one: "agent", other: "agents" }}
>
  <DataTableToolbar>
    <DataTableFilters>...</DataTableFilters>
    <DataTableActions>...</DataTableActions>
    <DataTableBulkActions pattern="delete only" onDelete={remove} />
  </DataTableToolbar>
  <DataTableContent>
    <DataTableHeader>
      <DataTableHead type="primary" pinned="start">
        Agent
      </DataTableHead>
      <DataTableHead type="status" pinned="end">
        Status
      </DataTableHead>
    </DataTableHeader>
    <DataTableBody>
      {page.map((agent) => (
        <DataTableRow key={agent.id} id={agent.id} lockedReason={agent.lock}>
          <DataTableCell type="primary" pinned="start">
            {agent.name}
          </DataTableCell>
          <DataTableCell type="status" pinned="end">
            ...
          </DataTableCell>
        </DataTableRow>
      ))}
    </DataTableBody>
  </DataTableContent>
  <DataTableFooter>...</DataTableFooter>
</DataTable>
```

**Selection state.** Follows Base UI naming: `value`, `defaultValue`,
`onValueChange`. The value is `Set<string> | "all"`, as in React Aria, where
`"all"` means every matching row across pages, not just the loaded ones.
Unchecking one row while in `"all"` drops to the page's ids minus that row,
as Polaris does; an "all except" shape can come later if a product needs it.
`rowIds` and `totalCount` let the root work out none, some or all for the
header checkbox, offer Select all matching once the page is selected, and
keep locked rows out of select all. A `useDataTableSelection` hook in the
same file covers uncontrolled use and pickers.

**Sorting and paging.** Controlled only: `sort` and `onSortChange` on the
root, pagination through `@fibo/pagination` in the footer. The component
never holds the dataset, so the app sorts, filters and pages it.

**Semantics.** A native `<table>`, not `role="grid"`. A grid commits to
roving focus and arrow keys in every cell; here the controls are checkboxes
and buttons that work as plain Tab stops.

- Row checkboxes are named by the row's primary cell ("Select Maya Okafor"),
  the header one by its scope ("Select all agents on this page").
- Selected rows carry `data-selected`, not `aria-selected`, which only means
  something in a grid.
- A `role="status"` region at the root announces "3 agents selected", "All
  248 agents selected" and "Selection cleared".
- When the toolbar swaps back to idle, focus moves to the select all
  checkbox, so it is never lost with the removed Clear button.
- Escape clears the selection; Shift+click selects a range.
- An unselectable row's checkbox is `aria-disabled`, and the lock is a
  focusable Tooltip trigger whose reason is also in `aria-describedby`.
- Sortable headers hold a button, with `aria-sort` on the sorted `<th>` only.

**Pinning and narrow widths.** Pinned cells use `position: sticky` with
`border-collapse: separate`, an opaque token background in every row state,
and offsets in CSS variables. A scroll listener and ResizeObserver set
`data-scroll-start` and `data-scroll-end` on the root to show the shadows.
The root is a container, and Tailwind's `@lg` container size is the spec's
32rem, so `@max-lg:` turns pinning off with no script. `narrowLayout="cards"`
renders a separate list of Data table cards below that width rather than
restyling `<tr>`, which drops table semantics in some browsers.

**Figma parity.** The Figma property names and options carry over as code
props: `type` and `pinned` on Head and Cell, `state` on Row as data
attributes, `pattern` on Bulk actions, `narrowLayout` on the root.
Data table's `selection` and `width` are state and container width in code,
so they go in `figma/drift.config.json` under `figmaOnlyProps` with that
reason.

## Phases

1. **Supporting parts.** Tooltip, Menu, Sheet, Pagination, one pull request
   each.
2. **Table and the core of Data table.** `@fibo/table`; Data table with
   selection, select all, the six cell types, unselectable rows, pinned
   columns and the footer.
3. **Toolbar and bulk actions.** The idle and selecting toolbar, the eight
   bulk action patterns, Select all matching and Show selected only.
4. **Narrow layout.** Scroll with the icon-only toolbar, cards, and the
   Filters sheet.

Each phase leaves the drift check, the docs page and the stories consistent
with what has shipped so far.
