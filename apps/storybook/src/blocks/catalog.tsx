import type { ReactNode } from "react"
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ListFilterIcon,
  PlusIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { Label } from "@workspace/ui/components/label"
import { PixelSnailSprite } from "@workspace/ui/components/pixel-snail"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import componentsMeta from "@workspace/ui/components.meta.json" with { type: "json" }

import { DocLink } from "./doc-link.js"

type Tier = "base-components" | "special-components"

type Entry = {
  name: string
  id: string
  description: string
  tier: Tier
  group: string
  status?: "new" | "beta"
  preview: ReactNode
}

// The order groups appear in on the Catalog page, per tier.
const GROUPS: Record<Tier, string[]> = {
  "base-components": ["Actions", "Forms", "Display", "Feedback"],
  "special-components": ["Diagrams", "Navigation", "Feedback"],
}

// The wave a Chapter scrubber makes under the pointer, frozen for a preview.
const SCRUBBER_WAVE = [14, 14, 16, 24, 40, 56, 40, 24, 16, 14, 14, 14]

// Previews are inert: a catalog card is one link, so nothing inside it can
// take focus or swallow the click. Everything else about an entry comes from
// packages/ui/components.meta.json, the same file the registry build reads.
const PREVIEWS: Record<string, ReactNode> = {
  button: (
    <div className="flex gap-2">
      <Button size="sm">Save</Button>
      <Button size="sm" variant="outline">
        Cancel
      </Button>
    </div>
  ),
  badge: (
    <div className="flex gap-2">
      <Badge>Live</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">v2</Badge>
    </div>
  ),
  checkbox: (
    <div className="flex items-center gap-2">
      <Checkbox defaultChecked />
      <span className="text-sm">Remember me</span>
    </div>
  ),
  input: <Input placeholder="you@example.com" className="w-48" />,
  label: (
    <div className="flex w-48 flex-col gap-1.5">
      <Label>Email</Label>
      <div className="h-8 rounded-lg border border-input" />
    </div>
  ),
  textarea: <Textarea placeholder="Leave a note" className="w-52" />,
  switch: (
    <div className="flex items-center gap-3">
      {[true, false].map((on) => (
        <span
          key={String(on)}
          className={cn(
            "flex h-[18px] w-8 items-center rounded-full p-px",
            on ? "justify-end bg-primary" : "bg-input"
          )}
        >
          <span
            className={cn(
              "size-4 rounded-full shadow-sm",
              on ? "bg-primary-foreground" : "bg-background"
            )}
          />
        </span>
      ))}
    </div>
  ),
  "radio-group": (
    <div className="flex flex-col gap-2">
      {["Monthly", "Yearly"].map((label, index) => (
        <span key={label} className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full border",
              index === 0
                ? "border-primary bg-primary"
                : "border-input bg-input-subtle"
            )}
          >
            {index === 0 ? (
              <span className="size-2 rounded-full bg-primary-foreground" />
            ) : null}
          </span>
          {label}
        </span>
      ))}
    </div>
  ),
  select: (
    <span className="flex h-9 w-44 items-center justify-between rounded-sm border border-input bg-input-subtle px-3 text-sm">
      Blueberry
      <ChevronDownIcon className="size-4 text-muted-foreground" />
    </span>
  ),
  slider: (
    <span className="relative flex h-4 w-44 items-center">
      <span className="h-1.5 w-full rounded-full bg-input" />
      <span className="absolute left-0 h-1.5 w-[60%] rounded-full bg-primary" />
      <span className="absolute left-[calc(60%-8px)] size-4 rounded-full border border-primary bg-background shadow-sm" />
    </span>
  ),
  avatar: (
    <div className="flex -space-x-2">
      {["AL", "GH", "KJ"].map((initials) => (
        <span
          key={initials}
          className="flex size-10 items-center justify-center rounded-full bg-muted text-xs ring-2 ring-background"
        >
          {initials}
        </span>
      ))}
    </div>
  ),
  kbd: (
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
  progress: (
    <div className="flex w-48 flex-col gap-2 text-sm">
      <div className="flex justify-between">
        <span className="font-medium">Uploading</span>
        <span className="font-mono text-muted-foreground">60%</span>
      </div>
      <span className="h-1.5 w-full rounded-full bg-input">
        <span className="block h-full w-[60%] rounded-full bg-primary" />
      </span>
    </div>
  ),
  skeleton: (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  ),
  toast: (
    <span className="flex w-56 items-center gap-2.5 rounded-xl border border-border bg-popover p-3 text-sm shadow-md">
      <CircleCheckIcon className="size-4 text-success" />
      <span className="flex-1 font-medium">Changes saved</span>
      <XIcon className="size-3.5 text-muted-foreground" />
    </span>
  ),
  "token-flow": (
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      {["oklch(0.205 0 0)", "neutral-900", "bg-primary"].map((label, index) => (
        <span key={label} className="flex items-center gap-1.5">
          {index > 0 ? <span className="h-px w-4 bg-border" /> : null}
          <span className="inline-flex h-5 items-center gap-1 rounded-full border border-border bg-card px-1.5 whitespace-nowrap">
            <span className="size-2 rounded-full bg-primary" />
            {label}
          </span>
        </span>
      ))}
    </div>
  ),
  reactions: (
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
  "integration-visual": (
    <svg viewBox="0 0 160 100" className="w-44" fill="none" aria-hidden="true">
      <g className="stroke-border">
        <path d="M74 50V34Q74 24 64 24H30" />
        <path d="M86 50V34Q86 24 96 24H130" />
        <path d="M74 50V66Q74 76 64 76H30" />
        <path d="M86 50V66Q86 76 96 76H130" />
      </g>
      {[
        [30, 24],
        [130, 24],
        [30, 76],
        [130, 76],
      ].map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x! - 9}
          y={y! - 9}
          width={18}
          height={18}
          rx={4}
          className="fill-card stroke-border"
        />
      ))}
      <rect
        x={66}
        y={36}
        width={28}
        height={28}
        rx={7}
        className="fill-background stroke-ring"
      />
      <circle cx={80} cy={50} r={3} className="fill-foreground" />
    </svg>
  ),
  "pixel-snail": (
    <svg
      viewBox="-13 -16 27 18"
      className="h-15 w-22 overflow-visible text-foreground"
      aria-hidden="true"
    >
      <PixelSnailSprite mode="rest" />
    </svg>
  ),
  "filter-menu": (
    <div className="flex w-44 flex-col gap-1.5">
      <span className="inline-flex h-7 items-center gap-1.5 self-start rounded-full border border-border bg-input-subtle px-2.5 text-xs font-medium">
        <ListFilterIcon className="size-3.5" />
        Filter
      </span>
      <span className="flex flex-col rounded-lg border border-border bg-popover p-1 text-xs shadow-md">
        {["Status", "Assignee", "Priority"].map((label, index) => (
          <span
            key={label}
            className={cn(
              "flex h-6 items-center justify-between rounded-sm px-1.5",
              index === 0 && "bg-accent"
            )}
          >
            {label}
            <ChevronRightIcon className="size-3 text-muted-foreground" />
          </span>
        ))}
      </span>
    </div>
  ),
  "chapter-scrubber": (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-2">
        {SCRUBBER_WAVE.map((width, i) => (
          <span
            key={i}
            className="block h-0.5 rounded-full bg-foreground"
            style={{ width, opacity: 0.25 + ((width - 14) / 42) * 0.75 }}
          />
        ))}
      </div>
      <span className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs font-medium shadow-sm">
        Semantic roles
      </span>
    </div>
  ),
}

type Meta = {
  title: string
  description: string
  tier: Tier
  group: string
  status?: "new" | "beta"
}

const META = Object.entries(componentsMeta).filter(
  (entry): entry is [string, Meta] => entry[0] !== "$comment"
)

const ENTRIES: Entry[] = META.map(([key, info]) => ({
  name: info.title,
  id: `${info.tier}-${key}--docs`,
  description: info.description,
  tier: info.tier,
  group: info.group,
  status: info.status,
  preview: PREVIEWS[key] ?? (
    <span className="text-sm font-medium text-muted-foreground">
      {info.title}
    </span>
  ),
}))

function Card({ entry, compact }: { entry: Entry; compact?: boolean }) {
  return (
    <DocLink
      to={entry.id}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card no-underline transition-colors hover:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
    >
      <div
        inert
        className={cn(
          "flex items-center justify-center bg-card",
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

function Catalog({ tier }: { tier: Tier }) {
  const groups = GROUPS[tier]
  return (
    <div className="my-8 flex flex-col gap-12">
      {groups.map((group) => {
        const entries = ENTRIES.filter(
          (entry) => entry.tier === tier && entry.group === group
        )
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
