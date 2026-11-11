# 016 Docs site

## What is changing

- A second site, `apps/docs`, for what fibo is and how to use it:
  principles, foundations, getting started, and each part's purpose,
  guidelines, do's and don'ts and accessibility notes.
- Storybook becomes the reference: every story, the controls, the props
  table and data attributes. It moves from the root of fibo.toribryan.com to
  `/storybook`.
- The registry (`/r/<name>.json`), `/codemods` and `/llms.txt` keep their
  URLs.

## Why now

Storybook does two jobs and is good at one. Its docs pages hold the
guidance a designer or hiring manager reads, but they open in a tool built
for poking at props, with an addon sidebar, an iframe and `?path=` URLs. The
guidance is most of each page (guidelines, do's and don'ts, an
accessibility section on all 55 component pages), and it reads like an
appendix there.

Click UI splits it the same way: clickhouse.design is "the canonical
documentation", covering principles, tokens, intent and usage, and its
Storybook calls itself "a reference for inspecting components and their
props".

## Options and choices

**Framework.** Fumadocs on Next.js, Astro Starlight, or a plain Next.js app.
Chosen: Fumadocs. It shares React 19 and Tailwind 4 with fibo, so a page
renders real fibo parts on fibo tokens with no wrapper, and it brings MDX,
navigation, search and a table of contents. Starlight would run every part
as an island and fight its own theme. A plain app means building search and
navigation.

**Static output.** The site stays static, as `AGENTS.md` requires: Next's
`output: "export"`, with Fumadocs' search index built at export time. No
route needs a server.

**URLs.** Docs at the root, Storybook at `/storybook`. Or docs on a
subdomain and Storybook left in place. Chosen: docs at the root, so the first
thing anyone sees is the guidance. The cost is old Storybook links, which
are `/?path=...` and so differ only in the query string. A redirect in
`vercel.json` matches `/` with a `path` query and sends it to
`/storybook/?path=...`, so every existing link keeps working.

**What lives where.** For a component:

| Section                        | Docs site | Storybook  |
| ------------------------------ | --------- | ---------- |
| Intro, features, installation  | Yes       | Intro only |
| Usage, anatomy, guidelines     | Yes       |            |
| Do's and don'ts                | Yes       |            |
| Accessibility                  | Yes       |            |
| Examples                       | A few     | All        |
| API reference, data attributes | Linked    | Yes        |

Each docs page ends with a link to its Storybook page, and each Storybook
page opens with a link back.

**Content source.** MDX in `apps/docs/content/docs/`. The Storybook docs
blocks that only render props (`Install`, `UsageGuidelines`,
`ComponentRules`, `Tip`, `DataAttributes`) move to a shared place both apps
import, so a guideline is written once. Blocks that depend on Storybook
(`Canvas`, `ArgTypes`, `DocLink`) stay in Storybook.

**Changelog.** The docs site renders `CHANGELOG.md` plus the pending
`changes/*.md` files, and the Storybook changelog page goes.

**Agents.** `llms.txt` links move to the docs site pages, which are plain
MDX and read better as text than Storybook's iframe.

## Phases

1. **Scaffold.** `apps/docs` with Fumadocs, fibo's `globals.css`, the
   introduction and getting started pages, and Button as the model
   component page. Built in CI, not deployed. Storybook stays at the root.
2. **Foundations and shared blocks.** Move the docs blocks to a shared
   package, port Colors, Typography, Spacing, Elevation, Motion,
   Accessibility and Themes.
3. **Components.** Port every component and block page's guidance. The
   `add-component` skill writes the docs page in `apps/docs` from here on.
   Blocks import their own files with `.js`, which the docs site's bundler
   can't resolve, so a block page shows its Storybook story in an iframe
   (`BlockFrame`), passing the page's theme as `?theme=`.
4. **Cutover.** `build:site` puts the docs at the root and Storybook under
   `/storybook`, with the `?path=` redirect. README, `llms.txt` and the
   Figma library's resource links point at the docs site.
5. **Trim Storybook.** Remove the guidance sections from Storybook pages,
   leaving intro, examples and API reference, plus the link to the docs
   page.

Until phase 4, the Storybook pages stay the published docs and keep
changing; a phase 3 port copies the latest version.
