import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import {
  CheckIcon,
  DownloadIcon,
  LinkIcon,
  MoonIcon,
  RotateCcwIcon,
  ShuffleIcon,
  SunIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
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
  decodeTheme,
  encodeTheme,
  figmaTokens,
  neutralRamp,
  themeCss,
  tokens,
  type Check,
  type Mode,
  type Owner,
  type StatusRole,
  type Theme,
} from "@workspace/ui/lib/theme"
import { cn } from "@workspace/ui/lib/utils"

import { CopyButton } from "./install.js"
import { ThemeScene } from "./theme-scene.js"

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

// Fonts other than Geist come from Google Fonts, fetched once each.
function loadFont(font: string) {
  if (font === "System" || font.startsWith("Geist")) return
  const id = `theme-font-${font.replace(/\s+/g, "-")}`
  if (document.getElementById(id)) return
  const link = document.createElement("link")
  link.id = id
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, "+")}:wght@400;500;600&display=swap`
  document.head.append(link)
}

function fontFamily(font: string, kind: "sans" | "mono") {
  return font === "System" ? `var(--font-${kind})` : `"${font}", ${kind}-serif`
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

function Readout({ children }: { children: ReactNode }) {
  return (
    <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
      {children}
    </span>
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
      <Readout>{Math.round(value)}°</Readout>
    </div>
  )
}

/*
 * One setting in the panel, as a pill in fibo's own style: a small picture
 * of the value, the setting's name and its current value. Pressing it opens
 * the control beside the panel, with any contrast failures it causes.
 */
function Tile({
  label,
  value,
  indicator,
  failing = 0,
  onOpen,
  children,
}: {
  label: string
  value: string
  indicator: ReactNode
  failing?: number
  onOpen?: () => void
  children: ReactNode
}) {
  return (
    <PopoverPrimitive.Root
      onOpenChange={(open) => {
        if (open) onOpen?.()
      }}
    >
      <PopoverPrimitive.Trigger className="group/tile flex h-11 w-full items-center gap-2.5 rounded-4xl border border-border bg-input-subtle pr-4 pl-3 text-left text-sm outline-none hover:bg-input-subtle-hover focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle data-popup-open:bg-muted">
        <span
          className="flex size-5 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          {indicator}
        </span>
        {/* The label darkens with the fill on hover, so it keeps its
            contrast against it. */}
        <span className="flex-1 text-muted-foreground group-hover/tile:text-foreground group-data-popup-open/tile:text-foreground">
          {label}
        </span>
        <span className="max-w-28 truncate font-medium">{value}</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            aria-label={label}
            className="flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <PopoverPrimitive.Title className="m-0 text-sm font-medium">
              {label}
            </PopoverPrimitive.Title>
            {/* Failures show here, in the setting's own menu, rather than
                crowding the panel; the count at its foot sums them up. */}
            {failing ? (
              <p className="m-0 flex items-center gap-1.5 text-xs font-medium text-destructive">
                <TriangleAlertIcon aria-hidden="true" className="size-3.5" />
                {failing} contrast {failing === 1 ? "failure" : "failures"}
              </p>
            ) : null}
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function Modal({
  title,
  trigger,
  children,
}: {
  title: string
  trigger: React.ReactElement
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger render={trigger} />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-popover-overlay backdrop-blur-sm motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="m-0 text-lg font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={<Button size="icon-sm" variant="ghost" />}
              aria-label="Close"
            >
              <XIcon />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Report({ checks }: { checks: Check[] }) {
  const labels = [...new Set(checks.map((c) => c.label))]
  const find = (label: string, mode: Mode) =>
    checks.find((c) => c.label === label && c.mode === mode)!
  const failures = checks.filter((c) => !c.pass).length
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm text-muted-foreground">
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

const OUTPUTS = ["CSS", "Figma"] as const
type Output = (typeof OUTPUTS)[number]

function Export({ theme }: { theme: Theme }) {
  const [output, setOutput] = useState<Output>("CSS")
  const text = useMemo(
    () =>
      output === "CSS"
        ? themeCss(theme)
        : JSON.stringify(figmaTokens(theme), null, 2),
    [output, theme]
  )

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
        <div role="group" aria-label="Format" className="flex gap-1">
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
          : "W3C design tokens with a Light and a Dark mode, for Figma's variables import."}
      </p>
      {/* It scrolls, so it takes focus: keyboard users can scroll it too. */}
      <pre
        tabIndex={0}
        role="region"
        aria-label={`${output} output`}
        className="m-0 max-h-96 overflow-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
      >
        {text}
      </pre>
    </div>
  )
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

// A new theme to react to: a gray or a tint, a radius, sometimes an accent,
// and a pair of fonts. Status hues stay put, since they carry meaning.
function shuffle(theme: Theme): Theme {
  const custom = Math.random() < 0.4
  return {
    ...theme,
    neutral: custom
      ? {
          preset: "custom",
          hue: Math.floor(Math.random() * 360),
          amount: 0.3 + Math.random() * 0.7,
        }
      : { preset: pick(NEUTRAL_PRESETS) },
    radius: pick([0, 4, 6, 8, 10, 12, 16, 20]),
    accent: {
      on: Math.random() < 0.6,
      hue: Math.floor(Math.random() * 360),
    },
    fonts: { sans: pick(SANS_FONTS), mono: pick(MONO_FONTS) },
  }
}

/*
 * The editor is a panel docked beside the stage, in fibo's own design
 * language: a card surface, hairlines and pill controls. It stays in the
 * site's theme and never takes on the one being made, and it stays in view
 * while the stage scrolls.
 */
function Panel({
  theme,
  setTheme,
  checks,
  mode,
  setMode,
}: {
  theme: Theme
  setTheme: (theme: Theme) => void
  checks: Check[]
  mode: Mode
  setMode: (mode: Mode) => void
}) {
  const [copied, setCopied] = useState(false)
  const set = (patch: Partial<Theme>) => setTheme({ ...theme, ...patch })
  const failing = (owner: Owner) =>
    checks.filter((c) => !c.pass && c.owner === owner).length
  const failures = checks.filter((c) => !c.pass).length
  const n = theme.neutral
  const light = tokens(theme, "light")

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  return (
    <aside
      aria-label="Theme settings"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground lg:sticky lg:top-2 lg:max-h-[calc(100vh-1rem)] lg:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-base font-semibold">Theme creator</h1>
          <p className="m-0 text-xs text-muted-foreground">
            Every part on the stage is a real fibo component, reading the
            theme&apos;s tokens.
          </p>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Reset to fibo"
          onClick={() => setTheme(DEFAULT_THEME)}
        >
          <RotateCcwIcon />
        </Button>
      </div>

      <div
        role="group"
        aria-label="Preview mode"
        className="grid grid-cols-2 rounded-4xl border border-border bg-input-subtle p-0.5"
      >
        {(
          [
            ["light", SunIcon, "Light"],
            ["dark", MoonIcon, "Dark"],
          ] as const
        ).map(([value, Icon, label]) => (
          <Button
            key={value}
            size="sm"
            variant={mode === value ? "secondary" : "ghost"}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className="h-7"
          >
            <Icon data-icon="inline-start" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Tile
          label="Base color"
          value={
            n.preset === "custom"
              ? `Custom, ${Math.round(n.hue)}°`
              : `${n.preset[0]!.toUpperCase()}${n.preset.slice(1)}`
          }
          indicator={
            <Swatch color={toCss(neutralRamp(n)[500])} className="size-5" />
          }
          failing={failing("neutral")}
        >
          <RadioGroup
            aria-label="Base color"
            value={n.preset}
            onValueChange={(preset) =>
              set({
                neutral:
                  preset === "custom"
                    ? { preset: "custom", hue: 250, amount: 0.5 }
                    : { preset: preset as (typeof NEUTRAL_PRESETS)[number] },
              })
            }
            className="grid grid-cols-2 gap-2"
          >
            {[...NEUTRAL_PRESETS, "custom" as const].map((preset) => (
              <Label
                key={preset}
                className="gap-2 rounded-md border border-border px-2.5 py-2 font-normal capitalize has-data-checked:border-ring"
              >
                <RadioGroupItem value={preset} />
                <Swatch
                  color={
                    preset === "custom"
                      ? "conic-gradient(oklch(0.6 0.06 0), oklch(0.6 0.06 120), oklch(0.6 0.06 240), oklch(0.6 0.06 360))"
                      : toCss(neutralRamp({ preset })[500])
                  }
                  className="size-3.5"
                />
                {preset}
              </Label>
            ))}
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
                <Readout>{Math.round(n.amount * 100)}%</Readout>
              </div>
            </div>
          ) : null}
        </Tile>

        <Tile
          label="Accent"
          value={theme.accent.on ? `${Math.round(theme.accent.hue)}°` : "None"}
          indicator={
            <Swatch
              color={
                theme.accent.on ? toCss(light.primary!.color) : "transparent"
              }
              className={cn("size-5", !theme.accent.on && "border-dashed")}
            />
          }
          failing={failing("accent")}
        >
          <Label className="font-normal">
            <Switch
              checked={theme.accent.on}
              onCheckedChange={(on) => set({ accent: { ...theme.accent, on } })}
            />
            Give primary a hue
          </Label>
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
              fibo has no brand hue: primary is a neutral, and color only
              carries meaning.
            </p>
          )}
        </Tile>

        <Tile
          label="Status colors"
          value="4 hues"
          indicator={
            <span className="flex -space-x-1.5">
              {STATUS_ROLES.map((role) => (
                <Swatch
                  key={role}
                  color={toCss(light[role]!.color)}
                  className="size-3.5 ring-2 ring-card"
                />
              ))}
            </span>
          }
        >
          {STATUS_ROLES.map((role) => (
            <div key={role} className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-xs">
                {STATUS_NAMES[role]}
                {failing(role) ? (
                  <span className="text-destructive">
                    {failing(role)} contrast{" "}
                    {failing(role) === 1 ? "failure" : "failures"}
                  </span>
                ) : null}
              </span>
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
        </Tile>

        <Tile
          label="Radius"
          value={`${theme.radius}px`}
          indicator={
            <span
              className="size-5 border-t-2 border-r-2 border-foreground"
              style={{ borderTopRightRadius: Math.max(2, theme.radius) }}
            />
          }
        >
          <div className="flex items-center gap-3">
            <Slider
              min={0}
              max={20}
              value={theme.radius}
              onValueChange={(radius) => set({ radius: radius as number })}
              aria-label="Radius"
            />
            <Readout>{theme.radius}px</Readout>
          </div>
        </Tile>

        {(["sans", "mono"] as const).map((kind) => {
          const options = kind === "sans" ? SANS_FONTS : MONO_FONTS
          return (
            <Tile
              key={kind}
              label={kind === "sans" ? "Font" : "Mono font"}
              value={theme.fonts[kind]}
              indicator={
                <span
                  className="text-lg leading-none"
                  style={{ fontFamily: fontFamily(theme.fonts[kind], kind) }}
                >
                  Aa
                </span>
              }
              onOpen={() => options.forEach(loadFont)}
            >
              <RadioGroup
                aria-label={kind === "sans" ? "Font" : "Mono font"}
                value={theme.fonts[kind]}
                onValueChange={(font) =>
                  set({ fonts: { ...theme.fonts, [kind]: font } })
                }
                className="gap-1"
              >
                {options.map((font) => (
                  <Label
                    key={font}
                    className="gap-2.5 rounded-md px-2 py-1.5 font-normal hover:bg-muted"
                  >
                    <RadioGroupItem value={font} />
                    <span
                      className="flex-1 text-base"
                      style={{ fontFamily: fontFamily(font, kind) }}
                    >
                      {font}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </Tile>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Modal
          title="Contrast"
          trigger={
            <Button
              variant="outline"
              className={cn("w-full", failures && "text-destructive")}
            >
              {failures ? (
                <TriangleAlertIcon
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              ) : (
                <CheckIcon data-icon="inline-start" aria-hidden="true" />
              )}
              {failures
                ? `${failures} contrast ${failures === 1 ? "issue" : "issues"}`
                : "Clears AA"}
            </Button>
          }
        >
          <Report checks={checks} />
        </Modal>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setTheme(shuffle(theme))}>
            <ShuffleIcon data-icon="inline-start" aria-hidden="true" />
            Shuffle
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(shareLink(theme))
              setCopied(true)
            }}
          >
            {copied ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <LinkIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
        <Modal
          title="Get code"
          trigger={<Button className="w-full">Get code</Button>}
        >
          <Export theme={theme} />
        </Modal>
      </div>
    </aside>
  )
}

/**
 * Visual first: a panel of settings beside a stage of real fibo parts that
 * takes the theme on as it changes, in either mode.
 */
function ThemeCreator() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  // The preview starts in the site's own mode.
  const [mode, setMode] = useState<Mode>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  )
  const checks = useMemo(() => checkContrast(theme), [theme])
  useEffect(() => {
    loadFont(theme.fonts.sans)
    loadFont(theme.fonts.mono)
  }, [theme.fonts.sans, theme.fonts.mono])

  return (
    <div className="fibo-studio grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <Panel
        theme={theme}
        setTheme={setTheme}
        checks={checks}
        mode={mode}
        setMode={setMode}
      />
      <section aria-label="Preview" className="min-w-0">
        <ThemeScene theme={theme} mode={mode} />
      </section>
    </div>
  )
}

export { ThemeCreator }
