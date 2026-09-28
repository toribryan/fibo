---
name: add-component
description: Add a new fibo component end to end, or port one in from another codebase. Covers the source file, stories, the Storybook docs page, catalog metadata and the registry. Use when asked to create, add, build or port a component into fibo.
---

# Add a component to fibo

A component is not done until it has a source file, stories, a docs page and
a metadata entry, and the registry build picks it up. Work through the steps
in order; each links to a file that already does it well, so copy that shape.

## 1. Choose the shelf

- **Components** (`Components/<Name>`): standard parts most interfaces need.
  Depend on nothing beyond Base UI, `class-variance-authority` and
  `lucide-react`. No animation libraries.
- **Niche** (`Niche/<Name>`): playful parts built for one kind of moment, such
  as a diagram, a reading rail or a reaction. May use `motion`.

If unsure, it is a Component.

## 2. Write the source

`packages/ui/src/components/<name>.tsx`, kebab-case. Model:
`button.tsx` (Components) or `integration-visual.tsx` (Niche).

- Build on Base UI primitives (`@base-ui/react/*`), not Radix.
- Set `data-slot="<name>"` on the root, and `data-slot="<name>-<part>"` on
  named parts.
- Export a PascalCase component and, if it has variants, a `<name>Variants`
  cva object. Export public types with `type` exports.
- Semantic tokens only: `bg-primary`, `text-muted-foreground`, `border-border`.
  Never a primitive ramp (`neutral-500`) or an opacity modifier
  (`bg-primary/10`); use the named `-subtle`, `-hover` and `-ring` roles.
- Import through `@workspace/ui/lib/utils` and
  `@workspace/ui/components/<other>`, never a relative path. The registry
  build rewrites those exact prefixes.
- Add `"use client"` when the file uses state, effects or refs.
- Motion: respect `prefers-reduced-motion`, and keep continuous animation
  off unless it is the point of the part.
- Accessibility: keyboard reachable, visible `focus-visible` ring
  (`ring-[3px] ring-ring-subtle`), names on icon-only controls.
- Document every prop with a one-line JSDoc comment. Storybook's props table
  reads them.
- Comments explain why, never what. No emojis in code; escape them
  (`"\u{1F44D}"`) when a component needs one.

## 3. Write the stories

`packages/ui/src/components/<name>.stories.tsx`. Model:
`chapter-scrubber.stories.tsx`.

- `title: "Components/<Name>"` or `"Niche/<Name>"`.
- No `autodocs` tag; the MDX page is the docs. Add `tags: ["new"]` for a
  new part (it shows a pill in the sidebar).
- A `Default` story driven entirely by args, so the playground controls work.
- `argTypes` for every visual prop (`inline-radio` for small unions, ranges
  for numbers). Set `control: false` on data and callback props, and list them
  in `parameters.controls.exclude`.
- One story per variant worth showing, plus one or two real compositions.

## 4. Write the docs page

`apps/storybook/src/components/<name>.mdx`. Copy `button.mdx` and keep the
section order:

1. `# Name` and a one or two sentence description.
2. `<Playground of={Stories.Default} />`
3. `## Import` with `<Install name="<name>" exports={[...]} />`
4. `## Usage` and `## Accessibility` as `<UsageGuidelines>`.
5. `## Variants`, one `<Canvas>` per story.
6. `## Do's and don'ts` with `<ComponentRules>` and live examples.
7. `## Related components` with `<RelatedComponents names={[...]} />`
8. `## Props` with `<ArgTypes of={Stories.Default} />`

Headings and copy in sentence case.

## 5. Register the metadata

- Add an entry to `packages/ui/components.meta.json`: `title`, a one-line
  `description`, `tier` (`components` or `niche`), `group`, and
  `"status": "new"` for a new part. The registry build fails without it.
- Add a small, inert preview to `PREVIEWS` in
  `apps/storybook/src/blocks/catalog.tsx`, keyed by file name.
- Add a line to `apps/storybook/src/pages/changelog.mdx`.

## 6. Verify

Run from the repo root and fix anything that fails:

```bash
pnpm format:write
pnpm lint
pnpm build
pnpm typecheck
```

Then open the part in `pnpm storybook` and check both themes, the playground
controls, keyboard use and reduced motion. Confirm
`apps/registry/public/r/<name>.json` exists and lists the right `dependencies`.

## Porting from another codebase

Treat the original as a reference, not a paste. Swap its utilities for
`@workspace/ui/lib/utils`, replace colours and opacity modifiers with fibo
tokens, move Radix primitives to Base UI, drop site-specific data and copy,
and replace internal helpers with props. Credit the source in a comment if its
geometry or artwork is reused.
