# fibo

An achromatic design system for experimental projects. Components are built on
shadcn/ui and Base UI, documented in Storybook, and published as a shadcn
registry, so any project installs them with `pnpm dlx shadcn@latest add
@fibo/<name>`.

pnpm workspaces, Turborepo, React 19, Tailwind CSS 4, Storybook 10.
Node 24 (pinned in `.nvmrc`).

## Layout

| Path                               | Holds                                                                |
| ---------------------------------- | -------------------------------------------------------------------- |
| `packages/ui/src/components/`      | The components. One `.tsx` plus one `.stories.tsx` each              |
| `packages/ui/components.meta.json` | Title, description, shelf and group for every component              |
| `packages/ui/src/foundations/`     | Colour and typography stories                                        |
| `packages/ui/src/styles/`          | `globals.css`: semantic tokens over Tailwind's ramps, light and dark |
| `packages/ui/src/lib/`             | `cn` and other helpers                                               |
| `apps/storybook/.storybook/`       | Storybook config: sidebar, theme toggle, docs container              |
| `apps/storybook/src/pages/`        | Welcome, Getting started, Catalog, Changelog, Contributing           |
| `apps/storybook/src/components/`   | One `.mdx` docs page per component                                   |
| `apps/storybook/src/blocks/`       | Docs blocks: anatomy, data attributes, guidelines, catalog, hero     |
| `apps/registry/`                   | Builds the shadcn registry and `llms.txt`, see below                 |
| `packages/eslint-config/`          | Shared ESLint flat configs                                           |
| `packages/typescript-config/`      | Shared tsconfigs                                                     |
| `.agents/skills/`                  | Agent skills; `.claude/skills/` links here                           |
| `.claude/agents/`                  | Claude Code subagents                                                |
| `plans/`                           | Numbered design docs, see `plans/README.md`                          |

## Commands

```
pnpm install
pnpm storybook        # Storybook on :6006
pnpm dev              # every app in dev mode
pnpm build            # the registry and Storybook
pnpm build:site       # build, then assemble the deployable site in dist/
pnpm registry:build   # registry only
pnpm lint             # ESLint in every workspace, zero warnings allowed
pnpm typecheck        # tsc in every workspace; run build first on a clean tree
pnpm test             # unit and story tests in Chromium, with axe checks
pnpm format:check     # Prettier
pnpm format:write
```

## Definition of done

A change is ready when all of these pass from the repo root:
`pnpm format:check`, `pnpm lint`, `pnpm build`, `pnpm typecheck`, `pnpm test`.
CI runs the same five on every pull request. For a component change, also open
it in Storybook in both themes and check the keyboard path.

## Testing

Four layers, all run by `pnpm test` except visual regression:

- **Story tests.** `@storybook/addon-vitest` renders every story in Chromium.
  A story fails if it throws, if its `play` function fails, or if axe finds a
  violation (`parameters.a11y.test` is `"error"`). Config:
  `apps/storybook/vitest.config.ts`.
- **Interaction tests.** `play` functions on stories, using `storybook/test`.
  Every interactive part has one on its `Default` story that drives it by
  pointer and keyboard. Never import from `vitest` in a story file; stories
  also run in Storybook.
- **Unit tests.** `packages/ui/src/**/*.test.{ts,tsx}`, run in Chromium with
  `vitest-browser-react`. Use them for logic and contracts a story does not
  show: formatting, limits, controlled callbacks, variant classes.
- **Visual regression.** Chromatic snapshots every story on pull requests
  (`.github/workflows/chromatic.yml`). Changes are reviewed and approved in
  Chromatic, not in the repo.

A story that shows a part without a visible label must name it with
`aria-label` in its args, or the axe check fails.

## Adding a component

Use the `add-component` skill (`.agents/skills/add-component/SKILL.md`). It
covers the source file, stories, docs page, metadata and checks, and porting
from another codebase. The `component-reviewer` subagent reviews the result
against the conventions below.

## Conventions

- **Two shelves.** Standard parts are titled `Base components/<Name>` and
  depend on nothing beyond Base UI, `class-variance-authority` and
  `lucide-react`. Playful, specific parts are titled `Special components/<Name>`
  and may use `motion`.
- **Tokens.** Semantic tokens only in components (`bg-primary`,
  `text-muted-foreground`). Primitive ramps (`neutral-*`, `red-*`, `green-*`,
  `amber-*`, `blue-*`) belong in `globals.css`. There is no brand hue:
  `primary` is a neutral, and colour only carries meaning.
- **No opacity modifiers** on token colours (`bg-destructive/10`). Figma
  cannot bind opacity to a variable, so those are named roles instead:
  `-subtle`, `-hover`, `-ring`. Figma and code then use the same name.
- **Imports.** Inside `packages/ui`, import through the workspace alias
  (`@workspace/ui/lib/utils`, `@workspace/ui/components/button`), never a
  relative path. The registry build rewrites those exact prefixes.
- **Structure.** kebab-case files. A PascalCase component, plus a
  `<name>Variants` cva object when it has variants. `data-slot` on the root.
  A JSDoc line on every prop.
- **Stories.** No `autodocs` tag: each component has an MDX docs page. New
  parts take `tags: ["new"]`.
- **Writing.** Sentence case for headings and UI copy. Comments explain why,
  never what, and never describe removed code. No emojis in code, comments or
  commit messages.

## Registry and site

`pnpm registry:build` copies every component into `apps/registry/registry/ui` with
workspace imports rewritten to `@/lib/utils` and `@/components/ui/*`, writes
`apps/registry/registry.json` from the source and `components.meta.json`, runs
`shadcn build` to produce `apps/registry/public/r/<name>.json`, and writes
`apps/registry/public/llms.txt`. Package and registry dependencies are read from
each component's imports.

The site is static. `vercel.json` runs `pnpm build:site`, which puts the
built Storybook at the root of `dist/` with the registry at `dist/r/` and
`llms.txt` beside it. So fibo.toribryan.com opens on Storybook, a component's
docs live at `/?path=/docs/<tier>-<name>--docs`, and installs resolve
`/r/<name>.json`. Nothing that needs a server at request time will work there.

## Do not

- Edit `apps/registry/registry`, `apps/registry/registry.json`,
  `apps/registry/public` or `dist`. They are generated and gitignored.
- Skip the husky pre-commit hook. If Prettier rejects a commit, fix the file.
- Add a dependency to a Components-shelf part beyond the three listed above.
