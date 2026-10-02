import type { ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  AtSignIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CompassIcon,
  HouseIcon,
  ListFilterIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
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
import { Spinner } from "@workspace/ui/components/spinner"
import {
  StickerAvatar,
  StickerAvatarCount,
  StickerAvatarGroup,
} from "@workspace/ui/components/sticker-avatar"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

import componentsMeta from "@workspace/ui/components.meta.json" with { type: "json" }

import { DocLink } from "./doc-link.js"

type Tier = "base-components" | "special-components"
type Status = "new" | "beta" | "deprecated"

type Entry = {
  name: string
  id: string
  description: string
  tier: Tier
  group: string
  status?: Status
  preview: ReactNode
}

// The order groups appear in on the Catalog page, per tier.
const GROUPS: Record<Tier, string[]> = {
  "base-components": [
    "Actions",
    "Forms",
    "Display",
    "Navigation",
    "Overlays",
    "Feedback",
  ],
  "special-components": [
    "Diagrams",
    "Navigation",
    "Forms",
    "Display",
    "Feedback",
  ],
}

// The wave a Chapter scrubber makes under the pointer, frozen for a preview.
const SCRUBBER_WAVE = [14, 14, 16, 24, 40, 56, 40, 24, 16, 14, 14, 14]

// Two groups, the first with a continuation line, for the Message list card.
const MESSAGE_PREVIEW = [
  {
    initials: "AR",
    name: "Ana",
    lines: ["Pushed the tokens.", "AA clears now."],
  },
  { initials: "BO", name: "Ben", lines: ["Looking now."] },
]

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
  spinner: <Spinner size="lg" label="Spinner preview" />,
  label: (
    <div className="flex w-48 flex-col gap-1.5">
      <Label>Email</Label>
      <div className="h-8 rounded-lg border border-input" />
    </div>
  ),
  textarea: <Textarea placeholder="Leave a note" className="w-52" />,
  "chat-composer": (
    <div className="flex w-60 flex-col rounded-2xl border border-input bg-input-subtle">
      <span className="px-3 pt-3 pb-2 text-sm text-muted-foreground">
        Message #design
      </span>
      <div className="flex items-center gap-2 px-2 pb-2 text-muted-foreground">
        <PaperclipIcon className="ml-1.5 size-4" />
        <AtSignIcon className="size-4" />
        <span className="ml-auto flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ArrowUpIcon className="size-4" />
        </span>
      </div>
    </div>
  ),
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
  pagination: (
    <div className="flex items-center gap-1 text-sm">
      <span className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground">
        <ChevronLeftIcon className="size-4" />
      </span>
      <span className="min-w-12 text-center tabular-nums">1 / 400</span>
      <span className="flex size-8 items-center justify-center rounded-full border border-border">
        <ChevronRightIcon className="size-4" />
      </span>
    </div>
  ),
  "data-table": (
    <div className="w-52 overflow-hidden rounded-md border border-border text-xs">
      <div className="flex h-6 items-center gap-2 bg-muted px-2 font-medium">
        <span className="size-3 rounded-[3px] bg-primary" />
        Member
      </div>
      {["Maya Okafor", "Priya Raman", "Sam Whitfield"].map((name, index) => (
        <div
          key={name}
          className={
            index === 1
              ? "flex h-7 items-center gap-2 border-t border-border bg-muted px-2"
              : "flex h-7 items-center gap-2 border-t border-border px-2"
          }
        >
          <span
            className={
              index === 1
                ? "size-3 rounded-[3px] bg-primary"
                : "size-3 rounded-[3px] border border-input"
            }
          />
          {name}
        </div>
      ))}
    </div>
  ),
  table: (
    <div className="w-48 overflow-hidden rounded-md border border-border text-xs">
      <div className="flex h-6 items-center bg-muted px-2 font-medium">
        Member
      </div>
      {["Maya Okafor", "Priya Raman", "Sam Whitfield"].map((name) => (
        <div
          key={name}
          className="flex h-7 items-center border-t border-border px-2"
        >
          {name}
        </div>
      ))}
    </div>
  ),
  sheet: (
    <div className="relative h-28 w-44 overflow-hidden rounded-md border border-border bg-muted">
      <div className="absolute inset-y-0 right-0 flex w-24 flex-col gap-1.5 border-l border-border bg-background p-2">
        <span className="h-2 w-12 rounded-full bg-foreground" />
        <span className="h-2 w-16 rounded-full bg-border" />
        <span className="mt-auto h-5 rounded-sm bg-primary" />
      </div>
    </div>
  ),
  menu: (
    <div className="flex w-36 flex-col rounded-lg border border-border bg-popover p-1 text-sm shadow-md">
      <span className="rounded-md bg-accent px-2 py-1.5">Edit</span>
      <span className="px-2 py-1.5">Duplicate</span>
      <span className="-mx-1 my-1 h-px bg-border" />
      <span className="px-2 py-1.5 text-destructive">Delete</span>
    </div>
  ),
  tooltip: (
    <div className="flex flex-col items-center gap-1.5">
      <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
        Add to library
      </span>
      <span className="flex h-8 items-center rounded-sm border border-border bg-background px-3 text-sm">
        Hover
      </span>
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
  "typing-indicator": (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1 rounded-full bg-current" />
        ))}
      </span>
      Ana and Ben are typing…
    </div>
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
  "jump-bar": (
    <span className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-md">
      3 new messages
      <ArrowDownIcon className="size-3.5" />
    </span>
  ),
  "message-list": (
    <div className="flex w-56 flex-col gap-2 text-xs">
      {MESSAGE_PREVIEW.map(({ initials, name, lines }) => (
        <div key={name} className="flex gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px]">
            {initials}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold">{name}</span>
            {lines.map((line) => (
              <span key={line} className="text-muted-foreground">
                {line}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
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
  "command-menu": (
    <span className="flex w-48 flex-col overflow-hidden rounded-lg border border-border bg-popover text-xs shadow-md">
      <span className="flex h-7 items-center gap-1.5 border-b border-border px-2 text-muted-foreground">
        <SearchIcon className="size-3" />
        Search…
      </span>
      <span className="flex flex-col p-1">
        {["New file", "Go to inbox", "Preferences"].map((label, index) => (
          <span
            key={label}
            className={cn(
              "flex h-6 items-center justify-between rounded-sm px-1.5",
              index === 0 && "bg-accent"
            )}
          >
            {label}
            {index === 0 ? (
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>N</Kbd>
              </KbdGroup>
            ) : null}
          </span>
        ))}
      </span>
    </span>
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
  "voice-memo": (
    <span className="flex items-start gap-2">
      <span className="relative block h-[3.6rem] w-[5.6rem] rounded-[7%/11%] border border-border bg-muted shadow-sm">
        <span className="absolute top-2 right-2 size-1 rounded-full bg-destructive" />
        <span className="absolute bottom-1.5 left-2 font-serif text-lg leading-none text-muted-foreground">
          fibo
        </span>
      </span>
      <span className="flex w-28 flex-col gap-1 rounded-lg border border-border bg-popover p-2 text-[9px] leading-snug shadow-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="size-1 rounded-full bg-destructive" />
          Listening…
        </span>
        <span>
          Quick note for the design review.{" "}
          <span className="text-muted-foreground">The token</span>
        </span>
      </span>
    </span>
  ),
  "map-pin": (
    <span className="relative block h-28 w-48 overflow-hidden rounded-lg border border-border bg-muted">
      <span className="absolute inset-x-0 top-10 h-2 bg-background" />
      <span className="absolute inset-y-0 left-20 w-2 bg-background" />
      <span className="absolute top-[4.5rem] left-8 size-3 rounded-full bg-primary ring-2 ring-background" />
      <span className="absolute top-3 left-28 inline-flex h-5 items-center rounded-full border border-border bg-background px-1.5 text-[10px] font-semibold">
        $18
      </span>
      <span className="absolute right-3 bottom-3 flex w-24 flex-col gap-0.5 rounded-md border border-border bg-popover p-1.5 shadow-sm">
        <span className="text-[8px] text-muted-foreground">Café</span>
        <span className="text-[10px] font-medium">Blue Bottle</span>
      </span>
      <span className="absolute right-12 bottom-14 size-3 rounded-full bg-primary shadow-[0_0_0_4px_var(--color-primary-subtle)] ring-2 ring-background" />
    </span>
  ),
  "sticker-avatar": (
    <StickerAvatarGroup className="-space-x-2">
      <StickerAvatar
        name="Tori Bryan"
        size={52}
        status="present"
        lift={false}
      />
      <StickerAvatar name="Ana Ruiz" size={52} status="away" lift={false} />
      <StickerAvatarCount count={4} size={52} />
    </StickerAvatarGroup>
  ),
  "floating-nav": (
    <span className="flex items-center gap-1 rounded-full border border-border bg-popover p-1 shadow-md">
      <span className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground">
        <HouseIcon className="size-4" />
        Home
      </span>
      {[CompassIcon, SearchIcon, UserIcon].map((Icon, i) => (
        <span
          key={i}
          className="flex size-8 items-center justify-center text-muted-foreground"
        >
          <Icon className="size-4" />
        </span>
      ))}
    </span>
  ),
}

type Meta = {
  title: string
  description: string
  tier: Tier
  group: string
  status?: Status
}

const META = Object.entries(componentsMeta).filter(
  (entry): entry is [string, Meta] => entry[0] !== "$comment"
)

const ENTRIES: Entry[] = META.map(([key, info]) => ({
  name: info.title,
  // Base parts sit in a group in the sidebar; special parts sit straight
  // under their shelf.
  id:
    info.tier === "base-components"
      ? `${info.tier}-${info.group.toLowerCase()}-${key}--docs`
      : `${info.tier}-${key}--docs`,
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
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 font-mono text-[10px] leading-none uppercase",
                entry.status === "deprecated"
                  ? "border-destructive text-destructive"
                  : "border-success text-success"
              )}
            >
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
        // Deprecated parts sink to the end so new work starts elsewhere.
        const entries = ENTRIES.filter(
          (entry) => entry.tier === tier && entry.group === group
        ).sort(
          (a, b) =>
            Number(a.status === "deprecated") -
            Number(b.status === "deprecated")
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
