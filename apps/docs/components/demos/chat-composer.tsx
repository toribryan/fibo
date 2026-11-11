"use client"

import { CodeIcon, EraserIcon, MehIcon } from "lucide-react"

import {
  ChatComposerAttachments,
  ChatComposerCommandMenu,
  ChatComposerCommonActions,
  ChatComposerFooter,
  ChatComposerFrame,
  ChatComposerHeader,
  ChatComposerInput,
  ChatComposerSubmit,
  LocalChatComposerProvider,
  useChatComposer,
} from "@workspace/ui/components/chat-composer"

// Slash commands act on the draft, so they read it through the provider.
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
              onSelect: () => append("¯\\_(ツ)_/¯"),
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

export function ChatComposerDemo() {
  return (
    <LocalChatComposerProvider>
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
  )
}
