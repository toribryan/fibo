# Changelog

Notable changes to fibo. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and fibo uses
[semantic versioning](https://semver.org/). The Storybook
[changelog page](https://fibo.toribryan.com/?path=/docs/changelog--docs)
has the same history with links into the docs.

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
