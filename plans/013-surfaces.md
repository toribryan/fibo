# 013 Surfaces, and a layout per theme in Storybook

## What is changing

- Two tokens, `--surface` and `--surface-foreground`: the layer panels,
  sidebars and content columns sit on, one step off `--background`. fibo's
  light page becomes `neutral-50` under a white surface; dark keeps
  `neutral-950` under a `neutral-900` surface. Mechanical and Electrical set
  their own.
- `data-surface` on an element makes it a surface panel and points
  `--background` at the surface inside it.
- Storybook's chrome takes a layout per theme, after shadcn's sidebar blocks:
  fibo floats the sidebar as a card (sidebar-04), Mechanical insets the page
  in a panel beside the sidebar (sidebar-08), Electrical keeps the sidebar
  flat beside the page.

## Why now

With the page and every panel one color, the themes read flat: nothing
separates the sidebar, the page and the content on it. A surface step gives
layouts depth without shadows or borders on every edge.

## Options and choices

**How many steps.** A single surface, or a sunken, base and raised scale.
Chosen: one, `surface`, above `background`, with cards and popovers above
that as before. Every new step is a token to keep in step in Figma and in
each theme.

**Which way the step goes.** Chosen: the page is the tint and the surface is
lighter in light mode and lighter in dark mode, as cards already are.

**Parts that match what they sit on.** A sticky table header, a switch's
thumb, Sheet and Tabs' indicator use `bg-background` to blend with the page.
On a surface they would show as a band. Options: give each part a surface
variant, or re-point the token. Chosen: `data-surface` sets `--background`
to `--surface` inside it, so those parts match whichever plane they are on
with no change to them. A surface inside another, such as a panel on
Mechanical's inset page, steps up to the card color so it still reads
apart.

**Status text on the tinted page.** At 700, success and warning text on its
own 6% tint drops just under 4.5:1 on `neutral-50`. Thinner tints were too
faint, so in light mode `--success-text` and `--warning-text` point at the
800 step, as the themes already do. Fills, borders and icons keep 700.

**The Storybook layouts.** A Sidebar component was considered and left for
later. The layouts are CSS on Storybook's own chrome in
`manager-head.html`, keyed on the manager's `data-theme`, and desktop only;
phones keep Storybook's sheet. Mechanical's inset page is a surface, so the
preview sets `data-surface` on its body for the themes in `INSET_THEMES`.
Storybook reads `manager-head.html` only when it starts, so a change to it
needs a restart.

## Not in scope

- Figma's Color collection doesn't have `surface` yet; it is listed in
  `codeOnlyTokens` until the library's frames are rebuilt on surfaces.
- A fibo Sidebar component.
