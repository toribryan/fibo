"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

type StatusDotStatus = "present" | "away" | "offline"

const STATUS_LABELS: Record<StatusDotStatus, string> = {
  present: "Present",
  away: "Away",
  offline: "Offline",
}

// Each status keeps the semantic token it means everywhere else in fibo.
const MARK: Record<StatusDotStatus, string> = {
  present: "group-data-[variant=color]/status-dot:fill-success",
  away: "group-data-[variant=color]/status-dot:fill-warning",
  offline: "group-data-[variant=color]/status-dot:stroke-muted-foreground",
}

const statusDotVariants = cva(
  "group/status-dot relative inline-block shrink-0 align-middle",
  {
    variants: {
      variant: {
        color: "",
        mono: "",
      },
      size: {
        xs: "size-2",
        sm: "size-2.5",
        default: "size-3",
        lg: "size-4",
      },
    },
    defaultVariants: {
      variant: "color",
      size: "default",
    },
  }
)

/*
 * A part that draws its own accessible name, such as Sticker avatar with
 * role="img", can't hear text inside it. It provides this context, the dot
 * gives its label the host's id and says it is there, and the host adds the
 * id to its aria-labelledby only while a dot is mounted.
 */
type StatusDotHost = { labelId: string; register: () => () => void }

const StatusDotHostContext = React.createContext<StatusDotHost | null>(null)

/** For parts that compose a StatusDot into their own accessible name. */
function useStatusDotHost() {
  const labelId = React.useId()
  const [count, setCount] = React.useState(0)
  const host = React.useMemo<StatusDotHost>(
    () => ({
      labelId,
      register: () => {
        setCount((n) => n + 1)
        return () => setCount((n) => n - 1)
      },
    }),
    [labelId]
  )
  return {
    /** The dot's label id while a dot is mounted, for aria-labelledby. */
    labelledBy: count > 0 ? labelId : undefined,
    host,
  }
}

function StatusDotHostProvider({
  host,
  children,
}: {
  host: StatusDotHost
  children?: React.ReactNode
}) {
  return (
    <StatusDotHostContext.Provider value={host}>
      {children}
    </StatusDotHostContext.Provider>
  )
}

type StatusDotProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof statusDotVariants> & {
    /** Present, away or offline: a dot, a crescent or a ring, so status reads without colour. */
    status: StatusDotStatus
    /** The spoken status, for translation. Defaults to Present, Away or Offline; `null` makes the dot decorative when the text beside it already says it. */
    label?: string | null
  }

function StatusDot({
  status,
  label,
  variant = "color",
  size = "default",
  className,
  ...props
}: StatusDotProps) {
  const host = React.useContext(StatusDotHostContext)
  const text = label === null ? null : (label ?? STATUS_LABELS[status])

  React.useLayoutEffect(() => {
    if (host && text) return host.register()
  }, [host, text])

  return (
    <span
      data-slot="status-dot"
      data-status={status}
      data-variant={variant}
      data-size={size}
      className={cn(statusDotVariants({ variant, size }), className)}
      {...props}
    >
      {/* The disc is the page colour, so the dot keeps a clear edge on a
          photo or a sticker, and fibo's status tokens keep their contrast,
          which they are tuned for against the page in each theme. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="block size-full overflow-visible"
      >
        <circle cx="10" cy="10" r="10" className="fill-background" />
        {status === "offline" ? (
          <circle
            cx="10"
            cy="10"
            r="4.75"
            strokeWidth="3.5"
            className={cn("fill-none stroke-foreground", MARK.offline)}
          />
        ) : (
          <circle
            cx="10"
            cy="10"
            r="6.5"
            className={cn("fill-foreground", MARK[status])}
          />
        )}
        {status === "away" ? (
          <circle cx="6.5" cy="6.5" r="5" className="fill-background" />
        ) : null}
      </svg>
      {text ? (
        <span id={host?.labelId} className="sr-only">
          {text}
        </span>
      ) : null}
    </span>
  )
}

export {
  StatusDot,
  StatusDotHostProvider,
  statusDotVariants,
  useStatusDotHost,
  type StatusDotProps,
  type StatusDotStatus,
}
