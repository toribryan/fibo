"use client"

import * as React from "react"
import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cva, type VariantProps } from "class-variance-authority"

import { FieldSizeContext, type FieldSize } from "@workspace/ui/lib/field-size"
import { cn } from "@workspace/ui/lib/utils"

// Base UI shows an error for a failed validity check; this carries the
// `invalid` prop too, so an error set from outside, such as by a server, shows.
const FieldInvalidContext = React.createContext(false)

const fieldVariants = cva("group/field flex", {
  variants: {
    orientation: {
      vertical: "flex-col gap-2",
      // A switch or checkbox leads, with its label and description beside it.
      horizontal: "flex-row items-start gap-3",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

function FieldGroup({
  size,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** Sets the size of every control in the group; a field's or control's own size still wins. */
  size?: FieldSize
}) {
  const inherited = React.useContext(FieldSizeContext)
  return (
    <FieldSizeContext.Provider value={size ?? inherited}>
      <div
        data-slot="field-group"
        data-size={size}
        className={cn(
          "flex w-full flex-col gap-6 data-[size=sm]:gap-4",
          className
        )}
        {...props}
      />
    </FieldSizeContext.Provider>
  )
}

function Field({
  size,
  orientation = "vertical",
  invalid,
  className,
  ...props
}: FieldPrimitive.Root.Props &
  VariantProps<typeof fieldVariants> & {
    /** Sets the size of the control inside; its own size still wins. */
    size?: FieldSize
  }) {
  const inherited = React.useContext(FieldSizeContext)
  return (
    <FieldSizeContext.Provider value={size ?? inherited}>
      <FieldInvalidContext.Provider value={invalid ?? false}>
        <FieldPrimitive.Root
          data-slot="field"
          data-orientation={orientation}
          invalid={invalid}
          className={cn(fieldVariants({ orientation }), className)}
          {...props}
        />
      </FieldInvalidContext.Provider>
    </FieldSizeContext.Provider>
  )
}

/** One option in a radio or checkbox group, with its own label and description. */
function FieldItem({ className, ...props }: FieldPrimitive.Item.Props) {
  return (
    <FieldPrimitive.Item
      data-slot="field-item"
      className={cn("flex items-start gap-3", className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "group/field-label flex w-fit items-center gap-2 text-sm leading-none font-medium select-none group-data-disabled/field:cursor-not-allowed group-data-disabled/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn(
        "text-sm text-muted-foreground group-data-disabled/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldError({
  match,
  className,
  ...props
}: FieldPrimitive.Error.Props) {
  const invalid = React.useContext(FieldInvalidContext)
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      match={match ?? (invalid || undefined)}
      className={cn("text-sm text-destructive", className)}
      {...props}
    />
  )
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldItem,
  FieldLabel,
  fieldVariants,
}
