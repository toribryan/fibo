import * as React from "react"
import { cva } from "class-variance-authority"
import {
  CircleAlertIcon,
  ImageIcon,
  LoaderCircleIcon,
  PaperclipIcon,
  Redo2Icon,
  XIcon,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const attachmentVariants = cva("relative shrink-0", {
  variants: {
    type: {
      file: "flex h-7 max-w-56 items-center gap-1.5 rounded-full border bg-background pr-1 pl-2.5 text-xs text-foreground",
      image: "size-14 overflow-hidden rounded-lg border bg-muted",
    },
    status: {
      ready: "border-border",
      loading: "border-border",
      error: "border-destructive",
    },
  },
  defaultVariants: { type: "file", status: "ready" },
})

const iconButton =
  "flex shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle disabled:pointer-events-none"

type AttachmentProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** `file` is a one-line chip with the name and size; `image` is a thumbnail. */
  type?: "file" | "image"
  /** Where the upload is. Whoever owns the upload sets it. */
  status?: "ready" | "loading" | "error"
  /** The file name. Also the image's alt text. */
  name: string
  /** Size in bytes, shown on a ready file chip. */
  size?: number
  /** The preview for `type="image"`, such as an object URL of the picked file. */
  src?: string
  /** What went wrong, in a few words. Shown on a file chip, read out on an image. */
  error?: string
  /** Called by the remove button. Without it there is no remove button. */
  onRemove?: () => void
  /** Called to try a failed upload again. Without it there is no retry. */
  onRetry?: () => void
  /** Turns the buttons off, as when the surrounding form is disabled. */
  disabled?: boolean
}

/*
 * One file someone has added. It shows an upload but never runs one, so the
 * same part works for a chat draft, a form field or a sent message.
 */
function Attachment({
  type = "file",
  status = "ready",
  name,
  size,
  src,
  error = "Upload failed",
  onRemove,
  onRetry,
  disabled,
  className,
  ...props
}: AttachmentProps) {
  const remove = onRemove ? (
    <button
      type="button"
      data-slot="attachment-remove"
      aria-label={`Remove ${name}`}
      disabled={disabled}
      onClick={onRemove}
      className={cn(
        iconButton,
        type === "file"
          ? "size-5 text-muted-foreground hover:bg-muted hover:text-foreground"
          : "absolute top-[3px] right-[3px] z-10 size-[18px] border border-border bg-background text-foreground hover:bg-muted"
      )}
    >
      <XIcon className={type === "file" ? "size-3" : "size-2.5"} />
    </button>
  ) : null

  if (type === "image") {
    return (
      <div
        data-slot="attachment"
        data-type="image"
        data-status={status}
        aria-busy={status === "loading" || undefined}
        title={status === "error" ? `${name}: ${error}` : name}
        className={cn(attachmentVariants({ type, status }), className)}
        {...props}
      >
        {src ? (
          <img src={src} alt={name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon role="img" aria-label={name} className="size-5" />
          </div>
        )}
        {status === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-popover-overlay text-foreground">
            <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
            <span className="sr-only">Uploading</span>
          </div>
        ) : null}
        {status === "error" ? (
          // The whole tile is the retry target: a third button would not fit 56px.
          <button
            type="button"
            data-slot="attachment-retry"
            aria-label={`Retry ${name}: ${error}`}
            disabled={disabled || !onRetry}
            onClick={onRetry}
            className="absolute inset-0 flex items-center justify-center bg-popover-overlay text-destructive outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:ring-inset disabled:cursor-default"
          >
            <CircleAlertIcon className="size-4" />
          </button>
        ) : null}
        {remove}
      </div>
    )
  }

  const Icon =
    status === "loading"
      ? LoaderCircleIcon
      : status === "error"
        ? CircleAlertIcon
        : PaperclipIcon
  return (
    <div
      data-slot="attachment"
      data-type="file"
      data-status={status}
      aria-busy={status === "loading" || undefined}
      className={cn(attachmentVariants({ type, status }), className)}
      {...props}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-3 shrink-0",
          status === "error" ? "text-destructive" : "text-muted-foreground",
          status === "loading" && "animate-spin motion-reduce:animate-none"
        )}
      />
      <span className="truncate">{name}</span>
      {status === "loading" ? (
        <span className="shrink-0 text-muted-foreground">Uploading</span>
      ) : status === "error" ? (
        <span className="shrink-0 text-destructive">{error}</span>
      ) : size !== undefined ? (
        <span className="shrink-0 text-muted-foreground">
          {formatBytes(size)}
        </span>
      ) : null}
      {status === "error" && onRetry ? (
        <button
          type="button"
          data-slot="attachment-retry"
          aria-label={`Retry ${name}`}
          disabled={disabled}
          onClick={onRetry}
          className={cn(
            iconButton,
            "size-5 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Redo2Icon className="size-3" />
        </button>
      ) : null}
      {remove}
    </div>
  )
}

/** Sizes in the units people read them in: 512 B, 12 KB, 3.4 MB. */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return `${size < 10 ? size.toFixed(1).replace(/\.0$/, "") : Math.round(size)} ${units[unit]}`
}

export { Attachment, attachmentVariants, formatBytes, type AttachmentProps }
