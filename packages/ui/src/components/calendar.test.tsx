import { describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Calendar } from "./calendar.js"

const october = new Date(2026, 9, 1)

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
})
