import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor, within } from "storybook/test"
import { useState, type ReactNode } from "react"
import {
  BookOpenIcon,
  CoffeeIcon,
  FlowerIcon,
  ImageIcon,
  MusicIcon,
} from "lucide-react"

import { Button } from "./button.js"
import { MapMarker } from "./map-marker.js"

// A stand-in photo, so the stories need no network.
const PHOTO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6d3d1"/><stop offset="1" stop-color="#78716c"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="240" cy="54" r="22" fill="#f5f5f4"/><path d="M0 150 L90 90 L150 130 L210 80 L320 150 V180 H0Z" fill="#44403c"/></svg>`
)}`

type Place = {
  id: string
  label: string
  x: number
  y: number
  meta: string
  description: string
  price: string
}

const PLACES: Place[] = [
  {
    id: "cafe",
    label: "Blue Bottle Coffee",
    x: 32,
    y: 38,
    meta: "Café · 4 min walk",
    description: "Single-origin pour-overs and a quiet back room.",
    price: "$6",
  },
  {
    id: "books",
    label: "Golden Ratio Books",
    x: 61,
    y: 30,
    meta: "Bookshop · 7 min walk",
    description: "Design, maths and a shelf of pixel art zines.",
    price: "$18",
  },
  {
    id: "park",
    label: "Sunflower Park",
    x: 46,
    y: 66,
    meta: "Park · 9 min walk",
    description: "A ring of sunflowers around a fountain.",
    price: "Free",
  },
  {
    id: "studio",
    label: "Pixel Studio",
    x: 78,
    y: 58,
    meta: "Gallery · 12 min walk",
    description: "Dithered prints, rotating every month.",
    price: "$12",
  },
]

/**
 * A stand-in for a map library's canvas: streets, a park and water drawn
 * with fibo's tokens. Markers sit on it at percentages, the way a map
 * library places them at coordinates.
 */
function StandInMap({ children }: { children?: ReactNode }) {
  return (
    <div className="relative aspect-[16/10] w-[40rem] max-w-full overflow-hidden rounded-xl border border-border bg-muted">
      <svg
        aria-hidden="true"
        viewBox="0 0 640 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <path
          d="M0 300 C120 280 180 340 300 330 S520 300 640 330 V400 H0Z"
          className="fill-info-subtle"
        />
        <rect
          x="230"
          y="220"
          width="160"
          height="90"
          rx="18"
          className="fill-success-subtle"
        />
        <g className="stroke-background" strokeWidth="14" fill="none">
          <path d="M0 120 H640" />
          <path d="M0 210 H640" />
          <path d="M150 0 V400" />
          <path d="M420 0 V400" />
          <path d="M40 0 L620 400" strokeWidth="8" />
        </g>
        <g className="fill-card">
          <rect x="30" y="20" width="100" height="80" rx="6" />
          <rect x="170" y="20" width="230" height="80" rx="6" />
          <rect x="440" y="20" width="170" height="80" rx="6" />
          <rect x="30" y="140" width="100" height="50" rx="6" />
          <rect x="440" y="140" width="170" height="50" rx="6" />
        </g>
      </svg>
      {children}
    </div>
  )
}

function Pin({ place, children }: { place: Place; children: ReactNode }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${place.x}%`, top: `${place.y}%` }}
    >
      {children}
    </div>
  )
}

const cafe = PLACES[0]!

const meta: Meta<typeof MapMarker> = {
  title: "Special components/Map marker",
  component: MapMarker,
  tags: ["new"],
  parameters: {
    layout: "centered",
    controls: {
      exclude: ["image", "icon", "children", "open", "onOpenChange"],
    },
  },
  argTypes: {
    type: { control: "inline-radio", options: ["dot", "icon", "label"] },
    variant: {
      control: "inline-radio",
      options: ["default", "success", "warning", "info", "destructive"],
    },
    icon: { control: false },
    size: { control: "inline-radio", options: ["sm", "default"] },
    side: {
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
    },
    image: { control: false },
    children: { control: false },
    open: { control: false },
    onOpenChange: { control: false },
  },
  args: {
    label: cafe.label,
    type: "dot",
    variant: "default",
    size: "default",
    side: "top",
    image: { src: PHOTO, alt: "The café's front, with a striped awning" },
    meta: cafe.meta,
    title: cafe.label,
    description: cafe.description,
    onOpenChange: fn(),
  },
  render: (args) => (
    <StandInMap>
      <Pin place={cafe}>
        <MapMarker {...args} />
      </Pin>
    </StandInMap>
  ),
}

export default meta
type Story = StoryObj<typeof MapMarker>

export const Default: Story = {
  play: async ({ canvas, canvasElement, args, step, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    const marker = canvas.getByRole("button", { name: cafe.label })

    await step("Pointer", async () => {
      await userEvent.click(marker)
      const preview = await page.findByRole("dialog", { name: cafe.label })
      await expect(preview).toHaveTextContent(cafe.description)
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true)
      await userEvent.keyboard("{Escape}")
      await waitFor(() =>
        expect(page.queryByRole("dialog")).not.toBeInTheDocument()
      )
      await expect(marker).toHaveFocus()
    })

    await step("Keyboard", async () => {
      await userEvent.keyboard("{Enter}")
      const preview = await page.findByRole("dialog", { name: cafe.label })
      // The card fades in from its starting style.
      await waitFor(() => expect(preview).toBeVisible())
      await userEvent.keyboard("{Escape}")
      await waitFor(() =>
        expect(page.queryByRole("dialog")).not.toBeInTheDocument()
      )
    })
  },
}

export const LabelMarkers: Story = {
  name: "Label markers",
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapMarker
            type="label"
            label={place.label}
            text={place.price}
            meta={place.meta}
            title={place.label}
            description={place.description}
          />
        </Pin>
      ))}
    </StandInMap>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "default"] as const).map((size) => (
        <div key={size} className="flex items-center gap-5">
          <MapMarker label={`Dot, ${size}`} size={size} />
          <MapMarker
            label={`Icon, ${size}`}
            type="icon"
            icon={<CoffeeIcon />}
            size={size}
          />
          <MapMarker
            label={`Label, ${size}`}
            type="label"
            text="$120"
            size={size}
          />
        </div>
      ))}
    </div>
  ),
}

const ICONS: Record<string, ReactNode> = {
  cafe: <CoffeeIcon />,
  books: <BookOpenIcon />,
  park: <FlowerIcon />,
  studio: <ImageIcon />,
}

export const IconMarkers: Story = {
  name: "Icon markers",
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapMarker
            type="icon"
            icon={ICONS[place.id]}
            label={place.label}
            meta={place.meta}
            title={place.label}
            description={place.description}
          />
        </Pin>
      ))}
    </StandInMap>
  ),
}

// Colour only carries meaning: here, whether each place is open right now.
const STATUS: Record<
  string,
  {
    variant: "success" | "warning" | "destructive" | "info"
    status: string
  }
> = {
  cafe: { variant: "success", status: "Open now" },
  books: { variant: "warning", status: "Closes in 20 min" },
  park: { variant: "info", status: "Concert at 7pm" },
  studio: { variant: "destructive", status: "Closed today" },
}

export const Colours: Story = {
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapMarker
            type="icon"
            variant={STATUS[place.id]!.variant}
            icon={place.id === "park" ? <MusicIcon /> : ICONS[place.id]}
            label={`${place.label}, ${STATUS[place.id]!.status}`}
            meta={STATUS[place.id]!.status}
            title={place.label}
            description={place.description}
          />
        </Pin>
      ))}
    </StandInMap>
  ),
}

export const LabelsWithIcons: Story = {
  name: "Labels with icons",
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapMarker
            type="label"
            variant={STATUS[place.id]!.variant}
            icon={ICONS[place.id]}
            label={`${place.label}, ${STATUS[place.id]!.status}`}
            text={place.price}
            meta={STATUS[place.id]!.status}
            title={place.label}
            description={place.description}
          />
        </Pin>
      ))}
    </StandInMap>
  ),
}

export const CustomContent: Story = {
  name: "Custom content",
  render: () => (
    <StandInMap>
      <Pin place={PLACES[1]!}>
        <MapMarker
          label={PLACES[1]!.label}
          meta={PLACES[1]!.meta}
          title={PLACES[1]!.label}
          description={PLACES[1]!.description}
        >
          <div className="flex gap-2">
            <Button size="sm">Directions</Button>
            <Button size="sm" variant="outline">
              Save
            </Button>
          </div>
        </MapMarker>
      </Pin>
    </StandInMap>
  ),
}

function ControlledMap() {
  const [openId, setOpenId] = useState<string | null>("park")
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <ul className="m-0 flex list-none flex-col gap-1 p-0 sm:w-48">
        {PLACES.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              aria-pressed={openId === place.id}
              onClick={() => setOpenId(place.id)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle aria-pressed:bg-muted aria-pressed:font-medium"
            >
              {place.label}
            </button>
          </li>
        ))}
      </ul>
      <StandInMap>
        {PLACES.map((place) => (
          <Pin key={place.id} place={place}>
            <MapMarker
              label={place.label}
              meta={place.meta}
              title={place.label}
              description={place.description}
              open={openId === place.id}
              onOpenChange={(open) =>
                setOpenId((current) =>
                  open ? place.id : current === place.id ? null : current
                )
              }
            />
          </Pin>
        ))}
      </StandInMap>
    </div>
  )
}

export const Controlled: Story = {
  render: () => <ControlledMap />,
}

export const WithoutPreview: Story = {
  name: "Without a preview",
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapMarker label={place.label} />
        </Pin>
      ))}
    </StandInMap>
  ),
}
