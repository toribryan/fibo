import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, waitFor } from "storybook/test"
import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { Button } from "./button.js"
import { ChapterScrubber, type Chapter } from "./chapter-scrubber.js"

const talk: Chapter[] = [
  {
    id: "intro",
    meta: "00:00",
    title: "Why a design system",
    description:
      "The problem: four products, four button styles, no shared names.",
  },
  {
    id: "audit",
    meta: "02:14",
    title: "The audit",
    description: "Every colour in production, clustered and counted.",
  },
  {
    id: "tokens",
    meta: "05:40",
    title: "Primitive tokens",
    description: "Ramps first, named for what they are, not what they do.",
  },
  {
    id: "roles",
    meta: "08:02",
    title: "Semantic roles",
    description: "Primary, muted, destructive: names components can rely on.",
  },
  {
    id: "opacity",
    meta: "10:31",
    title: "No opacity modifiers",
    description: "Why every tint became a named role Figma can bind.",
  },
  {
    id: "contrast",
    meta: "12:48",
    title: "Measuring contrast",
    description: "Moving status tones to the 700 step to clear AA.",
  },
  {
    id: "figma",
    meta: "15:05",
    title: "One name on both sides",
    description: "Variables in Figma that match the CSS one to one.",
  },
  {
    id: "registry",
    meta: "17:36",
    title: "The registry",
    description:
      "Copying source into projects instead of depending on a package.",
  },
  {
    id: "docs",
    meta: "20:12",
    title: "Docs people read",
    description: "Usage rules and do's and don'ts beside every part.",
  },
  {
    id: "adoption",
    meta: "23:40",
    title: "Adoption",
    description: "What got teams to switch, and what did not.",
  },
  {
    id: "motion",
    meta: "26:05",
    title: "Motion",
    description: "Springs, reduced motion, and when to leave things still.",
  },
  {
    id: "special",
    meta: "28:50",
    title: "Special components",
    description: "Room for the playful components next to the base ones.",
  },
  {
    id: "next",
    meta: "31:22",
    title: "What is next",
    description: "Charts, forms, and a second theme.",
  },
  { id: "qa", meta: "33:10", title: "Questions" },
]

const meta: Meta<typeof ChapterScrubber> = {
  title: "Special components/Navigation/Chapter scrubber",
  component: ChapterScrubber,
  parameters: { layout: "centered" },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
    },
    variant: { control: "inline-radio", options: ["tick", "dot"] },
    size: { control: "inline-radio", options: ["sm", "default", "lg"] },
    side: {
      control: "select",
      options: [undefined, "left", "right", "top", "bottom"],
      description:
        "Left or right for vertical rails, top or bottom for horizontal. Unset picks right or top.",
    },
    align: { control: "inline-radio", options: ["edge", "center"] },
    preview: { control: "inline-radio", options: ["card", "label"] },
    radius: { control: { type: "range", min: 1, max: 8, step: 0.5 } },
    rowSize: { control: { type: "range", min: 6, max: 24, step: 1 } },
    restLength: { control: { type: "range", min: 2, max: 32, step: 1 } },
    peakLength: { control: { type: "range", min: 8, max: 96, step: 2 } },
    defaultCurrentIndex: {
      control: { type: "number", min: 0, max: talk.length - 1 },
    },
    chapters: { control: false },
    currentIndex: { control: false },
  },
  args: {
    chapters: talk,
    orientation: "vertical",
    variant: "tick",
    size: "default",
    align: "edge",
    preview: "card",
    radius: 4,
    defaultCurrentIndex: 3,
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-80 min-w-[34rem] items-center justify-center p-10">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ChapterScrubber>

export const Default: Story = {
  args: { onCurrentIndexChange: fn() },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const options = canvas.getAllByRole("option")
    await userEvent.tab()
    await expect(options[3]).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    await expect(options[4]).toHaveFocus()
    await userEvent.keyboard("{End}")
    const last = options[options.length - 1]!
    await expect(last).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(last).toHaveAttribute("aria-selected", "true")
    // End on the settled preview, so the axe check that follows measures the
    // colours people see rather than a frame of the fade.
    await waitFor(() =>
      expect(
        getComputedStyle(
          // Portalled to the body, outside the story's canvas.
          canvasElement.ownerDocument.querySelector(
            '[data-slot="chapter-scrubber-preview"]'
          )!
        ).opacity
      ).toBe("1")
    )
    await expect(args.onCurrentIndexChange).toHaveBeenCalledTimes(1)
    await expect(
      (args.onCurrentIndexChange as ReturnType<typeof fn>).mock.calls[0]?.[0]
    ).toBe(options.length - 1)
  },
}

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    preview: "label",
    side: "top",
  },
}

export const Dots: Story = {
  args: {
    variant: "dot",
  },
}

export const Centered: Story = {
  name: "Centred ticks",
  args: {
    align: "center",
    preview: "label",
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-24">
      {(["sm", "default", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-start gap-4">
          <ChapterScrubber {...args} size={size} preview="label" />
          <span className="font-mono text-xs text-muted-foreground">
            {size}
          </span>
        </div>
      ))}
    </div>
  ),
}

export const Controlled: Story = {
  render: (args) => {
    const ControlledDemo = () => {
      const [current, setCurrent] = useState(3)
      const chapter = talk[current]!
      return (
        <div className="flex items-center gap-10">
          <ChapterScrubber
            {...args}
            currentIndex={current}
            onCurrentIndexChange={setCurrent}
          />
          <div className="flex w-64 flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {chapter.meta} · {current + 1} of {talk.length}
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {chapter.title}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={current === 0}
                onClick={() => setCurrent(current - 1)}
              >
                <ChevronUpIcon data-icon="inline-start" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={current === talk.length - 1}
                onClick={() => setCurrent(current + 1)}
              >
                Next
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return <ControlledDemo />
  },
}

const essay: Chapter[] = [
  { id: "problem", meta: "01", title: "The problem" },
  { id: "research", meta: "02", title: "Research" },
  { id: "principles", meta: "03", title: "Principles" },
  { id: "tokens", meta: "04", title: "Tokens" },
  { id: "components", meta: "05", title: "Components" },
  { id: "rollout", meta: "06", title: "Rollout" },
  { id: "outcome", meta: "07", title: "Outcome" },
]

export const InAnArticle: Story = {
  name: "In an article",
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <Story />],
  render: (args) => {
    const ArticleDemo = () => {
      const [current, setCurrent] = useState(0)
      return (
        <div className="flex gap-10 p-10">
          <div className="sticky top-10 self-start">
            <ChapterScrubber
              {...args}
              chapters={essay}
              size="lg"
              preview="label"
              currentIndex={current}
              onCurrentIndexChange={setCurrent}
              label="Sections"
            />
          </div>
          <article className="flex max-w-prose flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {essay[current]!.meta} / 07
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {essay[current]!.title}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              A long read sits to the right of a quiet rail. At rest it is a
              column of hairlines; under the pointer the marks swell and name
              the section, so the reader sees the whole shape of the piece and
              can jump without a table of contents taking up the margin.
            </p>
          </article>
        </div>
      )
    }
    return <ArticleDemo />
  },
}
