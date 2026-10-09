# 004 Chat composer

## What is changing

A Chat composer on the Base components shelf, under Forms: the box people
write messages in, with attachments, mentions and a send button. It is
fibo's first part made of several composable pieces around one shared state,
rather than a single component.

## Why now

A composer is where monolithic components go wrong first. Every new surface
(an edit box, a thread reply, a forward dialog) arrives as another boolean
prop, and the flags multiply the states the part has to get right. Building
it compositionally from the start sets the pattern for fibo's other complex
parts.

## Options and choices

**One component or parts.** A `<Composer>` with props for each case, or
parts under a provider after Radix and Base UI. Chosen: parts, following
Fernando Rojo's "Composition is all you need". A surface picks the parts it
needs, puts them in its own order, and writes anything unusual as JSX beside
them.

**Where state lives.** The parts hold none. `ChatComposerProvider` takes `state`
(`value`, `attachments`, `submitting`, `disabled`) and `actions` (`setValue`,
`addAttachments`, `removeAttachment`, `submit`), and every part reads those
through `useChatComposer()`. That interface is the whole contract, so the same
parts run on component state, a store, or a draft synced across devices.
`LocalChatComposerProvider` is the ready-made implementation on `useState`, and
covers most uses.

**Features as parts, not flags.** Drag and drop is `ChatComposerDropZone`,
attaching is `ChatComposerAttachButton`, mentions are `ChatComposerMentionButton`.
Rendering one turns it on; leaving it out turns it off. `ChatComposerCommonActions`
groups the shared ones, and since it is only JSX, a composer that needs a
different set leaves it out.

**Submit anywhere.** `ChatComposerSubmit` calls `actions.submit` rather than
submitting a form, so it works outside the frame, such as in a dialog's
footer, as long as it is inside the provider.

**Changing keyboard behavior.** Enter sends and Shift+Enter breaks the line.
Rather than a `submitOnEnter` prop, `ChatComposerInput` skips its own handling
when the caller's `onKeyDown` calls `preventDefault`.

**Naming.** The file, the registry item and every export say
`chat-composer`: `ChatComposerInput`, `useChatComposer`. The talk's shorter
`Composer*` was considered and dropped, since every other part with several
pieces takes its file name as the prefix (`Sheet*`, `DataTable*`), and an
import list should say what each piece belongs to.

**Shelf.** Base components: it depends on Button and lucide only, and has no
animation beyond a busy spinner that stops under reduced motion.

**Out of scope.** Rich text, a mention picker and an emoji picker. The
mention button types `@`; a picker is a part a project can add on top of
`useChatComposer()`.
