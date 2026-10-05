import { useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * A fixed-size stage that scales down to fit a narrower column, so a
 * desktop panel or a phone screen keeps its real layout on a phone-width
 * docs page. The transform also makes it the containing block for fixed
 * children, so a drawer or popover portalled into it opens inside it.
 * Children get the stage element to use as a portal container.
 */
function ScaledStage({
  width,
  height,
  label,
  className,
  children,
}: {
  width: number
  height: number
  label: string
  className?: string
  children: (container: HTMLElement) => ReactNode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [stage, setStage] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const element = outer.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(Math.min(1, entry.contentRect.width / width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [width])

  return (
    <div
      ref={outer}
      className="my-6 w-full min-w-0"
      style={{ maxWidth: width, height: height * scale }}
    >
      <div
        ref={setStage}
        role="group"
        aria-label={label}
        className={cn(
          "relative origin-top-left overflow-hidden border border-border bg-background text-foreground",
          className
        )}
        style={{ width, height, transform: `scale(${scale})` }}
      >
        {stage ? children(stage) : null}
      </div>
    </div>
  )
}

/** A 390 by 720 phone screen, scaled to fit, with rounded corners. */
function PhoneFrame({
  label,
  children,
}: {
  label: string
  children: (container: HTMLElement) => ReactNode
}) {
  return (
    <ScaledStage
      width={390}
      height={720}
      label={label}
      className="rounded-[2rem]"
    >
      {children}
    </ScaledStage>
  )
}

export { PhoneFrame, ScaledStage }
