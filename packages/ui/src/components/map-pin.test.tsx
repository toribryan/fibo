import { describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import { MapPin } from "./map-pin.js"

describe("MapPin", () => {
  it("names a label pin by its text, or by label when it shows other text", async () => {
    const screen = await render(
      <>
        <MapPin type="label" label="Sunflower Park" />
        <MapPin type="label" label="Blue Bottle Coffee" text="$6" />
      </>
    )
    await expect
      .element(screen.getByRole("button", { name: "Sunflower Park" }))
      .toHaveTextContent("Sunflower Park")
    await expect
      .element(screen.getByRole("button", { name: "Blue Bottle Coffee" }))
      .toHaveTextContent("$6")
  })

  it("falls back to a map pin for an icon pin with no icon", async () => {
    const screen = await render(
      <>
        <MapPin type="icon" label="Somewhere" />
        <MapPin
          type="icon"
          label="Blue Bottle Coffee"
          icon={<svg data-testid="coffee" />}
        />
      </>
    )
    const fallback = screen.getByRole("button", { name: "Somewhere" })
    expect(
      fallback.element().querySelector("svg.lucide-map-pin")
    ).not.toBeNull()
    await expect
      .element(screen.getByRole("button", { name: "Blue Bottle Coffee" }))
      .toContainElement(screen.getByTestId("coffee").element() as HTMLElement)
  })

  it("puts a label's icon before its text and exposes the variant", async () => {
    const screen = await render(
      <MapPin
        type="label"
        variant="success"
        label="Blue Bottle Coffee, open now"
        icon={<svg data-testid="coffee" />}
        text="$6"
      />
    )
    const pin = screen
      .getByRole("button", { name: "Blue Bottle Coffee, open now" })
      .element()
    expect(pin.firstElementChild?.getAttribute("data-testid")).toBe("coffee")
    expect(pin.textContent).toBe("$6")
    expect(pin.getAttribute("data-variant")).toBe("success")
  })

  it("opens nothing when there's nothing to preview", async () => {
    const screen = await render(<MapPin label="Sunflower Park" />)
    const pin = screen.getByRole("button", { name: "Sunflower Park" })
    await expect.element(pin).not.toHaveAttribute("aria-haspopup")
    await pin.click()
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument()
  })

  it("leaves a controlled preview to its owner", async () => {
    const onOpenChange = vi.fn()
    const screen = await render(
      <MapPin
        label="Sunflower Park"
        title="Sunflower Park"
        open={false}
        onOpenChange={onOpenChange}
      />
    )
    await screen.getByRole("button", { name: "Sunflower Park" }).click()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument()
  })

  it("shows every field it's given, in order", async () => {
    await render(
      <MapPin
        label="Sunflower Park"
        defaultOpen
        image={{
          src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
          alt: "Fountain",
        }}
        meta="Park"
        title="Sunflower Park"
        description="A ring of sunflowers."
      >
        <button type="button">Directions</button>
      </MapPin>
    )
    const preview = page.getByRole("dialog", { name: "Sunflower Park" })
    await expect.element(preview).toBeVisible()
    const slots = [...preview.element().querySelectorAll("[data-slot]")].map(
      (el) => el.getAttribute("data-slot")
    )
    expect(slots).toEqual([
      "map-pin-image",
      "map-pin-meta",
      "map-pin-title",
      "map-pin-description",
      "map-pin-content",
    ])
  })
})
