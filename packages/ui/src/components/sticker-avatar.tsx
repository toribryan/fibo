"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type StickerAvatarStatus = "present" | "away" | "offline"

/** How the sticker was cut: from the image's own shape, round, or from initials. */
type StickerAvatarShape = "cutout" | "round" | "initials"

const STATUS_LABELS: Record<StickerAvatarStatus, string> = {
  present: "Present",
  away: "Away",
  offline: "Offline",
}

// Big uploads are scaled down before anything is measured or stamped.
const MAX_SOURCE = 512

/** The paper edge for a size: one sixteenth of it, never under 2px. */
function stickerEdge(size: number) {
  return Math.max(2, Math.round(size / 16))
}

/*
 * A stable tilt from the name, between about -6.6 and 6.6 degrees, so each
 * person looks hand-placed and stays that way across renders and devices.
 */
function stickerTilt(seed: string) {
  let hash = 2166136261
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (((hash >>> 0) % 13) - 6) * 1.1
}

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ""
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : ""
  return (first + last).toUpperCase()
}

class StickerError extends Error {
  constructor(readonly reason: "load" | "taint") {
    super(reason)
  }
}

function loadImage(src: string, cors: boolean) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    if (cors) img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new StickerError("load"))
    img.src = src
  })
}

// Reading pixels needs CORS. A host without it still serves the image, so
// try again plainly: if that loads, the image is fine but can't be cut.
async function loadReadableImage(src: string) {
  try {
    return await loadImage(src, true)
  } catch {
    await loadImage(src, false)
    throw new StickerError("taint")
  }
}

function makeCanvas(width: number, height = width) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

// A cut-out has a mostly clear border. A photo with its background still on
// has nothing to follow, so it becomes a round sticker instead.
function hasClearBorder(data: Uint8ClampedArray, w: number, h: number) {
  let clear = 0
  let total = 0
  const step = Math.max(1, Math.floor(Math.max(w, h) / 64))
  const sample = (x: number, y: number) => {
    total++
    if ((data[(y * w + x) * 4 + 3] ?? 0) < 16) clear++
  }
  for (let x = 0; x < w; x += step) {
    sample(x, 0)
    sample(x, h - 1)
  }
  for (let y = 0; y < h; y += step) {
    sample(0, y)
    sample(w - 1, y)
  }
  return clear / total > 0.5
}

function drawnBounds(data: Uint8ClampedArray, w: number, h: number) {
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((data[(y * w + x) * 4 + 3] ?? 0) <= 12) continue
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

type BakeOptions = {
  size: number
  edge: number
  color: string
  cutout: "auto" | "shape" | "round"
  pixelated: boolean
}

type Baked = { url: string; shape: "cutout" | "round" }

const bakes = new Map<string, Promise<Baked>>()

/*
 * Draws the die-cut once, on a canvas, and hands back a plain image. A live
 * SVG filter would rerun on every paint of every row, and is slow in Safari;
 * stamping a silhouette round a circle is smooth at any edge width and costs
 * nothing after the first frame.
 */
function bakeSticker(src: string, options: BakeOptions): Promise<Baked> {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const key = JSON.stringify([src, options, dpr])
  const cached = bakes.get(key)
  if (cached) return cached

  const job = (async (): Promise<Baked> => {
    const img = await loadReadableImage(src)
    const scale = Math.min(
      1,
      MAX_SOURCE / Math.max(img.naturalWidth, img.naturalHeight, 1)
    )
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const source = makeCanvas(w, h)
    const sourceCtx = source.getContext("2d")!
    sourceCtx.imageSmoothingEnabled = !options.pixelated
    sourceCtx.drawImage(img, 0, 0, w, h)
    let data: Uint8ClampedArray
    try {
      data = sourceCtx.getImageData(0, 0, w, h).data
    } catch {
      throw new StickerError("taint")
    }

    const shape =
      options.cutout === "round" ||
      (options.cutout === "auto" && !hasClearBorder(data, w, h))
        ? "round"
        : "cutout"

    const px = Math.max(1, Math.round(options.size * dpr))
    const edge = Math.round(options.edge * dpr)
    const art = makeCanvas(px)
    const artCtx = art.getContext("2d")!
    artCtx.imageSmoothingEnabled = !options.pixelated
    if (shape === "cutout") {
      // Trimmed and centred, so every subject fills its sticker the same way
      // however much empty space its file has round it.
      const box = drawnBounds(data, w, h) ?? { x: 0, y: 0, w, h }
      const fit = px / Math.max(box.w, box.h)
      artCtx.drawImage(
        source,
        box.x,
        box.y,
        box.w,
        box.h,
        (px - box.w * fit) / 2,
        (px - box.h * fit) / 2,
        box.w * fit,
        box.h * fit
      )
    } else {
      const side = Math.min(w, h)
      artCtx.beginPath()
      artCtx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2)
      artCtx.clip()
      artCtx.drawImage(
        source,
        (w - side) / 2,
        (h - side) / 2,
        side,
        side,
        0,
        0,
        px,
        px
      )
    }

    const out = makeCanvas(px + edge * 2)
    const ctx = out.getContext("2d")!
    if (edge > 0) {
      const silhouette = makeCanvas(px)
      const silhouetteCtx = silhouette.getContext("2d")!
      silhouetteCtx.drawImage(art, 0, 0)
      silhouetteCtx.globalCompositeOperation = "source-in"
      silhouetteCtx.fillStyle = "#ffffff"
      // Ignored if the browser can't parse the colour, leaving white paper.
      silhouetteCtx.fillStyle = options.color
      silhouetteCtx.fillRect(0, 0, px, px)
      const steps = Math.max(24, Math.ceil(edge * 10))
      for (const radius of [edge, edge / 2]) {
        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * Math.PI * 2
          ctx.drawImage(
            silhouette,
            edge + Math.cos(angle) * radius,
            edge + Math.sin(angle) * radius
          )
        }
      }
    }
    ctx.drawImage(art, edge, edge)
    return { url: out.toDataURL("image/png"), shape }
  })()

  bakes.set(key, job)
  job.catch(() => bakes.delete(key))
  return job
}

// A hairline keeps white paper visible on a white page, then the lift
// shadow. Both are drop-shadows, so they follow the cut, not the box.
const PAPER_SHADOW =
  "[filter:drop-shadow(0_0_0.5px_var(--ring))_drop-shadow(0_calc(var(--sticker-edge-width)*0.35)_calc(var(--sticker-edge-width)*0.5)_rgb(0_0_0/0.3))] transition-[filter] duration-200"
const PAPER_SHADOW_LIFTED =
  "motion-safe:group-hover/sticker-avatar:[filter:drop-shadow(0_0_0.5px_var(--ring))_drop-shadow(0_calc(var(--sticker-edge-width)*1.1)_calc(var(--sticker-edge-width)*1.4)_rgb(0_0_0/0.3))] motion-safe:group-hover/sticker:[filter:drop-shadow(0_0_0.5px_var(--ring))_drop-shadow(0_calc(var(--sticker-edge-width)*1.1)_calc(var(--sticker-edge-width)*1.4)_rgb(0_0_0/0.3))]"

function StatusSticker({ status }: { status: StickerAvatarStatus }) {
  return (
    <span
      data-slot="sticker-avatar-status"
      data-status={status}
      aria-hidden="true"
      className="absolute -right-[6%] -bottom-[6%] size-[34%] min-h-[11px] min-w-[11px] rotate-[calc(var(--sticker-tilt)*-2)] [filter:drop-shadow(0_0_0.5px_var(--ring))_drop-shadow(0_1px_1px_rgb(0_0_0/0.3))]"
    >
      {/* Status is told by shape alone, so it reads in greyscale, to anyone
          who can't tell red from green, and printed on white paper in both
          themes. */}
      <svg viewBox="0 0 20 20" className="size-full overflow-visible">
        <circle cx="10" cy="10" r="10" className="fill-sticker-edge" />
        {status === "offline" ? (
          <circle
            cx="10"
            cy="10"
            r="4.75"
            strokeWidth="3.5"
            className="fill-none stroke-sticker-ink"
          />
        ) : (
          <circle cx="10" cy="10" r="6.5" className="fill-sticker-ink" />
        )}
        {status === "away" ? (
          <circle cx="6.5" cy="6.5" r="5" className="fill-sticker-edge" />
        ) : null}
      </svg>
    </span>
  )
}

type StickerAvatarProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The person's name. Their accessible name, the seed for the tilt, and the initials when there is no image. */
  name: string
  /** Image URL. A transparent cut-out gets a die-cut edge; a photo with a background becomes round. */
  src?: string
  /** Width and height in pixels. The edge and tilt are drawn outside this box. */
  size?: number
  /** Paper edge in pixels. Defaults to one sixteenth of the size, never under 2px. */
  edge?: number
  /** Shows a status sticker on the corner, told apart by shape. */
  status?: StickerAvatarStatus
  /** Overrides the status's spoken label, for translation. */
  statusLabel?: string
  /** `true` tilts by a stable angle from the name, a number sets degrees, `false` keeps it straight. */
  tilt?: boolean | number
  /** Lifts on hover, and when hovering an ancestor with `group/sticker`. */
  lift?: boolean
  /** `auto` follows the image's own shape when its border is clear; `shape` or `round` forces one. */
  cutout?: "auto" | "shape" | "round"
  /** Keeps hard pixel edges when scaling pixel art. */
  pixelated?: boolean
}

function StickerAvatar({
  name,
  src,
  size = 40,
  edge,
  status,
  statusLabel,
  tilt = true,
  lift = true,
  cutout = "auto",
  pixelated = false,
  className,
  style,
  ...props
}: StickerAvatarProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const edgeWidth = edge ?? stickerEdge(size)
  const angle =
    tilt === false ? 0 : typeof tilt === "number" ? tilt : stickerTilt(name)
  const [result, setResult] = React.useState<{
    src: string
    baked?: Baked
    failed?: "load" | "taint"
  } | null>(null)

  React.useEffect(() => {
    if (!src || !ref.current) return
    let current = true
    // `--sticker-edge` can be overridden on any ancestor, or through `style`.
    const color =
      getComputedStyle(ref.current).getPropertyValue("--sticker-edge").trim() ||
      "#ffffff"
    bakeSticker(src, { size, edge: edgeWidth, color, cutout, pixelated }).then(
      (baked) => current && setResult({ src, baked }),
      (error: unknown) =>
        current &&
        setResult({
          src,
          failed: error instanceof StickerError ? error.reason : "load",
        })
    )
    return () => {
      current = false
    }
  }, [src, size, edgeWidth, cutout, pixelated])

  const settled = src && result?.src === src ? result : null
  const shape: StickerAvatarShape | "loading" = !src
    ? "initials"
    : !settled
      ? "loading"
      : settled.baked
        ? settled.baked.shape
        : settled.failed === "taint"
          ? "round"
          : "initials"
  const label = status
    ? `${name}, ${statusLabel ?? STATUS_LABELS[status]}`
    : name

  return (
    <span
      ref={ref}
      role="img"
      aria-label={label}
      data-slot="sticker-avatar"
      data-shape={shape}
      data-status={status}
      className={cn(
        "group/sticker-avatar relative inline-block shrink-0 rotate-(--sticker-tilt) align-middle transition-[rotate,translate,scale] duration-200 ease-out",
        lift &&
          "motion-safe:group-hover/sticker:-translate-y-0.5 motion-safe:group-hover/sticker:scale-105 motion-safe:group-hover/sticker:rotate-0 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 motion-safe:hover:rotate-0",
        className
      )}
      style={
        {
          width: size,
          height: size,
          "--sticker-tilt": `${angle}deg`,
          "--sticker-edge-width": `${edgeWidth}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {settled?.baked ? (
        <img
          data-slot="sticker-avatar-image"
          src={settled.baked.url}
          alt=""
          draggable={false}
          className={cn(
            "pointer-events-none absolute -inset-(--sticker-edge-width) size-[calc(100%+var(--sticker-edge-width)*2)] max-w-none select-none",
            PAPER_SHADOW,
            lift && PAPER_SHADOW_LIFTED
          )}
        />
      ) : shape === "round" ? (
        // The host serves the image without CORS, so its pixels can't be
        // read or cut. A paper ring in CSS keeps it looking like a sticker.
        <img
          data-slot="sticker-avatar-image"
          src={src}
          alt=""
          draggable={false}
          className={cn(
            "pointer-events-none size-full rounded-full object-cover shadow-[0_0_0_var(--sticker-edge-width)_var(--sticker-edge)] select-none",
            PAPER_SHADOW,
            lift && PAPER_SHADOW_LIFTED
          )}
        />
      ) : shape === "initials" ? (
        // The letters are the sticker: a stroke painted under the fill
        // grows each glyph by the edge width, the same die-cut in CSS.
        <span
          data-slot="sticker-avatar-fallback"
          aria-hidden="true"
          className={cn(
            "flex size-full items-center justify-center leading-none font-bold tracking-tight text-sticker-ink select-none [-webkit-text-stroke:calc(var(--sticker-edge-width)*2)_var(--sticker-edge)] [paint-order:stroke_fill]",
            PAPER_SHADOW,
            lift && PAPER_SHADOW_LIFTED
          )}
          style={{ fontSize: size * 0.42 }}
        >
          {initials(name)}
        </span>
      ) : null}
      {status ? <StatusSticker status={status} /> : null}
    </span>
  )
}

function StickerAvatarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="sticker-avatar-group"
      className={cn(
        "flex items-center -space-x-3 *:data-[slot=sticker-avatar]:hover:z-10",
        className
      )}
      {...props}
    />
  )
}

function StickerAvatarCount({
  count,
  size = 40,
  edge,
  tilt = true,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  /** How many people are not shown. Rendered as "+count". */
  count: number
  /** Width and height in pixels. Match the stickers beside it. */
  size?: number
  /** Paper edge in pixels. Defaults to the same rule as StickerAvatar. */
  edge?: number
  /** `true` tilts by a stable angle from the count, a number sets degrees. */
  tilt?: boolean | number
}) {
  const edgeWidth = edge ?? stickerEdge(size)
  const angle =
    tilt === false
      ? 0
      : typeof tilt === "number"
        ? tilt
        : stickerTilt(`+${count}`)
  return (
    <span
      data-slot="sticker-avatar-count"
      className={cn(
        "relative inline-flex shrink-0 rotate-(--sticker-tilt) items-center justify-center rounded-full bg-sticker-ink font-semibold text-sticker-edge tabular-nums shadow-[0_0_0_var(--sticker-edge-width)_var(--sticker-edge)] select-none",
        PAPER_SHADOW,
        className
      )}
      style={
        {
          width: size,
          height: size,
          fontSize: size * 0.34,
          "--sticker-tilt": `${angle}deg`,
          "--sticker-edge-width": `${edgeWidth}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      +{count}
    </span>
  )
}

export {
  StickerAvatar,
  StickerAvatarGroup,
  StickerAvatarCount,
  stickerEdge,
  stickerTilt,
  type StickerAvatarProps,
  type StickerAvatarShape,
  type StickerAvatarStatus,
}
