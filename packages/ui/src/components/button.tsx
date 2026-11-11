import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring-subtle active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive-ring [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border-border bg-input-subtle hover:bg-input-subtle-hover hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive-subtle text-destructive hover:bg-destructive-subtle-hover focus-visible:border-destructive focus-visible:ring-destructive-ring",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        icon: "size-9",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner in place of the start icon and blocks presses, keeping focus on the button. */
    loading?: boolean
    /** An icon component before the label, such as lucide's `PlusIcon`. */
    iconStart?: IconComponent
    /** An icon component after the label, such as lucide's `ArrowRightIcon`. */
    iconEnd?: IconComponent
    /** Stretches the button to the width of its container. */
    fillWidth?: boolean
  }

// The ring matches the icon it replaces: 12px on xs, 16px everywhere else.
const SPINNER_SIZE = { xs: "xs", "icon-xs": "xs" } as const

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  iconStart: IconStart,
  iconEnd: IconEnd,
  fillWidth = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const iconOnly = size?.startsWith("icon")
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={loading && !disabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        fillWidth && "w-full",
        loading && "cursor-progress"
      )}
      {...props}
    >
      {loading ? (
        <Progress
          type="circle"
          size={SPINNER_SIZE[size as keyof typeof SPINNER_SIZE] ?? "sm"}
          value={null}
          aria-hidden="true"
          data-icon={iconOnly ? undefined : "inline-start"}
        />
      ) : (
        IconStart && (
          <IconStart
            aria-hidden="true"
            data-icon={iconOnly ? undefined : "inline-start"}
          />
        )
      )}
      {loading && iconOnly ? null : children}
      {IconEnd && !(loading && iconOnly) && (
        <IconEnd aria-hidden="true" data-icon="inline-end" />
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants, type ButtonProps }
