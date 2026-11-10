import { cn } from "@workspace/ui/lib/utils"
import type { ReactNode } from "react"

export function DoDonts({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">{children}</div>
  )
}

export function DoDont({
  type,
  children,
  caption,
}: {
  type: "do" | "dont"
  children: ReactNode
  caption: string
}) {
  const isDo = type === "do"
  return (
    <figure className="flex flex-col gap-3">
      <div
        className={cn(
          "flex min-h-32 items-center justify-center gap-2 rounded-xl border bg-background p-6",
          isDo ? "border-border" : "border-destructive-ring"
        )}
      >
        {children}
      </div>
      <figcaption className="text-sm text-muted-foreground">
        <span
          className={cn(
            "font-medium",
            isDo ? "text-success" : "text-destructive"
          )}
        >
          {isDo ? "Do. " : "Don't. "}
        </span>
        {caption}
      </figcaption>
    </figure>
  )
}
