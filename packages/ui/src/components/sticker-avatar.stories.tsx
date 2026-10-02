import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"
import { expect, waitFor } from "storybook/test"

import { Badge } from "./badge.js"
import {
  StickerAvatar,
  StickerAvatarCount,
  StickerAvatarGroup,
  type StickerAvatarStatus,
} from "./sticker-avatar.js"
import { ghostSrc, photoSrc, rabbitSrc } from "./sticker-avatar.fixtures.js"

const SUBJECTS = ["rabbit", "ghost", "photo", "initials"] as const
const SRC: Record<(typeof SUBJECTS)[number], (() => string) | undefined> = {
  rabbit: rabbitSrc,
  ghost: ghostSrc,
  photo: photoSrc,
  initials: undefined,
}

type Args = ComponentProps<typeof StickerAvatar> & {
  subject: (typeof SUBJECTS)[number]
}

const meta: Meta<Args> = {
  title: "Special components/Sticker avatar",
  component: StickerAvatar,
  tags: ["new"],
  parameters: {
    layout: "centered",
    controls: { exclude: ["src"] },
  },
  argTypes: {
    subject: {
      control: "inline-radio",
      options: SUBJECTS,
      description: "Story only: which sample image to cut.",
      table: { category: "Story" },
    },
    size: { control: { type: "range", min: 24, max: 160, step: 8 } },
    edge: { control: { type: "range", min: 0, max: 12, step: 1 } },
    status: {
      control: "inline-radio",
      options: [undefined, "online", "idle", "dnd", "offline"],
    },
    cutout: { control: "inline-radio", options: ["auto", "shape", "round"] },
    tilt: { control: "boolean" },
    lift: { control: "boolean" },
    pixelated: { control: "boolean" },
    name: { control: "text" },
    src: { control: false },
  },
  args: {
    subject: "rabbit",
    name: "fibo",
    size: 96,
    status: "online",
    cutout: "auto",
    tilt: true,
    lift: true,
    pixelated: true,
  },
  render: ({ subject, ...args }) => (
    <StickerAvatar {...args} src={SRC[subject]?.()} />
  ),
}

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  play: async ({ canvas }) => {
    const sticker = canvas.getByRole("img", { name: "fibo, Online" })
    await waitFor(() => expect(sticker).toHaveAttribute("data-shape", "cutout"))
    await expect(
      sticker.querySelector('[data-slot="sticker-avatar-status"]')
    ).toHaveAttribute("data-status", "online")
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {[24, 32, 40, 64, 96].map((size) => (
        <div key={size} className="flex flex-col items-center gap-3">
          <StickerAvatar
            name={`fibo at ${size}`}
            src={rabbitSrc()}
            pixelated
            size={size}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {size}
          </span>
        </div>
      ))}
    </div>
  ),
}

const STATUSES: StickerAvatarStatus[] = ["online", "idle", "dnd", "offline"]

const STATUS_NAMES: Record<StickerAvatarStatus, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
}

export const Statuses: Story = {
  name: "Status by shape",
  render: () => (
    <div className="flex flex-wrap justify-center gap-8">
      {STATUSES.map((status) => (
        <div key={status} className="flex flex-col items-center gap-4">
          <StickerAvatar
            name="Ghost"
            src={ghostSrc()}
            size={64}
            status={status}
          />
          {/* The sticker already says its status to screen readers. */}
          <Badge variant="outline" aria-hidden="true">
            {STATUS_NAMES[status]}
          </Badge>
        </div>
      ))}
    </div>
  ),
}

export const Shapes: Story = {
  name: "Cut-out, round and initials",
  render: () => (
    <div className="flex items-center gap-8">
      <StickerAvatar name="Ghost" src={ghostSrc()} size={72} />
      <StickerAvatar name="Ana Ruiz" src={photoSrc()} size={72} />
      <StickerAvatar name="Tori Bryan" size={72} />
    </div>
  ),
}

const PEOPLE = [
  { name: "boo.exe", src: ghostSrc, status: "offline" },
  { name: "fibo", src: rabbitSrc, status: "online", pixelated: true },
  { name: "Ana Ruiz", src: photoSrc, status: "idle" },
  { name: "Kofi Mensah", status: "dnd" },
] as const

export const DirectMessages: Story = {
  name: "In a direct message list",
  render: () => (
    <nav
      aria-label="Direct messages"
      className="flex w-72 flex-col gap-0.5 rounded-xl border border-border bg-card p-2"
    >
      {PEOPLE.map((person) => (
        // group/sticker lifts the sticker when the whole row is hovered.
        <button
          key={person.name}
          type="button"
          className="group/sticker flex items-center gap-3.5 rounded-md px-2.5 py-2 text-left text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
        >
          <StickerAvatar
            aria-hidden="true"
            name={person.name}
            src={"src" in person ? person.src() : undefined}
            pixelated={"pixelated" in person}
            size={32}
            status={person.status}
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{person.name}</span>
            <span className="text-xs">{STATUS_NAMES[person.status]}</span>
          </span>
        </button>
      ))}
    </nav>
  ),
}

export const Group: Story = {
  name: "Stack",
  render: () => (
    <StickerAvatarGroup aria-label="In this party: fibo, boo.exe, Ana Ruiz, Kofi Mensah and 3 others">
      <StickerAvatar
        aria-hidden="true"
        name="fibo"
        src={rabbitSrc()}
        pixelated
        size={56}
      />
      <StickerAvatar
        aria-hidden="true"
        name="boo.exe"
        src={ghostSrc()}
        size={56}
      />
      <StickerAvatar
        aria-hidden="true"
        name="Ana Ruiz"
        src={photoSrc()}
        size={56}
      />
      <StickerAvatar aria-hidden="true" name="Kofi Mensah" size={56} />
      <StickerAvatarCount aria-hidden="true" count={3} size={56} />
    </StickerAvatarGroup>
  ),
}

export const Straight: Story = {
  name: "Without tilt or lift",
  args: { tilt: false, lift: false },
}
