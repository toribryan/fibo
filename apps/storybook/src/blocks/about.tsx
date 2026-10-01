import type { ReactNode } from "react"

const PLATES = {
  bunny: {
    alt: "A soft photograph of a white rabbit's eye in a small window, with a dithered pixel rabbit building out around it.",
    caption: "The rabbit, rebuilt in pixels around a photograph of one.",
  },
  sunflower: {
    alt: "A photograph of bees on a sunflower's seed head in a small window, with a dithered pixel sunflower building out around it.",
    caption:
      "A sunflower, whose seeds spiral in Fibonacci numbers, dissolving into dither.",
  },
}

/*
 * The launch cards from the brand kit. Each animation starts on the photo
 * alone and builds the dither out around it; the resolved still stands in
 * when motion is reduced.
 */
function Plate({ name }: { name: keyof typeof PLATES }) {
  const { alt, caption } = PLATES[name]
  return (
    <figure className="m-0 flex flex-col gap-3">
      <picture>
        <source
          srcSet={`about/${name}-dither.png`}
          media="(prefers-reduced-motion: reduce)"
        />
        <img
          src={`about/${name}-dither.gif`}
          alt={alt}
          width={1080}
          height={1350}
          loading="lazy"
          className="block h-auto w-full rounded-2xl border border-border"
        />
      </picture>
      <figcaption className="text-sm leading-6 text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}

/** Copy beside a plate, the columns cut on the golden section. */
function Split({
  plate,
  children,
}: {
  plate: keyof typeof PLATES
  children: ReactNode
}) {
  return (
    <div className="grid items-start gap-8 sm:grid-cols-[1.618fr_1fr] sm:gap-10">
      <div className="min-w-0 [&>p:first-child]:mt-0">{children}</div>
      <Plate name={plate} />
    </div>
  )
}

export { Plate, Split }
