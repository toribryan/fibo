# fibo-ds

A design system for experimental projects. Components are built on shadcn/ui
and Base UI, documented in Storybook, and published as a shadcn registry so any
project can install them with one command.

Live site: https://golden-design-system.vercel.app

## Overview

The system has two layers. `globals.css` holds primitive token ramps (brand,
neutral) and the semantic tokens that map onto them, so re-theming means
editing one block. Components only ever reference the semantic layer.

Every component ships with a Storybook story, and the registry site lists each
one with its install command.

### Stack

- shadcn/ui on Base UI
- Tailwind CSS 4
- Storybook 10
- Next.js 16 for the registry site
- pnpm workspaces and Turborepo

### Using a component in another project

Add the namespace once, in the consuming project's `components.json`:

```json
"registries": {
  "@fibo-ds": "https://golden-design-system.vercel.app/r/{name}.json"
}
```

Then install by name:

```bash
pnpm dlx shadcn@latest add @fibo-ds/button
```

Without that entry, the full URL works anywhere:

```bash
pnpm dlx shadcn@latest add https://golden-design-system.vercel.app/r/button.json
```

The full list is on the live site. Components install into your project's
`components/ui` folder and use your `cn` helper, so they follow your local
tokens once installed.

## Development

Requires Node 24 (pinned in `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm storybook
```

Storybook runs at http://localhost:6006.

| Script                | What it does                       |
| --------------------- | ---------------------------------- |
| `pnpm storybook`      | Storybook                          |
| `pnpm dev`            | Every app in dev mode              |
| `pnpm build`          | Build every app, registry included |
| `pnpm registry:build` | Regenerate the registry JSON       |
| `pnpm lint`           | ESLint                             |
| `pnpm typecheck`      | `tsc --noEmit`                     |
| `pnpm format:write`   | Prettier                           |

CI runs lint, format check, build, and typecheck on every pull request.
Prettier runs on staged files at commit time.

Design decisions live in `plans/` as numbered docs. How the repo is laid out
and how the registry build works is in `AGENTS.md`.

## License

[MIT](./LICENSE).
