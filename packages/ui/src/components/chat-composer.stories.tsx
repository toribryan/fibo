import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  CodeIcon,
  CornerDownRightIcon,
  EraserIcon,
  MehIcon,
  PencilIcon,
} from "lucide-react"
import { useMemo, useState, useSyncExternalStore } from "react"
import { expect, fn, waitFor, within } from "storybook/test"

import { Avatar, AvatarFallback } from "./avatar.js"
import { Button } from "./button.js"
import {
  ChatComposerAction,
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
  type ChatComposerAttachment,
  type ChatComposerMessage,
  type ChatComposerSpeechRecognition,
  type ChatComposerState,
} from "./chat-composer.js"
import { Checkbox } from "./checkbox.js"
import { Kbd } from "./kbd.js"

const meta: Meta<typeof LocalChatComposerProvider> = {
  title: "Special components/Chat composer",
  component: LocalChatComposerProvider,
  subcomponents: {
    ChatComposerProvider,
    ChatComposerFrame,
    ChatComposerHeader,
    ChatComposerInput,
    ChatComposerFooter,
    ChatComposerCommonActions,
    ChatComposerAction,
    ChatComposerAttachButton,
    ChatComposerMentionButton,
    ChatComposerEmojiButton,
    ChatComposerCommandButton,
    ChatComposerCommandMenu,
    ChatComposerDictationButton,
    ChatComposerAttachments,
    ChatComposerSubmit,
    ChatComposerSuggestedReply,
    ChatComposerDropZone,
  },
  argTypes: {
    defaultValue: { control: "text" },
    disabled: { control: "boolean" },
    defaultAttachments: { control: false },
    onSubmit: { control: false },
    canSubmit: { control: false },
    inputRef: { control: false },
    children: { control: false },
  },
  args: {
    defaultValue: "",
    disabled: false,
    onSubmit: fn(),
  },
  parameters: {
    controls: {
      exclude: [
        "defaultAttachments",
        "onSubmit",
        "canSubmit",
        "inputRef",
        "children",
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof LocalChatComposerProvider>

/*
 * Slash commands act on the draft like any other part, so they read it
 * through useChatComposer inside the provider.
 */
function SlashCommands() {
  const { state, actions } = useChatComposer()
  const append = (text: string) =>
    actions.setValue(state.value ? `${state.value} ${text}` : text)
  return (
    <ChatComposerCommandMenu
      hints={false}
      maxRecent={0}
      groups={[
        {
          label: "Commands",
          items: [
            {
              value: "shrug",
              label: "Shrug",
              icon: <MehIcon />,
              onSelect: () => append("\u00AF\\_(\u30C4)_/\u00AF"),
            },
            {
              value: "code",
              label: "Code block",
              icon: <CodeIcon />,
              onSelect: () => append("```\n\n```"),
            },
            {
              value: "clear",
              label: "Clear the draft",
              icon: <EraserIcon />,
              onSelect: () => actions.setValue(""),
            },
          ],
        },
      ]}
    />
  )
}

export const Default: Story = {
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame>
        <ChatComposerHeader className="empty:hidden">
          <ChatComposerAttachments />
        </ChatComposerHeader>
        <ChatComposerInput placeholder="Message #design" />
        <ChatComposerFooter>
          <ChatComposerCommonActions />
          <ChatComposerSubmit />
        </ChatComposerFooter>
      </ChatComposerFrame>
      <SlashCommands />
    </LocalChatComposerProvider>
  ),
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Message" })
    const send = canvas.getByRole("button", { name: "Send" })
    const body = within(canvasElement.ownerDocument.body)
    await expect(send).toBeDisabled()

    // Keyboard: Shift+Enter breaks the line, Enter sends and clears.
    await userEvent.click(input)
    await userEvent.keyboard("Tokens first{Shift>}{Enter}{/Shift}then parts")
    await expect(input).toHaveValue("Tokens first\nthen parts")
    await expect(send).toBeEnabled()
    await userEvent.keyboard("{Enter}")
    await expect(args.onSubmit).toHaveBeenLastCalledWith({
      value: "Tokens first\nthen parts",
      attachments: [],
    })
    await waitFor(() => expect(input).toHaveValue(""))

    // Whitespace alone is not a message.
    await userEvent.keyboard("   {Enter}")
    await expect(args.onSubmit).toHaveBeenCalledTimes(1)
    await userEvent.clear(input)

    // A slash inside a word is just a character.
    await userEvent.keyboard("and/or")
    await expect(input).toHaveValue("and/or")
    await expect(body.queryByRole("dialog")).toBeNull()

    // Keyboard: a slash after a space opens the commands and stays out of
    // the draft; the search picks one and Enter runs it.
    await userEvent.keyboard(" /")
    const menu = await body.findByRole("dialog", { name: "Commands" })
    await expect(input).toHaveValue("and/or ")
    await userEvent.keyboard("shr{Enter}")
    await waitFor(() => expect(menu).not.toBeInTheDocument())
    await expect(input).toHaveValue("and/or  \u00AF\\_(\u30C4)_/\u00AF")
    await waitFor(() => expect(input).toHaveFocus())

    // Pointer: the command button opens the same menu.
    await userEvent.click(canvas.getByRole("button", { name: "Run a command" }))
    await userEvent.click(
      await body.findByRole("option", { name: /Clear the draft/ })
    )
    await expect(input).toHaveValue("")

    // Keyboard: Tab reaches the actions in order.
    await userEvent.click(input)
    for (const name of ["Attach files", "Add emoji", "Run a command"]) {
      await userEvent.tab()
      await expect(canvas.getByRole("button", { name })).toHaveFocus()
    }
  },
}

const FILES: ChatComposerAttachment[] = [
  { id: "a", name: "token-audit.pdf", size: 482_000 },
  { id: "b", name: "drift-report.csv", size: 38_000, status: "loading" },
  {
    id: "c",
    name: "button-states.fig",
    size: 1_830_000,
    status: "error",
    error: "Too large",
  },
]

export const WithAttachments: Story = {
  name: "With attachments",
  args: {
    defaultValue: "Both files from the review.",
    defaultAttachments: FILES,
  },
  render: Default.render,
}

export const SuggestedReplies: Story = {
  name: "Suggested replies",
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame>
        <ChatComposerHeader>
          {["Sounds good", "Can you share the file?", "Looking now"].map(
            (reply) => (
              <ChatComposerSuggestedReply key={reply}>
                {reply}
              </ChatComposerSuggestedReply>
            )
          )}
        </ChatComposerHeader>
        <ChatComposerInput placeholder="Reply to Ada" />
        <ChatComposerFooter>
          <ChatComposerCommonActions />
          <ChatComposerSubmit />
        </ChatComposerFooter>
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Message" })
    // A suggestion fills the draft and hands focus back, but never sends.
    await userEvent.click(canvas.getByRole("button", { name: "Sounds good" }))
    await waitFor(() => expect(input).toHaveFocus())
    await expect(input).toHaveValue("Sounds good")
    await expect(args.onSubmit).not.toHaveBeenCalled()
    await userEvent.keyboard(", shipping today")
    await expect(input).toHaveValue("Sounds good, shipping today")
  },
}

export const Emoji: Story = {
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame>
        <ChatComposerInput placeholder="Message #design" />
        <ChatComposerFooter>
          <ChatComposerEmojiButton />
          <ChatComposerSubmit />
        </ChatComposerFooter>
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Message" })
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.type(input, "Shipped ")

    // Pointer: pick one and it lands at the caret, with focus back in the box.
    await userEvent.click(canvas.getByRole("button", { name: "Add emoji" }))
    await userEvent.click(await body.findByRole("button", { name: "Rocket" }))
    await waitFor(() => expect(input).toHaveFocus())
    await expect(input).toHaveValue("Shipped \u{1F680}")
    // The grid stays mounted for its closing fade; wait it out before tabbing.
    await waitFor(() =>
      expect(body.queryByRole("button", { name: "Rocket" })).toBeNull()
    )

    // Keyboard: open it, move with the arrows, Enter picks.
    await userEvent.tab()
    await expect(
      canvas.getByRole("button", { name: "Add emoji" })
    ).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() =>
      expect(body.getByRole("button", { name: "Grinning" })).toHaveFocus()
    )
    await userEvent.keyboard("{ArrowDown}{ArrowRight}{Enter}")
    await waitFor(() => expect(input).toHaveFocus())
    await expect(input).toHaveValue("Shipped \u{1F680}\u{1F643}")
  },
}

/*
 * A stand-in recogniser that "hears" a sentence a word at a time, so the
 * story runs without a microphone or a permission prompt.
 */
function scriptedRecognition(sentence: string) {
  return (): ChatComposerSpeechRecognition => {
    let timer: ReturnType<typeof setInterval> | undefined
    const engine: ChatComposerSpeechRecognition = {
      lang: "",
      continuous: false,
      interimResults: false,
      onresult: null,
      onerror: null,
      onend: null,
      start: () => {
        const words = sentence.split(" ")
        let heard = 0
        timer = setInterval(() => {
          heard++
          engine.onresult?.({
            results: [[{ transcript: words.slice(0, heard).join(" ") }]],
          })
          if (heard === words.length) engine.stop()
        }, 180)
      },
      stop: () => {
        clearInterval(timer)
        engine.onend?.()
      },
      abort: () => clearInterval(timer),
    }
    return engine
  }
}

export const Dictation: Story = {
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame>
        <ChatComposerInput placeholder="Message #design" />
        <ChatComposerFooter>
          <ChatComposerDictationButton
            recognition={scriptedRecognition(
              "Ship the tokens first then the parts that use them"
            )}
          />
          <ChatComposerSubmit />
        </ChatComposerFooter>
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Message" })
    const mic = canvas.getByRole("button", { name: "Dictate" })
    await userEvent.click(mic)
    await expect(mic).toHaveAttribute("aria-pressed", "true")
    // Words land as they are heard; a second press stops listening.
    await waitFor(() =>
      expect((input as HTMLTextAreaElement).value).toMatch(/^Ship the tokens/)
    )
    await userEvent.click(mic)
    await expect(mic).toHaveAttribute("aria-pressed", "false")
    await waitFor(() => expect(input).toHaveFocus())
  },
}

/** A recogniser that fails the way Chrome does when the mic is blocked. */
function blockedRecognition(): ChatComposerSpeechRecognition {
  const engine: ChatComposerSpeechRecognition = {
    lang: "",
    continuous: false,
    interimResults: false,
    onresult: null,
    onerror: null,
    onend: null,
    start: () =>
      setTimeout(() => {
        engine.onerror?.({ error: "not-allowed" })
        engine.onend?.()
      }, 100),
    stop: () => engine.onend?.(),
    abort: () => {},
  }
  return engine
}

export const DictationBlocked: Story = {
  name: "Dictation blocked",
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame>
        <ChatComposerInput placeholder="Message #design" />
        <ChatComposerFooter>
          <ChatComposerDictationButton recognition={blockedRecognition} />
          <ChatComposerSubmit />
        </ChatComposerFooter>
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Dictate" }))
    // The tooltip says why, and a status region reads it out.
    await waitFor(() =>
      expect(canvas.getByRole("status")).toHaveTextContent(
        "Microphone is blocked. Allow it in site settings."
      )
    )
  },
}

export const Minimal: Story = {
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame className="flex-row items-end">
        <ChatComposerInput placeholder="Ask anything" />
        {/* The margin centers the button on one line of text: 48px tall with
            16px text, 44px from md, where the text drops to 14px. */}
        <ChatComposerSubmit className="m-2 shrink-0 md:my-1.5" />
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  ),
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Waiting for a connection" },
  render: Default.render,
}

function EditMessageDemo(args: Story["args"]) {
  const [editing, setEditing] = useState(true)
  // Focus only after someone asks to edit, never on load, where it would
  // scroll the docs page down to this example.
  const [reopened, setReopened] = useState(false)
  const [text, setText] = useState("The tokens land on Friday.")
  if (!editing)
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
        <span>{text}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditing(true)
            setReopened(true)
          }}
        >
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
      </div>
    )
  return (
    <LocalChatComposerProvider
      {...args}
      defaultValue={text}
      onSubmit={(message) => {
        args?.onSubmit?.(message)
        setText(message.value)
        setEditing(false)
      }}
    >
      <ChatComposerFrame>
        <ChatComposerHeader>
          <PencilIcon className="size-3.5" />
          Editing message
        </ChatComposerHeader>
        <ChatComposerInput
          aria-label="Edit message"
          autoFocus={reopened}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false)
          }}
        />
        <ChatComposerFooter className="justify-end gap-2">
          <span className="mr-auto pl-1 text-xs text-muted-foreground">
            <Kbd>Esc</Kbd> to cancel
          </span>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <ChatComposerSubmit>Save</ChatComposerSubmit>
        </ChatComposerFooter>
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  )
}

export const EditMessage: Story = {
  name: "Edit message",
  render: (args) => <EditMessageDemo {...args} />,
}

// The reply carries more than the composer's message, so it logs through its
// own spy rather than the typed onSubmit arg.
const sendReply = fn().mockName("sendReply")

function ThreadReplyDemo(args: Story["args"]) {
  const [alsoChannel, setAlsoChannel] = useState(false)
  return (
    <LocalChatComposerProvider
      {...args}
      onSubmit={(message) => sendReply({ ...message, alsoChannel })}
    >
      <ChatComposerFrame>
        <ChatComposerHeader>
          <CornerDownRightIcon className="size-3.5" />
          Replying to Ada Lovelace
        </ChatComposerHeader>
        <ChatComposerInput placeholder="Reply…" />
        <ChatComposerFooter>
          <ChatComposerCommonActions />
          <label className="ml-auto flex items-center gap-2 pr-2 text-xs text-muted-foreground">
            <Checkbox checked={alsoChannel} onCheckedChange={setAlsoChannel} />
            Also send to #design
          </label>
          <ChatComposerSubmit />
        </ChatComposerFooter>
      </ChatComposerFrame>
    </LocalChatComposerProvider>
  )
}

export const ThreadReply: Story = {
  name: "Thread reply",
  render: (args) => <ThreadReplyDemo {...args} />,
}

function ForwardDemo(args: Story["args"]) {
  return (
    // The forwarded message is the content, so an empty note can still send.
    <LocalChatComposerProvider {...args} canSubmit={() => true}>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
        <div className="text-sm font-semibold">Forward message</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">To</span>
          <Avatar size="sm">
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          Grace Hopper
        </div>
        <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
          The tokens land on Friday.
        </blockquote>
        <ChatComposerFrame>
          <ChatComposerInput placeholder="Add a note (optional)" />
        </ChatComposerFrame>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          {/* Outside the frame, still inside the provider. */}
          <ChatComposerSubmit>Forward</ChatComposerSubmit>
        </div>
      </div>
    </LocalChatComposerProvider>
  )
}

export const SubmitOutsideTheFrame: Story = {
  name: "Submit outside the frame",
  render: (args) => <ForwardDemo {...args} />,
}

/*
 * A stand-in for a store that syncs the draft across devices. Anything with
 * a subscribe and a snapshot works the same way.
 */
function createDraftStore() {
  let state: ChatComposerState = { value: "", attachments: [] }
  const listeners = new Set<() => void>()
  const set = (next: Partial<ChatComposerState>) => {
    state = { ...state, ...next }
    listeners.forEach((listener) => listener())
  }
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    get: () => state,
    set,
  }
}

function SyncedComposerProvider({
  store,
  onSubmit,
  children,
}: {
  store: ReturnType<typeof createDraftStore>
  onSubmit?: (message: ChatComposerMessage) => void
  children: React.ReactNode
}) {
  const state = useSyncExternalStore(store.subscribe, store.get)
  const actions = useMemo<ChatComposerActions>(
    () => ({
      setValue: (value) => store.set({ value }),
      addAttachments: (files) =>
        store.set({
          attachments: [
            ...store.get().attachments,
            ...files.map((file) => ({
              id: crypto.randomUUID(),
              name: file.name,
              size: file.size,
            })),
          ],
        }),
      removeAttachment: (id) =>
        store.set({
          attachments: store.get().attachments.filter((a) => a.id !== id),
        }),
      submit: () => {
        const { value, attachments } = store.get()
        if (!value.trim() && !attachments.length) return
        onSubmit?.({ value: value.trim(), attachments })
        store.set({ value: "", attachments: [] })
      },
    }),
    [store, onSubmit]
  )
  return (
    <ChatComposerProvider state={state} actions={actions}>
      {children}
    </ChatComposerProvider>
  )
}

function SyncedDemo(args: Story["args"]) {
  const [store] = useState(createDraftStore)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {["Laptop", "Phone"].map((device) => (
        <div key={device} className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {device}
          </span>
          <SyncedComposerProvider store={store} onSubmit={args?.onSubmit}>
            <ChatComposerFrame>
              <ChatComposerHeader className="empty:hidden">
                <ChatComposerAttachments />
              </ChatComposerHeader>
              <ChatComposerInput
                aria-label={`Message from ${device.toLowerCase()}`}
                placeholder="Type on either one"
              />
              <ChatComposerFooter>
                <ChatComposerCommonActions />
                <ChatComposerSubmit />
              </ChatComposerFooter>
            </ChatComposerFrame>
          </SyncedComposerProvider>
        </div>
      ))}
    </div>
  )
}

export const SyncedDraft: Story = {
  name: "Synced draft",
  render: (args) => <SyncedDemo {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Message from laptop" }),
      "Same draft"
    )
    await expect(
      canvas.getByRole("textbox", { name: "Message from phone" })
    ).toHaveValue("Same draft")
  },
}

type Message = { id: number; author: string; text: string; files: string[] }

function ChatDemo(args: Story["args"]) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "Ada Lovelace",
      text: "Is the composer ready to try?",
      files: [],
    },
  ])
  return (
    <LocalChatComposerProvider
      {...args}
      // A pretend upload, so attachments show their loading status.
      upload={() => new Promise((resolve) => setTimeout(resolve, 900))}
      onSubmit={async (message) => {
        args?.onSubmit?.(message)
        // A pretend round trip, so the send button shows its busy state.
        await new Promise((resolve) => setTimeout(resolve, 600))
        setMessages((current) => [
          ...current,
          {
            id: current.length + 1,
            author: "You",
            text: message.value,
            files: message.attachments.map((file) => file.name),
          },
        ])
      }}
    >
      {/* The whole panel takes drops, not just the composer. */}
      <ChatComposerDropZone
        description="Any file, dropped anywhere on the conversation"
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
      >
        <ol aria-label="Messages" className="flex flex-col gap-3">
          {messages.map((message) => (
            <li key={message.id} className="flex items-start gap-2.5">
              <Avatar size="sm">
                <AvatarFallback>
                  {message.author
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm">
                <span className="font-medium">{message.author}</span>
                <span className="whitespace-pre-wrap text-muted-foreground">
                  {message.text}
                </span>
                {message.files.map((name, index) => (
                  <span key={index} className="text-xs text-muted-foreground">
                    {name}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <ChatComposerFrame>
          <ChatComposerHeader className="empty:hidden">
            <ChatComposerAttachments />
          </ChatComposerHeader>
          <ChatComposerInput placeholder="Reply to Ada" />
          <ChatComposerFooter>
            <ChatComposerCommonActions />
            <ChatComposerSubmit />
          </ChatComposerFooter>
        </ChatComposerFrame>
      </ChatComposerDropZone>
    </LocalChatComposerProvider>
  )
}

export const InAChat: Story = {
  name: "In a chat",
  render: (args) => <ChatDemo {...args} />,
}
