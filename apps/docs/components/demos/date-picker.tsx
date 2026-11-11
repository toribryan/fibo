"use client"

import {
  DatePicker,
  defaultDatePresets,
  type DatePreset,
} from "@workspace/ui/components/date-picker"

function nextWeekday(today: Date, weekday: number) {
  const ahead = (weekday - today.getDay() + 7) % 7 || 7
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + ahead
  )
}

const WEEKDAYS: DatePreset[] = [
  { label: "Next Monday", date: (today) => nextWeekday(today, 1) },
  { label: "Next Friday", date: (today) => nextWeekday(today, 5) },
]

export function DatePickerPresetsDemo() {
  return (
    <DatePicker
      label="Due date"
      placeholder="Select a date"
      presets={defaultDatePresets}
    />
  )
}

export function DatePickerMinMaxDemo() {
  return (
    <DatePicker
      label="Delivery"
      placeholder="Select a date"
      presets={WEEKDAYS}
      minDate={new Date(2026, 9, 7)}
      maxDate={new Date(2026, 9, 30)}
      isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6}
    />
  )
}
