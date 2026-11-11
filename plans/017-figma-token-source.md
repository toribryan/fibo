# 017 Figma as the token source

## What is changing

- Figma's Color collection is the source of fibo's color tokens. The
  `:root` and `.dark` blocks in `globals.css`, between `tokens:start` and
  `tokens:end`, are written from `figma/snapshot.json` by
  `pnpm tokens:build`, and never edited by hand. CI fails if they don't
  match the snapshot.
- A token change is: change the variable in Figma, refresh the snapshot
  with the `figma-drift` skill, run `pnpm tokens:build`, open a pull
  request. The `globals.css` diff is the change.
- Each variable's Figma description becomes its comment in `globals.css`.

## Why now

`globals.css` was the source and Figma followed it, with the drift check
catching the two apart after the fact. The live library had drifted:
`input` was `neutral/300` and white at 20% in Figma, one step darker than
the code. Tokens are designed in Figma, so that is where they should
change, with the code following and a diff to review.

## Options and choices

**Source.** Keep `globals.css`; Figma Variables read through the Figma MCP;
JSON in the repo with Style Dictionary, pushed to Figma; a community export
plugin; or Tokens Studio. Chosen: Figma Variables through the MCP. The
figma-drift skill already reads every variable into the snapshot, and the
drift check already knows how a Figma alias maps to CSS, so this turns the
comparison into a writer. Tokens Studio was tried (closed pull request
#177) and dropped: themes need a paid seat, and syncing is a manual push
from the plugin either way. Figma's variables REST API would sync without
an agent, but needs an Enterprise plan.

**What gets written.** Only the two token blocks, as a marked region. The
rest of `globals.css` (the `@theme inline` mapping, keyframes, the base
layer) isn't token data, and everything that reads the file keeps working.

**References, not values.** A ramp step becomes `var(--color-<ramp>-<step>)`,
an alpha primitive named `alpha/<base>/<percent>` becomes
`color-mix(in oklch, var(--color-<base>) <percent>%, transparent)`, and an
alias to another Color variable becomes `var(--<name>)`. The code keeps
Tailwind's palette, and the drift check reads the same names back.

**Order and comments.** The build keeps the block's existing order and adds
new variables at the end, so a sync shows only what changed. Comments come
from variable descriptions. Where a variable already had a description in
Figma it won; four longer code comments were copied into Figma as
descriptions for variables that had none.

**Making Figma complete.** Seven tokens existed only in code: `edge-depth`,
the four edge colors and the two shadows. They were added to Figma's Color
collection (with `alpha/black/30` and `alpha/black/18` in Primitives), so
nothing is code-only and `codeOnlyTokens` in the drift config is empty.
`edge-depth` is a number variable, written in px.

**Radius.** Figma's Border collection is in pixels; the code derives its
radius scale from `--radius`, so the build writes `--radius` from
`radius/lg` in rem.

**Not covered.** The Mechanical and Electrical themes keep their
hand-written files; they have no Figma variables yet. Typography and
Spacing are Tailwind's scales and write no CSS.
