# 015 Blocks

## What is changing

- A third shelf, **Blocks**, titled `Blocks/<Name>`, for whole screens
  composed from fibo parts. Its tier is `blocks` in `components.meta.json`.
  It replaces the Templates shelf proposed in
  `plans/014-page-templates.md`, and Sitemap moves onto it as the first
  block.
- Blocks are published as `registry:block` items, the type shadcn uses for
  its own login, sidebar and dashboard blocks.
- **App shell** is the first block, and ships with the shelf. Sitemap and
  **Settings page** follow.

## Why now

The parts are documented one at a time, and nothing shows them holding up
together on a real screen: shared spacing, focus moving between parts, a
command menu over a nav over a form. Blocks are where a system proves its
parts compose, and they're what most people install a registry for.

## Options and choices

**Templates or blocks.** Keep 014's Templates shelf of page-level parts with
a props API beside a separate Blocks shelf, or one shelf. Chosen: one shelf,
named Blocks. Two shelves for "a whole screen" would need explaining every
time, and Blocks is the word shadcn users already know.

**Registry type.** `registry:ui` like every part, or `registry:block`.
Chosen: `registry:block`. A block is installed once and then edited; it has
no API to keep stable. The type tells the shadcn CLI and the docs that, and
it's what lets a block ship several files.

**Where the files land.** shadcn's own blocks ship a `registry:page` with an
`app/<route>/page.tsx` target, which only works in Next.js. Or ship the
screen as components and let the app mount it. Chosen: components, each with
an explicit `target` under `components/blocks/<name>/`. One `<SettingsPage />`
then works in Next, Vite or anything else, and a block never overwrites a
route someone already has.

**Source layout.** One folder per block:
`packages/ui/src/blocks/<name>/` holding the root component in `<name>.tsx`,
the block's own parts, `data.ts`, and `<name>.stories.tsx`. The block's
files import each other by relative path with a `.js` extension, which
`packages/ui` needs; the registry copy drops the extension for an app's
bundler. The docs page
sits in `apps/storybook/src/components/` beside the parts' pages. The
existing `apps/storybook/src/blocks/` folder holds docs building blocks and
keeps that name.

**Dependencies.** A block may use any fibo part, base or special, and they
come in as `registryDependencies`. It adds no npm dependency of its own
beyond what its parts bring.

**Data.** Placeholder content lives in the block's `data.ts`, typed, so
replacing it with real data is one file. Blocks hold their own state
locally and never fetch.

**Layout.** Container queries on the block's root, as 014 chose for Sitemap,
so a block lays out by its own width in a page, a docs canvas or a preview.

**Docs.** A block's page opens on a full-width preview in `ScaledStage`
with phone, tablet and desktop widths, then the install command, the parts
it uses (from its registry dependencies, each linked), the files it adds,
and what to replace first.

**Testing.** The same story tests as parts: every story renders in Chromium
and fails on an axe violation. Each block has a `play` function on its
`Default` story that walks its main path by keyboard. The install smoke
test covers blocks with no change, since it installs every registry item.

**Versioning.** A block's files belong to the app once installed, so a
change to a block is never breaking under `CONTRIBUTING.md`. It ships in a
minor and is listed under Changed. A change to a part a block uses follows
the part's rules.

## The first blocks

**App shell.** A header with Command menu on Cmd+K, pages for home,
projects and an inbox, and Floating nav between them. Every command changes
real state: New project adds a row, Open project is a nested page, Mark all
as read empties the inbox. It shows fibo's special parts doing a real job.

**Sitemap.** Moves from #154 as it is, with its parts as the block's own
files.

**Settings page.** Tabs for Profile, Notifications and Account, made from
Field, Input, Textarea, Select, Switch, Radio group and Avatar. A save bar
appears when a field changes, Toast confirms the save, and a danger zone
deletes the account behind a confirmation. That confirmation needs an
**Alert dialog**, which fibo doesn't have, so Alert dialog ships first as a
base part in Overlays, with Dialog alongside since they share a primitive.

## Order of work

1. Build support for the `blocks` tier and `registry:block` items, with App
   shell as the first block to prove it.
2. Move Sitemap onto the shelf in #154.
3. Dialog and Alert dialog, as base parts.
4. Settings page.

## Not in scope

- Figma frames for blocks. Blocks are built from library instances, so a
  Figma page can follow once the code settles.
- `registry:page` targets for Next.js routes. A thin page that renders the
  block is one line to write.
