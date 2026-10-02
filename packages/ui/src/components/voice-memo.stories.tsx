import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useRef, useState } from "react"
import { expect, fn, waitFor } from "storybook/test"

import { Button } from "./button.js"
import { VoiceMemo, formatElapsed, type VoiceMemoResult } from "./voice-memo.js"

const meta: Meta<typeof VoiceMemo> = {
  title: "Special components/Voice memo",
  component: VoiceMemo,
  tags: ["new"],
  parameters: {
    layout: "centered",
    controls: {
      exclude: [
        "state",
        "onStateChange",
        "onStop",
        "onMark",
        "stream",
        "level",
      ],
    },
  },
  argTypes: {
    title: { control: "text" },
    defaultState: {
      control: "inline-radio",
      options: ["idle", "recording", "paused"],
    },
    size: { control: "inline-radio", options: ["sm", "default"] },
    connection: {
      control: "inline-radio",
      options: ["connected", "connecting", "disconnected"],
    },
    battery: { control: { type: "range", min: 0, max: 100, step: 1 } },
    simulate: { control: "boolean" },
    device: { control: "boolean" },
    wordmark: { control: "text" },
    state: { control: false },
    onStateChange: { control: false },
    onStop: { control: false },
    onMark: { control: false },
    stream: { control: false },
    level: { control: false },
  },
  args: {
    title: "New memory",
    defaultState: "idle",
    size: "default",
    connection: "connected",
    battery: 75,
    simulate: true,
    device: true,
    wordmark: "fibo",
    onStateChange: fn(),
    onStop: fn(),
    onMark: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof VoiceMemo>

export const Default: Story = {
  play: async ({ canvas, args, step, userEvent }) => {
    await step("Pointer", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Start recording" })
      )
      await expect(args.onStateChange).toHaveBeenLastCalledWith("recording")
      await expect(canvas.getByRole("status")).toHaveTextContent("Recording")

      await userEvent.click(
        canvas.getByRole("button", { name: "Mark this moment" })
      )
      await expect(args.onMark).toHaveBeenCalledTimes(1)

      await userEvent.click(
        canvas.getByRole("button", { name: "Pause recording" })
      )
      await expect(args.onStateChange).toHaveBeenLastCalledWith("paused")
      await expect(
        canvas.getByRole("button", { name: "Resume recording" })
      ).toHaveFocus()
    })

    await step("Keyboard", async () => {
      await userEvent.keyboard(" ")
      await expect(args.onStateChange).toHaveBeenLastCalledWith("recording")
      await userEvent.tab()
      await expect(
        canvas.getByRole("button", { name: "Stop and save" })
      ).toHaveFocus()
      await userEvent.keyboard("{Enter}")
      await expect(args.onStateChange).toHaveBeenLastCalledWith("idle")
      await expect(args.onStop).toHaveBeenCalledWith(
        expect.objectContaining({ marks: [expect.any(Number)] })
      )
      await waitFor(() =>
        expect(canvas.getByRole("status")).toHaveTextContent(/^Saved/)
      )
      await expect(
        canvas.getByRole("button", { name: "Mark this moment" })
      ).toBeDisabled()
    })
  },
}

export const Recording: Story = {
  args: { defaultState: "recording" },
}

export const Paused: Story = {
  args: { defaultState: "paused" },
}

export const Small: Story = {
  args: { size: "sm", defaultState: "recording", title: "Standup notes" },
}

export const WithoutDevice: Story = {
  name: "Without the device",
  args: { device: false, connection: undefined, battery: undefined },
}

export const Connection: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <VoiceMemo {...args} connection="connecting" battery={undefined} />
      <VoiceMemo
        {...args}
        connection="disconnected"
        battery={12}
        title="Last memory"
      />
    </div>
  ),
}

/*
 * The real thing: asks for the microphone, records with MediaRecorder, and
 * hands the stream to the waveform. The clip plays back once saved.
 */
function MicrophoneDemo() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState("")
  const [clip, setClip] = useState<{ url: string; memo: VoiceMemoResult }>()
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream])

  const begin = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      const next = new MediaRecorder(media)
      next.ondataavailable = (event) => chunks.current.push(event.data)
      next.start()
      recorder.current = next
      setStream(media)
      setError("")
    } catch {
      setError("The microphone isn't available here.")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <VoiceMemo
        stream={stream}
        simulate={false}
        connection={stream ? "connected" : "disconnected"}
        onStateChange={(state) => {
          if (state === "recording" && !recorder.current) void begin()
          if (state === "paused") recorder.current?.pause()
          if (state === "recording") recorder.current?.resume()
        }}
        onStop={(memo) => {
          const active = recorder.current
          if (!active) return
          active.onstop = () => {
            const blob = new Blob(chunks.current, { type: active.mimeType })
            setClip({ url: URL.createObjectURL(blob), memo })
            setStream(null)
          }
          active.stop()
          recorder.current = null
        }}
      />
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      {clip ? (
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <audio controls src={clip.url} aria-label="Your memo" />
          <span>
            {formatElapsed(clip.memo.duration)}, {clip.memo.marks.length}{" "}
            {clip.memo.marks.length === 1 ? "mark" : "marks"}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export const WithMicrophone: Story = {
  name: "With a microphone",
  render: () => <MicrophoneDemo />,
}

function Library() {
  const [memos, setMemos] = useState<VoiceMemoResult[]>([])
  return (
    <div className="flex flex-col gap-4">
      <VoiceMemo
        title={`Memory ${memos.length + 1}`}
        size="sm"
        connection="connected"
        battery={75}
        onStop={(memo) => setMemos((list) => [memo, ...list])}
      />
      <ul aria-label="Saved memos" className="flex flex-col gap-1 text-sm">
        {memos.length === 0 ? (
          <li className="text-muted-foreground">Nothing saved yet.</li>
        ) : null}
        {memos.map((memo, index) => (
          <li
            key={memos.length - index}
            className="flex justify-between rounded-lg border border-border px-3 py-2"
          >
            <span>Memory {memos.length - index}</span>
            <span className="font-mono text-muted-foreground tabular-nums">
              {formatElapsed(memo.duration)}
            </span>
          </li>
        ))}
      </ul>
      {memos.length ? (
        <Button size="sm" variant="outline" onClick={() => setMemos([])}>
          Clear
        </Button>
      ) : null}
    </div>
  )
}

export const SavingMemos: Story = {
  name: "Saving memos",
  render: () => <Library />,
}

// Dark, edge to edge on a phone, the way the clip-on device's app shows it.
export const OnAPhone: Story = {
  name: "On a phone",
  render: (args) => (
    <div className="dark">
      <div className="flex h-[36rem] w-72 flex-col justify-end rounded-[2.5rem] border-8 border-border bg-background p-2 text-foreground">
        <VoiceMemo
          {...args}
          defaultState="recording"
          className="flex-1 justify-between rounded-[1.75rem] border-0"
        />
      </div>
    </div>
  ),
}
