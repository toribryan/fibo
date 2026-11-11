"use client"

import type { ComponentProps } from "react"

import { TokenFlow, type TokenRow } from "@workspace/ui/components/token-flow"

// fibo's own tokens, as globals.css resolves them in each theme.
const rows: TokenRow[] = [
  {
    base: "oklch(0.205 0 0)",
    primitive: "neutral-900",
    semantic: "bg-primary",
    use: "Primary actions, headings",
    dark: { base: "oklch(0.985 0 0)", primitive: "neutral-50" },
  },
  {
    base: "oklch(0.505 0.213 27.518)",
    primitive: "red-700",
    semantic: "text-destructive",
    use: "Errors and irreversible actions",
    dark: { base: "oklch(0.704 0.191 22.216)", primitive: "red-400" },
  },
  {
    base: "oklch(0.922 0 0)",
    primitive: "neutral-200",
    semantic: "border-border",
    use: "Hairlines and inputs",
    dark: { base: "oklch(1 0 0 / 10%)", primitive: "white / 10%" },
  },
]

type DemoProps = Omit<ComponentProps<typeof TokenFlow>, "rows">

export function TokenFlowDemo(props: DemoProps) {
  return <TokenFlow className="w-full" rows={rows} {...props} />
}

export function TokenFlowSingleRowDemo() {
  return <TokenFlow className="w-full" rows={rows.slice(0, 1)} showUse />
}
