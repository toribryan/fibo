# 003 Property tokens

## What is changing

A layer of colour tokens scoped to the property they paint: text, background,
border and icon. `text-success` would read a token made for text,
`bg-success-subtle` one made for backgrounds, and `fill-success` one made for
icons and marks. Today all three read the same `--success`.

## Why now

Two things surfaced while building Sticker avatar.

- **One value can't meet every contrast bar.** Text needs 4.5:1 against its
  background, while icons, borders and status marks need 3:1. A tint behind
  text needs neither, it just needs to stay quiet. `--success` serves all of
  them with one value per theme, so it is either darker than an icon needs or
  too light for small text, depending on the theme. Its status dot had to move
  onto the page colour to stay above 3:1.
- **Figma scopes variables by property.** A Figma variable can be limited to
  text fill, shape fill, frame fill or stroke, so a designer only sees text
  colours when they colour text. fibo's tokens can't be scoped that way while
  one token paints everything. Property tokens map onto scoped variables one to
  one, the same way the `-subtle`, `-hover` and `-ring` roles did for opacity.

`text-success` already works. Seven components use it. What's missing is the
guarantee that it is the right value for text.

## Options

**A. Keep one token per role.** No change. Document which roles are safe for
small text. Cheapest, and the contrast problem stays a rule people have to
remember.

**B. Property tokens through Tailwind's own namespaces.** Tailwind 4 resolves
`text-*` from `--text-color-*` before `--color-*`, `bg-*` from
`--background-color-*`, `border-*` from `--border-color-*`, and `fill-*` and
`stroke-*` from `--fill-*` and `--stroke-*`. Class names stay as they are, and
each property can take its own value. The existing `--color-*` tokens stay as
the fallback, so shadcn parts and stock themes keep working.

The catch: `text-success` and `bg-success` can be different colours. That is
the point, but it has to be documented on the Colours page, or someone will be
surprised.

**C. Prefixed roles in the shared namespace.** `--color-fg-success`,
`--color-bg-success` and so on, as GitHub Primer names them (`fgColor-success`,
`bgColor-success-muted`). It's explicit, but class names read
`text-fg-success` and `bg-bg-success`, and nothing stops `bg-fg-success`.

Chosen: **B**.

## Proposed set

Status roles are the same for success, warning, destructive and info.

| Property   | Tokens                                                                  | Contrast target                            |
| ---------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| Text       | `foreground`, `muted-foreground`, `primary-foreground`, `{status}`      | 4.5:1 on background, card and popover      |
| Background | `background`, `card`, `muted`, `primary`, `{status}`, `{status}-subtle` | None. Text on it carries the bar           |
| Border     | `border`, `input`, `ring`, `{status}`                                   | 3:1 where it marks a control (WCAG 1.4.11) |
| Icon       | `foreground`, `muted-foreground`, `{status}`                            | 3:1 on background                          |

Most of these start as aliases of today's values. The ones that differ are
the status colours for text and icons in each theme, which get checked
against their target instead of sharing one step.

## Work

1. Add the namespaces to `globals.css`, aliasing today's values.
2. Teach `build-registry.mjs` to read and ship them, and extend the smoke test.
3. Tune the status text and icon values and add contrast checks to the unit
   tests, so a theme change can't silently drop under the bar.
4. Update the Colours page, the Theme creator and its Figma export, with
   variable scopes.
5. Move components across one at a time. Nothing breaks in between, since the
   old tokens stay as the fallback.

## Decisions

- **Naming:** option B. Class names don't change; Tailwind's property
  namespaces carry the new tokens.
- **Scope:** status colours first: destructive, success, warning and info,
  each with a text, background, border and icon token. Neutral roles stay on
  one token each until a later pass needs them.
- **Figma:** variable scopes come in a later plan. Until then the new tokens
  are listed as code-only in `figma/drift.config.json`.
- **Contrast is tested.** A unit test renders every status token in both
  themes and fails if text drops under 4.5:1 or an icon or border under 3:1,
  on every surface it is meant to sit on.
