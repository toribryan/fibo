import { useId, type CSSProperties, type ReactNode } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  InfoIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  Share2Icon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Kbd } from "@workspace/ui/components/kbd"
import { Label } from "@workspace/ui/components/label"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { toCss } from "@workspace/ui/lib/color"
import {
  cssVariables,
  neutralRamp,
  tokens,
  type Mode,
  type Theme,
} from "@workspace/ui/lib/theme"
import { cn } from "@workspace/ui/lib/utils"

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

function Card({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "mb-4 flex break-inside-avoid flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground",
        className
      )}
    >
      {title ? (
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-base font-semibold">{title}</h2>
          {description ? (
            <p className="m-0 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

// The generated ramps, laid out the way Radix shows a scale: neutral steps
// across, then the colours that carry meaning.
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
    <section
      aria-label="Palette"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground"
    >
      <div className="grid grid-cols-11 gap-1.5">
        {STEPS.map((step) => (
          <div key={step} className="flex flex-col gap-1.5">
            <span
              className="h-10 rounded-md border border-border"
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
            <span className="flex h-10 overflow-hidden rounded-md border border-border">
              <span
                className="flex-[2]"
                style={{ background: toCss(t[role]!.color) }}
              />
              <span
                className="flex-1"
                style={{
                  background: `var(--${role === "primary" ? "primary-subtle" : `${role}-subtle`})`,
                }}
              />
            </span>
            <span className="font-mono text-[10px] text-muted-foreground capitalize">
              {role}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Tokens({ theme }: { theme: Theme }) {
  const names = [
    "background",
    "foreground",
    "primary",
    "secondary",
    "muted",
    "accent",
    "border",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
  ]
  const base =
    theme.neutral.preset === "custom" ? "Custom tint" : theme.neutral.preset
  return (
    <Card
      title={`${base[0]!.toUpperCase()}${base.slice(1)} · ${theme.fonts.sans}`}
      description="Designers love packing quirky glyphs into test phrases. This is the theme at a glance."
    >
      <div className="grid grid-cols-6 gap-2">
        {names.map((name) => (
          <div key={name} className="flex min-w-0 flex-col gap-1">
            <span
              className="aspect-square rounded-md border border-border"
              style={{ background: `var(--${name})` }}
            />
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              --{name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Typography({ theme }: { theme: Theme }) {
  return (
    <Card>
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        {theme.fonts.sans} · {theme.fonts.mono}
      </span>
      <h2 className="m-0 text-3xl leading-tight font-semibold tracking-tight">
        Designing with rhythm and hierarchy.
      </h2>
      <p className="m-0 text-base leading-relaxed text-muted-foreground">
        A strong body style keeps long-form content readable and balances the
        visual weight of headings. Numbers like{" "}
        <code className="rounded-sm bg-muted px-1 font-mono text-sm text-foreground">
          1,284.60
        </code>{" "}
        sit in the mono face.
      </p>
      <Button variant="outline" className="w-full">
        Share feedback
      </Button>
    </Card>
  )
}

function Toolbar() {
  const icons = [
    [CopyIcon, "Copy"],
    [InfoIcon, "Info"],
    [Trash2Icon, "Delete"],
    [Share2Icon, "Share"],
    [PlusIcon, "Add"],
    [ArrowLeftIcon, "Back"],
    [ArrowRightIcon, "Forward"],
    [CheckIcon, "Done"],
    [SearchIcon, "Search"],
    [SettingsIcon, "Settings"],
  ] as const
  return (
    <Card>
      <div className="grid grid-cols-5 gap-2">
        {icons.map(([Icon, label]) => (
          <Button key={label} size="icon" variant="outline" aria-label={label}>
            <Icon />
          </Button>
        ))}
      </div>
    </Card>
  )
}

function Controls() {
  const id = useId()
  return (
    <Card>
      <div className="flex flex-wrap gap-2">
        <Button>Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Two-factor authentication</span>
          <span className="text-sm text-muted-foreground">
            Verify via email or phone number.
          </span>
        </div>
        <Button size="sm" variant="secondary">
          Enable
        </Button>
      </div>
      <Slider defaultValue={[64]} aria-label="Volume" />
      <div className="relative">
        <Input placeholder="Name" aria-label="Name" className="pr-9" />
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      <Textarea placeholder="Message" aria-label="Message" />
      <div className="flex flex-wrap items-center gap-3">
        <Badge>Badge</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <RadioGroup
          defaultValue="on"
          aria-label="Choice"
          className="flex w-auto gap-2"
        >
          <RadioGroupItem value="on" aria-label="On" />
          <RadioGroupItem value="off" aria-label="Off" />
        </RadioGroup>
        <Checkbox defaultChecked aria-label="Checked" />
        <Checkbox aria-label="Unchecked" />
        <Switch defaultChecked aria-label="Enabled" className="ml-auto" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`${id}-terms`} />
        <Label htmlFor={`${id}-terms`} className="font-normal">
          Accept terms and conditions
        </Label>
      </div>
    </Card>
  )
}

function Environment() {
  const rows = [
    ["DATABASE_URL", "••••••••"],
    ["NEXT_PUBLIC_API", "https://api.example.com"],
    ["STRIPE_SECRET", "••••••••"],
  ]
  return (
    <Card title="Environment variables" description="Production · 8 variables">
      <div className="flex flex-col gap-2">
        {rows.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 font-mono text-xs"
          >
            <span>{key}</span>
            <span className="truncate text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button size="sm" variant="outline">
          Edit
        </Button>
        <Button size="sm">Deploy</Button>
      </div>
    </Card>
  )
}

function Traffic() {
  const months = [
    ["Jan", 62, 30],
    ["Feb", 88, 58],
    ["Mar", 70, 36],
    ["Apr", 24, 57],
    ["May", 66, 48],
    ["Jun", 74, 50],
  ] as const
  return (
    <Card
      title="Traffic channels"
      description="Monthly desktop and mobile visits for the last six months."
    >
      <div
        role="img"
        aria-label="Bar chart of desktop and mobile visits, January to June"
        className="flex h-36 items-end justify-between gap-2 border-b border-border"
      >
        {months.map(([month, desktop, mobile]) => (
          <div key={month} className="flex h-full flex-1 items-end gap-1">
            <span
              className="flex-1 rounded-t-sm"
              style={{ height: `${desktop}%`, background: "var(--chart-2)" }}
            />
            <span
              className="flex-1 rounded-t-sm"
              style={{ height: `${mobile}%`, background: "var(--chart-4)" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {months.map(([month]) => (
          <span key={month} className="flex-1 text-center">
            {month}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 divide-x divide-border text-center">
        {[
          ["Desktop", "1,224"],
          ["Mobile", "860"],
          ["Mix", "+42%"],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground uppercase">
              {label}
            </span>
            <span className="font-mono text-lg font-medium tabular-nums">
              {value}
            </span>
          </div>
        ))}
      </div>
      <Button className="w-full">View report</Button>
    </Card>
  )
}

function SignUp() {
  const id = useId()
  return (
    <Card title="Create an account" description="Start your 14-day trial.">
      {[
        ["name", "Full name", "Enter your name"],
        ["email", "Email", "you@example.com"],
        ["password", "Password", "At least 8 characters"],
      ].map(([key, label, placeholder]) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-${key}`}>{label}</Label>
          <Input
            id={`${id}-${key}`}
            type={key === "password" ? "password" : "text"}
            placeholder={placeholder}
          />
        </div>
      ))}
      <Button className="w-full">Create account</Button>
      <p className="m-0 text-center text-xs text-muted-foreground">
        Already have one?{" "}
        <span className="text-foreground underline">Sign in</span>
      </p>
    </Card>
  )
}

function Status() {
  const rows = [
    ["success", CheckIcon, "Deployed to production."],
    ["info", InfoIcon, "A new version is ready."],
    ["warning", TriangleAlertIcon, "Storage is 92% full."],
    ["destructive", TriangleAlertIcon, "Payment failed. Update your card."],
  ] as const
  return (
    <Card title="Notifications">
      <div className="flex flex-col gap-2">
        {rows.map(([role, Icon, text]) => (
          <div
            key={role}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{
              background: `var(--${role}-subtle)`,
              color: `var(--${role})`,
            }}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="destructive">
          Remove card
        </Button>
        <Button size="sm" variant="ghost">
          Dismiss
        </Button>
      </div>
    </Card>
  )
}

function Team() {
  const people = [
    ["AL", "Ada Lovelace", "ada@example.com", "Owner"],
    ["GH", "Grace Hopper", "grace@example.com", "Editor"],
    ["KJ", "Katherine Johnson", "kj@example.com", "Viewer"],
  ]
  return (
    <Card title="Invite team" description="Add members to your workspace.">
      <div className="flex gap-2">
        <Input placeholder="name@example.com" aria-label="Email address" />
        <Button variant="secondary">Invite</Button>
      </div>
      <div className="flex flex-col gap-3">
        {people.map(([initials, name, email, role], index) => (
          <div key={email} className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
              {index === 0 ? <AvatarBadge className="bg-success" /> : null}
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {email}
              </span>
            </div>
            <Badge variant={index === 0 ? "default" : "outline"}>{role}</Badge>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <AvatarGroup>
          {["MB", "RT", "SC"].map((initials) => (
            <Avatar key={initials} size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount className="size-6">+5</AvatarGroupCount>
        </AvatarGroup>
        <Button size="sm" variant="ghost" aria-label="More">
          <EllipsisIcon />
        </Button>
      </div>
    </Card>
  )
}

function Tasks() {
  const id = useId()
  const tasks = [
    ["Respond to comment #384", true],
    ["Invite the design team", false],
    ["Ship the theme creator", false],
  ] as const
  return (
    <Card title="Today" description="3 tasks · 1 done">
      <div className="flex flex-col gap-3">
        {tasks.map(([task, done], index) => (
          <div key={task} className="flex items-center gap-2">
            <Checkbox id={`${id}-${index}`} defaultChecked={done} />
            <Label
              htmlFor={`${id}-${index}`}
              className={cn(
                "font-normal",
                done && "text-muted-foreground line-through"
              )}
            >
              {task}
            </Label>
          </div>
        ))}
      </div>
      <Progress value={33}>
        <ProgressLabel>Progress</ProgressLabel>
        <ProgressValue />
      </Progress>
      <p className="m-0 text-xs text-muted-foreground">
        Press <Kbd>N</Kbd> for a new task, or <Kbd>⌘</Kbd> <Kbd>K</Kbd> to
        search.
      </p>
    </Card>
  )
}

/**
 * The theme applied to a scene of real fibo parts: every card reads the
 * semantic tokens set on the canvas, in the mode chosen.
 */
function ThemeScene({ theme, mode }: { theme: Theme; mode: Mode }) {
  const vars = cssVariables(theme, mode)
  return (
    <div
      data-mode={mode}
      className={cn(
        mode === "dark" && "dark",
        "flex flex-col gap-4 rounded-2xl bg-muted p-4 font-sans text-foreground sm:p-6"
      )}
      style={{ ...vars, fontFamily: "var(--font-sans)" } as CSSProperties}
    >
      <Palette theme={theme} mode={mode} />
      <div className="columns-1 gap-4 md:columns-2 2xl:columns-3">
        <Tokens theme={theme} />
        <Typography theme={theme} />
        <Controls />
        <Toolbar />
        <Environment />
        <Traffic />
        <Status />
        <SignUp />
        <Team />
        <Tasks />
      </div>
    </div>
  )
}

export { ThemeScene }
