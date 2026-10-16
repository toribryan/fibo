# 014 Page templates, starting with Sitemap

The Templates shelf proposed here was replaced by the Blocks shelf in
`015-blocks.md` before it shipped, and Sitemap became a block. The choices
about Sitemap itself, from parts to container queries and folding groups,
stand.

## What is changing

- A third shelf, **Templates**, titled `Templates/<Name>`, for whole pages
  composed from fibo parts. Its tier is `templates` in
  `components.meta.json`, its group `Pages`. It sits after Special
  components in the sidebar, the Catalog page, the Catalog tabs and
  `llms.txt`.
- The first template is **Sitemap**: a human-readable directory with a
  location search, popular picks, and destinations grouped by job.

## Why now

Sitemap is a concept for a client site, sketched as low-fi wireframes. Building
it in fibo first tries the layout, the responsive steps and the search
behavior on real parts, with both themes and the axe checks, before it goes
into that codebase.

## Options and choices

**Where a page lives.** As a Special component, as a Storybook-only example,
or on its own shelf. Chosen: its own shelf. A page is not a playful part, and
an example that doesn't install can't be tried in the client app.

**One component or parts.** A single `<Sitemap sections={...} />` driven by
data, or compound parts. Chosen: parts, like Empty state and Chat composer.
Each site's groups differ, links need its router's `Link` through `render`,
and the search has to defer to whatever search the site already has.

**Breakpoints.** Viewport media queries, or container queries on the root.
Chosen: container queries. The template lays out by its own width, so it
reads the same full-page, in a docs canvas and in a narrow preview.

**Long location lists.** Show every city, or fold each state. Chosen: both,
through `collapsible` on a group. The toggle is a separate button from the
state's link, so the state page stays one click away.

**Registry type.** `registry:ui` like every other part, rather than
`registry:block`, so imports rewrite the same way and Install works
unchanged. Templates follow the base dependency rule; what they add comes
from the parts they import.

## Not in scope

- A Figma frame for the template.
- Live search suggestions. `SitemapSearch` submits a query; an app with an
  autocomplete swaps the input through Input group's `render`.
