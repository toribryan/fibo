import type { Meta, StoryObj } from "@storybook/react-vite";

/*
 * Tailwind only generates CSS for utility classes it can find as literal
 * strings during a scan — dynamically built values (e.g. a template string
 * interpolated into `style`) are invisible to it. These maps spell every
 * class out so the scanner keeps the whole ramp, not just the shades
 * referenced elsewhere by name.
 */
const BRAND_BG: Record<string, string> = {
  "50": "bg-brand-50",
  "100": "bg-brand-100",
  "200": "bg-brand-200",
  "300": "bg-brand-300",
  "400": "bg-brand-400",
  "500": "bg-brand-500",
  "600": "bg-brand-600",
  "700": "bg-brand-700",
  "800": "bg-brand-800",
  "900": "bg-brand-900",
  "950": "bg-brand-950",
};

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
};

const STEPS = Object.keys(BRAND_BG);

function Ramp({ name, classes }: { name: string; classes: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-muted-foreground capitalize">{name}</p>
      <div className="flex overflow-hidden rounded-lg border border-border">
        {STEPS.map((step) => (
          <div
            key={step}
            className={`flex h-16 flex-1 items-end justify-center pb-1 ${classes[step]}`}
          >
            <span
              className="text-caption"
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
  );
}

const SEMANTIC_BG: Record<string, string> = {
  background: "bg-background",
  foreground: "bg-foreground",
  card: "bg-card",
  popover: "bg-popover",
  primary: "bg-primary",
  secondary: "bg-secondary",
  muted: "bg-muted",
  accent: "bg-accent",
  destructive: "bg-destructive",
  border: "bg-border",
};

const SEMANTIC_TOKENS = Object.keys(SEMANTIC_BG);

function SemanticSwatch({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 rounded-lg border border-border ${SEMANTIC_BG[name]}`} />
      <code className="text-caption text-muted-foreground">--{name}</code>
    </div>
  );
}

function ColorFoundations() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-6">
        <p className="text-title-sm">Primitives</p>
        <Ramp name="brand" classes={BRAND_BG} />
        <Ramp name="neutral" classes={NEUTRAL_BG} />
      </section>
      <section className="flex flex-col gap-4">
        <p className="text-title-sm">Semantic tokens (light)</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SEMANTIC_TOKENS.map((name) => (
            <SemanticSwatch key={name} name={name} />
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta<typeof ColorFoundations> = {
  title: "Foundations/Colors",
  component: ColorFoundations,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ColorFoundations>;

export const Palette: Story = {};
