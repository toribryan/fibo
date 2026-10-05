import { useState } from "react"

/*
 * Specimens for the Spacing, Elevation and Motion foundations. Each list is
 * what the components use today, so the pages describe fibo rather than
 * Tailwind's whole range.
 */

const SPACING = [
  {
    step: "0.5",
    use: "Tight stacks, such as a nav item's icon over its label.",
  },
  {
    step: "1",
    use: "Icon to label in xs and sm buttons; a popover's inner padding.",
  },
  { step: "1.5", use: "Icon to label in lg buttons; gaps in a toolbar." },
  {
    step: "2",
    use: "The default gap: items in a row, a label over its control.",
  },
  { step: "3", use: "Padding inside a cell or card; a checkbox to its label." },
  { step: "4", use: "Padding inside a panel; fields in a dense form." },
  { step: "6", use: "Fields in a form; groups inside a panel." },
  { step: "8", use: "Sections of a page." },
  { step: "12", use: "Generous breaks, such as around an empty state." },
] as const

function SpacingScale() {
  return (
    <div className="my-6 flex flex-col">
      {SPACING.map(({ step, use }) => (
        <div
          key={step}
          className="flex flex-col gap-2 border-b border-border py-3 sm:flex-row sm:items-center sm:gap-6"
        >
          <div className="flex w-28 shrink-0 flex-col gap-0.5">
            <code className="text-sm font-medium">{step}</code>
            <code className="font-mono text-xs text-muted-foreground">
              {Number(step) * 4}px
            </code>
          </div>
          <span aria-hidden="true" className="flex w-12 shrink-0">
            <span
              className="h-3 rounded-sm bg-foreground"
              style={{ width: `${Number(step) * 4}px` }}
            />
          </span>
          <p className="m-0 min-w-0 text-sm text-muted-foreground">{use}</p>
        </div>
      ))}
    </div>
  )
}

const HEIGHTS = [
  { size: "xs", px: 24, className: "h-6" },
  { size: "sm", px: 32, className: "h-8" },
  { size: "default", px: 36, className: "h-9" },
  { size: "lg", px: 40, className: "h-10" },
] as const

function ControlHeights() {
  return (
    <div className="my-6 flex flex-wrap items-end gap-4">
      {HEIGHTS.map(({ size, px, className }) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <span
            className={`${className} flex w-20 items-center justify-center rounded-md border border-border bg-muted text-xs font-medium`}
          >
            {size}
          </span>
          <code className="font-mono text-xs text-muted-foreground">
            {px}px
          </code>
        </div>
      ))}
    </div>
  )
}

const ELEVATION = [
  {
    level: "Flat",
    className: "",
    use: "Most surfaces: cards, tables, inputs. A hairline border sets them off.",
    parts: "Data table, Input, Message list",
  },
  {
    level: "shadow-xs",
    className: "shadow-xs",
    use: "A surface raised a hair off another, such as a card inside a panel.",
    parts: "Command menu (inset), Integration visual, Voice memo",
  },
  {
    level: "shadow-sm",
    className: "shadow-sm",
    use: "Something you grab: a thumb, a handle, a pin.",
    parts: "Slider, Switch, Chapter scrubber, Map pin",
  },
  {
    level: "shadow-md",
    className: "shadow-md",
    use: "A popup anchored to what opened it.",
    parts: "Menu, Select, Jump bar",
  },
  {
    level: "shadow-lg",
    className: "shadow-lg",
    use: "A layer over the page: a dialog, sheet, toast or floating bar.",
    parts: "Command menu, Sheet, Toast, Floating nav, Reactions",
  },
] as const

function ElevationLevels() {
  return (
    <div className="my-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ELEVATION.map(({ level, className, use, parts }) => (
        <div key={level} className="flex flex-col gap-3">
          <div
            className={`${className} flex h-24 items-center justify-center rounded-xl border border-border bg-popover`}
          >
            <code className="text-sm font-medium">{level}</code>
          </div>
          <p className="m-0 text-sm">{use}</p>
          <p className="m-0 text-xs text-muted-foreground">{parts}</p>
        </div>
      ))}
    </div>
  )
}

const DURATIONS = [
  { ms: 100, use: "Tooltips, menus and selects opening and closing." },
  { ms: 150, use: "Small state changes: hover fills, a reaction's pop." },
  { ms: 200, use: "Colour and size settling, such as a nav's lens." },
  {
    ms: 300,
    use: "Something crossing a distance: a progress bar, a pin's card.",
  },
] as const

/** Each duration moves a dot across the same track, so they compare side by side. */
function DurationScale() {
  const [moved, setMoved] = useState(false)
  return (
    <div className="my-6 flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setMoved((value) => !value)}
        className="w-fit rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        {moved ? "Move back" : "Play"}
      </button>
      {DURATIONS.map(({ ms, use }) => (
        <div
          key={ms}
          className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:gap-6"
        >
          <code className="w-28 shrink-0 text-sm font-medium">
            duration-{ms}
          </code>
          <div className="relative h-4 w-full max-w-48 shrink-0 rounded-full bg-muted">
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 size-4 rounded-full bg-foreground ease-out motion-reduce:transition-none"
              style={{
                transitionProperty: "transform",
                transitionDuration: `${ms}ms`,
                transform: moved ? "translateX(11rem)" : "none",
              }}
            />
          </div>
          <p className="m-0 min-w-0 text-sm text-muted-foreground">{use}</p>
        </div>
      ))}
    </div>
  )
}

/** A popup entering and leaving the way Menu, Select and Tooltip do. */
function EnterExit() {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-6 flex h-40 flex-col items-start gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      >
        {open ? "Close" : "Open"}
      </button>
      <div
        data-open={open ? "" : undefined}
        data-closed={open ? undefined : ""}
        className="w-48 origin-top-left rounded-lg border border-border bg-popover p-1 text-sm shadow-md duration-100 motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-2 data-closed:pointer-events-none data-closed:animate-out data-closed:fade-out-0 data-closed:fill-mode-forwards data-closed:zoom-out-95 motion-reduce:data-closed:opacity-0"
      >
        {["Rename", "Duplicate", "Archive"].map((item) => (
          <div key={item} className="rounded-md px-2 py-1.5">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export {
  ControlHeights,
  DurationScale,
  ElevationLevels,
  EnterExit,
  SpacingScale,
}
