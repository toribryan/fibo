import type { Meta, StoryObj } from "@storybook/react-vite"
import { PlusIcon, SearchIcon } from "lucide-react"
import { expect, fn, waitFor, within } from "storybook/test"

import { Button } from "./button.js"
import { Calendar, type CalendarEvent, type CalendarProps } from "./calendar.js"

const october = new Date(2026, 9, 1)

const at = (day: number, hour: number, minute = 0, month = 9) =>
  new Date(2026, month, day, hour, minute)

const monthEvents: CalendarEvent[] = [
  {
    id: "planning",
    title: "Quarterly planning",
    start: at(1, 9),
    end: at(1, 11),
  },
  { id: "review-5", title: "Design review", start: at(5, 10), end: at(5, 11) },
  { id: "one-on-one", title: "1:1 with Ana", start: at(5, 14) },
  { id: "offsite", title: "Team offsite", start: at(8, 0), allDay: true },
  { id: "standup", title: "Standup", start: at(14, 9, 30) },
  { id: "launch", title: "Launch prep", start: at(14, 13), end: at(14, 15) },
  { id: "review-20", title: "Design review", start: at(20, 10) },
  { id: "dentist", title: "Dentist", start: at(20, 16, 30) },
  { id: "workshop", title: "Research workshop", start: at(21, 13) },
  { id: "release", title: "Release 0.3", start: at(23, 0), allDay: true },
  { id: "retro", title: "Retro", start: at(27, 15), end: at(27, 16) },
  { id: "party", title: "Halloween party", start: at(30, 18) },
  { id: "sprint", title: "Sprint start", start: at(2, 9, 0, 10) },
]

const busyEvents: CalendarEvent[] = [
  ...monthEvents,
  { id: "sync", title: "Product sync", start: at(14, 11) },
  { id: "lunch", title: "Lunch with Kai", start: at(14, 12, 30) },
  { id: "interview", title: "Interview", start: at(14, 16) },
  { id: "drinks", title: "Drinks", start: at(14, 18) },
  { id: "crit", title: "Crit", start: at(15, 10) },
  { id: "pairing", title: "Pairing", start: at(15, 11) },
  { id: "docs", title: "Docs review", start: at(15, 14) },
]

const monthArgs = {
  type: "month",
  events: monthEvents,
  onEventClick: fn(),
} as const

const meta: Meta<typeof Calendar> = {
  title: "Base components/Forms/Calendar",
  component: Calendar,
  tags: ["new"],
  argTypes: {
    mode: { control: "inline-radio", options: ["single", "range"] },
    type: { control: "inline-radio", options: ["paged", "scroll", "month"] },
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
    events: { control: false },
    onEventClick: { control: false },
    labels: { control: false },
    children: { control: false },
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
        "events",
        "onEventClick",
        "labels",
        "children",
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

const fill = (args: CalendarProps) => (
  <div className="flex h-[760px] flex-col">
    <Calendar {...args} />
  </div>
)

export const Month: Story = {
  args: { ...monthArgs, defaultValue: new Date(2026, 9, 14) },
  render: fill,
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const day = (name: string) =>
      canvas.getByRole("button", { name: new RegExp(`^${name}`) })
    const agenda = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="calendar-agenda"]')!

    // The selected day's events are listed beside the grid.
    await expect(within(agenda()).getByText("Launch prep")).toBeVisible()

    await userEvent.click(day("Tuesday, October 20, 2026"))
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 20))
    await expect(
      day("Tuesday, October 20, 2026").closest('[role="gridcell"]')
    ).toHaveAttribute("aria-selected", "true")
    await expect(day("Tuesday, October 20, 2026")).toHaveAccessibleDescription(
      "2 events: Design review, 10:00 AM; Dentist, 4:30 PM"
    )
    await expect(within(agenda()).getByText("Dentist")).toBeVisible()

    // By keyboard: one tab stop, arrows move a day or a week, Enter picks.
    await expect(day("Tuesday, October 20, 2026")).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    await expect(day("Wednesday, October 21, 2026")).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 21))
    await userEvent.click(
      within(agenda()).getByRole("button", { name: /Research workshop/ })
    )
    await expect(args.onEventClick).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "workshop" })
    )

    await userEvent.click(canvas.getByRole("button", { name: "Next month" }))
    await waitFor(() =>
      expect(canvas.getByText("November 2026")).toBeInTheDocument()
    )
    await expect(args.onMonthChange).toHaveBeenLastCalledWith(
      new Date(2026, 10, 1)
    )

    await userEvent.click(canvas.getByRole("button", { name: "Today" }))
    const thisMonth = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date())
    await waitFor(() => expect(canvas.getByText(thisMonth)).toBeInTheDocument())
    await expect(
      canvasElement.querySelector('[data-slot="calendar-day"][data-today]')
    ).toHaveAttribute("tabindex", "0")

    // Back to October 2026, so the story's last frame doesn't depend on the
    // date it runs.
    const now = new Date()
    const offset = (now.getFullYear() - 2026) * 12 + (now.getMonth() - 9)
    const back = canvas.getByRole("button", {
      name: offset > 0 ? "Previous month" : "Next month",
    })
    for (let i = 0; i < Math.abs(offset); i++) await userEvent.click(back)
    await waitFor(() =>
      expect(canvas.getByText("October 2026")).toBeInTheDocument()
    )
  },
}

export const MonthOnAPhone: Story = {
  name: "Month on a phone",
  args: { ...monthArgs, defaultValue: new Date(2026, 9, 20) },
  render: (args) => (
    <div className="flex h-[760px] w-[390px] max-w-full flex-col">
      <Calendar {...args} />
    </div>
  ),
}

export const MonthEmpty: Story = {
  name: "Month, empty",
  args: { ...monthArgs, events: [], defaultValue: new Date(2026, 9, 14) },
  render: fill,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No events")).toBeVisible()
  },
}

export const MonthWithManyEvents: Story = {
  name: "Month with many events",
  args: {
    ...monthArgs,
    events: busyEvents,
    defaultValue: new Date(2026, 9, 14),
  },
  render: fill,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("+4 more")).toBeVisible()
    await expect(canvas.getByText("+1 more")).toBeVisible()
  },
}

export const MonthWithActions: Story = {
  name: "Month with actions",
  args: { ...monthArgs, defaultValue: new Date(2026, 9, 14) },
  render: (args) => (
    <div className="flex h-[760px] flex-col">
      <Calendar {...args}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
        >
          <SearchIcon aria-hidden="true" />
        </Button>
        <Button type="button" size="sm">
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          New event
        </Button>
      </Calendar>
    </div>
  ),
}
