# Contributing to fibo

Thanks for helping. fibo is small on purpose, so the best contributions are
bug fixes, accessibility improvements, and new parts that fit one of the two
shelves.

## Before you start

- For a bug, open an issue with steps to reproduce. A link to the Storybook
  story that shows it helps most.
- For a new component, open a component request first so we can agree on the
  shelf and the API before you build it.

## Setup

Requires Node 24 (pinned in `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm storybook
```

## Making a change

- **Base or special.** Standard parts go on the Base components shelf and
  depend on nothing beyond Base UI, `class-variance-authority` and
  `lucide-react`. Playful, specific parts go in Special components and may use
  `motion`.
- **Adding a component.** Follow
  [`.agents/skills/add-component/SKILL.md`](./.agents/skills/add-component/SKILL.md).
  It lists every file a part needs (source, stories, docs page, metadata) and
  the conventions they follow. Coding agents use the same file.
- **Conventions.** They are in [`AGENTS.md`](./AGENTS.md): semantic tokens
  only, no opacity modifiers on colors, `data-slot` on every root, and
  sentence case everywhere.

## Before you open a pull request

Run these from the repo root. CI runs the same checks.

```bash
pnpm format:write
pnpm lint
pnpm build
pnpm typecheck
pnpm test
```

`pnpm test` renders every story in Chromium, runs its interaction test and
checks it with axe, then runs the unit tests. The first run needs a browser:
`pnpm --filter storybook exec playwright install chromium`.

For a component change, also check it in Storybook in both themes, with the
keyboard only, and with reduced motion turned on.

## Pull requests

Keep each pull request to one change. Describe what changed and why, and add
a line to the changelog in `apps/storybook/src/pages/changelog.mdx` for
anything a user would notice.

## Versioning

fibo follows [semantic versioning](https://semver.org/). A registry copies
source into someone's project instead of shipping a package they upgrade, so a
version describes what happens when they run `shadcn add` again over a part
they already have.

| Release | When                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Major   | Their code breaks or does something else: a part, prop, export, token or data attribute removed or renamed, or a prop's default changed.                                             |
| Minor   | Something new: a part, prop, variant, token or theme. Deprecations and visual refinements, such as a new radius or shadow on a part, go out in a minor and are listed under Changed. |
| Patch   | A fix that keeps the API: a bug, an accessibility failure, a contrast or layout fix.                                                                                                 |

A fix for an accessibility or security failure can change behavior in a minor
or patch when keeping the old behavior would keep the failure; the changelog
says so.

**Deprecating.** Nothing is removed without a deprecation first. The
deprecated part or prop keeps working and keeps getting fixes until the next
major release, and ships with a codemod in `apps/registry/codemods/` when the
move can be automated. The `retire-component` skill covers the steps.
Codemods stay published after the code they migrate off is gone.

## Releasing

1. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new version
   heading with the date, and add its link at the bottom.
2. Set `version` in the root `package.json` and `apps/registry/package.json`.
3. Merge, then tag the merge commit `v<version>` and push the tag. The
   release workflow checks the tag against `package.json` and publishes a
   GitHub release with that version's changelog section.

## Conduct

Everyone taking part is expected to follow the
[code of conduct](./CODE_OF_CONDUCT.md).
