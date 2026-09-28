import type { ReactNode } from "react"
import { ArrowUpRightIcon, PlusIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import { DocLink } from "./doc-link.js"

type Entry = {
  name: string
  id: string
  description: string
  group: "Actions" | "Forms" | "Display" | "Feedback"
  status?: "new" | "beta"
  preview: ReactNode
}

// Previews are inert: a catalog card is one link, so nothing inside it can
// take focus or swallow the click.
const ENTRIES: Entry[] = [
  {
    name: "Button",
    id: "components-button--docs",
    description: "Triggers an action or event with a single click.",
    group: "Actions",
    preview: (
      <div className="flex gap-2">
        <Button size="sm">Save</Button>
        <Button size="sm" variant="outline">
          Cancel
        </Button>
      </div>
    ),
  },
  {
    name: "Badge",
    id: "components-badge--docs",
    description: "A short label for status, category or count.",
    group: "Display",
    preview: (
      <div className="flex gap-2">
        <Badge>Live</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="outline">v2</Badge>
      </div>
    ),
  },
  {
    name: "Checkbox",
    id: "components-checkbox--docs",
    description: "Turns a single option on or off, or picks many from a list.",
    group: "Forms",
    preview: (
      <div className="flex items-center gap-2">
        <Checkbox defaultChecked />
        <span className="text-sm">Remember me</span>
      </div>
    ),
  },
  {
    name: "Input",
    id: "components-input--docs",
    description: "A single line of free text.",
    group: "Forms",
    preview: <Input placeholder="you@example.com" className="w-48" />,
  },
  {
    name: "Label",
    id: "components-label--docs",
    description: "Names a form control and widens its hit area.",
    group: "Forms",
    preview: (
      <div className="flex w-48 flex-col gap-1.5">
        <Label>Email</Label>
        <div className="h-8 rounded-lg border border-input" />
      </div>
    ),
  },
  {
    name: "Textarea",
    id: "components-textarea--docs",
    description: "Several lines of free text that grow with the content.",
    group: "Forms",
    preview: <Textarea placeholder="Leave a note" className="w-52" />,
  },
  {
    name: "Token flow",
    id: "components-token-flow--docs",
    description:
      "Walks a colour token from raw value to primitive to semantic role.",
    group: "Display",
    status: "new",
    preview: (
      <div className="flex items-center gap-1.5 font-mono text-[10px]">
        {["oklch(0.205 0 0)", "neutral-900", "bg-primary"].map(
          (label, index) => (
            <span key={label} className="flex items-center gap-1.5">
              {index > 0 ? <span className="h-px w-4 bg-border" /> : null}
              <span className="inline-flex h-5 items-center gap-1 rounded-full border border-border bg-card px-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {label}
              </span>
            </span>
          )
        )}
      </div>
    ),
  },
  {
    name: "Reactions",
    id: "components-reactions--docs",
    description: "Lets people respond to content with an emoji in one tap.",
    group: "Feedback",
    status: "new",
    preview: (
      <div className="flex gap-1.5">
        {[
          ["\u{1F44D}", 5],
          ["❤️", 3],
        ].map(([emoji, count]) => (
          <span
            key={emoji}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-sm"
          >
            {emoji}
            <span className="font-mono text-xs tabular-nums">{count}</span>
          </span>
        ))}
        <span className="inline-flex size-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
          <PlusIcon className="size-3.5" />
        </span>
      </div>
    ),
  },
]

function Card({ entry, compact }: { entry: Entry; compact?: boolean }) {
  return (
    <DocLink
      to={entry.id}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card no-underline transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
    >
      <div
        inert
        className={cn(
          "flex items-center justify-center bg-muted transition-colors group-hover:bg-secondary-hover",
          compact ? "h-32" : "h-40"
        )}
      >
        <div className="scale-90">{entry.preview}</div>
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-border p-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {entry.name}
          {entry.status ? (
            <span className="rounded-full border border-success px-1.5 py-0.5 font-mono text-[10px] leading-none text-success uppercase">
              {entry.status}
            </span>
          ) : null}
          <ArrowUpRightIcon className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="text-sm leading-5 text-muted-foreground">
          {entry.description}
        </span>
      </div>
    </DocLink>
  )
}

function Catalog() {
  const groups = ["Actions", "Forms", "Display", "Feedback"] as const
  return (
    <div className="my-8 flex flex-col gap-12">
      {groups.map((group) => {
        const entries = ENTRIES.filter((entry) => entry.group === group)
        if (entries.length === 0) return null
        return (
          <section key={group} className="flex flex-col gap-4">
            <h3 className="m-0 flex items-baseline gap-2 text-sm font-semibold text-foreground">
              {group}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {entries.length}
              </span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <Card key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function RelatedComponents({ names }: { names: string[] }) {
  const entries = names
    .map((name) => ENTRIES.find((entry) => entry.name === name))
    .filter((entry): entry is Entry => Boolean(entry))
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <Card key={entry.id} entry={entry} compact />
      ))}
    </div>
  )
}

export { Catalog, RelatedComponents, ENTRIES }
