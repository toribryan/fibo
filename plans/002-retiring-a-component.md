# 002 Retiring a component

## What is changing

fibo gets a way to retire a part: a `deprecated` entry in
`components.meta.json`, a banner on the docs page, a red pill in the sidebar
and catalog, a notice the shadcn CLI prints on install, a line in `llms.txt`,
and a codemod served from the site. Spinner is the first part through it,
replaced by an indeterminate Progress.

## Why now

Registry parts are copied into projects as source, so fibo cannot change a
part under anyone. Removing one from the registry only stops new installs;
projects that have it keep it and stop getting fixes without hearing why.
Retiring a part has to tell people where they will see it, and make the move
cheap enough that they make it.

Spinner ships already deprecated. It was never part of a release, and is
here to show the path end to end on a part nobody depends on yet.

## Options and choices

**Where the decision lives.** In each surface separately, or in one place
they all read. Chosen: one `deprecated` object per part in
`components.meta.json`, beside `status: "deprecated"`:

```json
"deprecated": {
  "since": "0.2.0",
  "removal": "0.3.0",
  "replacement": "progress",
  "reason": "Why, in a sentence or two.",
  "codemod": "spinner-to-progress"
}
```

The registry build, the catalog and the docs banner read it. The build fails
if `replacement` names a part that doesn't exist.

**How long a part stays.** Until the next minor release after the one that
deprecates it. fibo is pre-1.0 and small; a longer window keeps two ways of
doing one thing alive for little gain. A deprecated part still installs and
still gets fixes until it is removed.

**What people see.**

| Where               | What                                                      |
| ------------------- | --------------------------------------------------------- |
| Sidebar and catalog | A red `deprecated` pill; the part sorts last in its group |
| Docs page           | A banner with the replacement, reason and codemod command |
| `shadcn add`        | The registry item's `docs` text, printed after install    |
| `llms.txt`          | "Deprecated: use `@fibo/<replacement>` in new code"       |
| Editor              | `@deprecated` JSDoc, so the import shows struck through   |

A runtime `console.warn` was considered and left out: it would ship in
consumers' production builds, where fibo has no way to know it's a dev build.

**Migration.** A written guide, a codemod, or both. Chosen: both. The docs
page lists what changes; a jscodeshift transform in
`apps/registry/codemods/` does it. The build copies it to
`/codemods/<name>.js` on the site, so anyone runs it by URL with
`pnpm dlx jscodeshift --parser tsx -t <url> src` and installs nothing from
fibo. A codemod rewrites what it can prove is safe and reports the rest with
file and line, rather than guessing.

**Removal.** Delete the source, stories, docs page and metadata entry, leave
a line in the changelog, and keep the codemod on the site so late movers can
still run it.
