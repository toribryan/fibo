import type * as React from "react"
import { describe, expect, it } from "vitest"
import { render } from "vitest-browser-react"

import { StatusDot } from "./status-dot.js"
import {
  StickerAvatar,
  StickerAvatarCount,
  stickerEdge,
  stickerTilt,
} from "./sticker-avatar.js"
import { ghostSrc, photoSrc } from "./sticker-avatar.fixtures.js"

describe("stickerEdge", () => {
  it("is a sixteenth of the size, never under 2px", () => {
    expect(stickerEdge(16)).toBe(2)
    expect(stickerEdge(32)).toBe(2)
    expect(stickerEdge(64)).toBe(4)
    expect(stickerEdge(128)).toBe(8)
  })
})

describe("stickerTilt", () => {
  it("is stable for a name and stays within seven degrees", () => {
    expect(stickerTilt("Ana")).toBe(stickerTilt("Ana"))
    for (const name of ["Ana", "Kofi", "Mei", "Sam", "Priya", "fibo"]) {
      expect(Math.abs(stickerTilt(name))).toBeLessThanOrEqual(6.6 + 1e-9)
    }
  })
})

describe("StickerAvatar", () => {
  it("follows the shape of a transparent cut-out", async () => {
    const screen = await render(<StickerAvatar name="Ghost" src={ghostSrc()} />)
    await expect
      .element(screen.getByRole("img", { name: "Ghost" }))
      .toHaveAttribute("data-shape", "cutout")
  })

  it("rounds a photo that still has its background", async () => {
    const screen = await render(<StickerAvatar name="Ana" src={photoSrc()} />)
    await expect
      .element(screen.getByRole("img", { name: "Ana" }))
      .toHaveAttribute("data-shape", "round")
  })

  it("can be forced round", async () => {
    const screen = await render(
      <StickerAvatar name="Ghost" src={ghostSrc()} cutout="round" />
    )
    await expect
      .element(screen.getByRole("img", { name: "Ghost" }))
      .toHaveAttribute("data-shape", "round")
  })

  it("falls back to die-cut initials without an image or when it fails", async () => {
    const screen = await render(
      <>
        <StickerAvatar name="Tori Bryan" />
        <StickerAvatar name="Kofi Mensah" src="data:image/png;base64,broken" />
      </>
    )
    const tori = screen.getByRole("img", { name: "Tori Bryan" })
    await expect.element(tori).toHaveAttribute("data-shape", "initials")
    expect(tori.element().textContent).toBe("TB")
    await expect
      .element(screen.getByRole("img", { name: "Kofi Mensah" }))
      .toHaveAttribute("data-shape", "initials")
  })

  it("joins a StatusDot's label to its name", async () => {
    const screen = await render(
      <>
        <StickerAvatar name="Ana">
          <StatusDot status="away" />
        </StickerAvatar>
        <StickerAvatar name="Mei">
          <StatusDot status="present" label="Here" />
        </StickerAvatar>
        <StickerAvatar name="Kofi">
          <StatusDot status="offline" label={null} />
        </StickerAvatar>
      </>
    )
    await expect
      .element(screen.getByRole("img", { name: "Ana, Away" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("img", { name: "Mei, Here" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("img", { name: "Kofi" }))
      .toBeInTheDocument()
  })

  it("still names the status from the deprecated props", async () => {
    const screen = await render(
      <>
        <StickerAvatar name="Ana" status="away" />
        <StickerAvatar name="Mei" status="present" statusLabel="Here" />
      </>
    )
    await expect
      .element(screen.getByRole("img", { name: "Ana, Away" }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole("img", { name: "Mei, Here" }))
      .toBeInTheDocument()
  })

  it("keeps its layout box at its size whatever the edge", async () => {
    const screen = await render(
      <StickerAvatar
        name="Ghost"
        src={ghostSrc()}
        size={48}
        edge={10}
        tilt={false}
      />
    )
    const sticker = screen.getByRole("img", { name: "Ghost" })
    await expect.element(sticker).toHaveAttribute("data-shape", "cutout")
    const box = sticker.element().getBoundingClientRect()
    expect(box.width).toBe(48)
    expect(box.height).toBe(48)
    const art = sticker.element().querySelector("img")!
    expect(art.getBoundingClientRect().width).toBe(68)
  })

  it("bakes again when the edge color changes", async () => {
    const edged = (color: string) => (
      <StickerAvatar
        name="Ghost"
        src={ghostSrc()}
        style={{ "--sticker-edge": color } as React.CSSProperties}
      />
    )
    const screen = await render(edged("rgb(255, 0, 0)"))
    const sticker = screen.getByRole("img", { name: "Ghost" })
    await expect.element(sticker).toHaveAttribute("data-shape", "cutout")
    const art = () => sticker.element().querySelector("img")?.src
    const red = art()
    await screen.rerender(edged("rgb(0, 0, 255)"))
    await expect.poll(art).not.toBe(red)
  })

  it("counts the rest of a group", async () => {
    const screen = await render(<StickerAvatarCount count={3} />)
    await expect.element(screen.getByText("+3")).toBeInTheDocument()
  })
})
