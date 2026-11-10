import type { ReactNode } from "react"

// A live fibo part on the page's own tokens. The full set of examples, with
// controls, stays in Storybook.
export function Preview({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose my-6 flex min-h-40 flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-background p-8">
      {children}
    </div>
  )
}
