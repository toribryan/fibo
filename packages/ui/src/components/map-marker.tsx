"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cva } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

type MapMarkerProps = Omit<
  React.ComponentProps<"button">,
  "type" | "title" | "children"
> & {
  /** The place's name. It's the marker's accessible name, and the text of a label marker unless `text` is set. */
  label: string
  /** `dot` is a small point; `label` is a pill with text, such as a price. */
  type?: "dot" | "label"
  /** What a label marker shows, when it differs from `label`, such as "$120". */
  text?: React.ReactNode
  /** `sm` for dense maps. */
  size?: "sm" | "default"
  /** A photo at the top of the preview. */
  image?: { src: string; alt: string }
  /** The preview's heading. */
  title?: React.ReactNode
  /** A line or two under the title. */
  description?: React.ReactNode
  /** A small label above the title, such as a category or distance. */
  meta?: React.ReactNode
  /** Anything else for the preview, under the other fields: links, actions. */
  children?: React.ReactNode
  /** Whether the preview is open, when controlled. */
  open?: boolean
  /** Whether the preview starts open, when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the preview opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Which side of the marker the preview opens on. It flips when there's no room. */
  side?: "top" | "right" | "bottom" | "left"
  /** Classes for the preview. It's portalled to the body, out of reach of the marker's selectors. */
  previewClassName?: string
}

const mapMarkerVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center transition-[transform,background-color,color,box-shadow] duration-200 ease-out outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle motion-reduce:transition-none",
  {
    variants: {
      type: {
        // The dot is small to look at, so its press area reaches past it.
        dot: "rounded-full bg-primary shadow-sm ring-2 ring-background before:absolute before:-inset-2 before:rounded-full data-[popup-open]:scale-125 data-[popup-open]:shadow-[0_0_0_6px_var(--color-primary-subtle)]",
        label:
          "rounded-full border border-border bg-background font-semibold whitespace-nowrap text-foreground shadow-sm hover:bg-muted data-[popup-open]:border-primary data-[popup-open]:bg-primary data-[popup-open]:text-primary-foreground",
      },
      size: { sm: "", default: "" },
    },
    compoundVariants: [
      { type: "dot", size: "sm", className: "size-3" },
      { type: "dot", size: "default", className: "size-4" },
      { type: "label", size: "sm", className: "h-6 px-2 text-[11px]" },
      { type: "label", size: "default", className: "h-7 px-2.5 text-xs" },
    ],
    defaultVariants: { type: "dot", size: "default" },
  }
)

/**
 * A marker for a point on a map, with a preview that opens on click or tap.
 * It brings no map of its own: render it inside your map library's marker,
 * which places it and moves it as the map pans and zooms.
 */
function MapMarker({
  label,
  type = "dot",
  text,
  size = "default",
  image,
  title,
  description,
  meta,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  previewClassName,
  className,
  ...props
}: MapMarkerProps) {
  const marker = (
    <button
      type="button"
      data-slot="map-marker"
      data-type={type}
      data-size={size}
      aria-label={type === "label" && text === undefined ? undefined : label}
      className={cn(mapMarkerVariants({ type, size }), className)}
      {...props}
    >
      {type === "label" ? (text ?? label) : null}
    </button>
  )

  const hasPreview =
    image !== undefined ||
    title !== undefined ||
    description !== undefined ||
    meta !== undefined ||
    children !== undefined
  if (!hasPreview) return marker

  return (
    <PopoverPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => onOpenChange?.(next)}
    >
      <PopoverPrimitive.Trigger render={marker} />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side={side}
          sideOffset={type === "dot" ? 12 : 8}
          collisionPadding={8}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            data-slot="map-marker-preview"
            aria-label={label}
            className={cn(
              "w-64 max-w-[calc(100vw-1rem)] origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-hidden transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
              "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              previewClassName
            )}
          >
            {image ? (
              <img
                data-slot="map-marker-image"
                src={image.src}
                alt={image.alt}
                className="block aspect-[16/9] w-full bg-muted object-cover"
              />
            ) : null}
            <div className="flex flex-col gap-1 p-3">
              {meta !== undefined ? (
                <span
                  data-slot="map-marker-meta"
                  className="text-xs text-muted-foreground"
                >
                  {meta}
                </span>
              ) : null}
              {title !== undefined ? (
                <span
                  data-slot="map-marker-title"
                  className="text-sm font-medium text-foreground"
                >
                  {title}
                </span>
              ) : null}
              {description !== undefined ? (
                <p
                  data-slot="map-marker-description"
                  className="m-0 line-clamp-3 text-sm text-muted-foreground"
                >
                  {description}
                </p>
              ) : null}
              {children !== undefined ? (
                <div data-slot="map-marker-content" className="mt-2">
                  {children}
                </div>
              ) : null}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { MapMarker, mapMarkerVariants, type MapMarkerProps }
