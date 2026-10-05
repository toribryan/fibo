"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  addDays,
  addMonths,
  clampDate,
  countDays,
  differenceInMonths,
  endOfWeek,
  formatDate,
  formatDateRange,
  getMonthWeeks,
  isSameDay,
  orderRange,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateKey,
  type DateRange,
  type DraftRange,
  type WeekStart,
} from "@workspace/ui/lib/dates"
import { cn } from "@workspace/ui/lib/utils"

/*
 * Today is read on the client only. The server snapshot is null, so markup
 * rendered on a server never depends on its clock or time zone, and the
 * subscription wakes once at local midnight so the marker moves on its own.
 */
function subscribeToMidnight(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>
  const schedule = () => {
    const now = new Date()
    const midnight = addDays(startOfDay(now), 1)
    timer = setTimeout(
      () => {
        onChange()
        schedule()
      },
      midnight.getTime() - now.getTime() + 50
    )
  }
  schedule()
  return () => clearTimeout(timer)
}

const getToday = () => startOfDay(new Date()).getTime()
const getServerToday = () => null

/** Local midnight today, or null while rendering on the server. */
function useToday(): Date | null {
  const time = React.useSyncExternalStore(
    subscribeToMidnight,
    getToday,
    getServerToday
  )
  return React.useMemo(() => (time === null ? null : new Date(time)), [time])
}

// A year either side covers most bookings and reports without a scroll
// position that runs for metres.
const SCROLL_SPAN = 12

type CalendarType = "paged" | "scroll"
type CalendarSize = "default" | "lg"

// Seven day cells: 36px each, or 44px at the large size.
const MONTH_WIDTH: Record<CalendarSize, number> = { default: 252, lg: 308 }

type CalendarSharedProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue" | "children"
> & {
  /** "paged" shows whole months with previous and next buttons; "scroll" stacks a year either side in one vertical scroll, for phones. */
  type?: CalendarType
  /** Day cells at 36 pixels, or 44 for touch. */
  size?: CalendarSize
  /** Months shown side by side in the paged type. */
  months?: 1 | 2
  /** The first month shown, when you control it. */
  month?: Date
  /** The first month shown at first. Defaults to the selected day's month, then today's. */
  defaultMonth?: Date
  /** Called with the first month shown when it changes. */
  onMonthChange?: (month: Date) => void
  /** The earliest day that can be picked. */
  minDate?: Date | null
  /** The latest day that can be picked. */
  maxDate?: Date | null
  /** Return true for a day that can't be picked, such as a weekend. */
  isDateDisabled?: (date: Date) => boolean
  /** The first column: 0 for Sunday, 1 for Monday. */
  weekStartsOn?: WeekStart
  /** A BCP 47 locale for month and weekday names and day numbers. */
  locale?: string
}

type CalendarSingleProps = CalendarSharedProps & {
  /** "single" picks one day; "range" picks a start and an end. */
  mode?: "single"
  /** The selected day, when you control it. */
  value?: Date | null
  /** The selected day at first, when the calendar keeps its own state. */
  defaultValue?: Date | null
  /** Called with the day picked. */
  onChange?: (date: Date) => void
}

type CalendarRangeProps = CalendarSharedProps & {
  /** "single" picks one day; "range" picks a start and an end. */
  mode: "range"
  /** The range, when you control it. `to` is missing between the two picks. */
  value?: DraftRange | null
  /** The range at first, when the calendar keeps its own state. */
  defaultValue?: DraftRange | null
  /** Called after each pick: with only `from` after the first, with both after the second. */
  onChange?: (range: DraftRange) => void
}

type CalendarProps = CalendarSingleProps | CalendarRangeProps

function Calendar(props: CalendarProps) {
  const {
    mode = "single",
    value,
    defaultValue,
    onChange,
    type = "paged",
    size = "default",
    months: monthCount = 1,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    minDate,
    maxDate,
    isDateDisabled,
    weekStartsOn = 0,
    locale = "en-US",
    className,
    style,
    ...rest
  } = props
  const range = mode === "range"
  const today = useToday()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const focusPending = React.useRef(false)

  const [ownValue, setOwnValue] = React.useState<Date | DraftRange | null>(
    defaultValue ?? null
  )
  const current = value !== undefined ? value : ownValue
  const selection: DraftRange | null =
    current == null
      ? null
      : current instanceof Date
        ? { from: startOfDay(current), to: startOfDay(current) }
        : current
  const anchor = range && selection && !selection.to ? selection.from : null

  const [ownMonth, setOwnMonth] = React.useState<Date | null>(() => {
    const start = defaultMonth ?? selection?.from
    return start ? startOfMonth(start) : null
  })
  // Without a month or a selection, open on today, kept inside the bounds so
  // the first page is never wholly disabled.
  const month = monthProp
    ? startOfMonth(monthProp)
    : (ownMonth ??
      (today ? startOfMonth(clampDate(today, minDate, maxDate)) : null))
  const [slide, setSlide] = React.useState<"next" | "previous" | null>(null)

  const [ownFocus, setOwnFocus] = React.useState<Date | null>(null)
  const [hovered, setHovered] = React.useState<Date | null>(null)

  const minMonth = minDate ? startOfMonth(minDate) : null
  const maxMonth = maxDate ? startOfMonth(maxDate) : null

  const shownMonths: Date[] = []
  if (month) {
    if (type === "scroll") {
      let first = addMonths(month, -SCROLL_SPAN)
      let last = addMonths(month, SCROLL_SPAN)
      if (minMonth && first < minMonth) first = minMonth
      if (maxMonth && last > maxMonth) last = maxMonth
      for (let m = first; m <= last; m = addMonths(m, 1)) shownMonths.push(m)
    } else {
      for (let i = 0; i < monthCount; i++) shownMonths.push(addMonths(month, i))
    }
  }
  const firstShown = shownMonths[0]
  const lastShown = shownMonths[shownMonths.length - 1]
  const isShown = (day: Date | null | undefined): day is Date =>
    !!day &&
    !!firstShown &&
    !!lastShown &&
    differenceInMonths(day, firstShown) >= 0 &&
    differenceInMonths(day, lastShown) <= 0

  const isDisabled = (day: Date) =>
    (!!minDate && day < startOfDay(minDate)) ||
    (!!maxDate && day > startOfDay(maxDate)) ||
    !!isDateDisabled?.(day)

  // One day in the grid holds the tab stop. It falls back through the
  // selection and today to the first day on screen that can be picked, then
  // to any day on screen, so the grid always has one.
  const firstEnabled = (() => {
    if (!firstShown || !lastShown) return null
    const end = addMonths(lastShown, 1)
    for (let day = firstShown; day < end; day = addDays(day, 1)) {
      if (!isDisabled(day)) return day
    }
    return firstShown
  })()
  const focused =
    [ownFocus, selection?.from, selection?.to, today].find(isShown) ??
    firstEnabled

  // While the second day is being chosen, the day under the pointer or the
  // keyboard previews where the range would end.
  const previewEnd = anchor && hovered ? hovered : null
  const shown: DateRange | null = selection
    ? selection.to
      ? orderRange(selection.from, selection.to)
      : previewEnd
        ? orderRange(selection.from, previewEnd)
        : { from: selection.from, to: selection.from }
    : null

  function changeMonth(next: Date, direction: "next" | "previous") {
    setSlide(direction)
    if (!monthProp) setOwnMonth(next)
    onMonthChange?.(next)
  }

  function commit(next: Date | DraftRange) {
    if (value === undefined) setOwnValue(next)
    ;(onChange as ((next: Date | DraftRange) => void) | undefined)?.(next)
  }

  function pick(day: Date) {
    if (isDisabled(day)) return
    setOwnFocus(day)
    if (!range) commit(day)
    else if (!anchor) commit({ from: day })
    else {
      setHovered(null)
      commit(orderRange(anchor, day))
    }
  }

  function moveFocus(target: Date) {
    let next = clampDate(target, minDate, maxDate)
    if (type === "scroll" && firstShown && lastShown) {
      next = clampDate(next, firstShown, addMonths(lastShown, 1))
      if (differenceInMonths(next, lastShown) > 0) next = addDays(next, -1)
    }
    focusPending.current = true
    setOwnFocus(next)
    if (type === "paged" && month) {
      const offset = differenceInMonths(next, month)
      if (offset < 0) changeMonth(startOfMonth(next), "previous")
      else if (offset > monthCount - 1)
        changeMonth(addMonths(startOfMonth(next), 1 - monthCount), "next")
    }
  }

  function onGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!focused) return
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => startOfWeek(focused, weekStartsOn),
      End: () => endOfWeek(focused, weekStartsOn),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    moveFocus(move())
  }

  // Keyboard moves land focus once the target day has rendered, which may
  // be in a month that only just slid in.
  const focusedKey = focused ? toDateKey(focused) : ""
  const monthKey = month ? toDateKey(month) : ""
  React.useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    rootRef.current
      ?.querySelector<HTMLElement>(
        `[data-slot="calendar-day"][data-date="${focusedKey}"]`
      )
      ?.focus()
  }, [focusedKey, monthKey])

  // A scroll calendar opens on the month holding the focused day, not on
  // the oldest month a year back. A hidden scroller, such as one in a closed
  // tab, has no layout and loses its position, so it scrolls again each time
  // it's shown.
  React.useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const scroll = () => {
      const target = scroller.querySelector<HTMLElement>("[data-focus-month]")
      if (target) scroller.scrollTop = target.offsetTop
    }
    let hidden = scroller.clientHeight === 0
    if (!hidden) scroll()
    const observer = new ResizeObserver(() => {
      if (scroller.clientHeight === 0) hidden = true
      else if (hidden) {
        hidden = false
        scroll()
      }
    })
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [])

  const formats = React.useMemo(
    () => ({
      month: new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }),
      day: new Intl.DateTimeFormat(locale, { day: "numeric" }),
      full: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    }),
    [locale]
  )
  // Any week works for the names; this one starts on a Sunday.
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(2026, 0, 4 + ((i + weekStartsOn) % 7))
    return {
      short: formats.weekdayShort.format(day),
      long: formats.weekdayLong.format(day),
    }
  })

  let status = ""
  if (anchor) {
    status = `Start ${formatDate(anchor, locale)}. Choose an end date.`
  } else if (range && selection?.to) {
    const picked = orderRange(selection.from, selection.to)
    const days = countDays(picked)
    status = `${formatDateRange(picked, locale)}, ${days} ${days === 1 ? "day" : "days"}`
  }

  const grids = shownMonths.map((m) => (
    <CalendarMonth
      key={toDateKey(m)}
      month={m}
      type={type}
      size={size}
      range={range}
      weekStartsOn={weekStartsOn}
      weekdays={weekdays}
      formats={formats}
      today={today}
      focused={focused}
      shown={shown}
      selection={selection}
      previewEnd={previewEnd}
      isDisabled={isDisabled}
      onPick={pick}
      onHover={(day) => anchor && setHovered(day)}
      onKeyDown={onGridKeyDown}
      onLeave={() => setHovered(null)}
    />
  ))

  if (type === "scroll") {
    return (
      <div
        ref={rootRef}
        data-slot="calendar"
        data-type="scroll"
        data-size={size}
        className={cn("flex min-h-0 flex-col", className)}
        style={style}
        {...rest}
      >
        <div
          aria-hidden="true"
          data-slot="calendar-weekdays"
          className="grid shrink-0 grid-cols-7 border-b border-border px-4 py-2 text-center text-xs text-muted-foreground"
        >
          {weekdays.map((w) => (
            <span key={w.long}>{w.short}</span>
          ))}
        </div>
        <div
          ref={scrollRef}
          data-slot="calendar-scroll"
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
        >
          {grids}
        </div>
        <div aria-live="polite" className="sr-only">
          {status}
        </div>
      </div>
    )
  }

  const atMin = !!minMonth && !!month && month <= minMonth
  const atMax = !!maxMonth && !!lastShown && lastShown >= maxMonth

  // The months sit in a size container, so two of them stack when there
  // isn't room side by side rather than squeezing their days. A size
  // container can't take its width from its content, so it's told the width
  // the months need: a popover still sizes to it, and a narrower column gets
  // the stack. It has no padding of its own, so a caller's padding on the
  // root can't throw the measurement off.
  const pageWidth = monthCount * MONTH_WIDTH[size] + (monthCount - 1) * 24

  return (
    <div
      ref={rootRef}
      data-slot="calendar"
      data-type="paged"
      data-size={size}
      className={cn("overflow-hidden p-1", className)}
      style={style}
      {...rest}
    >
      <div
        className="@container/calendar"
        style={{
          maxWidth: pageWidth,
          containIntrinsicInlineSize: `${pageWidth}px`,
        }}
      >
        <div className="relative w-fit">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-slot="calendar-previous"
            aria-label="Previous month"
            disabled={!month || atMin}
            onClick={() =>
              month && changeMonth(addMonths(month, -1), "previous")
            }
            className="absolute top-0 left-0"
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-slot="calendar-next"
            aria-label="Next month"
            disabled={!month || atMax}
            onClick={() => month && changeMonth(addMonths(month, 1), "next")}
            className="absolute top-0 right-0"
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
          <div
            key={monthKey}
            data-slot="calendar-months"
            data-slide={slide ?? undefined}
            className={cn(
              "flex flex-col gap-6",
              monthCount > 1 &&
                (size === "lg"
                  ? "@min-[640px]/calendar:flex-row"
                  : "@min-[528px]/calendar:flex-row"),
              slide &&
                "animate-in duration-200 ease-out fade-in-0 motion-reduce:animate-none",
              slide === "next" && "slide-in-from-right-6",
              slide === "previous" && "slide-in-from-left-6"
            )}
          >
            {grids}
          </div>
        </div>
      </div>
      <div aria-live="polite" className="sr-only">
        {status}
      </div>
    </div>
  )
}

type CalendarFormats = {
  month: Intl.DateTimeFormat
  day: Intl.DateTimeFormat
  full: Intl.DateTimeFormat
}

function CalendarMonth({
  month,
  type,
  size,
  range,
  weekStartsOn,
  weekdays,
  formats,
  today,
  focused,
  shown,
  selection,
  previewEnd,
  isDisabled,
  onPick,
  onHover,
  onKeyDown,
  onLeave,
}: {
  month: Date
  type: CalendarType
  size: CalendarSize
  range: boolean
  weekStartsOn: WeekStart
  weekdays: { short: string; long: string }[]
  formats: CalendarFormats
  today: Date | null
  focused: Date | null
  shown: DateRange | null
  selection: DraftRange | null
  previewEnd: Date | null
  isDisabled: (day: Date) => boolean
  onPick: (day: Date) => void
  onHover: (day: Date) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onLeave: () => void
}) {
  const titleId = React.useId()
  const weeks = getMonthWeeks(month, weekStartsOn)
  const holdsFocus =
    !!focused && differenceInMonths(focused, month) === 0 ? true : undefined
  const inShown = (day: Date) => !!shown && day >= shown.from && day <= shown.to
  const complete = !!selection?.to || !!previewEnd

  return (
    <div
      data-slot="calendar-month"
      data-focus-month={holdsFocus}
      className={cn("flex flex-col gap-1", type === "scroll" && "pt-4")}
    >
      <div
        id={titleId}
        data-slot="calendar-month-title"
        className={cn(
          "flex h-8 items-center text-sm font-medium",
          type === "paged" ? "justify-center" : "px-1"
        )}
      >
        {formats.month.format(month)}
      </div>
      <div
        role="grid"
        aria-labelledby={titleId}
        aria-multiselectable={range || undefined}
        data-slot="calendar-grid"
        onKeyDown={onKeyDown}
        onPointerLeave={onLeave}
      >
        <div
          role="row"
          className={cn("grid grid-cols-7", type === "scroll" && "sr-only")}
        >
          {weekdays.map((w) => (
            <div
              key={w.long}
              role="columnheader"
              aria-label={w.long}
              className={cn(
                "flex h-8 items-center justify-center text-xs font-normal text-muted-foreground",
                size === "lg" ? "w-11" : "w-9"
              )}
            >
              {w.short}
            </div>
          ))}
        </div>
        {weeks.map((week, row) => {
          // One bar per week row, from the centre of the first day in range
          // to the centre of the last. Where the range runs on past the row,
          // the bar runs to the row's edge so it reads as one band.
          const cols = week.flatMap((day, i) => (day && inShown(day) ? i : []))
          const first = cols[0]
          const last = cols[cols.length - 1]
          const bar =
            range &&
            shown &&
            complete &&
            first !== undefined &&
            last !== undefined
              ? {
                  start:
                    week[first] && isSameDay(week[first], shown.from)
                      ? first + 0.5
                      : first,
                  end:
                    week[last] && isSameDay(week[last], shown.to)
                      ? last + 0.5
                      : last + 1,
                }
              : null
          return (
            <div
              key={row}
              role="row"
              className={cn(
                "relative grid grid-cols-7",
                size === "lg" && "py-0.5"
              )}
            >
              {bar && bar.end > bar.start ? (
                <div
                  aria-hidden="true"
                  data-slot="calendar-range-bar"
                  data-preview={!selection?.to || undefined}
                  className={cn(
                    "pointer-events-none absolute bg-secondary",
                    size === "lg" ? "inset-y-0.5" : "inset-y-0"
                  )}
                  style={{
                    left: `${(bar.start / 7) * 100}%`,
                    width: `${((bar.end - bar.start) / 7) * 100}%`,
                  }}
                />
              ) : null}
              {week.map((day, col) => {
                if (!day) return <div key={col} role="gridcell" />
                const key = toDateKey(day)
                const start = !!shown && isSameDay(day, shown.from)
                const end = !!shown && isSameDay(day, shown.to)
                const thumb =
                  !!selection &&
                  (isSameDay(day, selection.from) ||
                    (!!selection.to && isSameDay(day, selection.to)))
                const selected =
                  thumb || (inShown(day) && (!!selection?.to || !range))
                const preview =
                  !!previewEnd && isSameDay(day, previewEnd) && !thumb
                const disabled = isDisabled(day)
                const isToday = !!today && isSameDay(day, today)
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-selected={selected}
                    className="flex justify-center"
                  >
                    <button
                      type="button"
                      data-slot="calendar-day"
                      data-date={key}
                      data-today={isToday || undefined}
                      data-selected={thumb || undefined}
                      data-range-start={(range && start) || undefined}
                      data-range-end={(range && end) || undefined}
                      data-in-range={
                        (range && inShown(day) && !start && !end) || undefined
                      }
                      data-preview={preview || undefined}
                      data-disabled={disabled || undefined}
                      tabIndex={focused && isSameDay(day, focused) ? 0 : -1}
                      aria-label={formats.full.format(day)}
                      aria-current={isToday ? "date" : undefined}
                      aria-disabled={disabled || undefined}
                      onClick={() => onPick(day)}
                      onPointerEnter={() => onHover(day)}
                      onFocus={() => onHover(day)}
                      className={cn(
                        "relative z-10 inline-flex items-center justify-center rounded-full border border-transparent text-sm tabular-nums transition-colors outline-none hover:bg-secondary focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
                        size === "lg" ? "size-11 text-base" : "size-9",
                        "data-in-range:hover:bg-secondary-hover",
                        "data-preview:border-primary",
                        "data-today:font-semibold data-today:after:absolute data-today:after:bottom-1 data-today:after:size-1 data-today:after:rounded-full data-today:after:bg-current",
                        "data-selected:bg-primary data-selected:text-primary-foreground data-selected:hover:bg-primary-hover",
                        "aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground aria-disabled:line-through aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"
                      )}
                    >
                      {formats.day.format(day)}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar, useToday }
export type {
  CalendarProps,
  CalendarRangeProps,
  CalendarSingleProps,
  CalendarSize,
  CalendarType,
}
