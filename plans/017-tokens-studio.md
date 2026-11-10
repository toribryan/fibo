# 017 Tokens Studio

## What is changing

- `tokens/` holds fibo's design tokens as JSON in the W3C format, synced
  with Figma by Tokens Studio (Pro, multi-file sync). It mirrors the Figma
  library's five variable collections: Primitives, Color (Light and Dark),
  Typography, Spacing and Border.
- `pnpm tokens:build` reads `tokens/` with Style Dictionary and writes the
  `:root` and `.dark` blocks in `globals.css`, between `tokens:start` and
  `tokens:end`. Nobody edits that block by hand, and CI fails if it doesn't
  match `tokens/`.
- A token changes in Figma, through Tokens Studio, and reaches the code as a
  pull request: push from the plugin to a branch, run `pnpm tokens:build`,
  open the pull request.

## Why now

Until now `globals.css` was the source and Figma followed it, with
`pnpm figma:drift` catching the two apart. That catches drift after it
happens. The live library had already drifted: `input` was `neutral/300` in
Figma and `neutral-200` in code. With one source that both sides are built
from, there's nothing to drift, and a token change is a reviewed diff.

Click UI works this way: Tokens Studio pushes JSON to the repo, Style
Dictionary generates the CSS, and its README says never to edit the
generated files or change a token value by hand.

## Options and choices

**Tool.** Tokens Studio Pro, Tokens Studio free, or no plugin, exporting
Figma's own variables to JSON through the Figma MCP. Chosen: Pro. The free
plan syncs one file and has no themes, and fibo needs themes even for light
and dark. Exporting variables without a plugin would be an agent step rather
than a button in Figma.

**What gets generated.** All of `globals.css`, or only the token blocks.
Chosen: only the `:root` and `.dark` blocks, as a marked region. The rest of
the file (Tailwind's `@theme inline` mapping, keyframes, the base layer)
isn't token data. Everything that reads `globals.css` (the registry build,
the Colors docs, the contrast tests, the drift check) keeps working
unchanged.

**References, not values.** Style Dictionary would normally write resolved
hex. fibo's principle is that primitives are Tailwind's palette, untouched,
so the build writes references: `{neutral.900}` becomes
`var(--color-neutral-900)`, and a Figma alpha primitive, named
`alpha/<base>/<percent>`, becomes `color-mix(in oklch, var(--color-<base>)
<percent>%, transparent)`. That naming rule is the same one the drift check
already relies on. A reference to another semantic token, such as
`destructive-text` to `destructive`, stays `var(--destructive)`.

**Primitives.** Kept in `tokens/primitives.json` for Figma, with their hex
values, but never written to CSS: Tailwind provides them, and `burgundy-*`
stays in `globals.css`'s `@theme`. Two were added for code-only shadows,
`alpha/black/30` and `alpha/black/18`.

**Comments.** The comments that explained tokens in `globals.css` moved into
each token's `$description`, and the build writes them back as comments, so
they also show in Tokens Studio.

**Radius.** Figma's Border collection is in pixels; the code derives its
whole radius scale from `--radius`. The build writes `--radius` from
`radius.lg` in rem and nothing else from Border.

**Not generated, yet.** Typography and Spacing mirror Tailwind's scales,
which fibo doesn't redefine, so they sync with Figma but write no CSS. The
Mechanical and Electrical themes keep their hand-written files; moving them
into Tokens Studio themes is a follow-up.

**Scopes.** Tokens Studio can't set Figma variable scopes, so scopes stay
in Figma. Variables the first export creates need theirs set by hand.

**Drift check.** Kept. It still compares component properties with code,
and its token comparison now catches a Figma change that hasn't been pushed.

## First sync

The seed in `tokens/` was written from the live Figma file (names, primitive
values, collection and mode IDs) and the code's values. Some format details
aren't documented by Tokens Studio, so the plugin's first push settles them:

1. Decide `input`: the seed has the code's `neutral/200` and
   `alpha/white/15`; Figma had `neutral/300` and `alpha/white/20`. Whatever
   the seed says is what Figma gets on export.
2. In Tokens Studio (Pro), add GitHub sync: repo `toribryan/fibo`, this
   branch, folder `tokens`, W3C DTCG format. Pull.
3. Export themes to Figma variables, with "Remove Styles and Variables
   without connection" off. It updates variables with the same name; check
   the counts: Primitives gains 2, Color gains 6 (four edge colors, two
   shadows) plus `edge-depth`, and nothing is duplicated. Set scopes on the
   new ones.
4. Push from the plugin. It rewrites `tokens/` in its own format, with the
   Figma references filled in. Run `pnpm tokens:build`; if the format
   differs from the seed, the build script adapts in this pull request.
