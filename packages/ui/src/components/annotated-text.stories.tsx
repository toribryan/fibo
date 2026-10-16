import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { useState } from "react"
import { BlocksIcon, SparklesIcon } from "lucide-react"

import {
  AnnotatedText,
  AnnotatedTextChip,
  AnnotatedTextCycle,
  type AnnotatedTextTone,
  type AnnotatedTextVariant,
} from "./annotated-text.js"
import { Button } from "./button.js"

const VARIANTS: AnnotatedTextVariant[] = [
  "underline",
  "wavy",
  "double",
  "highlight",
  "circle",
  "box",
  "bracket",
  "strike",
  "cross",
  "arrow",
]

const TONES: AnnotatedTextTone[] = [
  "default",
  "muted",
  "info",
  "success",
  "warning",
  "destructive",
]

// Escaped so the source stays plain ASCII.
const PALETTE = "\u{1F3A8}"
const RULER = "\u{1F4CF}"
const SPEECH = "\u{1F4AC}"
const RAINBOW = "\u{1F308}"
const TYPE = "\u{1F524}"
const ROBOT = "\u{1F916}"

const meta: Meta<typeof AnnotatedText> = {
  title: "Special components/Annotated text",
  component: AnnotatedText,
  tags: ["new"],
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    tone: { control: "inline-radio", options: TONES },
    animate: { control: "boolean" },
    delay: { control: { type: "range", min: 0, max: 2000, step: 100 } },
  },
  args: {
    variant: "underline",
    tone: "default",
    animate: false,
    delay: 0,
  },
  render: (args) => (
    <p className="max-w-xl text-3xl font-medium tracking-tight">
      Ship the smallest change that{" "}
      <AnnotatedText {...args}>fully solves</AnnotatedText> the problem.
    </p>
  ),
}

export default meta
type Story = StoryObj<typeof AnnotatedText>

export const Default: Story = {
  args: { variant: "wavy", tone: "success" },
}

export const Variants: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-x-16 gap-y-10 text-2xl sm:grid-cols-5">
      {VARIANTS.map((variant) => (
        <figure key={variant} className="m-0 flex flex-col items-start gap-3">
          <AnnotatedText {...args} variant={variant}>
            Annotate
          </AnnotatedText>
          <figcaption className="font-mono text-xs text-muted-foreground">
            {variant}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
}

export const Tones: Story = {
  args: { variant: "wavy" },
  render: (args) => (
    <div className="flex flex-col gap-8">
      {(["wavy", "highlight"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap gap-x-10 gap-y-6 text-xl">
          {TONES.map((tone) => (
            <AnnotatedText key={tone} {...args} variant={variant} tone={tone}>
              {tone}
            </AnnotatedText>
          ))}
        </div>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  args: { variant: "circle" },
  render: (args) => (
    <div className="flex flex-col items-start gap-10">
      {["text-sm", "text-xl", "text-4xl", "text-6xl"].map((size) => (
        <p key={size} className={`${size} m-0 font-medium tracking-tight`}>
          Scales with <AnnotatedText {...args}>the type</AnnotatedText>
        </p>
      ))}
    </div>
  ),
}

function Replay(args: Story["args"]) {
  const [round, setRound] = useState(0)
  return (
    <div className="flex flex-col items-start gap-8">
      <p
        key={round}
        className="m-0 max-w-xl text-3xl leading-snug font-medium tracking-tight"
      >
        Tokens are{" "}
        <AnnotatedText {...args} variant="highlight" animate>
          names
        </AnnotatedText>
        , not values. Name what a color{" "}
        <AnnotatedText {...args} variant="circle" animate delay={500}>
          does
        </AnnotatedText>
        , never what it{" "}
        <AnnotatedText
          {...args}
          variant="strike"
          tone="destructive"
          animate
          delay={1100}
        >
          looks like
        </AnnotatedText>
        .
      </p>
      <Button size="sm" variant="outline" onClick={() => setRound(round + 1)}>
        Draw again
      </Button>
    </div>
  )
}

export const DrawIn: Story = {
  name: "Draw in",
  render: (args) => <Replay {...args} />,
}

export const Chip: Story = {
  render: () => (
    <p className="m-0 max-w-2xl text-center text-5xl leading-[1.3] font-medium tracking-tight">
      A tool to create visual{" "}
      <AnnotatedTextChip icon={<BlocksIcon />}>systems</AnnotatedTextChip>,
      customize <AnnotatedTextChip icon={PALETTE}>colors</AnnotatedTextChip>,
      and build interfaces with{" "}
      <AnnotatedTextChip icon={<SparklesIcon />}>anything</AnnotatedTextChip>.
    </p>
  ),
}

export const Cycle: Story = {
  render: () => (
    <p className="m-0 max-w-2xl text-center text-5xl leading-[1.3] font-medium tracking-tight">
      A tool to create visual{" "}
      <AnnotatedTextCycle
        loop
        items={[
          { label: "systems", icon: <BlocksIcon /> },
          { label: "themes", icon: RAINBOW },
          { label: "languages", icon: SPEECH },
        ]}
      />
      , customize{" "}
      <AnnotatedTextCycle
        loop
        interval={2600}
        items={[
          { label: "colors", icon: PALETTE },
          { label: "spacing", icon: RULER },
          { label: "type", icon: TYPE },
        ]}
      />
      , and build interfaces with{" "}
      <AnnotatedTextCycle
        loop
        interval={3200}
        items={[
          { label: "agents", icon: ROBOT },
          { label: "anything", icon: <SparklesIcon /> },
        ]}
      />
      .
    </p>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Screen readers hear the first item and nothing that moves.
    await expect(
      canvas.getByText("systems", { selector: ".sr-only" })
    ).toBeInTheDocument()
    const cycle = canvasElement.querySelector<HTMLElement>(
      '[data-slot="annotated-text-cycle"]'
    )!
    // Hovering holds the current word, so it can be read.
    await userEvent.hover(cycle)
    const held = cycle.dataset.index
    await new Promise((resolve) => setTimeout(resolve, 2300))
    await expect(cycle.dataset.index).toBe(held)
    await userEvent.unhover(cycle)
    await waitFor(() => expect(cycle.dataset.index).not.toBe(held), {
      timeout: 3000,
    })
  },
}

export const InProse: Story = {
  name: "In prose",
  render: () => (
    <div className="flex max-w-prose flex-col gap-4 text-base leading-7 text-foreground">
      <p className="m-0">
        Every tint is a named role, so Figma and code can bind the{" "}
        <AnnotatedText variant="underline">same name</AnnotatedText>. Opacity
        modifiers are{" "}
        <AnnotatedText variant="cross" tone="destructive">
          not allowed
        </AnnotatedText>{" "}
        on token colors.
      </p>
      <p className="m-0">
        Use the{" "}
        <AnnotatedText variant="highlight">
          <code className="font-mono text-sm">-subtle</code>
        </AnnotatedText>{" "}
        role for quiet fills, and keep marks to{" "}
        <AnnotatedText variant="wavy" tone="muted">
          one or two a paragraph
        </AnnotatedText>
        .
      </p>
    </div>
  ),
}
