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
  endOfMonth,
  formatDate,
  formatDateRange,
  formatTime,
  formatTimeRange,
  getMonthWeeks,
  isSameDay,
  isSameMonth,
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
// position that runs for meters.
const SCROLL_SPAN = 12

type CalendarType = "paged" | "scroll" | "month"
type CalendarSize = "default" | "lg"

// Seven day cells: 36px each, or 44px at the large size.
const MONTH_WIDTH: Record<CalendarSize, number> = { default: 252, lg: 308 }

// A month cell keeps to three lines of events: two cards, then "+N more".
const MONTH_CARDS = 2
const MONTH_DOTS = 3

/** One event on one day, for the month type. */
type CalendarEvent = {
  /** Unique among the events given. */
  id: string
  /** What the event is called. */
  title: string
  /** When it starts. The event shows on this day. */
  start: Date
  /** When it ends, on the same day. */
  end?: Date
  /** Shows "All day" in place of a time. */
  allDay?: boolean
}

type CalendarLabels = {
  /** Names the previous month button. */
  previous: string
  /** Names the next month button. */
  next: string
  /** The button that returns to today's month. */
  today: string
  /** Ends a month cell's cards when it has more events than fit. */
  more: (count: number) => string
  /** Fills the selected day's list when it has no events. */
  noEvents: string
  /** Stands in for the time of an all-day event. */
  allDay: string
  /** Opens a day's spoken summary of its events. */
  events: (count: number) => string
}

const DEFAULT_LABELS: CalendarLabels = {
  previous: "Previous month",
  next: "Next month",
  today: "Today",
  more: (count) => `+${count} more`,
  noEvents: "No events",
  allDay: "All day",
  events: (count) => `${count} ${count === 1 ? "event" : "events"}`,
}

let warnedRangeMonth = false

type CalendarSharedProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue" | "children"
> & {
  /** Day cells at 36 pixels, or 44 for touch. Paged and scroll types. */
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
  /** A BCP 47 locale for month and weekday names, day numbers and times. */
  locale?: string
  /** Month type: the events to show, each on the day it starts. */
  events?: CalendarEvent[]
  /** Month type: makes the selected day's events buttons, called with the one pressed. */
  onEventClick?: (event: CalendarEvent) => void
  /** Month type: actions at the end of the header, such as a New event button. Other types ignore them. */
  children?: React.ReactNode
  /** Wording the calendar writes for itself, for translation. */
  labels?: Partial<CalendarLabels>
}

type CalendarSingleProps = CalendarSharedProps & {
  /** "paged" shows whole months with previous and next buttons; "scroll" stacks a year either side in one vertical scroll, for phones; "month" fills its parent with one month of events. */
  type?: CalendarType
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
  /** "paged" or "scroll". The month type picks one day only; given it anyway, a range calendar draws the paged type and warns in the console. */
  type?: Exclude<CalendarType, "month">
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
    type: typeProp = "paged",
    size = "default",
    months: monthsProp = 1,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    minDate,
    maxDate,
    isDateDisabled,
    weekStartsOn = 0,
    locale = "en-US",
    events,
    onEventClick,
    children,
    labels,
    className,
    style,
    ...rest
  } = props
  const range = mode === "range"
  // A month of events picks one day, and a range caller's onChange expects
  // a range, so a range keeps the paged grid rather than losing its contract.
  const rangeMonth = range && typeProp === "month"
  const type: CalendarType = rangeMonth ? "paged" : typeProp
  const monthCount = type === "month" ? 1 : monthsProp
  const text = { ...DEFAULT_LABELS, ...labels }
  React.useEffect(() => {
    if (!rangeMonth || warnedRangeMonth) return
    warnedRangeMonth = true
    console.warn(
      'Calendar: type="month" picks one day, so mode="range" draws the paged type instead.'
    )
  }, [rangeMonth])
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

  const outOfBounds = (day: Date) =>
    (!!minDate && day < startOfDay(minDate)) ||
    (!!maxDate && day > startOfDay(maxDate))
  const isDisabled = (day: Date) => outOfBounds(day) || !!isDateDisabled?.(day)

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
    // A month view shows the ends of the months either side; picking one of
    // those days turns the page to it, as moving there by keyboard does.
    if (type === "month" && month && !isSameMonth(day, month)) {
      changeMonth(startOfMonth(day), day < month ? "previous" : "next")
    }
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
    if (type !== "scroll" && month) {
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
        `[data-slot="calendar-day"][data-date="${focusedKey}"]:not([data-outside])`
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

  const atMin = !!minMonth && !!month && month <= minMonth
  const atMax = !!maxMonth && !!lastShown && lastShown >= maxMonth

  if (type === "month") {
    return (
      <CalendarMonthView
        ref={rootRef}
        month={month}
        slide={slide}
        weekStartsOn={weekStartsOn}
        weekdays={weekdays}
        formats={formats}
        locale={locale}
        text={text}
        today={today}
        focused={focused}
        selected={selection?.from ?? null}
        events={events}
        onEventClick={onEventClick}
        isDisabled={isDisabled}
        atMin={atMin}
        atMax={atMax}
        todayDisabled={!today || outOfBounds(today)}
        onPrevious={() =>
          month && changeMonth(addMonths(month, -1), "previous")
        }
        onNext={() => month && changeMonth(addMonths(month, 1), "next")}
        onToday={() => {
          if (!today || !month) return
          setOwnFocus(today)
          if (!isSameMonth(today, month)) {
            changeMonth(
              startOfMonth(today),
              today < month ? "previous" : "next"
            )
          }
        }}
        onPick={pick}
        onKeyDown={onGridKeyDown}
        actions={children}
        className={className}
        style={style}
        {...rest}
      />
    )
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
            aria-label={text.previous}
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
            aria-label={text.next}
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
          // One bar per week row, from the center of the first day in range
          // to the center of the last. Where the range runs on past the row,
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

/*
 * The month type. The grid keeps the date grid's keyboard model: each cell
 * holds one day button, the grid is one tab stop, and arrows move between
 * days. A cell's event cards and dots sit inside that button, hidden from
 * assistive technology, and the button is described by a spoken list of the
 * day's events instead, so nothing inside a cell takes focus or breaks the
 * grid. Events become buttons in the selected day's list, outside the grid,
 * which sits below the grid in a narrow calendar and beside it in a wide one.
 * Which layout shows is decided by the calendar's own width, not the
 * viewport's, so a month in a side panel gets the compact cells.
 */
function CalendarMonthView({
  ref,
  month,
  slide,
  weekStartsOn,
  weekdays,
  formats,
  locale,
  text,
  today,
  focused,
  selected,
  events,
  onEventClick,
  isDisabled,
  atMin,
  atMax,
  todayDisabled,
  onPrevious,
  onNext,
  onToday,
  onPick,
  onKeyDown,
  actions,
  className,
  ...rest
}: Omit<React.ComponentProps<"div">, "onKeyDown"> & {
  month: Date | null
  slide: "next" | "previous" | null
  weekStartsOn: WeekStart
  weekdays: { short: string; long: string }[]
  formats: CalendarFormats
  locale: string
  text: CalendarLabels
  today: Date | null
  focused: Date | null
  selected: Date | null
  events: CalendarEvent[] | undefined
  onEventClick: ((event: CalendarEvent) => void) | undefined
  isDisabled: (day: Date) => boolean
  atMin: boolean
  atMax: boolean
  todayDisabled: boolean
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onPick: (day: Date) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  actions: React.ReactNode
}) {
  const id = React.useId()
  const titleId = `${id}-title`
  const agendaId = `${id}-agenda`

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events ?? []) {
      const key = toDateKey(event.start)
      const list = map.get(key)
      if (list) list.push(event)
      else map.set(key, [event])
    }
    // All-day events first, then by start time.
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          Number(!!b.allDay) - Number(!!a.allDay) ||
          a.start.getTime() - b.start.getTime()
      )
    }
    return map
  }, [events])

  const agendaFormat = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [locale]
  )

  const timeOf = (event: CalendarEvent) =>
    event.allDay
      ? text.allDay
      : event.end
        ? formatTimeRange(event.start, event.end, locale)
        : formatTime(event.start, locale)

  // Every day the weeks touch, the ends of the months either side included.
  const weeks: Date[][] = []
  if (month) {
    const first = startOfWeek(month, weekStartsOn)
    const rows = getMonthWeeks(month, weekStartsOn).length
    for (let row = 0; row < rows; row++) {
      weeks.push(
        Array.from({ length: 7 }, (_, col) => addDays(first, row * 7 + col))
      )
    }
  }

  const agendaDay =
    selected && month && isSameMonth(selected, month) ? selected : focused
  const agendaEvents = agendaDay ? (byDay.get(toDateKey(agendaDay)) ?? []) : []

  return (
    <div
      ref={ref}
      data-slot="calendar"
      data-type="month"
      className={cn(
        "@container/calendar flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-4",
        className
      )}
      {...rest}
    >
      <div
        data-slot="calendar-header"
        className="flex flex-wrap items-center gap-x-4 gap-y-3"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            id={titleId}
            data-slot="calendar-month-title"
            className="truncate text-lg font-semibold @3xl/calendar:text-xl"
          >
            {month ? formats.month.format(month) : null}
          </div>
          <div
            data-slot="calendar-month-span"
            className="text-sm text-muted-foreground"
          >
            {month
              ? formatDateRange({ from: month, to: endOfMonth(month) }, locale)
              : null}
          </div>
        </div>
        <div data-slot="calendar-nav" className="flex">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            data-slot="calendar-previous"
            aria-label={text.previous}
            disabled={!month || atMin}
            onClick={onPrevious}
            className="rounded-r-none focus-visible:z-10"
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-slot="calendar-today"
            disabled={todayDisabled}
            onClick={onToday}
            className="-mx-px rounded-none focus-visible:z-10"
          >
            {text.today}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            data-slot="calendar-next"
            aria-label={text.next}
            disabled={!month || atMax}
            onClick={onNext}
            className="rounded-l-none focus-visible:z-10"
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </div>
        {actions ? (
          <div data-slot="calendar-actions" className="flex items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div
        data-slot="calendar-body"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto @5xl/calendar:flex-row @5xl/calendar:overflow-visible"
      >
        <div
          key={month ? toDateKey(month) : ""}
          role="grid"
          aria-labelledby={titleId}
          data-slot="calendar-grid"
          data-slide={slide ?? undefined}
          onKeyDown={onKeyDown}
          className={cn(
            "flex shrink-0 flex-col gap-px overflow-clip rounded-xl border border-border bg-border @3xl/calendar:flex-1 @5xl/calendar:min-h-0 @5xl/calendar:overflow-y-auto",
            slide &&
              "animate-in duration-200 ease-out fade-in-0 motion-reduce:animate-none"
          )}
        >
          <div role="row" className="grid shrink-0 grid-cols-7 gap-px">
            {weekdays.map((w) => (
              <div
                key={w.long}
                role="columnheader"
                aria-label={w.long}
                className="flex h-8 items-center justify-center bg-background text-xs text-muted-foreground @3xl/calendar:justify-start @3xl/calendar:px-2"
              >
                {w.short}
              </div>
            ))}
          </div>
          {weeks.map((week, row) => (
            <div
              key={row}
              role="row"
              className="grid grid-cols-7 gap-px @3xl/calendar:flex-1"
            >
              {week.map((day) => {
                const key = toDateKey(day)
                const dayEvents = byDay.get(key) ?? []
                const outside = !!month && !isSameMonth(day, month)
                const isSelected = !!selected && isSameDay(day, selected)
                const isToday = !!today && isSameDay(day, today)
                const disabled = isDisabled(day)
                const extra =
                  dayEvents.length > MONTH_CARDS
                    ? dayEvents.length - MONTH_CARDS
                    : 0
                const summaryId = `${id}-${key}`
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-selected={isSelected}
                    className="relative flex min-w-0 bg-background"
                  >
                    <button
                      type="button"
                      data-slot="calendar-day"
                      data-date={key}
                      data-today={isToday || undefined}
                      data-selected={isSelected || undefined}
                      data-outside={outside || undefined}
                      data-disabled={disabled || undefined}
                      data-events={dayEvents.length || undefined}
                      tabIndex={
                        !outside && focused && isSameDay(day, focused) ? 0 : -1
                      }
                      aria-label={formats.full.format(day)}
                      aria-current={isToday ? "date" : undefined}
                      aria-disabled={disabled || undefined}
                      aria-describedby={
                        dayEvents.length ? summaryId : undefined
                      }
                      onClick={() => onPick(day)}
                      className="group/day flex min-h-12 min-w-0 flex-1 flex-col items-center gap-1 p-1 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:ring-inset aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent @3xl/calendar:min-h-28 @3xl/calendar:items-stretch @3xl/calendar:p-1.5"
                    >
                      <span
                        data-slot="calendar-day-number"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-transparent text-sm tabular-nums group-data-outside/day:text-muted-foreground group-data-today/day:border-primary group-data-today/day:font-semibold group-data-selected/day:bg-primary group-data-selected/day:text-primary-foreground group-data-disabled/day:text-muted-foreground group-data-disabled/day:line-through @3xl/calendar:self-start"
                      >
                        {formats.day.format(day)}
                      </span>
                      {dayEvents.length ? (
                        <>
                          <span
                            aria-hidden="true"
                            data-slot="calendar-day-events"
                            className="hidden min-w-0 flex-col gap-0.5 @3xl/calendar:flex"
                          >
                            {dayEvents.slice(0, MONTH_CARDS).map((event) => (
                              <span
                                key={event.id}
                                data-slot="calendar-event-card"
                                className="flex min-w-0 flex-col rounded-sm bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground group-data-outside/day:text-muted-foreground"
                              >
                                <span className="truncate font-medium">
                                  {event.title}
                                </span>
                                {event.allDay ? null : (
                                  <span className="truncate text-muted-foreground tabular-nums">
                                    {formatTime(event.start, locale)}
                                  </span>
                                )}
                              </span>
                            ))}
                            {extra ? (
                              <span
                                data-slot="calendar-event-more"
                                className="px-1.5 text-xs text-muted-foreground"
                              >
                                {text.more(extra)}
                              </span>
                            ) : null}
                          </span>
                          <span
                            aria-hidden="true"
                            data-slot="calendar-day-dots"
                            className="flex gap-0.5 @3xl/calendar:hidden"
                          >
                            {dayEvents.slice(0, MONTH_DOTS).map((event) => (
                              <span
                                key={event.id}
                                className="size-1 rounded-full bg-foreground group-data-outside/day:bg-muted-foreground"
                              />
                            ))}
                          </span>
                        </>
                      ) : null}
                    </button>
                    {dayEvents.length ? (
                      <span id={summaryId} className="sr-only">
                        {`${text.events(dayEvents.length)}: ${dayEvents
                          .map((event) => `${event.title}, ${timeOf(event)}`)
                          .join("; ")}`}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div
          data-slot="calendar-agenda"
          className="flex flex-1 flex-col gap-2 @3xl/calendar:flex-none @5xl/calendar:min-h-0 @5xl/calendar:w-64 @5xl/calendar:overflow-y-auto"
        >
          <div
            id={agendaId}
            data-slot="calendar-agenda-title"
            className="text-sm font-medium"
          >
            {agendaDay ? agendaFormat.format(agendaDay) : null}
          </div>
          {agendaEvents.length ? (
            <ul
              aria-labelledby={agendaId}
              data-slot="calendar-agenda-list"
              className="flex flex-col gap-1"
            >
              {agendaEvents.map((event) => {
                const content = (
                  <>
                    <span
                      aria-hidden="true"
                      className="w-1 shrink-0 self-stretch rounded-full bg-primary"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {event.title}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {timeOf(event)}
                      </span>
                    </span>
                  </>
                )
                const rowClass =
                  "flex w-full gap-3 rounded-lg px-2 py-1.5 text-left"
                return (
                  <li key={event.id} data-slot="calendar-event">
                    {onEventClick ? (
                      <button
                        type="button"
                        onClick={() => onEventClick(event)}
                        className={cn(
                          rowClass,
                          "outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
                        )}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={rowClass}>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p
              data-slot="calendar-agenda-empty"
              className="px-2 py-1.5 text-sm text-muted-foreground"
            >
              {text.noEvents}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export { Calendar, useToday }
export type {
  CalendarEvent,
  CalendarLabels,
  CalendarProps,
  CalendarRangeProps,
  CalendarSingleProps,
  CalendarSize,
  CalendarType,
}
