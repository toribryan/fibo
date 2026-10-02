# Theme creator

The Foundations page that built a theme from a few choices: grey tint,
radius, an accent, status hues and fonts, with a live contrast report and
CSS, Figma and link exports. Plan 001 records how it was designed and why it
was archived.

## What was unhooked

Restoring it means moving these files back and redoing each of these:

- `apps/storybook/.storybook/preview.tsx`: add `"Theme creator"` back after
  `"Typography"` in the Foundations sidebar order.
- `apps/storybook/.storybook/manager.tsx`: map
  `"foundations-theme-creator--docs"` to `HexagonIcon` from `lucide-react`.
- `apps/storybook/.storybook/manager-head.html`: drop the rewrite that sends
  its old links to Colors.
- `apps/storybook/src/docs.css`: the page ran full width with no rail or
  title, through `.sbdocs.sbdocs-wrapper:has(.fibo-studio)` rules that hid
  `.sbdocs-toc--custom`, set `padding: 1rem` and removed the content's
  `max-width`.
- `apps/storybook/src/pages/getting-started.mdx`: step 4, "Make it look like fibo",
  linked to it after the paragraph on editing `globals.css`.

## Known drift

The generator in `packages/ui/src/lib/theme.ts` writes every token in
`globals.css`. Tokens added after it was archived are missing from its output,
so check its `tokens()` against `globals.css` before shipping it again. The
property tokens of plan 003 are one example.
