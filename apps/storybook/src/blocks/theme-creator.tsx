import {
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import {
  CheckIcon,
  DownloadIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { toCss } from "@workspace/ui/lib/color"
import {
  DEFAULT_THEME,
  MONO_FONTS,
  NEUTRAL_PRESETS,
  SANS_FONTS,
  STATUS_ROLES,
  checkContrast,
  cssVariables,
  decodeTheme,
  encodeTheme,
  figmaTokens,
  neutralRamp,
  themeCss,
  type Check,
  type Mode,
  type Owner,
  type StatusRole,
  type Theme,
} from "@workspace/ui/lib/theme"
import { cn } from "@workspace/ui/lib/utils"

import { CopyButton } from "./install.js"

const DOCS_ID = "foundations-theme-creator--docs"

const STATUS_NAMES: Record<StatusRole, string> = {
  destructive: "Destructive",
  success: "Success",
  warning: "Warning",
  info: "Info",
}

// The docs render in an iframe on the same origin, so a shared link is read
// from, and built on, the Storybook page around it.
function hostLocation(): Location {
  try {
    return window.top?.location ?? window.location
  } catch {
    return window.location
  }
}

function initialTheme(): Theme {
  const code = new URLSearchParams(hostLocation().search).get("theme")
  return code ? decodeTheme(code) : DEFAULT_THEME
}

// Usually the full Storybook page; the docs frame on its own when it's
// opened directly, which takes an id rather than a path.
function shareLink(theme: Theme) {
  const { origin, pathname } = hostLocation()
  const page = pathname.endsWith("iframe.html")
    ? `id=${DOCS_ID}&viewMode=docs`
    : `path=/docs/${DOCS_ID}`
  return `${origin}${pathname}?${page}&theme=${encodeTheme(theme)}`
}

// Fonts other than Geist are fetched from Google Fonts the first time a
// theme picks them.
function useFont(font: string) {
  useEffect(() => {
    if (font === "System" || font.startsWith("Geist")) return
    const id = `theme-font-${font.replace(/\s+/g, "-")}`
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, "+")}:wght@400;500;600&display=swap`
    document.head.append(link)
  }, [font])
}

function hueTrack(l: number, c: number) {
  const stops = Array.from({ length: 13 }, (_, i) => toCss({ l, c, h: i * 30 }))
  return `linear-gradient(to right, ${stops.join(", ")})`
}

function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border border-border",
        className
      )}
      style={{ background: color }}
    />
  )
}

function Failures({ checks }: { checks: Check[] }) {
  if (checks.length === 0) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
      <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
      {checks.length} contrast {checks.length === 1 ? "failure" : "failures"}
    </span>
  )
}

function Control({
  title,
  failing = [],
  children,
}: {
  title: string
  failing?: Check[]
  children: ReactNode
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-xl border border-border p-4">
      <legend className="float-left flex w-full items-center justify-between gap-2 p-0 text-sm font-medium">
        {title}
        <Failures checks={failing} />
      </legend>
      {children}
    </fieldset>
  )
}

// A hue slider whose track shows the hues it runs through.
function HueSlider({
  label,
  value,
  onChange,
  l = 0.65,
  c = 0.17,
}: {
  label: string
  value: number
  onChange: (hue: number) => void
  l?: number
  c?: number
}) {
  return (
    <div
      className="flex items-center gap-3 [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:bg-(image:--hue-track)"
      style={{ "--hue-track": hueTrack(l, c) } as CSSProperties}
    >
      <Slider
        min={0}
        max={359}
        value={value}
        onValueChange={(next) => onChange(next as number)}
        aria-label={label}
      />
      <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
        {Math.round(value)}°
      </span>
    </div>
  )
}

function Controls({
  theme,
  setTheme,
  failing,
}: {
  theme: Theme
  setTheme: (theme: Theme) => void
  failing: (owner: Owner) => Check[]
}) {
  const id = useId()
  const n = theme.neutral
  const set = (patch: Partial<Theme>) => setTheme({ ...theme, ...patch })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Control title="Neutral" failing={failing("neutral")}>
        <RadioGroup
          aria-label="Neutral ramp"
          value={n.preset}
          onValueChange={(preset) =>
            set({
              neutral:
                preset === "custom"
                  ? { preset: "custom", hue: 250, amount: 0.5 }
                  : { preset: preset as (typeof NEUTRAL_PRESETS)[number] },
            })
          }
          className="grid grid-cols-3 gap-2"
        >
          {[...NEUTRAL_PRESETS, "custom" as const].map((preset) => {
            const swatch =
              preset === "custom"
                ? n.preset === "custom"
                  ? toCss(neutralRamp(n)[500])
                  : "conic-gradient(from 0deg, oklch(0.6 0.05 0), oklch(0.6 0.05 120), oklch(0.6 0.05 240), oklch(0.6 0.05 360))"
                : toCss(neutralRamp({ preset })[500])
            return (
              <div key={preset} className="flex items-center gap-2">
                <RadioGroupItem value={preset} id={`${id}-${preset}`} />
                <Label
                  htmlFor={`${id}-${preset}`}
                  className="gap-1.5 font-normal capitalize"
                >
                  <Swatch color={swatch} className="size-3" />
                  {preset}
                </Label>
              </div>
            )
          })}
        </RadioGroup>
        {n.preset === "custom" ? (
          <div className="flex flex-col gap-2">
            <HueSlider
              label="Tint hue"
              value={n.hue}
              onChange={(hue) => set({ neutral: { ...n, hue } })}
              c={0.08}
            />
            <div className="flex items-center gap-3">
              <Slider
                min={0}
                max={100}
                value={Math.round(n.amount * 100)}
                onValueChange={(amount) =>
                  set({ neutral: { ...n, amount: (amount as number) / 100 } })
                }
                aria-label="Tint amount"
              />
              <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                {Math.round(n.amount * 100)}%
              </span>
            </div>
          </div>
        ) : null}
      </Control>

      <Control title="Radius">
        <div className="flex items-center gap-3">
          <Slider
            min={0}
            max={20}
            value={theme.radius}
            onValueChange={(radius) => set({ radius: radius as number })}
            aria-label="Radius"
          />
          <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
            {theme.radius}px
          </span>
        </div>
        <div className="flex items-end gap-2" aria-hidden="true">
          {[
            ["sm", theme.radius - 4],
            ["md", theme.radius - 2],
            ["lg", theme.radius],
            ["xl", theme.radius + 4],
          ].map(([name, px]) => (
            <span key={name} className="flex flex-col items-center gap-1">
              <span
                className="size-8 border-2 border-foreground"
                style={{ borderRadius: Math.max(0, px as number) }}
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                {name}
              </span>
            </span>
          ))}
        </div>
      </Control>

      <Control title="Accent" failing={failing("accent")}>
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-accent`}
            checked={theme.accent.on}
            onCheckedChange={(on) => set({ accent: { ...theme.accent, on } })}
          />
          <Label htmlFor={`${id}-accent`} className="font-normal">
            Give primary a hue
          </Label>
        </div>
        {theme.accent.on ? (
          <HueSlider
            label="Accent hue"
            value={theme.accent.hue}
            onChange={(hue) => set({ accent: { on: true, hue } })}
            l={0.5}
            c={0.2}
          />
        ) : (
          <p className="m-0 text-xs text-muted-foreground">
            fibo has no brand hue: primary is a neutral, and colour only carries
            meaning.
          </p>
        )}
      </Control>

      <Control title="Fonts">
        {(["sans", "mono"] as const).map((kind) => {
          const options = kind === "sans" ? SANS_FONTS : MONO_FONTS
          return (
            <div key={kind} className="flex items-center justify-between gap-3">
              <Label htmlFor={`${id}-${kind}`} className="font-normal">
                {kind === "sans" ? "Sans" : "Mono"}
              </Label>
              <Select
                value={theme.fonts[kind]}
                onValueChange={(font) =>
                  set({ fonts: { ...theme.fonts, [kind]: font } })
                }
                items={options.map((font) => ({ value: font, label: font }))}
              >
                <SelectTrigger id={`${id}-${kind}`} size="sm" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </Control>

      <div className="sm:col-span-2">
        <Control
          title="Status hues"
          failing={STATUS_ROLES.flatMap((role) => failing(role))}
        >
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {STATUS_ROLES.map((role) => (
              <div key={role} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  {STATUS_NAMES[role]}
                  <Failures checks={failing(role)} />
                </div>
                <HueSlider
                  label={`${STATUS_NAMES[role]} hue`}
                  value={theme.status[role]}
                  onChange={(hue) =>
                    set({ status: { ...theme.status, [role]: hue } })
                  }
                  l={0.55}
                  c={0.17}
                />
              </div>
            ))}
          </div>
        </Control>
      </div>
    </div>
  )
}

/*
 * Real fibo parts inside a container that carries the theme's custom
 * properties. Everything reads semantic tokens, so everything inside picks
 * the theme up. Parts that portal to the body would escape it, so the
 * preview sticks to in-flow ones.
 */
function Preview({ theme, mode }: { theme: Theme; mode: Mode }) {
  const id = useId()
  const vars = cssVariables(theme, mode)
  return (
    <section
      aria-label={`${mode === "dark" ? "Dark" : "Light"} preview`}
      className={cn(
        mode === "dark" && "dark",
        "flex flex-col gap-5 rounded-xl border border-border bg-background p-5 font-sans text-foreground"
      )}
      style={{ ...vars, fontFamily: "var(--font-sans)" } as CSSProperties}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Project settings</span>
          <span className="text-xs text-muted-foreground">
            {mode === "dark" ? "Dark" : "Light"} mode
          </span>
        </div>
        <Avatar size="sm">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>Name</Label>
        <Input id={`${id}-name`} placeholder="Untitled project" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox id={`${id}-public`} defaultChecked />
          <Label htmlFor={`${id}-public`} className="font-normal">
            Anyone with the link can view
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id={`${id}-sync`} defaultChecked />
          <Label htmlFor={`${id}-sync`} className="font-normal">
            Sync changes
          </Label>
        </div>
        <RadioGroup
          defaultValue="weekly"
          aria-label="Backups"
          className="flex gap-4"
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
      </div>

      <Slider defaultValue={[60]} aria-label="Storage limit" />
      <Progress value={42}>
        <ProgressLabel>Uploading</ProgressLabel>
        <ProgressValue />
      </Progress>

      <div className="flex flex-col gap-2">
        {(["success", "warning", "info", "destructive"] as const).map(
          (role) => (
            <div
              key={role}
              className="rounded-md px-3 py-2 text-sm font-medium"
              style={{
                background: `var(--${role}-subtle)`,
                color: `var(--${role})`,
              }}
            >
              {STATUS_NAMES[role]}: something needs your attention
            </div>
          )
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>Live</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="destructive">Failed</Badge>
        <Badge variant="outline">v2</Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          Save with <Kbd>⌘</Kbd> <Kbd>S</Kbd>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm">Save</Button>
        <Button size="sm" variant="secondary">
          Preview
        </Button>
        <Button size="sm" variant="outline">
          Cancel
        </Button>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </div>

      <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
        {`--radius: ${theme.radius}px`}
      </code>
    </section>
  )
}

function Report({ checks }: { checks: Check[] }) {
  const labels = [...new Set(checks.map((c) => c.label))]
  const find = (label: string, mode: Mode) =>
    checks.find((c) => c.label === label && c.mode === mode)!
  const failures = checks.filter((c) => !c.pass).length
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-muted-foreground" aria-live="polite">
        {failures === 0
          ? "Every pair clears WCAG AA in both modes."
          : `${failures} of ${checks.length} checks fall short of WCAG AA.`}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-md border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium">Pair</th>
              <th className="py-2 pr-4 font-medium">Needs</th>
              <th className="py-2 pr-4 font-medium">Light</th>
              <th className="py-2 font-medium">Dark</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label} className="border-b border-border last:border-0">
                <td className="py-2 pr-4">{label}</td>
                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                  {find(label, "light").min}:1
                </td>
                {(["light", "dark"] as const).map((mode) => {
                  const check = find(label, mode)
                  return (
                    <td key={mode} className="py-2 pr-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono text-xs tabular-nums",
                          check.pass ? "text-foreground" : "text-destructive"
                        )}
                      >
                        {check.pass ? (
                          <CheckIcon
                            className="size-3.5 text-success"
                            aria-hidden="true"
                          />
                        ) : (
                          <XIcon className="size-3.5" aria-hidden="true" />
                        )}
                        {check.ratio.toFixed(2)}
                        <span className="sr-only">
                          {check.pass ? ", passes" : ", fails"}
                        </span>
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const OUTPUTS = ["CSS", "Figma", "Link"] as const
type Output = (typeof OUTPUTS)[number]

function Export({ theme }: { theme: Theme }) {
  const [output, setOutput] = useState<Output>("CSS")
  const text = useMemo(() => {
    if (output === "CSS") return themeCss(theme)
    if (output === "Figma") return JSON.stringify(figmaTokens(theme), null, 2)
    return shareLink(theme)
  }, [output, theme])

  const download = () => {
    const blob = new Blob([text], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "fibo-theme.tokens.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Output" className="flex gap-1">
          {OUTPUTS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={option === output ? "secondary" : "ghost"}
              aria-pressed={option === output}
              onClick={() => setOutput(option)}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {output === "Figma" ? (
            <Button size="sm" variant="outline" onClick={download}>
              <DownloadIcon data-icon="inline-start" aria-hidden="true" />
              Download
            </Button>
          ) : null}
          <CopyButton value={text} />
        </div>
      </div>
      <p className="m-0 text-sm text-muted-foreground">
        {output === "CSS"
          ? "Paste these over the :root and .dark blocks in globals.css."
          : output === "Figma"
            ? "W3C design tokens with a Light and a Dark mode, for Figma's variables import."
            : "Opens this page with the theme as it is now."}
      </p>
      {/* It scrolls, so it takes focus: keyboard users can scroll it too. */}
      <pre
        tabIndex={0}
        role="region"
        aria-label={`${output} output`}
        className="m-0 max-h-80 overflow-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
      >
        {text}
      </pre>
    </div>
  )
}

function ThemeCreator() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useFont(theme.fonts.sans)
  useFont(theme.fonts.mono)
  const checks = useMemo(() => checkContrast(theme), [theme])
  const failing = (owner: Owner) =>
    checks.filter((c) => !c.pass && c.owner === owner)

  return (
    <div className="not-prose flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="controls" className="m-0 text-lg font-semibold">
            Controls
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTheme(DEFAULT_THEME)}
          >
            <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
            Reset to fibo
          </Button>
        </div>
        <Controls theme={theme} setTheme={setTheme} failing={failing} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 id="preview" className="m-0 text-lg font-semibold">
          Preview
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Preview theme={theme} mode="light" />
          <Preview theme={theme} mode="dark" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 id="contrast" className="m-0 text-lg font-semibold">
          Contrast
        </h2>
        <Report checks={checks} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 id="export" className="m-0 text-lg font-semibold">
          Export
        </h2>
        <Export theme={theme} />
      </section>
    </div>
  )
}

export { ThemeCreator }
