"use client"

import * as React from "react"
import {
  ArrowUpIcon,
  AtSignIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/*
 * The composer is a set of parts around one context, after Fernando Rojo's
 * "Composition is all you need". The parts never own state: they read it and
 * call actions through the context. Whoever renders the provider decides
 * where the draft lives, so the same parts serve a local draft, an edit, or a
 * draft synced across devices without a boolean prop for each.
 */

type ComposerAttachment = {
  /** Stable key for the attachment. */
  id: string
  /** File name shown on the chip. */
  name: string
  /** Size in bytes, shown beside the name when present. */
  size?: number
  /** The file itself, when it came from this device. */
  file?: File
}

type ComposerState = {
  /** The draft text. */
  value: string
  /** Files attached to the draft. */
  attachments: ComposerAttachment[]
  /** True while a submit is in flight. */
  submitting?: boolean
  /** True when the composer takes no input. */
  disabled?: boolean
  /** Whether the draft may be sent. Defaults to having text or an attachment. */
  canSubmit?: boolean
}

type ComposerActions = {
  /** Replaces the draft text. */
  setValue: (value: string) => void
  /** Attaches files to the draft. */
  addAttachments: (files: File[]) => void
  /** Removes one attachment by id. */
  removeAttachment: (id: string) => void
  /** Sends the draft. */
  submit: () => void
}

type ComposerMeta = {
  /** The text box, so any part can focus it or read the caret. */
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

type ComposerContextValue = {
  /** The draft. */
  state: ComposerState
  /** How to change the draft and send it. */
  actions: ComposerActions
  /** Handles the parts share, such as the text box. */
  meta: ComposerMeta
}

const ComposerContext = React.createContext<ComposerContextValue | null>(null)

/** Reads the nearest composer. Throws outside a provider. */
function useComposer() {
  const context = React.useContext(ComposerContext)
  if (!context) {
    throw new Error(
      "Composer parts must be rendered inside a ComposerProvider."
    )
  }
  return context
}

/** Whether the draft has any text or files in it. */
function hasContent({ value, attachments }: ComposerMessage) {
  return value.trim() !== "" || attachments.length > 0
}

/** Whether the draft may be sent and the composer is free to send it. */
function isSubmittable(state: ComposerState) {
  return (
    !state.disabled &&
    !state.submitting &&
    (state.canSubmit ?? hasContent(state))
  )
}

type ComposerProviderProps = {
  /** The draft, from wherever it lives. */
  state: ComposerState
  /** How the parts change the draft and send it. */
  actions: ComposerActions
  /** A ref for the text box. One is made for you when omitted. */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  /** The parts, in any order and anywhere below. Renders no element. */
  children?: React.ReactNode
}

/*
 * The seam between the parts and the state. Swap what feeds it, not the parts.
 */
function ComposerProvider({
  state,
  actions,
  inputRef,
  children,
}: ComposerProviderProps) {
  const ownRef = React.useRef<HTMLTextAreaElement>(null)
  const ref = inputRef ?? ownRef
  const value = React.useMemo(
    () => ({ state, actions, meta: { inputRef: ref } }),
    [state, actions, ref]
  )
  return <ComposerContext value={value}>{children}</ComposerContext>
}

type ComposerMessage = {
  /** The text that was sent, trimmed. */
  value: string
  /** The files that were sent. */
  attachments: ComposerAttachment[]
}

type LocalComposerProviderProps = {
  /** The draft to start with. */
  defaultValue?: string
  /** Attachments to start with. */
  defaultAttachments?: ComposerAttachment[]
  /** Called with the draft on send. Return a promise to hold the draft until it settles; a rejection keeps it. */
  onSubmit?: (message: ComposerMessage) => void | Promise<void>
  /** Takes no input while true. */
  disabled?: boolean
  /** Decides whether the draft may be sent. Defaults to having text or an attachment. */
  canSubmit?: (message: ComposerMessage) => boolean
  /** A ref for the text box. One is made for you when omitted. */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  /** The parts. */
  children?: React.ReactNode
}

let attachmentCount = 0

/** Turns picked or dropped files into attachments with unique ids. */
function toAttachments(files: File[]): ComposerAttachment[] {
  return files.map((file) => ({
    id: `attachment-${++attachmentCount}`,
    name: file.name,
    size: file.size,
    file,
  }))
}

/*
 * The draft in component state, cleared once a send succeeds. For a draft
 * that has to outlive the component or follow the person across devices,
 * render ComposerProvider with your own store instead.
 */
function LocalComposerProvider({
  defaultValue = "",
  defaultAttachments = [],
  onSubmit,
  disabled,
  canSubmit = hasContent,
  inputRef,
  children,
}: LocalComposerProviderProps) {
  const [value, setValue] = React.useState(defaultValue)
  const [attachments, setAttachments] = React.useState(defaultAttachments)
  const [submitting, setSubmitting] = React.useState(false)

  const ready = canSubmit({ value: value.trim(), attachments })
  const state = React.useMemo(
    () => ({ value, attachments, submitting, disabled, canSubmit: ready }),
    [value, attachments, submitting, disabled, ready]
  )

  // Submit reads the latest draft without re-creating the actions on every
  // keystroke, which would re-render every part that only needs actions.
  const latest = React.useRef({ state, onSubmit })
  React.useLayoutEffect(() => {
    latest.current = { state, onSubmit }
  })

  const actions = React.useMemo<ComposerActions>(
    () => ({
      setValue,
      addAttachments: (files) =>
        setAttachments((current) => [...current, ...toAttachments(files)]),
      removeAttachment: (id) =>
        setAttachments((current) => current.filter((a) => a.id !== id)),
      submit: () => {
        const { state, onSubmit } = latest.current
        if (!isSubmittable(state)) return
        const message = {
          value: state.value.trim(),
          attachments: state.attachments,
        }
        // Clear only what was sent: people keep typing while a slow send is
        // in flight, and that new draft has to survive it settling.
        const sent = new Set(state.attachments.map((a) => a.id))
        const clear = () => {
          setValue((current) => (current === state.value ? "" : current))
          setAttachments((current) => current.filter((a) => !sent.has(a.id)))
        }
        const result = onSubmit?.(message)
        if (!(result instanceof Promise)) {
          clear()
          return
        }
        setSubmitting(true)
        result.then(clear, () => {}).finally(() => setSubmitting(false))
      },
    }),
    []
  )

  return (
    <ComposerProvider state={state} actions={actions} inputRef={inputRef}>
      {children}
    </ComposerProvider>
  )
}

const INTERACTIVE =
  "button, a, input, textarea, select, label, [role=button], [tabindex], [contenteditable]"

/*
 * The box around the parts. A click on its bare surface focuses the text box,
 * so the whole frame reads as one field.
 */
function ComposerFrame({
  className,
  onClick,
  ...props
}: React.ComponentProps<"div">) {
  const { state, meta } = useComposer()
  return (
    <div
      data-slot="chat-composer"
      data-disabled={state.disabled ? "" : undefined}
      className={cn(
        "relative flex w-full flex-col rounded-2xl border border-input bg-input-subtle transition-colors has-[[data-slot=chat-composer-input]:focus-visible]:border-ring has-[[data-slot=chat-composer-input]:focus-visible]:ring-[3px] has-[[data-slot=chat-composer-input]:focus-visible]:ring-ring-subtle data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        const target = event.target as Element
        if (event.defaultPrevented || target.closest(INTERACTIVE)) return
        meta.inputRef.current?.focus()
      }}
      {...props}
    />
  )
}

/** A row above the text box, for context such as a reply or attachments. */
function ComposerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-composer-header"
      className={cn(
        "flex flex-wrap items-center gap-2 px-3 pt-3 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/*
 * The text box. Enter sends and Shift+Enter breaks the line. To change that,
 * handle onKeyDown and call preventDefault; the part then leaves the key alone.
 */
function ComposerInput({
  className,
  ref,
  disabled,
  onChange,
  onKeyDown,
  "aria-label": ariaLabel = "Message",
  ...props
}: React.ComponentProps<"textarea">) {
  const {
    state,
    actions,
    meta: { inputRef },
  } = useComposer()
  // A caller's ref joins the composer's rather than replacing it, which
  // would break frame clicks and the mention button.
  const mergedRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") return ref(node)
      if (ref) ref.current = node
    },
    [inputRef, ref]
  )
  return (
    <textarea
      {...props}
      ref={mergedRef}
      data-slot="chat-composer-input"
      rows={props.rows ?? 1}
      aria-label={ariaLabel}
      value={state.value}
      disabled={state.disabled || disabled}
      onChange={(event) => {
        onChange?.(event)
        actions.setValue(event.target.value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          event.defaultPrevented ||
          event.key !== "Enter" ||
          event.shiftKey ||
          // Enter also confirms a word in an input method editor. Safari
          // reports that keydown as keyCode 229 without isComposing.
          event.nativeEvent.isComposing ||
          event.keyCode === 229
        )
          return
        event.preventDefault()
        actions.submit()
      }}
      className={cn(
        "field-sizing-content max-h-60 min-h-11 w-full resize-none bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm",
        className
      )}
    />
  )
}

/** A row below the text box, for actions and the send button. */
function ComposerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-composer-footer"
      className={cn(
        "flex items-center justify-between gap-1 px-2 pb-2",
        className
      )}
      {...props}
    />
  )
}

type ComposerActionProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label"
> & {
  /** Names the icon for screen readers and the tooltip. */
  label: string
}

/** An icon button for the footer, disabled with the composer. */
function ComposerAction({
  label,
  className,
  disabled,
  ...props
}: ComposerActionProps) {
  const { state } = useComposer()
  return (
    <Button
      data-slot="chat-composer-action"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={disabled ?? state.disabled}
      className={cn("rounded-full text-muted-foreground", className)}
      {...props}
    />
  )
}

type ComposerAttachButtonProps = Omit<ComposerActionProps, "label"> & {
  /** File types the picker offers, as in the input's accept attribute. */
  accept?: string
  /** Names the button. */
  label?: string
}

/** Opens the file picker and attaches what is picked. */
function ComposerAttachButton({
  accept,
  label = "Attach files",
  onClick,
  children,
  ...props
}: ComposerAttachButtonProps) {
  const { actions } = useComposer()
  const fileRef = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <ComposerAction
        label={label}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) fileRef.current?.click()
        }}
        {...props}
      >
        {children ?? <PaperclipIcon />}
      </ComposerAction>
      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        accept={accept}
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length) actions.addAttachments(files)
          // Picking the same file twice should attach it twice.
          event.target.value = ""
        }}
      />
    </>
  )
}

/** Puts text at the caret, replacing any selection, and keeps focus there. */
function insertAtCaret(
  { state, actions, meta }: ComposerContextValue,
  text: string
) {
  const input = meta.inputRef.current
  const start = input?.selectionStart ?? state.value.length
  const end = input?.selectionEnd ?? state.value.length
  actions.setValue(state.value.slice(0, start) + text + state.value.slice(end))
  const caret = start + text.length
  requestAnimationFrame(() => {
    input?.focus()
    input?.setSelectionRange(caret, caret)
  })
}

/** Starts a mention by typing @ at the caret. */
function ComposerMentionButton({
  label = "Mention someone",
  onClick,
  children,
  ...props
}: Omit<ComposerActionProps, "label"> & {
  /** Names the button. */
  label?: string
}) {
  const composer = useComposer()
  return (
    <ComposerAction
      label={label}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) insertAtCaret(composer, "@")
      }}
      {...props}
    >
      {children ?? <AtSignIcon />}
    </ComposerAction>
  )
}

/*
 * The actions most composers share. It is only JSX, so a composer that needs
 * something else leaves it out and lists its own actions instead.
 */
function ComposerCommonActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-composer-common-actions"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      <ComposerAttachButton />
      <ComposerMentionButton />
    </div>
  )
}

/** Sends the draft. Works anywhere inside the provider, not only in the frame. */
function ComposerSubmit({
  className,
  children,
  disabled,
  onClick,
  "aria-label": ariaLabel = "Send",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { state, actions, meta } = useComposer()
  return (
    <Button
      data-slot="chat-composer-submit"
      type="button"
      size={children ? "sm" : "icon-sm"}
      aria-label={children ? undefined : ariaLabel}
      aria-busy={state.submitting || undefined}
      {...props}
      disabled={disabled || !isSubmittable(state)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        actions.submit()
        // Sending empties the draft, which disables this button and would
        // drop focus to the page. The text box is where people go next.
        meta.inputRef.current?.focus()
      }}
      className={cn("rounded-full", className)}
    >
      {state.submitting ? (
        <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
      ) : children ? null : (
        <ArrowUpIcon />
      )}
      {children}
    </Button>
  )
}

/** Lists the draft's attachments, each with a button to remove it. Renders nothing when empty. */
function ComposerAttachments({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  const { state, actions } = useComposer()
  if (!state.attachments.length) return null
  return (
    <ul
      data-slot="chat-composer-attachments"
      aria-label="Attachments"
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    >
      {state.attachments.map((attachment) => (
        <li
          key={attachment.id}
          data-slot="chat-composer-attachment"
          className="flex h-7 max-w-56 items-center gap-1.5 rounded-full border border-border bg-background pr-1 pl-2.5 text-xs text-foreground"
        >
          <PaperclipIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{attachment.name}</span>
          {attachment.size !== undefined ? (
            <span className="shrink-0 text-muted-foreground">
              {formatBytes(attachment.size)}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={`Remove ${attachment.name}`}
            disabled={state.disabled}
            onClick={() => actions.removeAttachment(attachment.id)}
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle disabled:pointer-events-none"
          >
            <XIcon className="size-3" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Sizes in the units people read them in: 512 B, 12 KB, 3.4 MB. */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return `${size < 10 ? size.toFixed(1).replace(/\.0$/, "") : Math.round(size)} ${units[unit]}`
}

/** Whether a file passes an accept string such as "image/*,.pdf". */
function matchesAccept(file: File, accept?: string) {
  if (!accept?.trim()) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (!rule) return false
    if (rule.startsWith(".")) return name.endsWith(rule)
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

/*
 * Attaches files dropped anywhere inside it. Leave it out to turn drag and
 * drop off; there is no prop for that.
 */
function ComposerDropZone({
  className,
  children,
  label = "Drop files to attach",
  accept,
  ...props
}: React.ComponentProps<"div"> & {
  /** Shown over the zone while files are dragged across it. */
  label?: React.ReactNode
  /** File types it takes, as in a file input's accept attribute. Match it to the attach button's. */
  accept?: string
}) {
  const { state, actions } = useComposer()
  const [dragging, setDragging] = React.useState(false)
  // dragenter and dragleave fire for every child crossed, so count them.
  const depth = React.useRef(0)

  const hasFiles = (event: React.DragEvent) =>
    !state.disabled && event.dataTransfer.types.includes("Files")

  return (
    <div
      data-slot="chat-composer-drop-zone"
      data-dragging={dragging ? "" : undefined}
      className={cn("relative", className)}
      onDragEnter={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        depth.current++
        setDragging(true)
      }}
      onDragOver={(event) => {
        if (!hasFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      }}
      onDrop={(event) => {
        // Reset first, so the hint never sticks if the composer was
        // disabled mid-drag.
        depth.current = 0
        setDragging(false)
        if (!hasFiles(event)) return
        event.preventDefault()
        const files = Array.from(event.dataTransfer.files).filter((file) =>
          matchesAccept(file, accept)
        )
        if (files.length) actions.addAttachments(files)
      }}
      {...props}
    >
      {children}
      {dragging ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-ring bg-background text-sm font-medium text-foreground"
        >
          {label}
        </div>
      ) : null}
    </div>
  )
}

export {
  ComposerAction,
  ComposerAttachButton,
  ComposerAttachments,
  ComposerCommonActions,
  ComposerDropZone,
  ComposerFooter,
  ComposerFrame,
  ComposerHeader,
  ComposerInput,
  ComposerMentionButton,
  ComposerProvider,
  ComposerSubmit,
  LocalComposerProvider,
  formatBytes,
  isSubmittable,
  matchesAccept,
  useComposer,
  type ComposerActions,
  type ComposerAttachment,
  type ComposerContextValue,
  type ComposerMessage,
  type ComposerMeta,
  type ComposerState,
}
