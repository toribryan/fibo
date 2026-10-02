import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { expect, fn, waitFor } from "storybook/test"

import { VoiceMemo } from "./voice-memo.js"

const script =
  "Quick note for the design review. The token drift check passes in both themes, so the only open item is the empty state copy. Ask Ana whether we keep the illustration."

const meta: Meta<typeof VoiceMemo> = {
  title: "Special components/Voice memo",
  component: VoiceMemo,
  tags: ["new"],
  parameters: {
    layout: "centered",
    controls: {
      exclude: [
        "recording",
        "onRecordingChange",
        "transcript",
        "interim",
        "onTranscriptChange",
        "onComplete",
      ],
    },
  },
  argTypes: {
    side: { control: "inline-radio", options: ["right", "bottom"] },
    size: { control: "inline-radio", options: ["sm", "default"] },
    wordmark: { control: "text" },
    lang: { control: "text" },
    simulate: { control: "text" },
    defaultRecording: { control: "boolean" },
    recording: { control: false },
    onRecordingChange: { control: false },
    transcript: { control: false },
    interim: { control: false },
    onTranscriptChange: { control: false },
    onComplete: { control: false },
  },
  args: {
    side: "right",
    size: "default",
    wordmark: "fibo",
    lang: "en-US",
    simulate: script,
    defaultRecording: false,
    onRecordingChange: fn(),
    onTranscriptChange: fn(),
    onComplete: fn(),
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-64 w-[36rem] items-start">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof VoiceMemo>

export const Default: Story = {
  play: async ({ canvas, args, step, userEvent }) => {
    const device = canvas.getByRole("button", { name: "Transcribe" })

    await step("Pointer", async () => {
      await expect(canvas.queryByRole("region")).toBeNull()
      await userEvent.click(device)
      await expect(device).toHaveAttribute("aria-pressed", "true")
      await expect(args.onRecordingChange).toHaveBeenLastCalledWith(true)
      const transcript = canvas.getByRole("region", { name: "Transcript" })
      await waitFor(() => expect(transcript).toHaveTextContent(/Quick note/))
    })

    await step("Keyboard", async () => {
      await expect(device).toHaveFocus()
      await userEvent.keyboard(" ")
      await expect(device).toHaveAttribute("aria-pressed", "false")
      await expect(args.onComplete).toHaveBeenCalledWith(
        expect.stringMatching(/^Quick note/)
      )
      await expect(canvas.getByRole("status")).toHaveTextContent(
        /^Transcript ready/
      )
      // The finished transcript stays until it's closed.
      await userEvent.tab()
      await expect(
        canvas.getByRole("button", { name: "Copy transcript" })
      ).toHaveFocus()
      await userEvent.click(
        canvas.getByRole("button", { name: "Close transcript" })
      )
      await expect(canvas.queryByRole("region")).toBeNull()
    })
  },
}

export const Listening: Story = {
  args: { defaultRecording: true },
}

export const Below: Story = {
  args: { side: "bottom", defaultRecording: true },
}

export const Small: Story = {
  args: { size: "sm", defaultRecording: true },
}

export const Wordmark: Story = {
  render: (args) => (
    <div className="flex gap-4">
      <VoiceMemo {...args} wordmark="Notes" />
      <VoiceMemo {...args} wordmark="ana" />
    </div>
  ),
}

/*
 * Text from your own service, such as a speech-to-text API streaming over a
 * socket. Passing `transcript` turns the browser's recogniser off.
 */
function OwnServiceDemo() {
  const [recording, setRecording] = useState(false)
  const [words, setWords] = useState(0)
  const all = script.split(" ")

  return (
    <div className="flex flex-col items-start gap-3">
      <VoiceMemo
        recording={recording}
        onRecordingChange={(next) => {
          setRecording(next)
          if (next) setWords(0)
        }}
        transcript={all.slice(0, Math.max(0, words - 2)).join(" ")}
        interim={all.slice(Math.max(0, words - 2), words).join(" ")}
      />
      <input
        type="range"
        aria-label="Words heard"
        min={0}
        max={all.length}
        value={words}
        disabled={!recording}
        onChange={(event) => setWords(Number(event.target.value))}
        className="w-56"
      />
    </div>
  )
}

export const OwnService: Story = {
  name: "Your own service",
  render: () => <OwnServiceDemo />,
}

export const Microphone: Story = {
  name: "With the microphone",
  args: { simulate: undefined },
}

function NotesDemo() {
  const [notes, setNotes] = useState<string[]>([])
  return (
    <div className="flex flex-col items-start gap-4">
      <VoiceMemo
        side="bottom"
        size="sm"
        simulate={script}
        onComplete={(text) => {
          if (text) setNotes((list) => [text, ...list])
        }}
      />
      <ol aria-label="Saved notes" className="flex w-72 flex-col gap-2 pt-40">
        {notes.map((note, index) => (
          <li
            key={notes.length - index}
            className="rounded-lg border border-border p-3 text-sm"
          >
            {note}
          </li>
        ))}
      </ol>
    </div>
  )
}

export const SavingNotes: Story = {
  name: "Saving notes",
  render: () => <NotesDemo />,
}
