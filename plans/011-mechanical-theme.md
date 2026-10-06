# 011 Mechanical theme

## What is changing

fibo gets its first experimental theme, Mechanical: a warm, tactile look
where raised controls sit on a solid bottom edge and press down onto it, like
keys. It has a warm off-white page, white fields and cards, near-black text,
warm grey hairlines, small radii, semibold labels and an amber primary, in
light and dark. Icons in nav-like lists can carry their own colour.

It ships three ways:

- A stylesheet, `packages/ui/src/styles/themes/mechanical.css`, with every
  rule scoped to `[data-theme="mechanical"]`.
- A switch in Storybook's toolbar, fibo or Mechanical, beside light and dark.
- A registry item, `@fibo/theme-mechanical`.

Five edge tokens join `globals.css`, all zero or transparent in fibo's own
look: `--edge-depth`, `--primary-edge`, `--secondary-edge`, `--outline-edge`
and `--destructive-edge`. Button gains `data-variant` and `data-size`
attributes. Nothing else in a component changes.

## Why now

fibo is achromatic on purpose, and every part reads semantic tokens only. The
claim behind that is that a theme is a set of token values, but nothing has
tested it since the Theme creator (plan 001) was archived. A theme with a
strong, specific look shows where tokens are enough and where they aren't,
and gives experimental projects a second look to start from.

## Options and choices

**How far a theme reaches.**

- _Tokens only._ Colours, radius and font. Cheap, and it proves the token
  layer, but it can't draw the edge or change a label's weight, and the edge
  is what makes the look.
- _Tokens plus edges._ Token overrides, plus a small set of rules that change
  a part's shape: its edge, press, radius and weight. Parts are found by the
  data attributes they already carry.
- _Component variants._ A `mechanical` variant on Button, Tabs and the rest.
  Every theme would then be a change to every part, its stories, its Figma
  component and the drift check.

Chosen: tokens plus edges. The edge is drawn from five new tokens, so the
rules read the theme's values instead of hard-coding them, and fibo's own
zero values keep its look flat.

**Where the edge rules live.** In the components, gated on the tokens, or in
the theme's stylesheet. Rules in the components would run in fibo's own look
too, and a `box-shadow` there replaces the focus ring the classes draw.
Chosen: the theme's stylesheet. Its rules are outside any cascade layer, so
they beat Tailwind's utilities without `!important`, and they compose the
edge with Tailwind's ring variables so focus and invalid rings still show.

**What the rules key on.** `data-slot` was the first choice, but Pagination,
Date picker, Data table, Command menu and others rename the Buttons they
render (`data-slot="pagination-next"`). So Button now carries `data-variant`
and `data-size`, and the rules match a `button` or `a` with both. Map pin is
the one other button with both and is excluded by its slot. The other
targets keep their slots: `select-trigger`, the date picker triggers
(`date-picker`, `date-range-picker`), `tabs-list` with `data-variant`,
`tabs-indicator`, `kbd`, `badge`, `label` and `field-label`.

**How it is applied.** A class, a Storybook global, or a `data-theme`
attribute. Chosen: the attribute, on `<html>` for an app or on any element
for one region, since `@theme inline` reads tokens wherever they are set.
Dark mode stays on the `dark` class; the theme's dark block matches
`.dark[data-theme]` and `.dark [data-theme]`. Portalled popups render on the
body, so a scoped region's menus take the page's theme; set it on `<html>`
to theme those too.

**Storybook only, or the registry too.** Chosen: both. The registry item is
a `registry:theme` with the stylesheet's rules in `css`, not `cssVars`,
because cssVars always writes `:root` and `.dark` and would replace the app's
own look on install. shadcn writes the rules unlayered, as in the source. The
build reads the file, so the theme file stays flat, with no nesting. The
font is named, not loaded: Storybook loads IBM Plex Sans from Google Fonts,
and the docs tell an app to do the same.

**The Storybook switch.** A Storybook global re-renders every docs page under
a new key, which is why light and dark are an event (`theme-sync.ts`). The
design theme travels the same way: the toolbar emits it, the preview sets
`data-theme` on `<html>`, and both read the saved choice from local storage.
The switch is a plain React 18 control in the manager, like light and dark,
so the separate manager-ui bundle isn't involved. The manager's own chrome
stays in fibo's look.

**Colour icons.** Menu already muted only icons without a `text-` class.
Command menu, Filter menu and Floating nav set the muted colour on a wrapper,
and a colour class on the icon itself wins over that, so all four already
keep a caller's colour. Stories and tests now pin that down. The chart
tokens are greys in fibo; Mechanical saturates them (blue, green, purple,
amber, red) so `text-chart-1` to `text-chart-5` read as icon colours, each
at 3:1 or better on the page, menus and their highlight.

## Values

Literal colours rather than Tailwind's ramps: none of the ramps has this warm
grey or amber, and the registry ships the file to apps that may not have them.

| Token                       | Light                  | Dark                   |
| --------------------------- | ---------------------- | ---------------------- |
| `background`                | `#eeefe9`              | `#171814`              |
| `card`, `popover`           | `#ffffff`              | `#1f201b`, `#22231e`   |
| `foreground`                | `#151512`              | `#edede6`              |
| `muted`                     | `#e4e5dd`              | `#282923`              |
| `muted-foreground`          | `#5c5e55`              | `#a2a398`              |
| `primary`                   | `#f1a82c`              | `#f1a82c`              |
| `primary-foreground`        | `#151512`              | `#151512`              |
| `secondary`                 | `#e4e5dd`              | `#33342d`              |
| `border`, `input`           | `#d0d1c9`, `#c6c7be`   | `#36372f`, `#47483f`   |
| `input-subtle` (field face) | `#ffffff`              | `#1f201b`              |
| `ring-subtle`               | `#b6b7af` at 55%       | `#8c8e84` at 40%       |
| `edge-depth`                | `3px` (2px xs, sm)     | same                   |
| `primary-edge`              | `#b17816`              | `#8a5b0c`              |
| `secondary-edge`            | `#a8a99f`              | `#0b0c09`              |
| `outline-edge`              | `#b6b7af`              | `#0b0c09`              |
| `destructive-edge`          | destructive, 45% white | destructive, 35% black |
| `radius`                    | `0.625rem`             | same                   |

fibo's status text sits on the 700 step, which drops under 4.5:1 for success
and warning on the warm page, so Mechanical points `--success-text` and
`--warning-text` at the 800 step (plan 003's property tokens doing their
job). Fills, borders and icons keep 700. A unit test checks every text,
label and icon pair in both modes.

Amber is a fill, too light for text, so a link button is ink with an amber
underline. The theme keeps one property of its own, `--key-face`, for the
selected tab: white (`card`) in light, `secondary` in dark, where a white key
would glare. Setting it in the two token blocks also avoids a mode-specific
selector, which in testing nudged the anti-aliasing of fibo's own tab pill.

## A future theme

1. Copy `mechanical.css` and rename the attribute.
2. Override semantic tokens only, and give the dark block every token the
   light block sets that `.dark` also sets, or light values leak into dark.
3. Add shape rules only where a token can't say it, keyed on data
   attributes the parts already carry. Add a `data-*` attribute to a part if
   one is missing rather than a theme variant.
4. Keep rules flat and unlayered; compose any `box-shadow` with Tailwind's
   ring variables.
5. Add the name to `THEMES` in `build-registry.mjs` and `DESIGN_THEMES` in
   `theme-sync.ts`, and a contrast test beside the stylesheet.

## Not in scope

- Figma. The edge tokens are code-only in `figma/drift.config.json` until
  the library has a Mechanical mode.
- The Colors page still documents fibo's values.
- Chromatic snapshots only fibo's look; Mechanical is checked by its
  contrast test and by eye.
