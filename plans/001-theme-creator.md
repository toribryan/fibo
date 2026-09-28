# 001 Theme creator

## What is changing

A Theme creator page in the Storybook sidebar, beside Colour and Typography.
Controls on one side, real fibo components previewed live in light and dark on
the other, a live contrast report, and three ways out: CSS to paste, Figma
variables JSON, and a link that reopens the theme.

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
