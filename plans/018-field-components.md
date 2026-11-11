# 018 Field components and component standards

## What is changing

Two things, both taken from Click UI (ClickHouse's design system):

1. **A configured layer over the composed parts.** Forms get one-piece
   fields that take their label, description and error as props, the way
   Click UI's `TextField` and `Checkbox` do:

   ```tsx
   <TextField
     label="Email"
     description="We only use it to sign you in."
     error={errors.email}
     type="email"
   />
   ```

   Today the same field is five parts:

   ```tsx
   <Field invalid={!!errors.email}>
     <FieldLabel>Email</FieldLabel>
     <Input type="email" />
     <FieldDescription>We only use it to sign you in.</FieldDescription>
     <FieldError>{errors.email}</FieldError>
   </Field>
   ```

   Button gains Click UI's `loading`, start and end icons and `fillWidth`.

2. **Written standards every base part meets**, in `AGENTS.md`, the
   `add-component` skill and the `component-reviewer` agent: an
   accessibility must and must-not list, a fixed set of state stories, and a
   unit test for each interactive part.

## Why now

Most forms are a column of plain fields, and each one is five parts and an
`invalid` flag kept in step with the error by hand. Click UI's fields make
the common case one line, and its rules make every part answer the same
questions (is the ref on the control, is `aria-describedby` merged, is there
a disabled story) before review rather than during it.

## Options and choices

**Replace the composed parts, or add a layer.** Plan 006 chose composition
because props that draw separate things can't be extended. Replacing Field
with configured fields would undo that and break every install. Chosen: a
layer. Each field is built only from existing parts (`Field`, `FieldLabel`,
`Input`, `InputGroup`, `FieldDescription`, `FieldError`), adds no styles of
its own, and passes its remaining props to the control. The composed parts
stay the way to build anything the props don't cover, so the layer is an
exception to plan 006's first principle that can't drift from it: the label
a field draws is a `FieldLabel`.

**Which fields.** Click UI ships fourteen form components. fibo takes the
ones that sit on parts it already has:

| Field             | Built from                   | Its own props                                            |
| ----------------- | ---------------------------- | -------------------------------------------------------- |
| `TextField`       | Field, Input, InputGroup     | `startContent`, `endContent`, `clearable`, `loading`     |
| `PasswordField`   | TextField                    | A show and hide toggle                                   |
| `TextareaField`   | Field, Textarea              |                                                          |
| `SelectField`     | Field, Select                | `options`, `placeholder`                                 |
| `CheckboxField`   | Field, Checkbox              |                                                          |
| `SwitchField`     | Field, Switch                |                                                          |
| `RadioGroupField` | Field, FieldItem, RadioGroup | `options`, each with a label and an optional description |

Every field takes `label`, `description`, `error`, `size`, `orientation`,
`disabled` and `required`. Search stays `SearchInput`, which already is a
one-piece field. Click UI's NumberField, AutoComplete, MultiSelect and
DatePicker wait until fibo has the composed parts under them.

**Click UI's props fibo doesn't take.**

- `onChange(value)`. It hides the native `onChange` with a different
  signature, which Click UI's own AGENTS.md calls a mistake. Fields pass the
  control's props through, so `onValueChange` from Base UI and the native
  `onChange` both work.
- `labelColor`. Color comes from tokens.
- `dir`, to put the label after the control. Checkbox and switch fields put
  the control first, the way Field's horizontal orientation already does.
- Button's `type` for the visual style. It hides the native `type`; fibo
  calls it `variant`.

**Names.** Click UI's `iconLeft` and `iconRight` become `iconStart` and
`iconEnd`, matching the `inline-start` and `inline-end` Button already uses
so icons follow the reading direction. `fillWidth` keeps Click UI's name,
which is also Figma's word for it. `error` is a node: passing one marks the
field invalid, shows the message and links it to the control with
`aria-describedby`; `error={true}` marks it invalid without a message.

**Where the ref and the rest go.** Onto the control, never the wrapper, so
a form library's `ref`, `name`, `aria-*` and `data-testid` land on the
`<input>`. `className` goes on the root. `id` is the control's, generated
when absent.

**Focus-visible stories.** Click UI uses the pseudo-states addon. fibo
gets the same snapshot with no new dependency: a `Focused` story whose
`play` presses Tab, and Chromatic snapshots after `play`.

**Shelf and tags.** The fields go in Base components, group Forms. The
three-`new` limit holds, so each pull request moves the tag along.

## The standards

Written into `AGENTS.md` under Conventions, and checked by the reviewer.

- The ref and spread props land on the focusable element.
- A consumer's `aria-label`, `aria-labelledby` and `aria-describedby` are
  kept, and ids are merged with the part's own rather than replaced.
- A `label` that takes a node is wired with `<label>` or
  `aria-labelledby`, never turned into an `aria-label` string.
- Busy controls set `aria-busy` and can't be pressed again.
- Decorative icons are `aria-hidden`.
- No positive `tabindex`, no `aria-hidden` on something focusable, no ARIA
  that repeats native semantics, no placeholder standing in for a label.
- No prop named after a native attribute it would hide.
- Interactive parts ship `Default` with a pointer and keyboard `play`, plus
  `Disabled` and `Focused` stories, and `Invalid` and `Loading` where the
  part has those states. A unit test covers the ARIA the part promises.

## Order

1. This plan and the standards.
2. Button: `loading`, `iconStart`, `iconEnd`, `fillWidth`.
3. `TextField`, `PasswordField`, `TextareaField`.
4. `CheckboxField`, `SwitchField`, `RadioGroupField`.
5. `SelectField`.
6. The other interactive base parts brought up to the standards: missing
   state stories and unit tests, one group per pull request.

Each step from 2 on is its own pull request with its Figma component, docs
page, drift entry and `changes/` file. Figma's fields are instances of the
existing Field parts with text properties for the label, description and
error.
