import type { Meta, StoryObj } from "@storybook/react-vite";

const SCALE = [
  { name: "display", className: "text-display", sample: "Design system" },
  { name: "title-lg", className: "text-title-lg", sample: "Design system" },
  { name: "title", className: "text-title", sample: "Design system" },
  { name: "title-sm", className: "text-title-sm", sample: "Design system" },
  { name: "body-lg", className: "text-body-lg", sample: "Design system" },
  { name: "body", className: "text-body", sample: "Design system" },
  { name: "body-sm", className: "text-body-sm", sample: "Design system" },
  { name: "label", className: "text-label", sample: "Design system" },
  { name: "caption", className: "text-caption", sample: "Design system" },
] as const;

function TypeScale() {
  return (
    <div className="flex flex-col gap-6">
      {SCALE.map(({ name, className, sample }) => (
        <div key={name} className="flex items-baseline gap-6 border-b border-border pb-6">
          <code className="w-24 shrink-0 text-body-sm text-muted-foreground">
            {className}
          </code>
          <p className={className}>{sample}</p>
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof TypeScale> = {
  title: "Foundations/Typography",
  component: TypeScale,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof TypeScale>;

export const Scale: Story = {};
