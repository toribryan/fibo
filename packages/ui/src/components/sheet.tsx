"use client"

import * as React from "react"
import { Drawer as SheetPrimitive } from "@base-ui/react/drawer"
import { XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SheetSide = "top" | "right" | "bottom" | "left"

const SWIPE_DIRECTION = {
  top: "up",
  right: "right",
  bottom: "down",
  left: "left",
} as const

/*
 * Base UI sets the swipe direction on the root, so the side lives here
 * rather than on the content as it does in shadcn's Sheet.
 */
function Sheet({
  side = "right",
  ...props
}: Omit<SheetPrimitive.Root.Props, "swipeDirection"> & {
  /** The edge it slides in from, and the way it's swiped away. */
  side?: SheetSide
}) {
  return (
    <SheetPrimitive.Root swipeDirection={SWIPE_DIRECTION[side]} {...props} />
  )
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  /** Shows a close button in the top corner. */
  showCloseButton?: boolean
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-backdrop opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none"
      />
      <SheetPrimitive.Viewport className="fixed inset-0 z-50 overflow-hidden">
        <SheetPrimitive.Popup
          data-slot="sheet-content"
          className={cn(
            "fixed z-50 flex flex-col gap-4 bg-background text-foreground shadow-lg transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*400ms)] data-swiping:select-none motion-reduce:transition-none",
            "data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:max-h-[85dvh] data-[swipe-direction=down]:[transform:translateY(var(--drawer-swipe-movement-y,0px))] data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=down]:border-t data-[swipe-direction=down]:border-border data-[swipe-direction=down]:pb-[env(safe-area-inset-bottom)] data-[swipe-direction=down]:data-ending-style:[transform:translateY(100%)] data-[swipe-direction=down]:data-starting-style:[transform:translateY(100%)]",
            "data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:max-h-[85dvh] data-[swipe-direction=up]:[transform:translateY(var(--drawer-swipe-movement-y,0px))] data-[swipe-direction=up]:rounded-b-xl data-[swipe-direction=up]:border-b data-[swipe-direction=up]:border-border data-[swipe-direction=up]:pt-[env(safe-area-inset-top)] data-[swipe-direction=up]:data-ending-style:[transform:translateY(-100%)] data-[swipe-direction=up]:data-starting-style:[transform:translateY(-100%)]",
            "data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:max-w-sm data-[swipe-direction=right]:[transform:translateX(var(--drawer-swipe-movement-x,0px))] data-[swipe-direction=right]:border-l data-[swipe-direction=right]:border-border data-[swipe-direction=right]:data-ending-style:[transform:translateX(100%)] data-[swipe-direction=right]:data-starting-style:[transform:translateX(100%)]",
            "data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:max-w-sm data-[swipe-direction=left]:[transform:translateX(var(--drawer-swipe-movement-x,0px))] data-[swipe-direction=left]:border-r data-[swipe-direction=left]:border-border data-[swipe-direction=left]:data-ending-style:[transform:translateX(-100%)] data-[swipe-direction=left]:data-starting-style:[transform:translateX(-100%)]",
            className
          )}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <SheetPrimitive.Close
              data-slot="sheet-close"
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3"
                  aria-label="Close"
                />
              }
            >
              <XIcon />
            </SheetPrimitive.Close>
          ) : null}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Viewport>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 p-4 pr-12", className)}
      {...props}
    />
  )
}

/*
 * Drawer.Content marks the part people read and select, so dragging across
 * text here selects it instead of swiping the sheet away.
 */
function SheetBody({ className, ...props }: SheetPrimitive.Content.Props) {
  return (
    <SheetPrimitive.Content
      data-slot="sheet-body"
      className={cn("flex-1 overflow-y-auto px-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
export type { SheetSide }
