# Changelog

Notable changes to fibo. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and fibo uses
[semantic versioning](https://semver.org/). The Storybook
[changelog page](https://fibo.toribryan.com/?path=/docs/changelog--docs)
has the same history with links into the docs.

## [Unreleased]

### Added

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

### Removed

- **Breaking:** Integration visual's `size` prop. Tiles and the hub keep the
  former `default` size.
- **Breaking:** Chapter scrubber's `preview="none"`. Every rail previews the
  chapter at the crest, as a `card` or a `label`.

### Fixed

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
