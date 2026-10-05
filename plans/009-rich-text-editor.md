# 009 Rich text editor

## What is changing

A new base part, Rich text editor, in Forms: a writing area with a
formatting toolbar for headings, bold, italic, strikethrough, inline code,
lists, quotes and links, undo and redo, Markdown shortcuts as you type, and an
optional character limit. It takes `defaultValue` as HTML and reports HTML
through `onChange`.

It runs on Tiptap, which makes it the second base part allowed a dependency
beyond Base UI, `class-variance-authority` and `lucide-react`, after Data
table's TanStack Table (plan 005). The exception covers three packages, for
this part only:

- `@tiptap/react`: the editor hook, `EditorContent` and `useEditorState`.
- `@tiptap/starter-kit`: the nodes, marks, history and input rules. In
  Tiptap 3 it also bundles Link, so `@tiptap/extension-link` is not needed.
- `@tiptap/extensions`: Placeholder and CharacterCount. The single-extension
  packages (`@tiptap/extension-placeholder`,
  `@tiptap/extension-character-count`) only re-export from it in Tiptap 3.

`@tiptap/core` and `@tiptap/pm` come in as peers of `@tiptap/react`.

## Why now

Proposals, release notes, replies and notes keep needing formatted text.
Each app that needs it reaches for an editor on its own, so toolbars, prose
styles, keyboard paths and limits differ from one to the next, which is the
drift fibo exists to stop. Textarea and Chat composer stay the right parts for
plain text; this covers the rest.

## Options and choices

**Engine.** Three options:

- **Plain `contenteditable`** with `document.execCommand`. No dependency, but
  `execCommand` is deprecated and inconsistent across browsers, has no
  document model to validate against, and leaves undo, paste cleanup, input
  rules and limits to hand-written code that would outgrow the component.
- **Lexical.** Fast and well maintained, but its React bindings expect a
  plugin tree inside a composer, and lists, links, history and Markdown
  shortcuts each come from a separate package and plugin. More moving parts
  for the same feature set.
- **Tiptap 3** on ProseMirror. One configured `StarterKit` gives the whole
  feature set, the schema keeps output to known HTML, turning
  `immediatelyRender` off makes it safe to server-render, and
  `useEditorState` lets the toolbar re-render only when what it shows
  changes.

Chosen: Tiptap 3, with the three packages above and nothing else. The
editor's prose styles, toolbar and link row are fibo's, in semantic tokens.

**Toolbar.** Base UI's Toolbar gives the single tab stop and arrow-key roving
focus; the part adds Home and End. Buttons are fibo's ghost Button style with
`aria-pressed`, and each has fibo's Tooltip with its name and shortcut. No
Radix.

**Links.** An inline row under the toolbar takes the address, so nothing opens
a browser prompt. With nothing selected, the address becomes the link text.

**Output.** StarterKit's trailing-node extension is off, so the HTML has no
stray empty paragraph after each list or heading, and an empty document is
reported as an empty string. Underline is off, since no tool shows it and
underlined text reads as a link.

**Size.** No `size` prop. The writing area's height is `minHeight`, and the
toolbar's buttons are the shared `icon-sm`. A size would only invent a second
toolbar density with no part asking for it.
