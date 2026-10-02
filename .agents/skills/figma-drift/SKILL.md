---
name: figma-drift
description: Check the fibo Figma library against the code for drift in colour variables, radii and component variant properties, then triage what it finds. Reads Figma through the Figma MCP server into figma/snapshot.json and runs `pnpm figma:drift`. Use when asked whether Figma and code match, before a release, after changing tokens or a component's variants, or when a designer says something looks different in Figma.
---

# Figma drift check

fibo promises one name on both sides: every token in `globals.css` matches a
variable in Figma's Color collection, and every component property in Figma
is a prop in code. This skill checks that promise and reports where it
breaks. It never fixes either side on its own.

The library is `https://www.figma.com/design/LJZ5Tt4Ba7NPPi8Xnq8i0e/Fibo-DS`
(file key `LJZ5Tt4Ba7NPPi8Xnq8i0e`).

## 1. Read Figma

Load the `figma-use` skill before the first `use_figma` call.

1. **Variables.** One `use_figma` call running
   [`read-variables.js`](read-variables.js). It returns `{ Color, Border }`.
2. **Pages.** One read-only call:
   `return figma.root.children.map((p) => ({ id: p.id, name: p.name }))`.
   Component pages are the `↳` pages under **Components** and **Niche**;
   skip Icons and guide pages such as Table guide.
3. **Components.** In one message, one `use_figma` call per component page
   running [`read-components.js`](read-components.js) with its `PAGE_ID`.
   Never loop over pages inside a single script.

## 2. Write the snapshot

Replace `variables` and `components` in `figma/snapshot.json` with what came
back (merge the per-page results into one `components` object), and set
`readAt` to today's date. Keep the file's shape and key order so the diff
shows only what changed in Figma. That diff is worth reading on its own: it
is everything designers changed since the last check.

## 3. Run the check

CI runs it on every pull request against the committed snapshot, so a code
change that breaks parity fails there. A Figma change only shows up once the
snapshot is refreshed.

```bash
pnpm figma:drift          # human report, exit 1 on any error
pnpm figma:drift --json   # the same findings for further processing
```

What it compares, and how:

- **Colour.** Each Color variable, per mode, against the `:root` (Light) and
  `.dark` (Dark) blocks of `globals.css`. Both sides are reduced to the
  primitive they point at, so `alpha/red-700/8` matches
  `color-mix(in oklch, var(--color-red-700) 8%, transparent)` and
  `alpha/white/10` matches `oklch(1 0 0 / 10%)`. A variable on one side
  only is an error.
- **Radius.** Border's `radius/sm` to `radius/4xl` against the steps derived
  from `--radius`.
- **Components.** A Figma component maps to `packages/ui/src/components/`
  by kebab-cased name, or through `componentFiles` in
  `figma/drift.config.json` for parts such as Integration tile. Each Figma
  variant property is held against a cva variant or string-union prop of the
  same name: differing options are an error; a property with no prop, or a
  cva variant with no property, is a warning. `state` is ignored, since
  hover, focus and disabled are CSS states in code. Components on one side
  only are notes.
- **Conventions.** Every `size` option, in code and in Figma, comes from
  `xs`, `sm`, `default`, `lg`, `xl` or `icon-<step>`, listed smallest
  first. Off-scale names and out-of-order options are errors on both sides.

### Fixing option order in Figma

The Plugin API has no call to reorder a variant property's values, and
renaming a value keeps its slot. A value that leaves the set and comes back
is appended at the end, so to move `default` after `sm`, in one
`use_figma` call:

1. Rename each `size=default, …` variant to `size=sm, state=parked<i>`, a
   unique name so no two variants clash (a clash fails the whole call).
2. Read `componentPropertyDefinitions` once. Figma only recomputes the
   options on a read, so without it nothing moves.
3. Rename each variant back to its original name.

The default variant, the one that drops in from the library, is whichever
sits top-left on the canvas, not first in the layer list. Leave `default`
there.

## 4. Triage

For every error and warning, work out which side moved and say what you
would change. Do not edit `globals.css`, a component, the Figma file or the
config without the person's go-ahead.

- `git log -p -S '<token>' -- packages/ui/src/styles/globals.css` shows when
  the code side last changed. If code changed after the snapshot side was
  last in sync, Figma is behind, and the reverse.
- A missing variant option usually means one side shipped a variant the
  other never got. Check the component's stories and docs page to see
  whether code treats it as supported.
- A renamed property (Figma `size: inline | bar`, code
  `variant: inline | floating`) is one finding, not two. Say so.
- A difference that is intended goes in `figma/drift.config.json` with a
  one-sentence reason, only once the person agrees. An entry with no reason
  is drift with the alarm switched off.

## 5. Report

Group by severity, then area. For each finding: what differs, which side
moved, and the change you propose, with the file or Figma page it touches.
End with one line: in sync, or the number of errors and warnings left.
