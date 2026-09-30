# Brand

The source for fibo's brand kit: the rabbit, the logo, the social cards,
the posters and the motion prototype. The published kit lives at
[claude.ai/artifact/T3wZRs4isBzgb4ruYM2Fkz](https://claude.ai/artifact/T3wZRs4isBzgb4ruYM2Fkz).

## What's here

| File                              | Holds                                                                     |
| --------------------------------- | ------------------------------------------------------------------------- |
| `rabbit.js`                       | fibo, 20 × 20 pixels. The one source for every drawing of him here        |
| `rabbit.mjs`                      | The same grid for Node, with the dark-ground inverse and an SVG writer    |
| `logo.js`, `logo.html`            | The logo: the rabbit on the baseline of "fibo" in Geist Medium            |
| `cards.mjs`                       | The ten launch cards, the avatar and the banner, as HTML                  |
| `tensions.html`                   | The six tension cards, each split on the golden section                   |
| `window.html`                     | The golden window poster                                                  |
| `mosaic-lib.js`, `texture-lib.js` | Photo sampling, pixel texture, dither and grain for the canvas pages      |
| `motion/index.html`               | The interactive prototype of the rabbit's animations                      |
| `kit/index.html`                  | The brand kit page. Copy `out/` to `kit/img/` to see it with its images   |
| `render.mjs`                      | Renders every image into `out/`                                           |
| `fonts/`                          | Geist and Geist Mono, bundled under the SIL Open Font License (`OFL.txt`) |

The Welcome page draws the rabbit from its own copy of the grid in
`apps/storybook/src/blocks/pixel-rabbit.tsx`. Change both together.

## Rendering

```
pnpm install
pnpm --filter storybook exec playwright install chromium
node brand/render.mjs
```

Set `CHROMIUM_PATH` to render with a Chromium of your own instead.

Images land in `brand/out/`, which git ignores. Pages that need
photographs are skipped until the photos are in `brand/photos/`.

## Rules

- There is no brand hue. Colour only comes from photographs.
- The rabbit is one colour, crisp pixels, scaled by whole numbers. On dark
  grounds he turns solid with his inner lines cut in.
- Type is Geist, Geist Mono for small labels and commands. No other faces.
- Sizes on cards follow the Fibonacci sequence, and layouts cut on 0.618.
- No drawn spirals. Spirals only appear in photographs.
