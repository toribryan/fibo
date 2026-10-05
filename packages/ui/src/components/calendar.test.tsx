import { describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"

import { formatTime, formatTimeRange } from "@workspace/ui/lib/dates"

import { Calendar, type CalendarEvent } from "./calendar.js"

const october = new Date(2026, 9, 1)

const event = (
  id: string,
  day: number,
  hour: number,
  extra: Partial<CalendarEvent> = {}
): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start: new Date(2026, 9, day, hour),
  ...extra,
})

const dayButton = (container: HTMLElement, key: string) =>
  container.querySelector<HTMLElement>(
    `[data-slot="calendar-day"][data-date="${key}"]:not([data-outside])`
  )!

describe("Calendar", () => {
  it("starts the week on the day it's given", async () => {
    const screen = await render(
      <Calendar defaultMonth={october} weekStartsOn={1} />
    )
    const headers = screen.getByRole("columnheader").elements()
    expect(headers[0]?.getAttribute("aria-label")).toBe("Monday")
    // October 1, 2026 is a Thursday: the fourth column from Monday.
    const firstRow = screen.getByRole("row").nth(1).element()
    const cells = firstRow.querySelectorAll('[role="gridcell"]')
    expect(cells[3]?.textContent).toBe("1")
    expect(cells[2]?.textContent).toBe("")
  })

  it("orders a range picked end first", async () => {
    const onChange = vi.fn()
    const screen = await render(
      <Calendar mode="range" defaultMonth={october} onChange={onChange} />
    )
    await screen
      .getByRole("button", { name: "Tuesday, October 20, 2026" })
      .click()
    expect(onChange).toHaveBeenLastCalledWith({ from: new Date(2026, 9, 20) })
    await screen
      .getByRole("button", { name: "Wednesday, October 14, 2026" })
      .click()
    expect(onChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 9, 14),
      to: new Date(2026, 9, 20),
    })
  })

  it("marks the start selected as soon as it's picked", async () => {
    const screen = await render(
      <Calendar mode="range" defaultMonth={october} />
    )
    const start = screen.getByRole("button", {
      name: "Tuesday, October 20, 2026",
    })
    await start.click()
    expect(start.element().parentElement?.getAttribute("aria-selected")).toBe(
      "true"
    )
  })

  it("opens inside the bounds with a tab stop on a day that can be picked", async () => {
    const screen = await render(
      <Calendar
        minDate={new Date(2099, 4, 10)}
        maxDate={new Date(2099, 5, 30)}
        isDateDisabled={(date) => date.getDate() === 10}
      />
    )
    await expect.element(screen.getByText("May 2099")).toBeInTheDocument()
    const stop = screen.container.querySelector(
      '[data-slot="calendar-day"][tabindex="0"]'
    )
    expect(stop?.getAttribute("data-date")).toBe("2099-05-11")
  })

  it("only shows what a controlled value says", async () => {
    const onChange = vi.fn()
    const screen = await render(
      <Calendar
        defaultMonth={october}
        value={new Date(2026, 9, 14)}
        onChange={onChange}
      />
    )
    const other = screen.getByRole("button", {
      name: "Tuesday, October 20, 2026",
    })
    await other.click()
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 20))
    await expect.element(other).not.toHaveAttribute("data-selected")
    await expect
      .element(
        screen.getByRole("button", { name: "Wednesday, October 14, 2026" })
      )
      .toHaveAttribute("data-selected")
  })

  it("keeps the keyboard inside the min and max dates", async () => {
    const screen = await render(
      <Calendar
        defaultMonth={october}
        defaultValue={new Date(2026, 9, 6)}
        minDate={new Date(2026, 9, 5)}
        maxDate={new Date(2026, 9, 9)}
      />
    )
    const sixth = screen.getByRole("button", {
      name: "Tuesday, October 6, 2026",
    })
    sixth.element().focus()
    await userEvent.keyboard("{ArrowUp}")
    await expect
      .element(screen.getByRole("button", { name: "Monday, October 5, 2026" }))
      .toHaveFocus()
    await userEvent.keyboard("{PageDown}")
    await expect
      .element(screen.getByRole("button", { name: "Friday, October 9, 2026" }))
      .toHaveFocus()
    await expect
      .element(screen.getByRole("button", { name: "Next month" }))
      .toBeDisabled()
  })

  it("ignores a disabled day", async () => {
    const onChange = vi.fn()
    const screen = await render(
      <Calendar
        defaultMonth={october}
        onChange={onChange}
        isDateDisabled={(date) => date.getDay() === 0}
      />
    )
    const sunday = screen.getByRole("button", {
      name: "Sunday, October 11, 2026",
    })
    await expect.element(sunday).toHaveAttribute("aria-disabled", "true")
    await sunday.click({ force: true })
    expect(onChange).not.toHaveBeenCalled()
  })

  it("scrolls to the selected month once a hidden calendar is shown", async () => {
    const screen = await render(
      <div hidden data-testid="tab">
        <Calendar
          type="scroll"
          defaultValue={new Date(2026, 9, 14)}
          style={{ height: 400 }}
        />
      </div>
    )
    const tab = screen.getByTestId("tab").element() as HTMLElement
    tab.hidden = false
    const scroller = screen.container.querySelector<HTMLElement>(
      '[data-slot="calendar-scroll"]'
    )!
    await expect.poll(() => scroller.scrollTop).toBeGreaterThan(0)
  })

  it("opens a scroll calendar on the selected month", async () => {
    const screen = await render(
      <Calendar
        type="scroll"
        size="lg"
        defaultValue={new Date(2026, 9, 14)}
        style={{ height: 400 }}
      />
    )
    const scroller = screen.container.querySelector<HTMLElement>(
      '[data-slot="calendar-scroll"]'
    )
    expect(scroller?.scrollTop).toBeGreaterThan(0)
    const title = screen.getByText("October 2026").element()
    const top =
      title.getBoundingClientRect().top - scroller!.getBoundingClientRect().top
    expect(Math.abs(top)).toBeLessThan(40)
  })

  it("stacks two months in a narrow column without shrinking the days", async () => {
    const screen = await render(
      <div style={{ width: 390 }}>
        <Calendar mode="range" months={2} defaultMonth={october} />
      </div>
    )
    const days = screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="calendar-day"]'
    )
    for (const day of days) {
      expect(day.getBoundingClientRect().width).toBe(36)
    }
    const [first, second] = screen.container.querySelectorAll(
      '[data-slot="calendar-month"]'
    )
    const a = first!.getBoundingClientRect()
    const b = second!.getBoundingClientRect()
    expect(b.top).toBeGreaterThanOrEqual(a.bottom)
    // The next button stays on the first month's title row, at its end.
    const next = screen.getByRole("button", { name: "Next month" })
    const n = next.element().getBoundingClientRect()
    expect(Math.round(n.right)).toBe(Math.round(a.right))
    expect(n.top).toBeLessThan(a.top + 8)
  })

  it("sets two months side by side where it sizes to its content", async () => {
    await page.viewport(1200, 900)
    const screen = await render(
      <div style={{ display: "flex" }}>
        <Calendar months={2} defaultMonth={october} />
      </div>
    )
    const [first, second] = screen.container.querySelectorAll(
      '[data-slot="calendar-month"]'
    )
    expect(second!.getBoundingClientRect().top).toBe(
      first!.getBoundingClientRect().top
    )
    expect(second!.getBoundingClientRect().left).toBeGreaterThan(
      first!.getBoundingClientRect().right
    )
  })

  it("keeps two months side by side when the caller pads it", async () => {
    await page.viewport(1200, 900)
    const screen = await render(
      <div style={{ display: "flex" }}>
        <Calendar months={2} defaultMonth={october} className="p-3" />
      </div>
    )
    const [first, second] = screen.container.querySelectorAll(
      '[data-slot="calendar-month"]'
    )
    expect(second!.getBoundingClientRect().top).toBe(
      first!.getBoundingClientRect().top
    )
  })
})

describe("Calendar month type", () => {
  it("puts each event on the day it starts, all-day events first", async () => {
    await page.viewport(1200, 900)
    const screen = await render(
      <div style={{ height: 800, display: "flex" }}>
        <Calendar
          type="month"
          defaultMonth={october}
          events={[
            event("late", 20, 23),
            event("early", 20, 8),
            event("all", 20, 0, { allDay: true }),
            event("other", 21, 9),
          ]}
        />
      </div>
    )
    const twentieth = dayButton(screen.container, "2026-10-20")
    expect(twentieth.dataset.events).toBe("3")
    const titles = [
      ...twentieth.querySelectorAll('[data-slot="calendar-event-card"]'),
    ].map((card) => card.textContent)
    expect(titles[0]).toContain("Event all")
    expect(titles[1]).toContain("Event early")
    expect(dayButton(screen.container, "2026-10-21").dataset.events).toBe("1")
    expect(dayButton(screen.container, "2026-10-22").dataset.events).toBe(
      undefined
    )
  })

  it("shows two cards and counts the rest", async () => {
    await page.viewport(1200, 900)
    const screen = await render(
      <div style={{ height: 800, display: "flex" }}>
        <Calendar
          type="month"
          defaultMonth={october}
          events={[1, 2, 3, 4, 5].map((n) => event(`e${n}`, 14, 8 + n))}
        />
      </div>
    )
    const day = dayButton(screen.container, "2026-10-14")
    expect(
      day.querySelectorAll('[data-slot="calendar-event-card"]')
    ).toHaveLength(2)
    expect(
      day.querySelector('[data-slot="calendar-event-more"]')?.textContent
    ).toBe("+3 more")
  })

  it("switches to compact cells by its own width, not the viewport's", async () => {
    await page.viewport(1600, 900)
    const events = [event("a", 14, 9), event("b", 14, 10)]
    const screen = await render(
      <div style={{ display: "flex", gap: 16, height: 800 }}>
        <div data-testid="wide" style={{ width: 1100, display: "flex" }}>
          <Calendar type="month" defaultMonth={october} events={events} />
        </div>
        <div data-testid="narrow" style={{ width: 390, display: "flex" }}>
          <Calendar type="month" defaultMonth={october} events={events} />
        </div>
      </div>
    )
    const parts = (testId: string) => {
      const root = screen.getByTestId(testId).element()
      const day = dayButton(root as HTMLElement, "2026-10-14")
      const cards = day.querySelector('[data-slot="calendar-day-events"]')!
      const dots = day.querySelector('[data-slot="calendar-day-dots"]')!
      const grid = root
        .querySelector('[data-slot="calendar-grid"]')!
        .getBoundingClientRect()
      const agenda = root
        .querySelector('[data-slot="calendar-agenda"]')!
        .getBoundingClientRect()
      return {
        cards: getComputedStyle(cards).display,
        dots: getComputedStyle(dots).display,
        agendaBelow: agenda.top >= grid.bottom,
      }
    }
    expect(parts("wide")).toEqual({
      cards: "flex",
      dots: "none",
      agendaBelow: false,
    })
    expect(parts("narrow")).toEqual({
      cards: "none",
      dots: "flex",
      agendaBelow: true,
    })
  })

  it("lists the selected day's events, or says there are none", async () => {
    const onEventClick = vi.fn()
    const screen = await render(
      <Calendar
        type="month"
        defaultMonth={october}
        defaultValue={new Date(2026, 9, 14)}
        events={[event("a", 14, 9, { title: "Standup" })]}
        onEventClick={onEventClick}
      />
    )
    await screen.getByRole("button", { name: /Standup/ }).click()
    expect(onEventClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" })
    )
    await screen
      .getByRole("button", { name: "Thursday, October 15, 2026" })
      .click()
    await expect.element(screen.getByText("No events")).toBeVisible()
  })

  it("goes back to today's month with Today", async () => {
    const onMonthChange = vi.fn()
    const screen = await render(
      <Calendar
        type="month"
        defaultMonth={new Date(2020, 0, 1)}
        onMonthChange={onMonthChange}
      />
    )
    await expect
      .element(screen.getByText("January 2020", { exact: true }))
      .toBeInTheDocument()
    await screen.getByRole("button", { name: "Today" }).click()
    const now = new Date()
    expect(onMonthChange).toHaveBeenLastCalledWith(
      new Date(now.getFullYear(), now.getMonth(), 1)
    )
    const today = screen.container.querySelector<HTMLElement>(
      '[data-slot="calendar-day"][data-today]:not([data-outside])'
    )
    expect(today?.getAttribute("tabindex")).toBe("0")
  })

  it("turns the page when a day from the month before is picked", async () => {
    const onChange = vi.fn()
    const screen = await render(
      <Calendar type="month" defaultMonth={october} onChange={onChange} />
    )
    const outside = screen.container.querySelector<HTMLElement>(
      '[data-slot="calendar-day"][data-outside][data-date="2026-09-30"]'
    )!
    outside.click()
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 8, 30))
    await expect
      .element(screen.getByText("September 2026", { exact: true }))
      .toBeInTheDocument()
  })

  it("draws a range calendar as paged and warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const screen = await render(
      // @ts-expect-error The month type picks one day only.
      <Calendar type="month" mode="range" defaultMonth={october} />
    )
    expect(
      screen.container
        .querySelector('[data-slot="calendar"]')
        ?.getAttribute("data-type")
    ).toBe("paged")
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe("Calendar month type on a server", () => {
  it("hydrates the server's markup without a difference", async () => {
    const tree = (
      <Calendar
        type="month"
        defaultMonth={october}
        defaultValue={new Date(2026, 9, 14)}
        events={[
          event("a", 14, 9, { end: new Date(2026, 9, 14, 10) }),
          event("b", 20, 0, { allDay: true }),
        ]}
      />
    )
    const html = renderToString(tree)
    expect(html).not.toContain('aria-current="date"')
    expect(html).not.toMatch(/[\u2009\u202f]/)
    const host = document.createElement("div")
    host.innerHTML = html
    document.body.append(host)
    const errors: unknown[] = []
    const root = hydrateRoot(host, tree, {
      onRecoverableError: (error) => errors.push(error),
    })
    // Today arrives on the client, after hydration, and enables its button.
    await expect
      .poll(() =>
        host
          .querySelector('[data-slot="calendar-today"]')
          ?.hasAttribute("disabled")
      )
      .toBe(false)
    expect(errors).toEqual([])
    root.unmount()
    host.remove()
  })
})

describe("time formatting", () => {
  it("writes times with plain spaces, so server and client markup match", () => {
    const start = new Date(2026, 9, 5, 9, 30)
    const end = new Date(2026, 9, 5, 10, 0)
    expect(formatTime(start)).toBe("9:30 AM")
    expect(formatTimeRange(start, end)).toBe("9:30 – 10:00 AM")
    expect(formatTimeRange(start, end)).not.toMatch(/[\u2009\u202f]/)
  })
})
