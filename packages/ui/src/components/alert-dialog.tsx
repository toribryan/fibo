"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { type VariantProps } from "class-variance-authority"

import { Button } from "@workspace/ui/components/button"
import {
  dialogContentVariants,
  dialogOverlayClassName,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root {...props} />
}

function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

/*
 * No close button and no click-outside dismiss: the choice is the point, so
 * leaving takes Cancel or Escape. Small by default, since it holds a
 * sentence or two and two buttons.
 */
function AlertDialogContent({
  className,
  size = "sm",
  container,
  ...props
}: AlertDialogPrimitive.Popup.Props &
  VariantProps<typeof dialogContentVariants> & {
    /** The element the dialog portals into; the body by default. */
    container?: AlertDialogPrimitive.Portal.Props["container"]
  }) {
  return (
    <AlertDialogPrimitive.Portal container={container}>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-overlay"
        className={dialogOverlayClassName}
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(dialogContentVariants({ size }), className)}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

type AlertDialogButtonProps = Omit<AlertDialogPrimitive.Close.Props, "render"> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">

/** The choice the dialog asks for. Runs its `onClick`, then closes. */
function AlertDialogAction({
  variant = "default",
  size,
  ...props
}: AlertDialogButtonProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-action"
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

/** Leaves without doing anything. Comes first in the footer, so it takes focus when the dialog opens. */
function AlertDialogCancel({
  variant = "outline",
  size,
  ...props
}: AlertDialogButtonProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
}
