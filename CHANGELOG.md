# Changelog

Notable changes to fibo. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and fibo uses
[semantic versioning](https://semver.org/). The Storybook
[changelog page](https://fibo.toribryan.com/?path=/docs/changelog--docs)
has the same history with links into the docs.

## [Unreleased]

### Added

- A `brand/` folder with the brand kit's source: the rabbit, the logo,
  the social card and poster generators, and the motion prototype.

### Changed

- fibo's mascot is now a pixel rabbit. The Welcome page hero, the sidebar
  logo and the favicon use him; he idles, hops, watches the pointer and
  reacts to clicks with new lines. The Pixel snail component is unchanged
  and stays as the loading indicator.
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
