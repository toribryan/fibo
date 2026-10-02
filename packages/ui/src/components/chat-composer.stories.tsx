import type { Meta, StoryObj } from "@storybook/react-vite"
import { CornerDownRightIcon, PencilIcon } from "lucide-react"
import { useMemo, useState, useSyncExternalStore } from "react"
import { expect, fn, waitFor } from "storybook/test"

import { Avatar, AvatarFallback } from "./avatar.js"
import { Button } from "./button.js"
import {
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
  LocalChatComposerProvider,
  type ChatComposerActions,
  type ChatComposerAttachment,
  type ChatComposerMessage,
  type ChatComposerState,
} from "./chat-composer.js"
import { Checkbox } from "./checkbox.js"
import { Kbd } from "./kbd.js"

const meta: Meta<typeof LocalChatComposerProvider> = {
  title: "Base components/Forms/Chat composer",
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
    ChatComposerAttachments,
    ChatComposerSubmit,
    ChatComposerDropZone,
  },
  tags: ["new"],
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

export const Default: Story = {
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerDropZone>
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
      </ChatComposerDropZone>
    </LocalChatComposerProvider>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Message" })
    const send = canvas.getByRole("button", { name: "Send" })
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

    // Pointer: the mention button types @ at the caret and hands focus back.
    await userEvent.click(
      canvas.getByRole("button", { name: "Mention someone" })
    )
    await waitFor(() => expect(input).toHaveFocus())
    await userEvent.keyboard("ada ship it")
    await expect(input).toHaveValue("@ada ship it")
    await userEvent.click(send)
    await expect(args.onSubmit).toHaveBeenLastCalledWith({
      value: "@ada ship it",
      attachments: [],
    })

    // Sending with the button hands focus back to the text box.
    await waitFor(() => expect(input).toHaveFocus())

    // Keyboard: Tab reaches the actions in order, and Enter runs one.
    await userEvent.tab()
    await expect(
      canvas.getByRole("button", { name: "Attach files" })
    ).toHaveFocus()
    await userEvent.tab()
    await expect(
      canvas.getByRole("button", { name: "Mention someone" })
    ).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await waitFor(() => expect(input).toHaveFocus())
    await expect(input).toHaveValue("@")
    await userEvent.clear(input)
  },
}

const FILES: ChatComposerAttachment[] = [
  { id: "a", name: "token-audit.pdf", size: 482_000 },
  { id: "b", name: "button-states.png", size: 1_830_000 },
]

export const WithAttachments: Story = {
  name: "With attachments",
  args: {
    defaultValue: "Both files from the review.",
    defaultAttachments: FILES,
  },
  render: Default.render,
}

export const Minimal: Story = {
  render: (args) => (
    <LocalChatComposerProvider {...args}>
      <ChatComposerFrame className="flex-row items-end">
        <ChatComposerInput placeholder="Ask anything" />
        <ChatComposerSubmit className="m-2 shrink-0" />
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
      <ChatComposerDropZone>
        <ChatComposerFrame>
          <ChatComposerHeader>
            <CornerDownRightIcon className="size-3.5" />
            Replying to Ada Lovelace
          </ChatComposerHeader>
          <ChatComposerInput placeholder="Reply…" />
          <ChatComposerFooter>
            <ChatComposerCommonActions />
            <label className="ml-auto flex items-center gap-2 pr-2 text-xs text-muted-foreground">
              <Checkbox
                checked={alsoChannel}
                onCheckedChange={setAlsoChannel}
              />
              Also send to #design
            </label>
            <ChatComposerSubmit />
          </ChatComposerFooter>
        </ChatComposerFrame>
      </ChatComposerDropZone>
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
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
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
      <LocalChatComposerProvider
        {...args}
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
        <ChatComposerDropZone>
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
    </div>
  )
}

export const InAChat: Story = {
  name: "In a chat",
  render: (args) => <ChatDemo {...args} />,
}
