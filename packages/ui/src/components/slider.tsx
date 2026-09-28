"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@workspace/ui/lib/utils"

type SliderProps = SliderPrimitive.Root.Props & {
  /**
   * Names each thumb for assistive technology, in order. A range needs one
   * per thumb, such as "Minimum price" and "Maximum price".
   */
  thumbLabels?: string[]
}

/*
 * The thumb, not the root, is what receives focus and is announced, so an
 * `aria-label` on the slider is passed down to its thumbs.
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  "aria-label": ariaLabel,
  ...props
}: SliderProps) {
  const values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [value ?? defaultValue ?? min]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-input select-none data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {values.map((_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={index}
            aria-label={thumbLabels?.[index] ?? ariaLabel}
            className="block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring-subtle transition-shadow select-none hover:ring-[3px] has-[:focus-visible]:ring-[3px] data-disabled:pointer-events-none"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
export type { SliderProps }
