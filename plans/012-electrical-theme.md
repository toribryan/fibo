# 012 Electrical theme and the theme menu

## What is changing

fibo gets a second experimental theme, Electrical, and Storybook's design theme
moves from a toolbar switch to a menu in the sidebar.

- `packages/ui/src/styles/themes/electrical.css`, scoped to `[data-theme="electrical"]`,
  and the registry item `@fibo/theme-electrical`.
- A palette button beside the sidebar's search, where Storybook's
  create-story button sat, opens a menu of fibo, Mechanical and Electrical. The
  toolbar keeps light and dark.
- Every theme rule stops at a nested region in a different theme.

## Why now

Mechanical (plan 011) proved a theme can reshape parts through tokens and a
few rules keyed on data attributes. A second, opposite theme checks that the
recipe in plan 011 holds up, and that two themes can sit on one page. A
third option no longer fits a toolbar of text buttons.

## Options and choices

**What Electrical looks like.** The brief was a sage palette with the patterns of
modern fintech marketing: flat surfaces, ink buttons, crisp corners, tight
type, tabular figures and one bright highlight. Chosen: a sage page, white
cards, an ink primary with a white label, 4px corners on controls and Inter
Tight. A yellow `--highlight` marks what is selected: the active segment of a
tab list, the active reaction (through `--primary-subtle`), a link's
underline drawn like a highlighter and selected text. Controls stay flat; the
edge tokens keep fibo's zero values. In dark mode ink can't be a fill, so the
yellow becomes the primary, under an ink label. Chart tokens stay fibo's
greys: icons in Electrical are monochrome.

**Icons.** Lucide icons carry the `lucide` class, so one rule restyles every
icon in every part. Options: thinner technical lines, heavier signage
strokes, tiles behind icons in nav lists, or the highlight behind the active
item's icon. Chosen: technical lines, a 1.25 stroke with square caps and
mitred joins. The stroke is `non-scaling-stroke`, so it is 1.25 screen
pixels whatever the icon's size; a scaling 1.25 stroke would draw a 12px icon
at 0.6px.

`--highlight` and `--highlight-foreground` belong to the theme, like
Mechanical's `--key-face`, and aren't in `globals.css`. Only Electrical's own rules
read them.

**Where the menu lives.** In the toolbar, or in the sidebar. Chosen: the
sidebar, in place of the create-story button, which only works in dev and
did nothing on the built site. It is fibo's own Button and Menu, so it runs
in the React 19 manager-ui bundle beside the command search, and reaches the
preview through `window.__FIBO_MANAGER__`. manager.tsx holds the choice,
saves it, and answers the preview's request on load, as before. Each item
shows a swatch drawn by the theme itself, so it can't drift from the
stylesheet.

**Nested themes.** The Themes page shows each theme in a column with its own
`data-theme`, inside a page in whichever theme is picked. Tokens already stop
at the nearest region; rules didn't, so Electrical's highlighted tab showed up in the
Mechanical column. Options: CSS `@scope` with a lower bound, or a `:not()`
guard on every rule. `@scope` nests, and the registry ships flat rules.
Chosen: the guard, `:not([data-theme="electrical"] [data-theme]:not([data-theme="electrical"]) *)`,
which excludes an element inside a different theme's region within this
one. It is verbose, so each stylesheet explains it once.

**The contrast test.** `themes.test.ts` replaces `mechanical.test.ts` and
runs the same checks for every theme, in both modes. Coloured chart icons are
checked only where the theme promises them; Electrical adds ink on its highlight.

Mechanical's primary also takes a white label in this change: the
terracotta darkens to `#bc5530`, and its hover darkens rather than lightens.

## Not in scope

- Figma has neither theme.
- Chromatic snapshots only fibo's look.
- The manager's own chrome stays in fibo's look whatever the theme.
