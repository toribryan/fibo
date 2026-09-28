# 001 Theme creator

## What is changing

A Theme creator page in the Storybook sidebar, beside Colour and Typography.
It is visual first, after shadcn's theme builder and Radix's colour page: a
narrow rail of settings beside a large scene of real fibo parts that takes the
theme on as it changes. It also has a live contrast report and three ways
out: CSS to paste, Figma variables JSON, and a link that reopens the theme.

## Why now

The component set is big enough to show a theme off, and every part already
reads semantic tokens only. A theme is one set of token values, so a creator is
mostly a way to produce that set and see it applied.

## Options and choices

**Where it lives.** A registry component, a Storybook page, or both. Chosen: a
page. The site is static, so everything runs in the browser.

**What can change.**

- Neutral ramp: Tailwind's neutral, stone, zinc, slate or gray, or a custom
  tint (a hue and an amount). Custom tints reuse neutral's lightness and
  slate's chroma curve, scaled by the amount, so they stay greys.
- Radius: the one `--radius` knob, 0 to 20px in whole pixels, so every step
  still lands on a whole pixel.
- Brand accent: off by default, since fibo has no brand hue. When on, primary
  takes the hue at a lightness that holds white text in light mode and dark
  text in dark mode.
- Status hues for destructive, success, warning and info. Each keeps the
  lightness and chroma of the Tailwind step fibo uses today (700 light, 400
  dark), and only its hue changes. Some hues at that chroma fall outside
  sRGB, as some of Tailwind's own colours do. The CSS keeps them and lets the
  browser map them, while contrast checks and Figma hex values fit them into
  sRGB first, the way an sRGB screen shows them.
- Fonts: sans and mono from a short list of Google Fonts, loaded on demand.

**Layout.** A first version stacked form controls above a small preview,
which read as a settings page. A second led with the result, after shadcn's
theme builder and Radix's colour page: a dark floating rail of setting
tiles beside a scene of generic example cards. A third moved the settings
into a toolbar across the top, which crowded the settings into one line. The
shipped layout keeps the result first but speaks fibo's own language:

- A light panel docks beside the stage on a card surface with hairlines and
  pill controls, the way fibo's own parts look, and stays in view while the
  stage scrolls. It holds the title and reset, the light and dark switch,
  one pill per setting, each showing a small picture of its value and
  opening its control beside the panel, and at its foot the contrast count,
  Shuffle, Copy link and Get code. The panel stays in the site's theme and
  never takes on the one being made.
- The scene is a stage of real fibo parts, each labelled with its name and
  shelf as the catalog labels it: the ramps, type, Button, Badge and Kbd,
  the form controls, Filter menu, Integration visual, Reactions, Chapter
  scrubber, Pixel snail with Progress and Skeleton, Avatar, and Token flow.
  Toast raises into a portal outside the stage, so its look is drawn with
  the same tokens instead.
- The contrast report and the code export open in dialogs.

The page drops the docs column's width and its "On this page" rail, as the
Welcome page does.

**How the preview works.** The semantic tokens are CSS custom properties read
through `@theme inline`, so setting them on a container restyles everything
inside it. The preview renders in-flow parts only; portalled popups would
render outside the container and miss the theme.

**Output.**

- CSS: `:root` and `.dark` blocks with literal `oklch()` values, to paste over
  the semantic blocks in `globals.css`. Alpha roles such as `-subtle` are
  written as `oklch(L C H / a)`, which is what
  `color-mix(in oklch, X a, transparent)` resolves to.
- Figma: W3C design tokens JSON with a Light and a Dark mode, one colour token
  per semantic role in hex with alpha, plus the radius steps. It imports with
  Figma's variables import and export plugin.
- Link: the theme's settings, compacted into the page URL.

A shadcn registry theme was considered and left out, because a static site
can't build one per visitor.

**Contrast.** Every pair the system relies on is checked against WCAG AA as you
edit: 4.5:1 for text, 3:1 for a primary fill against the page. Alpha roles are
composited over their surface first. A failure shows in the report and beside
the control that caused it.

**Where the code goes.** Colour maths and theme generation are pure functions
in `packages/ui/src/lib/`, where unit tests already run. The page and its
controls live in the Storybook app. The generator is not a registry item.
