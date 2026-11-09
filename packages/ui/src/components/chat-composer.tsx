"use client"

import * as React from "react"
import { ArrowUpIcon, AtSignIcon, PaperclipIcon } from "lucide-react"

import { Attachment } from "@workspace/ui/components/attachment"
import { Button } from "@workspace/ui/components/button"
import { DropZone } from "@workspace/ui/components/drop-zone"
import { Progress } from "@workspace/ui/components/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/*
 * The composer is a set of parts around one context, after Fernando Rojo's
 * "Composition is all you need". The parts never own state: they read it and
 * call actions through the context. Whoever renders the provider decides
 * where the draft lives, so the same parts serve a local draft, an edit, or a
 * draft synced across devices without a boolean prop for each.
 */

type ChatComposerAttachment = {
  /** Stable key for the attachment. */
  id: string
  /** File name shown on the chip. */
  name: string
  /** Size in bytes, shown beside the name when present. */
  size?: number
  /** The file itself, when it came from this device. */
  file?: File
  /** Where its upload is. Leave it out for a file that needs no upload. */
  status?: "ready" | "loading" | "error"
  /** What went wrong, in a few words, when the upload failed. */
  error?: string
}

type ChatComposerState = {
  /** The draft text. */
  value: string
  /** Files attached to the draft. */
  attachments: ChatComposerAttachment[]
  /** True while a submit is in flight. */
  submitting?: boolean
  /** True when the composer takes no input. */
  disabled?: boolean
  /** Whether the draft may be sent. Defaults to having text or an attachment. */
  canSubmit?: boolean
}

type ChatComposerActions = {
  /** Replaces the draft text. */
  setValue: (value: string) => void
  /** Attaches files to the draft. */
  addAttachments: (files: File[]) => void
  /** Removes one attachment by id. */
  removeAttachment: (id: string) => void
  /** Tries a failed upload again. Without it, failed files offer no retry. */
  retryAttachment?: (id: string) => void
  /** Sends the draft. */
  submit: () => void
}

type ChatComposerMeta = {
  /** The text box, so any part can focus it or read the caret. */
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}

type ChatComposerContextValue = {
  /** The draft. */
  state: ChatComposerState
  /** How to change the draft and send it. */
  actions: ChatComposerActions
  /** Handles the parts share, such as the text box. */
  meta: ChatComposerMeta
}

const ChatComposerContext =
  React.createContext<ChatComposerContextValue | null>(null)

/** Reads the nearest composer. Throws outside a provider. */
function useChatComposer() {
  const context = React.useContext(ChatComposerContext)
  if (!context) {
    throw new Error(
      "Composer parts must be rendered inside a ChatComposerProvider."
    )
  }
  return context
}

/** Whether the draft has any text or files in it. */
function hasContent({ value, attachments }: ChatComposerMessage) {
  return value.trim() !== "" || attachments.length > 0
}

/** Whether every attachment has finished uploading. */
function uploadsReady({ attachments }: ChatComposerState) {
  return attachments.every((a) => (a.status ?? "ready") === "ready")
}

/** Whether the draft may be sent and the composer is free to send it. */
function isSubmittable(state: ChatComposerState) {
  return (
    !state.disabled &&
    !state.submitting &&
    uploadsReady(state) &&
    (state.canSubmit ?? hasContent(state))
  )
}

type ChatComposerProviderProps = {
  /** The draft, from wherever it lives. */
  state: ChatComposerState
  /** How the parts change the draft and send it. */
  actions: ChatComposerActions
  /** A ref for the text box. One is made for you when omitted. */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  /** The parts, in any order and anywhere below. Renders no element. */
  children?: React.ReactNode
}

/*
 * The seam between the parts and the state. Swap what feeds it, not the parts.
 */
function ChatComposerProvider({
  state,
  actions,
  inputRef,
  children,
}: ChatComposerProviderProps) {
  const ownRef = React.useRef<HTMLTextAreaElement>(null)
  const ref = inputRef ?? ownRef
  const value = React.useMemo(
    () => ({ state, actions, meta: { inputRef: ref } }),
    [state, actions, ref]
  )
  return <ChatComposerContext value={value}>{children}</ChatComposerContext>
}

type ChatComposerMessage = {
  /** The text that was sent, trimmed. */
  value: string
  /** The files that were sent. */
  attachments: ChatComposerAttachment[]
}

type LocalChatComposerProviderProps = {
  /** The draft to start with. */
  defaultValue?: string
  /** Attachments to start with. */
  defaultAttachments?: ChatComposerAttachment[]
  /** Called with the draft on send. Return a promise to hold the draft until it settles; a rejection keeps it. */
  onSubmit?: (message: ChatComposerMessage) => void | Promise<void>
  /** Takes no input while true. */
  disabled?: boolean
  /** Decides whether the draft may be sent. Defaults to having text or an attachment. */
  canSubmit?: (message: ChatComposerMessage) => boolean
  /** Uploads one attachment. While it runs the attachment shows loading and send waits; a rejection marks it failed and offers retry. */
  upload?: (attachment: ChatComposerAttachment) => Promise<void>
  /** A ref for the text box. One is made for you when omitted. */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  /** The parts. */
  children?: React.ReactNode
}

let attachmentCount = 0

/** Turns picked or dropped files into attachments with unique ids. */
function toAttachments(files: File[]): ChatComposerAttachment[] {
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
 * render ChatComposerProvider with your own store instead.
 */
function LocalChatComposerProvider({
  defaultValue = "",
  defaultAttachments = [],
  onSubmit,
  disabled,
  canSubmit = hasContent,
  upload,
  inputRef,
  children,
}: LocalChatComposerProviderProps) {
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
  const latest = React.useRef({ state, onSubmit, upload })
  React.useLayoutEffect(() => {
    latest.current = { state, onSubmit, upload }
  })

  const actions = React.useMemo<ChatComposerActions>(() => {
    const patch = (id: string, next: Partial<ChatComposerAttachment>) =>
      setAttachments((current) =>
        current.map((a) => (a.id === id ? { ...a, ...next } : a))
      )
    const start = (attachment: ChatComposerAttachment) => {
      const { upload } = latest.current
      if (!upload) return
      patch(attachment.id, { status: "loading", error: undefined })
      upload(attachment).then(
        () => patch(attachment.id, { status: "ready" }),
        () => patch(attachment.id, { status: "error" })
      )
    }
    return {
      setValue,
      addAttachments: (files) => {
        const added = toAttachments(files).map((a) =>
          latest.current.upload ? { ...a, status: "loading" as const } : a
        )
        setAttachments((current) => [...current, ...added])
        added.forEach(start)
      },
      removeAttachment: (id) =>
        setAttachments((current) => current.filter((a) => a.id !== id)),
      retryAttachment: (id) => {
        const attachment = latest.current.state.attachments.find(
          (a) => a.id === id
        )
        if (attachment) start(attachment)
      },
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
    }
  }, [])

  return (
    <ChatComposerProvider state={state} actions={actions} inputRef={inputRef}>
      {children}
    </ChatComposerProvider>
  )
}

const INTERACTIVE =
  "button, a, input, textarea, select, label, [role=button], [tabindex], [contenteditable]"

/*
 * The box around the parts. A click on its bare surface focuses the text box,
 * so the whole frame reads as one field.
 */
function ChatComposerFrame({
  className,
  onClick,
  ...props
}: React.ComponentProps<"div">) {
  const { state, meta } = useChatComposer()
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
function ChatComposerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
function ChatComposerInput({
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
  } = useChatComposer()
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
function ChatComposerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
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

type ChatComposerActionProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label"
> & {
  /** Names the icon for screen readers and the tooltip. */
  label: string
}

/** An icon button for the footer, disabled with the composer. */
function ChatComposerAction({
  label,
  className,
  disabled,
  ...props
}: ChatComposerActionProps) {
  const { state } = useChatComposer()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-slot="chat-composer-action"
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled ?? state.disabled}
            className={cn("rounded-full text-muted-foreground", className)}
            {...props}
          />
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

type ChatComposerAttachButtonProps = Omit<ChatComposerActionProps, "label"> & {
  /** File types the picker offers, as in the input's accept attribute. */
  accept?: string
  /** Names the button. */
  label?: string
}

/** Opens the file picker and attaches what is picked. */
function ChatComposerAttachButton({
  accept,
  label = "Attach files",
  onClick,
  children,
  ...props
}: ChatComposerAttachButtonProps) {
  const { actions } = useChatComposer()
  const fileRef = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <ChatComposerAction
        label={label}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) fileRef.current?.click()
        }}
        {...props}
      >
        {children ?? <PaperclipIcon />}
      </ChatComposerAction>
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
  { state, actions, meta }: ChatComposerContextValue,
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
function ChatComposerMentionButton({
  label = "Mention someone",
  onClick,
  children,
  ...props
}: Omit<ChatComposerActionProps, "label"> & {
  /** Names the button. */
  label?: string
}) {
  const composer = useChatComposer()
  return (
    <ChatComposerAction
      label={label}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) insertAtCaret(composer, "@")
      }}
      {...props}
    >
      {children ?? <AtSignIcon />}
    </ChatComposerAction>
  )
}

/*
 * The actions most composers share. It is only JSX, so a composer that needs
 * something else leaves it out and lists its own actions instead.
 */
function ChatComposerCommonActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chat-composer-common-actions"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      <ChatComposerAttachButton />
      <ChatComposerMentionButton />
    </div>
  )
}

type ChatComposerSuggestedReplyProps = React.ComponentProps<"button"> & {
  /** The text it puts in the draft. Defaults to its children when they are text. */
  value?: string
}

/*
 * A reply people can use in one tap. It fills the draft rather than sending,
 * so people can still change it.
 */
function ChatComposerSuggestedReply({
  value,
  children,
  className,
  disabled,
  onClick,
  ...props
}: ChatComposerSuggestedReplyProps) {
  const { state, actions, meta } = useChatComposer()
  const text = value ?? (typeof children === "string" ? children : "")
  return (
    <button
      data-slot="chat-composer-suggested-reply"
      type="button"
      disabled={disabled ?? state.disabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        actions.setValue(text)
        const input = meta.inputRef.current
        requestAnimationFrame(() => {
          input?.focus()
          input?.setSelectionRange(text.length, text.length)
        })
      }}
      className={cn(
        "flex h-7 shrink-0 items-center rounded-full border border-border bg-background px-3 text-xs text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Sends the draft. Works anywhere inside the provider, not only in the frame. */
function ChatComposerSubmit({
  className,
  children,
  disabled,
  onClick,
  "aria-label": ariaLabel = "Send",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { state, actions, meta } = useChatComposer()
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
        <Progress type="circle" size="sm" value={null} aria-hidden="true" />
      ) : children ? null : (
        <ArrowUpIcon />
      )}
      {children}
    </Button>
  )
}

/** Lists the draft's attachments, each with a button to remove it. Renders nothing when empty. */
function ChatComposerAttachments({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  const { state, actions } = useChatComposer()
  if (!state.attachments.length) return null
  return (
    <ul
      data-slot="chat-composer-attachments"
      aria-label="Attachments"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {state.attachments.map((attachment) => (
        <li key={attachment.id} data-slot="chat-composer-attachment">
          <ChatComposerAttachmentItem
            attachment={attachment}
            disabled={state.disabled}
            onRemove={() => actions.removeAttachment(attachment.id)}
            onRetry={
              actions.retryAttachment
                ? () => actions.retryAttachment?.(attachment.id)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  )
}

// One URL per file for the life of the page: revoking on unmount would
// break the preview when Strict Mode or a list reorder remounts the item.
const previews = new WeakMap<File, string>()

function previewUrl(file: File) {
  let url = previews.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    previews.set(file, url)
  }
  return url
}

/** An image from this device previews as a thumbnail; anything else is a chip. */
function ChatComposerAttachmentItem({
  attachment,
  ...props
}: {
  attachment: ChatComposerAttachment
  disabled?: boolean
  onRemove: () => void
  onRetry?: () => void
}) {
  const file = attachment.file
  const image = file?.type.startsWith("image/") ?? false
  const src = file && image ? previewUrl(file) : undefined
  return (
    <Attachment
      type={image ? "image" : "file"}
      status={attachment.status}
      name={attachment.name}
      size={attachment.size}
      error={attachment.error}
      src={src}
      {...props}
    />
  )
}

/*
 * A Drop zone that attaches what is dropped. Wrap the whole conversation
 * panel, not just the frame, so the target is easy to hit. Leave it out to
 * turn drag and drop off; there is no prop for that.
 */
function ChatComposerDropZone(
  props: Omit<React.ComponentProps<typeof DropZone>, "onDropFiles">
) {
  const { state, actions } = useChatComposer()
  return (
    <DropZone
      data-slot="chat-composer-drop-zone"
      {...props}
      disabled={state.disabled || props.disabled}
      onDropFiles={actions.addAttachments}
    />
  )
}

export {
  ChatComposerAction,
  ChatComposerAttachButton,
  ChatComposerAttachments,
  ChatComposerCommonActions,
  ChatComposerDropZone,
  ChatComposerFooter,
  ChatComposerFrame,
  ChatComposerHeader,
  ChatComposerInput,
  ChatComposerMentionButton,
  ChatComposerProvider,
  ChatComposerSubmit,
  ChatComposerSuggestedReply,
  LocalChatComposerProvider,
  useChatComposer,
  type ChatComposerActions,
  type ChatComposerAttachment,
  type ChatComposerContextValue,
  type ChatComposerMessage,
  type ChatComposerMeta,
  type ChatComposerState,
  type ChatComposerSuggestedReplyProps,
}
