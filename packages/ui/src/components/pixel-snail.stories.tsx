import type { Meta, StoryObj } from "@storybook/react-vite"
import { useRef, useState, type ComponentProps } from "react"

import { Button } from "./button.js"
import {
  PixelSnail,
  PixelSnailSprite,
  type PixelSnailLook,
} from "./pixel-snail.js"

const meta: Meta<typeof PixelSnail> = {
  title: "Niche/Pixel snail",
  component: PixelSnail,
  tags: ["new"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    pace: { control: "inline-radio", options: ["slow", "default", "fast"] },
    travel: { control: "boolean" },
    ground: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    size: "default",
    pace: "default",
    travel: false,
    ground: true,
    label: "Loading",
  },
}

export default meta
type Story = StoryObj<typeof PixelSnail>

export const Default: Story = {}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      <PixelSnail {...args} size="sm" />
      <PixelSnail {...args} size="default" />
      <PixelSnail {...args} size="lg" />
    </div>
  ),
}

export const Travel: Story = {
  args: { travel: true, size: "lg" },
  render: (args) => (
    <div className="w-96">
      <PixelSnail {...args} />
    </div>
  ),
}

export const LoadingPanel: Story = {
  name: "Loading panel",
  render: (args) => (
    <div className="flex w-80 flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <PixelSnail {...args} label="Loading your projects" />
      <p className="text-sm text-muted-foreground">Fetching your projects</p>
      <Button size="sm" variant="outline">
        Cancel
      </Button>
    </div>
  ),
}

/*
 * The sprite demos below draw PixelSnailSprite in a bare SVG. Its origin is
 * under the middle of the foot, and the art reaches about 12 art pixels
 * either side and 16 above, so this box fits it facing either way.
 */
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

export const Modes: Story = {
  render: () => (
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
  ),
}

function Rebuild() {
  const [round, setRound] = useState(0)
  const [step, setStep] = useState("waiting")
  return (
    <div className="flex flex-col items-center gap-4">
      <Sprite
        key={round}
        mode="rest"
        assembleDelay={300}
        onAssemble={(next) =>
          setStep(
            next === "whole"
              ? "whole"
              : `${next.block}px blocks, ${Math.round(next.shown * 100)}% shown`
          )
        }
      />
      <p className="m-0 font-mono text-xs text-muted-foreground">{step}</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setStep("waiting")
          setRound((r) => r + 1)
        }}
      >
        Build again
      </Button>
    </div>
  )
}

export const BuildUp: Story = {
  name: "Build-up",
  render: () => <Rebuild />,
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

function Follower() {
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

export const FollowsThePointer: Story = {
  name: "Follows the pointer",
  render: () => <Follower />,
}
