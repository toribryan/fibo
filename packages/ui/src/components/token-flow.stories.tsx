import type { Meta, StoryObj } from "@storybook/react-vite"

import { TokenFlow, type TokenRow } from "./token-flow.js"

// fibo's own tokens, as globals.css resolves them in each theme.
const rows: TokenRow[] = [
  {
    base: "oklch(0.205 0 0)",
    primitive: "neutral-900",
    semantic: "bg-primary",
    use: "Primary actions, headings",
    dark: { base: "oklch(0.985 0 0)", primitive: "neutral-50" },
  },
  {
    base: "oklch(0.505 0.213 27.518)",
    primitive: "red-700",
    semantic: "text-destructive",
    use: "Errors and irreversible actions",
    dark: { base: "oklch(0.704 0.191 22.216)", primitive: "red-400" },
  },
  {
    base: "oklch(0.922 0 0)",
    primitive: "neutral-200",
    semantic: "border-border",
    use: "Hairlines and inputs",
    dark: { base: "oklch(1 0 0 / 10%)", primitive: "white / 10%" },
  },
]

const meta: Meta<typeof TokenFlow> = {
  title: "Special components/Token flow",
  component: TokenFlow,
  argTypes: {
    theme: {
      control: "inline-radio",
      options: [undefined, "light", "dark"],
      description: "Pins the theme. Leave unset to follow the toolbar.",
    },
    showUse: { control: "boolean" },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    rows,
    showUse: false,
    orientation: "horizontal",
  },
}

export default meta
type Story = StoryObj<typeof TokenFlow>

export const Default: Story = {}

export const WithUse: Story = {
  name: "With use",
  args: {
    showUse: true,
  },
}

export const SingleRow: Story = {
  name: "Single row",
  args: {
    rows: rows.slice(0, 1),
    showUse: true,
  },
}

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    showUse: true,
  },
}
