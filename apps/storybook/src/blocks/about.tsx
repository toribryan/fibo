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

/** Plates side by side under the copy, stacked on phones. */
function Plates({ names }: { names: (keyof typeof PLATES)[] }) {
  return (
    <div className="my-8 grid gap-8 sm:grid-cols-2 sm:gap-6">
      {names.map((name) => (
        <Plate key={name} name={name} />
      ))}
    </div>
  )
}

export { Plate, Plates }
