import { ArrowUpRightIcon } from "lucide-react"

import { storybookDocs } from "@/lib/links"

// Every component page ends here: examples, props and data attributes live
// in Storybook.
export function StorybookLink({ id, name }: { id: string; name: string }) {
  return (
    <a
      href={storybookDocs(id)}
      className="not-prose my-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground no-underline transition-colors hover:bg-accent"
    >
      <span>
        <span className="block font-medium">{name} in Storybook</span>
        <span className="text-muted-foreground">
          Every example, the props table and data attributes.
        </span>
      </span>
      <ArrowUpRightIcon className="size-4 shrink-0" />
    </a>
  )
}
