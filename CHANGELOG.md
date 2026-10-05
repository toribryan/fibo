# Changelog

Notable changes to fibo. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and fibo uses
[semantic versioning](https://semver.org/). The Storybook
[changelog page](https://fibo.toribryan.com/?path=/docs/changelog--docs)
has the same history with links into the docs.

## [Unreleased]

### Added

- Empty state: `EmptyState` with `EmptyStateMedia`, `EmptyStateTitle`,
  `EmptyStateDescription` and `EmptyStateActions`, `size` `sm` or `default`.
- Data table `DataTableEmpty` and an `empty` prop: a table with no rows says
  so, and offers Clear filters when a search or filter hid them. Pass
  `empty={null}` for the old blank body.
- Message list `empty` prop and `strings.empty`, shown before the first
  message.
- Input group: `InputGroup`, `InputGroupAddon` and `InputGroupInput`, an
  input with an icon, text or button beside it. `variant="ghost"` drops the
  border for a search at the top of a menu. Command menu, Filter menu and
  Data table draw their searches with it.
- Separator: a rule across or down, and with children a labelled rule.
  Message list's day dividers and Data table's bulk actions use it.
- Progress `type="circle"` with `size` `xs` to `lg`: a ring in the text
  colour that fits in a button. With `value={null}` it turns. Toast's loading
  icon and Chat composer's sending button use it, and the Spinner codemod
  now writes it, at the Spinner's own size.
- Field: `FieldLabel`, `FieldDescription` and `FieldError` wired to one form
  control, `orientation="horizontal"` for a checkbox or switch, `FieldItem`
  for each option in a radio group, and `FieldGroup` to set the size of a
  whole form. Input, Select and Switch take their size from it, and Textarea
  now joins a Field the way Input does.
- Slider `SliderLabel` and `SliderValue`, on one row above the track.
- Count: a number capped at 99+, shortened to 1.2K or signed as +4, with
  the exact number or your label for screen readers, and a `formatCount`
  helper for counts inside a sentence. Reactions, Jump bar, Filter menu,
  Data table's filters and Sticker avatar's count use it; Sticker avatar's
  count now reads “4 more” rather than “plus 4”.
- Status dot: a presence mark told apart by shape, a dot, a crescent and a
  ring, with a spoken label. Avatar pins it to its corner, Sticker avatar sets
  it on the paper and adds its label to the sticker's name, and Badge leads
  with it.
- Command menu `variant`, `default` or `inset`: `inset` sets the list in a
  card inside a muted shell that holds the search box and keyboard hints.
- Data table on TanStack Table: `useDataTable` takes your rows and columns,
  and the table sorts, searches, filters, pages and selects them. New parts
  draw each piece: `DataTableSearch`, `DataTableFacetFilter` with counts per
  value, `DataTableColumns` to show and hide columns, `DataTablePagination`,
  and sortable heads. `DataTableContent`, `DataTableCards` and their header
  and body render from the table when given no children.
  `useSearchParamsAtom` keeps sorting, filters, the search and the page in
  the URL. See `plans/005-data-table-on-tanstack.md`.

- An Open in Figma link at the top of each component's docs page, for the
  parts with a Figma page. Each part's page is its `figma` node in
  `components.meta.json`.
- Map pin: a dot, icon or labelled pin for a point on a map, in five
  status colours, with a preview card that springs open on click or tap.
  Renders inside any map library's marker.
- Floating nav text items: leave out an item's `icon` and it shows its label
  as text, always.
- A Figma drift check: the `figma-drift` agent skill reads the Figma library
  into `figma/snapshot.json`, and `pnpm figma:drift` reports where its colour
  variables, radii and component variant properties differ from the code.
  CI runs it on every pull request.
- Badge `success`, `warning` and `info` variants, tinted like `destructive`.
- Input `size`, `sm` or `default`, to match Select and Button in dense forms.
- Floating nav `size`, `sm` or `default`: `sm` gives 36px items and 16px icons
  for a compact pill.
- A way to retire a part: a `deprecated` entry in `components.meta.json`
  drives a docs banner, a sidebar and catalog pill, a notice printed on
  `shadcn add`, a line in `llms.txt`, and a codemod served at
  `/codemods/<name>.js`. See `plans/002-retiring-a-component.md`.
- A `retire-component` agent skill for taking a part through it.
- A Registry guide page in Storybook: a step-by-step walkthrough for
  designers, with a picker that reads the live registry files to show what
  each part brings into a project.
- `@fibo/theme`, the full token set in light and dark, installable with
  `shadcn add @fibo/theme`.
- An install check in CI: every registry item is added to a fresh
  `shadcn init` app, which must typecheck, build, and define every token the
  parts use.
- A `brand/` folder with the brand kit's source: the rabbit, the logo,
  the social card and poster generators, and the motion prototype.

### Deprecated

- Sticker avatar's `status`, `statusLabel` and `statusColor` props. Put a
  `<StatusDot>` in the sticker instead, with `label` and `variant`; the props
  draw the same dot until they're removed in 0.3.0. Move them with
  `pnpm dlx jscodeshift --parser tsx -t
https://fibo.toribryan.com/codemods/sticker-status-to-child.js src`.
- Data table's `rowIds`, `totalCount`, `value`, `defaultValue` and
  `onValueChange` props, `useDataTableSelection`, and hand-written
  `DataTableRow`, `DataTableCell` and `DataTableHead`. Use `useDataTable`
  and `<DataTable table={table}>`; the old API runs on the same table until
  it's removed in 0.3.0. The part itself isn't deprecated. List each use
  with `pnpm dlx jscodeshift --parser tsx --dry -t
https://fibo.toribryan.com/codemods/data-table-legacy-api.js src`.

### Removed

- **Breaking:** Integration visual's `size` prop. Tiles and the hub keep the
  former `default` size.
- **Breaking:** Chapter scrubber's `preview="none"`. Every rail previews the
  chapter at the crest, as a `card` or a `label`.

### Fixed

- Integration visual, Pixel snail and Token flow keep pausing off screen
  when given a `ref`, which used to replace the ref they watch the viewport
  with. They share a `mergeRefs` helper in `lib/`, which the registry ships
  with each of them as a `registry:lib` file.
- Reactions' particle shadow reads a new `--particle-shadow` token, the same
  in both themes, instead of a raw colour in an inline style.
- Typing indicator: the dots no longer get clipped at the top of their bounce.
- Registry parts now bring the tokens they use that a stock shadcn theme
  lacks, such as `--primary-hover`, `--ring-subtle` and the status colours.
  Before, they installed without them, and hover, focus ring and destructive
  styles silently disappeared.
- Registry parts depend on shadcn's `utils`, so `cn` is installed in a project
  that never ran `shadcn init`.

### Deprecated

- **Spinner**, added as the first part through the retirement path. Use an
  indeterminate Progress; the `spinner-to-progress` codemod migrates a
  project. Removed in 0.3.0.

### Changed

- Jump bar, Command menu, Filter menu and Reactions use Button, Badge and
  Checkbox's look for their own controls, so focus rings, hover and sizes
  match the rest of fibo. Reactions' inline trigger is 32px, on the size
  scale, rather than 28. Jump bar draws Mark as read only when `onMarkRead`
  is given. Checkbox exports `CheckboxMark`, its look without its behaviour,
  for rows that are already the control.
- Data table keeps selected rows that a search or filter hides, and the
  toolbar, announcement and `DataTableSelectionCount` add “, 2 hidden by
  filters”. Bulk actions and `table.getSelectedRowIds()` cover every
  selected row still in the data, hidden ones included; rows a refetch
  drops still leave the selection.
- Storybook groups base parts by what they do: their titles are
  `Base components/<Group>/<Name>`, and their docs live at
  `/?path=/docs/base-components-<group>-<name>--docs`. Special parts stay
  straight under their shelf. Links without a group still open the right
  page.
- **Breaking:** Reactions' `variant` prop is now `type` (`inline` or
  `floating`), and its root carries `data-type` instead of `data-variant`,
  matching the Figma property.
- Light-mode `--success-subtle`, `--warning-subtle` and `--info-subtle` tint
  at 6% instead of 8%. Success text on the old tint measured 4.43:1 at badge
  size, under AA.
- Size options are listed smallest first everywhere, starting with Button.
  Values are unchanged.

- fibo's mascot is now a pixel rabbit. The Welcome page hero, the sidebar
  logo and the favicon use him; he idles, hops, watches the pointer and
  reacts to clicks with new lines. The Pixel snail component is unchanged
  and stays as the loading indicator.
- The Welcome page hero draws its golden construction without the spiral,
  and its heading and drafting labels use Geist, matching the brand.
- The shelves are renamed Base components and Special components, formerly
  Components and Niche. Docs pages move to `base-components-<name>` and
  `special-components-<name>`; links to the old pages redirect.

## [0.1.0] - 2026-09-27

The first public release.

### Added

- Components: Badge, Button, Checkbox, Input, Label and Textarea, on Base UI.
- Niche: Chapter scrubber, Integration visual, Reactions and Token flow.
- A shadcn registry at `https://fibo.toribryan.com/r/{name}.json`, installable
  as `@fibo/<name>`, with titles, descriptions and docs links for every item.
- `llms.txt` listing every part and its install command.
- Storybook docs at https://fibo.toribryan.com: a playground, usage and accessibility
  guidelines, do's and don'ts and a props table for every part.
- An achromatic token layer that matches the Figma library one to one, with
  named `-subtle`, `-hover` and `-ring` roles instead of opacity modifiers.
- An `add-component` agent skill and a `component-reviewer` subagent.

[0.1.0]: https://github.com/toribryan/fibo/releases/tag/v0.1.0
