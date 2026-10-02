# Archive

Features taken off the site but kept in the repo. Nothing here is built,
linted, typechecked or tested, so it will drift from the tokens and
components it was written against. Expect to fix imports and token names when
bringing something back.

Each folder mirrors the paths its files came from, so restoring one is a move
back to the same place:

```bash
cd archive/<feature>
for f in $(git ls-files | grep -v "^README.md$"); do mkdir -p "../../$(dirname "$f")" && git mv "$f" "../../$f"; done
```

Then undo whatever its README says was unhooked.

| Folder           | Archived     | Why                             |
| ---------------- | ------------ | ------------------------------- |
| `theme-creator/` | October 2026 | Not core to fibo. See plan 001. |
