"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"

import { useFieldSize, type FieldSize } from "@workspace/ui/lib/field-size"
import { cn } from "@workspace/ui/lib/utils"

const inputGroupVariants = cva(
  "group/input-group relative flex w-full min-w-0 items-center transition-colors has-[[data-slot=input-group-control]:disabled]:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-sm border border-input bg-input-subtle has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring-subtle has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-[3px] has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive-ring",
        // For a search at the top of a menu or dialog, where the surface
        // around it is the field.
        ghost: "",
      },
      size: {
        sm: "h-8",
        default: "h-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function InputGroup({
  variant = "default",
  size: sizeProp,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** `ghost` drops the border, fill and ring, for a search at the top of a menu or dialog. */
  variant?: "default" | "ghost"
  /** Height of the group. Defaults to the size of the Field or FieldGroup around it. */
  size?: FieldSize
}) {
  const size = useFieldSize(sizeProp)
  return (
    <div
      data-slot="input-group"
      data-variant={variant}
      data-size={size}
      role="group"
      className={cn(inputGroupVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-full shrink-0 cursor-text items-center gap-2 text-sm text-muted-foreground select-none [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 has-[>button]:pl-1",
        "inline-end": "order-last pr-3 has-[>button]:pr-1",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

/** An icon, text or button beside the input. Pressing anywhere but a button in it focuses the input. */
function InputGroupAddon({
  align = "inline-start",
  className,
  onMouseDown,
  ...props
}: React.ComponentProps<"div"> & {
  /** Which side of the input the addon sits on. */
  align?: "inline-start" | "inline-end"
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        if ((event.target as Element).closest("button, a, input")) return
        const control = event.currentTarget
          .closest("[data-slot=input-group]")
          ?.querySelector<HTMLElement>("[data-slot=input-group-control]")
        if (!control) return
        // Keeps the caret where it was instead of letting the press blur it.
        event.preventDefault()
        control.focus()
      }}
      {...props}
    />
  )
}

/**
 * The input, borderless so the group draws the field. It is Base UI's
 * Input, so a Field around the group labels and describes it; `render`
 * swaps in another input, such as an Autocomplete's, and keeps the look.
 */
function InputGroupInput({
  className,
  render,
  ref,
  ...props
}: useRender.ComponentProps<"input">) {
  return useRender({
    render: render ?? <InputPrimitive />,
    ref,
    props: mergeProps<"input">(
      {
        "data-slot": "input-group-control",
        className: cn(
          "h-full w-full min-w-0 flex-1 bg-transparent px-3 text-base outline-hidden group-has-[[data-align=inline-end]]/input-group:pr-2 group-has-[[data-align=inline-start]]/input-group:pl-2 placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm",
          className
        ),
      } as React.ComponentProps<"input">,
      props
    ),
  })
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  inputGroupAddonVariants,
  inputGroupVariants,
}
