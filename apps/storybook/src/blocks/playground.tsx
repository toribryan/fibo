import { Canvas, Controls, type Of } from "@storybook/addon-docs/blocks"

/**
 * The first exhibit on a component page: the live story with its controls
 * in the same frame, so changing a prop and seeing the result happen in one
 * place. The Props section further down stays a read-only reference.
 */
function Playground({ of }: { of: Of }) {
  return (
    <div className="fibo-playground my-6 overflow-hidden rounded-xl border border-border">
      <Canvas of={of} />
      <div className="border-t border-border">
        <p className="m-0 px-5 pt-4 pb-1 text-xs font-medium text-muted-foreground">
          Controls
        </p>
        <Controls of={of} />
      </div>
    </div>
  )
}

export { Playground }
