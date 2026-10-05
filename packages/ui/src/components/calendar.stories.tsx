import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor } from "storybook/test"

import { Calendar } from "./calendar.js"

const october = new Date(2026, 9, 1)

const meta: Meta<typeof Calendar> = {
  title: "Base components/Forms/Calendar",
  component: Calendar,
  tags: ["new"],
  argTypes: {
    mode: { control: "inline-radio", options: ["single", "range"] },
    type: { control: "inline-radio", options: ["paged", "scroll"] },
    size: { control: "inline-radio", options: ["default", "lg"] },
    months: { control: "inline-radio", options: [1, 2] },
    weekStartsOn: { control: "inline-radio", options: [0, 1] },
    locale: { control: "text" },
    value: { control: false },
    defaultValue: { control: false },
    onChange: { control: false },
    month: { control: false },
    defaultMonth: { control: false },
    onMonthChange: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
    isDateDisabled: { control: false },
  },
  parameters: {
    controls: {
      exclude: [
        "value",
        "defaultValue",
        "onChange",
        "month",
        "defaultMonth",
        "onMonthChange",
        "minDate",
        "maxDate",
        "isDateDisabled",
      ],
    },
  },
  args: {
    mode: "single",
    type: "paged",
    size: "default",
    months: 1,
    weekStartsOn: 0,
    locale: "en-US",
    defaultMonth: october,
    defaultValue: new Date(2026, 9, 15),
    onChange: fn(),
    onMonthChange: fn(),
  },
  render: (args) => (
    <div className="rounded-xl border border-border p-3">
      <Calendar {...args} />
    </div>
  ),
}

export default meta
type Story = StoryObj<typeof Calendar>

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const day = (name: string) => canvas.getByRole("button", { name })

    await userEvent.click(day("Tuesday, October 20, 2026"))
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 20))
    await expect(day("Tuesday, October 20, 2026")).toHaveAttribute(
      "data-selected"
    )
    await expect(day("Tuesday, October 20, 2026")).toHaveAttribute(
      "tabindex",
      "0"
    )

    // By keyboard: one tab stop in the grid, arrows move a day or a week,
    // and Enter picks.
    await expect(day("Tuesday, October 20, 2026")).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(day("Wednesday, October 21, 2026")).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(day("Wednesday, October 28, 2026")).toHaveFocus()
    await userEvent.keyboard("{Home}")
    await expect(day("Sunday, October 25, 2026")).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 25))

    // PageDown turns the page and keeps the day of the month.
    await userEvent.keyboard("{PageDown}")
    await waitFor(() =>
      expect(day("Wednesday, November 25, 2026")).toHaveFocus()
    )
    // The new month fades in, so it's visible once the slide settles.
    await waitFor(() => expect(canvas.getByText("November 2026")).toBeVisible())
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(
      new Date(2026, 10, 1)
    )

    await userEvent.click(
      canvas.getByRole("button", { name: "Previous month" })
    )
    await waitFor(() => expect(canvas.getByText("October 2026")).toBeVisible())
  },
}

export const Range: Story = {
  args: {
    mode: "range",
    months: 2,
    defaultValue: { from: new Date(2026, 9, 6), to: new Date(2026, 9, 12) },
  },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const day = (name: string) => canvas.getByRole("button", { name })

    await userEvent.click(day("Wednesday, October 28, 2026"))
    await expect(args.onChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 9, 28),
    })
    await expect(
      canvas.getByText("Start Oct 28, 2026. Choose an end date.")
    ).toBeInTheDocument()

    // Hovering previews the range before the second pick, across months.
    await userEvent.hover(day("Wednesday, November 4, 2026"))
    await waitFor(() =>
      expect(
        canvasElement.querySelectorAll('[data-slot="calendar-range-bar"]')
          .length
      ).toBeGreaterThan(1)
    )

    // Picking an earlier day orders the range.
    await userEvent.click(day("Monday, October 19, 2026"))
    await expect(args.onChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 9, 19),
      to: new Date(2026, 9, 28),
    })
    await expect(
      canvas.getByText("Oct 19 – 28, 2026, 10 days")
    ).toBeInTheDocument()
  },
}

export const DisabledDays: Story = {
  name: "Disabled days",
  args: {
    defaultValue: null,
    minDate: new Date(2026, 9, 5),
    maxDate: new Date(2026, 10, 20),
    isDateDisabled: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  },
  play: async ({ args, canvas, userEvent }) => {
    const before = canvas.getByRole("button", {
      name: "Friday, October 2, 2026",
    })
    await expect(before).toHaveAttribute("aria-disabled", "true")
    await userEvent.click(before)
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(
      canvas.getByRole("button", { name: "Previous month" })
    ).toBeDisabled()
  },
}

export const WeekStartsMonday: Story = {
  name: "Week starts Monday",
  args: { weekStartsOn: 1 },
  play: async ({ canvas }) => {
    const headers = canvas.getAllByRole("columnheader")
    await expect(headers[0]).toHaveAccessibleName("Monday")
    await expect(headers[6]).toHaveAccessibleName("Sunday")
  },
}

export const Locale: Story = {
  args: { locale: "fr-FR", weekStartsOn: 1, mode: "range", months: 2 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("octobre 2026")).toBeVisible()
    await expect(canvas.getAllByRole("columnheader")[0]).toHaveAccessibleName(
      "lundi"
    )
  },
}
