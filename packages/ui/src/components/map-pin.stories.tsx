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
import { MapPin } from "./map-pin.js"

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

// The minor street grid, in the map's 640 by 400 view box.
const STREETS_X = [70, 140, 205, 265, 400, 465, 530, 595]
const STREETS_Y = [38, 150, 205]

// A fixed seed, so the city looks the same on every render and in every
// visual snapshot.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Building footprints filling each block between the streets, a few to a
// block, in varied sizes like a real city's.
const PARK =
  "M232 228 C260 218 330 214 368 222 C378 248 380 272 372 292 C330 300 282 302 246 296 C236 274 230 250 232 228Z"
const RIVER =
  "M640 232 C590 244 540 290 470 300 C400 310 330 318 270 326 C200 336 110 330 0 340 V376 C110 368 200 372 276 362 C340 354 410 346 480 336 C556 324 600 284 640 270Z"

const BUILDINGS = (() => {
  const random = seeded(1618)
  const xs = [0, ...STREETS_X, 640]
  const ys = [0, ...STREETS_Y, 90, 400].sort((a, b) => a - b)
  const out: { x: number; y: number; w: number; h: number }[] = []
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const left = xs[i]! + 7
      const right = xs[i + 1]! - 7
      const top = ys[j]! + 7
      const bottom = ys[j + 1]! - 7
      let y = top
      while (y < bottom - 6) {
        let x = left
        const h = Math.min(8 + random() * 14, bottom - y)
        while (x < right - 6) {
          const w = Math.min(8 + random() * 18, right - x)
          if (random() > 0.18) out.push({ x, y, w: w - 2, h: h - 2 })
          x += w
        }
        y += h
      }
    }
  }
  return out
})()

/**
 * A stand-in for a map library's canvas: a small city of streets, building
 * footprints, a park and a river, drawn with fibo's tokens so it follows
 * light and dark. Pins sit on it at percentages, the way a map library
 * places them at coordinates.
 */
function StandInMap({ children }: { children?: ReactNode }) {
  return (
    <div className="relative aspect-[16/10] w-[40rem] max-w-full overflow-hidden rounded-xl border border-border bg-muted dark:bg-card">
      <svg
        aria-hidden="true"
        viewBox="0 0 640 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        fill="none"
        strokeLinecap="round"
      >
        {/* Minor streets, a darker casing under a lighter fill. */}
        <g className="stroke-border">
          {STREETS_X.map((x) => (
            <path key={x} d={`M${x} 0V400`} strokeWidth="8" />
          ))}
          {STREETS_Y.map((y) => (
            <path key={y} d={`M0 ${y}H640`} strokeWidth="8" />
          ))}
        </g>
        <g className="stroke-background dark:stroke-muted">
          {STREETS_X.map((x) => (
            <path key={x} d={`M${x} 0V400`} strokeWidth="6" />
          ))}
          {STREETS_Y.map((y) => (
            <path key={y} d={`M0 ${y}H640`} strokeWidth="6" />
          ))}
        </g>

        <g className="fill-border dark:fill-secondary">
          {BUILDINGS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="1.5" />
          ))}
        </g>

        {/* The park covers the streets inside it, with paths of its own. The
            tints are translucent, so each sits on a land-coloured base. */}
        <path d={PARK} className="fill-muted dark:fill-card" />
        <path
          d={PARK}
          className="fill-success-subtle stroke-border"
          strokeWidth="1"
        />
        <path
          d="M246 290 C270 262 300 252 330 246 S362 236 368 226 M300 300 C296 280 304 260 330 246"
          className="stroke-background dark:stroke-muted"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <circle
          cx="318"
          cy="258"
          r="9"
          className="fill-info-subtle stroke-border"
        />

        {/* The river, wider than any street, winding under the bridges. */}
        <path d={RIVER} className="fill-muted dark:fill-card" />
        <path
          d={RIVER}
          className="fill-info-subtle stroke-border"
          strokeWidth="1"
        />

        {/* The main roads, drawn last so they bridge the river. */}
        <g className="stroke-border">
          <path d="M0 92 C160 86 320 98 640 88" strokeWidth="14" />
          <path d="M332 0 C328 120 340 240 330 400" strokeWidth="14" />
          <path
            d="M0 250 C120 236 200 198 300 170 S520 120 640 132"
            strokeWidth="12"
          />
        </g>
        <g className="stroke-background dark:stroke-muted">
          <path d="M0 92 C160 86 320 98 640 88" strokeWidth="11" />
          <path d="M332 0 C328 120 340 240 330 400" strokeWidth="11" />
          <path
            d="M0 250 C120 236 200 198 300 170 S520 120 640 132"
            strokeWidth="9"
          />
        </g>

        <g
          className="fill-muted-foreground font-sans"
          fontSize="8.5"
          fontWeight="500"
          letterSpacing="0.04em"
        >
          <text x="420" y="84">
            Fibonacci Ave
          </text>
          <text x="40" y="232" transform="rotate(-9 40 232)">
            Golden Blvd
          </text>
          <text x="342" y="40" transform="rotate(90 342 40)">
            Spiral St
          </text>
          <text
            x="520"
            y="296"
            className="fill-info"
            fontStyle="italic"
            transform="rotate(-14 520 296)"
          >
            River Phi
          </text>
          <text x="262" y="240" className="fill-success">
            Sunflower Park
          </text>
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

const meta: Meta<typeof MapPin> = {
  title: "Special components/Map pin",
  component: MapPin,
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
        <MapPin {...args} />
      </Pin>
    </StandInMap>
  ),
}

export default meta
type Story = StoryObj<typeof MapPin>

export const Default: Story = {
  play: async ({ canvas, canvasElement, args, step, userEvent }) => {
    const page = within(canvasElement.ownerDocument.body)
    const pin = canvas.getByRole("button", { name: cafe.label })

    await step("Pointer", async () => {
      await userEvent.click(pin)
      const preview = await page.findByRole("dialog", { name: cafe.label })
      await expect(preview).toHaveTextContent(cafe.description)
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(true)
      await userEvent.keyboard("{Escape}")
      await waitFor(() =>
        expect(page.queryByRole("dialog")).not.toBeInTheDocument()
      )
      await expect(pin).toHaveFocus()
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

export const LabelPins: Story = {
  name: "Label pins",
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapPin
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
          <MapPin label={`Dot, ${size}`} size={size} />
          <MapPin
            label={`Icon, ${size}`}
            type="icon"
            icon={<CoffeeIcon />}
            size={size}
          />
          <MapPin
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

export const IconPins: Story = {
  name: "Icon pins",
  render: () => (
    <StandInMap>
      {PLACES.map((place) => (
        <Pin key={place.id} place={place}>
          <MapPin
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
          <MapPin
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
          <MapPin
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
        <MapPin
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
        </MapPin>
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
            <MapPin
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
          <MapPin label={place.label} />
        </Pin>
      ))}
    </StandInMap>
  ),
}
