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

**Shelf.** Special components, since November 2026. It started on Base
components with Button and lucide only, then slash commands brought in
Command menu, which uses `motion`. The menu opens as a dialog, as it does
everywhere else in fibo, rather than as a second list anchored to the text box.

**Emoji.** Browsers give no way to open the system emoji picker, and a full
emoji dataset would be a dependency. `ChatComposerEmojiButton` offers a grid
of 40 native characters drawn by the system font, and takes `emojis` for a
different list.

**Dictation.** `ChatComposerDictationButton` uses the browser's speech
recognition, which needs no dependency but is missing in Firefox and sends
audio to Google in Chrome. So the button hides where it is unsupported, and
`recognition` takes another engine with the same shape. Its pressed look is
the Button's secondary variant, not a new composer state.

**Touch screens.** The layout follows `(pointer: coarse)` rather than the
viewport width, so a narrow desktop window keeps the desktop composer and a
touchscreen laptop with a mouse does too. On touch, the actions collapse into
a + and a bottom sheet, emoji and dictation defer to the phone keyboard, and
Return adds a line. `pointer` on the provider overrides the detection for
tests, stories and webviews that know better.

**Attachments and drops.** Attachment and Drop zone are their own parts, so
forms and other surfaces can use them. The composer renders each attachment
with its upload status, waits for uploads before sending, and wraps Drop zone
as `ChatComposerDropZone`, meant to cover the whole conversation panel.

**Out of scope.** Rich text and a mention picker. The mention button types
`@`; a picker is a part a project can add on top of `useChatComposer()`.
