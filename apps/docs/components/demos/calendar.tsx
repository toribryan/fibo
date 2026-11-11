"use client"

import { Calendar, type CalendarEvent } from "@workspace/ui/components/calendar"

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute)

const EVENTS: CalendarEvent[] = [
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
]

export function CalendarDisabledDaysDemo() {
  return (
    <Calendar
      defaultMonth={new Date(2026, 9, 1)}
      minDate={new Date(2026, 9, 5)}
      maxDate={new Date(2026, 10, 20)}
      isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6}
    />
  )
}

export function CalendarMonthDemo() {
  return (
    // The month view fills its parent, so the parent sets the height.
    <div className="flex h-[640px] w-full flex-col">
      <Calendar
        type="month"
        events={EVENTS}
        defaultValue={new Date(2026, 9, 14)}
      />
    </div>
  )
}
