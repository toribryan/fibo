import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@workspace/ui/lib/utils"

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** Height of the field. `sm` matches a small Select or Button in dense forms. */
  size?: "sm" | "default"
}

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        "h-9 w-full min-w-0 rounded-sm border border-input bg-input-subtle px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive-ring data-[size=sm]:h-8 data-[size=sm]:file:h-6 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input, type InputProps }
