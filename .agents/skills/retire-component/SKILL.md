---
name: retire-component
description: Deprecate a fibo component and, later, remove it. Covers the metadata entry, the docs banner and migration section, the codemod and its tests, the changelogs, and the removal release. Use when asked to deprecate, retire, sunset, replace or remove a component.
---

# Retire a component

Parts are copied into projects as source, so retiring one is about telling
people where they will see it and making the move cheap. The policy and its
reasons are in `plans/002-retiring-a-component.md`. Spinner is the worked
example; copy its shape.

## 1. Deprecate

1. **Metadata.** In `packages/ui/components.meta.json`, set
   `"status": "deprecated"` and add a `deprecated` object: `since` (the next
   release), `removal` (the minor after it), `replacement` (a key in the same
   file), `reason` (one or two sentences a designer would accept), and
   `codemod` (the transform's file name) if there is one. The registry build
   fails on an unknown replacement.
2. **Source.** Add a `@deprecated` JSDoc to the component naming the
   replacement and the removal version, so editors strike the import through.
   Change nothing else; a deprecated part still gets fixes.
3. **Stories.** Swap `tags: ["new"]` for `tags: ["deprecated"]`. Add a
   `Replacement` story rendering what the codemod writes. Model:
   `spinner.stories.tsx`.
4. **Docs page.** Put `<Deprecation name="<name>" />` directly under the
   description, then a `## Migration` section with a before and after code
   block, the `Replacement` canvas, and a `<UsageGuidelines>` list of every
   prop mapping and what the codemod leaves for a person. Cut Features,
   Guidelines, Examples and Do's and don'ts: nobody should be learning to use
   it. Keep Installation, API reference, Accessibility and Related
   components. Model: `apps/storybook/src/components/spinner.mdx`.
5. **Codemod.** When the move can be automated, write
   `apps/registry/codemods/<old>-to-<new>.js` as a jscodeshift transform.
   - Self-contained: jscodeshift fetches it by URL, so no imports.
   - Match the import by its last path segment, so any alias works, and
     follow renamed imports.
   - Rewrite only what is provably safe. Anything else (a value use, a spread
     that may carry a prop, other exports still imported) is left in place
     and reported with `api.report` and `file:line`.
   - Return `null` when nothing changed.
   - Test it beside the transform in `<name>.test.js`, one case per rule and
     per reported case. Model: `spinner-to-progress.test.js`.
6. **Changelogs.** A `### Deprecated` line in `CHANGELOG.md` and a line in
   `apps/storybook/src/pages/changelog.mdx`, both naming the replacement and
   the removal version.

Then run the definition of done from `AGENTS.md`, and check:

- `apps/registry/public/r/<name>.json` has the notice in `docs` and the
  object in `meta.deprecated`, and `public/llms.txt` marks the line.
- `apps/registry/public/codemods/<codemod>.js` exists.
- The codemod runs by URL against a sample file:
  `cd apps/registry/public && python3 -m http.server 8765`, then
  `pnpm dlx jscodeshift --parser tsx -t http://localhost:8765/codemods/<codemod>.js <dir>`.
- In Storybook, the sidebar and catalog pills, the banner's link to the
  replacement, and its copy button.

## 2. Remove

In the release named by `removal`:

1. Delete the source, stories, any test file and the docs page.
2. Delete the metadata entry and the catalog preview in
   `apps/storybook/src/blocks/catalog.tsx`, and drop the part from every
   `RelatedComponents` list.
3. Keep the codemod in `apps/registry/codemods/`. The build serves every
   file there, so late movers can still run it.
4. A `### Removed` line in `CHANGELOG.md` and a line in the Storybook
   changelog pointing at the codemod.
5. `grep -rn "<name>"` across the repo to catch leftovers.
