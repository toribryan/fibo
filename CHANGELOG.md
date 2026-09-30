# Changelog

Notable changes to fibo. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and fibo uses
[semantic versioning](https://semver.org/). The Storybook
[changelog page](https://fibo.toribryan.com/?path=/docs/changelog--docs)
has the same history with links into the docs.

## [Unreleased]

### Added

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

### Fixed

- Registry parts now bring the tokens they use that a stock shadcn theme
  lacks, such as `--primary-hover`, `--ring-subtle` and the status colours.
  Before, they installed without them, and hover, focus ring and destructive
  styles silently disappeared.
- Registry parts depend on shadcn's `utils`, so `cn` is installed in a project
  that never ran `shadcn init`.

### Changed

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
