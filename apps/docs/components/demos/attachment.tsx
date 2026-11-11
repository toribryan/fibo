"use client"

import * as React from "react"

import { Attachment } from "@workspace/ui/components/attachment"

const noop = () => {}

export function AttachmentDefaultDemo() {
  return (
    <Attachment
      name="token-audit.pdf"
      size={482_000}
      onRemove={noop}
      onRetry={noop}
    />
  )
}

export function AttachmentStatusesDemo() {
  return (
    <div className="flex flex-col gap-3">
      {(["ready", "loading", "error"] as const).map((status) => (
        <div key={status} className="flex items-center gap-3">
          <Attachment
            type="file"
            status={status}
            name="token-audit.pdf"
            size={482_000}
            onRemove={noop}
            onRetry={noop}
          />
          <Attachment
            type="image"
            status={status}
            name="bonzo.webp"
            size={48_000}
            onRemove={noop}
            onRetry={noop}
          />
        </div>
      ))}
    </div>
  )
}

export function AttachmentFailedDemo() {
  return (
    <Attachment
      status="error"
      name="drift-report.csv"
      error="Too large"
      onRetry={noop}
      onRemove={noop}
    />
  )
}

export function AttachmentRawErrorDemo() {
  return (
    <Attachment
      status="error"
      name="drift-report.csv"
      error="The server returned 413 Payload Too Large"
      onRemove={noop}
    />
  )
}

type Upload = {
  id: number
  name: string
  size: number
  image: boolean
  status: "ready" | "loading" | "error"
}

const UPLOADS: Upload[] = [
  { id: 1, name: "bonzo.webp", size: 48_000, image: true, status: "ready" },
  {
    id: 2,
    name: "token-audit.pdf",
    size: 482_000,
    image: false,
    status: "loading",
  },
  {
    id: 3,
    name: "drift-report.csv",
    size: 38_000,
    image: false,
    status: "error",
  },
]

export function AttachmentListDemo() {
  const [files, setFiles] = React.useState(UPLOADS)
  const update = (id: number, status: Upload["status"]) =>
    setFiles((all) => all.map((f) => (f.id === id ? { ...f, status } : f)))
  return (
    <ul aria-label="Attachments" className="flex flex-wrap items-center gap-2">
      {files.map((file) => (
        <li key={file.id}>
          <Attachment
            type={file.image ? "image" : "file"}
            status={file.status}
            name={file.name}
            size={file.size}
            onRemove={() => setFiles((all) => all.filter((f) => f !== file))}
            onRetry={() => {
              update(file.id, "loading")
              setTimeout(() => update(file.id, "ready"), 800)
            }}
          />
        </li>
      ))}
    </ul>
  )
}
