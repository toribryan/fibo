# 008 Date pickers

## What is changing

fibo gets three ways to pick dates, shipped as two registry parts:

- **Calendar** (`calendar`): the month grid on its own. It picks one day or
  a range, pages one or two months side by side, or stacks a year either side
  in one vertical scroll for phones.
- **Date picker** (`date-picker`): one file with `DatePicker` and
  `DateRangePicker`. Each is a field-like trigger that opens a Calendar.
  `DateRangePicker` adds a preset rail, a two-month view and a footer with
  the range, its length in days, Cancel and Apply. `DatePicker` shows one
  month and picks as soon as a day is chosen.

On screens below the `sm` breakpoint both pickers open a bottom drawer
instead of a popover: a handle, the picker's label as a title with Cancel
beside it, presets as a sideways-scrolling chip
row, a sticky weekday header over months stacked in a vertical scroll, 44
pixel day cells, and a sticky footer with the range, its length and a
full-width Apply. The single-day picker picks and closes. Between `sm` and
`md` the range popover shows one month, since two and the preset rail don't
fit.

Date arithmetic and formatting live in `lib/dates.ts`, a helper both parts
import, so the registry ships it with each as a `registry:lib` file.

## Why now

Forms is the group people reach into first, and it had no way to enter a
date. Reports, bookings, filters and due dates all need one, and Data table
and Filter menu will want a date range filter. Without a part, each project
writes its own grid, and the keyboard model and the grid semantics are the
pieces most often left out.

## Options

**Wrap a calendar library.** react-day-picker is what shadcn's Calendar uses.
It is solid, but it is a fourth dependency on a base part, which the shelf
rule forbids for everything but Data table, and its markup and class names
would have to be overridden throughout to take fibo's tokens. Its range
styling is per cell, so a continuous bar with a live preview would be drawn
on top of it anyway.

**Use a date library** (date-fns, Day.js, Temporal polyfill). The grid needs
about a dozen operations: add days and months, start and end of week and
month, compare days, count days between. Each is a few lines on `Date`
built from year, month and day parts, which keeps them right across daylight
saving. Formatting is `Intl.DateTimeFormat`, whose `formatRange` already
writes "Oct 1 – 7, 2026" the way each locale does. A library would add
weight and a dependency to save fewer than 150 lines, all of them covered by
unit tests.

**Animate with `motion`.** The reference design slides months with springs
and morphs the trigger into the panel. Base parts may not depend on
`motion`; that is the line between the shelves. Months slide with
`tw-animate-css` classes, which every shadcn app already has, and stop under
reduced motion. The trigger stays a trigger.

**One responsive panel, restyled by CSS, on phones.** A popover anchored to
a field doesn't fit a 390 pixel screen with two months and a preset rail,
and one month in a popover leaves 36 pixel targets under a thumb. A drawer
from the bottom is the native pattern for this on phones: it is reachable,
it has room for 44 pixel cells, and a vertical scroll through months is how
people already move through dates on a phone. Since a popover and a drawer
are different Base UI primitives, not one element restyled, the choice is
made in script with a media query, and a `type` prop can force either so
both are shown and tested in Storybook at any width.

## What was chosen

- Two parts on the base shelf, group Forms, built on Base UI's Popover and
  on fibo's Sheet (Base UI's Drawer) with a grid written for fibo. No new
  dependencies and no `motion`.
- The grid follows the WAI-ARIA date picker pattern: `role="grid"` labeled
  by the month, column headers with the full weekday name, one tab stop,
  arrows by day and week, Home and End to the week's ends, Page Up and Page
  Down by month, with Shift by year. Days outside the bounds stay focusable
  but `aria-disabled`, so the keyboard never jumps over a gap.
- A range is drawn as one bar per week row with solid thumbs on its ends,
  previewed live under the pointer or the keyboard while the second day is
  chosen. Picking an earlier second day orders the range.
- Today is read on the client only, through `useSyncExternalStore` with a
  null server snapshot, and turns over at local midnight.
- `DateRangePicker` keeps a draft until Apply; Cancel, Escape or a tap
  outside discard it. Presets are functions of today, clamped to the bounds,
  and turned off when none of their range is allowed.
- Copy in the parts (Apply, Pick an end date, the live status) is English;
  dates, months and weekdays follow `locale`.
