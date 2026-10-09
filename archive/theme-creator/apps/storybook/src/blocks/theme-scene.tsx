import { useId, useState, type CSSProperties, type ReactNode } from "react"
import { CircleDashedIcon, SignalHighIcon, UserIcon, XIcon } from "lucide-react"

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ChapterScrubber } from "@workspace/ui/components/chapter-scrubber"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  FilterMenu,
  type FilterField,
  type FilterValue,
} from "@workspace/ui/components/filter-menu"
import { Input } from "@workspace/ui/components/input"
import { IntegrationVisual } from "@workspace/ui/components/integration-visual"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import { Label } from "@workspace/ui/components/label"
import { PixelSnail } from "@workspace/ui/components/pixel-snail"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Reactions } from "@workspace/ui/components/reactions"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { TokenFlow } from "@workspace/ui/components/token-flow"
import { toCss } from "@workspace/ui/lib/color"
import {
  cssVariables,
  neutralRamp,
  tokens,
  type Mode,
  type Theme,
} from "@workspace/ui/lib/theme"
import { cn } from "@workspace/ui/lib/utils"

import {
  FigmaIcon,
  GithubIcon,
  ShadcnIcon,
  StorybookIcon,
} from "./brand-icons.js"

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/*
 * One fibo part on the stage, labeled the way the catalog labels it, so
 * the scene doubles as a tour of the system in the theme being made.
 */
function Exhibit({
  name,
  shelf = "Base components",
  children,
  className,
}: {
  name: string
  shelf?: "Base components" | "Special components" | "Foundations"
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-label={name}
      className={cn(
        "mb-4 flex break-inside-avoid flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-sm font-medium">{name}</h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {shelf}
        </span>
      </div>
      {children}
    </section>
  )
}

// The generated ramps across the top, the way Radix shows a scale: neutral
// steps, then the colors that carry meaning with their tints.
function Palette({ theme, mode }: { theme: Theme; mode: Mode }) {
  const ramp = neutralRamp(theme.neutral)
  const t = tokens(theme, mode)
  const roles = [
    "primary",
    "destructive",
    "success",
    "warning",
    "info",
  ] as const
  return (
    <Exhibit name="Colors" shelf="Foundations" className="mb-0">
      <div className="grid grid-cols-11 gap-1.5">
        {STEPS.map((step) => (
          <div key={step} className="flex flex-col gap-1.5">
            <span
              className="h-9 rounded-md border border-border"
              style={{ background: toCss(ramp[step]) }}
            />
            <span className="text-center font-mono text-[10px] text-muted-foreground">
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {roles.map((role) => (
          <div key={role} className="flex flex-col gap-1.5">
            <span className="flex h-9 overflow-hidden rounded-md border border-border">
              <span
                className="flex-[2]"
                style={{ background: toCss(t[role]!.color) }}
              />
              <span
                className="flex-1"
                style={{ background: `var(--${role}-subtle)` }}
              />
            </span>
            <span className="font-mono text-[10px] text-muted-foreground capitalize">
              {role}
            </span>
          </div>
        ))}
      </div>
    </Exhibit>
  )
}

function Type({ theme }: { theme: Theme }) {
  return (
    <Exhibit name="Typography" shelf="Foundations">
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        {theme.fonts.sans} · {theme.fonts.mono}
      </span>
      <p className="m-0 text-3xl leading-tight font-semibold tracking-tight">
        An achromatic system for experimental projects.
      </p>
      <p className="m-0 leading-relaxed text-muted-foreground">
        Grays do the structural work, and color only ever carries meaning.
        Numbers like{" "}
        <code className="rounded-sm bg-muted px-1 font-mono text-sm text-foreground">
          1,284.60
        </code>{" "}
        sit in the mono face.
      </p>
    </Exhibit>
  )
}

function Actions() {
  return (
    <Exhibit name="Button, Badge and Kbd">
      <div className="flex flex-wrap gap-2">
        <Button>Save</Button>
        <Button variant="secondary">Preview</Button>
        <Button variant="outline">Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Live</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="destructive">Failed</Badge>
        <Badge variant="outline">v2</Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          Search{" "}
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </span>
      </div>
    </Exhibit>
  )
}

function Forms() {
  const id = useId()
  return (
    <Exhibit name="Forms">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>Project name</Label>
        <Input id={`${id}-name`} placeholder="Untitled project" />
      </div>
      <Textarea placeholder="What's it for?" aria-label="Description" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id={`${id}-public`} defaultChecked />
          <Label htmlFor={`${id}-public`} className="font-normal">
            Public
          </Label>
        </div>
        <RadioGroup
          defaultValue="weekly"
          aria-label="Backups"
          className="flex w-auto gap-3"
        >
          {["Daily", "Weekly"].map((label) => (
            <div key={label} className="flex items-center gap-2">
              <RadioGroupItem
                value={label.toLowerCase()}
                id={`${id}-${label}`}
              />
              <Label htmlFor={`${id}-${label}`} className="font-normal">
                {label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Switch defaultChecked aria-label="Sync" />
      </div>
      <Slider defaultValue={[62]} aria-label="Storage limit" />
    </Exhibit>
  )
}

const FILTER_FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: <CircleDashedIcon />,
    options: [
      { value: "todo", label: "Todo" },
      { value: "doing", label: "In progress" },
      { value: "done", label: "Done" },
    ],
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: <UserIcon />,
    options: [
      { value: "ada", label: "Ada Lovelace" },
      { value: "grace", label: "Grace Hopper" },
    ],
  },
  {
    id: "priority",
    label: "Priority",
    icon: <SignalHighIcon />,
    options: [
      { value: "urgent", label: "Urgent" },
      { value: "low", label: "Low" },
    ],
  },
]

function Filters() {
  const [value, setValue] = useState<FilterValue>({
    status: ["todo", "doing"],
    priority: ["urgent"],
  })
  const label = (field: string, option: string) =>
    FILTER_FIELDS.find((f) => f.id === field)?.options.find(
      (o) => o.value === option
    )?.label
  return (
    <Exhibit name="Filter menu" shelf="Special components">
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          fields={FILTER_FIELDS}
          value={value}
          onValueChange={setValue}
        />
        {Object.entries(value).map(([field, values]) => (
          <span
            key={field}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background pr-1 pl-3 text-sm"
          >
            <span className="text-muted-foreground capitalize">{field}</span>
            {values.map((v) => label(field, v)).join(", ")}
            <button
              type="button"
              aria-label={`Remove ${field} filter`}
              onClick={() => {
                const rest = { ...value }
                delete rest[field]
                setValue(rest)
              }}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
            >
              <XIcon className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
    </Exhibit>
  )
}

function Integrations() {
  return (
    <Exhibit name="Integration visual" shelf="Special components">
      <div className="overflow-hidden rounded-lg border border-border">
        <IntegrationVisual
          label="fibo's toolchain"
          items={[
            { title: "Figma", icon: <FigmaIcon /> },
            { title: "shadcn", icon: <ShadcnIcon /> },
            { title: "GitHub", icon: <GithubIcon /> },
            { title: "Storybook", icon: <StorybookIcon />, status: "idle" },
          ]}
        />
      </div>
    </Exhibit>
  )
}

function Chapters() {
  return (
    <Exhibit name="Chapter scrubber" shelf="Special components">
      <div className="flex justify-center py-2">
        <ChapterScrubber
          orientation="horizontal"
          side="bottom"
          chapters={[
            { id: "tokens", title: "Tokens", meta: "01" },
            { id: "type", title: "Type", meta: "02" },
            { id: "parts", title: "Parts", meta: "03" },
            { id: "motion", title: "Motion", meta: "04" },
            { id: "ship", title: "Ship it", meta: "05" },
          ]}
          aria-label="Chapters"
        />
      </div>
    </Exhibit>
  )
}

function ReactionsExhibit() {
  return (
    <Exhibit name="Reactions" shelf="Special components">
      <p className="m-0 text-sm">
        Shipped the theme creator. Try tinting the grays.
      </p>
      <Reactions
        particles={0}
        defaultReactions={[
          { emoji: "\u{1F44D}", label: "Thumbs up", count: 12, active: true },
          { emoji: "\u{1F389}", label: "Party", count: 5 },
          { emoji: "\u{1F440}", label: "Eyes", count: 2 },
        ]}
      />
    </Exhibit>
  )
}

function Loading() {
  return (
    <Exhibit name="Pixel snail, Progress and Skeleton">
      <div className="flex items-center gap-4">
        <PixelSnail size="sm" label="Loading your projects" />
        <Progress value={42} className="flex-1">
          <ProgressLabel>Importing</ProgressLabel>
          <ProgressValue />
        </Progress>
      </div>
      <div className="flex items-center gap-3" aria-busy="true">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Exhibit>
  )
}

// Toast renders into a portal on the body, outside the scene, so its look
// is drawn here with the same tokens rather than raised for real.
function Notices() {
  const rows = [
    ["success", "Deployed to production"],
    ["warning", "Storage is 92% full"],
    ["destructive", "Payment failed"],
  ] as const
  return (
    <Exhibit name="Toast">
      <div className="flex flex-col gap-2">
        {rows.map(([role, text]) => (
          <div
            key={role}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-popover px-3.5 py-3 text-sm text-popover-foreground shadow-sm"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: `var(--${role})` }}
            />
            <span className="flex-1 font-medium">{text}</span>
          </div>
        ))}
      </div>
    </Exhibit>
  )
}

function Team() {
  return (
    <Exhibit name="Avatar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
            <AvatarBadge className="bg-success" />
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Ada Lovelace</span>
            <span className="text-xs text-muted-foreground">Owner</span>
          </div>
        </div>
        <AvatarGroup>
          {["GH", "KJ", "MB"].map((initials) => (
            <Avatar key={initials}>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+4</AvatarGroupCount>
        </AvatarGroup>
      </div>
    </Exhibit>
  )
}

function Flow() {
  return (
    <Exhibit name="Token flow" shelf="Special components" className="mb-0">
      <TokenFlow
        rows={[
          {
            base: "oklch(0.205 0 0)",
            primitive: "neutral-900",
            semantic: "bg-primary",
            dark: { base: "oklch(0.985 0 0)", primitive: "neutral-50" },
          },
          {
            base: "oklch(0.505 0.213 27.518)",
            primitive: "red-700",
            semantic: "text-destructive",
            dark: { base: "oklch(0.704 0.191 22.216)", primitive: "red-400" },
          },
        ]}
      />
    </Exhibit>
  )
}

/**
 * The theme on a stage of real fibo parts, every one reading the semantic
 * tokens set on the canvas, in the mode chosen.
 */
function ThemeScene({ theme, mode }: { theme: Theme; mode: Mode }) {
  const vars = cssVariables(theme, mode)
  return (
    <div
      data-mode={mode}
      className={cn(
        mode === "dark" && "dark",
        "flex flex-col gap-4 rounded-2xl border border-border bg-muted p-4 font-sans text-foreground sm:p-6"
      )}
      style={{ ...vars, fontFamily: "var(--font-sans)" } as CSSProperties}
    >
      <Palette theme={theme} mode={mode} />
      <div className="columns-1 gap-4 md:columns-2 2xl:columns-3">
        <Type theme={theme} />
        <Actions />
        <Filters />
        <Integrations />
        <Forms />
        <ReactionsExhibit />
        <Chapters />
        <Loading />
        <Notices />
        <Team />
      </div>
      <Flow />
    </div>
  )
}

export { ThemeScene }
