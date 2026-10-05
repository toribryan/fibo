import { describe, expect, it } from "vitest"

import {
  addDays,
  addMonths,
  clampDate,
  clampRange,
  countDays,
  differenceInDays,
  endOfWeek,
  formatDate,
  formatDateRange,
  getMonthWeeks,
  orderRange,
  startOfWeek,
} from "./dates.js"

const day = (month: number, date: number, year = 2026) =>
  new Date(year, month - 1, date)

describe("orderRange", () => {
  it("puts the earlier day first whichever was picked first", () => {
    expect(orderRange(day(10, 20), day(10, 14))).toEqual({
      from: day(10, 14),
      to: day(10, 20),
    })
    expect(orderRange(day(10, 14), day(10, 20))).toEqual({
      from: day(10, 14),
      to: day(10, 20),
    })
  })

  it("drops the time of day", () => {
    expect(orderRange(new Date(2026, 9, 2, 18), day(10, 1))).toEqual({
      from: day(10, 1),
      to: day(10, 2),
    })
  })
})

describe("weeks", () => {
  it("starts the week on Sunday or Monday", () => {
    // October 14, 2026 is a Wednesday.
    expect(startOfWeek(day(10, 14), 0)).toEqual(day(10, 11))
    expect(startOfWeek(day(10, 14), 1)).toEqual(day(10, 12))
    expect(endOfWeek(day(10, 14), 1)).toEqual(day(10, 18))
    expect(startOfWeek(day(10, 11), 1)).toEqual(day(10, 5))
  })

  it("lays a month out in rows of seven with empty days around it", () => {
    const sunday = getMonthWeeks(day(10, 1), 0)
    expect(sunday[0]?.slice(0, 5)).toEqual([null, null, null, null, day(10, 1)])
    expect(sunday).toHaveLength(5)

    const monday = getMonthWeeks(day(10, 1), 1)
    expect(monday[0]?.findIndex((d) => d?.getDate() === 1)).toBe(3)
    expect(monday.flat().filter(Boolean)).toHaveLength(31)
  })

  it("needs six rows when a month spills that far", () => {
    // August 2026 starts on a Saturday and has 31 days.
    expect(getMonthWeeks(day(8, 1), 0)).toHaveLength(6)
  })
})

describe("clamping", () => {
  it("keeps a day inside the bounds", () => {
    const min = day(10, 5)
    const max = day(10, 30)
    expect(clampDate(day(10, 1), min, max)).toEqual(min)
    expect(clampDate(day(11, 2), min, max)).toEqual(max)
    expect(clampDate(day(10, 14), min, max)).toEqual(day(10, 14))
    expect(clampDate(day(10, 14), null, undefined)).toEqual(day(10, 14))
  })

  it("trims a range to the bounds, or drops it when none is inside", () => {
    const range = { from: day(9, 20), to: day(10, 10) }
    expect(clampRange(range, day(10, 1), null)).toEqual({
      from: day(10, 1),
      to: day(10, 10),
    })
    expect(clampRange(range, day(10, 11), null)).toBeNull()
    expect(clampRange(range, null, day(9, 19))).toBeNull()
  })
})

describe("arithmetic", () => {
  it("keeps the last day of the month when the next is shorter", () => {
    expect(addMonths(day(1, 31), 1)).toEqual(day(2, 28))
    expect(addMonths(day(3, 31), -1)).toEqual(day(2, 28))
    expect(addMonths(day(10, 14), 12)).toEqual(day(10, 14, 2027))
  })

  it("counts calendar days across a daylight-saving change", () => {
    expect(differenceInDays(day(11, 10), day(10, 20))).toBe(21)
    expect(addDays(day(3, 28), 2)).toEqual(day(3, 30))
    expect(countDays({ from: day(10, 1), to: day(10, 7) })).toBe(7)
    expect(countDays({ from: day(10, 1), to: day(10, 1) })).toBe(1)
  })
})

describe("formatting", () => {
  it("writes a range the way the locale does, sharing what both ends share", () => {
    const normal = (s: string) => s.replace(/\s/g, " ")
    expect(
      normal(formatDateRange({ from: day(10, 1), to: day(10, 7) }, "en-US"))
    ).toBe("Oct 1 – 7, 2026")
    expect(
      normal(formatDateRange({ from: day(10, 28), to: day(11, 3) }, "en-US"))
    ).toBe("Oct 28 – Nov 3, 2026")
    expect(
      normal(formatDateRange({ from: day(10, 5), to: day(10, 5) }, "en-US"))
    ).toBe("Oct 5, 2026")
    expect(
      normal(formatDateRange({ from: day(10, 1), to: day(10, 7) }, "de-DE"))
    ).toBe("1.–7. Okt. 2026")
  })

  it("writes one day short", () => {
    expect(formatDate(day(10, 5))).toBe("Oct 5, 2026")
    expect(formatDate(day(10, 5), "fr-FR")).toBe("5 oct. 2026")
  })
})
