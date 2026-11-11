"use client"

import type { ReactNode } from "react"
import { BookOpenIcon, CoffeeIcon, ImageIcon, MusicIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { MapPin } from "@workspace/ui/components/map-pin"

// A stand-in photo, so the demos need no network or bundled asset.
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
    description: "Design, math and a shelf of pixel art zines.",
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

const STREETS_X = [70, 140, 205, 265, 400, 465, 530, 595]
const STREETS_Y = [38, 150, 205]
const PARK =
  "M232 228 C260 218 330 214 368 222 C378 248 380 272 372 292 C330 300 282 302 246 296 C236 274 230 250 232 228Z"
const RIVER =
  "M640 232 C590 244 540 290 470 300 C400 310 330 318 270 326 C200 336 110 330 0 340 V376 C110 368 200 372 276 362 C340 354 410 346 480 336 C556 324 600 284 640 270Z"
const ROADS = [
  { d: "M0 92 C160 86 320 98 640 88", w: 14 },
  { d: "M332 0 C328 120 340 240 330 400", w: 14 },
  { d: "M0 250 C120 236 200 198 300 170 S520 120 640 132", w: 12 },
]

/**
 * A stand-in for a map library's canvas, drawn with fibo's tokens so it
 * follows light and dark. Pins sit on it at percentages, the way a map
 * library places them at coordinates.
 */
function StandInMap({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-80 w-[40rem] max-w-full overflow-hidden rounded-xl border border-border bg-muted dark:bg-card">
      <svg
        aria-hidden="true"
        viewBox="0 0 640 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        fill="none"
        strokeLinecap="round"
      >
        {/* Each street is a darker casing under a lighter fill. */}
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
        {/* The tints are translucent, so each sits on a land-colored base. */}
        <path d={PARK} className="fill-muted dark:fill-card" />
        <path
          d={PARK}
          className="fill-success-subtle stroke-border"
          strokeWidth="1"
        />
        <path d={RIVER} className="fill-muted dark:fill-card" />
        <path
          d={RIVER}
          className="fill-info-subtle stroke-border"
          strokeWidth="1"
        />
        {/* Drawn last so the main roads bridge the river. */}
        <g className="stroke-border">
          {ROADS.map((road) => (
            <path key={road.d} d={road.d} strokeWidth={road.w} />
          ))}
        </g>
        <g className="stroke-background dark:stroke-muted">
          {ROADS.map((road) => (
            <path key={road.d} d={road.d} strokeWidth={road.w - 3} />
          ))}
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
const books = PLACES[1]!

export function MapPinDemo() {
  return (
    <StandInMap>
      <Pin place={cafe}>
        <MapPin
          label={cafe.label}
          image={{
            src: PHOTO,
            alt: "The café's front, with a striped awning",
          }}
          meta={cafe.meta}
          title={cafe.label}
          description={cafe.description}
        />
      </Pin>
    </StandInMap>
  )
}

export function MapPinLabelsDemo() {
  return (
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
  )
}

// Color only carries meaning: here, whether each place is open right now.
const STATUS: Record<
  string,
  {
    variant: "success" | "warning" | "destructive" | "info"
    status: string
    icon: ReactNode
  }
> = {
  cafe: { variant: "success", status: "Open now", icon: <CoffeeIcon /> },
  books: {
    variant: "warning",
    status: "Closes in 20 min",
    icon: <BookOpenIcon />,
  },
  park: { variant: "info", status: "Concert at 7pm", icon: <MusicIcon /> },
  studio: {
    variant: "destructive",
    status: "Closed today",
    icon: <ImageIcon />,
  },
}

export function MapPinColorsDemo() {
  return (
    <StandInMap>
      {PLACES.map((place) => {
        const { variant, status, icon } = STATUS[place.id]!
        return (
          <Pin key={place.id} place={place}>
            <MapPin
              type="icon"
              variant={variant}
              icon={icon}
              label={`${place.label}, ${status}`}
              meta={status}
              title={place.label}
              description={place.description}
            />
          </Pin>
        )
      })}
    </StandInMap>
  )
}

export function MapPinContentDemo() {
  return (
    <StandInMap>
      <Pin place={books}>
        <MapPin
          label={books.label}
          meta={books.meta}
          title={books.label}
          description={books.description}
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
  )
}
