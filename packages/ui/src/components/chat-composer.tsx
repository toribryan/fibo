"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import {
  ArrowUpIcon,
  AtSignIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SmileIcon,
  ZapIcon,
} from "lucide-react"

import { Attachment } from "@workspace/ui/components/attachment"
import { Button } from "@workspace/ui/components/button"
import {
  CommandMenu,
  type CommandMenuProps,
} from "@workspace/ui/components/command-menu"
import { DropZone } from "@workspace/ui/components/drop-zone"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
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
  /** Opens the command menu, while a ChatComposerCommandMenu is rendered. */
  openCommandsRef: React.RefObject<(() => void) | null>
  /** Whether a touch screen is the main input, which changes the footer, sizes and Return. */
  pointer: ChatComposerPointer
}

type ChatComposerPointer = "fine" | "coarse"

const COARSE = "(pointer: coarse)"

function subscribePointer(onChange: () => void) {
  const query = window.matchMedia(COARSE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/*
 * A laptop with a touchscreen still reports a fine pointer, so it keeps the
 * desktop composer. The server renders fine, then a phone switches on mount.
 */
function usePointer(forced?: ChatComposerPointer): ChatComposerPointer {
  const detected = React.useSyncExternalStore(
    subscribePointer,
    () => (window.matchMedia(COARSE).matches ? "coarse" : "fine"),
    () => "fine" as const
  )
  return forced ?? detected
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
  /** Forces the touch or desktop layout. Detected from the pointer when omitted. */
  pointer?: ChatComposerPointer
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
  pointer: forcedPointer,
  children,
}: ChatComposerProviderProps) {
  const ownRef = React.useRef<HTMLTextAreaElement>(null)
  const ref = inputRef ?? ownRef
  const openCommandsRef = React.useRef<(() => void) | null>(null)
  const pointer = usePointer(forcedPointer)
  const value = React.useMemo(
    () => ({
      state,
      actions,
      meta: { inputRef: ref, openCommandsRef, pointer },
    }),
    [state, actions, ref, pointer]
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
  /** Forces the touch or desktop layout. Detected from the pointer when omitted. */
  pointer?: ChatComposerPointer
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
  pointer,
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
    <ChatComposerProvider
      state={state}
      actions={actions}
      inputRef={inputRef}
      pointer={pointer}
    >
      {children}
    </ChatComposerProvider>
  )
}

const INTERACTIVE =
  "button, a, input, textarea, select, label, [role=button], [tabindex], [contenteditable]"

/*
 * The box around the parts. Its 240px minimum fits the footer (four actions
 * and send) with room to read the draft; narrower hosts use the one-row
 * layout or fewer actions rather than overlapping them. A click on its bare
 * surface focuses the text box, so the whole frame reads as one field.
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
      data-pointer={meta.pointer}
      data-disabled={state.disabled ? "" : undefined}
      className={cn(
        "relative flex w-full min-w-60 flex-col rounded-2xl border border-input bg-input-subtle transition-colors has-[[data-slot=chat-composer-input]:focus-visible]:border-ring has-[[data-slot=chat-composer-input]:focus-visible]:ring-[3px] has-[[data-slot=chat-composer-input]:focus-visible]:ring-ring-subtle data-disabled:cursor-not-allowed data-disabled:opacity-50",
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
  const { meta } = useChatComposer()
  return (
    <div
      data-slot="chat-composer-header"
      className={cn(
        "flex items-center gap-2 px-3 pt-3 text-sm text-muted-foreground",
        // On a phone, chips scroll sideways in one row rather than wrapping
        // and pushing the conversation up.
        meta.pointer === "coarse"
          ? "[scrollbar-width:none] flex-nowrap overflow-x-auto"
          : "flex-wrap",
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
    meta: { inputRef, openCommandsRef, pointer },
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
      // Phone keyboards label Return to match what it does here.
      enterKeyHint={
        props.enterKeyHint ?? (pointer === "coarse" ? "enter" : "send")
      }
      aria-label={ariaLabel}
      value={state.value}
      disabled={state.disabled || disabled}
      onChange={(event) => {
        onChange?.(event)
        const openCommands = openCommandsRef.current
        if (openCommands && startsCommand(event)) {
          // The slash only opens the menu, so it stays out of the draft.
          openCommands()
          return
        }
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
          event.keyCode === 229 ||
          // On a phone, Return adds a line and the send button sends, as
          // in every messaging app people already know.
          pointer === "coarse"
        )
          return
        event.preventDefault()
        actions.submit()
      }}
      className={cn(
        "field-sizing-content min-h-11 w-full resize-none bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm",
        // With the keyboard up, a third of the screen is as much as a draft
        // can take before it hides the conversation.
        pointer === "coarse" ? "max-h-[33dvh]" : "max-h-60",
        className
      )}
    />
  )
}

/** Whether this keystroke typed a slash at the start of a word. */
function startsCommand(event: React.ChangeEvent<HTMLTextAreaElement>) {
  const input = event.nativeEvent as InputEvent
  if (input.inputType !== "insertText" || input.data !== "/") return false
  const caret = event.target.selectionStart
  const before = event.target.value[caret - 2]
  return caret === 1 || (before !== undefined && /\s/.test(before))
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
  /** A short notice, such as an error, shown in the tooltip and held open while set. */
  message?: string
}

// Set inside ChatComposerActionsSheet to the function that closes it, so an
// action there draws itself as a labeled row and closes the sheet when used.
const ActionsSheetContext = React.createContext<(() => void) | null>(null)

/*
 * An icon button for the footer, disabled with the composer. Inside the
 * actions sheet it becomes a full-width row with its label, so the same
 * action works in both places.
 */
function ChatComposerAction({
  label,
  message,
  className,
  disabled,
  onClick,
  children,
  ...props
}: ChatComposerActionProps) {
  const { state, meta } = useChatComposer()
  const closeSheet = React.useContext(ActionsSheetContext)
  const [hovered, setHovered] = React.useState(false)
  if (closeSheet) {
    return (
      <Button
        data-slot="chat-composer-action"
        type="button"
        variant="ghost"
        size="lg"
        disabled={disabled ?? state.disabled}
        className={cn("w-full justify-start", className)}
        {...props}
        onClick={(event) => {
          onClick?.(event)
          closeSheet()
        }}
      >
        {children}
        {label}
      </Button>
    )
  }
  return (
    <Tooltip open={Boolean(message) || hovered} onOpenChange={setHovered}>
      <TooltipTrigger
        render={
          <Button
            data-slot="chat-composer-action"
            type="button"
            variant="ghost"
            size={meta.pointer === "coarse" ? "icon-lg" : "icon-sm"}
            aria-label={label}
            disabled={disabled ?? state.disabled}
            className={cn("rounded-full text-muted-foreground", className)}
            onClick={onClick}
            {...props}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent>{message ?? label}</TooltipContent>
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

type ChatComposerEmoji = {
  /** The character inserted into the draft. */
  emoji: string
  /** Names it for screen readers and the tooltip. */
  label: string
}

// Native characters, drawn by the system's emoji font, so there is no image
// set or dataset to ship. Browsers give no way to open the system picker.
const DEFAULT_EMOJIS: ChatComposerEmoji[] = [
  { emoji: "\u{1F600}", label: "Grinning" },
  { emoji: "\u{1F602}", label: "Laughing" },
  { emoji: "\u{1F642}", label: "Smiling" },
  { emoji: "\u{1F609}", label: "Winking" },
  { emoji: "\u{1F60D}", label: "Heart eyes" },
  { emoji: "\u{1F914}", label: "Thinking" },
  { emoji: "\u{1F62E}", label: "Surprised" },
  { emoji: "\u{1F622}", label: "Crying" },
  { emoji: "\u{1F605}", label: "Nervous laugh" },
  { emoji: "\u{1F643}", label: "Upside down" },
  { emoji: "\u{1F60E}", label: "Cool" },
  { emoji: "\u{1F973}", label: "Party" },
  { emoji: "\u{1F634}", label: "Sleeping" },
  { emoji: "\u{1F92F}", label: "Mind blown" },
  { emoji: "\u{1F62C}", label: "Grimacing" },
  { emoji: "\u{1FAE1}", label: "Salute" },
  { emoji: "\u{1F44D}", label: "Thumbs up" },
  { emoji: "\u{1F44E}", label: "Thumbs down" },
  { emoji: "\u{1F44F}", label: "Clapping" },
  { emoji: "\u{1F64C}", label: "Raised hands" },
  { emoji: "\u{1F64F}", label: "Thank you" },
  { emoji: "\u{1F440}", label: "Eyes" },
  { emoji: "\u{1F4AA}", label: "Strong" },
  { emoji: "\u{1F44B}", label: "Wave" },
  { emoji: "\u{2764}\u{FE0F}", label: "Heart" },
  { emoji: "\u{1F525}", label: "Fire" },
  { emoji: "\u{2728}", label: "Sparkles" },
  { emoji: "\u{1F389}", label: "Celebrate" },
  { emoji: "\u{2705}", label: "Done" },
  { emoji: "\u{274C}", label: "No" },
  { emoji: "\u{26A0}\u{FE0F}", label: "Warning" },
  { emoji: "\u{1F4AF}", label: "Hundred" },
  { emoji: "\u{1F680}", label: "Rocket" },
  { emoji: "\u{1F4A1}", label: "Idea" },
  { emoji: "\u{1F4CC}", label: "Pin" },
  { emoji: "\u{1F4CE}", label: "Paperclip" },
  { emoji: "\u{2615}", label: "Coffee" },
  { emoji: "\u{1F41B}", label: "Bug" },
  { emoji: "\u{1F3AF}", label: "Target" },
  { emoji: "\u{1F331}", label: "Seedling" },
]

const EMOJI_COLUMNS = 8

type ChatComposerEmojiButtonProps = Omit<ChatComposerActionProps, "label"> & {
  /** The emoji on offer, in order. Defaults to 40 common ones. */
  emojis?: ChatComposerEmoji[]
  /** Names the button. */
  label?: string
}

/** Opens a grid of native emoji and puts the one picked at the caret. */
function ChatComposerEmojiButton({
  emojis = DEFAULT_EMOJIS,
  label = "Add emoji",
  children,
  ...props
}: ChatComposerEmojiButtonProps) {
  const composer = useChatComposer()
  const [open, setOpen] = React.useState(false)
  const gridRef = React.useRef<HTMLDivElement>(null)

  function rove(event: React.KeyboardEvent<HTMLDivElement>) {
    const targets = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>("button") ?? []
    )
    const current = targets.indexOf(document.activeElement as HTMLElement)
    const step = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: EMOJI_COLUMNS,
      ArrowUp: -EMOJI_COLUMNS,
    }[event.key]
    if (step === undefined || current === -1) return
    event.preventDefault()
    targets[Math.min(Math.max(current + step, 0), targets.length - 1)]?.focus()
  }

  // Phone keyboards have their own emoji key.
  if (composer.meta.pointer === "coarse") return null

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        render={
          <ChatComposerAction label={label} {...props}>
            {children ?? <SmileIcon />}
          </ChatComposerAction>
        }
      />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="top"
          align="start"
          sideOffset={8}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="chat-composer-emoji-picker"
            aria-label="Emoji"
            finalFocus={composer.meta.inputRef}
            className="origin-(--transform-origin) rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-md outline-hidden transition-[opacity,transform] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <div
              ref={gridRef}
              onKeyDown={rove}
              className="grid grid-cols-8 gap-0.5"
            >
              {emojis.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => {
                    insertAtCaret(composer, emoji)
                    setOpen(false)
                  }}
                  className="flex size-8 items-center justify-center rounded-md text-lg outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

type ChatComposerCommandMenuProps = Omit<
  CommandMenuProps,
  "open" | "defaultOpen" | "trigger" | "hotkey"
>

/*
 * fibo's Command menu, opened by typing / at the start of a word or by
 * ChatComposerCommandButton. Rendering it is what turns slash commands on;
 * without it a slash is just a character. Commands act on the draft through
 * useChatComposer, like any other part.
 */
function ChatComposerCommandMenu({
  onOpenChange,
  label = "Commands",
  placeholder = "Search commands…",
  ...props
}: ChatComposerCommandMenuProps) {
  const { meta } = useChatComposer()
  const [open, setOpen] = React.useState(false)
  const change = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }
  const openMenu = React.useEffectEvent(() => change(true))
  React.useEffect(() => {
    const ref = meta.openCommandsRef
    ref.current = () => openMenu()
    return () => {
      ref.current = null
    }
  }, [meta.openCommandsRef])
  return (
    <CommandMenu
      {...props}
      label={label}
      placeholder={placeholder}
      open={open}
      onOpenChange={change}
      trigger={null}
      // The page may have its own Cmd+K menu; this one opens from the draft.
      hotkey={null}
    />
  )
}

/** Opens the command menu, the same as typing / at the start of a word. */
function ChatComposerCommandButton({
  label = "Run a command",
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
        if (event.defaultPrevented) return
        const openCommands = composer.meta.openCommandsRef.current
        if (openCommands) openCommands()
        else insertAtCaret(composer, "/")
      }}
      {...props}
    >
      {children ?? <ZapIcon />}
    </ChatComposerAction>
  )
}

/** The slice of the Web Speech API's SpeechRecognition the dictation button uses. */
type ChatComposerSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>
      }) => void)
    | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => ChatComposerSpeechRecognition

/** The browser's speech recognition, prefixed in Safari and older Chrome. */
function browserRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined
  const speech = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return speech.SpeechRecognition ?? speech.webkitSpeechRecognition
}

const noSubscription = () => () => {}

type ChatComposerDictationButtonProps = Omit<
  ChatComposerActionProps,
  "label"
> & {
  /** Names the button. */
  label?: string
  /** The language to listen for, as a BCP 47 tag. Defaults to the browser's. */
  lang?: string
  /** Makes the recogniser, for another engine or a test. Defaults to the browser's own. */
  recognition?: () => ChatComposerSpeechRecognition
  /** Called with the recogniser's error code, such as "not-allowed" when the mic is blocked. */
  onDictationError?: (error: string) => void
  /** What to say for each error code, for translation. Unlisted codes say Dictation stopped. */
  errorMessages?: Partial<Record<string, string>>
}

const DICTATION_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone is blocked. Allow it in site settings.",
  "service-not-allowed": "Dictation isn't allowed here.",
  "audio-capture": "No microphone found.",
  network: "Dictation needs a connection.",
  "no-speech": "Didn't hear anything.",
  "language-not-supported": "Dictation doesn't support this language.",
}

// Long enough to read, short enough that a stale notice never lingers.
const DICTATION_MESSAGE_MS = 4000

/*
 * Turns speech into text at the caret, with words landing in the draft as
 * they are heard. It renders nothing where the browser has no speech
 * recognition and no recognition prop is given, so Common actions can
 * always include it.
 */
function ChatComposerDictationButton({
  label = "Dictate",
  lang,
  recognition,
  onDictationError,
  errorMessages,
  onClick,
  className,
  children,
  ...props
}: ChatComposerDictationButtonProps) {
  const { state, actions, meta } = useChatComposer()
  const supported = React.useSyncExternalStore(
    noSubscription,
    () => Boolean(recognition ?? browserRecognition()),
    () => false
  )
  const [listening, setListening] = React.useState(false)
  const [message, setMessage] = React.useState<string>()
  const active = React.useRef<ChatComposerSpeechRecognition | null>(null)
  const clearMessage = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(
    () => () => {
      active.current?.abort()
      clearTimeout(clearMessage.current)
    },
    []
  )

  React.useEffect(() => {
    if (!listening) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") active.current?.stop()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [listening])

  // Phone keyboards have their own dictation key.
  if (!supported || meta.pointer === "coarse") return null

  function start() {
    const Recognition = browserRecognition()
    const engine = recognition?.() ?? (Recognition ? new Recognition() : null)
    if (!engine) return
    const input = meta.inputRef.current
    const begin = input?.selectionStart ?? state.value.length
    const end = input?.selectionEnd ?? state.value.length
    // Dictation replaces the selection, like typing would, and keeps what
    // follows the caret after the spoken words.
    const before = state.value.slice(0, begin)
    const after = state.value.slice(end)
    let caret = begin
    engine.lang = lang ?? navigator.language
    engine.continuous = true
    engine.interimResults = true
    engine.onresult = (event) => {
      let heard = ""
      for (let i = 0; i < event.results.length; i++)
        heard += event.results[i]?.[0]?.transcript ?? ""
      heard = heard.trim()
      const space = heard && before && !/\s$/.test(before) ? " " : ""
      actions.setValue(before + space + heard + after)
      caret = before.length + space.length + heard.length
    }
    engine.onerror = (event) => {
      onDictationError?.(event.error)
      // Aborted means the button or an unmount stopped it on purpose.
      if (event.error === "aborted") return
      setMessage(
        errorMessages?.[event.error] ??
          DICTATION_ERRORS[event.error] ??
          "Dictation stopped."
      )
      clearTimeout(clearMessage.current)
      clearMessage.current = setTimeout(
        () => setMessage(undefined),
        DICTATION_MESSAGE_MS
      )
    }
    engine.onend = () => {
      active.current = null
      setListening(false)
      input?.focus()
      input?.setSelectionRange(caret, caret)
    }
    active.current = engine
    setMessage(undefined)
    engine.start()
    setListening(true)
  }

  return (
    <>
      <ChatComposerAction
        label={label}
        message={message}
        aria-pressed={listening}
        variant={listening ? "secondary" : "ghost"}
        className={cn(listening && "text-secondary-foreground", className)}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          if (active.current) active.current.stop()
          else start()
        }}
        {...props}
      >
        {children ?? <MicIcon />}
      </ChatComposerAction>
      {/* The tooltip is not announced, so the notice is also read out here. */}
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  )
}

type ChatComposerActionsSheetProps = {
  /** Names the + button. */
  label?: string
  /** Names the sheet for screen readers. */
  title?: string
  /** The actions, as icon buttons such as ChatComposerAttachButton. Attach and command by default. */
  children?: React.ReactNode
}

/*
 * The + that holds the actions on a phone: it opens a bottom sheet where
 * each action is a full-width row. Common actions renders it on touch; use
 * it yourself for a custom set.
 */
function ChatComposerActionsSheet({
  label = "More actions",
  title = "Add to message",
  children,
}: ChatComposerActionsSheetProps) {
  const { state, meta } = useChatComposer()
  const [open, setOpen] = React.useState(false)
  const close = React.useCallback(() => setOpen(false), [])
  return (
    <Sheet side="bottom" open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            data-slot="chat-composer-actions-trigger"
            type="button"
            variant="ghost"
            size={meta.pointer === "coarse" ? "icon-lg" : "icon-sm"}
            aria-label={label}
            disabled={state.disabled}
            className="rounded-full text-muted-foreground"
          />
        }
      >
        <PlusIcon />
      </SheetTrigger>
      <SheetContent
        data-slot="chat-composer-actions-sheet"
        showCloseButton={false}
        // The file picker's input lives in the sheet and has to outlive it.
        keepMounted
        // An action may open something else, such as the command menu,
        // which should keep focus rather than hand it back to the +.
        finalFocus={false}
        className="gap-1 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      >
        <div
          aria-hidden
          className="mx-auto mb-2 h-1 w-9 rounded-full bg-input"
        />
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <ActionsSheetContext value={close}>
          {children ?? (
            <>
              <ChatComposerAttachButton />
              <ChatComposerCommandButton />
            </>
          )}
        </ActionsSheetContext>
      </SheetContent>
    </Sheet>
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
  const { meta } = useChatComposer()
  if (meta.pointer === "coarse") return <ChatComposerActionsSheet />
  return (
    <div
      data-slot="chat-composer-common-actions"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      <ChatComposerAttachButton />
      <ChatComposerEmojiButton />
      <ChatComposerCommandButton />
      <ChatComposerDictationButton />
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
      size={
        meta.pointer === "coarse"
          ? children
            ? "lg"
            : "icon-lg"
          : children
            ? "sm"
            : "icon-sm"
      }
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
  ChatComposerActionsSheet,
  ChatComposerAttachButton,
  ChatComposerAttachments,
  ChatComposerCommandButton,
  ChatComposerCommandMenu,
  ChatComposerCommonActions,
  ChatComposerDictationButton,
  ChatComposerDropZone,
  ChatComposerEmojiButton,
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
  type ChatComposerActionsSheetProps,
  type ChatComposerAttachment,
  type ChatComposerCommandMenuProps,
  type ChatComposerContextValue,
  type ChatComposerEmoji,
  type ChatComposerSpeechRecognition,
  type ChatComposerMessage,
  type ChatComposerMeta,
  type ChatComposerPointer,
  type ChatComposerState,
  type ChatComposerSuggestedReplyProps,
}
