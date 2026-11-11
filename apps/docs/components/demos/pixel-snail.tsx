"use client"

import { useRef, useState, type ComponentProps } from "react"

import {
  PixelSnailSprite,
  type PixelSnailLook,
} from "@workspace/ui/components/pixel-snail"

// The sprite's origin is under the middle of the foot, and the art reaches
// about 12 art pixels either side and 16 above, so this box fits it facing
// either way.
const SPRITE_BOX = "-13 -16 27 18"

function Sprite(props: ComponentProps<typeof PixelSnailSprite>) {
  return (
    <svg
      viewBox={SPRITE_BOX}
      className="h-18 w-27 overflow-visible text-foreground"
      aria-hidden
    >
      <PixelSnailSprite {...props} />
    </svg>
  )
}

export function PixelSnailModesDemo() {
  return (
    <div className="flex items-end gap-10">
      {(["crawl", "rest", "dance"] as const).map((mode) => (
        <figure key={mode} className="m-0 flex flex-col items-center gap-3">
          <Sprite mode={mode} />
          <figcaption className="font-mono text-xs text-muted-foreground">
            {mode}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

// Art pixels from the sprite's origin to its eyes, and how far off them the
// pointer must be before they move. The gap either side of the middle keeps
// him from flipping back and forth.
const EYES = { x: 6, y: -11 }
const GLANCE = 1.5
const TURN = 4

function glance(offset: number): -1 | 0 | 1 {
  if (offset < -GLANCE) return -1
  return offset > GLANCE ? 1 : 0
}

export function PixelSnailFollowerDemo() {
  const svg = useRef<SVGSVGElement>(null)
  const [look, setLook] = useState<PixelSnailLook | null>(null)
  return (
    <div
      className="flex h-60 w-full max-w-lg items-end justify-center rounded-xl border border-dashed border-border pb-8"
      onPointerMove={(event) => {
        const matrix = svg.current?.getScreenCTM()?.inverse()
        if (!matrix) return
        const { x: dx, y: dy } = new DOMPoint(
          event.clientX,
          event.clientY
        ).matrixTransform(matrix)
        setLook((current) => {
          const turned = current?.facing ?? 1
          const facing = dx < -TURN ? -1 : dx > TURN ? 1 : turned
          return {
            facing,
            x: glance((dx - facing * EYES.x) * facing),
            y: glance(dy - EYES.y),
          }
        })
      }}
      onPointerLeave={() => setLook(null)}
    >
      <svg
        ref={svg}
        viewBox={SPRITE_BOX}
        className="h-18 w-27 overflow-visible text-foreground"
        aria-hidden
      >
        <PixelSnailSprite mode="dance" look={look} />
      </svg>
    </div>
  )
}
