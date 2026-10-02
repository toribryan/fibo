/*
 * The scale is Tailwind's own, so a style name here maps straight to a utility
 * class and to a text style of the same name in the Figma library. Weight is a
 * separate axis rather than being baked into the size.
 */
const SCALE = [
  { className: "text-xs", spec: "12 / 16" },
  { className: "text-sm", spec: "14 / 20" },
  { className: "text-base", spec: "16 / 24" },
  { className: "text-lg", spec: "18 / 28" },
  { className: "text-xl", spec: "20 / 28" },
  { className: "text-2xl", spec: "24 / 32" },
  { className: "text-3xl", spec: "30 / 36" },
  { className: "text-4xl", spec: "36 / 40" },
  { className: "text-5xl", spec: "48 / 48" },
] as const

const WEIGHTS = [
  { className: "font-normal", label: "Regular 400" },
  { className: "font-medium", label: "Medium 500" },
  { className: "font-semibold", label: "SemiBold 600" },
  { className: "font-bold", label: "Bold 700" },
] as const

function TypeSizes() {
  return (
    <div className="my-6 flex flex-col gap-6">
      {SCALE.map(({ className, spec }) => (
        <div
          key={className}
          className="flex items-baseline gap-6 border-b border-border pb-6"
        >
          <div className="flex w-32 shrink-0 flex-col gap-0.5">
            <code className="text-sm font-medium">{className}</code>
            <code className="font-mono text-xs text-muted-foreground">
              {spec}
            </code>
          </div>
          <p className={`${className} m-0 text-foreground`}>
            Design systems ship faster
          </p>
        </div>
      ))}
    </div>
  )
}

function TypeWeights() {
  return (
    <div className="my-6 flex flex-wrap gap-8">
      {WEIGHTS.map(({ className, label }) => (
        <p
          key={className}
          className={`m-0 text-lg text-foreground ${className}`}
        >
          {label}
        </p>
      ))}
    </div>
  )
}

function MonoSample() {
  return (
    <div className="my-6 flex flex-col gap-2">
      <p className="m-0 font-mono text-sm text-foreground">
        npx shadcn@latest add @fibo/button
      </p>
      <p className="m-0 font-mono text-xs text-muted-foreground">
        --primary: var(--color-neutral-900)
      </p>
    </div>
  )
}

export { MonoSample, TypeSizes, TypeWeights }
