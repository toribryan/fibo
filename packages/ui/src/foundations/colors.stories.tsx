import type { Meta, StoryObj } from "@storybook/react-vite"

/*
 * Tailwind only generates CSS for utility classes it can find as literal
 * strings during a scan — dynamically built values (e.g. a template string
 * interpolated into `style`) are invisible to it. These maps spell every
 * class out so the scanner keeps the whole ramp, not just the shades
 * referenced elsewhere by name.
 */
const NEUTRAL_BG: Record<string, string> = {
  "50": "bg-neutral-50",
  "100": "bg-neutral-100",
  "200": "bg-neutral-200",
  "300": "bg-neutral-300",
  "400": "bg-neutral-400",
  "500": "bg-neutral-500",
  "600": "bg-neutral-600",
  "700": "bg-neutral-700",
  "800": "bg-neutral-800",
  "900": "bg-neutral-900",
  "950": "bg-neutral-950",
}

const RED_BG: Record<string, string> = {
  "50": "bg-red-50",
  "100": "bg-red-100",
  "200": "bg-red-200",
  "300": "bg-red-300",
  "400": "bg-red-400",
  "500": "bg-red-500",
  "600": "bg-red-600",
  "700": "bg-red-700",
  "800": "bg-red-800",
  "900": "bg-red-900",
  "950": "bg-red-950",
}

const GREEN_BG: Record<string, string> = {
  "50": "bg-green-50",
  "100": "bg-green-100",
  "200": "bg-green-200",
  "300": "bg-green-300",
  "400": "bg-green-400",
  "500": "bg-green-500",
  "600": "bg-green-600",
  "700": "bg-green-700",
  "800": "bg-green-800",
  "900": "bg-green-900",
  "950": "bg-green-950",
}

const AMBER_BG: Record<string, string> = {
  "50": "bg-amber-50",
  "100": "bg-amber-100",
  "200": "bg-amber-200",
  "300": "bg-amber-300",
  "400": "bg-amber-400",
  "500": "bg-amber-500",
  "600": "bg-amber-600",
  "700": "bg-amber-700",
  "800": "bg-amber-800",
  "900": "bg-amber-900",
  "950": "bg-amber-950",
}

const BLUE_BG: Record<string, string> = {
  "50": "bg-blue-50",
  "100": "bg-blue-100",
  "200": "bg-blue-200",
  "300": "bg-blue-300",
  "400": "bg-blue-400",
  "500": "bg-blue-500",
  "600": "bg-blue-600",
  "700": "bg-blue-700",
  "800": "bg-blue-800",
  "900": "bg-blue-900",
  "950": "bg-blue-950",
}

const STEPS = Object.keys(NEUTRAL_BG)

function Ramp({
  name,
  classes,
}: {
  name: string
  classes: Record<string, string>
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{name}</p>
      <div className="flex overflow-hidden rounded-lg border border-border">
        {STEPS.map((step) => (
          <div
            key={step}
            className={`flex h-16 flex-1 items-end justify-center pb-1 ${classes[step]}`}
          >
            <span
              className="text-xs font-medium"
              style={{
                color: Number(step) >= 500 ? "white" : "black",
                opacity: 0.7,
              }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SURFACE_BG: Record<string, string> = {
  background: "bg-background",
  foreground: "bg-foreground",
  card: "bg-card",
  popover: "bg-popover",
  border: "bg-border",
  input: "bg-input",
  ring: "bg-ring",
}

const ACTION_BG: Record<string, string> = {
  primary: "bg-primary",
  "primary-hover": "bg-primary-hover",
  "primary-subtle": "bg-primary-subtle",
  secondary: "bg-secondary",
  "secondary-hover": "bg-secondary-hover",
  muted: "bg-muted",
  accent: "bg-accent",
  "input-subtle": "bg-input-subtle",
}

const STATUS_BG: Record<string, string> = {
  destructive: "bg-destructive",
  "destructive-subtle": "bg-destructive-subtle",
  success: "bg-success",
  "success-subtle": "bg-success-subtle",
  warning: "bg-warning",
  "warning-subtle": "bg-warning-subtle",
  info: "bg-info",
  "info-subtle": "bg-info-subtle",
}

function Swatches({ classes }: { classes: Record<string, string> }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Object.keys(classes).map((name) => (
        <div key={name} className="flex flex-col gap-2">
          <div
            className={`h-16 rounded-lg border border-border ${classes[name]}`}
          />
          <code className="text-xs font-medium text-muted-foreground">
            --{name}
          </code>
        </div>
      ))}
    </div>
  )
}

function ColorFoundations() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <p className="text-xl font-semibold">Primitives</p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          fibo has no brand hue. The neutral ramp is achromatic and colour only
          ever carries meaning.
        </p>
        <Ramp name="neutral" classes={NEUTRAL_BG} />
        <Ramp name="red" classes={RED_BG} />
        <Ramp name="green" classes={GREEN_BG} />
        <Ramp name="amber" classes={AMBER_BG} />
        <Ramp name="blue" classes={BLUE_BG} />
      </section>
      <section className="flex flex-col gap-4">
        <p className="text-xl font-semibold">Surface and structure</p>
        <Swatches classes={SURFACE_BG} />
      </section>
      <section className="flex flex-col gap-4">
        <p className="text-xl font-semibold">Action</p>
        <Swatches classes={ACTION_BG} />
      </section>
      <section className="flex flex-col gap-4">
        <p className="text-xl font-semibold">Status</p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Each status role has a solid tone for text and icons, and a
          translucent <code>-subtle</code> tone for backgrounds.
        </p>
        <Swatches classes={STATUS_BG} />
      </section>
    </div>
  )
}

const meta: Meta<typeof ColorFoundations> = {
  title: "Foundations/Colors",
  component: ColorFoundations,
  parameters: {
    layout: "padded",
  },
}

export default meta
type Story = StoryObj<typeof ColorFoundations>

export const Palette: Story = {}
