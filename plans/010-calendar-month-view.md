# 010 Calendar month view

## What is changing

Calendar gets a third type, `type="month"`: a month of events that fills its
parent. Desktop shows a header (the month and year as the title, the month's
date span under it, Previous, Today and Next joined as one group, and the
caller's actions at the end), a seven-column grid of bordered day cells that
take the available height, and the selected day's events in a list beside
the grid (under it below 1024 pixels). Each cell shows its day number, today ringed and the selected day
filled, and its first two events as cards with title and time, then
"+N more". Days from the months either side are muted. When the calendar
itself is narrower than 768 pixels, the cells shrink to the day number and
up to three dots, and the list moves below the grid.

```tsx
<Calendar
  type="month"
  events={events}
  value={day}
  onChange={setDay}
  onEventClick={openEvent}
>
  <Button size="sm">New event</Button>
</Calendar>
```

New API, all on Calendar:

- `events?: CalendarEvent[]`, with
  `CalendarEvent = { id; title; start; end?; allDay? }`. Single-day events,
  shown on the day they start.
- `onEventClick?: (event) => void`. The selected day's events become buttons.
- `children`: the header's actions, in the month type only.
- `labels?: Partial<CalendarLabels>` for the English it writes (Previous
  month, Next month, Today, +N more, No events, All day, and the spoken
  event count), following Command menu's `labels`. Previous and next apply
  to the paged type too.

Selection, `month`, bounds, `weekStartsOn` and `locale` are the ones the
other types already take. Times go through `formatTime` and
`formatTimeRange` in `lib/dates.ts`, with plain spaces like the date
formatters, so server and client markup match.

## Why now

Date picker (plan 008) gave fibo a grid for choosing dates. Projects built on
fibo also need to show dates with things on them: bookings, a content
calendar, a team's schedule. Without a part, each project would draw its own
month grid and leave out the keyboard model and grid semantics Calendar
already has.

## Options

**A new part, Event calendar.** Its own file, name and docs page. It keeps
Calendar small, but copies the date arithmetic, today's client-only store,
the keyboard model, bounds and locale handling, or pulls them out into a
shared hook that both parts import. Two parts would also drift apart in how
they select, page and mark today.

**A type on Calendar.** Calendar already switches layout by `type` (paged,
scroll) over one selection model, one keyboard model and one store for
today. A month of events is another layout of the same grid. It adds one
value to a prop people already know and reuses everything else.

**Replace Calendar's paged type.** One month view for both picking and
showing. It doesn't fit: Date picker needs a compact grid in a popover, and
cells sized for events are far too big there.

## What was chosen

A type, `type="month"`. Nothing about `paged`, `scroll` or Date picker
changes.

- **Single day only.** The month type picks one day. `mode="range"` with it
  is a type error; at runtime a range calendar draws the paged type and
  warns once in the console, since a range caller's `onChange` expects a
  range and a month view would break that contract.
- **Keyboard and grid.** The grid keeps the date grid's model: a `grid`
  labelled by the title, one button per cell, one tab stop, arrows by day and
  week, Home and End, Page Up and Page Down. Each cell's button fills the
  cell, so a click anywhere in it picks the day. The cards, "+N more" and
  dots sit inside that button, hidden from assistive technology, and the
  button is described (`aria-describedby`) by a visually hidden list of the
  day's events and their times. Nothing inside a cell takes focus.
- **Where events are interactive.** In the selected day's list, outside the
  grid. With `onEventClick` each is a button; without it, plain text. On a
  wide calendar the list sits beside the grid, so the grid keeps the
  height, and the reference design's grid-only page gains a column. That list is the one place for an event's keyboard
  and screen reader path. Cards in cells stay part of the day button: as
  buttons of their own they would be controls nested in a control, or extra
  tab stops inside the grid that break its one-stop model.
- **Days either side.** The grid shows the ends of the months before and
  after, muted. They are not tab stops; picking one turns the page to its
  month, as moving there by keyboard already does.
- **Layout by the calendar's width.** A container query on the root
  (`@container/calendar`, which the paged type already uses), so a month in
  a side panel gets compact cells on a wide screen. Below 768 pixels: dots,
  and the list under the grid. From 768: cards, with the list still under
  the grid. Below 1024 the grid and list scroll together, so the grid never
  cuts a row in half. From 1024: the list moves beside the grid, which
  then fills the height. Beside it any narrower, the cells would be too
  thin to read a card's title.
- **Today.** Read through the same client-only store as the other types. The
  server renders no today marker and a disabled Today button, and the
  client fills them in after hydration, so markup never depends on the
  server's clock.
- **Cards per cell.** Two cards, then "+N more", so every cell holds at most
  three lines of events and rows stay even. All-day events come first, then
  by start time.
- **Actions by composition.** Children render in the header's actions area
  (plan 006); there are no `showSearch` or `onAdd` props. The other types
  ignore children.
