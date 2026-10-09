# 006 Composition

## What is changing

fibo's parts get composed rather than configured. Where a prop draws a
separate thing (a status, a count, a preview card), that thing becomes a part
of its own that callers put in as a child. Where a flag only switches a
sub-part on, the sub-part is rendered or left out instead. Where several
parts draw the same small piece by hand, a shared primitive replaces them.
Where state is locked inside a part that callers need to drive, it becomes
controllable.

Sticker avatar is the example. Today:

```tsx
<StickerAvatar
  name="Ana Ruiz"
  src={src}
  status="away"
  statusLabel="Ausente"
  statusColor
/>
```

After:

```tsx
<StickerAvatar name="Ana Ruiz" src={src}>
  <StatusDot status="away" label="Ausente" />
</StickerAvatar>
```

The status is a `StatusDot` that Avatar, a table cell or a badge can use
too, and the sticker's paper look comes from where the host places it.

## Why now

The audit of all 38 parts (October 2026) found the same few pieces drawn
by hand again and again, and three parts that can't be extended without a
new prop:

- A presence dot in Sticker avatar, a colored class on `AvatarBadge` with
  no spoken label, and a recording dot in Voice memo.
- A capped, spoken count (99+, `tabular-nums`, an sr-only exact number) in
  Jump bar, Reactions, Filter menu, Data table, Avatar group and Sticker
  avatar, each written separately.
- An inline busy indicator in Toast and Chat composer, both a spinning
  lucide icon, since Spinner was retired for Progress, which is a bar.
- Form controls with no Field: label, description and error are wired by
  hand in every story, and Checkbox, Radio group, Switch and Label carry
  `field` selectors from shadcn that match nothing.
- A preview card (media, meta, title, description) built three times, in
  Map pin, Chapter scrubber and Integration visual.
- Icon buttons and checkbox squares drawn by hand in Jump bar, Command
  menu, Filter menu and Reactions instead of using Button and Checkbox.

Chat composer (plan 004) already works the way the rest should: parts under
a provider, features as parts, no flags. Button, Select, Kbd, Table,
Tooltip and Skeleton compose well already and don't change.

## Principles

1. **A separate thing is a part.** If a prop renders something with its own
   look and meaning, it becomes a component the caller puts in.
2. **No switches for sub-parts.** Rendering a part turns it on; leaving it
   out turns it off. `showX`, `withX` and "passing the handler shows the
   button" go.
3. **Reuse before drawing.** A part uses Button, Checkbox, Badge, Kbd and the
   new primitives rather than its own copy.
4. **State the caller needs is controllable.** `value`, `defaultValue`,
   `onValueChange` for anything an app may want to open, set or watch.
5. **Shared props come from the parent.** A group or field provides `size`
   and the like through context; a child's own prop still wins.
6. **Data stays data where it has to.** Parts that compute positions from a
   list (Floating nav, Integration visual, Token flow) keep their `items`
   arrays. Composition is for content, not for geometry.

## New primitives

All on the Base shelf, using only Base UI, cva and lucide.

| Primitive       | What it is                                                                                                                                                                              | Used by                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **StatusDot**   | Presence mark told by shape and color, with a spoken label. `status`, `variant` (`color`, `mono`), `size`.                                                                              | Sticker avatar, Avatar (in `AvatarBadge`), Badge (leading dot), Voice memo (recording), Message list (through Avatar), Data table status cells |
| **Count**       | A number with an optional cap (99+), `tabular-nums`, and a spoken label from a function.                                                                                                | Jump bar, Reactions, Filter menu, Data table facets, Avatar group count, Sticker avatar count, Menu (`MenuItemCount`)                          |
| **Field**       | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldContent` on `@base-ui/react/field`, with `size` and `orientation` in context; `FieldGroup` sets `size` for a whole form. | Input, Textarea, Select, Checkbox, Radio group, Switch, Slider, Label                                                                          |
| **Separator**   | A rule, horizontal or vertical, with an optional label.                                                                                                                                 | Data table bulk actions, Menu, Select, Message list divider                                                                                    |
| **PreviewCard** | `PreviewCard`, `PreviewCardMedia` (image or looping video, paused under reduced motion), `PreviewCardMeta`, `PreviewCardTitle`, `PreviewCardDescription`.                               | Map pin, Chapter scrubber, Integration visual, Command menu previews                                                                           |
| **InputGroup**  | An input with a leading icon or addon.                                                                                                                                                  | Command menu, Filter menu, Data table search                                                                                                   |
| **EmptyState**  | Title, description and action for nothing-to-show.                                                                                                                                      | Data table, Message list, Command menu, Filter menu                                                                                            |
| **Toggle**      | A pressed or not-pressed button on Base UI `Toggle`.                                                                                                                                    | Reactions pills and choices                                                                                                                    |

Smaller pieces that are exports of existing files rather than new parts:
`CheckboxMark` from `checkbox.tsx`, for rows that can't hold a nested control
(Filter menu); `TypingDots` from `typing-indicator.tsx`; and in `lib/`,
`useControllable` (copied in six parts), `getInitials` (copied in three),
`formatCount` and `HighlightMatch`.

## Changes per part

S, M and L are effort. "Additive" means existing code keeps working.

| Part                                                                  | Change                                                                                                                                                                                                                                                                                                   | Breaking                                                       | Effort             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| Sticker avatar                                                        | `children` with StatusDot replaces `status`, `statusLabel`, `statusColor` (kept as deprecated shorthands). The status joins the name through `aria-labelledby`. `StickerAvatarGroup` provides `size`, `edge`, `tilt`, `lift`. `StickerAvatarCount` uses Count.                                           | Additive, then deprecate                                       | M                  |
| Avatar                                                                | StatusDot inside `AvatarBadge`. `AvatarGroup` provides `size`.                                                                                                                                                                                                                                           | Additive                                                       | S                  |
| Badge                                                                 | Leading icon or dot slot (`gap-1`, `[&>svg]:size-3`). An opaque subtle fill so it stays AA on a muted row, which removes Data table's wrapper.                                                                                                                                                           | Additive                                                       | S                  |
| Input, Textarea, Select, Checkbox, Radio group, Switch, Slider, Label | Use Field; size from Field. Textarea renders through the Field control. Slider gets `SliderLabel` and `SliderValue` like Progress.                                                                                                                                                                       | Additive                                                       | M (Field) + S each |
| Jump bar                                                              | Button for its four hand-made buttons; Count for the 99+ count; Mark as read only when `onMarkRead` is given.                                                                                                                                                                                            | Additive                                                       | S                  |
| Chat composer                                                         | Inline busy indicator for Submit. `ChatComposerAttachment` part for each chip, today's chips as the default.                                                                                                                                                                                             | Additive                                                       | M                  |
| Command menu                                                          | Button for back, Badge for the breadcrumb, InputGroup for search. `footer` part replaces `hints`. Controllable `page`.                                                                                                                                                                                   | Additive (`hints` kept as alias)                               | M                  |
| Filter menu                                                           | `CheckboxMark`, Button for back and search, Count. Controllable `field`.                                                                                                                                                                                                                                 | Additive                                                       | S                  |
| Reactions                                                             | Count, Toggle, Button for the trigger (fixing its off-scale 28px). Controllable `open`. A `labels` object for its English strings.                                                                                                                                                                       | Additive                                                       | S to M             |
| Map pin                                                               | `MapPinPreview` with PreviewCard parts replaces `image`, `title`, `description`, `meta`.                                                                                                                                                                                                                 | Breaking (`children` changes meaning); shorthands plus codemod | M                  |
| Chapter scrubber                                                      | `ChapterScrubberPreview` render child replaces `preview` and `previewClassName`.                                                                                                                                                                                                                         | Additive, then deprecate                                       | M                  |
| Integration visual                                                    | `preview` becomes a node; media through `PreviewCardMedia`.                                                                                                                                                                                                                                              | Additive, then deprecate                                       | S                  |
| Data table                                                            | Person cell as composed parts (Avatar, name, description) with `getInitials`. Card header as parts. Selection toolbar as parts, moving `showSelectedOnly` off the root. One collapsible icon button for the four narrow actions. Count, Separator, InputGroup. `DataTableEmpty` and `DataTableSkeleton`. | Mostly additive; card props deprecated                         | L, split           |
| Message list                                                          | Function child with `Message` parts (avatar, reply, heading, content) and today's row as the default; `renderAvatar` first. Export `MessageDivider`.                                                                                                                                                     | Additive                                                       | L                  |
| Menu                                                                  | `inset` from the group; StatusDot for the radio dot; `MenuItemCount`.                                                                                                                                                                                                                                    | Additive                                                       | S                  |
| Sheet                                                                 | `SheetCloseButton` part; `showCloseButton` stays, defaulting to true.                                                                                                                                                                                                                                    | Additive                                                       | S                  |
| Toast                                                                 | Export `ToastIcon` and let `toast.add({ icon })` set it; `Toaster` takes `renderToast`.                                                                                                                                                                                                                  | Additive                                                       | S                  |
| Typing indicator                                                      | `indicator` on the component instead of on each person.                                                                                                                                                                                                                                                  | Additive, then deprecate                                       | S                  |
| Voice memo                                                            | Provider and `useVoiceMemo()` with `VoiceMemoDevice` and `VoiceMemoTranscript` parts, today's layout as the default. StatusDot for the recording light, a copy button, a `labels` object.                                                                                                                | Additive                                                       | L                  |
| Floating nav                                                          | Per-item `render` for router links; controllable `hidden`.                                                                                                                                                                                                                                               | Additive                                                       | S                  |
| Token flow                                                            | Drop `showUse`; `row.use` already decides it.                                                                                                                                                                                                                                                            | Breaking (small)                                               | S                  |

## Options and choices

**Deprecate or replace.** Removing the old props now would break callers on
0.2. Chosen: every replaced prop stays as a shorthand that renders the new
part, gets a `deprecated` entry under plan 002's policy, and a codemod where
the move is mechanical. They go at the next minor release.

**StatusDot statuses.** `present`, `away`, `offline`, which Sticker avatar
uses now and which tell apart by shape (dot, crescent, ring). `busy` and
`live` can be added when a part needs them; Voice memo's recording light
would be the first `live`.

**Sticker's paper look.** A `sticker` variant on StatusDot, or the host
placing and styling a plain StatusDot. Chosen: the host. Position, size,
counter-tilt and drop shadow all depend on the sticker, so Sticker avatar
styles `[data-slot=status-dot]` children, the way Avatar group styles its
avatars.

**Inline busy indicator.** Bring Spinner back for use inside controls, or
give Progress a circular kind. Chosen: `<Progress type="circle">`, a small
ring that fits in a button. It reads `value` when the amount is known and
spins when it isn't, so fibo keeps one part for all progress and Spinner
stays retired.

**Field scope.** Field alone, or also a group. Chosen: `Field` plus
`FieldGroup`, which lays out a set of fields and sets `size` for all of
them, so a dense form says `size="sm"` once. A field's or control's own
`size` still wins.

## Order

1. StatusDot, then Sticker avatar and Avatar on it. The example that started
   this.
2. Count and `formatCount`, adopted in Jump bar, Reactions, Filter menu and
   the avatar counts.
3. Field, and the form controls on it.
4. `Progress type="circle"`, used by Toast and Chat composer.
5. Hand-made buttons and checkboxes to Button, Checkbox and `CheckboxMark`
   in Jump bar, Command menu, Filter menu and Reactions.
6. Separator, InputGroup, EmptyState, PreviewCard, each with its users.
7. The large ones, each with its own plan: Data table toolbar and cells,
   Message list parts, Voice memo parts.

Each step is its own pull request, with its Figma component, docs page and
drift entry. New parts count against the limit of three `new` tags at once
(Chat composer, Map pin and Voice memo hold them now), so the oldest come
off as primitives land.

## Open questions

- **Message list and Voice memo.** Worth the L effort now, or after the
  primitives have settled? Decide when step 6 is done.
