import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor, within } from "storybook/test"

import {
  DatePicker,
  DateRangePicker,
  defaultDatePresets,
  type DatePreset,
  type DateRange,
  type DateRangePreset,
} from "./date-picker.js"

const meta: Meta<typeof DatePicker> = {
  title: "Base components/Forms/Date picker",
  component: DatePicker,
  tags: ["new"],
  argTypes: {
    type: {
      control: "inline-radio",
      options: ["auto", "popover", "drawer"],
    },
    size: { control: "inline-radio", options: ["sm", "default"] },
    weekStartsOn: { control: "inline-radio", options: [0, 1] },
    locale: { control: "text" },
    label: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    modal: { control: "boolean" },
    value: { control: false },
    open: { control: false },
    defaultOpen: { control: false },
    onOpenChange: { control: false },
    container: { control: false },
    defaultValue: { control: false },
    onChange: { control: false },
    presets: { control: false },
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
        "presets",
        "minDate",
        "maxDate",
        "isDateDisabled",
        "open",
        "defaultOpen",
        "onOpenChange",
        "container",
      ],
    },
  },
  // Shared by both pickers; each story sets its own value and label, since
  // the range stories render DateRangePicker with these args too.
  args: {
    type: "auto",
    size: "default",
    weekStartsOn: 0,
    locale: "en-US",
    disabled: false,
    modal: true,
    onChange: fn(),
  },
}

export default meta
type Story = StoryObj<typeof DatePicker>
type RangeStory = StoryObj<typeof DateRangePicker>

const single = {
  label: "Due date",
  placeholder: "Select a date",
  defaultValue: new Date(2026, 9, 14),
}

export const Default: Story = {
  args: single,
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // The panel renders in a portal on the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: /^Due date/ })
    await expect(trigger).toHaveTextContent("Oct 14, 2026")

    await userEvent.click(trigger)
    const dialog = await page.findByRole("dialog", { name: "Due date" })
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", {
          name: "Wednesday, October 14, 2026",
        })
      ).toHaveFocus()
    )
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Tuesday, October 20, 2026" })
    )
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 20))
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await expect(trigger).toHaveTextContent("Oct 20, 2026")
    await waitFor(() => expect(trigger).toHaveFocus())

    // By keyboard: Enter opens on the picked day, arrows move, Enter picks
    // and closes, and focus comes back to the trigger.
    await userEvent.keyboard("{Enter}")
    const again = await page.findByRole("dialog", { name: "Due date" })
    const twentieth = within(again).getByRole("button", {
      name: "Tuesday, October 20, 2026",
    })
    await waitFor(() => expect(twentieth).toHaveFocus())
    await userEvent.keyboard("{ArrowLeft}")
    await expect(
      within(again).getByRole("button", { name: "Monday, October 19, 2026" })
    ).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 19))
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())

    // Escape closes without picking.
    await userEvent.keyboard("{Enter}")
    await page.findByRole("dialog", { name: "Due date" })
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(args.onChange).toHaveBeenCalledTimes(2)
  },
}

export const WithPresets: Story = {
  name: "With presets",
  args: { ...single, presets: defaultDatePresets, defaultValue: null },
}

const weekdays: DatePreset[] = [
  { label: "Next Monday", date: (today) => nextWeekday(today, 1) },
  { label: "Next Friday", date: (today) => nextWeekday(today, 5) },
]

function nextWeekday(today: Date, weekday: number) {
  const ahead = (weekday - today.getDay() + 7) % 7 || 7
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + ahead
  )
}

export const MinAndMax: Story = {
  name: "Min and max",
  args: {
    ...single,
    label: "Delivery",
    defaultValue: null,
    presets: weekdays,
    minDate: new Date(2026, 9, 7),
    maxDate: new Date(2026, 9, 30),
    isDateDisabled: (date: Date) => date.getDay() === 0 || date.getDay() === 6,
  },
}

export const Controlled: Story = {
  args: single,
  render: function Render(args) {
    const [date, setDate] = React.useState<Date | null>(new Date(2026, 9, 14))
    return (
      <div className="flex flex-col items-start gap-3">
        <DatePicker {...args} value={date} onChange={setDate} />
        <p className="text-sm text-muted-foreground">
          {date ? date.toDateString() : "Nothing picked"}
        </p>
      </div>
    )
  },
}

export const OnAPhone: Story = {
  name: "On a phone",
  args: { ...single, type: "drawer" },
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /^Due date/ }))
    const drawer = await page.findByRole("dialog", { name: "Due date" })
    await userEvent.click(
      within(drawer).getByRole("button", { name: "Friday, October 30, 2026" })
    )
    await expect(args.onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 30))
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
  },
}

const week: DateRange = {
  from: new Date(2026, 9, 5),
  to: new Date(2026, 9, 11),
}

export const Range: RangeStory = {
  args: { label: "Date range", defaultValue: week },
  render: (args) => <DateRangePicker {...args} />,
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole("button", { name: /^Date range/ })
    await expect(trigger).toHaveTextContent("Oct 5 – 11, 2026")

    await userEvent.click(trigger)
    const dialog = await page.findByRole("dialog", { name: "Date range" })
    const day = (name: string) => within(dialog).getByRole("button", { name })
    await waitFor(() => expect(day("Monday, October 5, 2026")).toHaveFocus())

    // Two picks make a draft; nothing is applied until Apply.
    await userEvent.click(day("Wednesday, October 14, 2026"))
    await expect(within(dialog).getByText("Pick an end date")).toBeVisible()
    await userEvent.click(day("Tuesday, October 20, 2026"))
    await expect(within(dialog).getByText("7 days")).toBeVisible()
    await expect(args.onChange).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply" }))
    await expect(args.onChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 9, 14),
      to: new Date(2026, 9, 20),
    })
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await expect(trigger).toHaveTextContent("Oct 14 – 20, 2026")
    await waitFor(() => expect(trigger).toHaveFocus())

    // By keyboard: arrows move the focused day and preview the range;
    // Escape discards the draft and returns focus to the trigger.
    await userEvent.keyboard("{Enter}")
    const again = await page.findByRole("dialog", { name: "Date range" })
    const start = within(again).getByRole("button", {
      name: "Wednesday, October 14, 2026",
    })
    await waitFor(() => expect(start).toHaveFocus())
    await userEvent.keyboard("{Enter}")
    await userEvent.keyboard("{ArrowDown}")
    await expect(
      within(again).getByRole("button", { name: "Wednesday, October 21, 2026" })
    ).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}{Enter}")
    await expect(within(again).getByText("Oct 14 – 22, 2026")).toBeVisible()
    await expect(within(again).getByText("9 days")).toBeVisible()
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(args.onChange).toHaveBeenCalledTimes(1)
    await expect(trigger).toHaveTextContent("Oct 14 – 20, 2026")
  },
}

export const RangeControlled: RangeStory = {
  name: "Range, controlled",
  args: { label: "Report period" },
  render: function Render(args) {
    const [range, setRange] = React.useState<DateRange | null>(week)
    return (
      <div className="flex flex-col items-start gap-3">
        <DateRangePicker {...args} value={range} onChange={setRange} />
        <p className="text-sm text-muted-foreground">
          {range
            ? `${range.from.toDateString()} to ${range.to.toDateString()}`
            : "No range"}
        </p>
      </div>
    )
  },
}

const sprints: DateRangePreset[] = [
  {
    label: "This sprint",
    range: (today) => {
      const start = new Date(2026, 0, 5)
      const days = Math.floor((today.getTime() - start.getTime()) / 86_400_000)
      const from = new Date(2026, 0, 5 + Math.floor(days / 14) * 14)
      return {
        from,
        to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 13),
      }
    },
  },
  {
    label: "Next 14 days",
    range: (today) => ({
      from: today,
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13),
    }),
  },
  {
    label: "Next 90 days",
    range: (today) => ({
      from: today,
      to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 89),
    }),
  },
]

export const RangeCustomPresets: RangeStory = {
  name: "Range with custom presets",
  args: { label: "Sprint", presets: sprints, weekStartsOn: 1 },
  render: (args) => <DateRangePicker {...args} />,
}

export const RangeOneMonth: RangeStory = {
  name: "Range, one month",
  args: { label: "Stay", presets: [], months: 1, defaultValue: week },
  render: (args) => <DateRangePicker {...args} />,
}

export const RangeOnAPhone: RangeStory = {
  name: "Range on a phone",
  args: { label: "Date range", type: "drawer", defaultValue: week },
  globals: { viewport: { value: "mobile2", isRotated: false } },
  render: (args) => <DateRangePicker {...args} />,
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: /^Date range/ }))
    const drawer = await page.findByRole("dialog", { name: "Date range" })
    const day = (name: string) => within(drawer).getByRole("button", { name })

    await userEvent.click(day("Thursday, October 1, 2026"))
    await userEvent.click(day("Saturday, October 3, 2026"))
    await expect(within(drawer).getByText("3 days")).toBeVisible()
    await userEvent.click(within(drawer).getByRole("button", { name: "Apply" }))
    await expect(args.onChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 9, 1),
      to: new Date(2026, 9, 3),
    })
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())

    // Presets sit in a chip row that scrolls sideways.
    await userEvent.click(canvas.getByRole("button", { name: /^Date range/ }))
    const again = await page.findByRole("dialog", { name: "Date range" })
    const lastWeek = within(again).getByRole("button", { name: "Last 7 days" })
    await userEvent.click(lastWeek)
    await expect(lastWeek).toHaveAttribute("aria-pressed", "true")
    await expect(within(again).getByText("7 days")).toBeVisible()
  },
}
