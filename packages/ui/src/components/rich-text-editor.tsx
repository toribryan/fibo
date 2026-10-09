"use client"

import * as React from "react"
import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { CharacterCount, Placeholder } from "@tiptap/extensions"
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  BoldIcon,
  CodeIcon,
  HeadingIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon,
  UnlinkIcon,
} from "lucide-react"

import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type RichTextEditorTool =
  | "heading"
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "bullet"
  | "ordered"
  | "quote"
  | "link"
  | "history"

const ALL_TOOLS: RichTextEditorTool[] = [
  "heading",
  "bold",
  "italic",
  "strike",
  "code",
  "bullet",
  "ordered",
  "quote",
  "link",
  "history",
]

// Separators fall between these groups, and only between groups that show.
const TOOL_GROUPS: RichTextEditorTool[][] = [
  ["heading"],
  ["bold", "italic", "strike", "code"],
  ["bullet", "ordered", "quote"],
  ["link"],
  ["history"],
]

type RichTextEditorProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue" | "children"
> & {
  /** The starting content, as HTML. Later changes are ignored: the editor owns the document once it mounts. */
  defaultValue?: string
  /** Called on every edit with the document as HTML, or an empty string when it is empty, and the Tiptap editor. */
  onChange?: (html: string, editor: Editor) => void
  /** Shown in the empty writing area. */
  placeholder?: string
  /** The most characters the document may hold. Typing and pasting stop there, and a counter shows from 80%. */
  maxLength?: number
  /** Minimum height of the writing area, in pixels. */
  minHeight?: number
  /** Which tools the toolbar shows, in its fixed order. Shortcuts for hidden tools still work. */
  tools?: RichTextEditorTool[]
  /** False shows the document without a toolbar and takes no edits. */
  editable?: boolean
  /** Accessible name of the writing area. Ignored when aria-labelledby is set. */
  label?: string
  /** Id of the writing area, not the frame. */
  id?: string
  /** Ids of elements that name the writing area, such as a visible label. */
  "aria-labelledby"?: string
  /** Ids of elements that describe the writing area, such as a hint or an error. */
  "aria-describedby"?: string
  /** Marks the writing area invalid and draws the frame in the destructive color. */
  "aria-invalid"?: boolean | "true" | "false"
}

/*
 * Platform modifier for tooltips. Read when a tooltip opens, which only
 * happens in a browser, so the server never needs to know.
 */
function shortcut(keys: string) {
  const mac =
    typeof navigator !== "undefined" &&
    /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
  return keys
    .replace("Mod+", mac ? "⌘" : "Ctrl+")
    .replace("Shift+", mac ? "⇧" : "Shift+")
}

const PROSE = [
  "min-w-0 px-3 py-2.5 text-sm leading-6 text-foreground outline-none",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:my-2",
  "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:leading-7 [&_h2]:font-semibold",
  "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:pl-1 [&_li>p]:my-0",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
  "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_a]:font-medium [&_a]:underline [&_a]:decoration-muted-foreground [&_a]:underline-offset-4",
  "[&_hr]:my-4 [&_hr]:border-border",
  "[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
].join(" ")

/** What the toolbar reflects, read once per transaction. */
function readState(editor: Editor | null) {
  return {
    heading: editor?.isActive("heading", { level: 2 }) ?? false,
    bold: editor?.isActive("bold") ?? false,
    italic: editor?.isActive("italic") ?? false,
    strike: editor?.isActive("strike") ?? false,
    code: editor?.isActive("code") ?? false,
    bullet: editor?.isActive("bulletList") ?? false,
    ordered: editor?.isActive("orderedList") ?? false,
    quote: editor?.isActive("blockquote") ?? false,
    link: editor?.isActive("link") ?? false,
    canUndo: editor?.can().undo() ?? false,
    canRedo: editor?.can().redo() ?? false,
    characters: editor?.storage.characterCount.characters() ?? 0,
  }
}

type ToolbarState = ReturnType<typeof readState>

type ToggleTool = Exclude<RichTextEditorTool, "link" | "history">

const TOGGLES: Record<
  ToggleTool,
  {
    label: string
    keys: string
    icon: React.ReactNode
    run: (editor: Editor) => void
  }
> = {
  heading: {
    label: "Heading",
    keys: "##",
    icon: <HeadingIcon />,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  bold: {
    label: "Bold",
    keys: "Mod+B",
    icon: <BoldIcon />,
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  italic: {
    label: "Italic",
    keys: "Mod+I",
    icon: <ItalicIcon />,
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  strike: {
    label: "Strikethrough",
    keys: "Mod+Shift+S",
    icon: <StrikethroughIcon />,
    run: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  code: {
    label: "Inline code",
    keys: "Mod+E",
    icon: <CodeIcon />,
    run: (editor) => editor.chain().focus().toggleCode().run(),
  },
  bullet: {
    label: "Bulleted list",
    keys: "-",
    icon: <ListIcon />,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  ordered: {
    label: "Numbered list",
    keys: "1.",
    icon: <ListOrderedIcon />,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  quote: {
    label: "Quote",
    keys: ">",
    icon: <QuoteIcon />,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
}

type ToolButtonProps = {
  /** Names the button and heads its tooltip. */
  label: string
  /** The shortcut shown in the tooltip. */
  keys: string
  /** The tool it runs, for styling hooks. */
  tool: string
  /** Pressed state for toggles. Leave out for one-off actions. */
  pressed?: boolean
  /** True when the action can't run right now. */
  disabled?: boolean
  /** Runs the action. */
  onClick: () => void
  /** The icon. */
  children: React.ReactNode
} & Pick<React.ComponentProps<"button">, "aria-expanded" | "aria-controls">

function ToolButton({
  label,
  keys,
  tool,
  pressed,
  disabled,
  onClick,
  children,
  ...props
}: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToolbarPrimitive.Button
            data-slot="rich-text-editor-tool"
            data-tool={tool}
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            // The pointer never takes focus from the writing area, so the
            // selection the action applies to stays put.
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "rounded-md text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground data-disabled:opacity-50 data-disabled:hover:bg-transparent"
            )}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        <span className="ml-2 text-muted-foreground">{shortcut(keys)}</span>
      </TooltipContent>
    </Tooltip>
  )
}

/*
 * Extensions read their options when they run, so changing them in place
 * takes effect on the next transaction without rebuilding the editor.
 */
function setExtensionOption(
  editor: Editor,
  name: string,
  options: Record<string, unknown>
) {
  const extension = editor.extensionManager.extensions.find(
    (candidate) => candidate.name === name
  )
  if (extension) Object.assign(extension.options, options)
}

/*
 * A Tiptap editor with a formatting toolbar. StarterKit brings the marks,
 * blocks, history and Markdown shortcuts (## heading, - list, > quote), plus
 * Link; Placeholder and CharacterCount come from @tiptap/extensions.
 */
function RichTextEditor({
  defaultValue = "",
  onChange,
  placeholder = "Write something…",
  maxLength,
  minHeight = 140,
  tools = ALL_TOOLS,
  editable = true,
  label = "Editor",
  id,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
  className,
  ...props
}: RichTextEditorProps) {
  const invalid = ariaInvalid === true || ariaInvalid === "true"
  const linkRowId = React.useId()
  const [linkOpen, setLinkOpen] = React.useState(false)
  const [linkHref, setLinkHref] = React.useState("https://")
  const linkInput = React.useRef<HTMLInputElement>(null)

  // Made once, so a prop change never rebuilds the editor and loses the
  // document, selection and undo history. The effects below update the
  // placeholder and limit in place.
  const [extensions] = React.useState(() => [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      // No tool shows underline, and underlined text reads as a link.
      underline: false,
      // Keeps a stray empty paragraph out of the HTML after every list,
      // heading and quote. Enter on an empty item already exits them.
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      },
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount.configure({ limit: maxLength ?? null }),
  ])

  const editorProps = React.useMemo(
    () => ({
      attributes: {
        "data-slot": "rich-text-editor-content",
        role: "textbox",
        "aria-multiline": "true",
        // The writing area is the control, so naming and describing it
        // goes here rather than on the frame.
        ...(id ? { id } : {}),
        ...(labelledBy
          ? { "aria-labelledby": labelledBy }
          : { "aria-label": label }),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        "aria-placeholder": placeholder,
        ...(editable ? {} : { "aria-readonly": "true" }),
        // Room for the counter, which sits over the last line's corner.
        class: cn(PROSE, maxLength !== undefined && editable && "pb-8"),
        style: `min-height: ${minHeight}px`,
      },
    }),
    [
      id,
      label,
      labelledBy,
      describedBy,
      invalid,
      placeholder,
      editable,
      maxLength,
      minHeight,
    ]
  )

  const editor = useEditor({
    // Rendering waits for the browser, so server and client markup match.
    immediatelyRender: false,
    editable,
    content: defaultValue,
    extensions,
    editorProps,
  })

  const state: ToolbarState =
    useEditorState({
      editor,
      selector: ({ editor }) => readState(editor),
    }) ?? readState(null)

  React.useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  React.useEffect(() => {
    if (!editor) return
    setExtensionOption(editor, "placeholder", { placeholder })
    setExtensionOption(editor, "characterCount", { limit: maxLength ?? null })
    // An empty transaction redraws the placeholder decoration.
    editor.view.dispatch(editor.state.tr)
  }, [editor, placeholder, maxLength])

  React.useEffect(() => {
    if (!editor || !onChange) return
    const report = () =>
      onChange(editor.isEmpty ? "" : editor.getHTML(), editor)
    editor.on("update", report)
    return () => {
      editor.off("update", report)
    }
  }, [editor, onChange])

  const closeLink = React.useCallback(
    (refocus: boolean) => {
      setLinkOpen(false)
      if (refocus) editor?.commands.focus()
    },
    [editor]
  )

  const toggleLink = React.useCallback((editor: Editor) => {
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    setLinkHref("https://")
    setLinkOpen(true)
  }, [])

  // Tiptap's Link has no shortcut of its own; Mod+K is the common one.
  React.useEffect(() => {
    if (!editor || !editable) return
    const dom = editor.view.dom
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey) ||
        event.shiftKey ||
        event.altKey
      )
        return
      event.preventDefault()
      toggleLink(editor)
    }
    dom.addEventListener("keydown", onKeyDown)
    return () => dom.removeEventListener("keydown", onKeyDown)
  }, [editor, editable, toggleLink])

  React.useEffect(() => {
    if (!linkOpen) return
    const input = linkInput.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [linkOpen])

  function applyLink() {
    if (!editor) return
    const href = linkHref.trim()
    setLinkOpen(false)
    if (!href || href === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // With nothing selected, the address becomes the link text.
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: href,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  }

  const shown = TOOL_GROUPS.map((group) =>
    group.filter((tool) => tools.includes(tool))
  ).filter((group) => group.length > 0)

  const showCounter =
    editable && maxLength !== undefined && state.characters >= maxLength * 0.8
  const remaining = maxLength === undefined ? 0 : maxLength - state.characters

  // The visible count changes on every keystroke, which a live region would
  // read out each time. Screen readers hear it only when it crosses 80%,
  // each further ten characters, and the limit.
  const step = !showCounter
    ? null
    : remaining <= 0
      ? "limit"
      : String(Math.ceil(remaining / 10))
  const [announced, setAnnounced] = React.useState<{
    step: string | null
    text: string
  }>({ step: null, text: "" })
  if (announced.step !== step) {
    setAnnounced({
      step,
      text:
        step === null
          ? ""
          : step === "limit"
            ? "Character limit reached"
            : `${remaining} ${remaining === 1 ? "character" : "characters"} left`,
    })
  }

  function renderTool(tool: RichTextEditorTool) {
    if (tool === "link") {
      return (
        <ToolButton
          key="link"
          tool="link"
          label={state.link ? "Remove link" : "Add link"}
          keys="Mod+K"
          disabled={!editor}
          aria-expanded={state.link ? undefined : linkOpen}
          aria-controls={linkOpen ? linkRowId : undefined}
          onClick={() => editor && toggleLink(editor)}
        >
          {state.link ? <UnlinkIcon /> : <LinkIcon />}
        </ToolButton>
      )
    }
    if (tool === "history") {
      return (
        <React.Fragment key="history">
          <ToolButton
            tool="undo"
            label="Undo"
            keys="Mod+Z"
            disabled={!state.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2Icon />
          </ToolButton>
          <ToolButton
            tool="redo"
            label="Redo"
            keys="Mod+Shift+Z"
            disabled={!state.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2Icon />
          </ToolButton>
        </React.Fragment>
      )
    }
    const { label, keys, icon, run } = TOGGLES[tool]
    return (
      <ToolButton
        key={tool}
        tool={tool}
        label={label}
        keys={keys}
        pressed={state[tool]}
        disabled={!editor}
        onClick={() => editor && run(editor)}
      >
        {icon}
      </ToolButton>
    )
  }

  return (
    <div
      data-slot="rich-text-editor"
      data-readonly={editable ? undefined : ""}
      data-invalid={invalid ? "" : undefined}
      className={cn(
        "@container/rich-text-editor relative flex w-full min-w-0 flex-col rounded-lg border border-input bg-input-subtle transition-colors has-[[data-slot=rich-text-editor-content]:focus-visible]:border-ring has-[[data-slot=rich-text-editor-content]:focus-visible]:ring-[3px] has-[[data-slot=rich-text-editor-content]:focus-visible]:ring-ring-subtle data-invalid:border-destructive data-invalid:ring-[3px] data-invalid:ring-destructive-ring data-readonly:bg-transparent",
        className
      )}
      {...props}
    >
      {editable && shown.length > 0 ? (
        <TooltipProvider>
          <ToolbarPrimitive.Root
            data-slot="rich-text-editor-toolbar"
            aria-label="Formatting"
            // In a narrow frame two rows of tools would push the writing
            // down, so the row scrolls instead, like Floating nav, and focus
            // scrolls each tool into view as the arrows move.
            className="flex flex-wrap items-center gap-0.5 border-b border-border p-1 @max-md/rich-text-editor:[scrollbar-width:none] @max-md/rich-text-editor:flex-nowrap @max-md/rich-text-editor:overflow-x-auto"
            onKeyDown={(event) => {
              // Base UI's toolbar roves on arrows only; Home and End finish
              // the pattern from the ARIA toolbar guidance.
              if (event.key !== "Home" && event.key !== "End") return
              const buttons = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "[data-slot=rich-text-editor-tool]"
                )
              )
              const target =
                event.key === "Home" ? buttons[0] : buttons[buttons.length - 1]
              if (!target) return
              event.preventDefault()
              target.focus()
            }}
          >
            {shown.map((group, index) => (
              <React.Fragment key={group.join()}>
                {index > 0 ? (
                  <ToolbarPrimitive.Separator className="mx-1 h-5 w-px shrink-0 bg-border" />
                ) : null}
                {group.map(renderTool)}
              </React.Fragment>
            ))}
          </ToolbarPrimitive.Root>
        </TooltipProvider>
      ) : null}

      {editable && linkOpen ? (
        <form
          id={linkRowId}
          data-slot="rich-text-editor-link-row"
          // Native URL checks would block a relative link, and the bare
          // https:// that removes one.
          noValidate
          className="flex items-center gap-2 border-b border-border p-2"
          onSubmit={(event) => {
            event.preventDefault()
            applyLink()
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return
            event.preventDefault()
            event.stopPropagation()
            closeLink(true)
          }}
        >
          <Input
            ref={linkInput}
            type="url"
            size="sm"
            aria-label="Link address"
            value={linkHref}
            onChange={(event) => setLinkHref(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => closeLink(true)}
          >
            Cancel
          </Button>
        </form>
      ) : null}

      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div
          aria-hidden
          className={PROSE}
          style={{ minHeight }}
          data-slot="rich-text-editor-skeleton"
        />
      )}

      {maxLength !== undefined && editable ? (
        <span
          data-slot="rich-text-editor-count"
          data-limit={remaining <= 0 ? "" : undefined}
          aria-hidden
          className="pointer-events-none absolute right-3 bottom-2 text-xs text-muted-foreground tabular-nums data-limit:text-destructive"
        >
          {showCounter ? `${Math.max(0, remaining)} left` : ""}
        </span>
      ) : null}
      {maxLength !== undefined && editable ? (
        <span
          data-slot="rich-text-editor-announcer"
          aria-live="polite"
          className="sr-only"
        >
          {announced.text}
        </span>
      ) : null}
    </div>
  )
}

export { RichTextEditor, type RichTextEditorProps, type RichTextEditorTool }
