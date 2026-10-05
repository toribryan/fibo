/*
 * Calendar-day arithmetic on plain Dates in the local time zone. Every date
 * here is a local midnight, so two dates are the same day exactly when their
 * year, month and day match, whatever the time zone or daylight saving.
 */

/** A finished range: both ends picked, `from` on or before `to`. */
export type DateRange = { from: Date; to: Date }

/** A range being picked: `to` is missing until the second day is chosen. */
export type DraftRange = { from: Date; to?: Date }

/** The first column of the week: 0 for Sunday, 1 for Monday. */
export type WeekStart = 0 | 1

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Built from the parts rather than by adding milliseconds, so a day across a
// daylight-saving change is still one day.
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Moves by whole months, keeping the day but never spilling past the end. */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const last = endOfMonth(target).getDate()
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), last)
  )
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** Whole calendar days from `a` to `b`, negative when `b` comes first. */
export function differenceInDays(b: Date, a: Date): number {
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}

/** Whole months from the month of `a` to the month of `b`. */
export function differenceInMonths(b: Date, a: Date): number {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  )
}

export function startOfWeek(date: Date, weekStartsOn: WeekStart = 0): Date {
  const offset = (date.getDay() - weekStartsOn + 7) % 7
  return addDays(date, -offset)
}

export function endOfWeek(date: Date, weekStartsOn: WeekStart = 0): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6)
}

/** Keeps a day inside the bounds given, either of which may be missing. */
export function clampDate(date: Date, min?: Date | null, max?: Date | null) {
  const day = startOfDay(date)
  if (min && day < startOfDay(min)) return startOfDay(min)
  if (max && day > startOfDay(max)) return startOfDay(max)
  return day
}

/** Two days as a range, earliest first, whichever order they were picked. */
export function orderRange(a: Date, b: Date): DateRange {
  const [from, to] = a <= b ? [a, b] : [b, a]
  return { from: startOfDay(from), to: startOfDay(to) }
}

/**
 * The part of a range inside the bounds, or null when none of it is. A
 * preset such as "Last 30 days" still works next to a minimum date by
 * starting at that minimum.
 */
export function clampRange(
  range: DateRange,
  min?: Date | null,
  max?: Date | null
): DateRange | null {
  if (min && startOfDay(range.to) < startOfDay(min)) return null
  if (max && startOfDay(range.from) > startOfDay(max)) return null
  return {
    from: clampDate(range.from, min, max),
    to: clampDate(range.to, min, max),
  }
}

/** Days in a range, counting both ends: Oct 1 to Oct 7 is 7 days. */
export function countDays(range: DateRange): number {
  return Math.abs(differenceInDays(range.to, range.from)) + 1
}

/**
 * A month as rows of seven, starting on `weekStartsOn`. Days from the
 * months either side are null, so a grid can leave those cells empty.
 */
export function getMonthWeeks(
  month: Date,
  weekStartsOn: WeekStart = 0
): (Date | null)[][] {
  const first = startOfMonth(month)
  const last = endOfMonth(month)
  const weeks: (Date | null)[][] = []
  let day = startOfWeek(first, weekStartsOn)
  while (day <= last) {
    const week: (Date | null)[] = []
    for (let i = 0; i < 7; i++) {
      week.push(isSameMonth(day, first) ? day : null)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** A stable key for a day, such as `2026-10-05`, for lookups and data attributes. */
export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/*
 * ICU builds differ in the spaces they put in dates: Node writes thin spaces
 * around a range's dash where a browser may write plain ones, so markup
 * rendered on the server wouldn't match the client's. Plain spaces read the
 * same and hydrate.
 */
const plainSpaces = (text: string) => text.replace(/[\u2009\u202f]/g, " ")

/** One day for a trigger or summary, such as "Oct 5, 2026". */
export function formatDate(date: Date, locale = "en-US"): string {
  const text = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
  return plainSpaces(text)
}

/**
 * A range the way the locale writes one, sharing what both ends have in
 * common: "Oct 1 – 7, 2026", or "Oct 5, 2026" when it's a single day.
 */
export function formatDateRange(range: DateRange, locale = "en-US"): string {
  const text = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatRange(range.from, range.to)
  return plainSpaces(text)
}
