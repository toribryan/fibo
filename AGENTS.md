# fibo

A design system for experimental projects. Components are built on shadcn/ui
and Base UI, documented in Storybook, and published as a shadcn registry so
any project can install them with one command.

pnpm workspaces, Turborepo, Next.js 16, React 19, Tailwind CSS 4, Storybook 10.

## Layout

| Path                           | Holds                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| `packages/ui/src/components/`  | The components. One `.tsx` plus one `.stories.tsx` per component |
| `packages/ui/src/foundations/` | Color and typography stories                                     |
| `packages/ui/src/styles/`      | `globals.css`: primitive and semantic tokens, theme              |
| `packages/ui/src/lib/`         | `cn` and other helpers                                           |
| `apps/storybook/`              | Storybook, reads stories out of `packages/ui`                    |
| `apps/web/`                    | Registry site. Lists components and their install commands       |
| `apps/web/scripts/`            | `build-registry.mjs`, see below                                  |
| `packages/eslint-config/`      | Shared ESLint configs                                            |
| `packages/typescript-config/`  | Shared tsconfigs                                                 |
| `plans/`                       | Numbered design docs, see `plans/README.md`                      |

Inside `packages/ui`, import through the workspace alias
(`@workspace/ui/lib/utils`, `@workspace/ui/components/button`), never a
relative path. The registry build depends on those exact prefixes.

## Registry

`pnpm registry:build` copies every component in `packages/ui/src/components`
into `apps/web/registry/ui` with workspace imports rewritten to `@/lib/utils`
and `@/components/ui/*`, writes `apps/web/registry.json`, then runs
`shadcn build` to produce `apps/web/public/r/<name>.json`. The web build runs
it first, so the deployed site serves the registry at `/r/<name>.json`.

The web app is a static export (`output: "export"`), and `vercel.json` at the
repo root builds only the web workspace and serves `apps/web/out`. Anything
that needs a server at request time will not work on this site.

Package dependencies are read from each component's imports. A component that
imports another component through `@workspace/ui/components/*` gets it as a
registry dependency automatically.

Never edit `apps/web/registry`, `apps/web/registry.json`, or
`apps/web/public/r`. They are generated and gitignored.

## Adding a component

1. Create `packages/ui/src/components/<name>.tsx` in kebab-case.
2. Create `<name>.stories.tsx` next to it with at least a default story.
3. Run `pnpm storybook` to check it.
4. Run `pnpm registry:build` and confirm `apps/web/public/r/<name>.json` exists.

## Commands

```
pnpm dev              # every app in dev mode through turbo
pnpm storybook        # storybook only, on :6006
pnpm build            # turbo build (web build runs the registry build first)
pnpm registry:build   # registry only
pnpm lint             # eslint in every workspace
pnpm typecheck        # tsc in every workspace
pnpm format:check     # prettier --check
pnpm format:write     # prettier --write
```

Node is pinned in `.nvmrc`. Run `build` before `typecheck` on a clean tree:
the web app reads `registry.json`, which only exists after a build.

## Conventions

- kebab-case file names. Components export a PascalCase name and a
  `<name>Variants` cva object when they have variants.
- Every component sets `data-slot` on its root element.
- Semantic tokens only in components (`bg-primary`, `text-muted-foreground`).
  Primitive ramps (`brand-*`, `neutral-*`) are for `globals.css`.
- Comments explain why, never what. No comments about removed or changed code.
- Sentence case for headings in markdown and UI copy.
- No emojis in code, comments, or commit messages.
- Prettier runs on staged files at commit through husky. If a commit is
  rejected, fix the file rather than skipping the hook.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
