import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"
import {
  BellIcon,
  CalendarIcon,
  CloudIcon,
  DatabaseIcon,
  FileTextIcon,
  GitBranchIcon,
  MailIcon,
  MessageSquareIcon,
  WebhookIcon,
} from "lucide-react"

import { Badge } from "./badge.js"
import {
  IntegrationVisual,
  type IntegrationItem,
} from "./integration-visual.js"

const tools: IntegrationItem[] = [
  { title: "Database", icon: <DatabaseIcon /> },
  { title: "Repository", icon: <GitBranchIcon /> },
  { title: "Chat", icon: <MessageSquareIcon /> },
  { title: "Calendar", icon: <CalendarIcon /> },
  { title: "Email", icon: <MailIcon /> },
  { title: "Storage", icon: <CloudIcon /> },
  { title: "Alerts", icon: <BellIcon /> },
  { title: "Docs", icon: <FileTextIcon /> },
]

function SyncPreview() {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-3">
      <span className="text-xs font-medium text-muted-foreground">
        Last sync
      </span>
      {tools.slice(0, 3).map((tool) => (
        <div
          key={tool.title}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="flex items-center gap-2 text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground">
            {tool.icon}
            {tool.title}
          </span>
          <Badge variant="secondary">2m ago</Badge>
        </div>
      ))}
    </div>
  )
}

type Args = React.ComponentProps<typeof IntegrationVisual> & {
  count: number
  hub: "icon" | "text"
  hubText: string
}

const meta: Meta<Args> = {
  title: "Niche/Integration visual",
  component: IntegrationVisual,
  argTypes: {
    layout: { control: "inline-radio", options: ["corners", "orbit", "sides"] },
    background: { control: "inline-radio", options: ["dots", "grid", "none"] },
    routes: { control: "inline-radio", options: ["solid", "dashed"] },
    pulse: { control: "inline-radio", options: ["inward", "outward", "none"] },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "Scales the tiles and the hub.",
    },
    halo: { control: "boolean" },
    hub: {
      name: "center content",
      control: "inline-radio",
      options: ["icon", "text"],
      description:
        "Story control: the default snail icon, or text. `center` takes either.",
    },
    hubText: {
      name: "center text",
      control: "text",
      if: { arg: "hub", eq: "text" },
      description: "Story control: the text in the hub when it shows text.",
    },
    count: {
      control: { type: "range", min: 1, max: 8, step: 1 },
      description:
        "Story control: how many tools to wire in. Corners draws up to four.",
    },
    items: { control: false },
    center: { control: false },
    preview: { control: false },
  },
  args: {
    layout: "corners",
    background: "dots",
    routes: "solid",
    pulse: "inward",
    size: "default",
    halo: true,
    count: 4,
    hub: "icon",
    hubText: "12",
  },
  render: ({ count, hub, hubText, ...args }) => (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-border">
      <IntegrationVisual
        {...args}
        center={hub === "text" ? hubText : args.center}
        items={tools.slice(0, count)}
      />
    </div>
  ),
}

export default meta
type Story = StoryObj<Args>

export const Default: Story = {
  args: {
    preview: <SyncPreview />,
  },
  play: async ({ canvasElement, userEvent }) => {
    // The preview is portalled to the body, outside the story's canvas.
    const page = within(canvasElement.ownerDocument.body)
    const preview = () =>
      canvasElement.ownerDocument.querySelector(
        '[data-slot="integration-visual-preview"]'
      )
    await expect(preview()).toBeNull()

    // The hub is a named button, and focusing it opens the preview.
    await userEvent.tab()
    const hub = page.getByRole("button", { name: "Integrations" })
    await expect(hub).toHaveFocus()
    await waitFor(() => expect(preview()).not.toBeNull())

    // Escape dismisses it without moving focus.
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(preview()).toBeNull())
    await expect(hub).toHaveFocus()
  },
}

export const MediaPreview: Story = {
  name: "Media preview",
  args: {
    preview: {
      src: "./snail-sync.svg",
      alt: "A snail inching along a sync track",
    },
  },
}

export const Orbit: Story = {
  args: {
    layout: "orbit",
    count: 6,
  },
}

const pipeline: IntegrationItem[] = [
  { title: "Webhook", icon: <WebhookIcon />, side: "in" },
  { title: "Database", icon: <DatabaseIcon />, side: "in" },
  { title: "Repository", icon: <GitBranchIcon />, side: "in" },
  { title: "Chat", icon: <MessageSquareIcon />, side: "out" },
  { title: "Email", icon: <MailIcon />, side: "out" },
]

export const Sides: Story = {
  name: "Sides (pipeline)",
  args: {
    layout: "sides",
    pulse: "outward",
    count: pipeline.length,
  },
  render: ({ count, hub, hubText, ...args }) => (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-border">
      <IntegrationVisual
        {...args}
        center={hub === "text" ? hubText : args.center}
        items={pipeline.slice(0, count)}
      />
    </div>
  ),
}

export const IdleItems: Story = {
  name: "Idle items",
  render: ({ count, hub, hubText, ...args }) => (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-border">
      <IntegrationVisual
        {...args}
        center={hub === "text" ? hubText : args.center}
        items={tools
          .slice(0, count)
          .map((tool, i) => (i % 2 ? { ...tool, status: "idle" } : tool))}
      />
    </div>
  ),
}

export const Plates: Story = {
  render: ({ count, hub, hubText, ...args }) => (
    <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
      {(["dots", "grid", "none"] as const).map((background) => (
        <div key={background} className="flex flex-col gap-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <IntegrationVisual
              {...args}
              center={hub === "text" ? hubText : args.center}
              background={background}
              size="sm"
              items={tools.slice(0, count)}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {background}
          </span>
        </div>
      ))}
    </div>
  ),
}

export const InACard: Story = {
  name: "In a card",
  args: {
    hub: "text",
    hubText: "12",
    preview: <SyncPreview />,
  },
  render: ({ count, hub, hubText, ...args }) => (
    <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <IntegrationVisual
        {...args}
        center={hub === "text" ? hubText : args.center}
        items={tools.slice(0, count)}
      />
      <div className="flex flex-col gap-1.5 border-t border-border px-5 py-4">
        <span className="text-lg font-semibold tracking-tight text-card-foreground">
          Twelve sources, one feed
        </span>
        <span className="text-sm leading-6 text-muted-foreground">
          Hover the hub to see what synced last. Routes pulse while a source is
          active.
        </span>
      </div>
    </div>
  ),
}
