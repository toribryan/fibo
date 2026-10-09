"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const progressVariants = cva("", {
  variants: {
    type: {
      bar: "flex w-full flex-wrap gap-3",
      // A ring in the current text color, so it takes the color of the
      // button or row it sits in.
      circle: "inline-flex shrink-0 align-middle",
    },
    size: {
      xs: "",
      sm: "",
      default: "",
      lg: "",
    },
  },
  compoundVariants: [
    { type: "circle", size: "xs", className: "size-3" },
    { type: "circle", size: "sm", className: "size-4" },
    { type: "circle", size: "default", className: "size-5" },
    { type: "circle", size: "lg", className: "size-6" },
  ],
  defaultVariants: {
    type: "bar",
    size: "default",
  },
})

// Radius 9 in a 24-unit box leaves room for the stroke at every size.
const RING = 2 * Math.PI * 9

/*
 * A bar's children sit above the track, so a ProgressLabel and a
 * ProgressValue placed inside line up on one row over it. A circle has no
 * room for them: name it with aria-label.
 */
function Progress({
  className,
  children,
  type = "bar",
  size = "default",
  value,
  min = 0,
  max = 100,
  ...props
}: ProgressPrimitive.Root.Props &
  VariantProps<typeof progressVariants> & {
    /** `bar` across its container, or `circle`, a ring that fits in a button or beside text. */
    type?: "bar" | "circle"
    /** The circle's size: 12, 16, 20 or 24 pixels. A bar ignores it. */
    size?: "xs" | "sm" | "default" | "lg"
  }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-type={type}
      value={value}
      min={min}
      max={max}
      className={cn(progressVariants({ type, size }), className)}
      {...props}
    >
      {type === "circle" ? (
        <ProgressCircle
          share={
            value === null || value === undefined
              ? null
              : (value - min) / (max - min || 1)
          }
        />
      ) : (
        <>
          {children}
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </>
      )}
    </ProgressPrimitive.Root>
  )
}

function ProgressCircle({ share }: { share: number | null }) {
  const length = share === null ? 0.25 : Math.min(1, Math.max(0, share))
  return (
    <svg
      data-slot="progress-circle"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "size-full",
        // With no value, a quarter arc turns. Under reduced motion it holds
        // still, and the ring still says something is under way.
        share === null && "animate-spin motion-reduce:animate-none"
      )}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        strokeWidth="3"
        className="stroke-current opacity-20"
      />
      <circle
        data-slot="progress-circle-indicator"
        cx="12"
        cy="12"
        r="9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${length * RING} ${RING}`}
        transform="rotate(-90 12 12)"
        className="stroke-current transition-[stroke-dasharray] duration-300 motion-reduce:transition-none"
      />
    </svg>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn(
        "relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-input",
        className
      )}
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        // With no value Base UI sets no width, so an indeterminate bar
        // would look empty. It gets a sweeping segment instead, or under
        // reduced motion a full bar in the muted text color.
        "h-full rounded-full bg-primary transition-all data-indeterminate:w-1/3 data-indeterminate:animate-progress-indeterminate motion-reduce:transition-none motion-reduce:data-indeterminate:w-full motion-reduce:data-indeterminate:animate-none motion-reduce:data-indeterminate:bg-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn(
        "ml-auto font-mono text-sm text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export {
  Progress,
  progressVariants,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
