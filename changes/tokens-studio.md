---
type: changed
---

fibo's color tokens are generated from Tokens Studio JSON in `tokens/`,
synced with the Figma library, so a token changes in one place. Dark
`border`, `input` and `sidebar-border` are written as `color-mix` of
`--color-white` rather than `oklch(1 0 0 / …)`, with the same values.
