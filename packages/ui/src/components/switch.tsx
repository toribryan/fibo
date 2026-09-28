"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@workspace/ui/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  /** The track's size: 32 by 18 pixels, or 24 by 14 for dense rows. */
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive-ring data-[size=default]:h-[18px] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 motion-reduce:transition-none data-checked:bg-primary data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* The page colour would vanish on a dark track, so in dark mode the
          resting thumb takes the text colour instead. */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full shadow-sm ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 motion-reduce:transition-none data-checked:translate-x-[calc(100%-2px)] data-checked:bg-primary-foreground data-unchecked:translate-x-0 data-unchecked:bg-background dark:data-unchecked:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
