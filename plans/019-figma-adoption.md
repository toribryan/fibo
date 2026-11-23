# 019 Figma library adoption

## What is changing

- Components that hold content get Figma slots instead of fixed children
  and show/hide booleans: Menu, Sheet, Field, Radio group, Tabs, Toast,
  Empty state, Floating nav, Map pin preview, Input group and Table, plus
  the new Dialog, Alert dialog and Breadcrumb (#192).
- Every slot is named after the code part it becomes (Dialog `footer` is
  `DialogFooter`), sets preferred instances, and carries a one-line
  description of what it accepts. `pnpm figma:drift` checks the names.
- The Figma file gets a "Start here" page: how to fill a slot, when
  detaching is fine, and where to report a detach.
- A read-only script, `.agents/skills/figma-drift/audit-detaches.js`,
  counts detached instances by the component they came from. Its numbers
  are the baseline and the monthly measure.
- A GitHub issue form, "Figma detach", asks why someone detached and what
  the component was missing.

## Why now

The library had drifted from the code (Dialog, Alert dialog and Search
input shipped with no Figma component), and several components could only
be changed by detaching: adding a menu row, a tab, a fourth radio option or
a second toast action. A detached instance stops getting fixes, so every
one is a copy of the system that ages on its own.

## What the research says

- **Rigid components are the main cause of detaching.** The requests in
  Figma's forum are about adding items, changing direction and changing
  the column count. Figma presents slots as the way to get fewer detached
  instances
  ([help center](https://help.figma.com/hc/en-us/articles/38231200344599)).
- **Deadlines, components that seem too complex, and habit** come next.
  Some designers don't realize detaching breaks the link
  ([Salesforce](https://www.salesforce.com/blog/figma-component-health/)).
- **A detach is a question to ask, not a number to shrink.**
  - athenahealth reviews detaches monthly in three steps: diagnose, talk to
    the designer, file a ticket. A spike in detaches of one container led
    them to an auto layout bug
    ([Figma, Design systems 104](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)).
  - Some components, such as templates, are meant to be detached
    ([Figma best practices](https://www.figma.com/best-practices/make-the-most-of-design-system-analytics/)).
- **Slots replace boolean and layout props.** Nathan Curtis reports that
  show/hide props, padding and direction props, and layout-variant parts
  dropped once slots were available
  ([Configuration collapse](https://nathanacurtis.substack.com/p/configuration-collapse)).
  For a repeating slot he recommends naming it `items`, three default
  children and a minimum of one
  ([Slots for repeating items](https://nathanacurtis.substack.com/p/figma-slots-for-repeating-items)).
- **Speed is the case for the system.** In Figma's study, designers
  finished tasks up to 34% faster with a current system
  ([Figma](https://www.figma.com/blog/measuring-the-value-of-design-systems/)).
- **Figma enforces little.** "Only allow preferred instances" and the
  minimum and maximum only warn. Any edit to a slot's content stops it from
  getting library updates. Removing a slot property clears that slot in
  every instance. Variants can't be preferred instances
  ([help center](https://help.figma.com/hc/en-us/articles/38231200344599),
  [forum](https://forum.figma.com/report-a-problem-6/slots-only-allow-preferred-instances-not-working-55490)).

## Options and choices

**Measuring.** Figma's Library Analytics shows inserts and detaches per
component, but only on Organization plans and above, and its API is
Enterprise only. Chosen: the audit script, run on the library and on any
file shared with us, plus the issue form for the reason. Analytics can
replace the script if the library moves to an Organization plan.

**Slot or prop.** A slot when the content varies in kind or count (rows,
actions, a form). A prop when it is one thing from a known set: an icon
stays an instance swap (Button `iconStartSwap`, Empty state `mediaSwap`,
whose code part is an icon-only tile). `variant`, `size` and `state` stay
variants.

**Naming.** Slot names follow the code part or prop: `header`, `body`,
`footer`, `content`, `actions`, `control`, and `items` or `cells` for
repeated children. A slot that is a part's children in code (Menu
`items`) is listed in `figmaOnlySlots` with the reason, so the drift check
still flags a slot code can't render.

**Keeping booleans.** A boolean that controlled a region stays and now
controls the slot's visibility (`showFooter`, `showActions`), because
removing a property resets it in every instance.

**Part components.** Repeated rows get a real part so the slot can prefer
it: FieldItem for Radio group options and TableRow for Table rows, both
code exports.

## Monthly review

1. Run `audit-detaches.js` on the library and on any shared files.
2. For each component with new detaches, open the nodes it lists and see
   what was changed after detaching.
3. Read new "Figma detach" issues.
4. Fix it in the component (a slot, a variant, a property), or record why
   detaching was right, then publish and add a Changelog entry.

Baseline on 2026-11-23, library file only: 14 detached frames. Twelve are
the Chat composer input layers, kept inline on purpose since 2026-11-09,
and two are Progress examples on its docs page.
