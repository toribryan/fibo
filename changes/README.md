# Changes

One file per pull request for anything a user would notice. `pnpm release`
turns them into the next version's section of `CHANGELOG.md` and the
Storybook changelog, then deletes them. Until then, the Storybook changelog
lists them under "Not released yet".

Name the file after the branch, such as `changes/search-input.md`:

```md
---
type: added
---

**Search input**: `SearchInput`, a search box with a Cmd+K shortcut that
focuses it.
```

`type` is one of `added`, `changed`, `deprecated`, `removed`, `fixed` or
`security`, the Keep a Changelog sections. Add `breaking: true` when the
change needs anything from someone upgrading, and say what in the entry; it
goes under "Upgrade notes" at the top of the release. Name the part in bold
first, and the codemod when there is one.

A pull request with no user-facing change takes the `no changelog` label
instead.
