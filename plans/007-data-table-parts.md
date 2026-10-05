# 007 Data table parts

## What is changing

The last Data table items from plan 006, step 7: the pieces it still draws
from props and flags become parts a caller puts in.

1. **Loading.** A `loading` prop on `DataTable` and a `DataTableSkeleton`
   part. While loading, the body shows skeleton rows shaped like the
   visible columns (cards show skeleton cards), the table is `aria-busy`,
   and the empty state waits.
2. **Person cell.** `DataTablePerson` with `DataTablePersonAvatar`,
   `DataTablePersonName` and `DataTablePersonDescription`, returned from a
   column's `cell`. The card header renders the same cell, so one definition
   draws both. `getInitials` moves to `lib/` and fills the avatar's fallback
   from the name; Message list and Sticker avatar use it too.
3. **Card parts.** `DataTableCard` takes `DataTableCardHeader`,
   `DataTableCardTitle`, `DataTableCardStatus` and `DataTableCardFields`
   as children instead of `title`, `avatar` and `status` props.
4. **Selection toolbar.** `DataTableSelectionBar` with
   `DataTableSelectionClear`, `DataTableSelectionCount`,
   `DataTableSelectAllMatching` and `DataTableShowSelectedOnly`.
   `showSelectedOnly` and `onShowSelectedOnlyChange` move from `DataTable`
   to `DataTableShowSelectedOnly`, which also turns itself off when the
   selection empties.

Today a person column reads:

```tsx
col.accessor("name", {
  header: "Member",
  meta: {
    type: "person",
    avatar: (m: Member) => ({ src: m.photo, fallback: m.initials }),
    secondary: (m: Member) => m.email,
  },
})
```

After:

```tsx
col.accessor("name", {
  header: "Member",
  meta: { type: "person" },
  cell: ({ row }) => (
    <DataTablePerson>
      <DataTablePersonAvatar src={row.original.photo} />
      <DataTablePersonName>{row.original.name}</DataTablePersonName>
      <DataTablePersonDescription>
        {row.original.email}
      </DataTablePersonDescription>
    </DataTablePerson>
  ),
})
```

The avatar's initials come from the name part, so `initials` leaves the
data. A caller that wants a status adds `<StatusDot>` inside the avatar,
which the old `avatar` object could not hold.

## Why now

Steps 1 to 6 built the primitives Data table needed: Count, Separator,
InputGroup and EmptyState are in. What is left is Data table's own API,
where three things can't be extended without a new prop:

- A person cell can't show a status dot, a badge after the name or a link,
  because the cell draws the avatar and the second line itself.
- A hand-written card can't put anything in its heading but a title, an
  avatar and a status.
- The selection bar always renders the same four controls, and Show
  selected only lives on the root, far from the checkbox it drives.

A table with data on the way also has no loading state, so it shows "No
members yet" until the rows arrive.

## Options and choices

**Cells: parts or meta.** Plan 005 put a cell's kind in `meta.type`, so
alignment, the row's name and the card layout all follow from it. Parts
could replace `type` as well, but the card reads `type` to pick its title
and status, and a table of thirty columns would repeat itself. Chosen:
`meta.type` stays; the content of a person cell becomes parts.
`meta.avatar` and `meta.secondary` stay as shorthands that render the same
parts, deprecated under plan 002, with a codemod.

**Initials.** The two copies disagree: Message list takes the first two
words, Sticker avatar the first and last. Chosen: first and last, so "Ada
King Lovelace" is AL, the way contact apps do it. One letter for one word.

**Loading.** A part the caller swaps in for the body
(`loading ? <DataTableSkeleton /> : <DataTableBody />`), or a `loading`
prop. Swapping means writing the header and body by hand, and the cards
would need the same switch. Chosen: `loading` on the root, read by the body
and the cards; `DataTableSkeleton` is exported for hand-written bodies.

**Selection bar default.** Make callers write the bar, or render today's
bar when they don't. Chosen: `DataTableToolbar` renders a default
`DataTableSelectionBar` unless one is among its children, so every table
keeps working and a caller who writes one picks its parts.

**Show selected only.** Keep the root props as shorthands for a release,
then remove them. The root renders nothing for them once the part exists,
so the shorthand just feeds the default bar.

**Narrow actions.** Plan 006 listed one collapsible icon button for the
narrow toolbar's actions. Narrow, the toolbar already shrinks Columns, bulk
actions and Delete to icons and moves filters into a sheet, and one More
menu would need a menu item for every action, which today are Buttons.
Chosen: left out until a narrow layout needs it.

## Order

Each is its own pull request with its Figma update and docs.

1. `loading` and `DataTableSkeleton`. Small, and fixes a visible gap.
2. `getInitials` in `lib/`, then the person parts, `meta.avatar` and
   `meta.secondary` deprecated with a codemod.
3. Card parts, the card props deprecated.
4. Selection bar parts, the root's `showSelectedOnly` props deprecated with
   a codemod.
