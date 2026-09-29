import type { Meta, StoryObj } from "@storybook/react-vite"

import { Skeleton } from "./skeleton.js"

const meta: Meta<typeof Skeleton> = {
  title: "Base components/Skeleton",
  component: Skeleton,
  args: { className: "h-4 w-48" },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {}

export const ProfileRow: Story = {
  name: "Profile row",
  render: () => (
    <div className="flex items-center gap-3" aria-busy="true">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  ),
}

export const Card: Story = {
  render: () => (
    <div
      className="flex w-72 flex-col gap-4 rounded-xl border border-border bg-card p-4"
      aria-busy="true"
    >
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  ),
}

export const Paragraph: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2" aria-busy="true">
      {["w-full", "w-full", "w-11/12", "w-2/3"].map((width, index) => (
        <Skeleton key={index} className={`h-3.5 ${width}`} />
      ))}
    </div>
  ),
}
