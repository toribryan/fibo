import { afterEach, describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import { Field, FieldLabel } from "./field.js"
import {
  DatePicker,
  DateRangePicker,
  defaultDatePresets,
  defaultDateRangePresets,
} from "./date-picker.js"

const today = new Date(2026, 9, 5)

function preset(label: string) {
  const found = defaultDateRangePresets.find((p) => p.label === label)
  if (!found) throw new Error(`No preset ${label}`)
  return found.range(today)
}

describe("defaultDateRangePresets", () => {
  it("works each range out from today", () => {
    expect(preset("Today")).toEqual({ from: today, to: today })
    expect(preset("Yesterday")).toEqual({
      from: new Date(2026, 9, 4),
      to: new Date(2026, 9, 4),
    })
    expect(preset("Last 7 days")).toEqual({
      from: new Date(2026, 8, 29),
      to: today,
    })
    expect(preset("Last 30 days")).toEqual({
      from: new Date(2026, 8, 6),
      to: today,
    })
    expect(preset("This month")).toEqual({
      from: new Date(2026, 9, 1),
      to: today,
    })
    expect(preset("Last month")).toEqual({
      from: new Date(2026, 8, 1),
      to: new Date(2026, 8, 30),
    })
    expect(preset("This quarter")).toEqual({
      from: new Date(2026, 9, 1),
      to: today,
    })
    expect(preset("Year to date")).toEqual({
      from: new Date(2026, 0, 1),
      to: today,
    })
  })

  it("works one-day presets out from today", () => {
    expect(defaultDatePresets.map((p) => p.date(today))).toEqual([
      today,
      new Date(2026, 9, 6),
      new Date(2026, 9, 12),
      new Date(2026, 10, 5),
    ])
  })
})

describe("DateRangePicker", () => {
  afterEach(async () => {
    await page.viewport(1200, 900)
  })

  it("turns off presets that fall wholly outside the bounds", async () => {
    const screen = await render(
      <DateRangePicker
        type="popover"
        minDate={new Date(2099, 0, 1)}
        maxDate={new Date(2099, 11, 31)}
      />
    )
    await screen.getByRole("button", { name: /^Date range/ }).click()
    await expect
      .element(page.getByRole("button", { name: "Yesterday" }))
      .toBeDisabled()
  })

  it("discards the draft on Cancel", async () => {
    const onChange = vi.fn()
    const value = { from: new Date(2026, 9, 5), to: new Date(2026, 9, 11) }
    const screen = await render(
      <DateRangePicker type="popover" value={value} onChange={onChange} />
    )
    const trigger = screen.getByRole("button", { name: /^Date range/ })
    await trigger.click()
    await page
      .getByRole("button", { name: "Wednesday, October 14, 2026" })
      .click()
    await page
      .getByRole("button", { name: "Thursday, October 15, 2026" })
      .click()
    await page.getByRole("button", { name: "Cancel" }).click()
    expect(onChange).not.toHaveBeenCalled()
    await expect.element(trigger).toHaveTextContent("Oct 5 – 11, 2026")

    // Opening again starts from the applied value, not the old draft.
    await trigger.click()
    await expect
      .element(page.getByText("7 days", { exact: true }))
      .toBeInTheDocument()
  })

  it("opens as a drawer on a phone-width screen", async () => {
    await page.viewport(390, 844)
    const screen = await render(<DateRangePicker />)
    await screen.getByRole("button", { name: /^Date range/ }).click()
    await expect
      .element(page.getByRole("dialog", { name: "Date range" }))
      .toHaveAttribute("data-swipe-direction", "down")
  })

  it("closes the drawer from its Cancel button without applying", async () => {
    const onChange = vi.fn()
    const screen = await render(
      <DateRangePicker type="drawer" onChange={onChange} />
    )
    const trigger = screen.getByRole("button", { name: /^Date range/ })
    await trigger.click()
    const drawer = page.getByRole("dialog", { name: "Date range" })
    await drawer.getByRole("button", { name: "Cancel" }).click()
    await expect.element(drawer).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows one month in a popover narrower than md", async () => {
    await page.viewport(700, 900)
    const screen = await render(<DateRangePicker />)
    await screen.getByRole("button", { name: /^Date range/ }).click()
    const popup = page.getByRole("dialog", { name: "Date range" })
    await expect
      .element(popup)
      .toHaveAttribute("data-slot", "date-picker-popup")
    expect(
      popup.element().querySelectorAll('[data-slot="calendar-month"]')
    ).toHaveLength(1)
  })
})

describe("open state", () => {
  it("opens inline in a container without taking focus when not modal", async () => {
    const host = document.createElement("div")
    document.body.append(host)
    const screen = await render(
      <DateRangePicker
        type="drawer"
        defaultOpen
        modal={false}
        container={host}
      />
    )
    const dialog = page.getByRole("dialog", { name: "Date range" })
    await expect.element(dialog).toBeInTheDocument()
    expect(host.contains(dialog.element())).toBe(true)
    expect(host.contains(document.activeElement)).toBe(false)
    screen.unmount()
    host.remove()
  })

  it("reports opening and closing when controlled", async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <DatePicker type="popover" open={false} onOpenChange={onOpenChange} />
    )
    await screen.getByRole("button", { name: /^Date/ }).click()
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("labelling", () => {
  it("takes its name from a FieldLabel, followed by the value", async () => {
    const screen = await render(
      <Field>
        <FieldLabel>Check-in</FieldLabel>
        <DatePicker type="popover" defaultValue={today} />
      </Field>
    )
    const trigger = screen.getByRole("button", { name: "Check-in Oct 5, 2026" })
    await expect.element(trigger).not.toHaveAttribute("aria-label")
    await screen.getByText("Check-in").click()
    await expect.element(trigger).toHaveFocus()
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument()
  })

  it("uses aria-labelledby over its own label", async () => {
    const screen = await render(
      <>
        <span id="stay-heading">Stay</span>
        <DateRangePicker
          type="popover"
          aria-labelledby="stay-heading"
          defaultValue={{ from: today, to: new Date(2026, 9, 7) }}
        />
      </>
    )
    await expect
      .element(screen.getByRole("button", { name: "Stay Oct 5 – 7, 2026" }))
      .toBeInTheDocument()
  })

  it("names itself from label and value on its own", async () => {
    const screen = await render(
      <DatePicker type="popover" label="Due date" defaultValue={today} />
    )
    await expect
      .element(screen.getByRole("button", { name: "Due date: Oct 5, 2026" }))
      .toBeInTheDocument()
  })
})
