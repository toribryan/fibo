"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cva } from "class-variance-authority"
import { MapPinIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type MapMarkerProps = Omit<
  React.ComponentProps<"button">,
  "type" | "title" | "children"
> & {
  /** The place's name. It's the marker's accessible name, and the text of a label marker unless `text` is set. */
  label: string
  /** `dot` is a small point, `icon` a round marker with an icon, `label` a pill with text such as a price. */
  type?: "dot" | "icon" | "label"
  /** What the colour says: `default` for plain places, or a status such as `success` for open or `destructive` for closed. */
  variant?: "default" | "success" | "warning" | "info" | "destructive"
  /** The icon for an `icon` marker, or a leading icon in a `label` marker. An `icon` marker falls back to a map pin. */
  icon?: React.ReactNode
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

type Variant = NonNullable<MapMarkerProps["variant"]>

// Filled markers, dots and icons, take the colour as their fill and grow a
// halo of it when open.
const FILL: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground data-[popup-open]:shadow-[0_0_0_6px_var(--color-primary-subtle)]",
  success:
    "bg-success text-success-foreground data-[popup-open]:shadow-[0_0_0_6px_var(--color-success-subtle)]",
  warning:
    "bg-warning text-warning-foreground data-[popup-open]:shadow-[0_0_0_6px_var(--color-warning-subtle)]",
  info: "bg-info text-info-foreground data-[popup-open]:shadow-[0_0_0_6px_var(--color-info-subtle)]",
  destructive:
    "bg-destructive text-destructive-foreground data-[popup-open]:shadow-[0_0_0_6px_var(--color-destructive-subtle)]",
}

// A label stays light on the map with its text in the colour, and fills in
// when open, so the selected one stands out among the rest.
const OUTLINE: Record<Variant, string> = {
  default:
    "text-foreground data-[popup-open]:border-primary data-[popup-open]:bg-primary data-[popup-open]:text-primary-foreground",
  success:
    "text-success data-[popup-open]:border-success data-[popup-open]:bg-success data-[popup-open]:text-success-foreground",
  warning:
    "text-warning data-[popup-open]:border-warning data-[popup-open]:bg-warning data-[popup-open]:text-warning-foreground",
  info: "text-info data-[popup-open]:border-info data-[popup-open]:bg-info data-[popup-open]:text-info-foreground",
  destructive:
    "text-destructive data-[popup-open]:border-destructive data-[popup-open]:bg-destructive data-[popup-open]:text-destructive-foreground",
}

const VARIANTS = Object.keys(FILL) as Variant[]

const mapMarkerVariants = cva(
  // The spring curve overshoots a little, so a marker settles into its open
  // size rather than stopping dead. Hover lifts a marker part of the way to
  // its open size, and stays off the open one so its selected look holds.
  "relative inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center transition-[scale,translate,background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none select-none hover:not-data-[popup-open]:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring-subtle motion-reduce:transition-none",
  {
    variants: {
      type: {
        // The dot is small to look at, so its press area reaches past it.
        dot: "rounded-full shadow-sm ring-2 ring-background before:absolute before:-inset-2 before:rounded-full hover:not-data-[popup-open]:scale-110 data-[popup-open]:scale-125",
        icon: "rounded-full shadow-sm ring-2 ring-background hover:not-data-[popup-open]:scale-105 data-[popup-open]:scale-110 [&_svg]:shrink-0",
        label:
          "gap-1 rounded-full border border-border bg-background font-semibold whitespace-nowrap shadow-sm hover:not-data-[popup-open]:scale-[1.03] hover:not-data-[popup-open]:bg-muted data-[popup-open]:scale-105 [&_svg]:shrink-0",
      },
      variant: {
        default: "",
        success: "",
        warning: "",
        info: "",
        destructive: "",
      },
      size: { sm: "", default: "" },
    },
    compoundVariants: [
      { type: "dot", size: "sm", className: "size-3" },
      { type: "dot", size: "default", className: "size-4" },
      { type: "icon", size: "sm", className: "size-6 [&_svg]:size-3" },
      { type: "icon", size: "default", className: "size-7 [&_svg]:size-3.5" },
      {
        type: "label",
        size: "sm",
        className: "h-6 px-2 text-[11px] [&_svg]:size-3",
      },
      {
        type: "label",
        size: "default",
        className: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
      },
      ...VARIANTS.flatMap((variant) => [
        { type: "dot" as const, variant, className: FILL[variant] },
        { type: "icon" as const, variant, className: FILL[variant] },
        { type: "label" as const, variant, className: OUTLINE[variant] },
      ]),
    ],
    defaultVariants: { type: "dot", variant: "default", size: "default" },
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
  variant = "default",
  icon,
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
  const shown =
    type === "icon" ? (
      (icon ?? <MapPinIcon />)
    ) : type === "label" ? (
      <>
        {icon}
        {text ?? label}
      </>
    ) : null

  const marker = (
    <button
      type="button"
      data-slot="map-marker"
      data-type={type}
      data-variant={variant}
      data-size={size}
      aria-label={type === "label" && text === undefined ? undefined : label}
      className={cn(mapMarkerVariants({ type, variant, size }), className)}
      {...props}
    >
      {shown}
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
              "group/preview w-64 max-w-[calc(100vw-1rem)] origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-hidden",
              // Grows out of the marker with a little overshoot, and leaves
              // faster than it came, so closing never holds anything up.
              "transition-[opacity,scale,translate] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-ending-style:duration-150 data-ending-style:ease-in",
              "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-[0.85] data-starting-style:opacity-0",
              "data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2",
              "motion-reduce:transition-opacity motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:translate-0 motion-reduce:data-starting-style:scale-100",
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
            {/* The words follow the card a beat behind, so it opens like a
                card turning over rather than a block appearing. */}
            <div className="flex flex-col gap-1 p-3 transition-[opacity,translate] delay-75 duration-300 ease-out group-data-starting-style/preview:translate-y-1 group-data-starting-style/preview:opacity-0 motion-reduce:transition-none">
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
