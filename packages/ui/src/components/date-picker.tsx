"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Calendar, useToday } from "@workspace/ui/components/calendar"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import {
  addDays,
  addMonths,
  clampDate,
  clampRange,
  countDays,
  endOfMonth,
  formatDate,
  formatDateRange,
  isSameDay,
  orderRange,
  startOfMonth,
  type DateRange,
  type DraftRange,
  type WeekStart,
} from "@workspace/ui/lib/dates"
import { useFieldSize, type FieldSize } from "@workspace/ui/lib/field-size"
import { cn } from "@workspace/ui/lib/utils"

/** A shortcut in the rail or chip row, worked out from today when it opens. */
type DateRangePreset = {
  label: string
  range: (today: Date) => DateRange
}

/** A one-day shortcut, worked out from today when it opens. */
type DatePreset = {
  label: string
  date: (today: Date) => Date
}

type DatePickerType = "auto" | "popover" | "drawer"

const defaultDateRangePresets: DateRangePreset[] = [
  { label: "Today", range: (today) => ({ from: today, to: today }) },
  {
    label: "Yesterday",
    range: (today) => ({ from: addDays(today, -1), to: addDays(today, -1) }),
  },
  {
    label: "Last 7 days",
    range: (today) => ({ from: addDays(today, -6), to: today }),
  },
  {
    label: "Last 30 days",
    range: (today) => ({ from: addDays(today, -29), to: today }),
  },
  {
    label: "This month",
    range: (today) => ({ from: startOfMonth(today), to: today }),
  },
  {
    label: "Last month",
    range: (today) => {
      const month = addMonths(startOfMonth(today), -1)
      return { from: month, to: endOfMonth(month) }
    },
  },
  {
    label: "This quarter",
    range: (today) => ({
      from: new Date(
        today.getFullYear(),
        Math.floor(today.getMonth() / 3) * 3,
        1
      ),
      to: today,
    }),
  },
  {
    label: "Year to date",
    range: (today) => ({
      from: new Date(today.getFullYear(), 0, 1),
      to: today,
    }),
  },
]

const defaultDatePresets: DatePreset[] = [
  { label: "Today", date: (today) => today },
  { label: "Tomorrow", date: (today) => addDays(today, 1) },
  { label: "In a week", date: (today) => addDays(today, 7) },
  { label: "In a month", date: (today) => addMonths(today, 1) },
]

// Below Tailwind's sm breakpoint the panel opens as a drawer from the bottom.
// It's decided in script rather than CSS because the two layouts are
// different primitives, not one element restyled. Between sm and md a
// popover has room for one month beside the presets, not two.
const PHONE_QUERY = "(max-width: 639.98px)"
const NARROW_QUERY = "(max-width: 767.98px)"

function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

function usePickerLayout(type: DatePickerType): "popover" | "drawer" {
  const phone = useMediaQuery(PHONE_QUERY)
  if (type !== "auto") return type
  return phone ? "drawer" : "popover"
}

function focusSelectedDay(popup: HTMLElement | null) {
  return (
    popup?.querySelector<HTMLElement>(
      '[data-slot="calendar-day"][tabindex="0"]'
    ) ?? true
  )
}

const triggerClassName =
  "flex w-fit items-center gap-2 rounded-sm border border-input bg-input-subtle px-3 text-sm whitespace-nowrap transition-colors outline-none hover:bg-input-subtle-hover focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive-ring data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"

const popupClassName =
  "flex origin-(--transform-origin) flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none"

type TriggerProps = Omit<
  React.ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "children" | "type"
>

type PickerSharedProps = TriggerProps & {
  /** The earliest day that can be picked. */
  minDate?: Date | null
  /** The latest day that can be picked. */
  maxDate?: Date | null
  /** Return true for a day that can't be picked, such as a weekend. */
  isDateDisabled?: (date: Date) => boolean
  /** The first column of the calendar: 0 for Sunday, 1 for Monday. */
  weekStartsOn?: WeekStart
  /** A BCP 47 locale for the calendar and the formatted value. */
  locale?: string
  /** Names the panel and titles the drawer; names the trigger too unless a FieldLabel or aria-labelledby does. */
  label?: string
  /** Shown in the trigger while nothing is picked. */
  placeholder?: string
  /** "popover" on every screen, "drawer" on every screen, or "auto" for a drawer below the sm breakpoint. */
  type?: DatePickerType
  /** Matches Input at 36 pixels tall, or 32 for dense forms. */
  size?: FieldSize
  /** Whether the panel is open, when you control it. */
  open?: boolean
  /** Opens the panel on first render, when the picker keeps its own state. */
  defaultOpen?: boolean
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** The element the panel portals into; the body by default. */
  container?: PopoverPrimitive.Portal.Props["container"]
  /** Traps focus, blocks the page and moves focus to the calendar on open. Turn off to show the panel inline, as a preview. */
  modal?: boolean
}

function useOpenState(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined
) {
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen)
  const setOpen = (next: boolean) => {
    if (open === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }
  return [open ?? ownOpen, setOpen] as const
}

/*
 * A trigger in a fibo Field is labeled by its FieldLabel, as Input is. Base
 * UI keeps the label's wiring private, so the trigger finds the label in the
 * DOM: it's named by the label followed by the value, and a click on the
 * label focuses it without opening the panel, as it would an input.
 */
function useFieldLabel() {
  const [labelId, setLabelId] = React.useState<string | null>(null)
  const ref = React.useCallback((node: HTMLButtonElement | null) => {
    if (!node) return
    const label = node
      .closest('[data-slot="field"]')
      ?.querySelector<HTMLLabelElement>('label[data-slot="field-label"]')
    setLabelId(label?.id || null)
    if (!label) return
    const focus = () => node.focus()
    label.addEventListener("click", focus)
    return () => label.removeEventListener("click", focus)
  }, [])
  return [labelId, ref] as const
}

type PickerShellProps = {
  layout: "popover" | "drawer"
  open: boolean
  onOpenChange: (open: boolean) => void
  container: PickerSharedProps["container"]
  modal: boolean
  label: string
  slot: "date-picker" | "date-range-picker"
  text: string
  empty: boolean
  size: FieldSize
  triggerProps: TriggerProps
  popover: React.ReactNode
  drawer: React.ReactNode
}

/*
 * One trigger, two homes for the panel. The panel only mounts while open,
 * so each opening starts from the committed value.
 */
function PickerShell({
  layout,
  open,
  onOpenChange,
  container,
  modal,
  label,
  slot,
  text,
  empty,
  size,
  triggerProps: { className, ...triggerProps },
  popover,
  drawer,
}: PickerShellProps) {
  const popupRef = React.useRef<HTMLDivElement>(null)
  const valueId = React.useId()
  // A non-modal panel never pulls focus: focusing would scroll the page to it.
  const initialFocus = () => modal && focusSelectedDay(popupRef.current)
  const [fieldLabelId, fieldRef] = useFieldLabel()

  const labelledBy = triggerProps["aria-labelledby"] ?? fieldLabelId
  const trigger = {
    ...triggerProps,
    ref: fieldRef,
    type: "button" as const,
    "data-slot": slot,
    "data-size": size,
    "data-placeholder": empty ? "" : undefined,
    "aria-labelledby": labelledBy ? `${labelledBy} ${valueId}` : undefined,
    "aria-label": labelledBy
      ? undefined
      : (triggerProps["aria-label"] ?? `${label}: ${text}`),
    className: cn(triggerClassName, className),
    children: (
      <>
        <CalendarIcon aria-hidden="true" />
        <span
          id={valueId}
          data-slot="date-picker-value"
          className="flex-1 text-left"
        >
          {text}
        </span>
        <ChevronDownIcon aria-hidden="true" />
      </>
    ),
  }

  if (layout === "drawer") {
    return (
      <Sheet
        side="bottom"
        open={open}
        onOpenChange={onOpenChange}
        modal={modal}
      >
        <SheetTrigger {...trigger} />
        <SheetContent
          ref={popupRef}
          data-slot="date-picker-drawer"
          showCloseButton={false}
          container={container}
          initialFocus={initialFocus}
          className="h-[85%] gap-0"
        >
          <div
            aria-hidden="true"
            data-slot="date-picker-handle"
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
          />
          <div className="flex shrink-0 items-center justify-between gap-4 py-2 pr-2 pl-4">
            <SheetTitle>{label}</SheetTitle>
            <SheetClose
              data-slot="date-picker-close"
              render={<Button type="button" variant="ghost" size="sm" />}
            >
              Cancel
            </SheetClose>
          </div>
          {drawer}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger {...trigger} />
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            ref={popupRef}
            data-slot="date-picker-popup"
            aria-label={label}
            initialFocus={initialFocus}
            className={popupClassName}
          >
            {popover}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

function PresetButton({
  layout,
  active,
  disabled,
  onClick,
  children,
}: {
  layout: "popover" | "drawer"
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      data-slot="date-picker-preset"
      variant={layout === "drawer" ? "outline" : "ghost"}
      size="sm"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        layout === "drawer"
          ? "shrink-0 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary-hover"
          : "w-full justify-start aria-pressed:bg-muted"
      )}
    >
      {children}
    </Button>
  )
}

function PresetList({
  layout,
  children,
}: {
  layout: "popover" | "drawer"
  children: React.ReactNode
}) {
  return (
    <div
      role="group"
      aria-label="Presets"
      data-slot="date-picker-presets"
      className={
        layout === "drawer"
          ? "flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-3"
          : "flex w-36 shrink-0 flex-col gap-0.5 border-r border-border p-2"
      }
    >
      {children}
    </div>
  )
}

type DateRangePickerProps = PickerSharedProps & {
  /** The applied range, when you control it. */
  value?: DateRange | null
  /** The applied range at first, when the picker keeps its own state. */
  defaultValue?: DateRange | null
  /** Called with the range when Apply is pressed. */
  onChange?: (range: DateRange) => void
  /** Shortcuts beside the calendar. Pass an empty array to leave them out. */
  presets?: DateRangePreset[]
  /** Months side by side in the popover; one below the md breakpoint. The drawer always scrolls. */
  months?: 1 | 2
}

function DateRangePicker({
  value,
  defaultValue = null,
  onChange,
  presets = defaultDateRangePresets,
  months = 2,
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn = 0,
  locale = "en-US",
  label = "Date range",
  placeholder = "Select dates",
  type = "auto",
  size: sizeProp,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  container,
  modal = true,
  ...props
}: DateRangePickerProps) {
  const layout = usePickerLayout(type)
  const narrow = useMediaQuery(NARROW_QUERY)
  const size = useFieldSize(sizeProp)
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange)
  // Counts openings, so a panel reopened mid-way through its exit animation
  // still starts from the applied range rather than the abandoned draft.
  const [opening, setOpening] = React.useState(0)
  const [ownValue, setOwnValue] = React.useState(defaultValue)
  const applied = value !== undefined ? value : ownValue
  const text = applied ? formatDateRange(applied, locale) : placeholder

  function apply(range: DateRange) {
    if (value === undefined) setOwnValue(range)
    onChange?.(range)
    setOpen(false)
  }

  const panel = (
    <DateRangePanel
      key={opening}
      layout={layout}
      initial={applied}
      presets={presets}
      months={narrow ? 1 : months}
      minDate={minDate}
      maxDate={maxDate}
      isDateDisabled={isDateDisabled}
      weekStartsOn={weekStartsOn}
      locale={locale}
      onApply={apply}
      onCancel={() => setOpen(false)}
    />
  )

  return (
    <PickerShell
      layout={layout}
      open={open}
      container={container}
      modal={modal}
      onOpenChange={(next) => {
        if (next) setOpening((n) => n + 1)
        setOpen(next)
      }}
      label={label}
      slot="date-range-picker"
      text={text}
      empty={!applied}
      size={size}
      triggerProps={props}
      popover={panel}
      drawer={panel}
    />
  )
}

function DateRangePanel({
  layout,
  initial,
  presets,
  months,
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn,
  locale,
  onApply,
  onCancel,
}: {
  layout: "popover" | "drawer"
  initial: DateRange | null
  presets: DateRangePreset[]
  months: 1 | 2
  minDate?: Date | null
  maxDate?: Date | null
  isDateDisabled?: (date: Date) => boolean
  weekStartsOn: WeekStart
  locale: string
  onApply: (range: DateRange) => void
  onCancel: () => void
}) {
  const today = useToday()
  const [draft, setDraft] = React.useState<DraftRange | null>(initial)
  const [month, setMonth] = React.useState<Date | null>(() => {
    const start =
      initial?.from ?? (today ? clampDate(today, minDate, maxDate) : null)
    return start ? startOfMonth(start) : null
  })
  // A preset remounts the scrolling calendar so it opens on the new range.
  const [scrollKey, setScrollKey] = React.useState(0)

  const complete = draft?.to ? orderRange(draft.from, draft.to) : null
  const days = complete ? countDays(complete) : 0

  const resolved = presets.map((preset) => ({
    label: preset.label,
    range: today ? clampRange(preset.range(today), minDate, maxDate) : null,
  }))

  function choosePreset(range: DateRange) {
    setDraft(range)
    setMonth(startOfMonth(range.from))
    setScrollKey((key) => key + 1)
  }

  const presetList =
    resolved.length > 0 ? (
      <PresetList layout={layout}>
        {resolved.map(({ label, range }) => (
          <PresetButton
            key={label}
            layout={layout}
            active={
              !!range &&
              !!complete &&
              isSameDay(range.from, complete.from) &&
              isSameDay(range.to, complete.to)
            }
            disabled={!range}
            onClick={() => range && choosePreset(range)}
          >
            {label}
          </PresetButton>
        ))}
      </PresetList>
    ) : null

  const summary = (
    <span data-slot="date-picker-summary" className="text-sm">
      {complete
        ? formatDateRange(complete, locale)
        : draft
          ? "Pick an end date"
          : "Pick a start date"}
    </span>
  )
  const count = complete ? (
    <span
      data-slot="date-picker-count"
      className="text-sm text-muted-foreground tabular-nums"
    >
      {days} {days === 1 ? "day" : "days"}
    </span>
  ) : null
  const applyButton = (
    <Button
      type="button"
      data-slot="date-picker-apply"
      size={layout === "drawer" ? "lg" : "sm"}
      disabled={!complete}
      onClick={() => complete && onApply(complete)}
      className={layout === "drawer" ? "w-full" : undefined}
    >
      Apply
    </Button>
  )

  const calendarProps = {
    mode: "range" as const,
    value: draft,
    onChange: setDraft,
    minDate,
    maxDate,
    isDateDisabled,
    weekStartsOn,
    locale,
  }

  if (layout === "drawer") {
    return (
      <>
        {presetList}
        <SheetBody className="flex min-h-0 flex-col overflow-hidden px-0">
          <Calendar
            key={scrollKey}
            {...calendarProps}
            type="scroll"
            size="lg"
            defaultMonth={month ?? undefined}
            className="flex-1"
          />
        </SheetBody>
        <div
          data-slot="date-picker-footer"
          className="flex shrink-0 flex-col gap-3 border-t border-border p-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            {summary}
            {count}
          </div>
          {applyButton}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex">
        {presetList}
        <Calendar
          {...calendarProps}
          months={months}
          month={month ?? undefined}
          onMonthChange={setMonth}
          className="p-3"
        />
      </div>
      <div
        data-slot="date-picker-footer"
        className="flex items-center justify-between gap-4 border-t border-border px-3 py-2.5"
      >
        <div className="flex items-baseline gap-2">
          {summary}
          {count}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            data-slot="date-picker-cancel"
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {applyButton}
        </div>
      </div>
    </>
  )
}

type DatePickerProps = PickerSharedProps & {
  /** The picked day, when you control it. */
  value?: Date | null
  /** The picked day at first, when the picker keeps its own state. */
  defaultValue?: Date | null
  /** Called with the day as soon as it's picked. */
  onChange?: (date: Date) => void
  /** Shortcuts beside the calendar, such as Tomorrow. None by default. */
  presets?: DatePreset[]
}

function DatePicker({
  value,
  defaultValue = null,
  onChange,
  presets = [],
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn = 0,
  locale = "en-US",
  label = "Date",
  placeholder = "Select a date",
  type = "auto",
  size: sizeProp,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  container,
  modal = true,
  ...props
}: DatePickerProps) {
  const layout = usePickerLayout(type)
  const size = useFieldSize(sizeProp)
  const today = useToday()
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange)
  const [ownValue, setOwnValue] = React.useState(defaultValue)
  const picked = value !== undefined ? value : ownValue
  const text = picked ? formatDate(picked, locale) : placeholder

  function pick(date: Date) {
    if (value === undefined) setOwnValue(date)
    onChange?.(date)
    setOpen(false)
  }

  const presetList =
    presets.length > 0 ? (
      <PresetList layout={layout}>
        {presets.map((preset) => {
          const raw = today ? preset.date(today) : null
          const date =
            raw && isSameDay(clampDate(raw, minDate, maxDate), raw) ? raw : null
          return (
            <PresetButton
              key={preset.label}
              layout={layout}
              active={!!date && !!picked && isSameDay(date, picked)}
              disabled={!date || !!isDateDisabled?.(date)}
              onClick={() => date && pick(date)}
            >
              {preset.label}
            </PresetButton>
          )
        })}
      </PresetList>
    ) : null

  const calendarProps = {
    value: picked,
    onChange: pick,
    minDate,
    maxDate,
    isDateDisabled,
    weekStartsOn,
    locale,
  }

  return (
    <PickerShell
      layout={layout}
      open={open}
      container={container}
      modal={modal}
      onOpenChange={setOpen}
      label={label}
      slot="date-picker"
      text={text}
      empty={!picked}
      size={size}
      triggerProps={props}
      popover={
        <div className="flex">
          {presetList}
          <Calendar {...calendarProps} className="p-3" />
        </div>
      }
      drawer={
        <>
          {presetList}
          <SheetBody className="flex min-h-0 flex-col overflow-hidden px-0">
            <Calendar
              {...calendarProps}
              type="scroll"
              size="lg"
              className="flex-1"
            />
          </SheetBody>
        </>
      }
    />
  )
}

export {
  DatePicker,
  DateRangePicker,
  defaultDatePresets,
  defaultDateRangePresets,
}
export type {
  DatePickerType,
  DatePickerProps,
  DatePreset,
  DateRange,
  DateRangePickerProps,
  DateRangePreset,
}
