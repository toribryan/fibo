/*
 * A table that stacks into one block per row when its container is narrower
 * than 36rem, since a phone or a side pane leaves each column a word or two
 * wide. The first cell leads the block; every other cell shows its column's
 * header above it, from a `data-label` the table sets on its cells.
 * Container queries rather than breakpoints: the viewer pane is narrow on a
 * tablet too.
 */
const stackedTable = {
  container: "@container",
  frame:
    "overflow-x-auto rounded-xl border border-border @max-xl:overflow-visible",
  table: "w-full border-collapse text-left text-sm @max-xl:block",
  thead: "@max-xl:sr-only",
  tbody: "@max-xl:block",
  tr: "@max-xl:block @max-xl:border-b @max-xl:border-border @max-xl:px-4 @max-xl:py-3 @max-xl:last:border-b-0",
  th: "border-b border-border bg-muted px-3 py-2 font-semibold text-foreground",
  /** A cell's table-mode styles, for tables that lay out their own rows. */
  cell: "border-b border-border px-3 py-2 align-top text-muted-foreground [tr:last-child>&]:border-b-0 @max-xl:block @max-xl:border-b-0 @max-xl:p-0",
  td: "border-b border-border px-3 py-2 align-top text-muted-foreground [tr:last-child>&]:border-b-0 @max-xl:block @max-xl:border-b-0 @max-xl:px-0 @max-xl:py-1 @max-xl:first:text-foreground @max-xl:[&_code]:whitespace-nowrap @max-xl:not-first:before:mb-0.5 @max-xl:not-first:before:block @max-xl:not-first:before:text-xs @max-xl:not-first:before:font-medium @max-xl:not-first:before:text-foreground @max-xl:not-first:before:content-[attr(data-label)]",
}

// Markdown tables arrive without labels on their cells, so they are copied
// from the header row after render.
function labelCells(table: HTMLTableElement | null) {
  if (!table) return
  const labels = [...table.querySelectorAll("thead th")].map(
    (th) => th.textContent?.trim() ?? ""
  )
  for (const row of table.querySelectorAll("tbody tr"))
    [...row.children].forEach((cell, index) =>
      cell.setAttribute("data-label", labels[index] ?? "")
    )
}

export { labelCells, stackedTable }
