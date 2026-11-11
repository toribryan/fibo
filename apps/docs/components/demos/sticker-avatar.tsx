"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  StatusDot,
  type StatusDotStatus,
} from "@workspace/ui/components/status-dot"
import {
  StickerAvatar,
  StickerAvatarCount,
  StickerAvatarGroup,
} from "@workspace/ui/components/sticker-avatar"

// fibo, the pixel rabbit, mirrored to face into the page. 1 is line, 2 is fill.
// An SVG data URL rather than a fetched image, so it renders the same on the
// server and needs no network.
const RABBIT = [
  "01110001110000000000",
  "12221012221000000000",
  "12121012121000000000",
  "12121012121000000000",
  "01221012121000000000",
  "01221112210000000000",
  "00122222221000000000",
  "01222222222100000000",
  "12222222222100000000",
  "12122221222100000000",
  "12122221222111100000",
  "12221122221222210000",
  "01122222112222221000",
  "00122222222212222100",
  "00122222222122222111",
  "00122212221222222121",
  "00122212212222222121",
  "00122212212222222110",
  "01122112112222221000",
  "01111111111111111000",
]

function pixels(cell: string) {
  return RABBIT.flatMap((row, y) =>
    [...row].flatMap((value, x) =>
      value === cell ? [`M${19 - x} ${y}h1v1h-1z`] : []
    )
  ).join("")
}

const rabbit = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" shape-rendering="crispEdges"><path fill="#171717" d="${pixels("1")}"/><path fill="#f5f5f5" d="${pixels("2")}"/></svg>`
)}`

const STATUS_NAMES: Record<StatusDotStatus, string> = {
  present: "Present",
  away: "Away",
  offline: "Offline",
}

export function StickerAvatarPreview() {
  return (
    <StickerAvatar name="fibo" src={rabbit} pixelated size={96}>
      <StatusDot status="present" />
    </StickerAvatar>
  )
}

export function StickerAvatarStatusesDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      {(["present", "away", "offline"] as const).map((status) => (
        <div key={status} className="flex flex-col items-center gap-4">
          <StickerAvatar name="fibo" src={rabbit} pixelated size={64}>
            <StatusDot status={status} />
          </StickerAvatar>
          {/* The sticker already says its status to screen readers. */}
          <Badge variant="outline" aria-hidden="true">
            {STATUS_NAMES[status]}
          </Badge>
        </div>
      ))}
    </div>
  )
}

const PEOPLE = [
  { name: "fibo", src: rabbit, status: "present" },
  { name: "Ana Ruiz", status: "away" },
  { name: "Kofi Mensah", status: "offline" },
  { name: "Tori Bryan", status: "present" },
] as const

export function StickerAvatarListDemo() {
  return (
    <nav
      aria-label="Direct messages"
      className="flex w-72 flex-col gap-0.5 rounded-xl border border-border bg-card p-2"
    >
      {PEOPLE.map((person) => (
        <button
          key={person.name}
          type="button"
          className="group/sticker flex items-center gap-3.5 rounded-md px-2.5 py-2 text-left text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
        >
          <StickerAvatar
            aria-hidden="true"
            name={person.name}
            src={"src" in person ? person.src : undefined}
            pixelated={"src" in person}
            size={32}
          >
            <StatusDot status={person.status} />
          </StickerAvatar>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{person.name}</span>
            <span className="text-xs">{STATUS_NAMES[person.status]}</span>
          </span>
        </button>
      ))}
    </nav>
  )
}

export function StickerAvatarGroupDemo() {
  return (
    <StickerAvatarGroup aria-label="In this party: fibo, Ana Ruiz, Kofi Mensah and 3 others">
      <StickerAvatar
        aria-hidden="true"
        name="fibo"
        src={rabbit}
        pixelated
        size={56}
      />
      <StickerAvatar aria-hidden="true" name="Ana Ruiz" size={56} />
      <StickerAvatar aria-hidden="true" name="Kofi Mensah" size={56} />
      <StickerAvatarCount aria-hidden="true" count={3} size={56} />
    </StickerAvatarGroup>
  )
}

export function StickerAvatarEdgeDo() {
  return <StickerAvatar name="fibo" src={rabbit} pixelated size={64} />
}

export function StickerAvatarEdgeDont() {
  return (
    <StickerAvatar name="fibo" src={rabbit} pixelated size={64} edge={12} />
  )
}
